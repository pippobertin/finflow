-- ============================================================================
-- V2 Phase 3 Block A: Invoice Light + BankStatement Simplified + Drop InvoiceLine
-- ============================================================================
-- This migration:
-- 1. Archives removed Invoice columns to invoice_legacy_archive
-- 2. Archives removed BankStatement columns to bank_statement_legacy_archive
-- 3. Archives InvoiceLine table to invoice_line_archive
-- 4. Adds PK to all archive tables
-- 5. SANITY CHECK PRE-DROP (RAISE EXCEPTION → rollback if mismatch)
-- 6. Drops InvoiceLine table
-- 7. Drops Invoice legacy columns + adds new columns
-- 8. Drops BankStatement legacy columns + adds new columns
-- 9. Drops stale indexes
--
-- Run on Supabase SQL Editor. Review before executing.
-- ============================================================================

BEGIN;

-- ── 1. Archive Invoice legacy columns ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoice_legacy_archive AS
SELECT
  id,
  counterpart,
  vat_number,
  description,
  cost_center_id,
  needs_tagging,
  connector_ref,
  document_type,
  expected_collection_date,
  counterpart_custom_dso,
  is_discounted_at_bank,
  bank_discount_type,
  bank_liquidation_date,
  bank_discount_fee
FROM public.fin_invoice;

ALTER TABLE public.invoice_legacy_archive
  ADD CONSTRAINT invoice_legacy_archive_pkey PRIMARY KEY (id);

COMMENT ON TABLE public.invoice_legacy_archive IS
  'Archive of Invoice columns removed in V2 Phase 3. Join on id to fin_invoice.id if needed.';

-- ── 2. Archive BankStatement legacy columns ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bank_statement_legacy_archive AS
SELECT
  id,
  reconciled_invoice_id,
  reconciled_invoice_ids,
  reconciled_expense_id,
  reconciled_type,
  reconciled_at
FROM public.fin_bank_statement;

ALTER TABLE public.bank_statement_legacy_archive
  ADD CONSTRAINT bank_statement_legacy_archive_pkey PRIMARY KEY (id);

COMMENT ON TABLE public.bank_statement_legacy_archive IS
  'Archive of BankStatement reconciliation columns removed in V2 Phase 3.';

-- ── 3. Archive InvoiceLine table ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoice_line_archive AS
SELECT * FROM public.fin_invoice_line;

ALTER TABLE public.invoice_line_archive
  ADD CONSTRAINT invoice_line_archive_pkey PRIMARY KEY (id);

COMMENT ON TABLE public.invoice_line_archive IS
  'Full archive of fin_invoice_line table, dropped in V2 Phase 3.';

-- ── 4. SANITY CHECK PRE-DROP ─────────────────────────────────────────────────
-- Compares row counts between originals and archives.
-- RAISE EXCEPTION aborts the transaction → automatic ROLLBACK, no data lost.

DO $$
DECLARE
  orig_inv  INTEGER;
  arch_inv  INTEGER;
  orig_bs   INTEGER;
  arch_bs   INTEGER;
  orig_il   INTEGER;
  arch_il   INTEGER;
BEGIN
  SELECT COUNT(*) INTO orig_inv FROM public.fin_invoice;
  SELECT COUNT(*) INTO arch_inv FROM public.invoice_legacy_archive;
  IF orig_inv <> arch_inv THEN
    RAISE EXCEPTION 'Archive mismatch invoice: orig=% arch=%', orig_inv, arch_inv;
  END IF;

  SELECT COUNT(*) INTO orig_bs FROM public.fin_bank_statement;
  SELECT COUNT(*) INTO arch_bs FROM public.bank_statement_legacy_archive;
  IF orig_bs <> arch_bs THEN
    RAISE EXCEPTION 'Archive mismatch bank_statement: orig=% arch=%', orig_bs, arch_bs;
  END IF;

  SELECT COUNT(*) INTO orig_il FROM public.fin_invoice_line;
  SELECT COUNT(*) INTO arch_il FROM public.invoice_line_archive;
  IF orig_il <> arch_il THEN
    RAISE EXCEPTION 'Archive mismatch invoice_line: orig=% arch=%', orig_il, arch_il;
  END IF;

  RAISE NOTICE 'Pre-drop sanity OK: invoice=%, bank_statement=%, invoice_line=%',
    orig_inv, orig_bs, orig_il;
END $$;

-- ── 5. Drop InvoiceLine table ────────────────────────────────────────────────

DROP TABLE IF EXISTS public.fin_invoice_line;

-- ── 6. Drop Invoice legacy columns ──────────────────────────────────────────

ALTER TABLE public.fin_invoice
  DROP COLUMN IF EXISTS counterpart,
  DROP COLUMN IF EXISTS vat_number,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS cost_center_id,
  DROP COLUMN IF EXISTS needs_tagging,
  DROP COLUMN IF EXISTS connector_ref,
  DROP COLUMN IF EXISTS document_type,
  DROP COLUMN IF EXISTS expected_collection_date,
  DROP COLUMN IF EXISTS counterpart_custom_dso,
  DROP COLUMN IF EXISTS is_discounted_at_bank,
  DROP COLUMN IF EXISTS bank_discount_type,
  DROP COLUMN IF EXISTS bank_liquidation_date,
  DROP COLUMN IF EXISTS bank_discount_fee;

-- ── 7. Add new Invoice columns ──────────────────────────────────────────────

ALTER TABLE public.fin_invoice
  ADD COLUMN IF NOT EXISTS bank_account_id TEXT
    REFERENCES public.fin_bank_account(id),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── 8. Drop BankStatement legacy columns ────────────────────────────────────

ALTER TABLE public.fin_bank_statement
  DROP COLUMN IF EXISTS reconciled_invoice_id,
  DROP COLUMN IF EXISTS reconciled_invoice_ids,
  DROP COLUMN IF EXISTS reconciled_expense_id,
  DROP COLUMN IF EXISTS reconciled_type,
  DROP COLUMN IF EXISTS reconciled_at;

-- ── 9. Add new BankStatement columns ────────────────────────────────────────

ALTER TABLE public.fin_bank_statement
  ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(12, 2);

-- ── 10. Drop stale indexes ──────────────────────────────────────────────────

DROP INDEX IF EXISTS public."fin_invoice_cost_center_id_idx";
DROP INDEX IF EXISTS public."fin_invoice_organization_id_cost_center_id_idx";
DROP INDEX IF EXISTS public."fin_bank_statement_reconciled_invoice_id_idx";

-- ── 11. Post-migration notice ───────────────────────────────────────────────

DO $$ BEGIN
  RAISE NOTICE 'Migration V2 Fase 3.A applied successfully';
END $$;

COMMIT;
