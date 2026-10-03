'use client';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useApi } from '@/lib/client/useApi';
import { useSelectedState } from './SelectedStateProvider';
import { CardSkeleton, ErrorState, RiskBadge } from './ui';

// Risk-specific recommendations (from the safety_tips table) for the selected state's level.
export default function SafetyCard() {
  const { selected, hrefWithState } = useSelectedState();
  const risk = useApi(`/api/heat-risk/${selected.code}`);
  const level = risk.data?.state?.code === selected.code ? risk.data.risk.riskLevel : null;
  const tips = useApi(level ? `/api/safety?level=${level}` : null);
  const specific = tips.data?.tips.filter((t) => t.riskLevel === level) ?? [];

  return (
    <section className="card" aria-labelledby="safety-title">
      <div className="card-header">
        <div>
          <div className="eyebrow">Safety recommendation</div>
          <h2 id="safety-title">What to do now</h2>
        </div>
        {level && <RiskBadge level={level} />}
      </div>
      {risk.error && !level ? (
        <ErrorState title="Recommendation unavailable" message="Heat risk could not be calculated, so no level-specific advice is shown." onRetry={risk.reload} />
      ) : !tips.data ? (
        <CardSkeleton lines={2} label="Loading safety tips…" />
      ) : (
        <div className="stack">
          {specific.map((t) => (
            <div key={t.id} className="row" style={{ alignItems: 'flex-start', gap: '0.6rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary)', flex: 'none', marginTop: 2 }} />
              <div><strong className="small">{t.title}</strong><p className="small muted">{t.description}</p></div>
            </div>
          ))}
          <Link className="btn btn-sm" href={hrefWithState('/safety')} style={{ alignSelf: 'flex-start' }}>All safety guidance <ArrowRight size={14} /></Link>
        </div>
      )}
    </section>
  );
}
