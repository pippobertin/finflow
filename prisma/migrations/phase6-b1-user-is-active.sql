-- Phase 6 Block B1: add is_active column for soft-disable user management
ALTER TABLE public.fin_user ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
