import prisma from '@/lib/prisma';
import { resolveState } from '@/lib/riskService';
import { json, error, readJson, requireUser } from '@/lib/http';

const include = { state: { select: { id: true, name: true, code: true } } };

export async function GET(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const limit = Math.min(Number.parseInt(new URL(request.url).searchParams.get('limit') || '20', 10) || 20, 100);
  const history = await prisma.userSearchHistory.findMany({ where: { userId: user.id }, include, orderBy: { searchedAt: 'desc' }, take: limit });
  return json({ history });
}

// CREATE — records a state selection. Repeating the same state within 2 minutes is skipped.
export async function POST(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const body = await readJson(request);
  const state = await resolveState(body.stateCode ?? body.stateId);
  if (!state) return error('Select a valid state.', 422);
  const last = await prisma.userSearchHistory.findFirst({ where: { userId: user.id }, orderBy: { searchedAt: 'desc' } });
  if (last && last.stateId === state.id && Date.now() - last.searchedAt.getTime() < 120000) {
    return json({ entry: last, skipped: true });
  }
  const entry = await prisma.userSearchHistory.create({ data: { userId: user.id, stateId: state.id }, include });
  return json({ entry }, { status: 201 });
}

// DELETE — clears the user's entire search history.
export async function DELETE() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const { count } = await prisma.userSearchHistory.deleteMany({ where: { userId: user.id } });
  return json({ deleted: count });
}
