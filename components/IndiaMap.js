'use client';
// Leaflet map of India. Browser-only: imported through next/dynamic with ssr:false
// (see LiveMap.js), so `window`, `document` and Leaflet are never touched on the server.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { stateCodeFromGeoName } from '@/lib/states';
import { RISK_LEVELS, riskMeta } from '@/lib/riskLevels';
import { fmtTime, fmtTemp } from '@/lib/format';
import { useTheme } from './ThemeToggle';

const GEOJSON_URL = '/geojson/india-states.geojson';
const INDIA_BOUNDS = L.latLngBounds([6.5, 68], [37.5, 97.5]);
// Esri gray canvas basemaps (no API key required).
const TILES = {
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
};
const LABELS = {
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
};
const ATTRIBUTION = 'Basemap &copy; <a href="https://www.esri.com/">Esri</a> · Weather: <a href="https://open-meteo.com/">Open-Meteo</a> · Boundaries: <a href="https://github.com/udit-001/india-maps-data">india-maps-data</a>';
const LEVEL_ORDER = Object.fromEntries(RISK_LEVELS.map((l, i) => [l.key, i]));

let geojsonPromise;
const loadGeojson = () => (geojsonPromise ||= fetch(GEOJSON_URL).then((r) => {
  if (!r.ok) throw new Error('GeoJSON unavailable');
  return r.json();
}).catch((e) => { geojsonPromise = null; throw e; }));

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function pointLevel(p, forecastMode) {
  return forecastMode ? p.forecastPeak?.riskLevel ?? null : p.riskLevel;
}
function pointScore(p, forecastMode) {
  return forecastMode ? p.forecastPeak?.score ?? null : p.riskScore;
}

/** Highest monitored risk per state (current or 7-day forecast peak). */
export function summariseByState(points, forecastMode) {
  const out = {};
  for (const p of points) {
    const level = pointLevel(p, forecastMode);
    if (!level) continue;
    const score = pointScore(p, forecastMode);
    const cur = out[p.stateCode];
    if (!cur || score > cur.score) out[p.stateCode] = { level, score, point: p.name };
  }
  return out;
}

function popupHtml(p, forecastMode) {
  const m = riskMeta(p.riskLevel);
  const fm = riskMeta(p.forecastPeak?.riskLevel);
  return `
  <div class="popup">
    <div class="eyebrow">Heat risk${p.isRepresentative ? ' · representative location' : ''}</div>
    <h4>${esc(p.name)}</h4>
    <div class="loc">${esc(p.state)}</div>
    <dl>
      <div><dt>Temperature</dt><dd>${esc(fmtTemp(p.temperature))}</dd></div>
      <div><dt>Feels like</dt><dd>${esc(fmtTemp(p.apparentTemperature))}</dd></div>
      <div><dt>Humidity</dt><dd>${p.humidity ?? '—'}%</dd></div>
      <div><dt>Condition</dt><dd>${esc(p.weatherCondition || '—')}</dd></div>
      <div><dt>Risk score</dt><dd>${p.riskScore ?? '—'} / 100</dd></div>
      <div><dt>Risk level</dt><dd>${m ? `<span class="risk-pill${p.riskLevel === 'MEDIUM' || p.riskLevel === 'LOW' ? ' on-light' : ''}" style="background:${m.color}">${m.label.toUpperCase()}</span>` : 'N/A'}</dd></div>
      ${forecastMode && fm ? `<div style="grid-column:1/-1"><dt>7-day forecast peak</dt><dd style="color:${fm.color}">${fm.label.toUpperCase()} · ${p.forecastPeak.score} (${esc(p.forecastPeak.date)})</dd></div>` : ''}
    </dl>
    <div class="actions">
      <button type="button" class="btn" data-action="details" data-code="${esc(p.stateCode)}">View details</button>
      <button type="button" class="btn btn-primary" data-action="select" data-code="${esc(p.stateCode)}">Select state</button>
    </div>
    <div class="upd">Updated ${esc(fmtTime(p.observedAt))} IST</div>
  </div>`;
}

export default function IndiaMap({ points = [], selectedCode, onSelectState, onViewDetails, layers, filter = 'ALL', onGeoError, wheelZoom = true }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const labelRef = useRef(null);
  const geoRef = useRef(null);
  const pointsLayerRef = useRef(null);
  const valueLayerRef = useRef(null);
  const heatRef = useRef(null);
  const summaryRef = useRef({});
  const selectedRef = useRef(selectedCode);
  const clickedFromMapRef = useRef(false);
  const cbRef = useRef({ onSelectState, onViewDetails });
  cbRef.current = { onSelectState, onViewDetails };
  const optsRef = useRef({ layers, filter });
  optsRef.current = { layers, filter };
  const theme = useTheme();
  const forecastMode = !!layers.forecast;

  // ── create map once ──
  useEffect(() => {
    const map = L.map(elRef.current, {
      zoomSnap: 0.25, minZoom: 3.5, maxZoom: 10, maxBounds: INDIA_BOUNDS.pad(0.6), maxBoundsViscosity: 0.8,
      worldCopyJump: false, attributionControl: true, preferCanvas: false, scrollWheelZoom: wheelZoom,
    });
    // Embedded maps don't hijack page scrolling: wheel zoom turns on after the user clicks the map.
    if (!wheelZoom) {
      map.on('click focus', () => map.scrollWheelZoom.enable());
      map.on('mouseout', () => map.scrollWheelZoom.disable());
    }
    map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
    map.createPane('labels').style.zIndex = 450;
    map.getPane('labels').style.pointerEvents = 'none';
    map.createPane('points').style.zIndex = 520;
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    pointsLayerRef.current = L.layerGroup().addTo(map);
    valueLayerRef.current = L.layerGroup().addTo(map);

    // Popup buttons → React callbacks
    map.on('popupopen', (e) => {
      e.popup.getElement()?.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const code = btn.dataset.code;
          if (btn.dataset.action === 'select') {
            clickedFromMapRef.current = true;
            cbRef.current.onSelectState?.(code);
            map.closePopup();
          } else cbRef.current.onViewDetails?.(code);
        });
      });
    });

    let cancelled = false;
    loadGeojson().then((data) => {
      if (cancelled) return;
      geoRef.current = L.geoJSON(data, {
        style: () => ({ weight: 0.8 }),
        onEachFeature: (feature, layer) => {
          const code = stateCodeFromGeoName(feature.properties.st_nm);
          feature.properties.code = code;
          layer.bindTooltip(() => {
            const s = summaryRef.current[code];
            const m = riskMeta(s?.level);
            return `<strong>${esc(feature.properties.st_nm)}</strong><br/>${m
              ? `Current monitored risk: <strong style="color:${m.color}">${m.label.toUpperCase()}</strong> <span style="opacity:.7">(highest: ${esc(s.point)}, ${s.score})</span>`
              : '<span style="opacity:.7">No risk data</span>'}`;
          }, { sticky: true, direction: 'top', offset: [0, -6] });
          layer.on({
            mouseover: () => {
              if (code !== selectedRef.current) layer.setStyle({ weight: 2, color: cssVar('--text-muted') });
            },
            mouseout: () => geoRef.current && restyle(layer),
            click: () => {
              clickedFromMapRef.current = true;
              cbRef.current.onSelectState?.(code);
            },
          });
        },
      }).addTo(map);
      geoRef.current.bringToBack();
      restyleAll();
    }).catch(() => onGeoError?.());

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(elRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      geoRef.current = null;
      heatRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── basemap follows light/dark theme ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileRef.current?.remove();
    labelRef.current?.remove();
    const mode = theme === 'dark' ? 'dark' : 'light';
    tileRef.current = L.tileLayer(TILES[mode], { attribution: ATTRIBUTION, maxZoom: 16 }).addTo(map);
    labelRef.current = L.tileLayer(LABELS[mode], { pane: 'labels', maxZoom: 16, opacity: 0.85 }).addTo(map);
    tileRef.current.bringToBack();
    restyleAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // ── state polygon styling: risk shading + selected highlight + filter ──
  function restyle(layer) {
    const { layers, filter } = optsRef.current;
    const code = layer.feature.properties.code;
    const s = summaryRef.current[code];
    const selected = code === selectedRef.current;
    const shade = layers.stateRisk && s;
    const dimmed = filter !== 'ALL' && (!s || s.level !== filter);
    const visible = layers.boundaries || selected;
    layer.setStyle({
      color: selected ? cssVar('--primary') : cssVar('--border-strong'),
      weight: selected ? 3 : visible ? 0.9 : 0,
      opacity: visible ? 1 : 0,
      fillColor: shade ? riskMeta(s.level).color : cssVar('--surface-3'),
      fillOpacity: shade ? (dimmed ? 0.06 : 0.38) : layers.boundaries ? 0.12 : 0,
    });
    if (selected) layer.bringToFront();
  }
  function restyleAll() {
    geoRef.current?.eachLayer(restyle);
  }

  // ── points, value labels, heatmap ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    summaryRef.current = summariseByState(points, forecastMode);
    restyleAll();

    const group = pointsLayerRef.current;
    const values = valueLayerRef.current;
    group.clearLayers();
    values.clearLayers();
    for (const p of points) {
      const level = pointLevel(p, forecastMode);
      const m = riskMeta(level);
      const dimmed = filter !== 'ALL' && level !== filter;
      if (layers.points) {
        const marker = L.circleMarker([p.latitude, p.longitude], {
          pane: 'points',
          radius: p.isRepresentative ? 8 : 6.5,
          color: theme === 'dark' ? '#0e1729' : '#ffffff',
          weight: 1.5,
          fillColor: m ? m.color : '#94a3b8',
          fillOpacity: dimmed ? 0.18 : 0.95,
          opacity: dimmed ? 0.3 : 1,
        });
        marker.bindPopup(() => popupHtml(p, forecastMode), { maxWidth: 280, minWidth: 230 });
        marker.bindTooltip(`<strong>${esc(p.name)}</strong> · ${esc(fmtTemp(p.temperature))} · ${m ? m.label : 'No data'}${typeof pointScore(p, forecastMode) === 'number' ? ` (${pointScore(p, forecastMode)})` : ''}`, { direction: 'top', offset: [0, -8] });
        marker.addTo(group);
        if (!dimmed && (level === 'EXTREME' || level === 'HIGH')) marker.bringToFront();
      }
      const labelValue = layers.temperature ? (typeof p.temperature === 'number' ? `${Math.round(p.temperature)}°` : null)
        : layers.humidity ? (typeof p.humidity === 'number' ? `${p.humidity}%` : null) : null;
      if (labelValue && !dimmed) {
        L.tooltip({ permanent: true, direction: 'right', offset: [8, 0], className: 'value-label', pane: 'points' })
          .setLatLng([p.latitude, p.longitude]).setContent(labelValue).addTo(values);
      }
    }

    // Heatmap from real risk scores (intensity = score / 100).
    let cancelled = false;
    (async () => {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
      if (!layers.heatmap) return;
      window.L = L; // leaflet.heat registers itself on the global L
      await import('leaflet.heat');
      if (cancelled || !mapRef.current) return;
      const data = points
        .filter((p) => typeof pointScore(p, forecastMode) === 'number' && (filter === 'ALL' || pointLevel(p, forecastMode) === filter))
        .map((p) => [p.latitude, p.longitude, Math.max(0.05, pointScore(p, forecastMode) / 100)]);
      heatRef.current = L.heatLayer(data, {
        radius: 38, blur: 30, maxZoom: 7, max: 1, minOpacity: 0.25,
        gradient: { 0.2: '#16a34a', 0.35: '#84cc16', 0.5: '#eab308', 0.7: '#f97316', 0.9: '#b91c1c' },
      }).addTo(map);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, layers, filter, theme, forecastMode]);

  // ── selected state: highlight, and fly to it when chosen outside the map ──
  useEffect(() => {
    selectedRef.current = selectedCode;
    restyleAll();
    if (clickedFromMapRef.current) { clickedFromMapRef.current = false; return; }
    const map = mapRef.current;
    let target;
    geoRef.current?.eachLayer((l) => { if (l.feature.properties.code === selectedCode) target = l; });
    if (map && target) map.flyToBounds(target.getBounds(), { padding: [40, 40], maxZoom: 6.5, duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCode]);

  return <div ref={elRef} className="map-canvas" role="region" aria-label="Interactive map of India showing live heat risk" />;
}
