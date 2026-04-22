-- Fase 5.C1: VatSnapshot schema enhancement
-- Adds sourceType, label, surchargeAmount, creditCarriedOut to fin_vat_snapshot
-- Run on Supabase SQL Editor after schema update.

ALTER TABLE public.fin_vat_snapshot
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS surcharge_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_carried_out DECIMAL(15,2) NOT NULL DEFAULT 0;
