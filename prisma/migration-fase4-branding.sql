-- Fase 4 Migration: branding JSON field on AccountingFirm
-- White-label support for accounting firm branding
-- Apply with: npx prisma db execute --file prisma/migration-fase4-branding.sql

ALTER TABLE "finflow"."accounting_firm"
  ADD COLUMN IF NOT EXISTS "branding" JSONB DEFAULT '{}';
