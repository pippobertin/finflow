-- Fase 2 Migration: CdG Trial Balance + mapping piano dei conti + data freezing
-- Generated via: prisma migrate diff --from-schema (HEAD) --to-schema (current)
-- Apply with: npx prisma db execute --file prisma/migration-fase2.sql

-- 1. CreateEnum — 17 categorie CdG (schema finflow, senza prefisso fin_)
CREATE TYPE "finflow"."cdg_category" AS ENUM ('REVENUE', 'VAR_COST_MATERIALS', 'VAR_COST_SERVICES', 'VAR_COST_DIRECT_LABOR', 'FIXED_COST_DEPRECIATION', 'FIXED_COST_ADMIN_COMPENSATION', 'FIXED_COST_RENT', 'FIXED_COST_UTILITIES', 'FIXED_COST_INSURANCE', 'FIXED_COST_CONSULTING', 'FIXED_COST_MARKETING', 'FIXED_COST_GENERAL', 'FINANCIAL_INCOME', 'FINANCIAL_EXPENSE', 'EXTRAORDINARY_INCOME', 'EXTRAORDINARY_EXPENSE', 'TAX_INCOME');

-- 2. AlterTable — is_frozen su 4 tabelle V1 (schema public)
ALTER TABLE "fin_invoice" ADD COLUMN     "is_frozen" BOOLEAN DEFAULT false;

ALTER TABLE "fin_recurring_expense" ADD COLUMN     "is_frozen" BOOLEAN DEFAULT false;

ALTER TABLE "fin_one_off_expense" ADD COLUMN     "is_frozen" BOOLEAN DEFAULT false;

ALTER TABLE "fin_bank_statement" ADD COLUMN     "is_frozen" BOOLEAN DEFAULT false;

-- 3. CreateTable — 3 nuove tabelle in schema finflow
CREATE TABLE "finflow"."trial_balance_snapshot" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_filename" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_balance_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finflow"."trial_balance_line" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cdg_category" "finflow"."cdg_category",

    CONSTRAINT "trial_balance_line_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finflow"."chart_of_accounts_mapping" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "cdg_category" "finflow"."cdg_category" NOT NULL,
    "is_vatable" BOOLEAN NOT NULL DEFAULT false,
    "vat_rate" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_mapping_pkey" PRIMARY KEY ("id")
);

-- 4. CreateIndex
CREATE INDEX "trial_balance_snapshot_organization_id_period_end_idx" ON "finflow"."trial_balance_snapshot"("organization_id", "period_end");

CREATE INDEX "trial_balance_line_snapshot_id_idx" ON "finflow"."trial_balance_line"("snapshot_id");

CREATE UNIQUE INDEX "chart_of_accounts_mapping_organization_id_account_code_key" ON "finflow"."chart_of_accounts_mapping"("organization_id", "account_code");

-- 5. AddForeignKey — cross-schema FK (finflow → public)
ALTER TABLE "finflow"."trial_balance_snapshot" ADD CONSTRAINT "trial_balance_snapshot_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "finflow"."trial_balance_snapshot" ADD CONSTRAINT "trial_balance_snapshot_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "fin_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finflow"."trial_balance_line" ADD CONSTRAINT "trial_balance_line_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "finflow"."trial_balance_snapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "finflow"."chart_of_accounts_mapping" ADD CONSTRAINT "chart_of_accounts_mapping_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
