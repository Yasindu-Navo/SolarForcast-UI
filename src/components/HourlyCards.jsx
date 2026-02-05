import React from 'react';
import { Sun, MoonStar, AlertTriangle, ChevronRight } from 'lucide-react';

const formatHourLabel = (date) => {
  const hours = date.getHours();
  return `${hours.toString().padStart(2, '0')}:00`;
};

const convertValue = (valueMW, unit) => {
  if (unit === 'kW') {
    return valueMW * 1000;
  }
  return valueMW;
};

const HourlyCards = ({ selectedDayData = [], threshold, unit = 'MW' }) => {
  if (!selectedDayData || selectedDayData.length === 0) {
    return null;
  }

  const isToday = (() => {
    const now = new Date();
    const first = selectedDayData[0]?.timestamp;
    if (!first) return false;
    return (
      now.getFullYear() === first.getFullYear() &&
      now.getMonth() === first.getMonth() &&
      now.getDate() === first.getDate()
    );
  })();

  return (
    <div className="glass-card p-4 md:p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-slate-100 flex items-center gap-2">
            Hourly Profile
            {isToday && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-semibold tracking-wide">
                Today
              </span>
            )}
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500">
            Scroll to explore 24‑hour solar and net load snapshots.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500/70" />
          Normal
          <span className="w-2 h-2 rounded-full bg-amber-400/80" />
          Watch
          <span className="w-2 h-2 rounded-full bg-red-500/80" />
          Curtailment risk
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none flex items-center justify-end pr-1">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {selectedDayData.map((hour) => {
            const diff = hour.solarMW - hour.demandMW;
            const isRisk = diff >= threshold;
            const isDaylight = hour.solarMW > 0;

            let riskLevel = 'normal';
            if (isRisk && diff < threshold * 1.5) riskLevel = 'watch';
            if (isRisk && diff >= threshold * 1.5) riskLevel = 'high';

            const baseClasses =
              'relative min-w-[110px] md:min-w-[132px] rounded-2xl px-3.5 py-3.5 md:px-4 md:py-4 flex flex-col items-stretch justify-between text-xs md:text-sm transition-all duration-200 cursor-default shadow-md';

            const bgByRisk = {
              normal:
                'bg-gradient-to-b from-slate-900/80 to-slate-950/80 border border-slate-800/70',
              watch:
                'bg-gradient-to-b from-amber-500/15 via-slate-900/80 to-slate-950/90 border border-amber-400/60 shadow-amber-500/30',
              high:
                'bg-gradient-to-b from-red-500/20 via-slate-900/85 to-slate-950/95 border border-red-500/70 shadow-red-500/40',
            };

            const footerByRisk = {
              normal: 'text-emerald-400 bg-emerald-500/10',
              watch: 'text-amber-300 bg-amber-500/10',
              high: 'text-red-300 bg-red-500/10',
            };

            const valueSolar = convertValue(hour.solarMW, unit);
            const valueDemand = convertValue(hour.demandMW, unit);

            return (
              <div
                key={hour.id}
                className={`${baseClasses} ${bgByRisk[riskLevel]} backdrop-blur-md`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[11px] md:text-xs font-semibold text-slate-200">
                    {formatHourLabel(hour.timestamp)}
                  </span>
                  <div className="flex items-center gap-1">
                    {isDaylight ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <MoonStar className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mb-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] md:text-[11px] text-slate-500">
                      Solar
                    </span>
                    <span className="flex items-baseline gap-1">
                      <span className="text-sm md:text-base font-semibold text-amber-300">
                        {Math.round(valueSolar)}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {unit}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] md:text-[11px] text-slate-500">
                      Load
                    </span>
                    <span className="flex items-baseline gap-1">
                      <span className="text-sm md:text-base font-semibold text-sky-300">
                        {Math.round(valueDemand)}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        {unit}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full mt-1.5 pt-1.5 border-t border-slate-800/80">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 ${footerByRisk[riskLevel]}`}
                  >
                    {riskLevel === 'high' && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {riskLevel === 'normal' && <span>Normal</span>}
                    {riskLevel === 'watch' && <span>Watch</span>}
                    {riskLevel === 'high' && <span>Risk</span>}
                  </div>
                  <span className="text-[9px] text-slate-500 text-right">
                    Δ {diff >= 0 ? '+' : ''}
                    {Math.round(diff)} MW
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

