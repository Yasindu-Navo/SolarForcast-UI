import React from 'react';
import { Sun, MoonStar, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { formatHourLabel } from '../services/forecastApi';

const convertValue = (valueMW, unit) => {
  if (valueMW === null || valueMW === undefined || Number.isNaN(valueMW)) {
    return 0;
  }
  if (unit === 'kW') {
    return valueMW * 1000;
  }
  return valueMW;
};

const HourlyCards = ({ selectedDayData = [], threshold, unit = 'MW', dayMeta = {} }) => {
  if (!selectedDayData || selectedDayData.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-slate-500 text-sm">
        No forecast hours available for the selected date.
      </div>
    );
  }

  const isPartial = dayMeta?.partial_day || selectedDayData.length < 24;

  return (
    <div className="glass-card p-4 md:p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-semibold text-slate-100">
              Hourly Profile ({selectedDayData.length} Hours)
            </h3>
            {/* {isPartial && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/40 font-semibold tracking-wide">
                API Window Only (No Past Hours)
              </span>
            )} */}
          </div>
          <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">
            Scroll horizontally to view chronological hourly load and solar forecasts.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500/70" /> Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400/80" /> Watch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500/80" /> Curtailment Risk (Demand - Solar ≤ {threshold} MW)
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none flex items-center justify-end pr-1 z-10">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {selectedDayData.map((hour) => {
            const solarMW = hour.solarMW ?? hour.predicted_solar_mw ?? 0;
            const demandMW = hour.demandMW ?? hour.predicted_demand_mw ?? 0;

            // Difference as (Demand - Solar)
            const diff = demandMW - solarMW;

            // Curtailment risk: if 'demand-solar' difference is <= given Curtailment Risk Threshold
            const isRisk = diff <= threshold;
            const isDaylight = solarMW > 5;

            let riskLevel = 'normal';
            if (isRisk) {
              riskLevel = diff <= threshold * 0.5 ? 'high' : 'watch';
            }

            const baseClasses =
              'relative min-w-[125px] md:min-w-[140px] rounded-2xl px-3.5 py-3.5 flex flex-col items-stretch justify-between text-xs md:text-sm transition-all duration-200 cursor-default shadow-md select-none shrink-0';

            const bgByRisk = {
              normal:
                'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/80 hover:border-slate-700',
              watch:
                'bg-gradient-to-b from-amber-500/15 via-slate-900/85 to-slate-950/90 border border-amber-400/60 shadow-amber-500/20',
              high:
                'bg-gradient-to-b from-rose-500/20 via-slate-900/90 to-slate-950/95 border border-rose-500/70 shadow-rose-500/30',
            };

            const footerByRisk = {
              normal: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30',
              watch: 'text-amber-300 bg-amber-500/10 border border-amber-400/40',
              high: 'text-rose-300 bg-rose-500/15 border border-rose-500/50',
            };

            const valueDemand = convertValue(demandMW, unit);
            const valueSolar = convertValue(solarMW, unit);
            const valueDiff = convertValue(diff, unit);

            return (
              <div
                key={hour.id || hour.hour_start}
                className={`${baseClasses} ${bgByRisk[riskLevel]} backdrop-blur-md`}
              >
                {/* Header: Hour & Daylight Icon */}
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] md:text-xs font-semibold text-slate-200 font-mono">
                    {formatHourLabel(hour.hour_start)}
                  </span>
                  <div className="flex items-center gap-1">
                    {isDaylight ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse-slow" />
                    ) : (
                      <MoonStar className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Body: LOAD first, then SOLAR */}
                <div className="flex flex-col gap-1.5 mb-2.5">
                  {/* 1. LOAD (Demand) FIRST */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] md:text-[11px] text-slate-400 font-medium">
                      Load
                    </span>
                    <span className="flex items-baseline gap-1">
                      <span className="text-sm md:text-base font-semibold text-sky-400 font-mono">
                        {Math.round(valueDemand)}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {unit}
                      </span>
                    </span>
                  </div>

                  {/* 2. SOLAR SECOND */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] md:text-[11px] text-slate-400 font-medium">
                      Solar
                    </span>
                    <span className="flex items-baseline gap-1">
                      <span className="text-sm md:text-base font-semibold text-amber-400 font-mono">
                        {Math.round(valueSolar)}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {unit}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Footer: Risk status and difference (Demand - Solar) */}
                <div className="flex items-center justify-between w-full mt-1 pt-1.5 border-t border-slate-800/80 gap-1">
                  <div
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 ${footerByRisk[riskLevel]}`}
                  >
                    {riskLevel === 'high' && (
                      <AlertTriangle className="w-2.5 h-2.5" />
                    )}
                    {riskLevel === 'normal' && <span>Normal</span>}
                    {riskLevel === 'watch' && <span>Watch</span>}
                    {riskLevel === 'high' && <span>Risk</span>}
                  </div>

                  <span
                    className={`text-[9px] font-mono text-right ${
                      diff <= threshold ? 'text-rose-400 font-semibold' : 'text-slate-400'
                    }`}
                    title={`Net Margin (Demand - Solar): ${Math.round(diff)} MW`}
                  >
                    Δ {diff >= 0 ? '+' : ''}
                    {Math.round(valueDiff)} {unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HourlyCards;
