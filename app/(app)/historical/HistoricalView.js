'use client';
import { useMemo, useState } from 'react';
import { useSelectedState } from '@/components/SelectedStateProvider';
import StateSelector from '@/components/StateSelector';
import { HistoricalBar, HistoricalLine } from '@/components/HistoricalChart';
import { DataStatus, EmptyState, ErrorState, LoadingLine, Notice, Skeleton } from '@/components/ui';
import { useApi } from '@/lib/client/useApi';
import { fmtDate, fmtTemp } from '@/lib/format';

const isoDaysAgo = (n) => {
  const d = new Date(Date.now() + 5.5 * 3600000 - n * 86400000); // IST calendar date
  return d.toISOString().slice(0, 10);
};

export default function HistoricalView() {
  const { selected } = useSelectedState();
  const [mode, setMode] = useState('7');
  const [custom, setCustom] = useState({ start: isoDaysAgo(60), end: isoDaysAgo(31) });
  const [applied, setApplied] = useState(custom);

  const url = mode === 'custom'
    ? `/api/history/${selected.code}?start=${applied.start}&end=${applied.end}`
    : `/api/history/${selected.code}?days=${mode}`;
  const { data: raw, error, loading, reload } = useApi(url);
  const data = raw?.state?.code === selected.code ? raw : null;

  const stats = useMemo(() => {
    if (!data?.days.length) return null;
    const d = data.days;
    const hottest = d.reduce((a, b) => (b.maxTemperature > a.maxTemperature ? b : a));
    const coolest = d.reduce((a, b) => (b.minTemperature < a.minTemperature ? b : a));
    const avg = (k) => d.reduce((s, r) => s + r[k], 0) / d.length;
    return { hottest, coolest, avgMax: avg('maxTemperature'), avgMin: avg('minTemperature'), hotDays: d.filter((r) => r.maxTemperature >= 38).length };
  }, [data]);

  const sources = data ? [...new Set(data.days.map((d) => d.source))] : [];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Historical weather · observed</div>
          <h1>{selected.name} history</h1>
          <p className="lead">Past daily weather at {data?.location ?? 'the representative location'}. This is <strong>observed historical weather</strong>, not a forecast.</p>
        </div>
        <StateSelector />
      </div>

      <section className="card">
        <div className="row-between">
          <div className="seg" role="group" aria-label="Date range">
            {[['7', 'Last 7 days'], ['30', 'Last 30 days'], ['custom', 'Custom range']].map(([k, label]) => (
              <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)}>{label}</button>
            ))}
          </div>
          {data && <DataStatus meta={data.meta} />}
        </div>
        {mode === 'custom' && (
          <form className="row" style={{ marginTop: '0.9rem', flexWrap: 'wrap', alignItems: 'flex-end' }} onSubmit={(e) => { e.preventDefault(); setApplied(custom); }}>
            <div className="field"><label htmlFor="h-start">Start date</label><input id="h-start" className="input" type="date" min="1940-01-01" max={isoDaysAgo(1)} value={custom.start} onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))} required /></div>
            <div className="field"><label htmlFor="h-end">End date</label><input id="h-end" className="input" type="date" min="1940-01-01" max={isoDaysAgo(1)} value={custom.end} onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))} required /></div>
            <button className="btn btn-primary" type="submit">Show range</button>
            <span className="tiny faint">Up to 366 days, from 1940 to yesterday.</span>
          </form>
        )}
      </section>

      {loading && !data ? (
        <div className="card stack"><LoadingLine>Loading historical weather…</LoadingLine><Skeleton h={300} /></div>
      ) : error && !data ? (
        <div className="card"><ErrorState title="Historical weather unavailable" message={error.message} onRetry={reload} /></div>
      ) : data && !data.days.length ? (
        <div className="card"><EmptyState title="No data for this range" message="Open-Meteo returned no complete days for the selected period." /></div>
      ) : data ? (
        <>
          {data.meta?.stale && <Notice kind="warn">{data.meta.error}</Notice>}
          <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            <div className="card"><div className="eyebrow">Average max</div><div className="wx-temp num" style={{ fontSize: '1.8rem' }}>{fmtTemp(stats.avgMax)}</div></div>
            <div className="card"><div className="eyebrow">Average min</div><div className="wx-temp num" style={{ fontSize: '1.8rem' }}>{fmtTemp(stats.avgMin)}</div></div>
            <div className="card"><div className="eyebrow">Hottest day</div><div className="wx-temp num" style={{ fontSize: '1.8rem' }}>{fmtTemp(stats.hottest.maxTemperature)}</div><div className="small muted">{fmtDate(stats.hottest.date, { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
            <div className="card"><div className="eyebrow">Days ≥ 38 °C</div><div className="wx-temp num" style={{ fontSize: '1.8rem' }}>{stats.hotDays}</div><div className="small muted">of {data.days.length} days</div></div>
          </div>

          <section className="card">
            <div className="card-header"><div><div className="eyebrow">Line chart</div><h2>Daily temperatures</h2><div className="sub">{fmtDate(data.start, { day: 'numeric', month: 'short', year: 'numeric' })} – {fmtDate(data.end, { day: 'numeric', month: 'short', year: 'numeric' })}</div></div></div>
            <HistoricalLine days={data.days} />
          </section>
          <section className="card">
            <div className="card-header"><div><div className="eyebrow">Bar chart</div><h2>Daily maximum and minimum</h2></div></div>
            <HistoricalBar days={data.days} />
          </section>

          <section className="card card-flush">
            <div className="card-header" style={{ padding: '1rem 1.2rem 0' }}><div><h2>Daily records</h2><div className="sub">Stored in the historical_weather table · source: {sources.join(', ')}</div></div></div>
            <div className="table-wrap" style={{ maxHeight: 420 }}>
              <table className="data">
                <thead><tr><th>Date</th><th>Min</th><th>Max</th><th>Average</th><th>Feels like (max)</th></tr></thead>
                <tbody>
                  {[...data.days].reverse().map((d) => (
                    <tr key={d.date}>
                      <td className="num">{fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="num">{fmtTemp(d.minTemperature)}</td>
                      <td className="num">{fmtTemp(d.maxTemperature)}</td>
                      <td className="num">{fmtTemp(d.averageTemperature)}</td>
                      <td className="num">{fmtTemp(d.apparentTemperature)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="tiny faint">Older days come from the ERA5 reanalysis archive; the most recent days come from Open-Meteo&apos;s recent model data because the archive lags by about 5 days. A short recent period describes weather, not long-term climate.</p>
        </>
      ) : null}
    </>
  );
}
