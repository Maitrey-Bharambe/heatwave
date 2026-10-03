// Formatting helpers (IST, units). Safe for server and client.
const TZ = 'Asia/Kolkata';

export const fmtTemp = (v, digits = 1) => (typeof v === 'number' ? `${v.toFixed(digits)}°C` : '—');
export const fmtNum = (v, unit = '', digits = 0) => (typeof v === 'number' ? `${v.toFixed(digits)}${unit}` : '—');

export function fmtTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso)).toUpperCase();
}
export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(iso));
}
export function fmtDate(isoDate, opts = { day: 'numeric', month: 'short' }) {
  if (!isoDate) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', ...opts }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}
export function fmtWeekday(isoDate, style = 'short') {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', weekday: style }).format(new Date(`${isoDate}T00:00:00Z`));
}
export function fmtRelative(iso) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}
