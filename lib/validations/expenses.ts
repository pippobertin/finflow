import { z } from "zod";

const expenseCategories = [
  "RENT",
  "UTILITIES",
  "SALARIES",
  "SOFTWARE",
  "HARDWARE",
  "INSURANCE",
  "TAXES",
  "CONSULTING",
  "MARKETING",
  "TRAVEL",
  "TRAINING",
  "OTHER",
] as const;

const expenseFrequencies = ["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"] as const;

export const recurringExpenseCreateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(200),
  category: z.enum(expenseCategories),
  frequency: z.enum(expenseFrequencies),
  amount: z.coerce.number().positive("L'importo deve essere positivo"),
  vatIncluded: z.boolean().default(true),
  costCenterId: z.string().cuid().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  dayOfMonth: z.coerce.number().int().min(1).max(31).optional().nullable(),
  customDays: z.coerce.number().int().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  counterpart: z.string().max(200).optional().nullable(),
});

export const recurringExpenseUpdateSchema = recurringExpenseCreateSchema.partial();

export const oneOffExpenseCreateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(200),
  category: z.enum(expenseCategories),
  amount: z.coerce.number().positive("L'importo deve essere positivo"),
  vatIncluded: z.boolean().default(true),
  costCenterId: z.string().cuid().optional().nullable(),
  date: z.coerce.date(),
  isPaid: z.boolean().default(false),
  paidAt: z.coerce.date().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  counterpart: z.string().max(200).optional().nullable(),
});

export const oneOffExpenseUpdateSchema = oneOffExpenseCreateSchema.partial();

export type RecurringExpenseCreateInput = z.infer<typeof recurringExpenseCreateSchema>;
export type RecurringExpenseUpdateInput = z.infer<typeof recurringExpenseUpdateSchema>;
export type OneOffExpenseCreateInput = z.infer<typeof oneOffExpenseCreateSchema>;
export type OneOffExpenseUpdateInput = z.infer<typeof oneOffExpenseUpdateSchema>;
