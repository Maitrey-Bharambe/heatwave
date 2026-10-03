// Seeds reference data: states/UTs, monitoring locations, safety tips, emergency contacts.
// Contains NO weather values and NO fake users — weather comes live from Open-Meteo.
import { PrismaClient } from '@prisma/client';
import { STATES } from '../lib/states.js';
import { SAFETY_TIPS, EMERGENCY_CONTACTS } from '../lib/referenceData.js';

const prisma = new PrismaClient();

async function main() {
  for (const s of STATES) {
    const [, lat, lon] = s.points[0];
    const state = await prisma.state.upsert({
      where: { code: s.code },
      update: { name: s.name, type: s.type, capital: s.capital, latitude: lat, longitude: lon },
      create: { code: s.code, name: s.name, type: s.type, capital: s.capital, latitude: lat, longitude: lon },
    });
    for (const [i, [name, plat, plon]] of s.points.entries()) {
      await prisma.monitoringLocation.upsert({
        where: { name_stateId: { name, stateId: state.id } },
        update: { latitude: plat, longitude: plon, isRepresentative: i === 0 },
        create: { name, stateId: state.id, latitude: plat, longitude: plon, isRepresentative: i === 0 },
      });
    }
  }

  // Reference tables are fully replaced so edits to this file are applied on re-seed.
  await prisma.safetyTip.deleteMany();
  await prisma.safetyTip.createMany({
    data: SAFETY_TIPS.map(([riskLevel, category, title, description], i) => ({ riskLevel, category, title, description, sortOrder: i })),
  });
  await prisma.emergencyContact.deleteMany();
  await prisma.emergencyContact.createMany({
    data: EMERGENCY_CONTACTS.map(([name, phone, description, source], i) => ({ name, phone, description, source, sortOrder: i })),
  });

  const [states, points, tips, contacts] = await Promise.all([
    prisma.state.count(), prisma.monitoringLocation.count(), prisma.safetyTip.count(), prisma.emergencyContact.count(),
  ]);
  console.log(`Seeded ${states} states/UTs, ${points} monitoring locations, ${tips} safety tips, ${contacts} emergency contacts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
