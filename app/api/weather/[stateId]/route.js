import { getRiskSnapshot, resolveState, pointsForState } from '@/lib/riskService';
import { json, error } from '@/lib/http';

// Current weather for a state's representative location (+ its other monitoring points).
export async function GET(request, { params }) {
  const { stateId } = await params;
  const state = await resolveState(stateId);
  if (!state) return error('State not found.', 404);
  try {
    const { snapshot, meta } = await getRiskSnapshot({ refresh: new URL(request.url).searchParams.has('refresh') });
    const points = pointsForState(snapshot, state.code).map(({ daily, dailyRisks, ...p }) => ({
      ...p,
      today: daily ? { maxTemperature: daily.maxTemperature[0], minTemperature: daily.minTemperature[0] } : null,
    }));
    const representative = points.find((p) => p.isRepresentative) || points[0] || null;
    if (!representative?.current) return error('Weather data temporarily unavailable for this state.', 503, { meta });
    return json({ state, representative, points, meta });
  } catch {
    return error('Weather data temporarily unavailable.', 503);
  }
}
