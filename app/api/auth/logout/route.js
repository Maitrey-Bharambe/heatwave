import { destroySession } from '@/lib/auth';
import { json } from '@/lib/http';

// Deletes the session row and clears the HTTP-only cookie.
export async function POST() {
  await destroySession();
  return json({ ok: true });
}
