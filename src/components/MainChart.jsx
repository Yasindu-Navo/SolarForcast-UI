
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

const convertValue = (valueMW, unit) =>
  unit === 'kW' ? valueMW * 1000 : valueMW;

const MainChart = ({ selectedDayData, threshold, unit = 'MW' }) => {
  const chartData = useMemo(() => {
    if (!selectedDayData || selectedDayData.length === 0) return null;

    const labels = selectedDayData.map(
      (d) => `${d.timestamp.getHours().toString().padStart(2, '0')}:00`,
    );

    const solarMW = selectedDayData.map((d) => d.solarMW);
    const demandMW = selectedDayData.map((d) => d.demandMW);
    const marginMW = selectedDayData.map((d) => d.solarMW - d.demandMW);

    const peakSolarIndex = solarMW.indexOf(Math.max(...solarMW));
    const netLoadValues = selectedDayData.map(
      (d) => d.demandMW - d.solarMW,
    );
    const valleyNetIndex = netLoadValues.indexOf(
      Math.min(...netLoadValues),
    );

    const solarData = solarMW.map((v) => convertValue(v, unit));
    const demandData = demandMW.map((v) => convertValue(v, unit));
    const marginDisplay = marginMW.map((v) => convertValue(v, unit));

    const riskBarData = marginMW.map((diff) =>
      diff >= threshold ? convertValue(diff, unit) : 0,
    );
    const riskBackgrounds = marginMW.map((diff) =>
      diff >= threshold
        ? 'rgba(239, 68, 68, 0.18)'
        : 'rgba(15, 23, 42, 0)',
    );

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Curtailment risk window',
          data: riskBarData,
          backgroundColor: riskBackgrounds,
          borderWidth: 0,
          barPercentage: 1,
          categoryPercentage: 1,
          yAxisID: 'y',
          order: 0,
        },
        {
          type: 'line',
          label: 'Solar Generation',
          data: solarData,
          borderColor: '#f59e0b',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
            gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
            return gradient;
          },
          tension: 0.4,
          fill: true,
          pointRadius: (ctx) =>
            ctx.dataIndex === peakSolarIndex ? 5 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fbbf24',
          pointBorderWidth: 0,
          pointHoverBorderWidth: 4,
          pointHoverBorderColor: 'rgba(245, 158, 11, 0.3)',
          order: 2,
        },
        {
          type: 'line',
          label: 'Net Load',
          data: demandData,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
          borderDash: [6, 6],
          tension: 0.4,
          pointRadius: (ctx) =>
            ctx.dataIndex === valleyNetIndex ? 5 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#0f172a',
          pointBorderColor: '#0ea5e9',
          pointBorderWidth: 2,
          pointHoverBorderWidth: 4,
          pointHoverBorderColor: 'rgba(14, 165, 233, 0.3)',
          order: 1,
          fill: false,
        },
        {
          type: 'line',
          label: 'Margin (Solar - Net Load)',
          data: marginDisplay,
          borderColor: '#22c55e',
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 1,
          fill: false,
          hidden: true,
          order: 3,
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
          color: '#94a3b8',
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          font: { family: 'Inter', size: 12, weight: '500' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(2, 6, 23, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(30, 41, 59, 0.5)',
        borderWidth: 1,
        padding: 16,
        boxPadding: 4,
        cornerRadius: 12,
        displayColors: true,
        titleFont: { size: 14, weight: '600', family: 'Inter' },
        bodyFont: { size: 13, family: 'Inter' },
        filter: (context) =>
          context.dataset.type !== 'bar',
        callbacks: {
          title: (items) => {
            if (!items.length || !selectedDayData) return '';
            const index = items[0].dataIndex;
            const point = selectedDayData[index];
            if (!point) return '';
            return point.timestamp.toLocaleString('en-US', {
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
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

            const solarMW = point.solarMW;
            const demandMW = point.demandMW;
            const diffMW = solarMW - demandMW;
            const diffDisplay = convertValue(diffMW, unit);

            const risk =
              diffMW >= threshold
                ? 'Curtailment risk'
                : diffMW > 0
                ? 'Surplus (within limit)'
                : 'No curtailment';

            return [
              '',
              `Solar: ${Math.round(
                convertValue(solarMW, unit),
              )} ${unit}`,
              `Net Load: ${Math.round(
                convertValue(demandMW, unit),
              )} ${unit}`,
              `Margin (Solar - Net Load): ${
                diffDisplay >= 0 ? '+' : ''
              }${Math.round(diffDisplay)} ${unit}`,
              `Risk status: ${risk}`,
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
          color: '#64748b',
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#64748b',
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
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Solar vs net load with highlighted peaks, valleys, and
            curtailment‑risk windows.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-xs text-slate-500">
          <span>Shaded bands indicate hours where</span>
          <span className="font-semibold text-slate-300">
            (Solar - Net Load) ≥ {threshold} MW
          </span>
        </div>
      </div>

      <div className="h-[400px] md:h-[480px] w-full">
        {chartData && <Line data={chartData} options={options} />}
      </div>
    </div>
  );
};

export default MainChart;
