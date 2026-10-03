import { getStates } from '@/lib/riskService';
import { json } from '@/lib/http';

export async function GET() {
  return json({ states: await getStates() });
}
