import prisma from '@/lib/prisma';
import { RISK_LEVELS } from '@/lib/riskLevels';
import { json } from '@/lib/http';

// GET /api/safety?level=HIGH → general tips plus the tips for that risk level.
export async function GET(request) {
  const level = new URL(request.url).searchParams.get('level');
  const valid = RISK_LEVELS.some((l) => l.key === level);
  const tips = await prisma.safetyTip.findMany({
    where: valid ? { OR: [{ riskLevel: null }, { riskLevel: level }] } : {},
    orderBy: { sortOrder: 'asc' },
  });
  return json({ tips });
}
