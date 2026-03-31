-- FinFlow Onboarding Migration (Fase 3)
-- Run manually on Supabase SQL Editor BEFORE deploying the new code.
-- This migration adds: BankAccount, BalanceSnapshot, BankProfile, DataPeriod,
-- and modifies BankStatement.

-- ─── Enums ──────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.fin_balance_source AS ENUM ('EC_ANNUAL', 'EC_QUARTERLY', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fin_data_period_type AS ENUM ('EC_ANNUAL', 'EC_QUARTERLY', 'MOVEMENTS_CSV');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── New Tables ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fin_bank_account (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
  bank_name       TEXT NOT NULL,
  iban            TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_balance_snapshot (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bank_account_id TEXT NOT NULL REFERENCES public.fin_bank_account(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  balance         DECIMAL(15,2) NOT NULL,
  source          public.fin_balance_source NOT NULL,
  period          TEXT,
  source_file     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bank_account_id, date, source)
);

CREATE TABLE IF NOT EXISTS public.fin_bank_profile (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bank_account_id   TEXT NOT NULL UNIQUE REFERENCES public.fin_bank_account(id) ON DELETE CASCADE,
  bank_name         TEXT NOT NULL,
  column_mapping    JSONB NOT NULL DEFAULT '{}',
  date_format       TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
  delimiter         TEXT NOT NULL DEFAULT ',',
  decimal_separator TEXT NOT NULL DEFAULT ',',
  skip_rows         INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fin_data_period (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
  type            public.fin_data_period_type NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  source_file     TEXT,
  record_count    INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_data_period_org_type ON public.fin_data_period(organization_id, type);

-- ─── Modify BankStatement ───────────────────────────────────

ALTER TABLE public.fin_bank_statement
  ADD COLUMN IF NOT EXISTS bank_account_id TEXT REFERENCES public.fin_bank_account(id),
  ADD COLUMN IF NOT EXISTS fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_bank_statement_fingerprint
  ON public.fin_bank_statement(organization_id, fingerprint);

-- ─── Data Migration ─────────────────────────────────────────

-- Create a default BankAccount for each organization that has bank statements
INSERT INTO public.fin_bank_account (id, organization_id, bank_name, is_default)
SELECT
  gen_random_uuid()::text,
  o.id,
  'Conto Principale',
  true
FROM public.fin_organization o
WHERE EXISTS (SELECT 1 FROM public.fin_bank_statement bs WHERE bs.organization_id = o.id)
  AND NOT EXISTS (SELECT 1 FROM public.fin_bank_account ba WHERE ba.organization_id = o.id)
ON CONFLICT DO NOTHING;

-- Link existing bank statements to the default bank account
UPDATE public.fin_bank_statement bs
SET bank_account_id = ba.id
FROM public.fin_bank_account ba
WHERE ba.organization_id = bs.organization_id
  AND ba.is_default = true
  AND bs.bank_account_id IS NULL;

-- Migrate currentBalance from organization settings to BalanceSnapshot
-- This creates a MANUAL snapshot at Dec 31 of previous year for each org with currentBalance set
INSERT INTO public.fin_balance_snapshot (id, bank_account_id, date, balance, source)
SELECT
  gen_random_uuid()::text,
  ba.id,
  (date_trunc('year', now()) - interval '1 day')::date,
  (o.settings->>'currentBalance')::decimal,
  'MANUAL'::public.fin_balance_source
FROM public.fin_organization o
JOIN public.fin_bank_account ba ON ba.organization_id = o.id AND ba.is_default = true
WHERE o.settings->>'currentBalance' IS NOT NULL
  AND (o.settings->>'currentBalance')::decimal != 0
  AND NOT EXISTS (
    SELECT 1 FROM public.fin_balance_snapshot bsnap
    WHERE bsnap.bank_account_id = ba.id AND bsnap.source = 'MANUAL'
  )
ON CONFLICT DO NOTHING;

-- Add onboarding fields to organization settings
-- (These are JSON fields, so we merge them into the existing settings)
UPDATE public.fin_organization
SET settings = settings || '{"onboardingCompleted": true}'::jsonb
WHERE EXISTS (SELECT 1 FROM public.fin_bank_statement bs WHERE bs.organization_id = fin_organization.id);

-- New orgs without data get onboardingCompleted = false
UPDATE public.fin_organization
SET settings = settings || '{"onboardingCompleted": false}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.fin_bank_statement bs WHERE bs.organization_id = fin_organization.id)
  AND (settings->>'onboardingCompleted') IS NULL;
