-- ============================================================================
-- V2 Phase 3 Block B: Add cdg_category to fin_bank_statement
-- ============================================================================
-- Adds a text column for CDG category classification.
-- Stored as text (not enum) because BankStatement lives in public schema
-- while CdgCategory enum lives in finflow schema.
-- Validation is handled at the application layer.
-- ============================================================================

BEGIN;

ALTER TABLE public.fin_bank_statement
  ADD COLUMN IF NOT EXISTS cdg_category TEXT;

-- Index for filtering uncategorized movements
CREATE INDEX IF NOT EXISTS idx_bank_statement_cdg_category
  ON public.fin_bank_statement (organization_id, cdg_category)
  WHERE cdg_category IS NULL;

DO $$ BEGIN
  RAISE NOTICE 'Migration V2 Phase 3.B1 applied: cdg_category added to fin_bank_statement';
END $$;

COMMIT;
