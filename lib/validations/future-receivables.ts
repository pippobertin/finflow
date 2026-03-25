import { z } from "zod";

const receivableStatuses = ["PENDING", "INVOICED", "CANCELLED"] as const;

// Transforms empty strings to null (HTML form inputs send "" for empty optional fields)
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

const futureReceivableBaseFields = {
  description: z.string().min(1, "La descrizione è obbligatoria").max(500),
  counterpart: z.string().min(1, "Il cliente è obbligatorio").max(200),
  estimatedAmount: z.coerce.number().positive("L'importo deve essere positivo"),
  expectedInvoiceDate: emptyToNull(z.coerce.date().nullable()).optional(),
  expectedPaymentDate: emptyToNull(z.coerce.date().nullable()).optional(),
  costCenterId: emptyToNull(z.string().cuid().nullable()).optional(),
  notes: emptyToNull(z.string().max(1000).nullable()).optional(),
  includeInForecast: z.boolean().default(true),
};

export const futureReceivableCreateSchema = z
  .object(futureReceivableBaseFields)
  .refine((d) => d.expectedInvoiceDate || d.expectedPaymentDate, {
    message: "Inserisci almeno una data (fattura o incasso)",
    path: ["expectedPaymentDate"],
  });

export const futureReceivableUpdateSchema = z
  .object(futureReceivableBaseFields)
  .partial()
  .extend({
    status: z.enum(receivableStatuses).optional(),
    invoiceId: emptyToNull(z.string().cuid().nullable()).optional(),
  });

export const futureReceivableBulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, "Seleziona almeno un incasso"),
});

export type FutureReceivableCreateInput = z.infer<typeof futureReceivableCreateSchema>;
export type FutureReceivableUpdateInput = z.infer<typeof futureReceivableUpdateSchema>;
