// Live heat-risk pipeline:
//   Monitoring points (PostgreSQL) → Open-Meteo (one batched request) → heat-risk engine
//   → persisted to PostgreSQL (weather_records, heat_risk, forecasts) → API → map / dashboard
//
// The snapshot is cached in memory for SNAPSHOT_TTL_MS and shared by every page, so the
// weather API is called at most once per TTL regardless of traffic. If Open-Meteo is
// unavailable, the most recent snapshot stored in PostgreSQL is served and labelled stale.
import prisma from './prisma.js';
import { cached, peek } from './cache.js';
import { fetchCurrentAndForecast, fetchSeasonalBaseline, istDate } from './openMeteo.js';
import { computeCurrentRisk, computeDailyRisks } from './heatRisk.js';
import { describeWeatherCode } from './weatherCodes.js';
import { RISK_LEVELS } from './riskLevels.js';

export const SNAPSHOT_TTL_MS = 15 * 60 * 1000; // Open-Meteo current data updates every 15 minutes
const MIN_MANUAL_REFRESH_MS = 60 * 1000;
const RETENTION_DAYS = 7;
const SNAPSHOT_KEY = 'risk-snapshot';

export async function getStates() {
  const { value } = await cached('states', 60 * 60 * 1000, () =>
    prisma.state.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, type: true, capital: true, latitude: true, longitude: true } }),
  );
  return value;
}

export async function getStateByCode(code) {
  const states = await getStates();
  return states.find((s) => s.code === String(code || '').toUpperCase()) || null;
}

async function getMonitoringPoints() {
  const { value } = await cached('monitoring-points', 60 * 60 * 1000, () =>
    prisma.monitoringLocation.findMany({
      orderBy: [{ stateId: 'asc' }, { isRepresentative: 'desc' }, { name: 'asc' }],
      include: { state: { select: { id: true, code: true, name: true } } },
    }),
  );
  return value;
}

async function getBaselines(points) {
  // Same-season 5-year baseline changes slowly → cache for a day. Optional factor:
  // if the archive request fails, risk is computed without it (weights renormalised).
  try {
    const { value } = await cached(`baseline:${istDate()}`, 24 * 60 * 60 * 1000, () => fetchSeasonalBaseline(points));
    return value;
  } catch (err) {
    console.warn('[riskService] seasonal baseline unavailable:', err.message);
    return points.map(() => null);
  }
}

function summariseStates(points) {
  const order = RISK_LEVELS.map((l) => l.key);
  const states = {};
  for (const p of points) {
    if (!p.risk) continue;
    const s = states[p.stateCode] || (states[p.stateCode] = { maxScore: -1, maxRiskLevel: null, maxPoint: null, pointCount: 0 });
    s.pointCount += 1;
    if (p.risk.score > s.maxScore) {
      s.maxScore = p.risk.score;
      s.maxRiskLevel = p.risk.riskLevel;
      s.maxPoint = p.name;
    }
  }
  return { states, levelOrder: order };
}

async function buildLiveSnapshot() {
  const locations = await getMonitoringPoints();
  const [weather, baselines] = await Promise.all([fetchCurrentAndForecast(locations), getBaselines(locations)]);
  const fetchedAt = new Date().toISOString();

  const points = locations.map((loc, i) => {
    const { current, daily } = weather[i];
    const baselineMax = baselines[i];
    const risk = current ? computeCurrentRisk(current, daily, baselineMax) : null;
    const dailyRisks = computeDailyRisks(daily, baselineMax);
    let forecastPeak = null;
    dailyRisks.forEach((r, d) => {
      if (r && (!forecastPeak || r.score > forecastPeak.score)) forecastPeak = { score: r.score, riskLevel: r.riskLevel, date: daily.dates[d] };
    });
    return {
      id: loc.id,
      name: loc.name,
      stateId: loc.state.id,
      stateCode: loc.state.code,
      stateName: loc.state.name,
      isRepresentative: loc.isRepresentative,
      latitude: loc.latitude,
      longitude: loc.longitude,
      current,
      daily,
      dailyRisks: dailyRisks.map((r) => (r ? { score: r.score, riskLevel: r.riskLevel } : null)),
      baselineMax: baselineMax == null ? null : Math.round(baselineMax * 10) / 10,
      risk,
      forecastPeak,
    };
  });

  const snapshot = { fetchedAt, source: 'open-meteo', points, ...summariseStates(points) };
  snapshot.persisted = await persistSnapshot(snapshot).then(() => true, (err) => {
    console.error('[riskService] could not persist snapshot:', err.message);
    return false;
  });
  return snapshot;
}

// Store every refresh in PostgreSQL: weather_records + heat_risk (per point) and
// forecasts (per state, from its representative point). Old rows are pruned.
async function persistSnapshot(snapshot) {
  const at = new Date(snapshot.fetchedAt);
  const withCurrent = snapshot.points.filter((p) => p.current && p.risk);
  const reps = snapshot.points.filter((p) => p.isRepresentative && p.daily);

  const forecastRows = reps.flatMap((p) => p.daily.dates.map((date, d) => ({
    stateId: p.stateId,
    date: new Date(`${date}T00:00:00Z`),
    minTemperature: p.daily.minTemperature[d],
    maxTemperature: p.daily.maxTemperature[d],
    apparentTemperature: p.daily.apparentMax[d],
    weatherCode: p.daily.weatherCode[d],
    weatherCondition: p.daily.weatherCondition[d],
    precipitation: p.daily.precipitation[d] ?? 0,
    windSpeed: p.daily.windSpeedMax[d] ?? 0,
    riskScore: p.dailyRisks[d]?.score ?? null,
    riskLevel: p.dailyRisks[d]?.riskLevel ?? null,
  }))).filter((r) => [r.minTemperature, r.maxTemperature, r.apparentTemperature].every((v) => typeof v === 'number'));

  const dates = [...new Set(forecastRows.map((r) => r.date.getTime()))].map((t) => new Date(t));
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);

  await prisma.$transaction([
    prisma.weatherRecord.createMany({
      data: withCurrent.map((p) => ({
        stateId: p.stateId, locationId: p.id, latitude: p.latitude, longitude: p.longitude,
        temperature: p.current.temperature, apparentTemperature: p.current.apparentTemperature,
        humidity: Math.round(p.current.humidity), weatherCode: p.current.weatherCode,
        weatherCondition: p.current.weatherCondition, windSpeed: p.current.windSpeed,
        observedAt: new Date(p.current.observedAt), recordedAt: at,
      })),
    }),
    prisma.heatRisk.createMany({
      data: withCurrent.map((p) => ({
        stateId: p.stateId, locationId: p.id, latitude: p.latitude, longitude: p.longitude,
        temperature: p.current.temperature, apparentTemperature: p.current.apparentTemperature,
        humidity: Math.round(p.current.humidity), score: p.risk.score, riskLevel: p.risk.riskLevel,
        factors: { factors: p.risk.factors, explanation: p.risk.explanation, missingFactors: p.risk.missingFactors },
        calculatedAt: at,
      })),
    }),
    // Replace forecast rows for the refreshed dates (unique on stateId + date).
    prisma.forecast.deleteMany({ where: { stateId: { in: reps.map((p) => p.stateId) }, date: { in: dates } } }),
    prisma.forecast.createMany({ data: forecastRows }),
    prisma.weatherRecord.deleteMany({ where: { recordedAt: { lt: cutoff } } }),
    prisma.heatRisk.deleteMany({ where: { calculatedAt: { lt: cutoff } } }),
  ]);
}

// Rebuild the latest snapshot from PostgreSQL when Open-Meteo is unreachable.
async function loadStoredSnapshot() {
  const latest = await prisma.heatRisk.findFirst({ orderBy: { calculatedAt: 'desc' }, select: { calculatedAt: true } });
  if (!latest) return null;
  const at = latest.calculatedAt;
  const [locations, risks, records, forecasts] = await Promise.all([
    getMonitoringPoints(),
    prisma.heatRisk.findMany({ where: { calculatedAt: at } }),
    prisma.weatherRecord.findMany({ where: { recordedAt: at } }),
    prisma.forecast.findMany({ where: { date: { gte: new Date(`${istDate()}T00:00:00Z`) } }, orderBy: { date: 'asc' } }),
  ]);
  const riskBy = new Map(risks.map((r) => [r.locationId, r]));
  const recBy = new Map(records.map((r) => [r.locationId, r]));
  const fcByState = new Map();
  for (const f of forecasts) {
    if (!fcByState.has(f.stateId)) fcByState.set(f.stateId, []);
    fcByState.get(f.stateId).push(f);
  }
  const points = locations.map((loc) => {
    const r = riskBy.get(loc.id);
    const w = recBy.get(loc.id);
    const fc = loc.isRepresentative ? fcByState.get(loc.state.id) : null;
    return {
      id: loc.id, name: loc.name, stateId: loc.state.id, stateCode: loc.state.code, stateName: loc.state.name,
      isRepresentative: loc.isRepresentative, latitude: loc.latitude, longitude: loc.longitude,
      current: w ? {
        temperature: w.temperature, apparentTemperature: w.apparentTemperature, humidity: w.humidity,
        windSpeed: w.windSpeed, weatherCode: w.weatherCode, weatherCondition: w.weatherCondition || describeWeatherCode(w.weatherCode).condition,
        observedAt: w.observedAt.toISOString(),
      } : null,
      daily: fc?.length ? {
        dates: fc.map((f) => f.date.toISOString().slice(0, 10)),
        weatherCode: fc.map((f) => f.weatherCode), weatherCondition: fc.map((f) => f.weatherCondition),
        maxTemperature: fc.map((f) => f.maxTemperature), minTemperature: fc.map((f) => f.minTemperature),
        apparentMax: fc.map((f) => f.apparentTemperature), precipitation: fc.map((f) => f.precipitation),
        windSpeedMax: fc.map((f) => f.windSpeed), humidityMean: fc.map(() => null),
      } : null,
      dailyRisks: fc?.length ? fc.map((f) => (f.riskScore != null ? { score: f.riskScore, riskLevel: f.riskLevel } : null)) : [],
      baselineMax: null,
      risk: r ? { score: r.score, riskLevel: r.riskLevel, ...(r.factors || {}) } : null,
      forecastPeak: null,
    };
  });
  return { fetchedAt: at.toISOString(), source: 'database', points, persisted: true, ...summariseStates(points) };
}

/**
 * Returns { snapshot, meta } where meta = { fetchedAt, fromCache, stale, source }.
 * Throws WeatherUnavailableError-like errors only when neither live nor stored data exists.
 */
export async function getRiskSnapshot({ refresh = false } = {}) {
  const existing = peek(SNAPSHOT_KEY);
  const force = refresh && (!existing || Date.now() - existing.storedAt > MIN_MANUAL_REFRESH_MS);
  try {
    const { value, fromCache } = await cached(SNAPSHOT_KEY, SNAPSHOT_TTL_MS, buildLiveSnapshot, { force });
    return { snapshot: value, meta: { fetchedAt: value.fetchedAt, fromCache, stale: false, source: value.source } };
  } catch (err) {
    console.error('[riskService] live refresh failed:', err.message);
    if (existing) {
      return { snapshot: existing.value, meta: { fetchedAt: existing.value.fetchedAt, fromCache: true, stale: true, source: existing.value.source, error: 'Live weather temporarily unavailable — showing cached data.' } };
    }
    const stored = await loadStoredSnapshot().catch(() => null);
    if (stored) {
      return { snapshot: stored, meta: { fetchedAt: stored.fetchedAt, fromCache: true, stale: true, source: 'database', error: 'Live weather temporarily unavailable — showing the last data stored in the database.' } };
    }
    throw err;
  }
}

/** All monitoring points for one state, representative first. */
export function pointsForState(snapshot, stateCode) {
  return snapshot.points.filter((p) => p.stateCode === stateCode);
}

/** Resolves a state from a numeric id or a state code (e.g. "12" or "MH"). */
export async function resolveState(param) {
  const states = await getStates();
  const p = String(param || '').trim();
  return /^\d+$/.test(p) ? states.find((s) => s.id === Number(p)) || null : states.find((s) => s.code === p.toUpperCase()) || null;
}
