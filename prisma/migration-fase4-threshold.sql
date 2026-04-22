-- Fase 4.D7: cash threshold per organization
-- Nullable: NULL means use default (5000 EUR)
-- Apply with: npx prisma db execute --file prisma/migration-fase4-threshold.sql

ALTER TABLE "public"."fin_organization"
  ADD COLUMN IF NOT EXISTS "cash_threshold_eur" DECIMAL(12, 2) NULL;
