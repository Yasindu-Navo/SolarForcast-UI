// 7-Day CEB Solar Curtailment Scenario Data (August 24 - August 30)
// Demonstrates grid overgeneration risk during August 26-30 holiday period
// where CEB requested rooftop solar disconnection due to low daytime industrial demand.

export const SAMPLE_FORECAST_DATA = {
  "forecast_id": "ceb_august_curtailment_study_2024",
  "generated_at": "2024-08-24T00:00:00.000000+00:00",
  "status": "ceb_historical_event",
  "timezone": "Asia/Colombo",
  "window_start": "2024-08-24T00:00:00+05:30",
  "window_end": "2024-08-31T00:00:00+05:30",
  "hour_count": 168,
  "units": "MW",
  "demand_mode": "ceb_holiday_curtailment_demonstration",
  "curtailment_event": {
    "event_name": "CEB Long-Weekend Rooftop Solar Curtailment Period",
    "period": "2024-08-24 to 2024-08-30",
    "holiday_period": "2024-08-26 to 2024-08-30",
    "description": "During Aug 26–30 long weekend holidays, industrial shutdown combined with peak solar creates severe daytime overgeneration risk where (Demand - Solar) <= 400 MW. CEB requested rooftop solar disconnection to protect grid stability.",
    "curtailment_hours": "10:00 to 14:00 daily during holiday period",
    "safe_baseline_days": [
      "2024-08-24",
      "2024-08-25"
    ],
    "curtailment_risk_days": [
      "2024-08-26",
      "2024-08-27",
      "2024-08-28",
      "2024-08-29",
      "2024-08-30"
    ]
  },
  "days": [
    {
      "date": "2024-08-24",
      "dayIndex": 0,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": false,
      "holidayName": "Normal Working Weekend",
      "cebAdvisory": "Normal Grid Balance Maintained (No Curtailment Directive)",
      "hours": [
        {
          "hour_start": "2024-08-24T00:00:00+05:30",
          "hour_end": "2024-08-24T01:00:00+05:30",
          "predicted_demand_mw": 1480,
          "raw_predicted_demand_mw": 1485,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T01:00:00+05:30",
          "hour_end": "2024-08-24T02:00:00+05:30",
          "predicted_demand_mw": 1410,
          "raw_predicted_demand_mw": 1406,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T02:00:00+05:30",
          "hour_end": "2024-08-24T03:00:00+05:30",
          "predicted_demand_mw": 1360,
          "raw_predicted_demand_mw": 1356,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T03:00:00+05:30",
          "hour_end": "2024-08-24T04:00:00+05:30",
          "predicted_demand_mw": 1320,
          "raw_predicted_demand_mw": 1325,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T04:00:00+05:30",
          "hour_end": "2024-08-24T05:00:00+05:30",
          "predicted_demand_mw": 1360,
          "raw_predicted_demand_mw": 1356,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T05:00:00+05:30",
          "hour_end": "2024-08-24T06:00:00+05:30",
          "predicted_demand_mw": 1490,
          "raw_predicted_demand_mw": 1486,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T06:00:00+05:30",
          "hour_end": "2024-08-24T07:00:00+05:30",
          "predicted_demand_mw": 1620,
          "raw_predicted_demand_mw": 1625,
          "predicted_solar_mw": 41.6
        },
        {
          "hour_start": "2024-08-24T07:00:00+05:30",
          "hour_end": "2024-08-24T08:00:00+05:30",
          "predicted_demand_mw": 1690,
          "raw_predicted_demand_mw": 1686,
          "predicted_solar_mw": 228.8
        },
        {
          "hour_start": "2024-08-24T08:00:00+05:30",
          "hour_end": "2024-08-24T09:00:00+05:30",
          "predicted_demand_mw": 1750,
          "raw_predicted_demand_mw": 1746,
          "predicted_solar_mw": 540.8
        },
        {
          "hour_start": "2024-08-24T09:00:00+05:30",
          "hour_end": "2024-08-24T10:00:00+05:30",
          "predicted_demand_mw": 1780,
          "raw_predicted_demand_mw": 1785,
          "predicted_solar_mw": 800.8
        },
        {
          "hour_start": "2024-08-24T10:00:00+05:30",
          "hour_end": "2024-08-24T11:00:00+05:30",
          "predicted_demand_mw": 1760,
          "raw_predicted_demand_mw": 1756,
          "predicted_solar_mw": 956.8
        },
        {
          "hour_start": "2024-08-24T11:00:00+05:30",
          "hour_end": "2024-08-24T12:00:00+05:30",
          "predicted_demand_mw": 1730,
          "raw_predicted_demand_mw": 1726,
          "predicted_solar_mw": 1019.2
        },
        {
          "hour_start": "2024-08-24T12:00:00+05:30",
          "hour_end": "2024-08-24T13:00:00+05:30",
          "predicted_demand_mw": 1700,
          "raw_predicted_demand_mw": 1705,
          "predicted_solar_mw": 1040
        },
        {
          "hour_start": "2024-08-24T13:00:00+05:30",
          "hour_end": "2024-08-24T14:00:00+05:30",
          "predicted_demand_mw": 1680,
          "raw_predicted_demand_mw": 1676,
          "predicted_solar_mw": 894.4
        },
        {
          "hour_start": "2024-08-24T14:00:00+05:30",
          "hour_end": "2024-08-24T15:00:00+05:30",
          "predicted_demand_mw": 1710,
          "raw_predicted_demand_mw": 1706,
          "predicted_solar_mw": 748.8
        },
        {
          "hour_start": "2024-08-24T15:00:00+05:30",
          "hour_end": "2024-08-24T16:00:00+05:30",
          "predicted_demand_mw": 1750,
          "raw_predicted_demand_mw": 1755,
          "predicted_solar_mw": 520
        },
        {
          "hour_start": "2024-08-24T16:00:00+05:30",
          "hour_end": "2024-08-24T17:00:00+05:30",
          "predicted_demand_mw": 1840,
          "raw_predicted_demand_mw": 1836,
          "predicted_solar_mw": 270.4
        },
        {
          "hour_start": "2024-08-24T17:00:00+05:30",
          "hour_end": "2024-08-24T18:00:00+05:30",
          "predicted_demand_mw": 2010,
          "raw_predicted_demand_mw": 2006,
          "predicted_solar_mw": 72.8
        },
        {
          "hour_start": "2024-08-24T18:00:00+05:30",
          "hour_end": "2024-08-24T19:00:00+05:30",
          "predicted_demand_mw": 2380,
          "raw_predicted_demand_mw": 2385,
          "predicted_solar_mw": 10.4
        },
        {
          "hour_start": "2024-08-24T19:00:00+05:30",
          "hour_end": "2024-08-24T20:00:00+05:30",
          "predicted_demand_mw": 2460,
          "raw_predicted_demand_mw": 2456,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T20:00:00+05:30",
          "hour_end": "2024-08-24T21:00:00+05:30",
          "predicted_demand_mw": 2370,
          "raw_predicted_demand_mw": 2366,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T21:00:00+05:30",
          "hour_end": "2024-08-24T22:00:00+05:30",
          "predicted_demand_mw": 2140,
          "raw_predicted_demand_mw": 2145,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T22:00:00+05:30",
          "hour_end": "2024-08-24T23:00:00+05:30",
          "predicted_demand_mw": 1910,
          "raw_predicted_demand_mw": 1906,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-24T23:00:00+05:30",
          "hour_end": "2024-08-25T00:00:00+05:30",
          "predicted_demand_mw": 1680,
          "raw_predicted_demand_mw": 1676,
          "predicted_solar_mw": 0
        }
      ]
    },
    {
      "date": "2024-08-25",
      "dayIndex": 1,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": false,
      "holidayName": "Normal Weekend Sunday",
      "cebAdvisory": "Normal Grid Balance Maintained (No Curtailment Directive)",
      "hours": [
        {
          "hour_start": "2024-08-25T00:00:00+05:30",
          "hour_end": "2024-08-25T01:00:00+05:30",
          "predicted_demand_mw": 1445.6,
          "raw_predicted_demand_mw": 1450.6,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T01:00:00+05:30",
          "hour_end": "2024-08-25T02:00:00+05:30",
          "predicted_demand_mw": 1377.2,
          "raw_predicted_demand_mw": 1373.2,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T02:00:00+05:30",
          "hour_end": "2024-08-25T03:00:00+05:30",
          "predicted_demand_mw": 1328.4,
          "raw_predicted_demand_mw": 1324.4,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T03:00:00+05:30",
          "hour_end": "2024-08-25T04:00:00+05:30",
          "predicted_demand_mw": 1289.3,
          "raw_predicted_demand_mw": 1294.3,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T04:00:00+05:30",
          "hour_end": "2024-08-25T05:00:00+05:30",
          "predicted_demand_mw": 1328.4,
          "raw_predicted_demand_mw": 1324.4,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T05:00:00+05:30",
          "hour_end": "2024-08-25T06:00:00+05:30",
          "predicted_demand_mw": 1455.3,
          "raw_predicted_demand_mw": 1451.3,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T06:00:00+05:30",
          "hour_end": "2024-08-25T07:00:00+05:30",
          "predicted_demand_mw": 1582.3,
          "raw_predicted_demand_mw": 1587.3,
          "predicted_solar_mw": 42.4
        },
        {
          "hour_start": "2024-08-25T07:00:00+05:30",
          "hour_end": "2024-08-25T08:00:00+05:30",
          "predicted_demand_mw": 1650.7,
          "raw_predicted_demand_mw": 1646.7,
          "predicted_solar_mw": 233.2
        },
        {
          "hour_start": "2024-08-25T08:00:00+05:30",
          "hour_end": "2024-08-25T09:00:00+05:30",
          "predicted_demand_mw": 1709.3,
          "raw_predicted_demand_mw": 1705.3,
          "predicted_solar_mw": 551.2
        },
        {
          "hour_start": "2024-08-25T09:00:00+05:30",
          "hour_end": "2024-08-25T10:00:00+05:30",
          "predicted_demand_mw": 1738.6,
          "raw_predicted_demand_mw": 1743.6,
          "predicted_solar_mw": 816.2
        },
        {
          "hour_start": "2024-08-25T10:00:00+05:30",
          "hour_end": "2024-08-25T11:00:00+05:30",
          "predicted_demand_mw": 1719.1,
          "raw_predicted_demand_mw": 1715.1,
          "predicted_solar_mw": 975.2
        },
        {
          "hour_start": "2024-08-25T11:00:00+05:30",
          "hour_end": "2024-08-25T12:00:00+05:30",
          "predicted_demand_mw": 1689.8,
          "raw_predicted_demand_mw": 1685.8,
          "predicted_solar_mw": 1038.8
        },
        {
          "hour_start": "2024-08-25T12:00:00+05:30",
          "hour_end": "2024-08-25T13:00:00+05:30",
          "predicted_demand_mw": 1660.5,
          "raw_predicted_demand_mw": 1665.5,
          "predicted_solar_mw": 1060
        },
        {
          "hour_start": "2024-08-25T13:00:00+05:30",
          "hour_end": "2024-08-25T14:00:00+05:30",
          "predicted_demand_mw": 1640.9,
          "raw_predicted_demand_mw": 1636.9,
          "predicted_solar_mw": 911.6
        },
        {
          "hour_start": "2024-08-25T14:00:00+05:30",
          "hour_end": "2024-08-25T15:00:00+05:30",
          "predicted_demand_mw": 1670.2,
          "raw_predicted_demand_mw": 1666.2,
          "predicted_solar_mw": 763.2
        },
        {
          "hour_start": "2024-08-25T15:00:00+05:30",
          "hour_end": "2024-08-25T16:00:00+05:30",
          "predicted_demand_mw": 1709.3,
          "raw_predicted_demand_mw": 1714.3,
          "predicted_solar_mw": 530
        },
        {
          "hour_start": "2024-08-25T16:00:00+05:30",
          "hour_end": "2024-08-25T17:00:00+05:30",
          "predicted_demand_mw": 1797.2,
          "raw_predicted_demand_mw": 1793.2,
          "predicted_solar_mw": 275.6
        },
        {
          "hour_start": "2024-08-25T17:00:00+05:30",
          "hour_end": "2024-08-25T18:00:00+05:30",
          "predicted_demand_mw": 1963.3,
          "raw_predicted_demand_mw": 1959.3,
          "predicted_solar_mw": 74.2
        },
        {
          "hour_start": "2024-08-25T18:00:00+05:30",
          "hour_end": "2024-08-25T19:00:00+05:30",
          "predicted_demand_mw": 2324.7,
          "raw_predicted_demand_mw": 2329.7,
          "predicted_solar_mw": 10.6
        },
        {
          "hour_start": "2024-08-25T19:00:00+05:30",
          "hour_end": "2024-08-25T20:00:00+05:30",
          "predicted_demand_mw": 2402.8,
          "raw_predicted_demand_mw": 2398.8,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T20:00:00+05:30",
          "hour_end": "2024-08-25T21:00:00+05:30",
          "predicted_demand_mw": 2314.9,
          "raw_predicted_demand_mw": 2310.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T21:00:00+05:30",
          "hour_end": "2024-08-25T22:00:00+05:30",
          "predicted_demand_mw": 2090.2,
          "raw_predicted_demand_mw": 2095.2,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T22:00:00+05:30",
          "hour_end": "2024-08-25T23:00:00+05:30",
          "predicted_demand_mw": 1865.6,
          "raw_predicted_demand_mw": 1861.6,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-25T23:00:00+05:30",
          "hour_end": "2024-08-26T00:00:00+05:30",
          "predicted_demand_mw": 1640.9,
          "raw_predicted_demand_mw": 1636.9,
          "predicted_solar_mw": 0
        }
      ]
    },
    {
      "date": "2024-08-26",
      "dayIndex": 2,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": true,
      "holidayName": "CEB Curtailment Advisory - Holiday Day 1",
      "cebAdvisory": "CEB Solar Switch-Off Notice Active (10:00 - 14:00)",
      "hours": [
        {
          "hour_start": "2024-08-26T00:00:00+05:30",
          "hour_end": "2024-08-26T01:00:00+05:30",
          "predicted_demand_mw": 1331.3,
          "raw_predicted_demand_mw": 1336.3,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T01:00:00+05:30",
          "hour_end": "2024-08-26T02:00:00+05:30",
          "predicted_demand_mw": 1270.8,
          "raw_predicted_demand_mw": 1266.8,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T02:00:00+05:30",
          "hour_end": "2024-08-26T03:00:00+05:30",
          "predicted_demand_mw": 1230.4,
          "raw_predicted_demand_mw": 1226.4,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T03:00:00+05:30",
          "hour_end": "2024-08-26T04:00:00+05:30",
          "predicted_demand_mw": 1190.1,
          "raw_predicted_demand_mw": 1195.1,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T04:00:00+05:30",
          "hour_end": "2024-08-26T05:00:00+05:30",
          "predicted_demand_mw": 1220.3,
          "raw_predicted_demand_mw": 1216.3,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T05:00:00+05:30",
          "hour_end": "2024-08-26T06:00:00+05:30",
          "predicted_demand_mw": 1280.9,
          "raw_predicted_demand_mw": 1276.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T06:00:00+05:30",
          "hour_end": "2024-08-26T07:00:00+05:30",
          "predicted_demand_mw": 1321.2,
          "raw_predicted_demand_mw": 1326.2,
          "predicted_solar_mw": 45.6
        },
        {
          "hour_start": "2024-08-26T07:00:00+05:30",
          "hour_end": "2024-08-26T08:00:00+05:30",
          "predicted_demand_mw": 1301,
          "raw_predicted_demand_mw": 1297,
          "predicted_solar_mw": 250.8
        },
        {
          "hour_start": "2024-08-26T08:00:00+05:30",
          "hour_end": "2024-08-26T09:00:00+05:30",
          "predicted_demand_mw": 1290.9,
          "raw_predicted_demand_mw": 1286.9,
          "predicted_solar_mw": 592.8
        },
        {
          "hour_start": "2024-08-26T09:00:00+05:30",
          "hour_end": "2024-08-26T10:00:00+05:30",
          "predicted_demand_mw": 1260.7,
          "raw_predicted_demand_mw": 1265.7,
          "predicted_solar_mw": 877.8
        },
        {
          "hour_start": "2024-08-26T10:00:00+05:30",
          "hour_end": "2024-08-26T11:00:00+05:30",
          "predicted_demand_mw": 1230.4,
          "raw_predicted_demand_mw": 1226.4,
          "predicted_solar_mw": 1048.8
        },
        {
          "hour_start": "2024-08-26T11:00:00+05:30",
          "hour_end": "2024-08-26T12:00:00+05:30",
          "predicted_demand_mw": 1200.2,
          "raw_predicted_demand_mw": 1196.2,
          "predicted_solar_mw": 1117.2
        },
        {
          "hour_start": "2024-08-26T12:00:00+05:30",
          "hour_end": "2024-08-26T13:00:00+05:30",
          "predicted_demand_mw": 1169.9,
          "raw_predicted_demand_mw": 1174.9,
          "predicted_solar_mw": 1140
        },
        {
          "hour_start": "2024-08-26T13:00:00+05:30",
          "hour_end": "2024-08-26T14:00:00+05:30",
          "predicted_demand_mw": 1180,
          "raw_predicted_demand_mw": 1176,
          "predicted_solar_mw": 980.4
        },
        {
          "hour_start": "2024-08-26T14:00:00+05:30",
          "hour_end": "2024-08-26T15:00:00+05:30",
          "predicted_demand_mw": 1220.3,
          "raw_predicted_demand_mw": 1216.3,
          "predicted_solar_mw": 820.8
        },
        {
          "hour_start": "2024-08-26T15:00:00+05:30",
          "hour_end": "2024-08-26T16:00:00+05:30",
          "predicted_demand_mw": 1260.7,
          "raw_predicted_demand_mw": 1265.7,
          "predicted_solar_mw": 570
        },
        {
          "hour_start": "2024-08-26T16:00:00+05:30",
          "hour_end": "2024-08-26T17:00:00+05:30",
          "predicted_demand_mw": 1371.6,
          "raw_predicted_demand_mw": 1367.6,
          "predicted_solar_mw": 296.4
        },
        {
          "hour_start": "2024-08-26T17:00:00+05:30",
          "hour_end": "2024-08-26T18:00:00+05:30",
          "predicted_demand_mw": 1704.4,
          "raw_predicted_demand_mw": 1700.4,
          "predicted_solar_mw": 79.8
        },
        {
          "hour_start": "2024-08-26T18:00:00+05:30",
          "hour_end": "2024-08-26T19:00:00+05:30",
          "predicted_demand_mw": 2138.1,
          "raw_predicted_demand_mw": 2143.1,
          "predicted_solar_mw": 11.4
        },
        {
          "hour_start": "2024-08-26T19:00:00+05:30",
          "hour_end": "2024-08-26T20:00:00+05:30",
          "predicted_demand_mw": 2228.9,
          "raw_predicted_demand_mw": 2224.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T20:00:00+05:30",
          "hour_end": "2024-08-26T21:00:00+05:30",
          "predicted_demand_mw": 2128,
          "raw_predicted_demand_mw": 2124,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T21:00:00+05:30",
          "hour_end": "2024-08-26T22:00:00+05:30",
          "predicted_demand_mw": 1886,
          "raw_predicted_demand_mw": 1891,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T22:00:00+05:30",
          "hour_end": "2024-08-26T23:00:00+05:30",
          "predicted_demand_mw": 1654,
          "raw_predicted_demand_mw": 1650,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-26T23:00:00+05:30",
          "hour_end": "2024-08-27T00:00:00+05:30",
          "predicted_demand_mw": 1462.4,
          "raw_predicted_demand_mw": 1458.4,
          "predicted_solar_mw": 0
        }
      ]
    },
    {
      "date": "2024-08-27",
      "dayIndex": 3,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": true,
      "holidayName": "CEB Curtailment Advisory - Holiday Day 2",
      "cebAdvisory": "CEB Solar Switch-Off Notice Active (10:00 - 14:00)",
      "hours": [
        {
          "hour_start": "2024-08-27T00:00:00+05:30",
          "hour_end": "2024-08-27T01:00:00+05:30",
          "predicted_demand_mw": 1308.7,
          "raw_predicted_demand_mw": 1313.7,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T01:00:00+05:30",
          "hour_end": "2024-08-27T02:00:00+05:30",
          "predicted_demand_mw": 1249.2,
          "raw_predicted_demand_mw": 1245.2,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T02:00:00+05:30",
          "hour_end": "2024-08-27T03:00:00+05:30",
          "predicted_demand_mw": 1209.6,
          "raw_predicted_demand_mw": 1205.6,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T03:00:00+05:30",
          "hour_end": "2024-08-27T04:00:00+05:30",
          "predicted_demand_mw": 1169.9,
          "raw_predicted_demand_mw": 1174.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T04:00:00+05:30",
          "hour_end": "2024-08-27T05:00:00+05:30",
          "predicted_demand_mw": 1199.7,
          "raw_predicted_demand_mw": 1195.7,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T05:00:00+05:30",
          "hour_end": "2024-08-27T06:00:00+05:30",
          "predicted_demand_mw": 1259.1,
          "raw_predicted_demand_mw": 1255.1,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T06:00:00+05:30",
          "hour_end": "2024-08-27T07:00:00+05:30",
          "predicted_demand_mw": 1298.8,
          "raw_predicted_demand_mw": 1303.8,
          "predicted_solar_mw": 47.2
        },
        {
          "hour_start": "2024-08-27T07:00:00+05:30",
          "hour_end": "2024-08-27T08:00:00+05:30",
          "predicted_demand_mw": 1279,
          "raw_predicted_demand_mw": 1275,
          "predicted_solar_mw": 259.6
        },
        {
          "hour_start": "2024-08-27T08:00:00+05:30",
          "hour_end": "2024-08-27T09:00:00+05:30",
          "predicted_demand_mw": 1269.1,
          "raw_predicted_demand_mw": 1265.1,
          "predicted_solar_mw": 613.6
        },
        {
          "hour_start": "2024-08-27T09:00:00+05:30",
          "hour_end": "2024-08-27T10:00:00+05:30",
          "predicted_demand_mw": 1239.3,
          "raw_predicted_demand_mw": 1244.3,
          "predicted_solar_mw": 908.6
        },
        {
          "hour_start": "2024-08-27T10:00:00+05:30",
          "hour_end": "2024-08-27T11:00:00+05:30",
          "predicted_demand_mw": 1209.6,
          "raw_predicted_demand_mw": 1205.6,
          "predicted_solar_mw": 1085.6
        },
        {
          "hour_start": "2024-08-27T11:00:00+05:30",
          "hour_end": "2024-08-27T12:00:00+05:30",
          "predicted_demand_mw": 1179.8,
          "raw_predicted_demand_mw": 1175.8,
          "predicted_solar_mw": 1156.4
        },
        {
          "hour_start": "2024-08-27T12:00:00+05:30",
          "hour_end": "2024-08-27T13:00:00+05:30",
          "predicted_demand_mw": 1150.1,
          "raw_predicted_demand_mw": 1155.1,
          "predicted_solar_mw": 1180
        },
        {
          "hour_start": "2024-08-27T13:00:00+05:30",
          "hour_end": "2024-08-27T14:00:00+05:30",
          "predicted_demand_mw": 1160,
          "raw_predicted_demand_mw": 1156,
          "predicted_solar_mw": 1014.8
        },
        {
          "hour_start": "2024-08-27T14:00:00+05:30",
          "hour_end": "2024-08-27T15:00:00+05:30",
          "predicted_demand_mw": 1199.7,
          "raw_predicted_demand_mw": 1195.7,
          "predicted_solar_mw": 849.6
        },
        {
          "hour_start": "2024-08-27T15:00:00+05:30",
          "hour_end": "2024-08-27T16:00:00+05:30",
          "predicted_demand_mw": 1239.3,
          "raw_predicted_demand_mw": 1244.3,
          "predicted_solar_mw": 590
        },
        {
          "hour_start": "2024-08-27T16:00:00+05:30",
          "hour_end": "2024-08-27T17:00:00+05:30",
          "predicted_demand_mw": 1348.4,
          "raw_predicted_demand_mw": 1344.4,
          "predicted_solar_mw": 306.8
        },
        {
          "hour_start": "2024-08-27T17:00:00+05:30",
          "hour_end": "2024-08-27T18:00:00+05:30",
          "predicted_demand_mw": 1675.6,
          "raw_predicted_demand_mw": 1671.6,
          "predicted_solar_mw": 82.6
        },
        {
          "hour_start": "2024-08-27T18:00:00+05:30",
          "hour_end": "2024-08-27T19:00:00+05:30",
          "predicted_demand_mw": 2101.9,
          "raw_predicted_demand_mw": 2106.9,
          "predicted_solar_mw": 11.8
        },
        {
          "hour_start": "2024-08-27T19:00:00+05:30",
          "hour_end": "2024-08-27T20:00:00+05:30",
          "predicted_demand_mw": 2191.1,
          "raw_predicted_demand_mw": 2187.1,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T20:00:00+05:30",
          "hour_end": "2024-08-27T21:00:00+05:30",
          "predicted_demand_mw": 2092,
          "raw_predicted_demand_mw": 2088,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T21:00:00+05:30",
          "hour_end": "2024-08-27T22:00:00+05:30",
          "predicted_demand_mw": 1854,
          "raw_predicted_demand_mw": 1859,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T22:00:00+05:30",
          "hour_end": "2024-08-27T23:00:00+05:30",
          "predicted_demand_mw": 1626,
          "raw_predicted_demand_mw": 1622,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-27T23:00:00+05:30",
          "hour_end": "2024-08-28T00:00:00+05:30",
          "predicted_demand_mw": 1437.6,
          "raw_predicted_demand_mw": 1433.6,
          "predicted_solar_mw": 0
        }
      ]
    },
    {
      "date": "2024-08-28",
      "dayIndex": 4,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": true,
      "holidayName": "CEB Curtailment Advisory - Holiday Day 3",
      "cebAdvisory": "CEB Solar Switch-Off Notice Active (10:00 - 14:00)",
      "hours": [
        {
          "hour_start": "2024-08-28T00:00:00+05:30",
          "hour_end": "2024-08-28T01:00:00+05:30",
          "predicted_demand_mw": 1320,
          "raw_predicted_demand_mw": 1325,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T01:00:00+05:30",
          "hour_end": "2024-08-28T02:00:00+05:30",
          "predicted_demand_mw": 1260,
          "raw_predicted_demand_mw": 1256,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T02:00:00+05:30",
          "hour_end": "2024-08-28T03:00:00+05:30",
          "predicted_demand_mw": 1220,
          "raw_predicted_demand_mw": 1216,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T03:00:00+05:30",
          "hour_end": "2024-08-28T04:00:00+05:30",
          "predicted_demand_mw": 1180,
          "raw_predicted_demand_mw": 1185,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T04:00:00+05:30",
          "hour_end": "2024-08-28T05:00:00+05:30",
          "predicted_demand_mw": 1210,
          "raw_predicted_demand_mw": 1206,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T05:00:00+05:30",
          "hour_end": "2024-08-28T06:00:00+05:30",
          "predicted_demand_mw": 1270,
          "raw_predicted_demand_mw": 1266,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T06:00:00+05:30",
          "hour_end": "2024-08-28T07:00:00+05:30",
          "predicted_demand_mw": 1310,
          "raw_predicted_demand_mw": 1315,
          "predicted_solar_mw": 44.8
        },
        {
          "hour_start": "2024-08-28T07:00:00+05:30",
          "hour_end": "2024-08-28T08:00:00+05:30",
          "predicted_demand_mw": 1290,
          "raw_predicted_demand_mw": 1286,
          "predicted_solar_mw": 246.4
        },
        {
          "hour_start": "2024-08-28T08:00:00+05:30",
          "hour_end": "2024-08-28T09:00:00+05:30",
          "predicted_demand_mw": 1280,
          "raw_predicted_demand_mw": 1276,
          "predicted_solar_mw": 582.4
        },
        {
          "hour_start": "2024-08-28T09:00:00+05:30",
          "hour_end": "2024-08-28T10:00:00+05:30",
          "predicted_demand_mw": 1250,
          "raw_predicted_demand_mw": 1255,
          "predicted_solar_mw": 862.4
        },
        {
          "hour_start": "2024-08-28T10:00:00+05:30",
          "hour_end": "2024-08-28T11:00:00+05:30",
          "predicted_demand_mw": 1220,
          "raw_predicted_demand_mw": 1216,
          "predicted_solar_mw": 1030.4
        },
        {
          "hour_start": "2024-08-28T11:00:00+05:30",
          "hour_end": "2024-08-28T12:00:00+05:30",
          "predicted_demand_mw": 1190,
          "raw_predicted_demand_mw": 1186,
          "predicted_solar_mw": 1097.6
        },
        {
          "hour_start": "2024-08-28T12:00:00+05:30",
          "hour_end": "2024-08-28T13:00:00+05:30",
          "predicted_demand_mw": 1160,
          "raw_predicted_demand_mw": 1165,
          "predicted_solar_mw": 1120
        },
        {
          "hour_start": "2024-08-28T13:00:00+05:30",
          "hour_end": "2024-08-28T14:00:00+05:30",
          "predicted_demand_mw": 1170,
          "raw_predicted_demand_mw": 1166,
          "predicted_solar_mw": 963.2
        },
        {
          "hour_start": "2024-08-28T14:00:00+05:30",
          "hour_end": "2024-08-28T15:00:00+05:30",
          "predicted_demand_mw": 1210,
          "raw_predicted_demand_mw": 1206,
          "predicted_solar_mw": 806.4
        },
        {
          "hour_start": "2024-08-28T15:00:00+05:30",
          "hour_end": "2024-08-28T16:00:00+05:30",
          "predicted_demand_mw": 1250,
          "raw_predicted_demand_mw": 1255,
          "predicted_solar_mw": 560
        },
        {
          "hour_start": "2024-08-28T16:00:00+05:30",
          "hour_end": "2024-08-28T17:00:00+05:30",
          "predicted_demand_mw": 1360,
          "raw_predicted_demand_mw": 1356,
          "predicted_solar_mw": 291.2
        },
        {
          "hour_start": "2024-08-28T17:00:00+05:30",
          "hour_end": "2024-08-28T18:00:00+05:30",
          "predicted_demand_mw": 1690,
          "raw_predicted_demand_mw": 1686,
          "predicted_solar_mw": 78.4
        },
        {
          "hour_start": "2024-08-28T18:00:00+05:30",
          "hour_end": "2024-08-28T19:00:00+05:30",
          "predicted_demand_mw": 2120,
          "raw_predicted_demand_mw": 2125,
          "predicted_solar_mw": 11.2
        },
        {
          "hour_start": "2024-08-28T19:00:00+05:30",
          "hour_end": "2024-08-28T20:00:00+05:30",
          "predicted_demand_mw": 2210,
          "raw_predicted_demand_mw": 2206,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T20:00:00+05:30",
          "hour_end": "2024-08-28T21:00:00+05:30",
          "predicted_demand_mw": 2110,
          "raw_predicted_demand_mw": 2106,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T21:00:00+05:30",
          "hour_end": "2024-08-28T22:00:00+05:30",
          "predicted_demand_mw": 1870,
          "raw_predicted_demand_mw": 1875,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T22:00:00+05:30",
          "hour_end": "2024-08-28T23:00:00+05:30",
          "predicted_demand_mw": 1640,
          "raw_predicted_demand_mw": 1636,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-28T23:00:00+05:30",
          "hour_end": "2024-08-29T00:00:00+05:30",
          "predicted_demand_mw": 1450,
          "raw_predicted_demand_mw": 1446,
          "predicted_solar_mw": 0
        }
      ]
    },
    {
      "date": "2024-08-29",
      "dayIndex": 5,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": true,
      "holidayName": "CEB Curtailment Advisory - Holiday Day 4",
      "cebAdvisory": "CEB Solar Switch-Off Notice Active (10:00 - 14:00)",
      "hours": [
        {
          "hour_start": "2024-08-29T00:00:00+05:30",
          "hour_end": "2024-08-29T01:00:00+05:30",
          "predicted_demand_mw": 1331.3,
          "raw_predicted_demand_mw": 1336.3,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T01:00:00+05:30",
          "hour_end": "2024-08-29T02:00:00+05:30",
          "predicted_demand_mw": 1270.8,
          "raw_predicted_demand_mw": 1266.8,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T02:00:00+05:30",
          "hour_end": "2024-08-29T03:00:00+05:30",
          "predicted_demand_mw": 1230.4,
          "raw_predicted_demand_mw": 1226.4,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T03:00:00+05:30",
          "hour_end": "2024-08-29T04:00:00+05:30",
          "predicted_demand_mw": 1190.1,
          "raw_predicted_demand_mw": 1195.1,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T04:00:00+05:30",
          "hour_end": "2024-08-29T05:00:00+05:30",
          "predicted_demand_mw": 1220.3,
          "raw_predicted_demand_mw": 1216.3,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T05:00:00+05:30",
          "hour_end": "2024-08-29T06:00:00+05:30",
          "predicted_demand_mw": 1280.9,
          "raw_predicted_demand_mw": 1276.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T06:00:00+05:30",
          "hour_end": "2024-08-29T07:00:00+05:30",
          "predicted_demand_mw": 1321.2,
          "raw_predicted_demand_mw": 1326.2,
          "predicted_solar_mw": 46
        },
        {
          "hour_start": "2024-08-29T07:00:00+05:30",
          "hour_end": "2024-08-29T08:00:00+05:30",
          "predicted_demand_mw": 1301,
          "raw_predicted_demand_mw": 1297,
          "predicted_solar_mw": 253
        },
        {
          "hour_start": "2024-08-29T08:00:00+05:30",
          "hour_end": "2024-08-29T09:00:00+05:30",
          "predicted_demand_mw": 1290.9,
          "raw_predicted_demand_mw": 1286.9,
          "predicted_solar_mw": 598
        },
        {
          "hour_start": "2024-08-29T09:00:00+05:30",
          "hour_end": "2024-08-29T10:00:00+05:30",
          "predicted_demand_mw": 1260.7,
          "raw_predicted_demand_mw": 1265.7,
          "predicted_solar_mw": 885.5
        },
        {
          "hour_start": "2024-08-29T10:00:00+05:30",
          "hour_end": "2024-08-29T11:00:00+05:30",
          "predicted_demand_mw": 1230.4,
          "raw_predicted_demand_mw": 1226.4,
          "predicted_solar_mw": 1058
        },
        {
          "hour_start": "2024-08-29T11:00:00+05:30",
          "hour_end": "2024-08-29T12:00:00+05:30",
          "predicted_demand_mw": 1200.2,
          "raw_predicted_demand_mw": 1196.2,
          "predicted_solar_mw": 1127
        },
        {
          "hour_start": "2024-08-29T12:00:00+05:30",
          "hour_end": "2024-08-29T13:00:00+05:30",
          "predicted_demand_mw": 1169.9,
          "raw_predicted_demand_mw": 1174.9,
          "predicted_solar_mw": 1150
        },
        {
          "hour_start": "2024-08-29T13:00:00+05:30",
          "hour_end": "2024-08-29T14:00:00+05:30",
          "predicted_demand_mw": 1180,
          "raw_predicted_demand_mw": 1176,
          "predicted_solar_mw": 989
        },
        {
          "hour_start": "2024-08-29T14:00:00+05:30",
          "hour_end": "2024-08-29T15:00:00+05:30",
          "predicted_demand_mw": 1220.3,
          "raw_predicted_demand_mw": 1216.3,
          "predicted_solar_mw": 828
        },
        {
          "hour_start": "2024-08-29T15:00:00+05:30",
          "hour_end": "2024-08-29T16:00:00+05:30",
          "predicted_demand_mw": 1260.7,
          "raw_predicted_demand_mw": 1265.7,
          "predicted_solar_mw": 575
        },
        {
          "hour_start": "2024-08-29T16:00:00+05:30",
          "hour_end": "2024-08-29T17:00:00+05:30",
          "predicted_demand_mw": 1371.6,
          "raw_predicted_demand_mw": 1367.6,
          "predicted_solar_mw": 299
        },
        {
          "hour_start": "2024-08-29T17:00:00+05:30",
          "hour_end": "2024-08-29T18:00:00+05:30",
          "predicted_demand_mw": 1704.4,
          "raw_predicted_demand_mw": 1700.4,
          "predicted_solar_mw": 80.5
        },
        {
          "hour_start": "2024-08-29T18:00:00+05:30",
          "hour_end": "2024-08-29T19:00:00+05:30",
          "predicted_demand_mw": 2138.1,
          "raw_predicted_demand_mw": 2143.1,
          "predicted_solar_mw": 11.5
        },
        {
          "hour_start": "2024-08-29T19:00:00+05:30",
          "hour_end": "2024-08-29T20:00:00+05:30",
          "predicted_demand_mw": 2228.9,
          "raw_predicted_demand_mw": 2224.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T20:00:00+05:30",
          "hour_end": "2024-08-29T21:00:00+05:30",
          "predicted_demand_mw": 2128,
          "raw_predicted_demand_mw": 2124,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T21:00:00+05:30",
          "hour_end": "2024-08-29T22:00:00+05:30",
          "predicted_demand_mw": 1886,
          "raw_predicted_demand_mw": 1891,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T22:00:00+05:30",
          "hour_end": "2024-08-29T23:00:00+05:30",
          "predicted_demand_mw": 1654,
          "raw_predicted_demand_mw": 1650,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-29T23:00:00+05:30",
          "hour_end": "2024-08-30T00:00:00+05:30",
          "predicted_demand_mw": 1462.4,
          "raw_predicted_demand_mw": 1458.4,
          "predicted_solar_mw": 0
        }
      ]
    },
    {
      "date": "2024-08-30",
      "dayIndex": 6,
      "hour_count": 24,
      "partial_day": false,
      "isHoliday": true,
      "holidayName": "CEB Curtailment Advisory - Holiday Day 5",
      "cebAdvisory": "CEB Solar Switch-Off Notice Active (10:00 - 14:00)",
      "hours": [
        {
          "hour_start": "2024-08-30T00:00:00+05:30",
          "hour_end": "2024-08-30T01:00:00+05:30",
          "predicted_demand_mw": 1342.6,
          "raw_predicted_demand_mw": 1347.6,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T01:00:00+05:30",
          "hour_end": "2024-08-30T02:00:00+05:30",
          "predicted_demand_mw": 1281.5,
          "raw_predicted_demand_mw": 1277.5,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T02:00:00+05:30",
          "hour_end": "2024-08-30T03:00:00+05:30",
          "predicted_demand_mw": 1240.9,
          "raw_predicted_demand_mw": 1236.9,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T03:00:00+05:30",
          "hour_end": "2024-08-30T04:00:00+05:30",
          "predicted_demand_mw": 1200.2,
          "raw_predicted_demand_mw": 1205.2,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T04:00:00+05:30",
          "hour_end": "2024-08-30T05:00:00+05:30",
          "predicted_demand_mw": 1230.7,
          "raw_predicted_demand_mw": 1226.7,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T05:00:00+05:30",
          "hour_end": "2024-08-30T06:00:00+05:30",
          "predicted_demand_mw": 1291.7,
          "raw_predicted_demand_mw": 1287.7,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T06:00:00+05:30",
          "hour_end": "2024-08-30T07:00:00+05:30",
          "predicted_demand_mw": 1332.4,
          "raw_predicted_demand_mw": 1337.4,
          "predicted_solar_mw": 44
        },
        {
          "hour_start": "2024-08-30T07:00:00+05:30",
          "hour_end": "2024-08-30T08:00:00+05:30",
          "predicted_demand_mw": 1312.1,
          "raw_predicted_demand_mw": 1308.1,
          "predicted_solar_mw": 242
        },
        {
          "hour_start": "2024-08-30T08:00:00+05:30",
          "hour_end": "2024-08-30T09:00:00+05:30",
          "predicted_demand_mw": 1301.9,
          "raw_predicted_demand_mw": 1297.9,
          "predicted_solar_mw": 572
        },
        {
          "hour_start": "2024-08-30T09:00:00+05:30",
          "hour_end": "2024-08-30T10:00:00+05:30",
          "predicted_demand_mw": 1271.4,
          "raw_predicted_demand_mw": 1276.4,
          "predicted_solar_mw": 847
        },
        {
          "hour_start": "2024-08-30T10:00:00+05:30",
          "hour_end": "2024-08-30T11:00:00+05:30",
          "predicted_demand_mw": 1240.9,
          "raw_predicted_demand_mw": 1236.9,
          "predicted_solar_mw": 1012
        },
        {
          "hour_start": "2024-08-30T11:00:00+05:30",
          "hour_end": "2024-08-30T12:00:00+05:30",
          "predicted_demand_mw": 1210.3,
          "raw_predicted_demand_mw": 1206.3,
          "predicted_solar_mw": 1078
        },
        {
          "hour_start": "2024-08-30T12:00:00+05:30",
          "hour_end": "2024-08-30T13:00:00+05:30",
          "predicted_demand_mw": 1179.8,
          "raw_predicted_demand_mw": 1184.8,
          "predicted_solar_mw": 1100
        },
        {
          "hour_start": "2024-08-30T13:00:00+05:30",
          "hour_end": "2024-08-30T14:00:00+05:30",
          "predicted_demand_mw": 1190,
          "raw_predicted_demand_mw": 1186,
          "predicted_solar_mw": 946
        },
        {
          "hour_start": "2024-08-30T14:00:00+05:30",
          "hour_end": "2024-08-30T15:00:00+05:30",
          "predicted_demand_mw": 1230.7,
          "raw_predicted_demand_mw": 1226.7,
          "predicted_solar_mw": 792
        },
        {
          "hour_start": "2024-08-30T15:00:00+05:30",
          "hour_end": "2024-08-30T16:00:00+05:30",
          "predicted_demand_mw": 1271.4,
          "raw_predicted_demand_mw": 1276.4,
          "predicted_solar_mw": 550
        },
        {
          "hour_start": "2024-08-30T16:00:00+05:30",
          "hour_end": "2024-08-30T17:00:00+05:30",
          "predicted_demand_mw": 1383.2,
          "raw_predicted_demand_mw": 1379.2,
          "predicted_solar_mw": 286
        },
        {
          "hour_start": "2024-08-30T17:00:00+05:30",
          "hour_end": "2024-08-30T18:00:00+05:30",
          "predicted_demand_mw": 1718.9,
          "raw_predicted_demand_mw": 1714.9,
          "predicted_solar_mw": 77
        },
        {
          "hour_start": "2024-08-30T18:00:00+05:30",
          "hour_end": "2024-08-30T19:00:00+05:30",
          "predicted_demand_mw": 2156.2,
          "raw_predicted_demand_mw": 2161.2,
          "predicted_solar_mw": 11
        },
        {
          "hour_start": "2024-08-30T19:00:00+05:30",
          "hour_end": "2024-08-30T20:00:00+05:30",
          "predicted_demand_mw": 2247.8,
          "raw_predicted_demand_mw": 2243.8,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T20:00:00+05:30",
          "hour_end": "2024-08-30T21:00:00+05:30",
          "predicted_demand_mw": 2146.1,
          "raw_predicted_demand_mw": 2142.1,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T21:00:00+05:30",
          "hour_end": "2024-08-30T22:00:00+05:30",
          "predicted_demand_mw": 1902,
          "raw_predicted_demand_mw": 1907,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T22:00:00+05:30",
          "hour_end": "2024-08-30T23:00:00+05:30",
          "predicted_demand_mw": 1668,
          "raw_predicted_demand_mw": 1664,
          "predicted_solar_mw": 0
        },
        {
          "hour_start": "2024-08-30T23:00:00+05:30",
          "hour_end": "2024-08-31T00:00:00+05:30",
          "predicted_demand_mw": 1474.8,
          "raw_predicted_demand_mw": 1470.8,
          "predicted_solar_mw": 0
        }
      ]
    }
  ]
};
