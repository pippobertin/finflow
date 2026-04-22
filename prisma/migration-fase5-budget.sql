-- Phase 5 Block A: MonthlyBudget table
-- Run: npx prisma db execute --stdin < prisma/migration-fase5-budget.sql

CREATE TABLE IF NOT EXISTS "finflow"."monthly_budget" (
  "id"              TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "year"            INTEGER NOT NULL,
  "month"           INTEGER NOT NULL,
  "cdg_category"    "finflow"."cdg_category" NOT NULL,
  "amount"          DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes"           TEXT,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "monthly_budget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monthly_budget_organization_id_fkey"
    FOREIGN KEY ("organization_id")
    REFERENCES "public"."fin_organization"("id")
    ON DELETE CASCADE
);

-- Unique: one budget value per (org, year, month, category)
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_budget_org_year_month_cat_key"
  ON "finflow"."monthly_budget" ("organization_id", "year", "month", "cdg_category");

-- Fast lookup by org + year
CREATE INDEX IF NOT EXISTS "monthly_budget_org_year_idx"
  ON "finflow"."monthly_budget" ("organization_id", "year");
