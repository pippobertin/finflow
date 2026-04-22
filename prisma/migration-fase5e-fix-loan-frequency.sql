-- Fase 5.E7: Fix LoanFrequency enum name mismatch
-- Migration created finflow.loan_frequency but Prisma expects finflow."LoanFrequency"
-- Also fix SEMI_ANNUAL value (if any rows exist) to SEMIANNUAL

-- Step 1: Remove the column's default and type dependency
ALTER TABLE finflow.loan_schedule
  ALTER COLUMN frequency DROP DEFAULT,
  ALTER COLUMN frequency TYPE TEXT;

-- Step 2: Fix any SEMI_ANNUAL values to SEMIANNUAL
UPDATE finflow.loan_schedule SET frequency = 'SEMIANNUAL' WHERE frequency = 'SEMI_ANNUAL';

-- Step 3: Drop the old snake_case enum type
DROP TYPE IF EXISTS finflow.loan_frequency;

-- Step 4: Create the new PascalCase enum type (as Prisma expects)
CREATE TYPE finflow."LoanFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- Step 5: Re-apply the correct type and default
ALTER TABLE finflow.loan_schedule
  ALTER COLUMN frequency TYPE finflow."LoanFrequency" USING frequency::finflow."LoanFrequency",
  ALTER COLUMN frequency SET DEFAULT 'MONTHLY';
