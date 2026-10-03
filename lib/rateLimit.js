// Fixed-window in-memory rate limiter (per server instance) for auth endpoints.
const buckets = globalThis.__climateiqRate || (globalThis.__climateiqRate = new Map());

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return { ok: true };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.start + windowMs - now) / 1000) };
  return { ok: true };
}

export function clientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}
