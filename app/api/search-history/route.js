import { db, run, utc, withIso } from '@/lib/db';
import { resolveState } from '@/lib/riskService';
import { json, error, readJson, requireUser } from '@/lib/http';

const COLUMNS = 'id, userId, stateId, searchedAt, state:states(id, name, code)';

export async function GET(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const limit = Math.min(Number.parseInt(new URL(request.url).searchParams.get('limit') || '20', 10) || 20, 100);
  const rows = await run(db().from('user_search_history').select(COLUMNS).eq('userId', user.id).order('searchedAt', { ascending: false }).limit(limit));
  return json({ history: withIso(rows, ['searchedAt']) });
}

// CREATE — records a state selection. Repeating the same state within 2 minutes is skipped.
export async function POST(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const body = await readJson(request);
  const state = await resolveState(body.stateCode ?? body.stateId);
  if (!state) return error('Select a valid state.', 422);
  const [last] = await run(db().from('user_search_history').select(COLUMNS).eq('userId', user.id).order('searchedAt', { ascending: false }).limit(1));
  if (last && last.stateId === state.id && Date.now() - utc(last.searchedAt).getTime() < 120000) {
    return json({ entry: withIso(last, ['searchedAt']), skipped: true });
  }
  const [entry] = await run(db().from('user_search_history').insert({ userId: user.id, stateId: state.id }).select(COLUMNS));
  return json({ entry: withIso(entry, ['searchedAt']) }, { status: 201 });
}

// DELETE — clears the user's entire search history.
export async function DELETE() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const deleted = await run(db().from('user_search_history').delete().eq('userId', user.id).select('id'));
  return json({ deleted: deleted.length });
}
