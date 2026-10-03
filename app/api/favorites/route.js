import prisma from '@/lib/prisma';
import { resolveState } from '@/lib/riskService';
import { json, error, readJson, requireUser } from '@/lib/http';

const include = { state: { select: { id: true, name: true, code: true, type: true } } };

// READ — favorites joined with states for the logged-in user.
export async function GET() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const favorites = await prisma.userFavorite.findMany({ where: { userId: user.id }, include, orderBy: { createdAt: 'desc' } });
  return json({ favorites });
}

// CREATE — the unique (userId, stateId) constraint prevents duplicates.
export async function POST(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const body = await readJson(request);
  const state = await resolveState(body.stateCode ?? body.stateId);
  if (!state) return error('Select a valid state.', 422);
  try {
    const favorite = await prisma.userFavorite.create({ data: { userId: user.id, stateId: state.id }, include });
    return json({ favorite }, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return error(`${state.name} is already in your favorites.`, 409);
    throw e;
  }
}
