import prisma from '@/lib/prisma';
import { json, error, requireUser, parseId } from '@/lib/http';

// DELETE — scoped to the owner: WHERE id = :id AND user_id = :userId
export async function DELETE(_request, { params }) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const id = parseId((await params).id);
  if (!id) return error('Invalid favorite id.', 422);
  const { count } = await prisma.userFavorite.deleteMany({ where: { id, userId: user.id } });
  if (!count) return error('Favorite not found.', 404);
  return json({ ok: true });
}
