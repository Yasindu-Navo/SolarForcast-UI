
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import OverviewCards from './components/OverviewCards';
import MainChart from './components/MainChart';
import HourlyCards from './components/HourlyCards';
import { generateForecastData, getDailySummaries } from './utils/dataGenerator';

function App() {
  const [threshold, setThreshold] = useState(50); // Curtailment threshold in MW
  const [unit, setUnit] = useState('MW'); // Display unit: MW | kW
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    // Simulate API fetch delay
    const data = generateForecastData();
    setHourlyData(data);
  }, []);

  const dailySummaries = useMemo(() => {
    return getDailySummaries(hourlyData);
  }, [hourlyData]);

  const selectedDayData = useMemo(() => {
    return hourlyData.filter(d => d.dayIndex === selectedDayIndex);
  }, [hourlyData, selectedDayIndex]);

  return (
    <div className="min-h-screen pb-20 animate-fade-in relative selection:bg-sky-500/30">
       <div className="container mx-auto max-w-7xl pt-6 px-4 md:px-6">
        <Header unit={unit} onUnitChange={setUnit} />
        
        <main>
          <ControlPanel 
            threshold={threshold}
            setThreshold={setThreshold}
            unit={unit}
          />

          <section className="mb-8">
            <div className="flex items-center justify-between mb-6 px-1">
               <h2 className="text-xl font-bold text-slate-100 tracking-tight">7-Day Overview</h2>
               <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                  Select a day for details
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

          <section className="mb-8">
            <HourlyCards 
              selectedDayData={selectedDayData}
              threshold={threshold}
              unit={unit}
            />
          </section>

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
