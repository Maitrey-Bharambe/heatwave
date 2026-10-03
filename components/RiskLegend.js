import { RISK_LEVELS } from '@/lib/riskLevels';

export default function RiskLegend({ className = 'card', forecast = false }) {
  return (
    <div className={className} aria-label="Heat risk legend">
      <div className="title">{forecast ? 'Forecast heat risk' : 'Heat risk'}</div>
      <ul>
        {[...RISK_LEVELS].reverse().map((l) => (
          <li key={l.key}>
            <span className="dot" style={{ background: l.color }} />
            <span>{l.label}</span>
            <span className="faint tiny" style={{ marginLeft: 'auto' }}>{l.min}–{l.max}</span>
          </li>
        ))}
      </ul>
      <div className="note">Project-defined bands, not official IMD warnings.</div>
    </div>
  );
}
