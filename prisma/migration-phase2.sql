-- ============================================================
-- FinFlow — Phase 2 migration
-- Esegui questo file nel Supabase SQL Editor
-- ============================================================

-- ─── 1. Enum: aggiungere PARTIALLY_PAID se non esiste ───────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'PARTIALLY_PAID'
      AND enumtypid = 'fin_invoice_status'::regtype
  ) THEN
    ALTER TYPE fin_invoice_status ADD VALUE 'PARTIALLY_PAID';
  END IF;
END
$$;

-- ─── 2. Tabella: fin_payment_event ──────────────────────────
CREATE TABLE IF NOT EXISTS fin_payment_event (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id   TEXT NOT NULL REFERENCES fin_organization(id) ON DELETE CASCADE,
  invoice_id        TEXT REFERENCES fin_invoice(id) ON DELETE CASCADE,
  one_off_expense_id TEXT REFERENCES fin_one_off_expense(id) ON DELETE CASCADE,
  amount            NUMERIC(15,2) NOT NULL,
  event_date        DATE NOT NULL,
  is_actual         BOOLEAN NOT NULL DEFAULT false,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_event_invoice
  ON fin_payment_event(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_expense
  ON fin_payment_event(one_off_expense_id);
CREATE INDEX IF NOT EXISTS idx_payment_event_date
  ON fin_payment_event(organization_id, event_date);

-- ─── 3. Tabella: fin_vat_snapshot ───────────────────────────
CREATE TABLE IF NOT EXISTS fin_vat_snapshot (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id  TEXT NOT NULL REFERENCES fin_organization(id),
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  period_type      TEXT NOT NULL,
  vat_debit        NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_credit       NUMERIC(15,2) NOT NULL DEFAULT 0,
  vat_balance      NUMERIC(15,2) NOT NULL DEFAULT 0,
  carry_forward    NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_due       NUMERIC(15,2) NOT NULL DEFAULT 0,
  due_date         DATE,
  is_paid          BOOLEAN NOT NULL DEFAULT false,
  paid_date        DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. Colonne Fase 2 sulla tabella fin_invoice ────────────
ALTER TABLE fin_invoice
  ADD COLUMN IF NOT EXISTS expected_collection_date DATE,
  ADD COLUMN IF NOT EXISTS counterpart_custom_dso   INTEGER,
  ADD COLUMN IF NOT EXISTS is_discounted_at_bank    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_discount_type       TEXT,
  ADD COLUMN IF NOT EXISTS bank_liquidation_date    DATE,
  ADD COLUMN IF NOT EXISTS bank_discount_fee        NUMERIC(15,2);
