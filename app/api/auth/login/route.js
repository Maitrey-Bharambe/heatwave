import { db, run } from '@/lib/db';
import { createSession, verifyPassword, hashPassword, getPublicUser } from '@/lib/auth';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { json, error, readJson } from '@/lib/http';

// Unknown emails are checked against a dummy hash so they take as long as wrong passwords.
let dummyHash;
const getDummyHash = async () => (dummyHash ||= await hashPassword('climateiq-timing-equaliser'));

export async function POST(request) {
  const body = await readJson(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!email || !password) return error('Email and password are required.', 422);

  const rl = rateLimit(`login:${clientIp(request)}:${email}`, 8, 15 * 60 * 1000);
  if (!rl.ok) return error(`Too many login attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.`, 429);

  const [found] = await run(db().from('users').select('id, passwordHash').eq('email', email).limit(1));
  const ok = await verifyPassword(password, found?.passwordHash || (await getDummyHash()));
  if (!found || !ok) return error('Invalid email or password.', 401);

  await createSession(found.id);
  return json({ user: await getPublicUser(found.id) });
}
