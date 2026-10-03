'use client';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

// Tiny SWR-style data hook. Components that request the same URL share one request
// and one cached response, so e.g. WeatherCard and HeatRiskCard don't double-fetch.
const store = new Map(); // url -> { data, error, loading, ts, promise, listeners:Set }

function entry(url) {
  if (!store.has(url)) store.set(url, { data: undefined, error: null, loading: false, ts: 0, promise: null, listeners: new Set() });
  return store.get(url);
}
function emit(e) {
  e.snapshot = { data: e.data, error: e.error, loading: e.loading };
  e.listeners.forEach((l) => l());
}

export async function fetchJson(url, options) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function load(url, { force = false } = {}) {
  const e = entry(url);
  if (e.promise) return e.promise;
  if (!force && e.data !== undefined && Date.now() - e.ts < 30000) return Promise.resolve(e.data);
  e.loading = true;
  e.error = null;
  emit(e);
  e.promise = fetchJson(url)
    .then((data) => { e.data = data; e.ts = Date.now(); return data; })
    .catch((err) => { e.error = err; })
    .finally(() => { e.loading = false; e.promise = null; emit(e); });
  return e.promise;
}

export function invalidate(prefix) {
  for (const [url, e] of store) if (url.startsWith(prefix)) { e.ts = 0; if (e.listeners.size) load(url, { force: true }); }
}

const EMPTY = { data: undefined, error: null, loading: true };

export function useApi(url, { refreshInterval } = {}) {
  const subscribe = useCallback((cb) => {
    if (!url) return () => {};
    const e = entry(url);
    e.listeners.add(cb);
    return () => e.listeners.delete(cb);
  }, [url]);
  const getSnapshot = useCallback(() => {
    if (!url) return EMPTY;
    const e = entry(url);
    if (!e.snapshot) e.snapshot = { data: e.data, error: e.error, loading: e.data === undefined && !e.error ? true : e.loading };
    return e.snapshot;
  }, [url]);
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  useEffect(() => {
    if (url) load(url);
  }, [url]);

  useEffect(() => {
    if (!url || !refreshInterval) return undefined;
    const id = setInterval(() => load(url, { force: true }), refreshInterval);
    return () => clearInterval(id);
  }, [url, refreshInterval]);

  const reload = useCallback((extraQuery) => {
    if (!url) return Promise.resolve();
    if (extraQuery) {
      // e.g. reload('refresh=1') asks the server to refresh live data, then stores it under `url`.
      const e = entry(url);
      e.loading = true; emit(e);
      return fetchJson(`${url}${url.includes('?') ? '&' : '?'}${extraQuery}`)
        .then((data) => { e.data = data; e.error = null; e.ts = Date.now(); })
        .catch((err) => { e.error = err; })
        .finally(() => { e.loading = false; emit(e); });
    }
    return load(url, { force: true });
  }, [url]);

  return { data: snap.data, error: snap.error, loading: snap.loading, reload };
}
