import { SAMPLE_FORECAST_DATA } from './sampleData';

// API base address pointing to CombinedForecastBackend
export const API_BASE = 'http://localhost:8030';
export const CSV_DOWNLOAD_URL = `${API_BASE}/api/forecast/combined/latest.csv`;

/**
 * Extract the hour in 0-23 format from ISO timestamp string.
 * Uses string parsing on timezone-annotated timestamps (e.g. 2026-09-27T21:00:00+05:30)
 * to prevent client browser timezone skew.
 */
export function getColomboHour(isoString) {
  if (typeof isoString === 'string' && isoString.includes('T')) {
    const timePart = isoString.split('T')[1];
    if (timePart) {
      return parseInt(timePart.slice(0, 2), 10);
    }
  }
  const d = new Date(isoString);
  return d.getHours();
}

/**
 * Format hour label e.g. "14:00"
 */
export function formatHourLabel(isoString) {
  if (typeof isoString === 'string' && isoString.includes('T')) {
    const timePart = isoString.split('T')[1];
    if (timePart) {
      return timePart.slice(0, 5);
    }
  }
  const d = new Date(isoString);
  return `${d.getHours().toString().padStart(2, '0')}:00`;
}

/**
 * Format date string e.g. "2026-09-28" to "Mon, Sep 28"
 */
export function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Midday Valley Calculation:
 * Hour between 12:00 PM and 6:00 PM (12 to 18)
 * which solar prediction value has highest difference (drop) from the upper hour solar predictions.
 * e.g. solar predictions of 12, 13, 14, 15 hours as 1000, 900, 300, 250 -> midday valley is hour 14 (difference 600).
 */
export function calculateMiddayValley(hours) {
  if (!hours || hours.length === 0) return null;

  // Build a lookup map by Colombo hour number (0 to 23)
  const hourMap = new Map();
  hours.forEach((h) => {
    const hr = getColomboHour(h.hour_start);
    hourMap.set(hr, {
      ...h,
      colomboHour: hr,
      solarMW: h.predicted_solar_mw ?? 0,
      demandMW: h.predicted_demand_mw ?? 0,
    });
  });

  let maxDiff = -Infinity;
  let valleyHourCandidate = null;

  // Search window between 12:00 PM (12) and 6:00 PM (18)
  for (let hr = 12; hr <= 18; hr++) {
    const current = hourMap.get(hr);
    if (!current) continue;

    // The "upper hour" is the previous hour (hr - 1)
    const upper = hourMap.get(hr - 1);
    if (!upper) continue;

    const currentSolar = current.solarMW;
    const upperSolar = upper.solarMW;
    const diff = upperSolar - currentSolar; // drop from upper hour

    if (diff > maxDiff) {
      maxDiff = diff;
      valleyHourCandidate = {
        hour: hr,
        solarMW: currentSolar,
        dropDiff: diff,
        hour_start: current.hour_start,
        hour_end: current.hour_end,
      };
    }
  }

  return valleyHourCandidate;
}

/**
 * Normalizes forecast days from API response into clean UI structures.
 */
export function processForecastDays(days) {
  if (!Array.isArray(days)) return [];

  return days.map((dayItem, index) => {
    const hours = (dayItem.hours || []).map((h) => {
      const solarMW = h.predicted_solar_mw ?? 0;
      const demandMW = h.predicted_demand_mw ?? 0;
      const rawDemandMW = h.raw_predicted_demand_mw ?? demandMW;
      const hourNum = getColomboHour(h.hour_start);

      return {
        id: `${dayItem.date}-${h.hour_start}`,
        timestamp: new Date(h.hour_start),
        hour_start: h.hour_start,
        hour_end: h.hour_end,
        hour: hourNum,
        solarMW,
        demandMW,
        rawDemandMW,
        predicted_solar_mw: solarMW,
        predicted_demand_mw: demandMW,
        raw_predicted_demand_mw: rawDemandMW,
        dayIndex: index,
      };
    });

    const solarValues = hours.map((h) => h.solarMW);
    const peakSolar = solarValues.length > 0 ? Math.max(...solarValues) : 0;
    const middayValley = calculateMiddayValley(hours);
    const valleySolar = middayValley ? middayValley.solarMW : null;
    const valleyHour = middayValley ? middayValley.hour : null;

    return {
      date: dayItem.date,
      dayIndex: index,
      hour_count: dayItem.hour_count ?? hours.length,
      partial_day: Boolean(dayItem.partial_day),
      hours,
      dayData: hours,
      peakSolar,
      middayValley,
      valleySolar,
      valleyHour,
    };
  });
}

/**
 * Fetch latest combined forecast from backend API.
 * Falls back to sample data gracefully if backend is offline.
 */
export async function loadLatestForecast() {
  try {
    let res;
    try {
      res = await fetch('/api/forecast/combined/latest', {
        headers: { Accept: 'application/json' },
      });
      // Ensure it returned actual json and not html fallback
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('Fallback to direct address');
      }
    } catch {
      res = await fetch(`${API_BASE}/api/forecast/combined/latest`, {
        headers: { Accept: 'application/json' },
      });
    }

    if (res.status === 404) {
      console.warn('No saved latest forecast on backend. Using initial prototype scenario.');
      return {
        ...SAMPLE_FORECAST_DATA,
        isFallback: false,
      };
    }

    if (!res.ok) {
      throw new Error(`Backend error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    return {
      ...data,
      isFallback: false,
    };
  } catch (err) {
    console.warn(`Unable to reach backend at ${API_BASE}. Falling back to cached forecast data:`, err.message);
    return {
      ...SAMPLE_FORECAST_DATA,
      isFallback: true,
      fallbackError: err.message,
    };
  }
}

/**
 * Triggers generation of a new 7-day forecast run.
 */
export async function generateSevenDayForecast() {
  let res;
  try {
    res = await fetch('/api/forecast/combined/seven-day', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Proxy error ${res.status}`);
    }
  } catch {
    res = await fetch(`${API_BASE}/api/forecast/combined/seven-day`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
  }

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Generation failed (${res.status}): ${detail}`);
  }

  return res.json();
}
