
export const generateForecastData = () => {
  const days = 7;
  const hoursPerDay = 24;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const data = [];

  for (let d = 0; d < days; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + d);

    // Randomize weather factor per day (0.6 to 1.0)
    const weatherFactor = 0.6 + Math.random() * 0.4; 

    for (let h = 0; h < hoursPerDay; h++) {
      const timestamp = new Date(currentDate);
      timestamp.setHours(h);

      // Solar Generation Logic: Bell curve peak at 12-1 PM
      let solar = 0;
      if (h >= 6 && h <= 18) {
        // Simple parabolic curve approximation
        const x = (h - 12) / 6; // -1 to 1
        solar = Math.max(0, (1 - x * x) * 100 * weatherFactor);
        // Add some noise
        solar += (Math.random() - 0.5) * 5;
      }
      solar = Math.max(0, Math.round(solar));

      // Net Load Logic: "Duck curve" inverse or double peak
      // Morning peak (8-10), Evening peak (7-9)
      const morningPeak = Math.exp(-Math.pow(h - 9, 2) / 4) * 60;
      const eveningPeak = Math.exp(-Math.pow(h - 19, 2) / 4) * 80;
      const baseLoad = 30;
      
      let demand = baseLoad + morningPeak + eveningPeak + (Math.random() * 5);
      
      // If solar is high, net load drops (Duck Curve effect) if we were modeling true net load
      // But user request asks for "Net Load (Demand)" to compare AGAINST Solar.
      // Usually "Net Load" = Demand - Solar. 
      // User prompt: "Curtailment risk when (Solar - Net Load) >= Threshold"
      // This implies "Net Load" here refers to the Demand side, and we check oversupply.
      // OR "Net Load" is strictly Demand.
      // Let's assume the blue line is "Demand" or "Load".
      
      demand = Math.round(demand);

      data.push({
        id: `${d}-${h}`,
        timestamp: timestamp,
        dayIndex: d,
        hour: h,
        solarMW: solar,
        demandMW: demand,
        netLoadMW: demand, // storing as demand for clarity based on calculation logic
      });
    }
  }
  return data;
};

export const getDailySummaries = (hourlyData) => {
  const summaries = [];
  const days = 7;
  
  for (let d = 0; d < days; d++) {
    const dayData = hourlyData.filter(item => item.dayIndex === d);
    if (dayData.length === 0) continue;
    
    const solarValues = dayData.map(i => i.solarMW);
    const maxSolar = Math.max(...solarValues);
    const minSolar = Math.min(...solarValues); // likely 0 at night
    
    // Valley usually refers to "Net Load Valley", but user asked for "Daily minimum solar generation (Valley)"
    // which is trivially 0 every night. 
    // Maybe they meant "Valley" in the Net Load curve?
    // "Daily minimum solar generation (Valley - MW)" -> User literally asked for min solar.
    // I will stick to the prompt.
    
    summaries.push({
      date: dayData[0].timestamp,
      dayIndex: d,
      maxSolar,
      minSolar,
      dayData
    });
  }
  return summaries;
};
