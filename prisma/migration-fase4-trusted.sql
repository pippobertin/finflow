-- Fase 4 Migration: isTrusted flag on TrialBalanceSnapshot
-- ADR-008: client workspace only shows trusted (validated) snapshots
-- Apply with: npx prisma db execute --file prisma/migration-fase4-trusted.sql

-- 1. Add is_trusted column (default false = not visible to clients)
ALTER TABLE "finflow"."trial_balance_snapshot"
  ADD COLUMN "is_trusted" BOOLEAN NOT NULL DEFAULT false;

-- 2. Mark the BLM 2024 golden test snapshot as trusted
-- (sourceFilename = 'golden-test-2024-anbil' with isLocked = true)
UPDATE "finflow"."trial_balance_snapshot"
SET "is_trusted" = true
WHERE "source_filename" = 'golden-test-2024-anbil'
  AND "is_locked" = true;
