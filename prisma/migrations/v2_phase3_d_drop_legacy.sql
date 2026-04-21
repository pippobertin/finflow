-- ============================================================================
-- V2 Phase 3 Block D: Drop archive tables + legacy V1 tables
-- ============================================================================
-- Archive tables created during Phase 3.A migration (hold old columns)
-- Legacy tables no longer used: PaymentEvent, DismissedMatch, Connector
-- Backup at: backups/pre-fase3-d-*.sql
-- ============================================================================

BEGIN;

-- 1. Drop archive tables (created in v2_phase3_invoice_light.sql)
DROP TABLE IF EXISTS public.invoice_legacy_archive CASCADE;
DROP TABLE IF EXISTS public.bank_statement_legacy_archive CASCADE;
DROP TABLE IF EXISTS public.invoice_line_archive CASCADE;

-- 2. Drop legacy V1 tables
-- PaymentEvent (Phase 2 table, never used in production)
DROP TABLE IF EXISTS public.fin_payment_event CASCADE;

-- DismissedMatch (reconciliation — disabled via feature flag since Fase 0.3)
DROP TABLE IF EXISTS public.fin_dismissed_match CASCADE;

-- Connector (FattureInCloud connector — disabled via feature flag since Fase 0.3)
DROP TABLE IF EXISTS public.fin_connector CASCADE;

-- 3. Drop ConnectorType enum
DROP TYPE IF EXISTS public."ConnectorType" CASCADE;

DO $$ BEGIN
  RAISE NOTICE 'Migration V2 Phase 3.D applied: archive + legacy tables dropped';
END $$;

COMMIT;
