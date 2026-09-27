"""Experimental weather-to-power inference. Never invokes the next-hour LSTM."""
import hashlib
import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd
import pvlib
from threadpoolctl import threadpool_limits

from prepare_weather_prototype import complete_hourly
from .service import LOCATIONS, ROOT

ARTIFACTS = ROOT.parent / "artifacts/weather_prototype_v1"


class ForecastError(ValueError):
    pass


def hourly_inputs(frame, manifest, features):
    """Reproduce prototype training calculations; no legacy timestamp shift."""
    frame = frame.copy()
    start = pd.Timestamp(manifest["window_start"])
    end = pd.Timestamp(manifest["window_end"])
    if start.tzinfo is None or end.tzinfo is None:
        raise ForecastError("Snapshot window must be timezone-aware")
    start, end = start.tz_convert("Asia/Colombo"), end.tz_convert("Asia/Colombo")
    if start != start.floor("h") or end - start != pd.Timedelta(days=7):
        raise ForecastError("Expected an hour-aligned seven-day window")
    times = pd.DatetimeIndex(pd.to_datetime(frame.Datetime, errors="raise"))
    if times.tz is None:
        raise ForecastError("Weather timestamps must include their timezone")
    frame["Datetime"] = times.tz_convert("Asia/Colombo")
    names = sorted(p["name"] for p in LOCATIONS)
    expected = pd.date_range(start + pd.Timedelta(minutes=15), periods=672, freq="15min")
    if len(frame) != 672 * len(names) or set(frame.Location) != set(names):
        raise ForecastError("Expected 672 intervals for each configured location")
    if frame.duplicated(["Datetime", "Location"]).any():
        raise ForecastError("Duplicate weather timestamp/location")
    for name, part in frame.groupby("Location"):
        if not pd.DatetimeIndex(part.Datetime.sort_values()).equals(expected):
            raise ForecastError(f"Incomplete weather timeline: {name}")
    weather = ["air_temp", "ghi", "wind_speed_10m"]
    values = frame[weather].to_numpy(dtype=float)
    if not np.isfinite(values).all() or (frame[["ghi", "wind_speed_10m"]] < 0).any().any():
        raise ForecastError("Weather must be finite, with nonnegative GHI and wind")
    wide = frame.pivot(index="Datetime", columns="Location", values=weather).sort_index()
    wide.columns = [f"{feature}__{name}" for feature, name in wide.columns]
    for place in sorted(LOCATIONS, key=lambda p: p["name"]):
        pos = pvlib.solarposition.get_solarposition(wide.index, place["latitude"], place["longitude"])
        radians = np.deg2rad(pos.azimuth)
        wide[f"azimuth_sin__{place['name']}"] = np.sin(radians)
        wide[f"azimuth_cos__{place['name']}"] = np.cos(radians)
        wide[f"zenith__{place['name']}"] = pos.zenith
    if len(features) != len(set(features)) or set(features) != set(wide.columns):
        raise ForecastError("Model feature specification differs from weather adapter")
    hourly = complete_hourly(wide)[features]
    hours = pd.date_range(start + pd.Timedelta(hours=1), periods=168, freq="h")
    if not hourly.index.equals(hours) or not np.isfinite(hourly.to_numpy()).all():
        raise ForecastError("Expected exactly 168 complete hourly feature rows")
    return hourly


def check_snapshot(manifest, now):
    age = (now - datetime.fromisoformat(manifest["retrieved_at"])).total_seconds()
    if age < 0 or age >= 3600 or pd.Timestamp(manifest["window_start"]) <= now:
        raise ForecastError("Weather snapshot is stale or its forecast window has started; refresh weather")
    if manifest["units"]["air_temp"] != "C" or manifest["units"]["ghi"] != "W/m2" or manifest["units"]["wind_speed_10m"] != "m/s":
        raise ForecastError("Unexpected weather units")
    if manifest["legacy_weather_shift_applied"] or manifest["scaling_applied"]:
        raise ForecastError("Future weather must be unscaled and unshifted")


class ForecastService:
    def __init__(self, weather_store, root=None):
        self.weather_store = weather_store
        self.root = Path(root or ROOT / "solar_forecasts")
        self.lock = threading.Lock()

    def generate(self, window_now=None):
        if not self.lock.acquire(blocking=False):
            raise ForecastError("Forecast generation is already running")
        try:
            manifest = self.weather_store.refresh() if window_now is None else self.weather_store.refresh(now=window_now)
            now = datetime.now(timezone.utc)
            check_snapshot(manifest, now)
            path = self.weather_store.csv_path(manifest)
            if hashlib.sha256(path.read_bytes()).hexdigest() != manifest["csv_sha256"]:
                raise ForecastError("Weather CSV fingerprint mismatch")
            summary = json.loads((ARTIFACTS / "run_summary.json").read_text())
            model_path = ARTIFACTS / "weather_model.joblib"
            if hashlib.sha256(model_path.read_bytes()).hexdigest() != summary["model_sha256"]:
                raise ForecastError("Model fingerprint mismatch")
            # Only load this locally trained artifact; no uploaded pickle paths.
            bundle = joblib.load(model_path)
            spec = json.loads((ARTIFACTS / "preprocessing.json").read_text())
            if bundle["features"] != spec["features"]:
                raise ForecastError("Model and preprocessing feature order disagree")
            inputs = hourly_inputs(pd.read_csv(path), manifest, bundle["features"])
            with threadpool_limits(limits=2):
                if bundle["model"] is None:
                    prediction = inputs[bundle["ghi_columns"]].mean(axis=1).to_numpy() * bundle["baseline_coefficient"]
                else:
                    prediction = bundle["model"].predict(inputs)
            prediction = np.maximum(0, np.asarray(prediction))
            if prediction.shape != (168,) or not np.isfinite(prediction).all():
                raise ForecastError("Model did not return 168 finite predictions")
            forecast_id = now.strftime("%Y%m%dT%H%M%SZ") + "_" + uuid4().hex[:8]
            rows = [{"hour_start": (t-pd.Timedelta(hours=1)).isoformat(), "hour_end": t.isoformat(),
                     "predicted_solar_mw": float(value)} for t, value in zip(inputs.index, prediction)]
            result = {"forecast_id": forecast_id, "generated_at": now.isoformat(),
                      "status": "experimental", "historical_replay": False,
                      "seven_day_forecast_accuracy_validated": False,
                      "timezone": "Asia/Colombo", "window_start": manifest["window_start"],
                      "window_end": manifest["window_end"], "hour_count": 168,
                      "units": "hourly mean MW", "weather_snapshot_id": manifest["snapshot_id"],
                      "weather_retrieved_at": manifest["retrieved_at"],
                      "provider_issue_time": manifest["provider_issue_time"],
                      "weather_csv_sha256": manifest["csv_sha256"], "model": bundle["selected"],
                      "model_sha256": summary["model_sha256"], "legacy_weather_shift_applied": False,
                      "postprocessing": bundle["postprocessing"],
                      "warnings": summary["limitations"] + [
                          "No prediction intervals or operational accuracy claim are available.",
                          "No additional night-zero mask was applied; small night predictions may remain."],
                      "predictions": rows}
            folder = self.root / forecast_id
            folder.mkdir(parents=True)
            inputs.to_csv(folder / "hourly_model_inputs.csv", index_label="Hour_End")
            pd.DataFrame(rows).to_csv(folder / "solar_predictions_hourly.csv", index=False)
            (folder / "forecast.json").write_text(json.dumps(result, indent=2, allow_nan=False), encoding="utf-8")
            pointer = self.root / "latest.tmp"
            pointer.write_text(json.dumps({"forecast_id": forecast_id}))
            os.replace(pointer, self.root / "latest.json")
            return result
        finally:
            self.lock.release()

    def latest(self):
        pointer = self.root / "latest.json"
        if not pointer.exists():
            return None
        name = json.loads(pointer.read_text())["forecast_id"]
        result = json.loads((self.root / name / "forecast.json").read_text())
        now = datetime.now(timezone.utc)
        age = (now - datetime.fromisoformat(result["weather_retrieved_at"])).total_seconds()
        return {**result, "weather_age_seconds": round(age),
                "stale": age >= 3600 or pd.Timestamp(result["window_start"]) <= now}

    def csv_path(self, result):
        return self.root / result["forecast_id"] / "solar_predictions_hourly.csv"
