"""Retrieve and validate forecast inputs. Never applies legacy model scaling/lag."""
import hashlib
import json
import math
import os
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

import pandas as pd
import pvlib
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ZONE = ZoneInfo("Asia/Colombo")
ROOT = Path(__file__).resolve().parent
LOCATIONS = json.loads((ROOT / "locations.json").read_text())
VARIABLES = ["temperature_2m", "shortwave_radiation", "wind_speed_10m"]
OUTPUT_COLUMNS = ["Datetime", "Location", "air_temp", "azimuth", "ghi", "wind_speed_10m", "zenith"]


class WeatherError(Exception):
    pass


def forecast_window(now):
    # Begin at the next full local hour; label all 672 intervals by their end.
    start = now.astimezone(ZONE).replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    times = pd.date_range(start + timedelta(minutes=15), periods=672, freq="15min")
    return start, times


def request_parameters(times):
    return {
        "latitude": ",".join(str(p["latitude"]) for p in LOCATIONS),
        "longitude": ",".join(str(p["longitude"]) for p in LOCATIONS),
        "minutely_15": ",".join(VARIABLES), "timezone": "Asia/Colombo",
        "temperature_unit": "celsius", "wind_speed_unit": "ms",
        "start_minutely_15": times[0].strftime("%Y-%m-%dT%H:%M"),
        "end_minutely_15": times[-1].strftime("%Y-%m-%dT%H:%M"),
    }


def fetch_provider(params):
    retry = Retry(total=2, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504],
                  allowed_methods=["GET"], respect_retry_after_header=False)
    with requests.Session() as session:
        session.mount("https://", HTTPAdapter(max_retries=retry))
        try:
            response = session.get("https://api.open-meteo.com/v1/forecast", params=params, timeout=(10, 60))
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError) as exc:
            raise WeatherError(f"Weather provider request failed: {exc}") from exc


def build_features(payload, times):
    if not isinstance(payload, list) or len(payload) != len(LOCATIONS):
        raise WeatherError("Expected one provider response for each of the 15 locations.")
    frames, grids = [], []
    for location, result in zip(LOCATIONS, payload):
        try:
            if result.get("error"):
                raise ValueError(str(result.get("reason")))
            if result["utc_offset_seconds"] != 19800:
                raise ValueError("Unexpected timezone offset")
            lat, lon = float(result["latitude"]), float(result["longitude"])
            if not math.isfinite(lat + lon) or abs(lat-location["latitude"]) > .5 or abs(lon-location["longitude"]) > .5:
                raise ValueError("Returned grid coordinates do not match requested location")
            units = result["minutely_15_units"]
            if units["temperature_2m"] != "\u00b0C" or units["wind_speed_10m"] != "m/s" or units["shortwave_radiation"] != "W/m\u00b2":
                raise ValueError(f"Unexpected units: {units}")
            raw = result["minutely_15"]
            idx = pd.DatetimeIndex(raw["time"])
            idx = idx.tz_localize(ZONE) if idx.tz is None else idx.tz_convert(ZONE)
            if idx.has_duplicates or not idx.is_monotonic_increasing:
                raise ValueError("Duplicate or unordered timestamps")
            frame = pd.DataFrame({key: raw[key] for key in VARIABLES}, index=idx).reindex(times)
            if frame.isna().any().any():
                raise ValueError("Incomplete seven-day forecast or null weather values")
            for key in VARIABLES:
                if not frame[key].map(lambda x: isinstance(x, (int, float)) and math.isfinite(x)).all():
                    raise ValueError(f"Non-numeric or nonfinite {key}")
            if (frame.shortwave_radiation < 0).any() or (frame.wind_speed_10m < 0).any():
                raise ValueError("Negative irradiance or wind speed")
            position = pvlib.solarposition.get_solarposition(times, location["latitude"], location["longitude"])
            frame = frame.rename(columns={"temperature_2m": "air_temp", "shortwave_radiation": "ghi"})
            frame["azimuth"] = position.azimuth
            frame["zenith"] = position.zenith
            if frame.isna().any().any():
                raise ValueError("Solar position calculation failed")
            frame["Location"] = location["name"]
            frame["Datetime"] = [t.isoformat() for t in times]
            frames.append(frame[OUTPUT_COLUMNS])
            grids.append({**location, "grid_latitude": lat, "grid_longitude": lon})
        except (KeyError, ValueError, TypeError) as exc:
            raise WeatherError(f"{location['name']}: {exc}") from exc
    return pd.concat(frames, ignore_index=True), grids


class WeatherStore:
    def __init__(self, root=None):
        self.root = Path(root or ROOT / "snapshots")
        self.lock = threading.Lock()

    def latest(self):
        pointer = self.root / "latest.json"
        if not pointer.exists():
            return None
        snapshot = json.loads(pointer.read_text())["snapshot_id"]
        return json.loads((self.root / snapshot / "manifest.json").read_text())

    def refresh(self, now=None):
        if not self.lock.acquire(blocking=False):
            raise WeatherError("A refresh is already running. Try again after it finishes.")
        try:
            now = now or datetime.now(timezone.utc)
            start, times = forecast_window(now)
            old = self.latest()
            if old and old["window_start"] == start.isoformat() and (now-datetime.fromisoformat(old["retrieved_at"])).total_seconds() < 3600:
                return {**old, "cache_hit": True}
            params = request_parameters(times)
            payload = fetch_provider(params)
            frame, grids = build_features(payload, times)
            snapshot_id = now.strftime("%Y%m%dT%H%M%SZ") + "_" + uuid4().hex[:8]
            folder = self.root / snapshot_id
            folder.mkdir(parents=True)
            (folder / "raw_response.json").write_text(json.dumps(payload, allow_nan=False), encoding="utf-8")
            frame.to_csv(folder / "weather_features_15min.csv", index=False)
            manifest = {
                "snapshot_id": snapshot_id, "retrieved_at": now.isoformat(), "provider_issue_time": None,
                "window_start": start.isoformat(), "window_end": times[-1].isoformat(),
                "first_interval_end": times[0].isoformat(), "timezone": "Asia/Colombo",
                "locations": grids, "row_count": len(frame), "intervals_per_location": len(times),
                "source": "Open-Meteo", "source_url": "https://open-meteo.com/", "request_parameters": params,
                "units": {"air_temp": "C", "ghi": "W/m2", "wind_speed_10m": "m/s", "azimuth": "degrees clockwise from north", "zenith": "degrees from vertical, geometric"},
                "solar_position_time": "interval end", "radiation_time": "preceding 15-minute mean",
                "regional_resolution": "15-minute weather interpolated by provider from hourly data",
                "legacy_weather_shift_applied": False, "scaling_applied": False,
                "ready_for_existing_lstm": False, "solar_predictions_available": False,
                "limitations": ["Weather inputs only; existing model predicts one hour, not seven days.",
                    "Retrieved time is not the provider forecast issue time.",
                    "Open-Meteo source and pvlib angle conventions differ from legacy training inputs."],
                "csv_sha256": hashlib.sha256((folder / "weather_features_15min.csv").read_bytes()).hexdigest(),
            }
            (folder / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
            # Publish only after validation and all snapshot files have been written.
            temporary = self.root / "latest.tmp"
            temporary.write_text(json.dumps({"snapshot_id": snapshot_id}))
            os.replace(temporary, self.root / "latest.json")
            return {**manifest, "cache_hit": False}
        finally:
            self.lock.release()

    def csv_path(self, manifest):
        return self.root / manifest["snapshot_id"] / "weather_features_15min.csv"
