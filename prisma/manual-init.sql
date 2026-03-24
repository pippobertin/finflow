-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "fin_user_role" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "fin_connector_type" AS ENUM ('FATTURE_IN_CLOUD', 'CSV_IMPORT', 'MANUAL');

-- CreateEnum
CREATE TYPE "fin_cost_center_type" AS ENUM ('COST', 'REVENUE');

-- CreateEnum
CREATE TYPE "fin_invoice_direction" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateEnum
CREATE TYPE "fin_invoice_status" AS ENUM ('PAID', 'PENDING', 'OVERDUE', 'DRAFT');

-- CreateEnum
CREATE TYPE "fin_expense_frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "fin_expense_category" AS ENUM ('RENT', 'UTILITIES', 'SALARIES', 'SOFTWARE', 'HARDWARE', 'INSURANCE', 'TAXES', 'CONSULTING', 'MARKETING', 'TRAVEL', 'TRAINING', 'OTHER');

-- CreateTable
CREATE TABLE "fin_organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vat_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "zip_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT,
    "role" "fin_user_role" NOT NULL DEFAULT 'VIEWER',
    "organization_id" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "fin_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_session" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "fin_connector" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "fin_connector_type" NOT NULL,
    "name" TEXT NOT NULL,
    "encrypted_config" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_connector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_cost_center" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "fin_cost_center_type" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_cost_center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_invoice" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "direction" "fin_invoice_direction" NOT NULL,
    "status" "fin_invoice_status" NOT NULL DEFAULT 'PENDING',
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "counterpart" TEXT NOT NULL,
    "vat_number" TEXT,
    "description" TEXT,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "vat_amount" DECIMAL(12,2) NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "cost_center_id" TEXT,
    "needs_tagging" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "connector_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_invoice_line" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "cost_center_id" TEXT,

    CONSTRAINT "fin_invoice_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_recurring_expense" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "fin_expense_category" NOT NULL,
    "frequency" "fin_expense_frequency" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "vat_included" BOOLEAN NOT NULL DEFAULT true,
    "cost_center_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "day_of_month" INTEGER,
    "custom_days" INTEGER,
    "description" TEXT,
    "counterpart" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_recurring_expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_one_off_expense" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "fin_expense_category" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "vat_included" BOOLEAN NOT NULL DEFAULT true,
    "cost_center_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "description" TEXT,
    "counterpart" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_one_off_expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_bank_statement" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "cost_center_id" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_bank_statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_cashflow_snapshot" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inflows" DECIMAL(12,2) NOT NULL,
    "outflows" DECIMAL(12,2) NOT NULL,
    "net_flow" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fin_cashflow_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_forecast_scenario" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "results" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_forecast_scenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fin_user_email_key" ON "fin_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fin_account_provider_provider_account_id_key" ON "fin_account"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "fin_session_session_token_key" ON "fin_session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "fin_verification_token_token_key" ON "fin_verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "fin_verification_token_identifier_token_key" ON "fin_verification_token"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "fin_cost_center_organization_id_name_key" ON "fin_cost_center"("organization_id", "name");

-- CreateIndex
CREATE INDEX "fin_invoice_organization_id_direction_idx" ON "fin_invoice"("organization_id", "direction");

-- CreateIndex
CREATE INDEX "fin_invoice_organization_id_status_idx" ON "fin_invoice"("organization_id", "status");

-- CreateIndex
CREATE INDEX "fin_invoice_organization_id_date_idx" ON "fin_invoice"("organization_id", "date");

-- CreateIndex
CREATE INDEX "fin_bank_statement_organization_id_date_idx" ON "fin_bank_statement"("organization_id", "date");

-- CreateIndex
CREATE INDEX "fin_cashflow_snapshot_organization_id_date_idx" ON "fin_cashflow_snapshot"("organization_id", "date");

-- AddForeignKey
ALTER TABLE "fin_user" ADD CONSTRAINT "fin_user_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_account" ADD CONSTRAINT "fin_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "fin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_session" ADD CONSTRAINT "fin_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "fin_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_connector" ADD CONSTRAINT "fin_connector_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_cost_center" ADD CONSTRAINT "fin_cost_center_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_invoice" ADD CONSTRAINT "fin_invoice_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_invoice" ADD CONSTRAINT "fin_invoice_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "fin_cost_center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_invoice_line" ADD CONSTRAINT "fin_invoice_line_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "fin_invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_invoice_line" ADD CONSTRAINT "fin_invoice_line_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "fin_cost_center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_recurring_expense" ADD CONSTRAINT "fin_recurring_expense_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_recurring_expense" ADD CONSTRAINT "fin_recurring_expense_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "fin_cost_center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_one_off_expense" ADD CONSTRAINT "fin_one_off_expense_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_one_off_expense" ADD CONSTRAINT "fin_one_off_expense_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "fin_cost_center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_bank_statement" ADD CONSTRAINT "fin_bank_statement_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_bank_statement" ADD CONSTRAINT "fin_bank_statement_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "fin_cost_center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_cashflow_snapshot" ADD CONSTRAINT "fin_cashflow_snapshot_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_forecast_scenario" ADD CONSTRAINT "fin_forecast_scenario_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "fin_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
