import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OverviewCards from './components/OverviewCards';
import MainChart from './components/MainChart';
import HourlyCards from './components/HourlyCards';
import {
  loadLatestForecast,
  processForecastDays,
  formatDateLabel,
  exportForecastAsCSV,
} from './services/forecastApi';

function App() {
  const [threshold, setThreshold] = useState(400); // Curtailment threshold in MW
  const [unit, setUnit] = useState('MW'); // Display unit: MW | kW
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [forecastResponse, setForecastResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadLatestForecast();
      setForecastResponse(data);
    } catch (err) {
      console.error('Forecast load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Process the 7 days
  const dailySummaries = useMemo(() => {
    if (!forecastResponse?.days) return [];
    return processForecastDays(forecastResponse.days);
  }, [forecastResponse]);

  // Selected day's hours
  const selectedDayData = useMemo(() => {
    if (dailySummaries.length === 0) return [];
    const current = dailySummaries[selectedDayIndex] || dailySummaries[0];
    return current.dayData || [];
  }, [dailySummaries, selectedDayIndex]);

  const selectedDayMeta = useMemo(() => {
    if (dailySummaries.length === 0) return null;
    return dailySummaries[selectedDayIndex] || dailySummaries[0];
  }, [dailySummaries, selectedDayIndex]);

  const handleExportCsv = useCallback(() => {
    if (forecastResponse) {
      exportForecastAsCSV(forecastResponse, threshold);
    }
  }, [forecastResponse, threshold]);

  return (
    <div className="min-h-screen pb-20 animate-fade-in relative selection:bg-sky-500/30 text-slate-100">
      <div className="container mx-auto max-w-7xl pt-6 px-4 md:px-6">
        <Header
          unit={unit}
          onUnitChange={setUnit}
          forecastMeta={forecastResponse}
          onRefresh={fetchForecast}
          onExportCsv={handleExportCsv}
          isLoading={isLoading}
        />

        <main>
          <ControlPanel
            threshold={threshold}
            setThreshold={setThreshold}
            unit={unit}
          />

          {/* 7-Day Overview Section */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <Calendar size={20} className="text-amber-400" />
                  7-Day Overview
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seven-day forecast envelope from API. Select any day to inspect chronological hourly details.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>
                  Selected: {selectedDayMeta ? formatDateLabel(selectedDayMeta.date) : 'Day 1'}
                  {selectedDayMeta?.partial_day ? ' (API partial window)' : ''}
                </span>
              </div>
            </div>

            <OverviewCards
              dailySummaries={dailySummaries}
              selectedDayIndex={selectedDayIndex}
              onSelectDay={setSelectedDayIndex}
              threshold={threshold}
              unit={unit}
            />
          </section>

          {/* Hourly Profile Section */}
          <section className="mb-8">
            <HourlyCards
              selectedDayData={selectedDayData}
              threshold={threshold}
              unit={unit}
              dayMeta={selectedDayMeta}
            />
          </section>

          {/* Main Chart Section */}
          <section>
            <MainChart
              selectedDayData={selectedDayData}
              threshold={threshold}
              unit={unit}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
