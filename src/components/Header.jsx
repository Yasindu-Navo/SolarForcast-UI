
import React from 'react';
import { Sun, Activity } from 'lucide-react';

const Header = ({ unit = 'MW', onUnitChange }) => {
  return (
    <header className="glass-card mb-8 p-6 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500 opacity-80" />
      
      <div className="flex items-center gap-5 z-10">
        <div className="p-3.5 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
          <Sun className="text-white w-8 h-8 animate-pulse-slow" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Solar<span className="text-slate-500 mx-2">|</span><span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Net Load</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 font-medium">
            <Activity size={16} className="text-emerald-400" />
            Adaptive Forecasting Dashboard
          </p>
        </div>
      </div>
      
      <div className="mt-6 md:mt-0 flex items-center gap-4 z-10">
        <div className="px-2 py-1.5 rounded-full bg-slate-950/50 border border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
          <span className="text-slate-500">Units</span>
          <div className="flex items-center bg-slate-900/80 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => onUnitChange?.('MW')}
              className={`
                px-2.5 py-0.5 rounded-full text-[10px] transition-all
                ${unit === 'MW' 
                  ? 'bg-amber-400 text-slate-900 shadow-sm shadow-amber-400/40' 
                  : 'text-slate-500 hover:text-slate-200'}
              `}
            >
              MW
            </button>
            <button
              type="button"
              onClick={() => onUnitChange?.('kW')}
              className={`
                px-2.5 py-0.5 rounded-full text-[10px] transition-all
                ${unit === 'kW' 
                  ? 'bg-sky-400 text-slate-900 shadow-sm shadow-sky-400/40' 
                  : 'text-slate-500 hover:text-slate-200'}
              `}
            >
              kW
            </button>
          </div>
        </div>
        <div className="text-right hidden md:block">
           <div className="text-xs text-slate-500">System Status</div>
           <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 justify-end">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Online
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
