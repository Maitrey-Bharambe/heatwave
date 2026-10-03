import { db, run } from '@/lib/db';
import { json, error, requireUser, parseId } from '@/lib/http';

export async function DELETE(_request, { params }) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const id = parseId((await params).id);
  if (!id) return error('Invalid entry id.', 422);
  const deleted = await run(db().from('user_search_history').delete().eq('id', id).eq('userId', user.id).select('id'));
  if (!deleted.length) return error('Entry not found.', 404);
  return json({ ok: true });
}
