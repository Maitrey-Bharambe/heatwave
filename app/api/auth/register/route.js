import { db, run, isUniqueViolation } from '@/lib/db';
import { createSession, hashPassword, getPublicUser } from '@/lib/auth';
import { validateRegistration } from '@/lib/validation';
import { getStateByCode } from '@/lib/riskService';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { json, error, readJson } from '@/lib/http';

const DUPLICATE = () => error('An account with this email already exists.', 409, { fields: { email: 'This email is already registered.' } });

// CREATE — registers a user (INSERT INTO users) and starts a session.
export async function POST(request) {
  const rl = rateLimit(`register:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return error('Too many attempts. Please try again later.', 429);

  const { data, password, errors } = validateRegistration(await readJson(request));
  const state = data.stateCode ? await getStateByCode(data.stateCode) : null;
  if (data.stateCode && !state) errors.stateCode = 'Select a valid state.';
  if (Object.keys(errors).length) return error('Please fix the highlighted fields.', 422, { fields: errors });

  const existing = await run(db().from('users').select('id').eq('email', data.email).limit(1));
  if (existing.length) return DUPLICATE();

  try {
    const [row] = await run(db().from('users').insert({
      fullName: data.fullName, email: data.email, phoneNumber: data.phoneNumber, city: data.city,
      stateId: state.id, passwordHash: await hashPassword(password), updatedAt: new Date().toISOString(),
    }).select('id'));
    await createSession(row.id);
    return json({ user: await getPublicUser(row.id) }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return DUPLICATE(); // users_email_key
    throw e;
  }
}
