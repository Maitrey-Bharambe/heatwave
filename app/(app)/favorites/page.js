import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { FavoriteButton, FavoritesList, RecentSearches } from '@/components/UserData';

export const metadata = { title: 'Favorites' };

export default async function FavoritesPage() {
  if (!(await getCurrentUser())) redirect('/login?next=/favorites');
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Your data</div>
          <h1>Favorites &amp; search history</h1>
          <p className="lead">Stored in PostgreSQL (user_favorites, user_search_history). Click a state to select it everywhere.</p>
        </div>
        <FavoriteButton />
      </div>
      <div className="grid grid-2">
        <FavoritesList title="Favorite states" />
        <RecentSearches />
      </div>
    </>
  );
}
