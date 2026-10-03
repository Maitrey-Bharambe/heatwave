'use client';
import { Line } from 'react-chartjs-2';
import { ShieldCheck } from 'lucide-react';
import { useSelectedState } from '@/components/SelectedStateProvider';
import StateSelector from '@/components/StateSelector';
import RiskGauge from '@/components/RiskGauge';
import { FactorBars, riskHeadline, WhyList } from '@/components/RiskFactors';
import { baseOptions, useChartTheme } from '@/components/chartSetup';
import { DataStatus, ErrorState, LoadingLine, Notice, RiskBadge, Skeleton } from '@/components/ui';
import { useApi } from '@/lib/client/useApi';
import { fmtDate, fmtTemp, fmtTime } from '@/lib/format';

function TrendChart({ trend }) {
  const c = useChartTheme();
  if (!c) return <Skeleton h={200} />;
  const opts = baseOptions(c, { yTitle: 'Risk score' });
  opts.scales.y.min = 0;
  opts.scales.y.max = 100;
  opts.scales.y.ticks.callback = (v) => v;
  opts.plugins.legend.display = false;
  opts.plugins.tooltip.callbacks.label = (ctx) => `Score: ${ctx.parsed.y}`;
  return (
    <div className="chart-box sm">
      <Line
        role="img"
        aria-label="Heat-risk score over the last 48 hours"
        data={{ labels: trend.map((t) => fmtTime(t.calculatedAt)), datasets: [{ label: 'Score', data: trend.map((t) => t.score), borderColor: c.max, backgroundColor: c.max, pointRadius: 2, tension: 0.3 }] }}
        options={opts}
      />
    </div>
  );
}

export default function HeatRiskView() {
  const { selected } = useSelectedState();
  const { data: raw, error, loading, reload } = useApi(`/api/heat-risk/${selected.code}`);
  const data = raw?.state?.code === selected.code ? raw : null;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">System-generated heat-risk estimate</div>
          <h1>Heat risk · {selected.name}</h1>
          <p className="lead">A transparent, rule-based score (0–100) calculated from live and forecast weather. It is not an AI prediction.</p>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <StateSelector />
          {data && <DataStatus meta={data.meta} />}
        </div>
      </div>

      {loading && !data ? (
        <div className="card stack"><LoadingLine>Calculating heat risk…</LoadingLine><Skeleton h={200} /></div>
      ) : error && !data ? (
        <div className="card"><ErrorState title="Heat-risk estimate unavailable" message={error.message} onRetry={reload} /></div>
      ) : data ? (
        <>
          <div className="grid grid-2">
            <section className="card">
              <div className="card-header">
                <div><div className="eyebrow">Risk score</div><h2>{data.representative.name}, {selected.name}</h2><div className="sub">Representative location</div></div>
                <RiskBadge level={data.risk.riskLevel} size="lg" />
              </div>
              <div className="gauge-wrap">
                <RiskGauge score={data.risk.score} level={data.risk.riskLevel} />
                <div className="stack" style={{ gap: '0.35rem' }}>
                  <p style={{ fontWeight: 600 }}>{riskHeadline(data.risk.riskLevel)}</p>
                  {data.representative.current && (
                    <p className="small muted">Now: {fmtTemp(data.representative.current.temperature)}, feels like {fmtTemp(data.representative.current.apparentTemperature)}, humidity {data.representative.current.humidity}%</p>
                  )}
                  {data.forecastPeak && <p className="small muted">7-day forecast peak: <RiskBadge level={data.forecastPeak.riskLevel} score={data.forecastPeak.score} /> on {fmtDate(data.forecastPeak.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>}
                </div>
              </div>
              <div className="eyebrow" style={{ margin: '1rem 0 0.5rem' }}>Why this risk?</div>
              <WhyList explanation={data.risk.explanation} />
            </section>

            <section className="card">
              <div className="card-header"><div><div className="eyebrow">Contributing factors</div><h2>Score breakdown</h2><div className="sub">Each factor earns up to its weight in points. Total = {data.risk.score}/100.</div></div></div>
              <FactorBars factors={data.risk.factors} />
              {data.risk.missingFactors?.length > 0 && (
                <p className="tiny faint" style={{ marginTop: '0.8rem' }}>
                  Not evaluated (data unavailable): {data.risk.missingFactors.join(', ')}. The remaining weights were rescaled to 100, so no value was invented.
                </p>
              )}
            </section>
          </div>

          <div className="grid grid-2">
            <section className="card">
              <div className="card-header"><div><div className="eyebrow">Recommended actions</div><h2>For {data.risk.riskLevel.replace('_', ' ').toLowerCase()} risk</h2></div></div>
              <div className="stack">
                {data.tips.map((t) => (
                  <div key={t.id} className="row" style={{ alignItems: 'flex-start', gap: '0.6rem' }}>
                    <ShieldCheck size={18} style={{ color: 'var(--primary)', flex: 'none', marginTop: 2 }} />
                    <div><strong className="small">{t.title}</strong><p className="small muted">{t.description}</p></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="card">
              <div className="card-header"><div><div className="eyebrow">From the heat_risk table</div><h2>Score over the last 48 hours</h2><div className="sub">Each live refresh is stored in PostgreSQL</div></div></div>
              {data.trend.length >= 2 ? <TrendChart trend={data.trend} /> : <p className="small muted">The trend appears once at least two refreshes have been stored (one every 15 minutes while the app is in use).</p>}
            </section>
          </div>

          {data.otherPoints.length > 0 && (
            <section className="card card-flush">
              <div className="card-header" style={{ padding: '1rem 1.2rem 0' }}><div><h2>Other monitoring points in {selected.name}</h2><div className="sub">States are large; conditions differ across locations</div></div></div>
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Location</th><th>Temperature</th><th>Risk</th></tr></thead>
                  <tbody>
                    {data.otherPoints.map((p) => (
                      <tr key={p.id}><td>{p.name}</td><td className="num">{fmtTemp(p.temperature)}</td><td>{p.riskLevel ? <RiskBadge level={p.riskLevel} score={p.score} /> : '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-header"><div><div className="eyebrow">Methodology</div><h2>How the score is calculated</h2></div></div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Factor</th><th>Weight</th><th>Scale</th></tr></thead>
                <tbody>
                  {data.model.factors.map((f) => <tr key={f.key}><td>{f.label}</td><td className="num">{f.weight}</td><td style={{ whiteSpace: 'normal' }}>{f.describe}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="chips" style={{ margin: '1rem 0' }}>
              {data.model.levels.map((l) => (
                <button key={l.key} type="button" className="chip" style={{ cursor: 'default' }}><span className="dot" style={{ background: l.color }} /> {l.label}: {l.min}–{l.max}</button>
              ))}
            </div>
            <Notice kind="warn">{data.model.disclaimer}</Notice>
            {data.otherPoints.length === 0 && <p className="tiny faint" style={{ marginTop: 8 }}>{selected.name} has one monitoring point.</p>}
          </section>
        </>
      ) : null}
    </>
  );
}
