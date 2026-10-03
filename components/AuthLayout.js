import { Brand } from './AppShell';
import ThemeToggle from './ThemeToggle';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Brand />
        <div>
          <h2>Know where heat risk is rising, before it peaks.</h2>
          <p>Live weather for 67 monitoring locations across all 36 States and Union Territories, scored by a transparent heat-risk engine and stored in PostgreSQL.</p>
        </div>
        <p className="small">Weather data: Open-Meteo · Risk levels are project-defined estimates, not official warnings.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <div className="row-between" style={{ marginBottom: '0.5rem' }}>
            <div className="eyebrow">ClimateIQ</div>
            <ThemeToggle />
          </div>
          <h1>{title}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
