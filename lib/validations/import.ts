import { z } from "zod";

export const csvColumnMappingSchema = z.object({
  number: z.string().min(1, "Colonna numero obbligatoria"),
  date: z.string().min(1, "Colonna data obbligatoria"),
  counterpart: z.string().min(1, "Colonna controparte obbligatoria"),
  description: z.string().optional(),
  netAmount: z.string().min(1, "Colonna importo netto obbligatoria"),
  vatAmount: z.string().optional(),
  grossAmount: z.string().optional(),
  vatNumber: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
});

export const csvImportSchema = z.object({
  direction: z.enum(["ACTIVE", "PASSIVE"]),
  mapping: csvColumnMappingSchema,
  dateFormat: z.string().default("dd/MM/yyyy"),
  decimalSeparator: z.enum([",", "."]).default(","),
  skipRows: z.coerce.number().int().min(0).default(0),
});

export type CsvColumnMapping = z.infer<typeof csvColumnMappingSchema>;
export type CsvImportInput = z.infer<typeof csvImportSchema>;
