import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ProfileView from './ProfileView';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile');
  const counts = await prisma.user.findUnique({ where: { id: user.id }, select: { _count: { select: { favorites: true, searchHistory: true, sessions: true } } } });
  return <ProfileView user={JSON.parse(JSON.stringify(user))} counts={counts._count} />;
}
