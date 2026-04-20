-- Migration: Dismissed Matches
-- Persists rejected reconciliation suggestions so they don't reappear on refresh
-- Run on Supabase SQL Editor

-- 1. Create dismissed_match table
CREATE TABLE IF NOT EXISTS public.fin_dismissed_match (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
  bank_statement_id TEXT NOT NULL REFERENCES public.fin_bank_statement(id) ON DELETE CASCADE,
  target_id         TEXT NOT NULL,
  target_type       TEXT NOT NULL, -- INVOICE, EXPENSE, EXPECTED_PAYABLE
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Unique constraint: same pair can only be dismissed once
CREATE UNIQUE INDEX IF NOT EXISTS uq_dismissed_match
  ON public.fin_dismissed_match(bank_statement_id, target_id, target_type);

-- 3. Lookup index for loading dismissals per org + bank statement
CREATE INDEX IF NOT EXISTS idx_dismissed_match_org_bs
  ON public.fin_dismissed_match(organization_id, bank_statement_id);
