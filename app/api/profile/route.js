import prisma from '@/lib/prisma';
import { destroySession, publicUserSelect } from '@/lib/auth';
import { validateProfile } from '@/lib/validation';
import { getStateByCode } from '@/lib/riskService';
import { json, error, readJson, requireUser } from '@/lib/http';

// READ — profile with record counts.
export async function GET() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const counts = await prisma.user.findUnique({ where: { id: user.id }, select: { _count: { select: { favorites: true, searchHistory: true, sessions: true } } } });
  return json({ user, counts: counts._count });
}

// UPDATE — UPDATE users SET ... WHERE id = :id
export async function PATCH(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const { data, errors } = validateProfile(await readJson(request));
  const state = data.stateCode ? await getStateByCode(data.stateCode) : null;
  if (data.stateCode && !state) errors.stateCode = 'Select a valid state.';
  if (Object.keys(errors).length) return error('Please fix the highlighted fields.', 422, { fields: errors });
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { fullName: data.fullName, phoneNumber: data.phoneNumber, city: data.city, stateId: state.id },
    select: publicUserSelect,
  });
  return json({ user: updated });
}

// DELETE — removes the account; favorites, search history and sessions cascade (ON DELETE CASCADE).
export async function DELETE() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  await destroySession();
  await prisma.user.delete({ where: { id: user.id } });
  return json({ ok: true });
}
