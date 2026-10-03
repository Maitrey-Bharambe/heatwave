import prisma from '@/lib/prisma';
import { cached } from '@/lib/cache';
import { fetchHistorical, istDate, addDays } from '@/lib/openMeteo';
import { resolveState } from '@/lib/riskService';
import { json, error } from '@/lib/http';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

// Observed historical daily weather for the state's representative location.
// GET /api/history/MH?days=30   or   ?start=2026-04-01&end=2026-05-31
export async function GET(request, { params }) {
  const { stateId } = await params;
  const state = await resolveState(stateId);
  if (!state) return error('State not found.', 404);

  const sp = new URL(request.url).searchParams;
  const yesterday = istDate(-1);
  let start;
  let end;
  if (sp.get('start') || sp.get('end')) {
    start = sp.get('start');
    end = sp.get('end');
    if (!DATE_RE.test(start || '') || !DATE_RE.test(end || '')) return error('Use dates in YYYY-MM-DD format.', 422);
    if (start > end) return error('Start date must be before end date.', 422);
    if (start < '1940-01-01') return error('Historical data is available from 1940 onwards.', 422);
    if (end > yesterday) return error('Historical weather ends yesterday. Use the Forecast page for upcoming days.', 422);
    const span = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
    if (span > MAX_RANGE_DAYS) return error(`Choose a range of at most ${MAX_RANGE_DAYS} days.`, 422);
  } else {
    const days = Math.min(Math.max(Number.parseInt(sp.get('days') || '30', 10) || 30, 1), 92);
    end = yesterday;
    start = addDays(yesterday, -(days - 1));
  }

  const rep = await prisma.monitoringLocation.findFirst({ where: { stateId: state.id, isRepresentative: true }, select: { name: true } });
  const location = rep?.name || state.capital;

  try {
    const { value: rows, storedAt, fromCache } = await cached(`history:${state.code}:${start}:${end}`, 6 * 3600 * 1000, async () => {
      const data = await fetchHistorical(state.latitude, state.longitude, start, end);
      // Persist into historical_weather (unique stateId + date, so replace those dates).
      if (data.length) {
        const dates = data.map((r) => new Date(`${r.date}T00:00:00Z`));
        await prisma.$transaction([
          prisma.historicalWeather.deleteMany({ where: { stateId: state.id, date: { in: dates } } }),
          prisma.historicalWeather.createMany({
            data: data.map((r) => ({
              stateId: state.id, date: new Date(`${r.date}T00:00:00Z`), minTemperature: r.minTemperature,
              maxTemperature: r.maxTemperature, averageTemperature: r.averageTemperature,
              apparentTemperature: r.apparentTemperature, source: r.source,
            })),
          }),
        ]).catch((e) => console.error('[history] persist failed:', e.message));
      }
      return data;
    });
    return json({
      state, location, start, end, days: rows,
      meta: { fetchedAt: new Date(storedAt).toISOString(), fromCache, stale: false, source: 'open-meteo' },
    });
  } catch {
    // Fall back to rows previously stored in PostgreSQL for this range.
    const stored = await prisma.historicalWeather.findMany({
      where: { stateId: state.id, date: { gte: new Date(`${start}T00:00:00Z`), lte: new Date(`${end}T00:00:00Z`) } },
      orderBy: { date: 'asc' },
    }).catch(() => []);
    if (!stored.length) return error('Historical weather unavailable.', 503);
    return json({
      state, location, start, end,
      days: stored.map((r) => ({ date: r.date.toISOString().slice(0, 10), maxTemperature: r.maxTemperature, minTemperature: r.minTemperature, averageTemperature: r.averageTemperature, apparentTemperature: r.apparentTemperature, source: r.source })),
      meta: { fetchedAt: stored.at(-1).createdAt.toISOString(), fromCache: true, stale: true, source: 'database', error: 'Live historical data unavailable. Showing data stored in the database.' },
    });
  }
}
