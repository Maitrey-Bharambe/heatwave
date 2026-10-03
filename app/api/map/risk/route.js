import { getRiskSnapshot } from '@/lib/riskService';
import { json, error } from '@/lib/http';

// Live monitoring points for the India heat-risk map. Values come from Open-Meteo +
// the server-side heat-risk engine. ?refresh=1 forces a refresh (at most once a minute).
export async function GET(request) {
  try {
    const { snapshot, meta } = await getRiskSnapshot({ refresh: new URL(request.url).searchParams.has('refresh') });
    const points = snapshot.points.map((p) => ({
      id: p.id,
      name: p.name,
      state: p.stateName,
      stateCode: p.stateCode,
      isRepresentative: p.isRepresentative,
      latitude: p.latitude,
      longitude: p.longitude,
      temperature: p.current?.temperature ?? null,
      apparentTemperature: p.current?.apparentTemperature ?? null,
      humidity: p.current?.humidity ?? null,
      windSpeed: p.current?.windSpeed ?? null,
      weatherCondition: p.current?.weatherCondition ?? null,
      observedAt: p.current?.observedAt ?? null,
      riskScore: p.risk?.score ?? null,
      riskLevel: p.risk?.riskLevel ?? null,
      forecastPeak: p.forecastPeak,
    }));
    return json({ points, states: snapshot.states, meta });
  } catch {
    return error('Map data unavailable — live weather could not be retrieved.', 503);
  }
}
