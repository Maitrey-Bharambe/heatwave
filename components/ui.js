'use client';
import { AlertTriangle, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Inbox, Info, Loader2, RefreshCw, Sun } from 'lucide-react';
import { riskMeta } from '@/lib/riskLevels';
import { fmtTime } from '@/lib/format';
import { describeWeatherCode } from '@/lib/weatherCodes';

export function Skeleton({ h = 16, w = '100%', style }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 4, label = 'Loading…' }) {
  return (
    <div className="stack" role="status" aria-label={label}>
      <Skeleton h={14} w="40%" />
      <Skeleton h={44} w="60%" />
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} h={12} w={`${90 - i * 12}%`} />)}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingLine({ children = 'Loading…' }) {
  return <div className="loading-line" role="status"><Loader2 size={16} className="spin" /> {children}</div>;
}

export function ErrorState({ title = 'Data unavailable', message, onRetry }) {
  return (
    <div className="state-box error" role="alert">
      <div className="icon-circle"><AlertTriangle size={20} /></div>
      <h3>{title}</h3>
      {message && <p className="small">{message}</p>}
      {onRetry && <button type="button" className="btn btn-sm" onClick={() => onRetry()}><RefreshCw size={14} /> Retry</button>}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state-box">
      <div className="icon-circle"><Inbox size={20} /></div>
      <h3>{title}</h3>
      {message && <p className="small">{message}</p>}
      {action}
    </div>
  );
}

export function Notice({ kind = 'info', children }) {
  return (
    <div className={`notice ${kind}`}>
      {kind === 'info' ? <Info size={16} /> : <AlertTriangle size={16} />}
      <div>{children}</div>
    </div>
  );
}

export function RiskBadge({ level, score, size }) {
  const m = riskMeta(level);
  if (!m) return <span className="badge">No data</span>;
  const light = level === 'MEDIUM' || level === 'LOW';
  return (
    <span className={`risk-pill${light ? ' on-light' : ''}`} style={{ background: m.color, fontSize: size === 'lg' ? '0.85rem' : undefined }}>
      {m.label.toUpperCase()}{typeof score === 'number' ? ` · ${score}` : ''}
    </span>
  );
}

const ICONS = { sun: Sun, 'cloud-sun': CloudSun, cloud: Cloud, fog: CloudFog, drizzle: CloudDrizzle, rain: CloudRain, snow: CloudSnow, storm: CloudLightning };
export function WeatherIcon({ code, size = 22 }) {
  const Icon = ICONS[describeWeatherCode(code).icon] || Cloud;
  return <Icon size={size} aria-hidden="true" />;
}

/** "● Live · Updated 09:05 AM" / "Showing cached data · Last updated 08:57 AM" + refresh button. */
export function DataStatus({ meta, loading, onRefresh, refreshLabel = 'Refresh Data' }) {
  return (
    <div className="data-status">
      {loading && !meta ? (
        <span className="row"><Loader2 size={13} className="spin" /> Loading…</span>
      ) : meta ? (
        <>
          <span className={`live-dot${meta.stale ? ' stale' : ''}`} aria-hidden="true" />
          {meta.stale ? (
            <span>Showing cached data · Last updated {fmtTime(meta.fetchedAt)}</span>
          ) : meta.fromCache ? (
            <span>Showing cached data · Last updated {fmtTime(meta.fetchedAt)}</span>
          ) : (
            <span>Live · Updated {fmtTime(meta.fetchedAt)}</span>
          )}
        </>
      ) : null}
      {onRefresh && (
        <button type="button" className="btn btn-sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Updating…' : refreshLabel}
        </button>
      )}
    </div>
  );
}
