import { riskMeta } from '@/lib/riskLevels';

const LEVEL_COLOR = { Low: 'var(--risk-very-low)', Moderate: 'var(--risk-medium)', High: 'var(--risk-high)' };
const fmtValue = (f) => {
  if (f.key === 'historical') return `${f.value > 0 ? '+' : ''}${f.value} °C`;
  if (f.key === 'hotDays') return `${f.value} day${f.value === 1 ? '' : 's'}`;
  if (f.unit === '%') return `${f.value}%`;
  return `${f.value} °C`;
};

/** Contributing factors: each bar = factor sub-score × weight (points out of its weight). */
export function FactorBars({ factors }) {
  return (
    <ul className="factor-list">
      {factors.map((f) => (
        <li key={f.key} className="factor">
          <span>
            {f.label}
            <span className="tiny faint" style={{ display: 'block' }}>{fmtValue(f)} · {f.points}/{f.weight} pts</span>
          </span>
          <span className="bar" aria-hidden="true"><span style={{ width: `${Math.max(3, f.subScore * 100)}%`, background: LEVEL_COLOR[f.level] }} /></span>
          <span className="lvl" style={{ color: LEVEL_COLOR[f.level] }}>{f.level}</span>
        </li>
      ))}
    </ul>
  );
}

export function WhyList({ explanation }) {
  if (!explanation?.length) return null;
  return <ul className="why">{explanation.map((e) => <li key={e}>{e}</li>)}</ul>;
}

export function riskHeadline(level) {
  return {
    VERY_LOW: 'Heat stress is unlikely.',
    LOW: 'Some heat stress is possible in the hottest hours.',
    MEDIUM: 'Moderate heat stress — limit afternoon exposure.',
    HIGH: 'High heat stress — avoid the afternoon sun.',
    EXTREME: 'Extreme heat stress — treat as a health risk.',
  }[level] || '';
}

export const riskColor = (level) => riskMeta(level)?.color;
