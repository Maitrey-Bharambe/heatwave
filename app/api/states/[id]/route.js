import prisma from '@/lib/prisma';
import { resolveState } from '@/lib/riskService';
import { json, error } from '@/lib/http';

export async function GET(_request, { params }) {
  const { id } = await params;
  const s = await resolveState(id);
  if (!s) return error('State not found.', 404);
  const state = await prisma.state.findUnique({
    where: { id: s.id },
    include: { monitoringLocations: { orderBy: [{ isRepresentative: 'desc' }, { name: 'asc' }] } },
  });
  return json({ state });
}
