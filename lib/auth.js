// Session authentication with HTTP-only cookies.
// The cookie holds a random 256-bit token; the sessions table stores only HMAC-SHA256(token),
// so a leaked database cannot be used to hijack sessions. Logout deletes the row.
import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db, run, utc, withIso } from './db.js';

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

// Columns returned to the browser (never passwordHash), with the home state joined in.
export const PUBLIC_USER_COLUMNS = 'id, fullName, email, phoneNumber, city, createdAt, updatedAt, state:states(id, name, code)';
export const toPublicUser = (row) => withIso(row, ['createdAt', 'updatedAt']);

export async function getPublicUser(id) {
  const rows = await run(db().from('users').select(PUBLIC_USER_COLUMNS).eq('id', id).limit(1));
  return rows.length ? toPublicUser(rows[0]) : null;
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await run(db().from('sessions').insert({ tokenHash: hashToken(token), userId, expiresAt: expiresAt.toISOString() }));
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
  if (token) await run(db().from('sessions').delete().eq('tokenHash', hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

/** Returns the logged-in user (public fields only) or null. */
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await run(db().from('sessions').select(`id, expiresAt, user:users(${PUBLIC_USER_COLUMNS})`).eq('tokenHash', hashToken(token)).limit(1));
  const session = rows[0];
  if (!session?.user) return null;
  if (utc(session.expiresAt) < new Date()) {
    await run(db().from('sessions').delete().eq('id', session.id)).catch(() => {});
    return null;
  }
  return toPublicUser(session.user);
}
