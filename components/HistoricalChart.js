'use client';
import { Bar, Line } from 'react-chartjs-2';
import { fmtDate } from '@/lib/format';
import { baseOptions, useChartTheme } from './chartSetup';
import { Skeleton } from './ui';

export function HistoricalLine({ days, height = 300 }) {
  const c = useChartTheme();
  if (!c) return <Skeleton h={height} />;
  const labels = days.map((d) => fmtDate(d.date));
  const ds = (label, key, color, extra = {}) => ({
    label, data: days.map((d) => d[key]), borderColor: color, backgroundColor: color,
    tension: 0.3, pointRadius: days.length > 45 ? 0 : 2, borderWidth: 2, ...extra,
  });
  return (
    <div className="chart-box" style={{ height }}>
      <Line
        role="img"
        aria-label="Historical daily temperature line chart"
        data={{ labels, datasets: [ds('Max', 'maxTemperature', c.max), ds('Average', 'averageTemperature', c.avg), ds('Min', 'minTemperature', c.min), ds('Feels like (max)', 'apparentTemperature', c.app, { borderDash: [5, 4] })] }}
        options={baseOptions(c)}
      />
    </div>
  );
}

export function HistoricalBar({ days, height = 260 }) {
  const c = useChartTheme();
  if (!c) return <Skeleton h={height} />;
  const labels = days.map((d) => fmtDate(d.date));
  return (
    <div className="chart-box" style={{ height }}>
      <Bar
        role="img"
        aria-label="Historical daily maximum and minimum temperature bar chart"
        data={{
          labels,
          datasets: [
            { label: 'Max temperature', data: days.map((d) => d.maxTemperature), backgroundColor: c.max, borderRadius: 3, maxBarThickness: 18 },
            { label: 'Min temperature', data: days.map((d) => d.minTemperature), backgroundColor: c.min, borderRadius: 3, maxBarThickness: 18 },
          ],
        }}
        options={baseOptions(c)}
      />
    </div>
  );
}
