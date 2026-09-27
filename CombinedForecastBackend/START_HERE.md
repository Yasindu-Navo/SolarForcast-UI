# Combined Forecast Backend: developer handover

## 1. What you receive

This folder includes both trained models, their preprocessing, the 2025 demand
history and the API code. You do not need Colab, Google Drive or model training.
Use only these trusted model artifacts; do not accept arbitrary uploaded Python
or joblib files. Demand loads the included training-source snapshot for features.

Solar predictions use internet weather forecasts. Demand outputs are SCENARIOS:
the service maps an explicitly identified 2025 history block to assumed recent
history and recursively predicts future demand. Recent actual demand is unavailable.
The UI must not describe both outputs as validated current forecasts.

## 2. Extract

Extract the ZIP so START_HERE.md is at:

    C:\CombinedForecastBackend\START_HERE.md

Folder layout:

```text
CombinedForecastBackend/
  START_HERE.md
  requirements.txt
  frontend-example.js
  prepare_weather_prototype.py
  weather_backend/
    __init__.py
    combined_app.py
    demand_service.py
    forecast_service.py
    service.py
    locations.json
  artifacts/
    demand_model_v9/
      best_model.keras
      preprocessing.json
      model1_source.py
      evaluation_summary.json
      run_manifest.json
    weather_prototype_v1/
      weather_model.joblib
      preprocessing.json
      run_summary.json
  data/
    demand_history.csv
```

## 3. Install once

Install 64-bit Python 3.11 and enable Add Python to PATH. Open PowerShell:

```powershell
cd C:\CombinedForecastBackend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Installation requires internet and may take several minutes, especially TensorFlow.
The listed versions match the tested environment. CPU inference works; GPU is not
required. Installation on a clean second machine has not been tested.

## 4. Configure frontend origin and start

For a frontend at http://localhost:5173:

```powershell
cd C:\CombinedForecastBackend
$env:UI_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
.\.venv\Scripts\python.exe -m uvicorn weather_backend.combined_app:app --host 127.0.0.1 --port 8030
```

For port 3000, replace 5173 with 3000. Origins include scheme, hostname and port,
without a trailing slash. Multiple origins are comma-separated. Restart after
changing this setting. Start this one command to run BOTH services. Keep the
terminal open; Ctrl+C stops it. Repeat step 4 after reboot, not installation.

Open http://127.0.0.1:8030/docs. There is no API key for this local application.
Do not expose it publicly; it has no user authentication. Frontend and backend
must run on the same computer for these localhost URLs. A remote hosting setup
requires a separate authenticated deployment and network configuration.

## 5. First test in Swagger

1. Execute GET /api/health. Required artifact flags and history_available should
   be true. loaded=false before the first request is normal (lazy model loading).
2. Execute POST /api/forecast/combined/seven-day. No request body is needed.
3. Wait for completion. Initial model loading and weather retries can take minutes.
4. Check status and errors, then inspect days and predictions.
5. Execute GET /api/forecast/combined/latest to retrieve the saved response.

## 6. API reference

Base URL: http://127.0.0.1:8030

| Method | Endpoint | Action |
|---|---|---|
| GET | /api/health | File availability and demand model load state |
| POST | /api/forecast/combined/seven-day | Run solar and demand concurrently; save a new result |
| GET | /api/forecast/combined/latest | Read most recently published result; does not refresh |
| GET | /api/forecast/combined/latest.csv | Download that result as CSV |

Key response fields:

- forecast_id, generated_at: unique saved run and UTC generation time.
- timezone: Asia/Colombo. hour_start/hour_end include +05:30.
- window_start/window_end: start inclusive, end exclusive.
- status: experimental (both succeeded), partial (one failed).
- errors: per-service failure details. Missing model values are null, never zero.
- demand_mode: historical_seed_scenario; retain this distinction in the UI.
- demand_details.historical_source: actual dates used for the simulated seed.
- solar_details: weather/model provenance and limitations.
- days: exactly seven date cards, each with date, hours, hour_count, partial_day.
- predictions: flat array of the same hourly records.
- age_seconds and stale: included by GET latest; stale after one hour.

Each hourly record contains hour_start, hour_end, predicted_demand_mw,
raw_predicted_demand_mw and predicted_solar_mw. Use predicted_demand_mw for the
calibrated scenario line; retain the raw field for diagnostics. MW means power,
not daily MWh. Energy conversion needs confirmed hourly-average demand semantics.

The backend returns today plus six subsequent local dates. Start is the next full
hour, so past hours and the current incomplete hour are omitted. At 13:20, today's
first value starts 14:00. After 23:00 today's card has zero hours. Following days
contain 24 values. Total is normally less than 168. A 14-hour view is a UI filter;
do not remove hours from the model recursion or fabricate missing values.

Errors: 404 means no latest result, 409 generation already running, 403 origin
not allowed, 503 both services failed. A partial result uses HTTP 200; inspect
status/errors even when response.ok is true. Both-failed attempts are saved but
do not replace the last published result. Downloading CSV does not include all
JSON warnings, so keep the scenario label in the download UI.

## 7. Frontend integration

Use frontend-example.js as a framework-neutral API helper.

1. On dashboard load call loadLatestForecast(). If it returns null, show Generate.
2. On Generate click call generateForecast(), disable the button and show loading.
3. Render forecast.days as the seven cards. Clicking one renders day.hours.
4. Use hour_start for x-axis labels in Asia/Colombo. Never rely on the browser's
   default timezone. Use demand and solar fields as separate chart series.
5. Display null values as gaps / Not available, not zero. Show a partial-day badge.
6. Keep the previous chart during refresh or errors with its original timestamp.
7. Show stale status, errors and demand source dates. No future actual/error values
   exist; display Not available rather than zero or computed fake accuracy.
8. Download using latest CSV after checking that a saved result exists.

Required visible explanation: "Demand scenario based on 2025 history; recent
observations unavailable. Solar forecast is experimental." No curtailment-risk
calculation is supplied by this API. Do not infer operational safety from it.

## 8. Saved results

Local outputs (not automatically Google Drive):

- artifacts/combined_forecasts/<id>/forecast.json
- artifacts/combined_forecasts/<id>/hourly_predictions.csv
- artifacts/combined_forecasts/<id>/scenario_seed_history.csv
- weather_backend/snapshots/: weather retrieval inputs and metadata.
- weather_backend/solar_forecasts/: solar model inputs and results.

Keep model directories unchanged. Optional overrides set before startup:
DEMAND_ARTIFACTS, DEMAND_HISTORY, COMBINED_OUTPUT. Changing DEMAND_HISTORY does not
switch to live mode: this version always constructs an explicitly simulated seed.

## 9. Troubleshooting

- ModuleNotFoundError: install requirements using the same .venv Python as startup.
- Model/history flags false: check extraction nesting and file locations.
- Solar null / partial: read errors.solar; check internet, firewall and weather
  provider response. Demand may still succeed. Retry later; don't invent solar data.
- CORS or 403: match UI_ORIGINS to the browser address exactly and restart backend.
- Port occupied: stop your old server or choose another port. Update frontend
  API_BASE and include the new Swagger origin in UI_ORIGINS.
- Timeouts: allow a few minutes; avoid repeatedly submitting duplicate requests.

Validation performed before handover: model load and recursive demand inference,
live weather + solar inference, combined saved response, and four window/history
tests. This is an integration check, not seven-day forecast accuracy validation.
