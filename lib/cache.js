// Small in-memory TTL cache with request de-duplication.
// Concurrent callers for the same key share one in-flight promise, so a burst of
// page loads triggers at most one upstream Open-Meteo request.
const store = globalThis.__climateiqCache || (globalThis.__climateiqCache = new Map());

export async function cached(key, ttlMs, loader, { force = false } = {}) {
  const entry = store.get(key);
  const now = Date.now();
  if (entry?.promise) return entry.promise;
  if (!force && entry && now - entry.storedAt < ttlMs) {
    return { value: entry.value, storedAt: entry.storedAt, fromCache: true };
  }
  const promise = (async () => {
    try {
      const value = await loader();
      const storedAt = Date.now();
      store.set(key, { value, storedAt });
      return { value, storedAt, fromCache: false };
    } catch (err) {
      // keep the previous good value (if any) but clear the in-flight marker
      if (entry?.value !== undefined) store.set(key, { value: entry.value, storedAt: entry.storedAt });
      else store.delete(key);
      throw err;
    }
  })();
  store.set(key, { ...(entry || {}), promise });
  return promise;
}

export function peek(key) {
  const entry = store.get(key);
  return entry && entry.value !== undefined ? { value: entry.value, storedAt: entry.storedAt } : null;
}
