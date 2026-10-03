import { db, run, withIso, isUniqueViolation } from '@/lib/db';
import { resolveState } from '@/lib/riskService';
import { json, error, readJson, requireUser } from '@/lib/http';

const COLUMNS = 'id, userId, stateId, createdAt, state:states(id, name, code, type)';

// READ — favorites joined with states for the logged-in user.
export async function GET() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const rows = await run(db().from('user_favorites').select(COLUMNS).eq('userId', user.id).order('createdAt', { ascending: false }));
  return json({ favorites: withIso(rows, ['createdAt']) });
}

// CREATE — the unique (userId, stateId) constraint prevents duplicates.
export async function POST(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const body = await readJson(request);
  const state = await resolveState(body.stateCode ?? body.stateId);
  if (!state) return error('Select a valid state.', 422);
  try {
    const [favorite] = await run(db().from('user_favorites').insert({ userId: user.id, stateId: state.id }).select(COLUMNS));
    return json({ favorite: withIso(favorite, ['createdAt']) }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return error(`${state.name} is already in your favorites.`, 409);
    throw e;
  }
}
