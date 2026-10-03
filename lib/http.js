import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth.js';

export const json = (data, init) => NextResponse.json(data, init);
export const error = (message, status = 400, extra = {}) => NextResponse.json({ error: message, ...extra }, { status });

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/** Returns [user, null] or [null, 401 response]. */
export async function requireUser() {
  const user = await getCurrentUser();
  return user ? [user, null] : [null, error('Please log in to continue.', 401)];
}

export const parseId = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};
