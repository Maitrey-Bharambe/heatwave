import prisma from '@/lib/prisma';
import { json } from '@/lib/http';

export async function GET() {
  const contacts = await prisma.emergencyContact.findMany({ orderBy: { sortOrder: 'asc' } });
  return json({ contacts });
}
