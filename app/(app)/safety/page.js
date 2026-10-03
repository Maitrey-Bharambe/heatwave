import { Droplets, HeartPulse, Shield, Stethoscope, Sun, Users, Activity } from 'lucide-react';
import { db, run } from '@/lib/db';
import { RISK_LEVELS } from '@/lib/riskLevels';
import SafetyCard from '@/components/SafetyCard';

export const metadata = { title: 'Heat Safety' };
export const dynamic = 'force-dynamic';

const ICONS = { Hydration: Droplets, Prevention: Sun, 'Heat exhaustion': Activity, Heatstroke: HeartPulse, 'First aid': Stethoscope, 'Vulnerable people': Users, 'Outdoor safety': Shield };
const DOS = ['Drink water often, even when not thirsty', 'Wear light, loose cotton clothes and cover your head', 'Stay indoors or in shade between 12 noon and 3 PM', 'Check on elderly neighbours, children and outdoor workers', 'Keep ORS at home and know the signs of heatstroke'];
const DONTS = ['Leave children, elderly people or pets in parked vehicles', 'Do strenuous work in the afternoon sun', 'Rely on alcohol, tea, coffee or sugary drinks to hydrate', 'Ignore dizziness, confusion or a very high body temperature', 'Give fluids to someone who is unconscious'];

export default async function SafetyPage() {
  const tips = await run(db().from('safety_tips').select('*').order('sortOrder'));
  const general = tips.filter((t) => !t.riskLevel);
  const categories = [...new Set(general.map((t) => t.category))];
  const byLevel = RISK_LEVELS.map((l) => ({ ...l, tips: tips.filter((t) => t.riskLevel === l.key) }));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Prepare</div>
          <h1>Heat safety guidance</h1>
          <p className="lead">Practical guidance based on publicly available NDMA heatwave guidelines and WHO heat-health advice. Stored in the safety_tips table.</p>
        </div>
      </div>

      <div className="grid grid-dash">
        <div className="card">
          <div className="grid grid-2" style={{ gap: '0 1.5rem' }}>
            {categories.map((cat) => {
              const Icon = ICONS[cat] || Shield;
              return general.filter((t) => t.category === cat).map((t) => (
                <div key={t.id} className="tip">
                  <span className="ico"><Icon size={17} /></span>
                  <div><div className="eyebrow" style={{ fontSize: '0.64rem' }}>{cat}</div><h3>{t.title}</h3><p>{t.description}</p></div>
                </div>
              ));
            })}
          </div>
        </div>
        <div className="side-col">
          <SafetyCard />
          <section className="card">
            <h2>Do&apos;s</h2>
            <ul className="why" style={{ marginTop: 8 }}>{DOS.map((d) => <li key={d}>{d}</li>)}</ul>
            <h2 style={{ marginTop: '1rem' }}>Don&apos;ts</h2>
            <ul className="why" style={{ marginTop: 8 }}>{DONTS.map((d) => <li key={d}>{d}</li>)}</ul>
          </section>
        </div>
      </div>

      <section className="card">
        <div className="card-header"><div><div className="eyebrow">By heat-risk level</div><h2>What changes as risk rises</h2></div></div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {byLevel.map((l) => (
            <div key={l.key} style={{ borderTop: `4px solid ${l.color}`, paddingTop: '0.6rem' }}>
              <h3>{l.label} <span className="faint tiny">({l.min}–{l.max})</span></h3>
              {l.tips.map((t) => <p key={t.id} className="small muted" style={{ marginTop: 6 }}><strong style={{ color: 'var(--text)' }}>{t.title}.</strong> {t.description}</p>)}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
