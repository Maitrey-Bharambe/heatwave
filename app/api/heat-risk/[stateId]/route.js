import prisma from '@/lib/prisma';
import { getRiskSnapshot, resolveState, pointsForState } from '@/lib/riskService';
import { FACTOR_DEFINITIONS, HOT_DAY_THRESHOLD_C } from '@/lib/heatRisk';
import { RISK_LEVELS, RISK_DISCLAIMER } from '@/lib/riskLevels';
import { json, error } from '@/lib/http';

export async function GET(_request, { params }) {
  const { stateId } = await params;
  const state = await resolveState(stateId);
  if (!state) return error('State not found.', 404);
  try {
    const { snapshot, meta } = await getRiskSnapshot();
    const points = pointsForState(snapshot, state.code);
    const rep = points.find((p) => p.isRepresentative);
    if (!rep?.risk) return error('Heat-risk estimate unavailable — weather data could not be retrieved.', 503, { meta });

    const [tips, trend] = await Promise.all([
      prisma.safetyTip.findMany({ where: { riskLevel: rep.risk.riskLevel }, orderBy: { sortOrder: 'asc' } }),
      // READ from persisted heat_risk rows: how this location's score evolved (last 48 h).
      prisma.heatRisk.findMany({
        where: { locationId: rep.id, calculatedAt: { gte: new Date(Date.now() - 48 * 3600000) } },
        orderBy: { calculatedAt: 'asc' },
        select: { score: true, calculatedAt: true },
      }),
    ]);

    return json({
      state,
      representative: { id: rep.id, name: rep.name, latitude: rep.latitude, longitude: rep.longitude, current: rep.current, baselineMax: rep.baselineMax },
      risk: rep.risk,
      forecastPeak: rep.forecastPeak,
      otherPoints: points.filter((p) => p !== rep).map((p) => ({ id: p.id, name: p.name, score: p.risk?.score ?? null, riskLevel: p.risk?.riskLevel ?? null, temperature: p.current?.temperature ?? null })),
      tips,
      trend,
      model: { factors: FACTOR_DEFINITIONS.map(({ key, label, weight, describe }) => ({ key, label, weight, describe })), levels: RISK_LEVELS, hotDayThreshold: HOT_DAY_THRESHOLD_C, disclaimer: RISK_DISCLAIMER },
      meta,
    });
  } catch {
    return error('Heat-risk estimate unavailable.', 503);
  }
}
