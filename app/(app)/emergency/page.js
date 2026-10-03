import { Phone } from 'lucide-react';
import prisma from '@/lib/prisma';
import { Notice } from '@/components/ui';
import HospitalFinder from './HospitalFinder';

export const metadata = { title: 'Emergency' };
export const dynamic = 'force-dynamic';

export default async function EmergencyPage() {
  const contacts = await prisma.emergencyContact.findMany({ orderBy: { sortOrder: 'asc' } });
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Emergency</div>
          <h1>Emergency contacts</h1>
          <p className="lead">National emergency numbers in India. Heatstroke is a medical emergency: call <strong>108</strong> or <strong>112</strong> immediately.</p>
        </div>
      </div>

      <Notice kind="warn">Availability of some helplines (e.g. 102, 1070, 1077) varies by state and district. In any life-threatening emergency, dial 112.</Notice>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {contacts.map((c) => (
          <a key={c.id} href={`tel:${c.phone}`} className="card contact" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="num-big num">{c.phone}</span>
            <span className="meta">
              <h3>{c.name}</h3>
              <p>{c.description}</p>
              <span className="tiny faint">Source: {c.source}</span>
            </span>
            <Phone size={18} className="faint" />
          </a>
        ))}
      </div>

      <HospitalFinder />
    </>
  );
}
