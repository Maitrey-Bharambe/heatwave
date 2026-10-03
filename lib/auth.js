// Session authentication with HTTP-only cookies.
// The cookie holds a random 256-bit token; PostgreSQL stores only HMAC-SHA256(token),
// so a leaked database cannot be used to hijack sessions. Logout deletes the row.
import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma.js';

export const SESSION_COOKIE = 'ciq_session';
const SESSION_DAYS = 7;
const BCRYPT_ROUNDS = 12;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters');
  return s;
}

const hashToken = (token) => crypto.createHmac('sha256', secret()).update(token).digest('hex');

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export const publicUserSelect = {
  id: true, fullName: true, email: true, phoneNumber: true, city: true, createdAt: true, updatedAt: true,
  state: { select: { id: true, name: true, code: true } },
};

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Returns the logged-in user (public fields only) or null. */
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, expiresAt: true, user: { select: publicUserSelect } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
}
