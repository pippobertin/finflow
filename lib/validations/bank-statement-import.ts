import { z } from "zod";

export const bankStatementMappingSchema = z
  .object({
    date: z.string().min(1, "Colonna data obbligatoria"),
    description: z.string().min(1, "Colonna descrizione obbligatoria"),
    // Single signed amount column — OR uscite+entrate
    amount: z.string().optional(),
    uscite: z.string().optional(),
    entrate: z.string().optional(),
    // Balance and extras are optional
    balance: z.string().optional(),
    reference: z.string().optional(),
    valuta: z.string().optional(),
  })
  .refine((data) => data.amount || (data.uscite && data.entrate), {
    message: "Serve la colonna 'Importo' oppure entrambe 'Uscite' e 'Entrate'",
  });

export const bankStatementImportSchema = z.object({
  mapping: bankStatementMappingSchema,
  dateFormat: z.string().default("dd/MM/yyyy"),
  decimalSeparator: z.enum([",", "."]).default(","),
  skipRows: z.number().int().min(0).default(0),
});

export const reconciliationConfirmSchema = z.object({
  matches: z.array(
    z.object({
      bankStatementId: z.string().min(1),
      invoiceId: z.string().min(1),
      accepted: z.boolean(),
    }),
  ),
});

export type BankStatementMapping = z.infer<typeof bankStatementMappingSchema>;
export type BankStatementImportInput = z.infer<typeof bankStatementImportSchema>;
export type ReconciliationConfirmInput = z.infer<typeof reconciliationConfirmSchema>;
