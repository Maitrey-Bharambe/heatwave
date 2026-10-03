import { Suspense } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, CalendarDays, Database, Flame, History, Map as MapIcon, ShieldCheck, Thermometer } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getRiskSnapshot } from '@/lib/riskService';
import { riskMeta, RISK_DISCLAIMER } from '@/lib/riskLevels';
import { fmtTime } from '@/lib/format';
import { Brand } from '@/components/AppShell';
import ThemeToggle from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

const FEATURES = [
  [MapIcon, 'Live India heat-risk map', 'Leaflet map with real State/UT boundaries and 67 monitoring locations coloured by live risk.'],
  [Activity, 'Real-time monitoring', 'Current temperature, feels-like, humidity and wind from Open-Meteo, refreshed every 15 minutes.'],
  [Flame, 'Heat-risk estimation', 'A transparent 0–100 score built from six weather factors, with a plain-language explanation.'],
  [CalendarDays, '7-day forecast', 'Daily maximum, minimum and apparent temperature with a heat-risk estimate for each day.'],
  [History, 'Historical analysis', 'Observed daily weather for the last 7 or 30 days, or any range back to 1940.'],
  [Thermometer, 'Climate intelligence', 'Forecast heat compared with the 5-year same-season average at each location.'],
  [ShieldCheck, 'Safety preparation', 'Risk-specific guidance and verified national emergency numbers.'],
  [Database, 'PostgreSQL on Supabase', 'Users, favorites, search history, weather and risk records in a relational schema with keys, constraints and RLS.'],
];

async function LiveHotspots() {
  try {
    const { snapshot, meta } = await getRiskSnapshot();
    const top = snapshot.points.filter((p) => p.risk && p.current).sort((a, b) => b.risk.score - a.risk.score).slice(0, 6);
    return (
      <div>
        <div className="row-between" style={{ padding: '0.9rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
          <div><div className="eyebrow">Live now · highest heat risk</div><strong>Top monitored locations</strong></div>
          <span className="data-status"><span className={`live-dot${meta.stale ? ' stale' : ''}`} /> Updated {fmtTime(meta.fetchedAt)}</span>
        </div>
        <ul className="list" style={{ padding: '0.3rem 1.1rem 0.6rem' }}>
          {top.map((p) => {
            const m = riskMeta(p.risk.riskLevel);
            return (
              <li key={p.id}>
                <span className="row"><span className="dot" style={{ background: m.color }} /><span><strong>{p.name}</strong> <span className="muted small">{p.stateName}</span></span></span>
                <span className="row small num"><span>{p.current.temperature.toFixed(1)}°C</span><span className="muted">feels {p.current.apparentTemperature.toFixed(1)}°</span><strong style={{ color: m.color, minWidth: 28, textAlign: 'right' }}>{p.risk.score}</strong></span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  } catch {
    return <div className="state-box"><h3>Live data unavailable</h3><p className="small">Weather data could not be retrieved right now.</p></div>;
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();
  return (
    <>
      <header className="landing-nav">
        <Brand />
        <nav className="row">
          <ThemeToggle />
          {user ? (
            <Link className="btn btn-primary" href="/dashboard">Open dashboard</Link>
          ) : (
            <>
              <Link className="btn btn-ghost hide-sm" href="/login">Login</Link>
              <Link className="btn btn-primary" href="/register">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">Climate Intelligence &amp; Heatwave Early Warning System for India</div>
            <h1 style={{ marginTop: '0.6rem' }}>See where <em>heat risk</em> is building across India, as it happens.</h1>
            <p className="lead">ClimateIQ combines live Open-Meteo weather, a transparent heat-risk engine and an interactive India map with your own saved states, so you can tell which regions are under heat stress, why, and what to do about it.</p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href="/dashboard">Explore Dashboard <ArrowRight size={16} /></Link>
              {!user && <Link className="btn btn-lg" href="/login">Login</Link>}
              {!user && <Link className="btn btn-lg btn-ghost" href="/register">Register</Link>}
            </div>
          </div>
          <div className="hero-visual">
            <Suspense fallback={<div className="state-box"><span className="loading-line">Fetching live weather…</span></div>}>
              <LiveHotspots />
            </Suspense>
          </div>
        </section>

        <section className="features">
          {FEATURES.map(([Icon, title, text]) => (
            <div key={title} className="card feature">
              <div className="ico"><Icon size={18} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </section>

        <section className="pipeline">
          <div className="eyebrow">How it works</div>
          <div className="pipeline-steps">
            {['Monitoring point', 'Open-Meteo', 'Next.js server', 'Heat-risk engine', 'PostgreSQL', 'Live map & dashboard'].map((s, i, a) => (
              <span key={s} className="row"><span className="step">{s}</span>{i < a.length - 1 && <ArrowRight size={14} className="faint" />}</span>
            ))}
          </div>
        </section>
      </main>
      <footer className="footer">{RISK_DISCLAIMER}<br />Weather data © Open-Meteo (CC BY 4.0) · Basemap © Esri · Boundaries: india-maps-data</footer>
    </>
  );
}
