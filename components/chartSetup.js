'use client';
import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from 'chart.js';
import { useTheme } from './ThemeToggle';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const read = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Theme-aware chart colours, re-read whenever light/dark mode changes. */
export function useChartTheme() {
  const theme = useTheme();
  return useMemo(() => {
    if (typeof window === 'undefined') return null;
    return {
      theme,
      text: read('--text-muted'),
      grid: read('--chart-grid'),
      max: read('--chart-max'),
      min: read('--chart-min'),
      avg: read('--chart-avg'),
      app: read('--chart-app'),
      surface: read('--surface'),
      border: read('--border'),
      font: getComputedStyle(document.body).fontFamily,
    };
  }, [theme]);
}

export function baseOptions(c, { yTitle = 'Temperature (°C)', xTitle } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { color: c.text, boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { family: c.font, size: 12 } } },
      tooltip: {
        backgroundColor: c.surface, titleColor: c.text, bodyColor: c.text, borderColor: c.border, borderWidth: 1, padding: 10,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y == null ? '—' : ctx.parsed.y.toFixed(1)}${ctx.dataset.unit ?? ' °C'}` },
      },
    },
    scales: {
      x: { ticks: { color: c.text, font: { family: c.font, size: 11 }, maxRotation: 0, autoSkipPadding: 12 }, grid: { display: false }, title: xTitle ? { display: true, text: xTitle, color: c.text } : undefined },
      y: { ticks: { color: c.text, font: { family: c.font, size: 11 }, callback: (v) => `${v}°` }, grid: { color: c.grid }, title: { display: true, text: yTitle, color: c.text, font: { family: c.font, size: 11 } } },
    },
  };
}
