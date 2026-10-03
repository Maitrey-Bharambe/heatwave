import { getRiskSnapshot, resolveState, pointsForState } from '@/lib/riskService';
import { json, error } from '@/lib/http';

// 7-day forecast (representative location) with a per-day heat-risk estimate.
export async function GET(_request, { params }) {
  const { stateId } = await params;
  const state = await resolveState(stateId);
  if (!state) return error('State not found.', 404);
  try {
    const { snapshot, meta } = await getRiskSnapshot();
    const rep = pointsForState(snapshot, state.code).find((p) => p.isRepresentative);
    if (!rep?.daily) return error('Forecast temporarily unavailable for this state.', 503, { meta });
    const d = rep.daily;
    const days = d.dates.map((date, i) => ({
      date,
      weatherCode: d.weatherCode[i],
      weatherCondition: d.weatherCondition[i],
      maxTemperature: d.maxTemperature[i],
      minTemperature: d.minTemperature[i],
      apparentMax: d.apparentMax[i],
      precipitation: d.precipitation[i],
      windSpeedMax: d.windSpeedMax[i],
      humidityMean: d.humidityMean?.[i] ?? null,
      risk: rep.dailyRisks[i] || null,
    }));
    return json({ state, location: { name: rep.name, latitude: rep.latitude, longitude: rep.longitude }, days, meta });
  } catch {
    return error('Forecast temporarily unavailable.', 503);
  }
}
