// Supabase (PostgreSQL) access for the server.
//
// Uses supabase-js with the project's SECRET key, which bypasses Row Level Security.
// RLS is enabled on every table with no policies (see supabase/schema.sql), so the
// public publishable key cannot read anything — only this server-side client can.
// Never import this module from a client component.
import 'server-only';
import { createClient } from '@supabase/supabase-js';

let client;

/** Lazily created so `next build` works without database credentials. */
export function db() {
  if (client) return client;
  // Also accepts the names created by Vercel's Supabase integration.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set');
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  });
  return client;
}

export class DbError extends Error {
  constructor(error) {
    super(error.message || 'Database error');
    this.name = 'DbError';
    this.code = error.code; // Postgres SQLSTATE, e.g. 23505 = unique_violation
    this.details = error.details;
  }
}

export const isUniqueViolation = (err) => err?.code === '23505';

/** Unwraps a supabase-js response: returns data or throws DbError. */
export async function run(query) {
  const { data, error, count } = await query;
  if (error) throw new DbError(error);
  return count !== undefined && count !== null && data === null ? count : data;
}

/** Exact row count for a filtered query. */
export async function count(table, apply = (q) => q) {
  const { count: n, error } = await apply(db().from(table).select('*', { count: 'exact', head: true }));
  if (error) throw new DbError(error);
  return n ?? 0;
}

// Columns are TIMESTAMP (without time zone) holding UTC values; PostgREST returns them
// without a "Z", which JavaScript would otherwise parse as local time.
export function utc(value) {
  if (!value) return null;
  const s = String(value);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
}
export const isoUtc = (value) => (value ? utc(value).toISOString() : null);

/** Normalises the given timestamp fields of a row (or rows) to ISO-8601 UTC strings. */
export function withIso(rows, fields) {
  const fix = (r) => {
    if (!r) return r;
    const out = { ...r };
    for (const f of fields) if (out[f]) out[f] = isoUtc(out[f]);
    return out;
  };
  return Array.isArray(rows) ? rows.map(fix) : fix(rows);
}
