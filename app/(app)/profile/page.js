import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getUserCounts } from '@/lib/userCounts';
import ProfileView from './ProfileView';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/profile');
  return <ProfileView user={user} counts={await getUserCounts(user.id)} />;
}
