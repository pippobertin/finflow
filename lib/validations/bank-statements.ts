import { z } from "zod";

export const bankStatementReassignSchema = z.object({
  costCenterId: z.string().cuid().nullable(),
});

export type BankStatementReassignInput = z.infer<typeof bankStatementReassignSchema>;

// CdgCategory values (mirrors the Prisma enum in finflow schema)
export const CDG_CATEGORIES = [
  "REVENUE",
  "VAR_COST_MATERIALS",
  "VAR_COST_SERVICES",
  "VAR_COST_DIRECT_LABOR",
  "FIXED_COST_DEPRECIATION",
  "FIXED_COST_ADMIN_COMPENSATION",
  "FIXED_COST_RENT",
  "FIXED_COST_UTILITIES",
  "FIXED_COST_INSURANCE",
  "FIXED_COST_CONSULTING",
  "FIXED_COST_MARKETING",
  "FIXED_COST_GENERAL",
  "FINANCIAL_INCOME",
  "FINANCIAL_EXPENSE",
  "EXTRAORDINARY_INCOME",
  "EXTRAORDINARY_EXPENSE",
  "TAX_INCOME",
] as const;

export type CdgCategoryValue = (typeof CDG_CATEGORIES)[number];

const cdgCategoryEnum = z.enum(CDG_CATEGORIES);

export const bankStatementCategorizeSchema = z.object({
  cdgCategory: cdgCategoryEnum,
});

export type BankStatementCategorizeInput = z.infer<typeof bankStatementCategorizeSchema>;

export const bankStatementBulkCategorizeSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(500),
  cdgCategory: cdgCategoryEnum,
});

export type BankStatementBulkCategorizeInput = z.infer<typeof bankStatementBulkCategorizeSchema>;
