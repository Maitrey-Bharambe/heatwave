'use client';
import { Line } from 'react-chartjs-2';
import { useApi } from '@/lib/client/useApi';
import { fmtDate, fmtWeekday } from '@/lib/format';
import { riskMeta } from '@/lib/riskLevels';
import { useSelectedState } from './SelectedStateProvider';
import { baseOptions, useChartTheme } from './chartSetup';
import { DataStatus, ErrorState, LoadingLine, Skeleton, WeatherIcon } from './ui';

export function useForecast() {
  const { selected } = useSelectedState();
  const res = useApi(`/api/forecast/${selected.code}`);
  const ok = res.data?.state?.code === selected.code ? res.data : null;
  return { ...res, data: ok };
}

export function ForecastStrip({ days }) {
  return (
    <div className="fc-strip">
      {days.map((d, i) => {
        const m = riskMeta(d.risk?.riskLevel);
        return (
          <div key={d.date} className="fc-day" style={{ borderTopColor: m?.color }} title={m ? `Heat-risk estimate: ${m.label} (${d.risk.score})` : 'No risk estimate'}>
            <span className="d">{i === 0 ? 'Today' : fmtWeekday(d.date)}</span>
            <WeatherIcon code={d.weatherCode} size={20} />
            <span className="t num">{Math.round(d.maxTemperature)}° <span>{Math.round(d.minTemperature)}°</span></span>
            {m && <span className="tiny" style={{ color: m.color, fontWeight: 700 }}>{m.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function ForecastChart({ days, height = 280, series = ['max', 'min', 'app'] }) {
  const c = useChartTheme();
  if (!c) return <Skeleton h={height} />;
  const labels = days.map((d, i) => (i === 0 ? 'Today' : `${fmtWeekday(d.date)} ${fmtDate(d.date, { day: 'numeric' })}`));
  const all = {
    max: { label: 'Max temperature', data: days.map((d) => d.maxTemperature), borderColor: c.max, backgroundColor: c.max },
    min: { label: 'Min temperature', data: days.map((d) => d.minTemperature), borderColor: c.min, backgroundColor: c.min },
    app: { label: 'Feels like (max)', data: days.map((d) => d.apparentMax), borderColor: c.app, backgroundColor: c.app, borderDash: [5, 4] },
  };
  const datasets = series.map((k) => ({ ...all[k], tension: 0.35, pointRadius: 3, borderWidth: 2 }));
  return (
    <div className="chart-box" style={{ height }}>
      <Line data={{ labels, datasets }} options={baseOptions(c)} aria-label="7-day temperature forecast chart" role="img" />
    </div>
  );
}

/** Compact dashboard forecast card. */
export default function ForecastPanel() {
  const { selected } = useSelectedState();
  const { data, error, loading, reload } = useForecast();
  return (
    <section className="card" aria-labelledby="fc-title">
      <div className="card-header">
        <div>
          <div className="eyebrow">Forecast</div>
          <h2 id="fc-title">7-day outlook · {selected.name}</h2>
          {data && <div className="sub">Representative location: {data.location.name}. Top colour = daily heat-risk estimate.</div>}
        </div>
        {data && <DataStatus meta={data.meta} />}
      </div>
      {loading && !data ? (
        <div className="stack"><LoadingLine>Fetching forecast…</LoadingLine><Skeleton h={90} /><Skeleton h={220} /></div>
      ) : error && !data ? (
        <ErrorState title="Forecast unavailable" message={error.message} onRetry={reload} />
      ) : data ? (
        <div className="stack">
          <ForecastStrip days={data.days} />
          <ForecastChart days={data.days} height={240} />
        </div>
      ) : null}
    </section>
  );
}
