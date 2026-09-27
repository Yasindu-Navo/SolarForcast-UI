import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDateLabel, formatHourLabel } from '../services/forecastApi';

const convertValue = (valueMW, unit) => {
  if (valueMW === null || valueMW === undefined || Number.isNaN(valueMW)) {
    return null;
  }
  if (unit === 'kW') {
    return valueMW * 1000;
  }
  return valueMW;
};

const OverviewCards = ({
  dailySummaries = [],
  selectedDayIndex,
  onSelectDay,
  threshold,
  unit = 'MW',
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      {dailySummaries.map((day) => {
        const isSelected = selectedDayIndex === day.dayIndex;

        // Curtailment risk: when (demand - solar) <= threshold
        const riskHours = (day.dayData || []).filter(
          (h) => h.demandMW - h.solarMW <= threshold,
        );
        const riskCount = riskHours.length;

        let riskLevel = 'none';
        if (riskCount > 0 && riskCount <= 3) riskLevel = 'low';
        if (riskCount > 3 && riskCount <= 8) riskLevel = 'medium';
        if (riskCount > 8) riskLevel = 'high';

        const hasRisk = riskLevel !== 'none';

        const badgeStyles = {
          none: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300',
          low: 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300',
          medium: 'bg-amber-500/15 border-amber-400/70 text-amber-300',
          high: 'bg-red-500/20 border-red-500/70 text-red-300',
        };

        const badgeLabel = {
          none: 'No Risk',
          low: 'Low Risk',
          medium: 'Watch',
          high: 'High Risk',
        }[riskLevel];

        const peakSolarValue = convertValue(day.peakSolar, unit);
        const valleySolarValue =
          day.valleySolar !== null ? convertValue(day.valleySolar, unit) : null;

        // Overall max solar across day for mini bars scaling
        const maxSolarInDay = Math.max(...(day.dayData || []).map((h) => h.solarMW), 1);

        return (
          <div
            key={day.dayIndex}
            onClick={() => onSelectDay(day.dayIndex)}
            className={`
              glass-card glass-card-hover p-4 cursor-pointer relative overflow-hidden group transition-all duration-200
              ${
                isSelected
                  ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-900 bg-slate-800/90 scale-[1.02] shadow-lg shadow-sky-500/10'
                  : 'opacity-85 hover:opacity-100 hover:bg-slate-800/50'
              }
            `}
          >
            {isSelected && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-sky-400 to-blue-500" />
            )}

            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-sm font-semibold tracking-tight ${
                      isSelected ? 'text-white' : 'text-slate-200'
                    }`}
                  >
                    {formatDateLabel(day.date)}
                  </span>
                  {day.partial_day && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 font-mono">
                      Partial
                    </span>
                  )}
                </div>

                {day.middayValley ? (
                  <span className="text-[10px] text-slate-400 font-medium">
                    Midday valley{' '}
                    <span className="text-amber-300 font-semibold">
                      {formatHourLabel(day.middayValley.hour_start)}
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-medium italic">
                    {day.partial_day ? 'Hours: 21:00-24:00' : 'No midday drop'}
                  </span>
                )}
              </div>

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold whitespace-nowrap ${badgeStyles[riskLevel]}`}
              >
                {hasRisk ? (
                  <AlertTriangle size={11} />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                <span>{badgeLabel}</span>
              </div>
            </div>

            <div className="space-y-2.5 mb-6">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp size={12} className="text-amber-400" />
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    Peak Solar
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-100 tracking-tight">
                  {peakSolarValue !== null ? Math.round(peakSolarValue) : 0}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">
                    {unit}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown size={12} className="text-sky-400" />
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    Valley Solar
                  </span>
                </div>
                <div className="text-base font-semibold text-slate-300">
                  {valleySolarValue !== null ? (
                    <>
                      {Math.round(valleySolarValue)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">
                        {unit}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 italic">N/A</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom mini-profile sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-9 flex items-end opacity-30 group-hover:opacity-60 transition-opacity px-2 pb-1.5 gap-[1px]">
              {(day.dayData || []).map((h, i) => {
                const heightPct = Math.max(8, Math.min(100, (h.solarMW / maxSolarInDay) * 100));
                // Curtailment risk: (demand - solar) <= threshold
                const isRiskHour = h.demandMW - h.solarMW <= threshold;
                return (
                  <div
                    key={i}
                    style={{ height: `${heightPct}%` }}
                    title={`${formatHourLabel(h.hour_start)}: Solar ${Math.round(h.solarMW)} MW, Load ${Math.round(h.demandMW)} MW`}
                    className={`flex-1 rounded-t-xs transition-all ${
                      isRiskHour
                        ? 'bg-rose-500'
                        : h.solarMW > 0
                        ? 'bg-amber-400'
                        : 'bg-slate-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
