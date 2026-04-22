import { z } from "zod";

/**
 * Zod schema for BankLayoutPatterns stored in PdfBankProfile.layoutPatterns.
 * Each field is a regex or config for extracting transaction data from bank PDF text.
 */
export const bankLayoutPatternsSchema = z.object({
  // Primary regex with named groups: date, valuta?, description, amount, balance?
  linePattern: z.string().min(1, "linePattern è obbligatorio"),
  // Regex for multi-line description continuation (null if single-line)
  continuationPattern: z.string().nullable().optional(),
  // Regexes for lines to skip (headers, footers, totals, blank lines)
  skipPatterns: z.array(z.string()).default([]),
  // Date format for parsing extracted date strings
  dateFormat: z.enum(["dd/MM/yyyy", "dd.MM.yyyy", "dd-MM-yyyy", "dd/MM/yy"]).default("dd/MM/yyyy"),
  // Decimal separator for amounts
  amountDecimal: z.enum([",", "."]).default(","),
  // Sign convention: "signed" = single signed amount, "separate_columns" = uscite/entrate
  signConvention: z.enum(["signed", "separate_columns"]).default("signed"),
});

export type BankLayoutPatterns = z.infer<typeof bankLayoutPatternsSchema>;

/** Zod schema for creating/updating a PdfBankProfile */
export const pdfBankProfileCreateSchema = z.object({
  bankName: z.string().min(1, "Nome banca obbligatorio").max(100),
  layoutPatterns: bankLayoutPatternsSchema,
  notes: z.string().max(500).optional(),
});

export const pdfBankProfileUpdateSchema = pdfBankProfileCreateSchema.partial();
