'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Clock, Star, Trash2 } from 'lucide-react';
import { fetchJson, invalidate, useApi } from '@/lib/client/useApi';
import { fmtRelative } from '@/lib/format';
import { useSelectedState } from './SelectedStateProvider';
import { CardSkeleton, EmptyState, ErrorState } from './ui';

/** Add / remove the selected state from favorites (CREATE / DELETE on user_favorites). */
export function FavoriteButton() {
  const { selected, user } = useSelectedState();
  const { data } = useApi(user ? '/api/favorites' : null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (!user) return null;
  const fav = data?.favorites.find((f) => f.state.code === selected.code);

  const toggle = async () => {
    setBusy(true);
    setMsg('');
    try {
      if (fav) await fetchJson(`/api/favorites/${fav.id}`, { method: 'DELETE' });
      else await fetchJson('/api/favorites', { method: 'POST', body: JSON.stringify({ stateCode: selected.code }) });
      invalidate('/api/favorites');
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className="btn btn-sm" onClick={toggle} disabled={busy || !data} title={msg || undefined} aria-pressed={!!fav}>
      <Star size={14} fill={fav ? 'var(--warning)' : 'none'} color={fav ? 'var(--warning)' : 'currentColor'} />
      {fav ? 'Favorited' : `Add ${selected.name} to favorites`}
    </button>
  );
}

export function FavoritesList({ title = 'Favorites', compact = false }) {
  const { user, setSelectedState } = useSelectedState();
  const { data, error, loading, reload } = useApi(user ? '/api/favorites' : null);
  const [busyId, setBusyId] = useState(null);

  const remove = async (id) => {
    setBusyId(id);
    try {
      await fetchJson(`/api/favorites/${id}`, { method: 'DELETE' });
      invalidate('/api/favorites');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="card" aria-labelledby="fav-title">
      <div className="card-header">
        <div><div className="eyebrow">Saved in PostgreSQL</div><h2 id="fav-title">{title}</h2></div>
        <Star size={18} color="var(--warning)" />
      </div>
      {!user ? (
        <EmptyState title="Sign in to save favorites" message="Favorites are stored in your account." action={<Link className="btn btn-sm btn-primary" href="/login">Log in</Link>} />
      ) : loading && !data ? (
        <CardSkeleton lines={3} label="Loading favorites…" />
      ) : error && !data ? (
        <ErrorState title="Favorites unavailable" message={error.message} onRetry={reload} />
      ) : !data.favorites.length ? (
        <EmptyState title="No favorites yet" message="Use “Add to favorites” on any state to save it here." />
      ) : (
        <ul className="list">
          {data.favorites.slice(0, compact ? 5 : undefined).map((f) => (
            <li key={f.id}>
              <button type="button" className="name" onClick={() => setSelectedState(f.state.code, { source: 'favorite' })}>{f.state.name}</button>
              <span className="row">
                {!compact && <span className="tiny faint">added {fmtRelative(f.createdAt)}</span>}
                <button type="button" className="btn btn-ghost btn-sm btn-danger icon-btn" aria-label={`Remove ${f.state.name} from favorites`} onClick={() => remove(f.id)} disabled={busyId === f.id}>
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RecentSearches({ compact = false }) {
  const { user, setSelectedState } = useSelectedState();
  const { data, error, loading, reload } = useApi(user ? '/api/search-history' : null);
  const [busy, setBusy] = useState(false);

  const remove = async (id) => {
    setBusy(true);
    try {
      await fetchJson(`/api/search-history/${id}`, { method: 'DELETE' });
      invalidate('/api/search-history');
    } finally {
      setBusy(false);
    }
  };
  const clearAll = async () => {
    if (!window.confirm('Delete your entire search history?')) return;
    setBusy(true);
    try {
      await fetchJson('/api/search-history', { method: 'DELETE' });
      invalidate('/api/search-history');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" aria-labelledby="recent-title">
      <div className="card-header">
        <div><div className="eyebrow">Saved in PostgreSQL</div><h2 id="recent-title">Recent searches</h2></div>
        {user && data?.history.length ? (
          <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={clearAll} disabled={busy}>Clear all</button>
        ) : <Clock size={18} className="faint" />}
      </div>
      {!user ? (
        <EmptyState title="Sign in to keep a history" message="States you select are recorded in your account." />
      ) : loading && !data ? (
        <CardSkeleton lines={3} label="Loading search history…" />
      ) : error && !data ? (
        <ErrorState title="History unavailable" message={error.message} onRetry={reload} />
      ) : !data.history.length ? (
        <EmptyState title="No searches yet" message="Select a state with the search box, dropdown or map." />
      ) : (
        <ul className="list">
          {data.history.slice(0, compact ? 5 : undefined).map((h) => (
            <li key={h.id}>
              <button type="button" className="name" onClick={() => setSelectedState(h.state.code, { source: 'history' })}>{h.state.name}</button>
              <span className="row">
                <span className="tiny faint">{fmtRelative(h.searchedAt)}</span>
                <button type="button" className="btn btn-ghost btn-sm btn-danger icon-btn" aria-label={`Delete ${h.state.name} from history`} onClick={() => remove(h.id)} disabled={busy}>
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
