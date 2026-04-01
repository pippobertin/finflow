import { z } from "zod";

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

const frequencies = ["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"] as const;
const categories = [
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
const payableStatuses = ["ACTIVE", "EXHAUSTED", "CANCELLED"] as const;

const baseFields = {
  description: z.string().min(1, "La descrizione è obbligatoria").max(500),
  counterpart: z.string().min(1, "La controparte è obbligatoria").max(200),
  amount: z.coerce.number().positive("L'importo deve essere positivo"),
  frequency: z.enum(frequencies).default("MONTHLY"),
  dayOfMonth: emptyToNull(z.coerce.number().min(1).max(31).nullable()).optional(),
  startDate: z.coerce.date(),
  endDate: emptyToNull(z.coerce.date().nullable()).optional(),
  costCenterId: emptyToNull(z.string().cuid().nullable()).optional(),
  category: z.enum(categories).default("CONSULTING"),
  notes: emptyToNull(z.string().max(1000).nullable()).optional(),
  includeInForecast: z.boolean().default(true),
};

export const expectedPayableCreateSchema = z.object(baseFields);

export const expectedPayableUpdateSchema = z
  .object(baseFields)
  .partial()
  .extend({
    status: z.enum(payableStatuses).optional(),
  });

export const expectedPayableBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "Seleziona almeno un elemento"),
});

export type ExpectedPayableCreateInput = z.infer<typeof expectedPayableCreateSchema>;
export type ExpectedPayableUpdateInput = z.infer<typeof expectedPayableUpdateSchema>;
