import { db, run } from '@/lib/db';
import { json } from '@/lib/http';

export async function GET() {
  return json({ contacts: await run(db().from('emergency_contacts').select('*').order('sortOrder')) });
}
