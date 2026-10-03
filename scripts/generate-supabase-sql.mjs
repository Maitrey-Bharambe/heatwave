// Generates the seed data SQL and the one-step setup file for the Supabase SQL Editor:
//   supabase/seed.sql  — states/UTs, monitoring locations, safety tips, emergency contacts
//   supabase/setup.sql — supabase/schema.sql + supabase/seed.sql in one file (paste once, click Run)
// supabase/schema.sql is maintained by hand. Run: npm run db:sql
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATES } from '../lib/states.js';
import { SAFETY_TIPS, EMERGENCY_CONTACTS } from '../lib/referenceData.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase');
const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

const seed = `-- ClimateIQ — seed data (reference data only: no users, no weather values)
-- Run AFTER schema.sql. Safe to re-run.
-- Generated from lib/states.js and lib/referenceData.js by \`npm run db:sql\` — do not edit by hand.

BEGIN;

-- 36 States and Union Territories (representative coordinates = first monitoring point)
INSERT INTO "states" ("name", "code", "type", "capital", "latitude", "longitude") VALUES
${STATES.map((s) => `  (${q(s.name)}, ${q(s.code)}, '${s.type}', ${q(s.capital)}, ${s.points[0][1]}, ${s.points[0][2]})`).join(',\n')}
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "type" = EXCLUDED."type", "capital" = EXCLUDED."capital",
  "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude";

-- Monitoring locations (real city coordinates; weather is fetched live, never stored here)
INSERT INTO "monitoring_locations" ("name", "stateId", "latitude", "longitude", "isRepresentative")
SELECT v.name, s.id, v.lat, v.lon, v.rep
FROM (VALUES
${STATES.flatMap((s) => s.points.map(([name, lat, lon], i) => `  (${q(name)}, ${q(s.code)}, ${lat}::float8, ${lon}::float8, ${i === 0})`)).join(',\n')}
) AS v(name, code, lat, lon, rep)
JOIN "states" s ON s.code = v.code
ON CONFLICT ("name", "stateId") DO UPDATE SET "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude",
  "isRepresentative" = EXCLUDED."isRepresentative";

-- Safety guidance (riskLevel NULL = applies to every level)
DELETE FROM "safety_tips";
INSERT INTO "safety_tips" ("riskLevel", "category", "title", "description", "sortOrder") VALUES
${SAFETY_TIPS.map(([level, category, title, description], i) => `  (${level ? `'${level}'` : 'NULL'}, ${q(category)}, ${q(title)}, ${q(description)}, ${i})`).join(',\n')};

-- Verified national emergency numbers
DELETE FROM "emergency_contacts";
INSERT INTO "emergency_contacts" ("name", "phone", "description", "source", "sortOrder") VALUES
${EMERGENCY_CONTACTS.map(([name, phone, description, source], i) => `  (${q(name)}, ${q(phone)}, ${q(description)}, ${q(source)}, ${i})`).join(',\n')};

COMMIT;

-- Check: expect 36, ${STATES.reduce((n, s) => n + s.points.length, 0)}, ${SAFETY_TIPS.length}, ${EMERGENCY_CONTACTS.length}
SELECT (SELECT count(*) FROM "states") AS states,
       (SELECT count(*) FROM "monitoring_locations") AS monitoring_locations,
       (SELECT count(*) FROM "safety_tips") AS safety_tips,
       (SELECT count(*) FROM "emergency_contacts") AS emergency_contacts;
`;

const schema = fs.readFileSync(path.join(dir, 'schema.sql'), 'utf8');
fs.writeFileSync(path.join(dir, 'seed.sql'), seed);
fs.writeFileSync(path.join(dir, 'setup.sql'), `${schema.trimEnd()}\n\n${seed}`);
console.log('Wrote supabase/seed.sql and supabase/setup.sql');
