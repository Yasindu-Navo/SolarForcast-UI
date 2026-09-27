# -*- coding: utf-8 -*-
"""LSTM-based short-term electricity demand forecasting pipeline."""

from __future__ import annotations

import argparse
import json
import hashlib
import platform
import shutil
import sys
import traceback
from contextlib import redirect_stdout, redirect_stderr
from uuid import uuid4
from datetime import datetime, timezone
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd


PIPELINE_VERSION = "2026-09-24-demand-lstm-v9-direct-features"
TIME_COL = "Datetime"
TARGET_COL = "Demand_MW"


@dataclass(frozen=True)
class DemandConfig:
    architecture: str = "direct"
    seed: int = 42
    window_size: int = 168
    train_fraction: float = 0.70
    val_fraction: float = 0.15
    test_fraction: float = 0.15
    lstm_units_1: int = 48
    lstm_units_2: int = 24
    dense_units: int = 24
    dropout: float = 0.30
    l2_regularization: float = 3e-5
    learning_rate: float = 2e-4
    batch_size: int = 32
    epochs: int = 100
    patience: int = 12
    early_stop_min_delta: float = 5e-4
    huber_delta: float = 0.08
    min_valid_demand_mw: float = 500.0
    peak_sample_weight: float = 0.40
    valley_sample_weight: float = 0.25
    ramp_sample_weight: float = 0.45
    hour_correction_strength: float = 0.60
    max_hour_correction_mw: float = 140.0
    amplitude_correction_strength: float = 0.55
    value_bin_correction_strength: float = 0.45
    max_value_bin_correction_mw: float = 125.0
    calibration_bias_penalty: float = 0.15


@dataclass
class MinMaxScalerState:
    columns: list[str]
    min_: list[float]
    max_: list[float]

    @classmethod
    def fit(cls, frame: pd.DataFrame, columns: Iterable[str]) -> "MinMaxScalerState":
        cols = list(columns)
        mins = frame[cols].min(axis=0).astype(float).to_numpy()
        maxs = frame[cols].max(axis=0).astype(float).to_numpy()
        return cls(columns=cols, min_=mins.tolist(), max_=maxs.tolist())

    def transform(self, frame: pd.DataFrame) -> np.ndarray:
        values = frame[self.columns].astype(float).to_numpy()
        mins = np.asarray(self.min_, dtype=np.float64)
        maxs = np.asarray(self.max_, dtype=np.float64)
        denom = np.where(np.isclose(maxs - mins, 0.0), 1.0, maxs - mins)
        return ((values - mins) / denom).astype(np.float32)

    def inverse_transform_array(self, values: np.ndarray) -> np.ndarray:
        mins = np.asarray(self.min_, dtype=np.float64)
        maxs = np.asarray(self.max_, dtype=np.float64)
        denom = np.where(np.isclose(maxs - mins, 0.0), 1.0, maxs - mins)
        return values * denom + mins


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    if TIME_COL not in df.columns or TARGET_COL not in df.columns:
        raise ValueError(f"Dataset must contain {TIME_COL!r} and {TARGET_COL!r} columns.")

    df[TIME_COL] = pd.to_datetime(df[TIME_COL])
    df = df.sort_values(TIME_COL).reset_index(drop=True)
    return df


def validate_dataset(df: pd.DataFrame) -> dict:
    intervals = df[TIME_COL].diff().dropna()
    return {
        "rows": int(len(df)),
        "columns": list(df.columns),
        "start": str(df[TIME_COL].min()),
        "end": str(df[TIME_COL].max()),
        "duplicate_timestamps": int(df.duplicated(TIME_COL).sum()),
        "interval_counts": {str(k): int(v) for k, v in intervals.value_counts().sort_index().items()},
        "missing_values": {k: int(v) for k, v in df.isna().sum().items()},
        "target_summary": df[TARGET_COL].describe().to_dict(),
    }


def clean_demand_data(df: pd.DataFrame, min_valid_demand_mw: float) -> tuple[pd.DataFrame, dict]:
    cleaned = df.copy()
    low_mask = cleaned[TARGET_COL] < min_valid_demand_mw
    low_rows = cleaned.loc[low_mask, [TIME_COL, TARGET_COL]].copy()
    low_rows[TIME_COL] = low_rows[TIME_COL].astype(str)

    if low_mask.any():
        cleaned.loc[low_mask, TARGET_COL] = np.nan
        cleaned[TARGET_COL] = cleaned[TARGET_COL].interpolate(method="linear").bfill().ffill()

    report = {
        "min_valid_demand_mw": float(min_valid_demand_mw),
        "low_demand_rows_cleaned": int(low_mask.sum()),
        "lowest_original_rows": low_rows.sort_values(TARGET_COL).head(10).to_dict(orient="records"),
    }
    return cleaned, report


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    enriched = df.copy()
    enriched["Hour"] = enriched[TIME_COL].dt.hour
    enriched["DayOfWeek"] = enriched[TIME_COL].dt.dayofweek
    enriched["Weekend"] = (enriched["DayOfWeek"] >= 5).astype(int)
    enriched["Month"] = enriched[TIME_COL].dt.month
    enriched["Quarter"] = enriched[TIME_COL].dt.quarter

    enriched["hour_sin"] = np.sin(2 * np.pi * enriched["Hour"] / 24.0)
    enriched["hour_cos"] = np.cos(2 * np.pi * enriched["Hour"] / 24.0)
    enriched["dow_sin"] = np.sin(2 * np.pi * enriched["DayOfWeek"] / 7.0)
    enriched["dow_cos"] = np.cos(2 * np.pi * enriched["DayOfWeek"] / 7.0)
    enriched["month_sin"] = np.sin(2 * np.pi * enriched["Month"] / 12.0)
    enriched["month_cos"] = np.cos(2 * np.pi * enriched["Month"] / 12.0)
    enriched["quarter_sin"] = np.sin(2 * np.pi * enriched["Quarter"] / 4.0)
    enriched["quarter_cos"] = np.cos(2 * np.pi * enriched["Quarter"] / 4.0)
    return enriched


def add_demand_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    enriched = df.copy()
    enriched["demand_lag_1h"] = enriched[TARGET_COL].shift(1)
    enriched["demand_lag_2h"] = enriched[TARGET_COL].shift(2)
    enriched["demand_lag_24h"] = enriched[TARGET_COL].shift(24)
    enriched["demand_lag_25h"] = enriched[TARGET_COL].shift(25)
    enriched["demand_lag_168h"] = enriched[TARGET_COL].shift(168)
    enriched["demand_roll_24h_mean"] = enriched[TARGET_COL].shift(1).rolling(24).mean()
    enriched["demand_roll_24h_std"] = enriched[TARGET_COL].shift(1).rolling(24).std()
    enriched["demand_roll_168h_mean"] = enriched[TARGET_COL].shift(1).rolling(168).mean()
    enriched["demand_roll_168h_std"] = enriched[TARGET_COL].shift(1).rolling(168).std()
    enriched["demand_ramp_1h"] = enriched["demand_lag_1h"] - enriched["demand_lag_2h"]
    enriched["demand_ramp_24h"] = enriched["demand_lag_1h"] - enriched["demand_lag_25h"]

    known_target_time_cols = [
        "Weekend",
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos",
        "month_sin",
        "month_cos",
        "quarter_sin",
        "quarter_cos",
    ]
    for col in known_target_time_cols:
        enriched[f"target_{col}"] = enriched[col].shift(-1)

    return enriched.dropna().reset_index(drop=True)


def feature_columns() -> list[str]:
    return [
        TARGET_COL,
        "demand_lag_1h",
        "demand_lag_2h",
        "demand_lag_24h",
        "demand_lag_25h",
        "demand_lag_168h",
        "demand_roll_24h_mean",
        "demand_roll_24h_std",
        "demand_roll_168h_mean",
        "demand_roll_168h_std",
        "demand_ramp_1h",
        "demand_ramp_24h",
        "Weekend",
        "hour_sin",
        "hour_cos",
        "dow_sin",
        "dow_cos",
        "month_sin",
        "month_cos",
        "quarter_sin",
        "quarter_cos",
        "target_Weekend",
        "target_hour_sin",
        "target_hour_cos",
        "target_dow_sin",
        "target_dow_cos",
        "target_month_sin",
        "target_month_cos",
        "target_quarter_sin",
        "target_quarter_cos",
    ]


def split_indices(row_count: int, config: DemandConfig) -> tuple[int, int]:
    train_end = int(row_count * config.train_fraction)
    val_end = int(row_count * (config.train_fraction + config.val_fraction))
    if train_end <= config.window_size or val_end <= train_end or val_end >= row_count:
        raise ValueError("Invalid split fractions or window size for the available data.")
    return train_end, val_end


def build_sequences(
    frame: pd.DataFrame,
    features: list[str],
    x_scaler: MinMaxScalerState,
    y_scaler: MinMaxScalerState,
    window_size: int,
) -> tuple[np.ndarray, np.ndarray, pd.DataFrame]:
    x_scaled = x_scaler.transform(frame)
    y_scaled = y_scaler.transform(frame)

    x, y, metadata = [], [], []
    for target_idx in range(window_size, len(frame)):
        x.append(x_scaled[target_idx - window_size : target_idx])
        y.append(y_scaled[target_idx, 0])
        metadata.append(
            {
                TIME_COL: frame.loc[target_idx, TIME_COL],
                "source_row": target_idx,
            }
        )

    return (
        np.asarray(x, dtype=np.float32),
        np.asarray(y, dtype=np.float32).reshape(-1, 1),
        pd.DataFrame(metadata),
    )


def prepare_training_data(df: pd.DataFrame, config: DemandConfig) -> dict:
    cleaned, cleaning_report = clean_demand_data(df, config.min_valid_demand_mw)
    enriched = add_demand_lag_features(add_calendar_features(cleaned))
    features = feature_columns()
    train_end, val_end = split_indices(len(enriched), config)

    train_rows = enriched.iloc[:train_end]
    x_scaler = MinMaxScalerState.fit(train_rows, features)
    y_scaler = MinMaxScalerState.fit(train_rows, [TARGET_COL])

    x, y, metadata = build_sequences(
        frame=enriched,
        features=features,
        x_scaler=x_scaler,
        y_scaler=y_scaler,
        window_size=config.window_size,
    )

    train_mask = metadata["source_row"] < train_end
    val_mask = (metadata["source_row"] >= train_end) & (metadata["source_row"] < val_end)
    test_mask = metadata["source_row"] >= val_end

    return {
        "prepared_frame": enriched,
        "feature_columns": features,
        "x_scaler": x_scaler,
        "y_scaler": y_scaler,
        "x_train": x[train_mask.to_numpy()],
        "y_train": y[train_mask.to_numpy()],
        "x_val": x[val_mask.to_numpy()],
        "y_val": y[val_mask.to_numpy()],
        "x_test": x[test_mask.to_numpy()],
        "y_test": y[test_mask.to_numpy()],
        "val_metadata": metadata[val_mask].reset_index(drop=True),
        "test_metadata": metadata[test_mask].reset_index(drop=True),
        "train_end": train_end,
        "val_end": val_end,
        "cleaning_report": cleaning_report,
    }


def build_model(input_shape: tuple[int, int], config: DemandConfig):
    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError("TensorFlow is required for training this LSTM model.") from exc

    regularizer = tf.keras.regularizers.l2(config.l2_regularization)
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=input_shape),
            tf.keras.layers.LSTM(
                config.lstm_units_1,
                return_sequences=True,
                kernel_regularizer=regularizer,
                recurrent_regularizer=regularizer,
            ),
            tf.keras.layers.Dropout(config.dropout),
            tf.keras.layers.LSTM(
                config.lstm_units_2,
                kernel_regularizer=regularizer,
                recurrent_regularizer=regularizer,
            ),
            tf.keras.layers.Dropout(config.dropout),
            tf.keras.layers.Dense(config.dense_units, activation="relu", kernel_regularizer=regularizer),
            tf.keras.layers.Dense(1),
        ]
    )
    if config.architecture == "direct":
        # Keep exact recent features available without recurrent compression.
        inputs = tf.keras.Input(shape=input_shape, name="hourly_history")
        sequence = inputs
        for layer in model.layers[:-2]:
            sequence = layer(sequence)
        latest = tf.keras.layers.Cropping1D((input_shape[0] - 1, 0))(inputs)
        latest = tf.keras.layers.Flatten(name="latest_features")(latest)
        latest = tf.keras.layers.Dense(16, activation="relu", kernel_regularizer=regularizer)(latest)
        combined = tf.keras.layers.Concatenate()([sequence, latest])
        combined = tf.keras.layers.Dense(config.dense_units, activation="relu",
                                         kernel_regularizer=regularizer)(combined)
        model = tf.keras.Model(inputs, tf.keras.layers.Dense(1)(combined))
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.learning_rate, clipnorm=1.0),
        loss=tf.keras.losses.Huber(delta=config.huber_delta),
        metrics=["mae"],
    )
    return model


def evaluate_predictions(actual: np.ndarray, predicted: np.ndarray) -> dict:
    errors = predicted - actual
    mae = float(np.mean(np.abs(errors)))
    mse = float(np.mean(np.square(errors)))
    rmse = float(np.sqrt(mse))
    mape = float(np.mean(np.abs((actual - predicted) / np.maximum(np.abs(actual), 1e-6))) * 100)
    bias = float(np.mean(errors))
    return {"mae_mw": mae, "mse": mse, "rmse_mw": rmse, "mape_pct": mape, "bias_mw": bias}


def make_sample_weights(y_scaled: np.ndarray, y_scaler: MinMaxScalerState, config: DemandConfig) -> np.ndarray:
    y_actual = y_scaler.inverse_transform_array(y_scaled).reshape(-1)
    min_y = float(np.min(y_actual))
    max_y = float(np.max(y_actual))
    denom = max(max_y - min_y, 1.0)
    normalized = np.clip((y_actual - min_y) / denom, 0.0, 1.0)
    ramp = np.abs(np.diff(y_actual, prepend=y_actual[0])) / denom

    weights = np.ones_like(normalized, dtype=np.float32)
    weights += config.peak_sample_weight * np.square(normalized)
    weights += config.valley_sample_weight * np.square(1.0 - normalized)
    weights += config.ramp_sample_weight * np.clip(ramp * 8.0, 0.0, 1.0)
    return weights.astype(np.float32)


def fit_amplitude_calibration(actual: np.ndarray, predicted: np.ndarray) -> dict:
    if len(predicted) < 2 or float(np.std(predicted)) < 1e-6:
        raw_slope = 1.0
        raw_intercept = 0.0
    else:
        raw_slope, raw_intercept = np.polyfit(predicted.reshape(-1), actual.reshape(-1), deg=1)

    return {
        "raw_slope": float(raw_slope),
        "raw_intercept_mw": float(raw_intercept),
    }


def fit_hourly_residuals(metadata: pd.DataFrame, residuals: np.ndarray) -> dict:
    validation_errors = pd.DataFrame(
        {
            "hour": metadata[TIME_COL].dt.hour.to_numpy(),
            "residual_mw": residuals,
        }
    )
    grouped = validation_errors.groupby("hour")["residual_mw"].agg(["count", "mean"])

    hourly_summary = {}
    for hour in range(24):
        if hour in grouped.index:
            count = int(grouped.loc[hour, "count"])
            residual_mean = float(grouped.loc[hour, "mean"])
        else:
            count = 0
            residual_mean = 0.0
        hourly_summary[str(hour)] = {"count": count, "mean_residual_mw": residual_mean}

    return hourly_summary


def apply_amplitude(predicted: np.ndarray, amplitude: dict, strength: float) -> tuple[np.ndarray, np.ndarray]:
    applied_slope = 1.0 + strength * (amplitude["raw_slope"] - 1.0)
    applied_intercept = strength * amplitude["raw_intercept_mw"]
    amplitude_prediction = applied_slope * predicted.reshape(-1) + applied_intercept
    return amplitude_prediction, amplitude_prediction - predicted.reshape(-1)


def make_hour_correction(
    timestamps: pd.Series,
    hourly_summary: dict,
    strength: float,
    max_correction_mw: float,
) -> np.ndarray:
    hourly_correction = {
        hour: float(np.clip(strength * stats["mean_residual_mw"], -max_correction_mw, max_correction_mw))
        for hour, stats in hourly_summary.items()
    }
    return timestamps.dt.hour.astype(str).map(hourly_correction).astype(float).to_numpy()


def fit_value_bin_correction(
    actual: np.ndarray,
    predicted: np.ndarray,
    config: DemandConfig,
) -> dict:
    calibration_frame = pd.DataFrame({"predicted": predicted.reshape(-1), "residual_mw": actual - predicted})
    quantiles = np.linspace(0.0, 1.0, 6)
    edges = np.quantile(calibration_frame["predicted"], quantiles)
    edges = np.unique(edges)
    if len(edges) < 3:
        return {
            "strength": 0.0,
            "max_correction_mw": float(config.max_value_bin_correction_mw),
            "bins": [],
        }

    bins = []
    for start, end in zip(edges[:-1], edges[1:]):
        if np.isclose(start, end):
            continue
        if end == edges[-1]:
            mask = (calibration_frame["predicted"] >= start) & (calibration_frame["predicted"] <= end)
        else:
            mask = (calibration_frame["predicted"] >= start) & (calibration_frame["predicted"] < end)
        residual_mean = float(calibration_frame.loc[mask, "residual_mw"].mean()) if mask.any() else 0.0
        correction = config.value_bin_correction_strength * residual_mean
        correction = float(np.clip(correction, -config.max_value_bin_correction_mw, config.max_value_bin_correction_mw))
        bins.append(
            {
                "min_predicted_mw": float(start),
                "max_predicted_mw": float(end),
                "count": int(mask.sum()),
                "mean_residual_mw": residual_mean,
                "correction_mw": correction,
            }
        )

    return {
        "strength": float(config.value_bin_correction_strength),
        "max_correction_mw": float(config.max_value_bin_correction_mw),
        "bins": bins,
    }


def apply_value_bin_correction(predicted: np.ndarray, value_bins: dict) -> np.ndarray:
    corrections = np.zeros_like(predicted.reshape(-1), dtype=np.float64)
    for bin_info in value_bins.get("bins", []):
        start = bin_info["min_predicted_mw"]
        end = bin_info["max_predicted_mw"]
        if end == value_bins["bins"][-1]["max_predicted_mw"]:
            mask = (predicted >= start) & (predicted <= end)
        else:
            mask = (predicted >= start) & (predicted < end)
        corrections[mask] = bin_info["correction_mw"]
    return corrections


def validation_score(actual: np.ndarray, predicted: np.ndarray, config: DemandConfig) -> float:
    errors = predicted.reshape(-1) - actual.reshape(-1)
    return float(np.mean(np.abs(errors)) + config.calibration_bias_penalty * abs(np.mean(errors)))


def fit_validation_calibration(
    metadata: pd.DataFrame,
    actual: np.ndarray,
    predicted: np.ndarray,
    config: DemandConfig,
) -> dict:
    amplitude = fit_amplitude_calibration(actual, predicted)
    hourly_summary = fit_hourly_residuals(metadata, actual - predicted)

    best = {
        "score": validation_score(actual, predicted, config),
        "amplitude_strength": 0.0,
        "hour_strength": 0.0,
        "prediction": predicted.reshape(-1),
    }
    amplitude_grid = np.linspace(0.0, config.amplitude_correction_strength, 6)
    hour_grid = np.linspace(0.0, config.hour_correction_strength, 7)

    for amplitude_strength in amplitude_grid:
        amplitude_prediction, _ = apply_amplitude(predicted, amplitude, float(amplitude_strength))
        for hour_strength in hour_grid:
            hour_correction = make_hour_correction(
                metadata[TIME_COL],
                hourly_summary,
                float(hour_strength),
                config.max_hour_correction_mw,
            )
            candidate = np.maximum(amplitude_prediction + hour_correction, 0.0)
            score = validation_score(actual, candidate, config)
            if score < best["score"]:
                best = {
                    "score": score,
                    "amplitude_strength": float(amplitude_strength),
                    "hour_strength": float(hour_strength),
                    "prediction": candidate,
                }

    value_bins = fit_value_bin_correction(actual, best["prediction"], config)
    value_correction = apply_value_bin_correction(best["prediction"], value_bins)
    value_candidate = np.maximum(best["prediction"] + value_correction, 0.0)
    value_score = validation_score(actual, value_candidate, config)
    use_value_bins = bool(value_bins["bins"]) and value_score < best["score"]

    applied_slope = 1.0 + best["amplitude_strength"] * (amplitude["raw_slope"] - 1.0)
    applied_intercept = best["amplitude_strength"] * amplitude["raw_intercept_mw"]
    hourly_correction = {
        str(hour): float(
            np.clip(
                best["hour_strength"] * stats["mean_residual_mw"],
                -config.max_hour_correction_mw,
                config.max_hour_correction_mw,
            )
        )
        for hour, stats in hourly_summary.items()
    }

    return {
        "selection_metric": "validation_mae_plus_bias_penalty",
        "bias_penalty": float(config.calibration_bias_penalty),
        "raw_validation_score": validation_score(actual, predicted, config),
        "selected_validation_score": float(value_score if use_value_bins else best["score"]),
        "amplitude": {
            "max_strength": float(config.amplitude_correction_strength),
            "selected_strength": float(best["amplitude_strength"]),
            "raw_slope": amplitude["raw_slope"],
            "raw_intercept_mw": amplitude["raw_intercept_mw"],
            "applied_slope": float(applied_slope),
            "applied_intercept_mw": float(applied_intercept),
        },
        "hourly_bias": {
            "max_strength": float(config.hour_correction_strength),
            "selected_strength": float(best["hour_strength"]),
            "max_correction_mw": float(config.max_hour_correction_mw),
            "hourly_correction_mw": hourly_correction,
            "validation_residual_summary": hourly_summary,
        },
        "value_bin": {
            "enabled": use_value_bins,
            **value_bins,
        },
    }


def apply_validation_calibration(
    timestamps: pd.Series,
    predicted: np.ndarray,
    calibration: dict,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    amplitude = calibration["amplitude"]
    amplitude_prediction = (
        amplitude["applied_slope"] * predicted.reshape(-1) + amplitude["applied_intercept_mw"]
    )
    amplitude_correction = amplitude_prediction - predicted.reshape(-1)

    hourly_correction_map = calibration["hourly_bias"]["hourly_correction_mw"]
    hour_correction = timestamps.dt.hour.astype(str).map(hourly_correction_map).astype(float).to_numpy()
    value_correction = apply_value_bin_correction(amplitude_prediction + hour_correction, calibration["value_bin"])
    corrected = np.maximum(amplitude_prediction + hour_correction + value_correction, 0.0)
    return corrected, amplitude_correction, hour_correction, value_correction


def save_training_artifacts(
    output_dir: Path,
    prepared: dict,
    config: DemandConfig,
    metrics: dict,
    calibration: dict,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    preprocessing = {
        "pipeline_version": PIPELINE_VERSION,
        "config": asdict(config),
        "feature_columns": prepared["feature_columns"],
        "x_scaler": asdict(prepared["x_scaler"]),
        "y_scaler": asdict(prepared["y_scaler"]),
        "train_end": int(prepared["train_end"]),
        "val_end": int(prepared["val_end"]),
        "cleaning_report": prepared["cleaning_report"],
        "validation_calibration": calibration,
        "metrics": metrics,
    }
    (output_dir / "preprocessing.json").write_text(json.dumps(preprocessing, indent=2), encoding="utf-8")


def import_plotting():
    try:
        import matplotlib

        matplotlib.use("Agg")
        import matplotlib.dates as mdates
        import matplotlib.pyplot as plt
    except ImportError as exc:
        raise RuntimeError("Matplotlib is required for graph generation.") from exc
    return plt, mdates


def save_figure(fig, path: Path) -> None:
    fig.tight_layout()
    fig.savefig(path, dpi=160, bbox_inches="tight")
    fig.clf()


def normalized_forecast_accuracy(mae_values: pd.Series) -> pd.Series:
    return (1.0 - mae_values.clip(lower=0.0, upper=1.0)) * 100.0


def stopping_summary(history: pd.DataFrame, config: DemandConfig, target_range: float) -> dict:
    best, selected, wait = float("inf"), 0, 0
    for epoch, value in enumerate(history["val_mae"].astype(float), start=1):
        if not np.isfinite(value):
            raise ValueError("Non-finite validation MAE; do not report this as convergence.")
        if value < best - config.early_stop_min_delta:
            best, selected, wait = value, epoch, 0
        else:
            wait += 1
    stopped = wait >= config.patience
    reason = (
        f"Early stopping: {wait} consecutive epochs without a validation MAE improvement "
        f"greater than {config.early_stop_min_delta * target_range:.3f} MW."
        if stopped else "Configured epoch limit reached; convergence is not established by this alone."
    )
    return {"selected_epoch": selected, "ended_epoch": len(history),
            "monitor": "val_mae", "selected_validation_mae_mw": best * target_range,
            "patience": config.patience, "min_delta_scaled": config.early_stop_min_delta,
            "min_delta_mw": config.early_stop_min_delta * target_range,
            "early_stopped": stopped, "reason": reason}


def validation_benchmarks(prepared: dict) -> dict:
    frame = prepared["prepared_frame"]
    rows = prepared["val_metadata"]["source_row"].to_numpy(dtype=int)
    actual = frame[TARGET_COL].to_numpy()[rows]
    return {name: evaluate_predictions(actual, frame[TARGET_COL].to_numpy()[rows - lag])
            for name, lag in [("Last hour", 1), ("Same hour yesterday", 24),
                              ("Same hour last week", 168)]}


def create_graphs(predictions: pd.DataFrame, history: pd.DataFrame, output_dir: Path,
                  stopping: dict | None = None, benchmarks: dict | None = None,
                  target_range: float = 1.0) -> list[str]:
    plt, mdates = import_plotting()
    graphs_dir = output_dir / "graphs"
    graphs_dir.mkdir(parents=True, exist_ok=True)
    outputs: list[Path] = []

    fig, ax = plt.subplots(figsize=(10, 5))
    epochs = np.arange(1, len(history) + 1)
    ax.plot(epochs, history["loss"], label="Training Loss", linewidth=2)
    ax.plot(epochs, history["val_loss"], label="Validation Loss", linewidth=2)
    ax.set_title("Training vs Validation Loss")
    ax.set_xlabel("Epoch")
    ax.set_ylabel("Weighted scaled Huber loss + L2 penalty")
    if stopping:
        ax.axvline(stopping["selected_epoch"], color="green", linestyle=":",
                   label=f"Selected checkpoint: epoch {stopping['selected_epoch']}")
        ax.axvline(stopping["ended_epoch"], color="black", linestyle="--",
                   label=f"Training ended: epoch {stopping['ended_epoch']}")
        fig.text(0.5, -0.06,
                 f"Selected validation MAE: {stopping['selected_validation_mae_mw']:.2f} MW. "
                 "Checkpoint selected by MAE, not loss.\n" + stopping["reason"],
                 ha="center", fontsize=9)
    ax.grid(True, alpha=0.25)
    ax.legend()
    outputs.append(graphs_dir / "01_training_validation_loss.png")
    save_figure(fig, outputs[-1])

    if benchmarks:
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(epochs, history["val_mae"] * target_range, label="LSTM validation MAE", linewidth=2)
        for name, values in benchmarks.items():
            ax.axhline(values["mae_mw"], linestyle="--",
                       label=f"{name}: {values['mae_mw']:.2f} MW")
        if stopping:
            ax.axvline(stopping["selected_epoch"], color="green", linestyle=":",
                       label=f"Selected epoch {stopping['selected_epoch']}")
            ax.axvline(stopping["ended_epoch"], color="black", linestyle="--",
                       label=f"Ended epoch {stopping['ended_epoch']}")
        ax.set(title="Validation MAE vs Demand Benchmarks", xlabel="Epoch", ylabel="MAE (MW)")
        ax.grid(True, alpha=0.25)
        ax.legend()
        outputs.append(graphs_dir / "08_validation_mae_benchmarks.png")
        save_figure(fig, outputs[-1])

    fig, ax = plt.subplots(figsize=(12, 5))
    ax.plot(predictions[TIME_COL], predictions["Actual_Demand_MW"], label="Actual Load", linewidth=1.8)
    if "Raw_Predicted_Demand_MW" in predictions.columns:
        ax.plot(
            predictions[TIME_COL],
            predictions["Raw_Predicted_Demand_MW"],
            label="Raw Predicted Load",
            linewidth=1.0,
            alpha=0.45,
            color="gray",
        )
    ax.plot(predictions[TIME_COL], predictions["Predicted_Demand_MW"], label="Corrected Predicted Load", linewidth=1.8)
    ax.set_title("Actual vs Predicted Electricity Demand")
    ax.set_xlabel("Datetime")
    ax.set_ylabel("Electricity Demand (MW)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
    ax.grid(True, alpha=0.25)
    ax.legend()
    outputs.append(graphs_dir / "02_actual_vs_predicted_test.png")
    save_figure(fig, outputs[-1])

    first_week = predictions.head(24 * 7)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(first_week[TIME_COL], first_week["Actual_Demand_MW"], label="Actual Load", linewidth=1.8)
    if "Raw_Predicted_Demand_MW" in first_week.columns:
        ax.plot(
            first_week[TIME_COL],
            first_week["Raw_Predicted_Demand_MW"],
            label="Raw Predicted Load",
            linewidth=1.0,
            alpha=0.45,
            color="gray",
        )
    ax.plot(first_week[TIME_COL], first_week["Predicted_Demand_MW"], label="Corrected Predicted Load", linewidth=1.8)
    ax.set_title("First Week Hourly Load Prediction")
    ax.set_xlabel("Hour")
    ax.set_ylabel("Electricity Demand (MW)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
    ax.grid(True, alpha=0.25)
    ax.legend()
    outputs.append(graphs_dir / "03_first_week_hourly_prediction.png")
    save_figure(fig, outputs[-1])

    daily = (
        predictions.set_index(TIME_COL)[
            [col for col in ["Actual_Demand_MW", "Raw_Predicted_Demand_MW", "Predicted_Demand_MW"] if col in predictions]
        ]
        .resample("D")
        .mean()
        .dropna()
        .reset_index()
    )
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.plot(daily[TIME_COL], daily["Actual_Demand_MW"], marker="o", label="Actual Daily Average", linewidth=2)
    if "Raw_Predicted_Demand_MW" in daily.columns:
        ax.plot(
            daily[TIME_COL],
            daily["Raw_Predicted_Demand_MW"],
            marker="o",
            label="Raw Predicted Daily Average",
            linewidth=1.2,
            alpha=0.55,
            color="gray",
        )
    ax.plot(daily[TIME_COL], daily["Predicted_Demand_MW"], marker="o", label="Corrected Daily Average", linewidth=2)
    ax.set_title("Daily Average Load Forecast")
    ax.set_xlabel("Date")
    ax.set_ylabel("Average Electricity Demand (MW)")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
    ax.grid(True, alpha=0.25)
    ax.legend()
    outputs.append(graphs_dir / "04_daily_average_load_forecast.png")
    save_figure(fig, outputs[-1])

    limit = float(max(predictions["Actual_Demand_MW"].max(), predictions["Predicted_Demand_MW"].max()))
    fig, ax = plt.subplots(figsize=(7, 7))
    ax.scatter(predictions["Actual_Demand_MW"], predictions["Predicted_Demand_MW"], s=8, alpha=0.3)
    ax.plot([0, limit], [0, limit], linestyle="--", linewidth=2, label="Perfect prediction")
    ax.set_title("Actual vs Predicted Hourly Demand")
    ax.set_xlabel("Actual Demand (MW)")
    ax.set_ylabel("Predicted Demand (MW)")
    ax.set_xlim(0, limit)
    ax.set_ylim(0, limit)
    ax.grid(True, alpha=0.25)
    ax.legend()
    outputs.append(graphs_dir / "05_actual_vs_predicted_scatter.png")
    save_figure(fig, outputs[-1])

    hourly_errors = predictions.assign(
        hour=predictions[TIME_COL].dt.hour,
        abs_error=(predictions["Predicted_Demand_MW"] - predictions["Actual_Demand_MW"]).abs(),
    )
    hour_summary = hourly_errors.groupby("hour")["abs_error"].mean().reset_index()
    fig, ax = plt.subplots(figsize=(10, 5))
    if "Raw_Abs_Error_MW" in predictions.columns:
        raw_hourly_errors = predictions.assign(
            hour=predictions[TIME_COL].dt.hour,
            raw_abs_error=predictions["Raw_Abs_Error_MW"],
        )
        raw_hour_summary = raw_hourly_errors.groupby("hour")["raw_abs_error"].mean().reindex(range(24), fill_value=0)
        corrected_hour_summary = hour_summary.set_index("hour")["abs_error"].reindex(range(24), fill_value=0)
        hours = np.arange(24)
        ax.bar(hours - 0.2, raw_hour_summary.to_numpy(), width=0.4, label="Raw MAE")
        ax.bar(hours + 0.2, corrected_hour_summary.to_numpy(), width=0.4, label="Corrected MAE")
        ax.legend()
    else:
        ax.bar(hour_summary["hour"], hour_summary["abs_error"])
    ax.set_title("Demand Forecast MAE by Hour of Day")
    ax.set_xlabel("Hour of Day")
    ax.set_ylabel("MAE (MW)")
    ax.set_xticks(range(24))
    ax.grid(axis="y", alpha=0.25)
    outputs.append(graphs_dir / "06_error_by_hour_of_day.png")
    save_figure(fig, outputs[-1])

    if {"mae", "val_mae"}.issubset(history.columns):
        fig, ax = plt.subplots(figsize=(10, 5))
        ax.plot(
            epochs,
            normalized_forecast_accuracy(history["mae"]),
            label="Training normalized MAE score",
            linewidth=2,
        )
        ax.plot(
            epochs,
            normalized_forecast_accuracy(history["val_mae"]),
            label="Validation normalized MAE score",
            linewidth=2,
            linestyle="--",
        )
        ax.set_title("Normalized MAE Score (Not Classification Accuracy)")
        ax.set_xlabel("Epoch")
        ax.set_ylabel("100 x (1 - clipped scaled MAE)")
        ax.grid(True, alpha=0.25)
        ax.legend()
        outputs.append(graphs_dir / "07_training_validation_forecast_accuracy.png")
        save_figure(fig, outputs[-1])

    return [str(path) for path in outputs]


def train(csv_path: Path, output_dir: Path, config: DemandConfig) -> dict:
    if config.epochs < 1 or config.patience < 1 or config.early_stop_min_delta < 0:
        raise ValueError("Epochs and patience must be positive; min delta must be nonnegative.")
    if (output_dir / "best_model.keras").exists():
        raise ValueError("Choose a new output directory to preserve the previous run.")
    df = load_dataset(csv_path)
    prepared = prepare_training_data(df, config)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        import tensorflow as tf
    except ImportError as exc:
        raise RuntimeError("TensorFlow is required for training this LSTM model.") from exc

    tf.keras.utils.set_random_seed(config.seed)
    model = build_model(prepared["x_train"].shape[1:], config)
    (output_dir / "model_architecture.json").write_text(model.to_json(), encoding="utf-8")
    summary_lines = []
    model.summary(print_fn=lambda line, **kwargs: summary_lines.append(line))
    (output_dir / "model_summary.txt").write_text("\n".join(summary_lines), encoding="utf-8")
    train_weights = make_sample_weights(prepared["y_train"], prepared["y_scaler"], config)
    val_weights = make_sample_weights(prepared["y_val"], prepared["y_scaler"], config)
    class SelectedCheckpoint(tf.keras.callbacks.Callback):
        def __init__(self):
            super().__init__()
            self.best = float("inf")
            self.wait = 0

        def on_epoch_end(self, epoch, logs=None):
            value = float(logs["val_mae"])
            if not np.isfinite(value):
                raise ValueError("Non-finite validation MAE; training failed.")
            if value < self.best - config.early_stop_min_delta:
                self.best, self.wait = value, 0
                self.model.save(output_dir / "best_model.keras")
            else:
                self.wait += 1
                if self.wait >= config.patience:
                    self.model.stop_training = True
            (output_dir / "epoch_progress.json").write_text(json.dumps({
                "completed_epoch": epoch + 1, "best_scaled_validation_mae": self.best,
                "epochs_without_improvement": self.wait,
                "metrics": {key: float(value) for key, value in logs.items()},
            }, indent=2), encoding="utf-8")

    callbacks = [
        SelectedCheckpoint(),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_mae",
            factor=0.5,
            patience=4,
            min_lr=1e-6,
            mode="min",
            verbose=1,
        ),
        tf.keras.callbacks.CSVLogger(str(output_dir / "training_log.csv")),
    ]

    history = model.fit(
        prepared["x_train"],
        prepared["y_train"],
        sample_weight=train_weights,
        validation_data=(prepared["x_val"], prepared["y_val"], val_weights),
        epochs=config.epochs,
        batch_size=config.batch_size,
        callbacks=callbacks,
        shuffle=False,
        verbose=1,
    )

    history_frame = pd.DataFrame(history.history)
    target_range = float(prepared["y_scaler"].max_[0] - prepared["y_scaler"].min_[0])
    if np.isclose(target_range, 0.0):
        target_range = 1.0
    stopping = stopping_summary(history_frame, config, target_range)
    benchmarks = validation_benchmarks(prepared)
    history_frame.insert(0, "epoch", np.arange(1, len(history_frame) + 1))
    history_frame.to_csv(output_dir / "training_history.csv", index=False)
    (output_dir / "training_stop_summary.json").write_text(
        json.dumps(stopping, indent=2), encoding="utf-8")
    pd.DataFrame.from_dict(benchmarks, orient="index").rename_axis("benchmark").to_csv(
        output_dir / "validation_benchmarks.csv")
    print(f"Selected epoch {stopping['selected_epoch']}; ended epoch {stopping['ended_epoch']}.")
    print(stopping["reason"])
    model = tf.keras.models.load_model(output_dir / "best_model.keras")

    val_pred_scaled = model.predict(prepared["x_val"], batch_size=config.batch_size)
    val_predicted = prepared["y_scaler"].inverse_transform_array(val_pred_scaled).reshape(-1)
    val_actual = prepared["y_scaler"].inverse_transform_array(prepared["y_val"]).reshape(-1)
    calibration = fit_validation_calibration(prepared["val_metadata"], val_actual, val_predicted, config)
    validation_predictions = prepared["val_metadata"].copy()
    validation_predictions["Actual_Demand_MW"] = val_actual
    validation_predictions["Raw_Predicted_Demand_MW"] = val_predicted
    validation_predictions.to_csv(output_dir / "validation_predictions.csv", index=False)

    pred_scaled = model.predict(prepared["x_test"], batch_size=config.batch_size)
    raw_predicted = prepared["y_scaler"].inverse_transform_array(pred_scaled).reshape(-1)
    actual = prepared["y_scaler"].inverse_transform_array(prepared["y_test"]).reshape(-1)
    corrected_predicted, amplitude_correction, hour_correction, value_bin_correction = apply_validation_calibration(
        prepared["test_metadata"][TIME_COL],
        raw_predicted,
        calibration,
    )
    predictions = prepared["test_metadata"].copy()
    predictions["Actual_Demand_MW"] = actual
    predictions["Raw_Predicted_Demand_MW"] = raw_predicted
    predictions["Amplitude_Correction_MW"] = amplitude_correction
    predictions["Hour_Correction_MW"] = hour_correction
    predictions["Value_Bin_Correction_MW"] = value_bin_correction
    predictions["Predicted_Demand_MW"] = corrected_predicted
    predictions["Error_MW"] = predictions["Predicted_Demand_MW"] - predictions["Actual_Demand_MW"]
    predictions["Abs_Error_MW"] = predictions["Error_MW"].abs()
    predictions["Raw_Error_MW"] = predictions["Raw_Predicted_Demand_MW"] - predictions["Actual_Demand_MW"]
    predictions["Raw_Abs_Error_MW"] = predictions["Raw_Error_MW"].abs()

    raw_metrics = evaluate_predictions(actual, raw_predicted)
    corrected_metrics = evaluate_predictions(actual, corrected_predicted)
    metrics = {
        "raw": raw_metrics,
        "corrected": corrected_metrics,
    }

    model.save(output_dir / "final_model.keras")
    predictions.to_csv(output_dir / "test_demand_predictions.csv", index=False)
    history_frame.to_csv(output_dir / "training_history.csv", index=False)
    save_training_artifacts(output_dir, prepared, config, metrics, calibration)
    try:
        graphs = create_graphs(predictions, history_frame, output_dir, stopping, benchmarks, target_range)
    except RuntimeError as exc:
        graphs = [f"Graphs skipped: {exc}"]

    report = {
        "pipeline_version": PIPELINE_VERSION,
        "random_seed": config.seed,
        "training_stop": stopping,
        "validation_benchmarks": benchmarks,
        "metrics": metrics,
        "range": {
            "test_start": str(predictions[TIME_COL].min()),
            "test_end": str(predictions[TIME_COL].max()),
            "test_rows": int(len(predictions)),
        },
        "cleaning_report": prepared["cleaning_report"],
        "validation_calibration": calibration,
        "graphs": graphs,
    }
    (output_dir / "evaluation_summary.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def profile(csv_path: Path, config: DemandConfig) -> dict:
    df = load_dataset(csv_path)
    report = validate_dataset(df)
    cleaned, cleaning_report = clean_demand_data(df, config.min_valid_demand_mw)
    enriched = add_demand_lag_features(add_calendar_features(cleaned))
    train_end, val_end = split_indices(len(enriched), config)
    report["cleaning_report"] = cleaning_report
    report["rows_after_feature_engineering"] = int(len(enriched))
    report["dropped_rows_for_lags"] = int(len(df) - len(enriched))
    report["feature_columns"] = feature_columns()
    report["train_range"] = [str(enriched.loc[0, TIME_COL]), str(enriched.loc[train_end - 1, TIME_COL])]
    report["validation_range"] = [str(enriched.loc[train_end, TIME_COL]), str(enriched.loc[val_end - 1, TIME_COL])]
    report["test_range"] = [str(enriched.loc[val_end, TIME_COL]), str(enriched.loc[len(enriched) - 1, TIME_COL])]
    return report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Hourly electricity demand LSTM pipeline")
    parser.add_argument("--data", type=Path, default=Path("2025.csv"))
    parser.add_argument("--output-dir", type=Path, default=Path("demand_artifacts"))
    parser.add_argument("--mode", choices=["profile", "train"], default="train")
    parser.add_argument("--architecture", choices=["direct", "lstm"], default=DemandConfig.architecture)
    parser.add_argument("--seed", type=int, default=DemandConfig.seed)
    parser.add_argument("--epochs", type=int, default=DemandConfig.epochs)
    parser.add_argument("--batch-size", type=int, default=DemandConfig.batch_size)
    parser.add_argument("--window-size", type=int, default=DemandConfig.window_size)
    parser.add_argument("--learning-rate", type=float, default=DemandConfig.learning_rate)
    parser.add_argument("--dropout", type=float, default=DemandConfig.dropout)
    parser.add_argument("--l2-regularization", type=float, default=DemandConfig.l2_regularization)
    parser.add_argument("--patience", type=int, default=DemandConfig.patience)
    parser.add_argument("--early-stop-min-delta", type=float, default=DemandConfig.early_stop_min_delta)
    parser.add_argument("--huber-delta", type=float, default=DemandConfig.huber_delta)
    parser.add_argument("--min-valid-demand-mw", type=float, default=DemandConfig.min_valid_demand_mw)
    parser.add_argument("--peak-sample-weight", type=float, default=DemandConfig.peak_sample_weight)
    parser.add_argument("--valley-sample-weight", type=float, default=DemandConfig.valley_sample_weight)
    parser.add_argument("--ramp-sample-weight", type=float, default=DemandConfig.ramp_sample_weight)
    parser.add_argument("--hour-correction-strength", type=float, default=DemandConfig.hour_correction_strength)
    parser.add_argument("--max-hour-correction-mw", type=float, default=DemandConfig.max_hour_correction_mw)
    parser.add_argument("--amplitude-correction-strength", type=float, default=DemandConfig.amplitude_correction_strength)
    parser.add_argument("--value-bin-correction-strength", type=float, default=DemandConfig.value_bin_correction_strength)
    parser.add_argument("--max-value-bin-correction-mw", type=float, default=DemandConfig.max_value_bin_correction_mw)
    parser.add_argument("--calibration-bias-penalty", type=float, default=DemandConfig.calibration_bias_penalty)
    return parser.parse_args()


def run_saved_training(csv_path: Path, output_root: Path, config: DemandConfig) -> dict:
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "_" + uuid4().hex[:8]
    output_dir = output_root / f"{run_id}_{config.architecture}_seed{config.seed}"
    output_dir.mkdir(parents=True, exist_ok=False)
    manifest = {"pipeline_version": PIPELINE_VERSION, "config": asdict(config),
                "run_id": run_id, "status": "running", "python": platform.python_version(),
                "started_at_utc": datetime.now(timezone.utc).isoformat(),
                "data_path": str(csv_path.resolve()), "output_dir": str(output_dir.resolve()),
                "command_arguments": sys.argv[1:]}
    manifest_path = output_dir / "run_manifest.json"

    def save_manifest():
        manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    class Tee:
        def __init__(self, terminal, log):
            self.terminal, self.log = terminal, log

        def write(self, text):
            self.terminal.write(text)
            self.log.write(text)
            self.log.flush()
            return len(text)

        def flush(self):
            self.terminal.flush()
            self.log.flush()

    save_manifest()
    print(f"Saving this run to: {output_dir}", flush=True)
    with (output_dir / "console.log").open("w", encoding="utf-8") as log:
        with redirect_stdout(Tee(sys.stdout, log)), redirect_stderr(Tee(sys.stderr, log)):
            try:
                shutil.copy2(Path(__file__), output_dir / "model1_source.py")
                with csv_path.open("rb") as source:
                    manifest["data_sha256"] = hashlib.file_digest(source, "sha256").hexdigest()
                import importlib.metadata
                manifest["packages"] = {}
                for package in ["tensorflow", "keras", "numpy", "pandas", "matplotlib"]:
                    try:
                        manifest["packages"][package] = importlib.metadata.version(package)
                    except importlib.metadata.PackageNotFoundError:
                        manifest["packages"][package] = "not installed"
                save_manifest()
                report = train(csv_path, output_dir, config)
                manifest["status"] = "completed"
                print(json.dumps(report, indent=2, default=str))
                return report
            except BaseException as exc:
                manifest["status"] = "interrupted" if isinstance(exc, KeyboardInterrupt) else "failed"
                manifest["error"] = str(exc)
                traceback.print_exc()
                raise
            finally:
                manifest["finished_at_utc"] = datetime.now(timezone.utc).isoformat()
                save_manifest()


def main() -> None:
    args = parse_args()
    config = DemandConfig(
        architecture=args.architecture,
        seed=args.seed,
        epochs=args.epochs,
        batch_size=args.batch_size,
        window_size=args.window_size,
        learning_rate=args.learning_rate,
        dropout=args.dropout,
        l2_regularization=args.l2_regularization,
        patience=args.patience,
        early_stop_min_delta=args.early_stop_min_delta,
        huber_delta=args.huber_delta,
        min_valid_demand_mw=args.min_valid_demand_mw,
        peak_sample_weight=args.peak_sample_weight,
        valley_sample_weight=args.valley_sample_weight,
        ramp_sample_weight=args.ramp_sample_weight,
        hour_correction_strength=args.hour_correction_strength,
        max_hour_correction_mw=args.max_hour_correction_mw,
        amplitude_correction_strength=args.amplitude_correction_strength,
        value_bin_correction_strength=args.value_bin_correction_strength,
        max_value_bin_correction_mw=args.max_value_bin_correction_mw,
        calibration_bias_penalty=args.calibration_bias_penalty,
    )
    print(f"model1 demand pipeline version: {PIPELINE_VERSION}")

    if args.mode == "profile":
        print(json.dumps(profile(args.data, config), indent=2, default=str))
        return

    run_saved_training(args.data, args.output_dir, config)


if __name__ == "__main__":
    main()
