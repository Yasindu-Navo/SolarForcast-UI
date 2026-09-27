import React, { useState, useEffect } from 'react';
import { Settings, Info, Zap } from 'lucide-react';

const ControlPanel = ({ threshold, setThreshold, unit = 'MW' }) => {
  const [localVal, setLocalVal] = useState(threshold);

  useEffect(() => {
    setLocalVal(threshold);
  }, [threshold]);

  const handleApply = () => {
    const val = Number(localVal);
    if (!Number.isNaN(val)) {
      setThreshold(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className="glass-card control-panel p-5 md:p-6 mb-8 flex items-center justify-between flex-wrap gap-4 md:gap-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-sky-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 z-10">
        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
          <Settings className="text-sky-400" size={24} />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-semibold text-slate-100">
            Grid Risk Configuration
          </h3>
          <p className="text-xs text-slate-400">
            Simulate solar curtailment conditions across the 7-day forecast horizon
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6 z-10 bg-slate-950/60 p-2 pr-2.5 pl-5 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5 font-bold">
            Curtailment Risk Threshold (MW)
            <div className="group relative">
              <Info
                size={12}
                className="text-slate-500 cursor-help hover:text-sky-400 transition-colors"
              />
              <div className="control-panel-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Trigger curtailment risk alert when (Demand - Solar) is less than or equal to this threshold in MW.
              </div>
            </div>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              onKeyDown={handleKeyDown}
              className="control-panel-input w-24 bg-transparent border-none text-white focus:ring-0 p-0 font-mono text-2xl font-bold tracking-tight text-right focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-bold mt-1">MW</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick presets */}
          <div className="hidden sm:flex items-center gap-1 mr-1">
            {[300, 400, 500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setLocalVal(preset);
                  setThreshold(preset);
                }}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                  threshold === preset
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={handleApply}
            className="btn-primary py-2.5 px-5 flex items-center gap-1.5 text-xs font-semibold"
          >
            <Zap size={14} fill="currentColor" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
