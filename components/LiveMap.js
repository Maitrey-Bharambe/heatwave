'use client';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Layers, Loader2, X } from 'lucide-react';
import { useApi } from '@/lib/client/useApi';
import { RISK_LEVELS } from '@/lib/riskLevels';
import { useSelectedState } from './SelectedStateProvider';
import StateSelector from './StateSelector';
import RiskLegend from './RiskLegend';
import { DataStatus, Notice } from './ui';

// Leaflet needs the browser → load the map client-side only.
const IndiaMap = dynamic(() => import('./IndiaMap'), {
  ssr: false,
  loading: () => <div className="map-overlay-loading"><div className="loading-line"><Loader2 size={16} className="spin" /> Loading map…</div></div>,
});

export const MAP_REFRESH_MS = 15 * 60 * 1000;

const LAYER_OPTIONS = [
  ['boundaries', 'State Boundaries'],
  ['points', 'Live Weather Points'],
  ['stateRisk', 'Heat Risk (state shading)'],
  ['heatmap', 'Heatmap'],
  ['temperature', 'Temperature labels'],
  ['humidity', 'Humidity labels'],
  ['forecast', 'Forecast Risk (7-day peak)'],
];

export default function LiveMap({ variant = 'dashboard' }) {
  const router = useRouter();
  const { selected, setSelectedState, hrefWithState } = useSelectedState();
  const { data, error, loading, reload } = useApi('/api/map/risk', { refreshInterval: MAP_REFRESH_MS });
  const [layers, setLayers] = useState({ boundaries: true, points: true, stateRisk: true, heatmap: variant === 'full', temperature: false, humidity: false, forecast: false });
  const [filter, setFilter] = useState('ALL');
  const [layersOpen, setLayersOpen] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const full = variant === 'full';

  const points = useMemo(() => data?.points ?? [], [data]);
  const counts = useMemo(() => {
    const c = Object.fromEntries(RISK_LEVELS.map((l) => [l.key, 0]));
    for (const p of points) {
      const lvl = layers.forecast ? p.forecastPeak?.riskLevel : p.riskLevel;
      if (lvl) c[lvl] += 1;
    }
    return c;
  }, [points, layers.forecast]);

  const toggle = (key) => setLayers((l) => {
    const next = { ...l, [key]: !l[key] };
    // value labels are mutually exclusive to keep the map readable
    if (key === 'temperature' && next.temperature) next.humidity = false;
    if (key === 'humidity' && next.humidity) next.temperature = false;
    return next;
  });

  return (
    <section className="card card-flush map-card" aria-labelledby="live-map-title">
      <div className="map-head">
        <div>
          <div className="eyebrow">Live monitoring · {points.length || '—'} locations</div>
          <h2 id="live-map-title" style={{ fontSize: full ? '1.2rem' : undefined }}>Live India Heat-Risk Map</h2>
          <p className="small muted" style={{ marginTop: 2 }}>
            Click a state or a monitoring point to select it. Selected: <strong style={{ color: 'var(--text)' }}>{selected.name}</strong>
          </p>
        </div>
        <DataStatus meta={data?.meta} loading={loading} onRefresh={() => reload('refresh=1')} refreshLabel="Refresh Live Data" />
      </div>

      {full && (
        <div className="map-toolbar">
          <StateSelector showDropdown={false} />
          <div className="seg" role="group" aria-label="Filter by risk level">
            <button type="button" aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>All</button>
            {RISK_LEVELS.map((l) => (
              <button type="button" key={l.key} aria-pressed={filter === l.key} onClick={() => setFilter(l.key)}>
                <span className="dot" style={{ background: l.color, width: 8, height: 8, marginRight: 5 }} />
                {l.label} <span className="faint">({counts[l.key]})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`map-frame${full ? ' full' : ''}`}>
        <IndiaMap
          points={points}
          selectedCode={selected.code}
          onSelectState={(code) => setSelectedState(code, { source: 'map' })}
          onViewDetails={(code) => router.push(`/heat-risk?state=${code}`)}
          layers={layers}
          filter={filter}
          onGeoError={() => setGeoError(true)}
          wheelZoom={full}
        />

        {loading && !data && (
          <div className="map-overlay-loading"><div className="loading-line"><Loader2 size={16} className="spin" /> Fetching live weather for monitoring points…</div></div>
        )}
        {loading && data && (
          <div className="map-panel" style={{ left: '50%', top: 12, transform: 'translateX(-50%)' }}>
            <span className="loading-line"><Loader2 size={14} className="spin" /> Updating monitoring points…</span>
          </div>
        )}
        {(error && !data) || geoError ? (
          <div className="map-panel" style={{ left: 12, top: 12, right: 220, maxWidth: 420 }}>
            <Notice kind="error">
              {geoError ? 'Map boundary data unavailable.' : 'Map data unavailable. Live weather could not be retrieved, so no risk values are shown.'}{' '}
              {!geoError && <button type="button" className="btn btn-sm" style={{ marginLeft: 6 }} onClick={() => reload()}>Retry</button>}
            </Notice>
          </div>
        ) : null}

        <div className={`map-panel map-layers${layersOpen ? ' expanded' : ''}`}>
          <div className="row-between">
            <div className="title" style={{ margin: 0 }}>Map layers</div>
            <button type="button" className="btn btn-ghost btn-sm toggle-btn icon-btn" aria-label={layersOpen ? 'Hide layers' : 'Show layers'} onClick={() => setLayersOpen((o) => !o)}>
              {layersOpen ? <X size={15} /> : <Layers size={15} />}
            </button>
          </div>
          <div className="layer-body" style={{ marginTop: 6 }}>
            {LAYER_OPTIONS.map(([key, label]) => (
              <label key={key}>
                <input type="checkbox" checked={layers[key]} onChange={() => toggle(key)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <RiskLegend className="map-panel map-legend" forecast={layers.forecast} />
      </div>

      {!full && (
        <div className="row-between" style={{ padding: '0.7rem 1.1rem', borderTop: '1px solid var(--border)' }}>
          <span className="tiny muted">State colour = highest risk among its monitoring points. Points are real city coordinates; values are fetched live.</span>
          <a className="btn btn-sm" href={hrefWithState('/map')}>Open full map</a>
        </div>
      )}
    </section>
  );
}
