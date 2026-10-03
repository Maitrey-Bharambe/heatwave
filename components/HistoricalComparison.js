'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useApi } from '@/lib/client/useApi';
import { useSelectedState } from './SelectedStateProvider';
import { useForecast } from './ForecastPanel';
import { HistoricalBar } from './HistoricalChart';
import { ErrorState, LoadingLine, Skeleton } from './ui';

const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// Observed past 7 days vs forecast next 7 days (both from Open-Meteo, same location).
export default function HistoricalComparison() {
  const { selected, hrefWithState } = useSelectedState();
  const hist = useApi(`/api/history/${selected.code}?days=7`);
  const fc = useForecast();
  const h = hist.data?.state?.code === selected.code ? hist.data : null;

  let body;
  if (hist.loading && !h) {
    body = <div className="stack"><LoadingLine>Loading historical weather…</LoadingLine><Skeleton h={200} /></div>;
  } else if (!h || !h.days.length) {
    body = <ErrorState title="Historical weather unavailable" message={hist.error?.message} onRetry={hist.reload} />;
  } else {
    const pastMax = avg(h.days.map((d) => d.maxTemperature));
    const nextMax = fc.data ? avg(fc.data.days.map((d) => d.maxTemperature)) : null;
    const diff = nextMax != null ? nextMax - pastMax : null;
    body = (
      <div className="stack">
        <div className="metrics" style={{ marginTop: 0 }}>
          <div className="metric"><div className="label">Past 7 days avg max</div><div className="value num">{pastMax.toFixed(1)}°C</div></div>
          <div className="metric"><div className="label">Next 7 days avg max</div><div className="value num">{nextMax != null ? `${nextMax.toFixed(1)}°C` : '—'}</div></div>
          <div className="metric">
            <div className="label">Change</div>
            <div className="value num" style={{ color: diff > 0.5 ? 'var(--danger)' : diff < -0.5 ? 'var(--accent)' : undefined }}>
              {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}°C` : '—'}
            </div>
          </div>
        </div>
        <HistoricalBar days={h.days} height={200} />
        <p className="tiny faint">Observed weather vs forecast for {h.location}. A 7-day comparison describes short-term weather, not long-term climate.</p>
      </div>
    );
  }
  return (
    <section className="card" aria-labelledby="hc-title">
      <div className="card-header">
        <div>
          <div className="eyebrow">Historical comparison</div>
          <h2 id="hc-title">Last 7 days vs next 7 days</h2>
        </div>
        <Link className="btn btn-sm btn-ghost" href={hrefWithState('/historical')}>History <ArrowRight size={14} /></Link>
      </div>
      {body}
    </section>
  );
}
