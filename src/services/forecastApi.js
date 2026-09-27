import { SAMPLE_FORECAST_DATA } from './sampleData';

/**
 * Extract the hour in 0-23 format from ISO timestamp string.
 * Uses string parsing on timezone-annotated timestamps (e.g. 2024-08-24T21:00:00+05:30)
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
 * Format date string e.g. "2024-08-24" to "Sat, Aug 24"
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
 */
export function calculateMiddayValley(hours) {
  if (!hours || hours.length === 0) return null;

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

  for (let hr = 12; hr <= 18; hr++) {
    const current = hourMap.get(hr);
    if (!current) continue;

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
 * Normalizes forecast days from dataset into clean UI structures.
 * Enriches days with holiday flag, CEB advisory text, and risk calculations.
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
      isHoliday: Boolean(dayItem.isHoliday),
      holidayName: dayItem.holidayName || null,
      cebAdvisory: dayItem.cebAdvisory || null,
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
 * Load 7-day CEB curtailment scenario forecast (Aug 24 - Aug 30).
 * Decoupled from backend server - runs standalone with zero network dependencies.
 */
export async function loadLatestForecast() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(SAMPLE_FORECAST_DATA)));
    }, 100);
  });
}

/**
 * Client-side CSV generator for the 7-day forecast.
 * Generates and triggers browser download of the complete hourly dataset.
 */
export function exportForecastAsCSV(forecastData = SAMPLE_FORECAST_DATA, threshold = 400) {
  if (!forecastData?.days) return;

  const rows = [
    [
      'Date',
      'Day_Name',
      'Is_Holiday',
      'CEB_Advisory',
      'Hour_Start',
      'Hour_End',
      'Hour_Number',
      'Predicted_Demand_MW',
      'Predicted_Solar_MW',
      'Net_Demand_MW',
      'Threshold_MW',
      'Curtailment_Risk_Triggered',
    ].join(','),
  ];

  forecastData.days.forEach((day) => {
    const dateLabel = formatDateLabel(day.date);
    (day.hours || []).forEach((h) => {
      const demand = h.predicted_demand_mw ?? 0;
      const solar = h.predicted_solar_mw ?? 0;
      const net = demand - solar;
      const risk = net <= threshold ? 'YES' : 'NO';
      const hr = getColomboHour(h.hour_start);

      rows.push(
        [
          day.date,
          `"${dateLabel}"`,
          day.isHoliday ? 'YES' : 'NO',
          `"${day.cebAdvisory || 'Normal'}"`,
          h.hour_start,
          h.hour_end,
          hr,
          demand.toFixed(1),
          solar.toFixed(1),
          net.toFixed(1),
          threshold,
          risk,
        ].join(','),
      );
    });
  });

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'CEB_Solar_Curtailment_Forecast_Aug24_Aug30.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Mock generator for manual re-run triggers
 */
export async function generateSevenDayForecast() {
  return loadLatestForecast();
}
