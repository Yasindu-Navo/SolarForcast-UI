import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatHourLabel } from '../services/forecastApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const convertValue = (valueMW, unit) => {
  if (valueMW === null || valueMW === undefined || Number.isNaN(valueMW)) {
    return 0;
  }
  return unit === 'kW' ? valueMW * 1000 : valueMW;
};

const MainChart = ({ selectedDayData = [], threshold, unit = 'MW' }) => {
  const chartData = useMemo(() => {
    if (!selectedDayData || selectedDayData.length === 0) return null;

    const labels = selectedDayData.map((d) => formatHourLabel(d.hour_start));

    const solarMWList = selectedDayData.map(
      (d) => d.solarMW ?? d.predicted_solar_mw ?? 0,
    );
    const demandMWList = selectedDayData.map(
      (d) => d.demandMW ?? d.predicted_demand_mw ?? 0,
    );

    const maxSolar = Math.max(...solarMWList, 10);
    const peakSolarIndex = solarMWList.indexOf(Math.max(...solarMWList));
    const ceilingValue = convertValue(maxSolar * 1.15, unit);

    // Curtailment risk: when (Demand - Solar) <= threshold
    const riskBarData = selectedDayData.map((d, i) => {
      const diff = demandMWList[i] - solarMWList[i];
      return diff <= threshold ? ceilingValue : 0;
    });

    const riskBackgrounds = selectedDayData.map((d, i) => {
      const diff = demandMWList[i] - solarMWList[i];
      return diff <= threshold
        ? 'rgba(239, 68, 68, 0.22)'
        : 'rgba(15, 23, 42, 0)';
    });

    const riskBorders = selectedDayData.map((d, i) => {
      const diff = demandMWList[i] - solarMWList[i];
      return diff <= threshold
        ? 'rgba(239, 68, 68, 0.45)'
        : 'rgba(0, 0, 0, 0)';
    });

    const solarData = solarMWList.map((v) => convertValue(v, unit));

    // Only 2 datasets: Curtailment risk window & Solar Generation (both selected by default)
    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Curtailment risk window',
          data: riskBarData,
          backgroundColor: riskBackgrounds,
          borderColor: riskBorders,
          borderWidth: 1,
          barPercentage: 1.0,
          categoryPercentage: 1.0,
          yAxisID: 'y',
          order: 1,
          hidden: false, // Default selected
        },
        {
          type: 'line',
          label: 'Solar Generation',
          data: solarData,
          borderColor: '#f59e0b',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 420);
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
            gradient.addColorStop(0.7, 'rgba(245, 158, 11, 0.08)');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
            return gradient;
          },
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: (ctx) => (ctx.dataIndex === peakSolarIndex ? 5 : 2),
          pointHoverRadius: 6,
          pointBackgroundColor: '#fbbf24',
          pointBorderWidth: 1.5,
          pointBorderColor: '#78350f',
          pointHoverBorderWidth: 4,
          pointHoverBorderColor: 'rgba(245, 158, 11, 0.35)',
          order: 0,
          hidden: false, // Default selected
        },
      ],
    };
  }, [selectedDayData, threshold, unit]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#cbd5e1',
          usePointStyle: true,
          boxWidth: 9,
          boxHeight: 9,
          padding: 20,
          font: { family: 'Inter', size: 12, weight: '500' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(2, 6, 23, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(30, 41, 59, 0.7)',
        borderWidth: 1,
        padding: 14,
        boxPadding: 4,
        cornerRadius: 12,
        titleFont: { size: 13, weight: '600', family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        filter: (context) => context.dataset.type !== 'bar',
        callbacks: {
          title: (items) => {
            if (!items.length || !selectedDayData) return '';
            const index = items[0].dataIndex;
            const point = selectedDayData[index];
            if (!point) return '';
            return `${formatHourLabel(point.hour_start)} (Colombo)`;
          },
          label: (ctx) => {
            const label = ctx.dataset.label || '';
            const value = ctx.parsed.y;
            return `${label}: ${Math.round(value)} ${unit}`;
          },
          afterBody: (tooltipItems) => {
            if (!tooltipItems.length || !selectedDayData) return '';
            const index = tooltipItems[0].dataIndex;
            const point = selectedDayData[index];
            if (!point) return '';

            const solarMW = point.solarMW ?? point.predicted_solar_mw ?? 0;
            const demandMW = point.demandMW ?? point.predicted_demand_mw ?? 0;
            const diffMW = demandMW - solarMW;
            const isRisk = diffMW <= threshold;

            return [
              '',
              `Predicted Load: ${Math.round(convertValue(demandMW, unit))} ${unit}`,
              `Net Margin (Demand - Solar): ${diffMW >= 0 ? '+' : ''}${Math.round(convertValue(diffMW, unit))} ${unit}`,
              `Threshold: ${threshold} MW`,
              `Risk Status: ${isRisk ? '⚠️ Curtailment Risk Window' : 'Normal'}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (val) => `${val}`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="glass-card p-6 md:p-8 h-[520px] md:h-[600px] w-full relative group">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
            Hourly Forecast Analysis
          </h3>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Solar generation profile with curtailment‑risk window overlay.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-xs text-slate-400">
          <span>Curtailment risk triggers when</span>
          <span className="font-semibold text-rose-400 font-mono">
            (Demand - Solar) ≤ {threshold} MW
          </span>
        </div>
      </div>

      <div className="h-[400px] md:h-[480px] w-full">
        {chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            No chart data available for selected day.
          </div>
        )}
      </div>
    </div>
  );
};

export default MainChart;
