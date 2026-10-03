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
