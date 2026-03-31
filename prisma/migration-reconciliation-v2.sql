-- Migration: Reconciliation V2
-- Adds expense reconciliation, reconciled type, and custom description patterns
-- Run on Supabase SQL Editor BEFORE using the new reconciliation features

-- 1. Add description_patterns to bank_profile
ALTER TABLE public.fin_bank_profile
  ADD COLUMN IF NOT EXISTS description_patterns JSONB;

-- 2. Add expense reconciliation + type to bank_statement
ALTER TABLE public.fin_bank_statement
  ADD COLUMN IF NOT EXISTS reconciled_expense_id TEXT
    REFERENCES public.fin_recurring_expense(id) ON UPDATE NO ACTION,
  ADD COLUMN IF NOT EXISTS reconciled_type TEXT;

-- 3. Backfill reconciled_type for existing reconciled statements
UPDATE public.fin_bank_statement
  SET reconciled_type = CASE
    WHEN reconciled_invoice_id IS NOT NULL THEN 'INVOICE'
    WHEN is_reconciled = true THEN 'IGNORED'
    ELSE NULL
  END
  WHERE is_reconciled = true AND reconciled_type IS NULL;

-- 4. Index for expense reconciliation lookups
CREATE INDEX IF NOT EXISTS idx_bank_statement_expense
  ON public.fin_bank_statement(reconciled_expense_id)
  WHERE reconciled_expense_id IS NOT NULL;
