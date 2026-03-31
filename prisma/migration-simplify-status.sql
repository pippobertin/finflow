-- Migration: Simplify InvoiceStatus to only PENDING and PAID
-- Run this on Supabase SQL Editor BEFORE deploying the new code.

-- 1. Convert all non-standard statuses to PENDING
UPDATE public.fin_invoice
SET status = 'PENDING'
WHERE status IN ('OVERDUE', 'DRAFT', 'PARTIALLY_PAID');

-- 2. Prisma does not manage removal of PostgreSQL enum values,
--    but unused values in the enum are harmless.
--    If you want a clean enum, you can recreate it:
--
--    ALTER TYPE public.fin_invoice_status RENAME TO fin_invoice_status_old;
--    CREATE TYPE public.fin_invoice_status AS ENUM ('PAID', 'PENDING');
--    ALTER TABLE public.fin_invoice
--      ALTER COLUMN status TYPE public.fin_invoice_status
--      USING status::text::public.fin_invoice_status;
--    DROP TYPE public.fin_invoice_status_old;
