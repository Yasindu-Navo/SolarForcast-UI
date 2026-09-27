import React from 'react';
import { Sun, Activity, RefreshCw, Download, Server } from 'lucide-react';
import { CSV_DOWNLOAD_URL } from '../services/forecastApi';

const Header = ({
  unit = 'MW',
  onUnitChange,
  forecastMeta = {},
  onRefresh,
  isLoading = false,
}) => {
  const isExperimental = forecastMeta?.status === 'experimental';
  const isStale = forecastMeta?.stale;

  return (
    <header className="glass-card mb-8 p-5 md:p-6 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500 opacity-90" />

      <div className="flex items-center gap-4 z-10 w-full md:w-auto">
        <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
          <Sun className="text-white w-7 h-7 animate-pulse-slow" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center">
            Solar<span className="text-slate-500 mx-2">|</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-400">
              Demand Forecast
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5 flex items-center gap-2 font-medium flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity size={14} />
              7-Day Combined Operational Profile
            </span>
            {forecastMeta?.timezone && (
              <span className="text-[11px] text-slate-500 font-mono">
                • {forecastMeta.timezone} (+05:30)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 md:mt-0 flex items-center gap-3 z-10 flex-wrap justify-end w-full md:w-auto">
        {/* Unit Toggle */}
        <div className="px-2 py-1 rounded-full bg-slate-950/60 border border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
          <span className="text-slate-500 pl-1">Units</span>
          <div className="flex items-center bg-slate-900/90 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => onUnitChange?.('MW')}
              className={`
                px-2.5 py-0.5 rounded-full text-[10px] transition-all
                ${
                  unit === 'MW'
                    ? 'bg-amber-400 text-slate-900 font-bold shadow-sm shadow-amber-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              MW
            </button>
            <button
              type="button"
              onClick={() => onUnitChange?.('kW')}
              className={`
                px-2.5 py-0.5 rounded-full text-[10px] transition-all
                ${
                  unit === 'kW'
                    ? 'bg-sky-400 text-slate-900 font-bold shadow-sm shadow-sky-400/30'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
            >
              kW
            </button>
          </div>
        </div>

        {/* Action: CSV Download */}
        <a
          href={CSV_DOWNLOAD_URL}
          download="latest_forecast.csv"
          target="_blank"
          rel="noopener noreferrer"
          title="Download latest combined forecast as CSV"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <Download size={13} />
          <span className="hidden sm:inline">CSV</span>
        </a>

        {/* Action: Refresh / Re-fetch */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Reload latest forecast from backend"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>

        {/* Backend Status indicator */}
        <div className="text-right hidden lg:block border-l border-slate-800 pl-3">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Server size={10} />
            <span>Port 8030</span>
          </div>
          <div className="text-xs font-semibold flex items-center gap-1.5 justify-end">
            {isStale ? (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Stale
              </span>
            ) : isExperimental ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Scenario
              </span>
            ) : (
              <span className="text-sky-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" /> Connected
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
