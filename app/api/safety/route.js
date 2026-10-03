import { db, run } from '@/lib/db';
import { RISK_LEVELS } from '@/lib/riskLevels';
import { json } from '@/lib/http';

// GET /api/safety?level=HIGH → general tips plus the tips for that risk level.
export async function GET(request) {
  const level = new URL(request.url).searchParams.get('level');
  let q = db().from('safety_tips').select('*').order('sortOrder');
  if (RISK_LEVELS.some((l) => l.key === level)) q = q.or(`riskLevel.is.null,riskLevel.eq.${level}`);
  return json({ tips: await run(q) });
}
