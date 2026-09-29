import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertCircle,
  Calendar,
  Info,
  Clock,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OverviewCards from './components/OverviewCards';
import MainChart from './components/MainChart';
import HourlyCards from './components/HourlyCards';
import {
  loadLatestForecast,
  generateSevenDayForecast,
  processForecastDays,
  formatDateLabel,
} from './services/forecastApi';

function App() {
  const [threshold, setThreshold] = useState(400); // Curtailment threshold in MW
  const [unit, setUnit] = useState('MW'); // Display unit: MW | kW
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [forecastResponse, setForecastResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchForecast = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await loadLatestForecast();
      setForecastResponse(data);
    } catch (err) {
      console.error('Forecast load error:', err);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateForecast = useCallback(async () => {
    setIsGenerating(true);
    setFetchError(null);
    try {
      const data = await generateSevenDayForecast();
      setForecastResponse(data);
      setSelectedDayIndex(0); // Reset selection to Day 1
    } catch (err) {
      console.error('Forecast generation error:', err);
      setFetchError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  // Process exactly the 7 days from the API output
  const dailySummaries = useMemo(() => {
    if (!forecastResponse?.days) return [];
    return processForecastDays(forecastResponse.days);
  }, [forecastResponse]);

  // Selected day's hours (for Day 1, only the hours present in the API are shown, no past hours)
  const selectedDayData = useMemo(() => {
    if (dailySummaries.length === 0) return [];
    const index = Math.min(selectedDayIndex, dailySummaries.length - 1);
    const current = dailySummaries[index] || dailySummaries[0];
    return current.dayData || [];
  }, [dailySummaries, selectedDayIndex]);

  const selectedDayMeta = useMemo(() => {
    if (dailySummaries.length === 0) return null;
    const index = Math.min(selectedDayIndex, dailySummaries.length - 1);
    return dailySummaries[index] || dailySummaries[0];
  }, [dailySummaries, selectedDayIndex]);

  const isStale = Boolean(forecastResponse?.stale);
  const ageHours = forecastResponse?.age_seconds
    ? Math.round(forecastResponse.age_seconds / 3600)
    : 0;

  return (
    <div className="min-h-screen pb-20 animate-fade-in relative selection:bg-sky-500/30 text-slate-100">
      <div className="container mx-auto max-w-7xl pt-6 px-4 md:px-6">
        <Header
          unit={unit}
          onUnitChange={setUnit}
          forecastMeta={forecastResponse}
          onRefresh={fetchForecast}
          onGenerate={handleGenerateForecast}
          isLoading={isLoading}
          isGenerating={isGenerating}
        />

        <main>
          {/* Generation In-Progress Indicator */}
          {isGenerating && (
            <div className="mb-6 p-4 rounded-2xl bg-sky-500/15 border border-sky-400/50 backdrop-blur-md flex items-center justify-between gap-3 text-sky-200 shadow-xl shadow-sky-500/10 animate-pulse">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-sky-300 animate-spin" />
                <div>
                  <div className="text-xs font-bold text-sky-200">
                    Generating Live 7-Day Forecast...
                  </div>
                  <p className="text-[11px] text-sky-300/80">
                    Running live Open-Meteo weather retrieval and recursive LSTM demand inference. This takes 10–20 seconds.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stale Warning Banner with 1-Click Generate Button */}
          {isStale && !isGenerating && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl shadow-amber-500/10">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-200">
                    Notice: Loaded forecast is from a previous run ({ageHours} hours old).
                  </span>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    The backend served the saved snapshot from {new Date(forecastResponse.generated_at).toLocaleString()}. Click below to run live weather retrieval and generate today&apos;s 7-day forecast.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerateForecast}
                className="btn-primary py-2 px-4 whitespace-nowrap text-xs flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shrink-0 shadow-md"
              >
                <Sparkles size={14} />
                Generate Today&apos;s Forecast
              </button>
            </div>
          )}

          {/* Active Scenario Notice & Provenance Info */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-lg">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-sky-300">Operational Scenario Notice: </span>
                <span className="text-slate-300">
                  Demand scenario based on 2025 history; recent observations unavailable. Solar forecast is experimental.
                </span>
                {forecastResponse?.demand_details?.historical_source?.selection && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Historical Demand Seed: {forecastResponse.demand_details.historical_source.source_start} to{' '}
                    {forecastResponse.demand_details.historical_source.source_end} ({forecastResponse.demand_details.historical_source.selection})
                  </p>
                )}
              </div>
            </div>

            {forecastResponse?.generated_at && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0 pl-6 md:pl-0">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Run: {new Date(forecastResponse.generated_at).toLocaleString()}</span>
              </div>
            )}
          </div>

          {forecastResponse?.isFallback && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>
                Backend server currently unreachable on port 8030. Displaying simulated offline scenario seed.
              </span>
            </div>
          )}

          {fetchError && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>API Error: {fetchError}</span>
            </div>
          )}

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
