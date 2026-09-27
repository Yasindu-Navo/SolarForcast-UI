// Change this only when the backend address changes.
export const API_BASE = 'http://127.0.0.1:8030';

async function readResponse(response) {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Backend ${response.status}: ${detail}`);
  }
  return response.json();
}

export async function loadLatestForecast() {
  const response = await fetch(`${API_BASE}/api/forecast/combined/latest`);
  if (response.status === 404) return null;
  return readResponse(response);
}

export async function generateForecast() {
  const response = await fetch(`${API_BASE}/api/forecast/combined/seven-day`, {
    method: 'POST'
  });
  // A successful HTTP response can still contain status: 'partial'.
  return readResponse(response);
}

export const csvDownloadUrl = `${API_BASE}/api/forecast/combined/latest.csv`;

export function hourLabel(timestamp) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).format(new Date(timestamp));
}

export function selectedDaySeries(forecast, date) {
  const day = forecast.days.find(item => item.date === date);
  return (day?.hours ?? []).map(row => ({
    timestamp: row.hour_start,
    label: hourLabel(row.hour_start),
    demandMW: row.predicted_demand_mw, // Preserve null as a chart gap.
    solarMW: row.predicted_solar_mw
  }));
}
