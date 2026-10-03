// Project-defined heat-risk bands (NOT official IMD / government thresholds).
// Shared by server and client code.
export const RISK_LEVELS = [
  { key: 'VERY_LOW', label: 'Very Low', min: 0, max: 24, color: '#16a34a' },
  { key: 'LOW', label: 'Low', min: 25, max: 39, color: '#84cc16' },
  { key: 'MEDIUM', label: 'Medium', min: 40, max: 59, color: '#eab308' },
  { key: 'HIGH', label: 'High', min: 60, max: 79, color: '#f97316' },
  { key: 'EXTREME', label: 'Extreme', min: 80, max: 100, color: '#b91c1c' },
];

const BY_KEY = Object.fromEntries(RISK_LEVELS.map((l) => [l.key, l]));

export function riskLevelForScore(score) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return RISK_LEVELS.find((l) => s >= l.min && s <= l.max).key;
}

export function riskMeta(key) {
  return BY_KEY[key] || null;
}

export const RISK_DISCLAIMER =
  'Risk levels shown by this system are project-defined estimates based on current and forecast weather variables. They are not official government heatwave warnings.';
