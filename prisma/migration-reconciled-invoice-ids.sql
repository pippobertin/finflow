-- Migration: Add reconciled_invoice_ids array column
-- Stores all invoice IDs for multi-invoice reconciliation matches
-- Run on Supabase SQL Editor

ALTER TABLE public.fin_bank_statement
  ADD COLUMN IF NOT EXISTS reconciled_invoice_ids TEXT[] NOT NULL DEFAULT '{}';

-- Backfill from existing single-invoice reconciliations
UPDATE public.fin_bank_statement
  SET reconciled_invoice_ids = ARRAY[reconciled_invoice_id]
  WHERE reconciled_invoice_id IS NOT NULL
    AND reconciled_invoice_ids = '{}';
