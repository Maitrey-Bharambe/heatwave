import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { getStates } from '@/lib/riskService';
import { DEFAULT_STATE_CODE } from '@/lib/states';
import { SelectedStateProvider } from '@/components/SelectedStateProvider';
import AppShell from '@/components/AppShell';

// Monitoring pages are viewable without an account (guest mode); account pages
// (favorites, profile) require login. The fallback state (when the URL has no ?state=)
// is the last state the visitor chose, then the user's home state, then Maharashtra.
export default async function AppLayout({ children }) {
  // Reading cookies first marks every app page as dynamic, so nothing queries the
  // database at build time.
  const jar = await cookies();
  const [user, states] = await Promise.all([getCurrentUser(), getStates()]);
  const last = jar.get('ciq_state')?.value?.toUpperCase();
  const codes = new Set(states.map((s) => s.code));
  const fallbackCode = [last, user?.state?.code, DEFAULT_STATE_CODE].find((c) => c && codes.has(c));

  return (
    <Suspense>
      <SelectedStateProvider states={states} fallbackCode={fallbackCode} user={user}>
        <AppShell>{children}</AppShell>
      </SelectedStateProvider>
    </Suspense>
  );
}
