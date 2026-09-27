
import React, { useState, useEffect } from 'react';
import { Settings, Info, Zap } from 'lucide-react';

const ControlPanel = ({ threshold, setThreshold, unit }) => {
  const [localVal, setLocalVal] = useState(threshold);

  useEffect(() => {
    setLocalVal(threshold);
  }, [threshold]);

  const handleApply = () => {
    setThreshold(Number(localVal));
  };

  return (
    <div className="glass-card control-panel p-6 mb-8 flex items-center justify-between flex-wrap gap-6 relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-800/30 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 z-10">
        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
           <Settings className="text-slate-400" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Configuration</h3>
          <p className="text-xs text-slate-500">Adjust parameters to simulate risk scenarios</p>
        </div>
      </div>

      <div className="flex items-center gap-6 z-10 bg-slate-950/40 p-1.5 pr-2 pl-6 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5 font-bold">
            Curtailment Risk Threshold (MW)
            <div className="group relative">
               <Info size={12} className="text-slate-600 cursor-help hover:text-sky-400 transition-colors" />
               <div className="control-panel-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                  Trigger curtailment alert when the solar generation minus net load exceeds this threshold in MW.
               </div>
            </div>
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              className="control-panel-input w-24 bg-transparent border-none text-white focus:ring-0 p-0 font-mono text-2xl font-bold tracking-tight text-right"
            />
            <span className="text-sm text-slate-500 font-bold mt-1">MW</span>
          </div>
        </div>
        <button onClick={handleApply} className="btn-primary py-2.5 px-6 flex items-center gap-2">
          <Zap size={16} fill="currentColor" />
          Apply
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
