"""Prepare experimental hourly weather-to-power data; does not train a model."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
import pvlib

ROOT = Path(__file__).resolve().parent
WEATHER = ["air_temp", "ghi", "wind_speed_10m"]
TRAIN_END = pd.Timestamp("2025-11-23 04:15", tz="Asia/Colombo")
TEST_START = pd.Timestamp("2025-12-22 02:15", tz="Asia/Colombo")


def complete_hourly(frame):
    """Only average four finite quarter-hour endpoints; never bridge a gap."""
    if frame.index.has_duplicates or not frame.index.is_monotonic_increasing:
        raise ValueError("Expected unique sorted timestamps")
    if ((frame.index.minute % 15 != 0) | (frame.index.second != 0)).any():
        raise ValueError("Timestamps are not quarter-hour aligned")
    frame = frame.replace([np.inf, -np.inf], np.nan)
    grouped = frame.resample("1h", closed="right", label="right")
    return grouped.mean().where(grouped.count() == 4).dropna()


def build(raw_path, target_path, output, offset):
    if output.exists() and any(output.iterdir()):
        raise ValueError("Use a new empty output directory; previous datasets are preserved")
    locations = json.loads((ROOT / "weather_backend/locations.json").read_text())
    names = sorted(p["name"] for p in locations)
    raw = pd.read_csv(raw_path, usecols=["Datetime", "Location", *WEATHER])
    raw["Datetime"] = pd.to_datetime(raw.Datetime, format="%m/%d/%Y %H:%M", errors="raise")
    if raw[["Datetime", "Location"]].isna().any().any() or raw.duplicated(["Datetime", "Location"]).any():
        raise ValueError("Missing or duplicate weather keys")
    if set(raw.Location) != set(names):
        raise ValueError("Weather locations differ from the configured 15 locations")
    for feature in WEATHER:
        raw[feature] = pd.to_numeric(raw[feature], errors="raise")
    if (raw.ghi.dropna() < 0).any() or (raw.wind_speed_10m.dropna() < 0).any():
        raise ValueError("Negative GHI/wind: physical-unit raw weather required")
    ranges = {k: {"min": float(raw[k].min()), "max": float(raw[k].max()),
                  "missing": int(raw[k].isna().sum())} for k in WEATHER}
    raw["Datetime"] = (raw.Datetime + pd.Timedelta(minutes=offset)).dt.tz_localize("Asia/Colombo")
    wide = raw.pivot(index="Datetime", columns="Location", values=WEATHER).sort_index()
    wide.columns = [f"{feature}__{name}" for feature, name in wide.columns]
    # Generate angles with the same library and convention used for future inputs.
    for place in sorted(locations, key=lambda p: p["name"]):
        pos = pvlib.solarposition.get_solarposition(wide.index, place["latitude"], place["longitude"])
        radians = np.deg2rad(pos.azimuth)
        wide[f"azimuth_sin__{place['name']}"] = np.sin(radians)
        wide[f"azimuth_cos__{place['name']}"] = np.cos(radians)
        wide[f"zenith__{place['name']}"] = pos.zenith
    targets = pd.read_csv(target_path, parse_dates=["Datetime"])
    if targets.Datetime.isna().any() or targets.Datetime.duplicated().any():
        raise ValueError("Missing or duplicate target timestamps")
    targets = targets.set_index("Datetime").sort_index()
    targets.index = targets.index.tz_localize("Asia/Colombo")
    y = pd.to_numeric(targets.Island_Solar_MW, errors="raise")
    valid = targets.Target_Valid.astype(str).str.lower().eq("true")
    y = y.where(valid & y.ge(0) & np.isfinite(y))
    # Preserve the confirmed interval-ending outage even if an input flag changes.
    outage = (y.index > pd.Timestamp("2025-12-21", tz="Asia/Colombo")) & (y.index <= pd.Timestamp("2025-12-22", tz="Asia/Colombo"))
    y.loc[outage] = np.nan
    joined = wide.join(y.rename("Actual_Island_MW"), how="outer").sort_index()
    hourly = complete_hourly(joined)
    features = [c for c in hourly if c != "Actual_Island_MW"]
    first_interval_end = hourly.index - pd.Timedelta(minutes=45)
    split = pd.Series("boundary_excluded", index=hourly.index)
    split.loc[hourly.index < TRAIN_END] = "train"
    split.loc[(first_interval_end >= TRAIN_END) & (hourly.index < TEST_START)] = "validation"
    split.loc[first_interval_end >= TEST_START] = "historical_holdout"
    hourly["Split"] = split
    hourly = hourly.loc[split != "boundary_excluded"]
    if set(hourly.Split) != {"train", "validation", "historical_holdout"}:
        raise ValueError("One or more chronological splits are empty")
    output.mkdir(parents=True, exist_ok=True)
    hourly.index.name = "Hour_End"
    hourly.to_csv(output / "hourly_weather_to_solar.csv")
    report = {
        "status": "experimental_dataset_only", "training_started": False,
        "ready_for_operational_forecasting": False,
        "sources": {"weather": str(raw_path.resolve()), "targets": str(target_path.resolve())},
        "sha256": {"weather": hashlib.sha256(raw_path.read_bytes()).hexdigest(),
                   "targets": hashlib.sha256(target_path.read_bytes()).hexdigest()},
        "weather_rows": len(raw), "locations": len(names), "raw_weather_ranges": ranges,
        "weather_timestamp_offset_minutes": offset,
        "weather_unit_assumptions": {"air_temp": "C", "ghi": "W/m2", "wind_speed_10m": "m/s (unverified source metadata)"},
        "rows": len(hourly), "start": str(hourly.index.min()), "end": str(hourly.index.max()),
        "split_rows": {k: int(v) for k, v in hourly.Split.value_counts().items()},
        "split_boundaries": {"train_end_exclusive": str(TRAIN_END), "validation_end_exclusive": str(TEST_START)},
        "hours_before_filtering": len(joined.resample("1h", closed="right", label="right").size()),
        "features": features, "target": "Actual_Island_MW", "target_unit": "hourly mean MW",
        "aggregation": "Four complete 15-minute interval ends per hour; no imputation; sine/cosine for circular azimuth",
        "limitations": ["Legacy weather offset is an explicit assumption, not verified source timezone metadata.",
                        "Source irradiance interval convention and wind units remain unverified.",
                        "Solcast historical estimates/observations are not Open-Meteo future forecasts.",
                        "This dataset cannot establish day-1 through day-7 forecast skill.",
                        "Historical holdout dates have been inspected in previous experiments; not an untouched final test.",
                        "Six months of historical targets do not establish full-year or current-capacity performance."],
    }
    (output / "preparation_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({k: report[k] for k in ["status", "rows", "start", "end", "split_rows", "raw_weather_ranges"]}, indent=2))
    return hourly, report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--weather", type=Path, required=True)
    parser.add_argument("--targets", type=Path, default=ROOT / "corrected_solar_data/island_generation_corrected.csv")
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--weather-offset-minutes", type=int, required=True,
                        help="Explicit experimental timestamp adjustment; prior audit suggested +330")
    args = parser.parse_args()
    build(args.weather, args.targets, args.output_dir, args.weather_offset_minutes)
