-- ClimateIQ — Supabase schema
-- Paste into Supabase → SQL Editor → New query → Run (once, on an empty project).
-- Generated from prisma/migrations by scripts/generate-supabase-sql.mjs — do not edit by hand.

-- ───────── migration 20261003035319_init ─────────
-- CreateEnum
CREATE TYPE "StateType" AS ENUM ('STATE', 'UNION_TERRITORY');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "stateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(4) NOT NULL,
    "type" "StateType" NOT NULL,
    "capital" VARCHAR(100),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "stateId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isRepresentative" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "monitoring_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_records" (
    "id" SERIAL NOT NULL,
    "stateId" INTEGER NOT NULL,
    "locationId" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "apparentTemperature" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "weatherCode" INTEGER NOT NULL,
    "weatherCondition" VARCHAR(60) NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecasts" (
    "id" SERIAL NOT NULL,
    "stateId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "minTemperature" DOUBLE PRECISION NOT NULL,
    "maxTemperature" DOUBLE PRECISION NOT NULL,
    "apparentTemperature" DOUBLE PRECISION NOT NULL,
    "weatherCode" INTEGER NOT NULL,
    "weatherCondition" VARCHAR(60) NOT NULL,
    "precipitation" DOUBLE PRECISION NOT NULL,
    "windSpeed" DOUBLE PRECISION NOT NULL,
    "riskScore" INTEGER,
    "riskLevel" "RiskLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_weather" (
    "id" SERIAL NOT NULL,
    "stateId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "minTemperature" DOUBLE PRECISION NOT NULL,
    "maxTemperature" DOUBLE PRECISION NOT NULL,
    "averageTemperature" DOUBLE PRECISION NOT NULL,
    "apparentTemperature" DOUBLE PRECISION NOT NULL,
    "source" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historical_weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "heat_risk" (
    "id" SERIAL NOT NULL,
    "stateId" INTEGER NOT NULL,
    "locationId" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "apparentTemperature" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "factors" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "heat_risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_search_history" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stateId" INTEGER NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_tips" (
    "id" SERIAL NOT NULL,
    "riskLevel" "RiskLevel",
    "category" VARCHAR(40) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "safety_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "source" VARCHAR(200) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_code_key" ON "states"("code");

-- CreateIndex
CREATE INDEX "monitoring_locations_stateId_idx" ON "monitoring_locations"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_locations_name_stateId_key" ON "monitoring_locations"("name", "stateId");

-- CreateIndex
CREATE INDEX "weather_records_stateId_recordedAt_idx" ON "weather_records"("stateId", "recordedAt");

-- CreateIndex
CREATE INDEX "weather_records_recordedAt_idx" ON "weather_records"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "forecasts_stateId_date_key" ON "forecasts"("stateId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "historical_weather_stateId_date_key" ON "historical_weather"("stateId", "date");

-- CreateIndex
CREATE INDEX "heat_risk_stateId_calculatedAt_idx" ON "heat_risk"("stateId", "calculatedAt");

-- CreateIndex
CREATE INDEX "heat_risk_calculatedAt_idx" ON "heat_risk"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_userId_stateId_key" ON "user_favorites"("userId", "stateId");

-- CreateIndex
CREATE INDEX "user_search_history_userId_searchedAt_idx" ON "user_search_history"("userId", "searchedAt");

-- CreateIndex
CREATE INDEX "safety_tips_riskLevel_idx" ON "safety_tips"("riskLevel");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_locations" ADD CONSTRAINT "monitoring_locations_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "monitoring_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forecasts" ADD CONSTRAINT "forecasts_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historical_weather" ADD CONSTRAINT "historical_weather_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_risk" ADD CONSTRAINT "heat_risk_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heat_risk" ADD CONSTRAINT "heat_risk_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "monitoring_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_search_history" ADD CONSTRAINT "user_search_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_search_history" ADD CONSTRAINT "user_search_history_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "states"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ───────── Prisma migration history ─────────
-- Records the migrations above as applied, so `prisma migrate deploy` (run by Vercel's
-- build) sees no pending migrations instead of trying to create the tables again.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                  VARCHAR(36) PRIMARY KEY NOT NULL,
    "checksum"            VARCHAR(64) NOT NULL,
    "finished_at"         TIMESTAMPTZ,
    "migration_name"      VARCHAR(255) NOT NULL,
    "logs"                TEXT,
    "rolled_back_at"      TIMESTAMPTZ,
    "started_at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES (gen_random_uuid()::text, 'd3cba0f92b2bd9500c4872b17cb4c00be07c30079aad541af991766f3c0c5c6d', now(), '20261003035319_init', 1);

-- ───────── Row Level Security ─────────
-- ClimateIQ talks to Postgres only through Prisma on the server (as the table owner, which
-- bypasses RLS). Enabling RLS with NO policies blocks Supabase's public Data API (anon /
-- authenticated keys) from reading or writing these tables — e.g. users.passwordHash.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "states" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "monitoring_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weather_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "forecasts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historical_weather" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "heat_risk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_search_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "safety_tips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emergency_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- ClimateIQ — Supabase seed data (reference data only: no users, no weather values)
-- Run AFTER schema.sql. Safe to re-run.
-- Generated by scripts/generate-supabase-sql.mjs — do not edit by hand.

BEGIN;

-- 36 States and Union Territories (representative coordinates = first monitoring point)
INSERT INTO "states" ("name", "code", "type", "capital", "latitude", "longitude") VALUES
  ('Andhra Pradesh', 'AP', 'STATE', 'Amaravati', 16.5062, 80.648),
  ('Arunachal Pradesh', 'AR', 'STATE', 'Itanagar', 27.0844, 93.6053),
  ('Assam', 'AS', 'STATE', 'Dispur', 26.1445, 91.7362),
  ('Bihar', 'BR', 'STATE', 'Patna', 25.5941, 85.1376),
  ('Chhattisgarh', 'CG', 'STATE', 'Raipur', 21.2514, 81.6296),
  ('Goa', 'GA', 'STATE', 'Panaji', 15.4909, 73.8278),
  ('Gujarat', 'GJ', 'STATE', 'Gandhinagar', 23.0225, 72.5714),
  ('Haryana', 'HR', 'STATE', 'Chandigarh', 29.1492, 75.7217),
  ('Himachal Pradesh', 'HP', 'STATE', 'Shimla', 31.1048, 77.1734),
  ('Jharkhand', 'JH', 'STATE', 'Ranchi', 23.3441, 85.3096),
  ('Karnataka', 'KA', 'STATE', 'Bengaluru', 12.9716, 77.5946),
  ('Kerala', 'KL', 'STATE', 'Thiruvananthapuram', 8.5241, 76.9366),
  ('Madhya Pradesh', 'MP', 'STATE', 'Bhopal', 23.2599, 77.4126),
  ('Maharashtra', 'MH', 'STATE', 'Mumbai', 19.076, 72.8777),
  ('Manipur', 'MN', 'STATE', 'Imphal', 24.817, 93.9368),
  ('Meghalaya', 'ML', 'STATE', 'Shillong', 25.5788, 91.8933),
  ('Mizoram', 'MZ', 'STATE', 'Aizawl', 23.7271, 92.7176),
  ('Nagaland', 'NL', 'STATE', 'Kohima', 25.6751, 94.1086),
  ('Odisha', 'OD', 'STATE', 'Bhubaneswar', 20.2961, 85.8245),
  ('Punjab', 'PB', 'STATE', 'Chandigarh', 30.901, 75.8573),
  ('Rajasthan', 'RJ', 'STATE', 'Jaipur', 26.9124, 75.7873),
  ('Sikkim', 'SK', 'STATE', 'Gangtok', 27.3389, 88.6065),
  ('Tamil Nadu', 'TN', 'STATE', 'Chennai', 13.0827, 80.2707),
  ('Telangana', 'TG', 'STATE', 'Hyderabad', 17.385, 78.4867),
  ('Tripura', 'TR', 'STATE', 'Agartala', 23.8315, 91.2868),
  ('Uttar Pradesh', 'UP', 'STATE', 'Lucknow', 26.8467, 80.9462),
  ('Uttarakhand', 'UK', 'STATE', 'Dehradun', 30.3165, 78.0322),
  ('West Bengal', 'WB', 'STATE', 'Kolkata', 22.5726, 88.3639),
  ('Andaman and Nicobar Islands', 'AN', 'UNION_TERRITORY', 'Sri Vijaya Puram', 11.6234, 92.7265),
  ('Chandigarh', 'CH', 'UNION_TERRITORY', 'Chandigarh', 30.7333, 76.7794),
  ('Dadra and Nagar Haveli and Daman and Diu', 'DH', 'UNION_TERRITORY', 'Daman', 20.3974, 72.8328),
  ('Delhi', 'DL', 'UNION_TERRITORY', 'New Delhi', 28.6139, 77.209),
  ('Jammu and Kashmir', 'JK', 'UNION_TERRITORY', 'Srinagar (summer) / Jammu (winter)', 34.0837, 74.7973),
  ('Ladakh', 'LA', 'UNION_TERRITORY', 'Leh', 34.1526, 77.5771),
  ('Lakshadweep', 'LD', 'UNION_TERRITORY', 'Kavaratti', 10.5669, 72.642),
  ('Puducherry', 'PY', 'UNION_TERRITORY', 'Puducherry', 11.9416, 79.8083)
ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "type" = EXCLUDED."type", "capital" = EXCLUDED."capital",
  "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude";

-- Monitoring locations (real city coordinates; weather is fetched live, never stored here)
INSERT INTO "monitoring_locations" ("name", "stateId", "latitude", "longitude", "isRepresentative")
SELECT v.name, s.id, v.lat, v.lon, v.rep
FROM (VALUES
  ('Vijayawada', 'AP', 16.5062::float8, 80.648::float8, true),
  ('Visakhapatnam', 'AP', 17.6868::float8, 83.2185::float8, false),
  ('Kurnool', 'AP', 15.8281::float8, 78.0373::float8, false),
  ('Itanagar', 'AR', 27.0844::float8, 93.6053::float8, true),
  ('Guwahati', 'AS', 26.1445::float8, 91.7362::float8, true),
  ('Silchar', 'AS', 24.8333::float8, 92.7789::float8, false),
  ('Patna', 'BR', 25.5941::float8, 85.1376::float8, true),
  ('Gaya', 'BR', 24.7914::float8, 85.0002::float8, false),
  ('Raipur', 'CG', 21.2514::float8, 81.6296::float8, true),
  ('Panaji', 'GA', 15.4909::float8, 73.8278::float8, true),
  ('Ahmedabad', 'GJ', 23.0225::float8, 72.5714::float8, true),
  ('Rajkot', 'GJ', 22.3039::float8, 70.8022::float8, false),
  ('Surat', 'GJ', 21.1702::float8, 72.8311::float8, false),
  ('Hisar', 'HR', 29.1492::float8, 75.7217::float8, true),
  ('Gurugram', 'HR', 28.4595::float8, 77.0266::float8, false),
  ('Shimla', 'HP', 31.1048::float8, 77.1734::float8, true),
  ('Ranchi', 'JH', 23.3441::float8, 85.3096::float8, true),
  ('Jamshedpur', 'JH', 22.8046::float8, 86.2029::float8, false),
  ('Bengaluru', 'KA', 12.9716::float8, 77.5946::float8, true),
  ('Kalaburagi', 'KA', 17.3297::float8, 76.8343::float8, false),
  ('Mangaluru', 'KA', 12.9141::float8, 74.856::float8, false),
  ('Thiruvananthapuram', 'KL', 8.5241::float8, 76.9366::float8, true),
  ('Kochi', 'KL', 9.9312::float8, 76.2673::float8, false),
  ('Palakkad', 'KL', 10.7867::float8, 76.6548::float8, false),
  ('Bhopal', 'MP', 23.2599::float8, 77.4126::float8, true),
  ('Gwalior', 'MP', 26.2183::float8, 78.1828::float8, false),
  ('Jabalpur', 'MP', 23.1815::float8, 79.9864::float8, false),
  ('Mumbai', 'MH', 19.076::float8, 72.8777::float8, true),
  ('Nagpur', 'MH', 21.1458::float8, 79.0882::float8, false),
  ('Pune', 'MH', 18.5204::float8, 73.8567::float8, false),
  ('Chandrapur', 'MH', 19.9615::float8, 79.2961::float8, false),
  ('Imphal', 'MN', 24.817::float8, 93.9368::float8, true),
  ('Shillong', 'ML', 25.5788::float8, 91.8933::float8, true),
  ('Aizawl', 'MZ', 23.7271::float8, 92.7176::float8, true),
  ('Kohima', 'NL', 25.6751::float8, 94.1086::float8, true),
  ('Bhubaneswar', 'OD', 20.2961::float8, 85.8245::float8, true),
  ('Sambalpur', 'OD', 21.4669::float8, 83.9812::float8, false),
  ('Ludhiana', 'PB', 30.901::float8, 75.8573::float8, true),
  ('Amritsar', 'PB', 31.634::float8, 74.8723::float8, false),
  ('Jaipur', 'RJ', 26.9124::float8, 75.7873::float8, true),
  ('Jodhpur', 'RJ', 26.2389::float8, 73.0243::float8, false),
  ('Bikaner', 'RJ', 28.0229::float8, 73.3119::float8, false),
  ('Kota', 'RJ', 25.2138::float8, 75.8648::float8, false),
  ('Gangtok', 'SK', 27.3389::float8, 88.6065::float8, true),
  ('Chennai', 'TN', 13.0827::float8, 80.2707::float8, true),
  ('Madurai', 'TN', 9.9252::float8, 78.1198::float8, false),
  ('Coimbatore', 'TN', 11.0168::float8, 76.9558::float8, false),
  ('Hyderabad', 'TG', 17.385::float8, 78.4867::float8, true),
  ('Ramagundam', 'TG', 18.7557::float8, 79.474::float8, false),
  ('Agartala', 'TR', 23.8315::float8, 91.2868::float8, true),
  ('Lucknow', 'UP', 26.8467::float8, 80.9462::float8, true),
  ('Prayagraj', 'UP', 25.4358::float8, 81.8463::float8, false),
  ('Agra', 'UP', 27.1767::float8, 78.0081::float8, false),
  ('Varanasi', 'UP', 25.3176::float8, 82.9739::float8, false),
  ('Dehradun', 'UK', 30.3165::float8, 78.0322::float8, true),
  ('Kolkata', 'WB', 22.5726::float8, 88.3639::float8, true),
  ('Siliguri', 'WB', 26.7271::float8, 88.3953::float8, false),
  ('Sri Vijaya Puram (Port Blair)', 'AN', 11.6234::float8, 92.7265::float8, true),
  ('Chandigarh', 'CH', 30.7333::float8, 76.7794::float8, true),
  ('Daman', 'DH', 20.3974::float8, 72.8328::float8, true),
  ('Silvassa', 'DH', 20.2766::float8, 73.0169::float8, false),
  ('New Delhi', 'DL', 28.6139::float8, 77.209::float8, true),
  ('Srinagar', 'JK', 34.0837::float8, 74.7973::float8, true),
  ('Jammu', 'JK', 32.7266::float8, 74.857::float8, false),
  ('Leh', 'LA', 34.1526::float8, 77.5771::float8, true),
  ('Kavaratti', 'LD', 10.5669::float8, 72.642::float8, true),
  ('Puducherry', 'PY', 11.9416::float8, 79.8083::float8, true)
) AS v(name, code, lat, lon, rep)
JOIN "states" s ON s.code = v.code
ON CONFLICT ("name", "stateId") DO UPDATE SET "latitude" = EXCLUDED."latitude", "longitude" = EXCLUDED."longitude",
  "isRepresentative" = EXCLUDED."isRepresentative";

-- Safety guidance (riskLevel NULL = applies to every level)
DELETE FROM "safety_tips";
INSERT INTO "safety_tips" ("riskLevel", "category", "title", "description", "sortOrder") VALUES
  (NULL, 'Hydration', 'Drink water regularly', 'Drink water frequently even if you do not feel thirsty. Thirst is a late sign of dehydration.', 0),
  (NULL, 'Hydration', 'Use ORS and home-made drinks', 'Oral Rehydration Solution (ORS), lassi, lemon water, buttermilk and coconut water help replace salts lost through sweat.', 1),
  (NULL, 'Hydration', 'Limit alcohol, tea, coffee and sugary drinks', 'These can increase fluid loss. Prefer water and electrolyte drinks during hot weather.', 2),
  (NULL, 'Prevention', 'Wear light, loose cotton clothing', 'Light-coloured, loose, breathable clothes reflect heat and let sweat evaporate. Cover your head with a cap, cloth or umbrella outdoors.', 3),
  (NULL, 'Prevention', 'Keep your home cool', 'Use curtains or shades on sun-facing windows during the day and ventilate at night when it is cooler outside.', 4),
  (NULL, 'Prevention', 'Never leave anyone in a parked vehicle', 'Temperatures inside a closed vehicle rise dangerously within minutes. Never leave children, elderly people or pets inside.', 5),
  (NULL, 'Heat exhaustion', 'Recognise heat exhaustion', 'Heavy sweating, weakness, dizziness, headache, nausea, muscle cramps and fast pulse. Move to a cool place, loosen clothing, sip water or ORS and rest.', 6),
  (NULL, 'Heatstroke', 'Recognise heatstroke — a medical emergency', 'Very high body temperature, hot dry or red skin, confusion, slurred speech, seizures or unconsciousness. Call 108 or 112 immediately.', 7),
  (NULL, 'First aid', 'First aid while waiting for help', 'Move the person to shade, remove excess clothing, cool the body with wet cloths, fanning or water on the skin, and place ice packs at neck, armpits and groin. Do not give fluids to an unconscious person.', 8),
  (NULL, 'Vulnerable people', 'Check on vulnerable people', 'Infants, young children, older adults, pregnant women, outdoor workers and people with heart, kidney or respiratory conditions are at higher risk. Check on them at least twice a day during hot spells.', 9),
  (NULL, 'Outdoor safety', 'Plan outdoor work for cooler hours', 'Schedule strenuous activity for early morning or evening. Take frequent breaks in shade and drink water every 15–20 minutes while working.', 10),
  ('VERY_LOW', 'Outlook', 'Normal precautions are sufficient', 'Heat stress is unlikely. Stay hydrated as usual and keep an eye on the forecast for rising temperatures.', 11),
  ('LOW', 'Outlook', 'Stay hydrated during the afternoon', 'Some heat stress is possible during the hottest hours. Carry water when going out and take breaks in the shade.', 12),
  ('MEDIUM', 'Outlook', 'Limit afternoon sun exposure', 'Avoid strenuous outdoor activity between 12 noon and 3 PM. Keep ORS available and check on elderly neighbours.', 13),
  ('MEDIUM', 'Outdoor safety', 'Protect outdoor workers', 'Employers should provide shade, drinking water and rest breaks, and shift heavy work to cooler hours.', 14),
  ('HIGH', 'Outlook', 'Avoid going out in the afternoon', 'Stay indoors between 12 noon and 4 PM where possible. Postpone non-essential travel and outdoor exercise.', 15),
  ('HIGH', 'Vulnerable people', 'Prepare for heat illness', 'Keep ORS, a thermometer and wet cloths ready. Know the warning signs of heat exhaustion and heatstroke, and save 108 / 112 on your phone.', 16),
  ('EXTREME', 'Outlook', 'Treat heat as a health emergency risk', 'Stay in the coolest place available, avoid all strenuous activity, drink water every hour and follow advisories issued by IMD and your State Disaster Management Authority.', 17),
  ('EXTREME', 'Vulnerable people', 'Do not leave vulnerable people alone', 'Ensure infants, elderly and ill people are in a cool space and are checked frequently. Seek medical help at the first sign of confusion or very high body temperature.', 18);

-- Verified national emergency numbers
DELETE FROM "emergency_contacts";
INSERT INTO "emergency_contacts" ("name", "phone", "description", "source", "sortOrder") VALUES
  ('National Emergency Number (ERSS)', '112', 'Single emergency number for police, fire and medical emergencies, available nationwide.', 'Emergency Response Support System, Ministry of Home Affairs (112.gov.in)', 0),
  ('Ambulance', '108', 'Emergency medical ambulance service operated by state governments in most states and UTs.', 'National Health Mission, MoHFW', 1),
  ('Ambulance (maternal & child health)', '102', 'Patient transport, primarily for pregnant women and sick infants.', 'National Health Mission, MoHFW', 2),
  ('Police', '100', 'Police emergency (being integrated with 112 in most states).', 'Ministry of Home Affairs', 3),
  ('Fire', '101', 'Fire and rescue services.', 'Ministry of Home Affairs', 4),
  ('State Disaster Control Room', '1070', 'State Emergency Operation Centre for disasters, including heatwaves.', 'National Disaster Management Authority (NDMA)', 5),
  ('District Disaster Control Room', '1077', 'District Emergency Operation Centre / district control room.', 'National Disaster Management Authority (NDMA)', 6),
  ('National Disaster Helpline', '1078', 'National Emergency Operation Centre helpline.', 'National Disaster Management Authority (NDMA)', 7);

COMMIT;

-- Check: expect 36, 67, 19, 8
SELECT (SELECT count(*) FROM "states") AS states,
       (SELECT count(*) FROM "monitoring_locations") AS monitoring_locations,
       (SELECT count(*) FROM "safety_tips") AS safety_tips,
       (SELECT count(*) FROM "emergency_contacts") AS emergency_contacts;
