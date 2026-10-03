'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useApi } from '@/lib/client/useApi';
import { useSelectedState } from './SelectedStateProvider';
import RiskGauge from './RiskGauge';
import { FactorBars, riskHeadline, WhyList } from './RiskFactors';
import { CardSkeleton, ErrorState, RiskBadge } from './ui';

export default function HeatRiskCard({ compact = true }) {
  const { selected, hrefWithState } = useSelectedState();
  const { data, error, loading, reload } = useApi(`/api/heat-risk/${selected.code}`);
  const ok = data?.state?.code === selected.code ? data : null;

  return (
    <section className="card" aria-labelledby="risk-title">
      <div className="card-header">
        <div>
          <div className="eyebrow">System-generated heat-risk estimate</div>
          <h2 id="risk-title">Heat risk · {selected.name}</h2>
        </div>
        {ok && <RiskBadge level={ok.risk.riskLevel} />}
      </div>
      {loading && !ok ? (
        <CardSkeleton label="Calculating heat risk…" />
      ) : error && !ok ? (
        <ErrorState title="Heat risk unavailable" message={error.message} onRetry={reload} />
      ) : ok ? (
        <div className="stack">
          <div className="gauge-wrap">
            <RiskGauge score={ok.risk.score} level={ok.risk.riskLevel} />
            <div>
              <p style={{ fontWeight: 600 }}>{riskHeadline(ok.risk.riskLevel)}</p>
              <p className="small muted" style={{ marginTop: 4 }}>Based on live weather at {ok.representative.name}.</p>
              {ok.forecastPeak && <p className="small muted" style={{ marginTop: 4 }}>7-day peak: <RiskBadge level={ok.forecastPeak.riskLevel} score={ok.forecastPeak.score} /></p>}
            </div>
          </div>
          {compact ? (
            <>
              <div className="eyebrow">Why this risk?</div>
              <WhyList explanation={ok.risk.explanation.slice(0, 3)} />
              <Link className="btn btn-sm" href={hrefWithState('/heat-risk')} style={{ alignSelf: 'flex-start' }}>Full breakdown <ArrowRight size={14} /></Link>
            </>
          ) : (
            <FactorBars factors={ok.risk.factors} />
          )}
        </div>
      ) : null}
    </section>
  );
}
