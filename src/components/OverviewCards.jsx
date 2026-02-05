
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const convertValue = (valueMW, unit) => {
  if (unit === 'kW') {
    return valueMW * 1000;
  }
  return valueMW;
};

const OverviewCards = ({
  dailySummaries,
  selectedDayIndex,
  onSelectDay,
  threshold,
  unit = 'MW',
}) => {
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatHour = (hour) =>
    `${hour.toString().padStart(2, '0')}:00`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      {dailySummaries.map((day) => {
        const isSelected = selectedDayIndex === day.dayIndex;

        const riskHours = day.dayData.filter(
          (h) => h.solarMW - h.demandMW >= threshold,
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
          low: 'Low',
          medium: 'Watch',
          high: 'High',
        }[riskLevel];

        const daylightWindow = day.dayData.filter(
          (h) => h.hour >= 9 && h.hour <= 16,
        );
        const middayValleyPoint =
          daylightWindow.length > 0
            ? daylightWindow.reduce((min, current) => {
                const currentNet = current.demandMW - current.solarMW;
                const minNet = min.demandMW - min.solarMW;
                return currentNet < minNet ? current : min;
              })
            : null;

        const peakSolarValue = convertValue(day.maxSolar, unit);
        const valleySolarValue = convertValue(day.minSolar, unit);

        return (
          <div
            key={day.dayIndex}
            onClick={() => onSelectDay(day.dayIndex)}
            className={`
              glass-card glass-card-hover p-4 cursor-pointer relative overflow-hidden group
              ${
                isSelected
                  ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-900 bg-slate-800/80 scale-[1.02]'
                  : 'opacity-80 hover:opacity-100'
              }
            `}
          >
            {isSelected && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-blue-600" />
            )}

            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col gap-1">
                <span
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {formatDate(day.date)}
                </span>
                {middayValleyPoint && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    Midday valley{' '}
                    <span className="text-slate-300">
                      {formatHour(middayValleyPoint.hour)}
                    </span>
                  </span>
                )}
              </div>

              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${badgeStyles[riskLevel]}`}
              >
                {hasRisk ? (
                  <AlertTriangle size={11} />
                ) : (
                  <CheckCircle2 size={11} />
                )}
                <span>{badgeLabel}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp size={12} className="text-amber-500" />
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    Peak Solar
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-200 tracking-tight">
                  {Math.round(peakSolarValue)}{' '}
                  <span className="text-[10px] text-slate-600 font-normal">
                    {unit}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown size={12} className="text-slate-500" />
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    Valley Solar
                  </span>
                </div>
                <div className="text-base font-semibold text-slate-400">
                  {Math.round(valleySolarValue)}{' '}
                  <span className="text-[10px] text-slate-600 font-normal">
                    {unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end opacity-20 group-hover:opacity-40 transition-opacity px-2 pb-2 gap-[1px]">
              {day.dayData.map((h, i) => {
                const heightPct = Math.min(100, (h.solarMW / 200) * 100);
                const isRiskHour = h.solarMW - h.demandMW >= threshold;
                return (
                  <div
                    key={i}
                    style={{ height: `${heightPct}%` }}
                    className={`flex-1 rounded-t-sm ${
                      isRiskHour
                        ? 'bg-red-500'
                        : riskLevel === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
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
