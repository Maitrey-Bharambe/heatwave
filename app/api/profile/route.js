import { db, run } from '@/lib/db';
import { getUserCounts } from '@/lib/userCounts';
import { destroySession, getPublicUser } from '@/lib/auth';
import { validateProfile } from '@/lib/validation';
import { getStateByCode } from '@/lib/riskService';
import { json, error, readJson, requireUser } from '@/lib/http';

// READ — profile with record counts.
export async function GET() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  return json({ user, counts: await getUserCounts(user.id) });
}

// UPDATE — UPDATE users SET ... WHERE id = :id
export async function PATCH(request) {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  const { data, errors } = validateProfile(await readJson(request));
  const state = data.stateCode ? await getStateByCode(data.stateCode) : null;
  if (data.stateCode && !state) errors.stateCode = 'Select a valid state.';
  if (Object.keys(errors).length) return error('Please fix the highlighted fields.', 422, { fields: errors });
  await run(db().from('users').update({
    fullName: data.fullName, phoneNumber: data.phoneNumber, city: data.city, stateId: state.id,
    updatedAt: new Date().toISOString(),
  }).eq('id', user.id));
  return json({ user: await getPublicUser(user.id) });
}

// DELETE — removes the account; favorites, search history and sessions cascade (ON DELETE CASCADE).
export async function DELETE() {
  const [user, deny] = await requireUser();
  if (deny) return deny;
  await destroySession();
  await run(db().from('users').delete().eq('id', user.id));
  return json({ ok: true });
}
