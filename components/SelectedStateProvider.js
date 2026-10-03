'use client';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fetchJson, invalidate } from '@/lib/client/useApi';

// THE single source of truth for the selected state.
// The selection lives in the URL (?state=MH) so every page, link and refresh agrees.
// Dropdown, search and map clicks all call setSelectedState().
const Ctx = createContext(null);

export function SelectedStateProvider({ states, fallbackCode, user, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const byCode = useMemo(() => new Map(states.map((s) => [s.code, s])), [states]);

  const paramCode = (params.get('state') || '').toUpperCase();
  const code = byCode.has(paramCode) ? paramCode : fallbackCode;
  const selected = byCode.get(code) || states[0];

  const setSelectedState = useCallback((nextCode, { source = 'select' } = {}) => {
    const c = String(nextCode || '').toUpperCase();
    if (!byCode.has(c)) return;
    const qs = new URLSearchParams(params.toString());
    qs.set('state', c);
    router.replace(`${pathname}?${qs}`, { scroll: false });
    document.cookie = `ciq_state=${c}; path=/; max-age=31536000; samesite=lax`;
    if (user) {
      fetchJson('/api/search-history', { method: 'POST', body: JSON.stringify({ stateCode: c, source }) })
        .then(() => invalidate('/api/search-history'))
        .catch(() => {});
    }
  }, [byCode, params, pathname, router, user]);

  const hrefWithState = useCallback((href) => `${href}?state=${selected.code}`, [selected]);

  const value = useMemo(() => ({ states, selected, setSelectedState, hrefWithState, user }), [states, selected, setSelectedState, hrefWithState, user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSelectedState() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSelectedState must be used inside SelectedStateProvider');
  return v;
}
