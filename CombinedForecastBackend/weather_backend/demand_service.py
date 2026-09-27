"""Recursive demand SCENARIOS seeded from historical observations, not live demand."""
import hashlib
import importlib.util
import json
import os
import sys
import threading
from pathlib import Path

import numpy as np
import pandas as pd

BASE = Path(__file__).resolve().parents[1]


def scenario_history(frame, start, count):
    frame = frame.sort_values("Datetime").reset_index(drop=True)
    times = pd.DatetimeIndex(frame.Datetime)
    if times.has_duplicates or not times.to_series().diff().dropna().eq(pd.Timedelta(hours=1)).all():
        raise ValueError("Demand history must contain unique consecutive hourly timestamps")
    if not np.isfinite(frame.Demand_MW.to_numpy(dtype=float)).all():
        raise ValueError("Demand history contains nonfinite measurements")
    # Choose a complete historical block ending on the same weekday/hour and
    # closest seasonal date. Source dates are retained separately for audit.
    desired = start - pd.Timedelta(hours=1)
    candidates = [i for i, t in enumerate(times) if i >= count - 1
                  and t.dayofweek == desired.dayofweek and t.hour == desired.hour]
    if not candidates:
        raise ValueError("Insufficient historical data for a weekday-aligned scenario")
    def distance(i):
        difference = abs(times[i].dayofyear - desired.dayofyear)
        return min(difference, 366 - difference)
    end = min(candidates, key=distance)
    block = frame.iloc[end-count+1:end+1].copy()
    provenance = {"source_start": str(block.Datetime.iloc[0]), "source_end": str(block.Datetime.iloc[-1]),
                  "selection": "Same ending weekday/hour; closest day-of-year among complete blocks"}
    block["source_datetime"] = block.Datetime.astype(str)
    block["Datetime"] = pd.date_range(end=start-pd.Timedelta(hours=1), periods=count, freq="h").tz_localize(None)
    return block, provenance


class DemandService:
    def __init__(self):
        self.artifacts = Path(os.getenv("DEMAND_ARTIFACTS", str(BASE / "artifacts/demand_model_v9")))
        self.data = Path(os.getenv("DEMAND_HISTORY", str(BASE / "data/demand_history.csv")))
        self.lock = threading.Lock()
        self.model = None

    def status(self):
        files = ["best_model.keras", "preprocessing.json", "model1_source.py"]
        return {"mode": "historical_seed_scenario", "live_demand_available": False,
                "artifacts": {name: (self.artifacts/name).is_file() for name in files},
                "history_available": self.data.is_file(), "loaded": self.model is not None}

    def load(self):
        if self.model is not None:
            return
        import tensorflow as tf
        spec = importlib.util.spec_from_file_location("demand_training_snapshot", self.artifacts / "model1_source.py")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        self.helpers = module
        self.pre = json.loads((self.artifacts / "preprocessing.json").read_text())
        if self.pre["feature_columns"] != module.feature_columns():
            raise ValueError("Demand preprocessing and feature code do not match")
        self.x_scaler = module.MinMaxScalerState(**self.pre["x_scaler"])
        self.y_scaler = module.MinMaxScalerState(**self.pre["y_scaler"])
        self.model = tf.keras.models.load_model(self.artifacts / "best_model.keras", compile=False)
        if tuple(self.model.input_shape[1:]) != (self.pre["config"]["window_size"], len(self.pre["feature_columns"])):
            self.model = None
            raise ValueError("Demand model input shape does not match preprocessing")
        self.infer = tf.function(lambda inputs: self.model(inputs, training=False), reduce_retracing=True)

    def generate(self, start, end):
        with self.lock:
            self.load()
            helper = self.helpers
            frame = helper.load_dataset(self.data)
            frame, cleaning = helper.clean_demand_data(frame, self.pre["config"]["min_valid_demand_mw"])
            window = self.pre["config"]["window_size"]
            seed, provenance = scenario_history(frame, start, window + 168)
            history = seed[["Datetime", "Demand_MW"]].copy()
            rows = []
            for timestamp in pd.date_range(start, end, inclusive="left", freq="h"):
                # Dummy target supplies known target-time calendar fields only;
                # lag generation drops its row because its next calendar is absent.
                extended = pd.concat([history, pd.DataFrame({"Datetime": [timestamp.tz_localize(None)],
                                                             "Demand_MW": [0.0]})], ignore_index=True)
                features = helper.add_demand_lag_features(helper.add_calendar_features(extended))
                x = self.x_scaler.transform(features.tail(window))
                if x.shape != (window, len(self.pre["feature_columns"])) or not np.isfinite(x).all():
                    raise ValueError("Invalid recursive demand input")
                raw = float(self.y_scaler.inverse_transform_array(self.infer(x[None]).numpy()).reshape(-1)[0])
                if not np.isfinite(raw):
                    raise ValueError("Nonfinite demand prediction")
                raw = max(raw, 0.0)
                corrected = helper.apply_validation_calibration(pd.Series([timestamp]), np.array([raw]),
                                                               self.pre["validation_calibration"])[0][0]
                rows.append({"hour_start": timestamp.isoformat(), "hour_end": (timestamp+pd.Timedelta(hours=1)).isoformat(),
                             "raw_predicted_demand_mw": raw, "predicted_demand_mw": float(corrected)})
                # Raw forecasts feed recursion; calibration is output-only.
                history = pd.concat([history, pd.DataFrame({"Datetime": [timestamp.tz_localize(None)],
                                                            "Demand_MW": [raw]})], ignore_index=True).tail(window+168)
            return {"status": "scenario", "live_demand_available": False,
                    "seven_day_accuracy_validated": False, "historical_source": provenance,
                    "history_sha256": hashlib.sha256(self.data.read_bytes()).hexdigest(),
                    "model_sha256": hashlib.sha256((self.artifacts/"best_model.keras").read_bytes()).hexdigest(),
                    "pipeline_version": self.pre["pipeline_version"], "cleaning": cleaning,
                    "recursion": "Raw nonnegative predictions feed history; calibration applied to output only",
                    "predictions": rows}, seed
