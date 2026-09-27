"""Local UI API: experimental solar plus explicitly simulated demand history."""
import json
import os
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .demand_service import DemandService, BASE
from .forecast_service import ForecastService
from .service import WeatherStore

app = FastAPI(title="Demand Scenario and Solar Forecast API", version="1.0")
origins = {value.strip() for value in os.getenv("UI_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173").split(",") if value.strip()}
origins |= {"http://127.0.0.1:8030", "http://localhost:8030"}
app.add_middleware(CORSMiddleware, allow_origins=sorted(origins), allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
demand = DemandService()
solar = ForecastService(WeatherStore())
root = Path(os.getenv("COMBINED_OUTPUT", str(BASE / "artifacts/combined_forecasts")))
lock = threading.Lock()


def window(now):
    local = pd.Timestamp(now).tz_convert("Asia/Colombo")
    start = local.floor("h") + pd.Timedelta(hours=1)
    end = local.normalize() + pd.Timedelta(days=7)
    return start, end, local.normalize()


def combine(demand_result, solar_result, start, end, today):
    demand_map = {row["hour_start"]: row for row in demand_result["predictions"]} if demand_result else {}
    solar_map = {row["hour_start"]: row for row in solar_result["predictions"]} if solar_result else {}
    rows = []
    for hour in pd.date_range(start, end, inclusive="left", freq="h"):
        key = hour.isoformat()
        if demand_result and key not in demand_map or solar_result and key not in solar_map:
            raise ValueError("Forecast services returned different hourly windows")
        rows.append({"hour_start": key, "hour_end": (hour+pd.Timedelta(hours=1)).isoformat(),
                     "predicted_demand_mw": demand_map.get(key, {}).get("predicted_demand_mw"),
                     "raw_predicted_demand_mw": demand_map.get(key, {}).get("raw_predicted_demand_mw"),
                     "predicted_solar_mw": solar_map.get(key, {}).get("predicted_solar_mw")})
    days = [{"date": (today+pd.Timedelta(days=i)).date().isoformat(),
             "hours": [r for r in rows if r["hour_start"][:10] == (today+pd.Timedelta(days=i)).date().isoformat()]}
            for i in range(7)]
    for day in days:
        day["hour_count"] = len(day["hours"])
        day["partial_day"] = day["hour_count"] != 24
    return rows, days


@app.get("/api/health")
def health():
    return {"status": "ok", "demand": demand.status(), "mode": "solar_forecast_and_demand_scenario"}


@app.post("/api/forecast/combined/seven-day")
def generate(request: Request):
    origin = request.headers.get("origin")
    if origin and origin not in origins:
        raise HTTPException(403, "Frontend origin not allowed; configure UI_ORIGINS")
    if not lock.acquire(blocking=False):
        raise HTTPException(409, "Generation already running")
    try:
        now = datetime.now(timezone.utc)
        start, end, today = window(now)
        results, errors = {}, {}
        with ThreadPoolExecutor(max_workers=2) as executor:
            jobs = {"solar": executor.submit(solar.generate, window_now=now),
                    "demand": executor.submit(demand.generate, start, end)}
            for name, job in jobs.items():
                try:
                    results[name] = job.result()
                except Exception as exc:
                    errors[name] = f"{type(exc).__name__}: {exc}"
        demand_result, seed = results.get("demand", (None, None))
        solar_result = results.get("solar")
        rows, days = combine(demand_result, solar_result, start, end, today)
        forecast_id = now.strftime("%Y%m%dT%H%M%SZ") + "_" + uuid4().hex[:8]
        result = {"forecast_id": forecast_id, "generated_at": now.isoformat(),
                  "status": "failed" if len(errors) == 2 else "partial" if errors else "experimental",
                  "timezone": "Asia/Colombo", "window_start": start.isoformat(), "window_end": end.isoformat(),
                  "hour_count": len(rows), "units": "MW", "errors": errors,
                  "demand_mode": "historical_seed_scenario", "seven_day_accuracy_validated": False,
                  "warnings": ["Demand scenario uses assumed history from 2025, not current observations.",
                               "Solar uses forecast weather and an experimental weather model.",
                               "Past hours and the current incomplete hour are omitted, not zero.",
                               "Demand timestamp start/end convention requires source-provider confirmation."],
                  "demand_details": {k:v for k,v in (demand_result or {}).items() if k != "predictions"},
                  "solar_details": {k:v for k,v in (solar_result or {}).items() if k != "predictions"},
                  "predictions": rows, "days": days}
        folder = root / forecast_id
        folder.mkdir(parents=True)
        if seed is not None:
            seed.to_csv(folder / "scenario_seed_history.csv", index=False)
        pd.DataFrame(rows).to_csv(folder / "hourly_predictions.csv", index=False)
        (folder / "forecast.json").write_text(json.dumps(result, indent=2, allow_nan=False), encoding="utf-8")
        if len(errors) == 2:
            raise HTTPException(503, {"forecast_id": forecast_id, "errors": errors})
        pointer = root / "latest.tmp"
        pointer.write_text(json.dumps({"forecast_id": forecast_id}))
        os.replace(pointer, root / "latest.json")
        return result
    finally:
        lock.release()


@app.get("/api/forecast/combined/latest")
def latest():
    if not (root / "latest.json").exists():
        raise HTTPException(404, "Generate a forecast first")
    identifier = json.loads((root / "latest.json").read_text())["forecast_id"]
    result = json.loads((root / identifier / "forecast.json").read_text())
    age = (datetime.now(timezone.utc)-datetime.fromisoformat(result["generated_at"])).total_seconds()
    return {**result, "age_seconds": round(age), "stale": age >= 3600}


@app.get("/api/forecast/combined/latest.csv")
def download():
    result = latest()
    return FileResponse(root / result["forecast_id"] / "hourly_predictions.csv", media_type="text/csv", filename="combined_hourly_predictions.csv")
