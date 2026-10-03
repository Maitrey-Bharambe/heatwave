'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarDays, Flame, History, LayoutDashboard, LogIn, LogOut, Map as MapIcon, Menu, ShieldCheck, Siren, Star, User, UserPlus,
} from 'lucide-react';
import { fetchJson } from '@/lib/client/useApi';
import { useSelectedState } from './SelectedStateProvider';
import StateSelector from './StateSelector';
import ThemeToggle from './ThemeToggle';

const NAV = [
  ['Monitor', [
    ['/dashboard', 'Dashboard', LayoutDashboard],
    ['/map', 'Live Map', MapIcon],
    ['/forecast', 'Forecast', CalendarDays],
    ['/historical', 'Historical', History],
    ['/heat-risk', 'Heat Risk', Flame],
  ]],
  ['Prepare', [
    ['/safety', 'Safety', ShieldCheck],
    ['/emergency', 'Emergency', Siren],
  ]],
  ['Account', [
    ['/favorites', 'Favorites', Star],
    ['/profile', 'Profile', User],
  ]],
];

export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark"><Flame size={18} /></span>
      <span>
        <span className="brand-name">ClimateIQ</span>
        <span className="brand-sub" style={{ display: 'block' }}>Heatwave Early Warning · India</span>
      </span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hrefWithState, selected } = useSelectedState();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetchJson('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <div className="shell">
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Main navigation">
        <Brand />
        <nav>
          {NAV.map(([section, items]) => (
            <div key={section}>
              <div className="nav-section">{section}</div>
              {items.map(([href, label, Icon]) => (
                <Link key={href} href={hrefWithState(href)} className={`nav-link${pathname === href ? ' active' : ''}`} aria-current={pathname === href ? 'page' : undefined}>
                  <Icon size={17} /> {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="user-chip">
                <span className="avatar">{user.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="small" style={{ display: 'block', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</span>
                  <span className="tiny muted" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                </span>
              </div>
              <button type="button" className="nav-link" onClick={logout} disabled={loggingOut}><LogOut size={17} /> {loggingOut ? 'Logging out…' : 'Logout'}</button>
            </>
          ) : (
            <>
              <Link className="nav-link" href="/login"><LogIn size={17} /> Log in</Link>
              <Link className="nav-link" href="/register"><UserPlus size={17} /> Register</Link>
            </>
          )}
        </div>
      </aside>
      <div className={`overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="main">
        <header className="topbar">
          <button type="button" className="btn btn-ghost icon-btn menu-btn" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={20} /></button>
          <div className="topbar-state small muted">Selected: <strong style={{ color: 'var(--text)' }}>{selected.name}</strong></div>
          <div className="topbar-spacer" />
          <StateSelector showDropdown={false} />
          <ThemeToggle />
        </header>
        <main className="content" id="main">{children}</main>
      </div>
    </div>
  );
}
