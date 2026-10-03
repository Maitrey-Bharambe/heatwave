// Open-Meteo service — the ONLY module that talks to the weather API.
// Free, key-less endpoints: https://open-meteo.com/en/docs
import { describeWeatherCode } from './weatherCodes.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const TIMEZONE = 'Asia/Kolkata';
const TIMEOUT_MS = 15000;
const MAX_LOCATIONS_PER_REQUEST = 100;

// Archive (ERA5 reanalysis) data lags real time by ~5 days; more recent days come
// from the forecast API's past-days data.
const ARCHIVE_LAG_DAYS = 6;

export class WeatherUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'WeatherUnavailableError';
    this.cause = cause;
  }
}

// ───────────── date helpers (IST) ─────────────
export function istDate(offsetDays = 0, from = new Date()) {
  const d = new Date(from.getTime() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function shiftYears(isoDate, years) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}
// Open-Meteo returns local IST times without an offset, e.g. "2026-10-03T09:15".
const istToDate = (local) => new Date(`${local}:00+05:30`);

async function request(url, params) {
  const qs = new URLSearchParams({ timezone: TIMEZONE, ...params });
  let res;
  try {
    res = await fetch(`${url}?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new WeatherUnavailableError('Could not reach Open-Meteo', err);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.error) {
    throw new WeatherUnavailableError(`Open-Meteo error: ${body?.reason || res.status}`);
  }
  return Array.isArray(body) ? body : [body];
}

const coords = (points) => ({
  latitude: points.map((p) => p.latitude.toFixed(4)).join(','),
  longitude: points.map((p) => p.longitude.toFixed(4)).join(','),
});

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ───────────── current conditions + 7-day forecast ─────────────
const CURRENT_VARS = 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m';
const DAILY_VARS = 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean';

function normaliseForecast(r) {
  const c = r.current;
  const d = r.daily;
  const current = c && typeof c.temperature_2m === 'number'
    ? {
        temperature: c.temperature_2m,
        apparentTemperature: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        weatherCode: c.weather_code,
        weatherCondition: describeWeatherCode(c.weather_code).condition,
        observedAt: istToDate(c.time).toISOString(),
      }
    : null;
  const daily = d
    ? {
        dates: d.time,
        weatherCode: d.weather_code,
        weatherCondition: d.weather_code.map((w) => describeWeatherCode(w).condition),
        maxTemperature: d.temperature_2m_max,
        minTemperature: d.temperature_2m_min,
        apparentMax: d.apparent_temperature_max,
        precipitation: d.precipitation_sum,
        windSpeedMax: d.wind_speed_10m_max,
        humidityMean: d.relative_humidity_2m_mean,
      }
    : null;
  return { current, daily };
}

/** Current weather + 7-day daily forecast for many points (batched multi-location requests). */
export async function fetchCurrentAndForecast(points) {
  const results = [];
  for (const group of chunk(points, MAX_LOCATIONS_PER_REQUEST)) {
    const data = await request(FORECAST_URL, { ...coords(group), current: CURRENT_VARS, daily: DAILY_VARS, forecast_days: '7', wind_speed_unit: 'kmh' });
    if (data.length !== group.length) throw new WeatherUnavailableError('Open-Meteo returned an unexpected number of locations');
    results.push(...data.map(normaliseForecast));
  }
  return results;
}

// ───────────── 5-year same-season baseline ─────────────
/**
 * Mean daily maximum temperature over a ±7-day window around `refDate`, averaged over the
 * previous 5 years, for each point. Returns an array of numbers (or null when unavailable).
 */
export async function fetchSeasonalBaseline(points, refDate = istDate(), years = 5) {
  const sums = points.map(() => ({ total: 0, n: 0 }));
  const requests = [];
  for (let y = 1; y <= years; y++) {
    const center = shiftYears(refDate, y);
    for (const [gi, group] of chunk(points, MAX_LOCATIONS_PER_REQUEST).entries()) {
      requests.push(
        request(ARCHIVE_URL, { ...coords(group), start_date: addDays(center, -7), end_date: addDays(center, 7), daily: 'temperature_2m_max' })
          .then((rows) => rows.forEach((r, i) => {
            const s = sums[gi * MAX_LOCATIONS_PER_REQUEST + i];
            for (const v of r.daily?.temperature_2m_max || []) if (typeof v === 'number') { s.total += v; s.n += 1; }
          })),
      );
    }
  }
  await Promise.all(requests);
  return sums.map((s) => (s.n >= 30 ? s.total / s.n : null));
}

// ───────────── historical daily weather ─────────────
const HISTORY_VARS = 'temperature_2m_max,temperature_2m_min,temperature_2m_mean,apparent_temperature_max';

function normaliseHistory(r, source) {
  const d = r.daily;
  if (!d) return [];
  return d.time.map((date, i) => ({
    date,
    maxTemperature: d.temperature_2m_max[i],
    minTemperature: d.temperature_2m_min[i],
    averageTemperature: d.temperature_2m_mean[i],
    apparentTemperature: d.apparent_temperature_max[i],
    source,
  })).filter((row) => [row.maxTemperature, row.minTemperature, row.averageTemperature, row.apparentTemperature].every((v) => typeof v === 'number'));
}

/**
 * Observed daily weather between start and end (inclusive, YYYY-MM-DD).
 * Older days come from the ERA5 archive; the most recent days from the forecast API's
 * past-days data (the archive is not yet complete for them).
 */
export async function fetchHistorical(latitude, longitude, start, end) {
  const split = istDate(-ARCHIVE_LAG_DAYS);
  const p = { latitude: latitude.toFixed(4), longitude: longitude.toFixed(4), daily: HISTORY_VARS };
  const jobs = [];
  if (start <= split) {
    jobs.push(request(ARCHIVE_URL, { ...p, start_date: start, end_date: end < split ? end : split }).then((r) => normaliseHistory(r[0], 'ERA5 archive')));
  }
  if (end > split) {
    const s = start > split ? start : addDays(split, 1);
    jobs.push(request(FORECAST_URL, { ...p, start_date: s, end_date: end }).then((r) => normaliseHistory(r[0], 'Recent model data')));
  }
  const parts = await Promise.all(jobs);
  return parts.flat().sort((a, b) => a.date.localeCompare(b.date));
}
