import prisma from '@/lib/prisma';
import { json, error, requireUser, parseId } from '@/lib/http';

export async function DELETE(_request, { params }) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const id = parseId((await params).id);
  if (!id) return error('Invalid entry id.', 422);
  const { count } = await prisma.userSearchHistory.deleteMany({ where: { id, userId: user.id } });
  if (!count) return error('Entry not found.', 404);
  return json({ ok: true });
}
