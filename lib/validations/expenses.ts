import { z } from "zod";

// Transforms empty strings to null (HTML form inputs send "" for empty optional fields)
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

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
  costCenterId: emptyToNull(z.string().cuid().nullable()).optional(),
  startDate: z.coerce.date(),
  endDate: emptyToNull(z.coerce.date().nullable()).optional(),
  dayOfMonth: emptyToNull(z.coerce.number().int().min(1).max(31).nullable()).optional(),
  customDays: emptyToNull(z.coerce.number().int().positive().nullable()).optional(),
  description: emptyToNull(z.string().max(500).nullable()).optional(),
  counterpart: emptyToNull(z.string().max(200).nullable()).optional(),
});

export const recurringExpenseUpdateSchema = recurringExpenseCreateSchema.partial();

export const oneOffExpenseCreateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(200),
  category: z.enum(expenseCategories),
  amount: z.coerce.number().positive("L'importo deve essere positivo"),
  vatIncluded: z.boolean().default(true),
  costCenterId: emptyToNull(z.string().cuid().nullable()).optional(),
  date: z.coerce.date(),
  isPaid: z.boolean().default(false),
  paidAt: emptyToNull(z.coerce.date().nullable()).optional(),
  description: emptyToNull(z.string().max(500).nullable()).optional(),
  counterpart: emptyToNull(z.string().max(200).nullable()).optional(),
});

export const oneOffExpenseUpdateSchema = oneOffExpenseCreateSchema.partial();

export const expenseBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "Seleziona almeno una spesa"),
});

export type RecurringExpenseCreateInput = z.infer<typeof recurringExpenseCreateSchema>;
export type RecurringExpenseUpdateInput = z.infer<typeof recurringExpenseUpdateSchema>;
export type OneOffExpenseCreateInput = z.infer<typeof oneOffExpenseCreateSchema>;
export type OneOffExpenseUpdateInput = z.infer<typeof oneOffExpenseUpdateSchema>;
