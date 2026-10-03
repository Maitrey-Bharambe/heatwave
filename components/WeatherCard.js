'use client';
import { Droplets, MapPin, Thermometer, Wind } from 'lucide-react';
import { useApi } from '@/lib/client/useApi';
import { fmtTemp, fmtTime } from '@/lib/format';
import { useSelectedState } from './SelectedStateProvider';
import { CardSkeleton, DataStatus, ErrorState, Notice, WeatherIcon } from './ui';

export default function WeatherCard() {
  const { selected } = useSelectedState();
  const { data, error, loading, reload } = useApi(`/api/weather/${selected.code}`);
  const rep = data?.state?.code === selected.code ? data.representative : null;
  const c = rep?.current;

  return (
    <section className="card" aria-labelledby="wx-title">
      <div className="card-header">
        <div>
          <div className="eyebrow">Current weather</div>
          <h2 id="wx-title">{selected.name}</h2>
        </div>
        {c && <span className="badge">{c.weatherCondition}</span>}
      </div>
      {loading && !c ? (
        <CardSkeleton label="Loading weather data…" />
      ) : error && !c ? (
        <ErrorState title="Weather unavailable" message="We couldn't retrieve current weather for this location." onRetry={reload} />
      ) : c ? (
        <>
          <div className="wx-main">
            <div className="wx-icon"><WeatherIcon code={c.weatherCode} size={28} /></div>
            <div>
              <div className="wx-temp num">{c.temperature.toFixed(1)}<sup>°C</sup></div>
              <div className="small muted">Feels like <strong style={{ color: 'var(--text)' }}>{fmtTemp(c.apparentTemperature)}</strong></div>
            </div>
          </div>
          <div className="metrics">
            <div className="metric"><div className="label"><Thermometer size={12} /> Max / min</div><div className="value num">{rep.today ? `${Math.round(rep.today.maxTemperature)}° / ${Math.round(rep.today.minTemperature)}°` : "—"}</div></div>
            <div className="metric"><div className="label"><Droplets size={12} /> Humidity</div><div className="value num">{c.humidity}%</div></div>
            <div className="metric"><div className="label"><Wind size={12} /> Wind</div><div className="value num">{c.windSpeed.toFixed(0)} km/h</div></div>
          </div>
          <div className="rep-note"><MapPin size={13} style={{ flex: 'none', marginTop: 2 }} /><span>Representative location: <strong>{rep.name}, {selected.name}</strong>. Conditions vary across the state.</span></div>
          <div className="row-between" style={{ marginTop: '0.6rem' }}>
            <span className="tiny faint">Observed {fmtTime(c.observedAt)} IST</span>
            <DataStatus meta={data.meta} />
          </div>
          {data.meta?.stale && <div style={{ marginTop: 8 }}><Notice kind="warn">{data.meta.error}</Notice></div>}
        </>
      ) : null}
    </section>
  );
}
