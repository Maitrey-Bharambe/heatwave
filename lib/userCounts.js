import 'server-only';
import { count } from './db.js';

/** Number of favorites, searches and active sessions owned by a user. */
export async function getUserCounts(userId) {
  const [favorites, searchHistory, sessions] = await Promise.all([
    count('user_favorites', (q) => q.eq('userId', userId)),
    count('user_search_history', (q) => q.eq('userId', userId)),
    count('sessions', (q) => q.eq('userId', userId)),
  ]);
  return { favorites, searchHistory, sessions };
}
