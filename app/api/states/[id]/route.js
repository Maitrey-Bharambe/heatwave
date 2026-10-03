import { db, run } from '@/lib/db';
import { resolveState } from '@/lib/riskService';
import { json, error } from '@/lib/http';

export async function GET(_request, { params }) {
  const { id } = await params;
  const s = await resolveState(id);
  if (!s) return error('State not found.', 404);
  const monitoringLocations = await run(
    db().from('monitoring_locations').select('*').eq('stateId', s.id).order('isRepresentative', { ascending: false }).order('name'),
  );
  return json({ state: { ...s, monitoringLocations } });
}
