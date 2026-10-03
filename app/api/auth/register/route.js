import prisma from '@/lib/prisma';
import { createSession, hashPassword, publicUserSelect } from '@/lib/auth';
import { validateRegistration } from '@/lib/validation';
import { getStateByCode } from '@/lib/riskService';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { json, error, readJson } from '@/lib/http';

// CREATE — registers a user (INSERT INTO users) and starts a session.
export async function POST(request) {
  const rl = rateLimit(`register:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!rl.ok) return error('Too many attempts. Please try again later.', 429);

  const { data, password, errors } = validateRegistration(await readJson(request));
  const state = data.stateCode ? await getStateByCode(data.stateCode) : null;
  if (data.stateCode && !state) errors.stateCode = 'Select a valid state.';
  if (Object.keys(errors).length) return error('Please fix the highlighted fields.', 422, { fields: errors });

  const exists = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
  if (exists) return error('An account with this email already exists.', 409, { fields: { email: 'This email is already registered.' } });

  try {
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName, email: data.email, phoneNumber: data.phoneNumber, city: data.city,
        stateId: state.id, passwordHash: await hashPassword(password),
      },
      select: publicUserSelect,
    });
    await createSession(user.id);
    return json({ user }, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return error('An account with this email already exists.', 409, { fields: { email: 'This email is already registered.' } });
    throw e;
  }
}
