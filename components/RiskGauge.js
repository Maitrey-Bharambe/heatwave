import { RISK_LEVELS, riskMeta } from '@/lib/riskLevels';

// Semicircular 0–100 gauge with the five project-defined bands.
const R = 60;
const CX = 75;
const CY = 75;
const point = (v) => {
  const a = Math.PI * (1 - v / 100);
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
};
const arc = (from, to) => {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
};

export default function RiskGauge({ score, level }) {
  const m = riskMeta(level);
  const [mx, my] = point(Math.max(0, Math.min(100, score ?? 0)));
  return (
    <svg className="gauge" viewBox="0 0 150 92" role="img" aria-label={`Heat-risk score ${score} out of 100, ${m?.label ?? 'unknown'}`}>
      {RISK_LEVELS.map((l) => (
        <path key={l.key} d={arc(l.min, Math.min(l.max + 1, 100))} stroke={l.color} strokeWidth="11" fill="none" opacity={l.key === level ? 1 : 0.28} />
      ))}
      {typeof score === 'number' && <circle cx={mx} cy={my} r="8" fill="var(--surface)" stroke={m?.color} strokeWidth="4" />}
      <text x={CX} y={CY - 6} textAnchor="middle" className="gauge-score" fill="var(--text)" style={{ fontSize: 30 }}>{score ?? '—'}</text>
      <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--text-muted)" style={{ fontSize: 10 }}>/ 100</text>
    </svg>
  );
}
