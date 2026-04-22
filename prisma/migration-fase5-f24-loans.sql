-- Fase 5.D1: F24Schedule + LoanSchedule tables
-- Run on Supabase SQL Editor after schema update.

-- F24 tax payment schedules
CREATE TABLE IF NOT EXISTS finflow.f24_schedule (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
  period_label     TEXT NOT NULL,
  codice_tributo   TEXT,
  amount           DECIMAL(12,2) NOT NULL,
  due_date         DATE NOT NULL,
  is_paid          BOOLEAN NOT NULL DEFAULT false,
  paid_date        DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_f24_schedule_org_due
  ON finflow.f24_schedule (organization_id, due_date);

-- Loan installment schedules
CREATE TYPE finflow.loan_frequency AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

CREATE TABLE IF NOT EXISTS finflow.loan_schedule (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES public.fin_organization(id) ON DELETE CASCADE,
  loan_name        TEXT NOT NULL,
  bank_name        TEXT,
  total_amount     DECIMAL(15,2) NOT NULL,
  installment      DECIMAL(12,2) NOT NULL,
  principal        DECIMAL(12,2),
  interest         DECIMAL(12,2),
  frequency        finflow.loan_frequency NOT NULL DEFAULT 'MONTHLY',
  start_date       DATE NOT NULL,
  end_date         DATE,
  day_of_month     INT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_schedule_org
  ON finflow.loan_schedule (organization_id);
