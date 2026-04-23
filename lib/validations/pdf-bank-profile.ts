import { z } from "zod";

/**
 * Zod schema for BankLayoutPatterns stored in PdfBankProfile.layoutPatterns.
 *
 * V2: State-machine parser fields.
 * - sectionStartMarker / sectionEndMarker delimit the transaction area
 * - startTransactionPattern detects the first line of a multi-line transaction
 * - amountLinePattern detects the amount line (last line of a multi-line tx)
 * - singleLinePattern matches transactions that fit on a single line
 * - signHints determines sign from description keywords (replaces signConvention)
 */

const signHintsSchema = z.object({
  /** Keywords in description that indicate an incoming (positive) amount */
  incoming: z.array(z.string()),
  /** Keywords in description that indicate an outgoing (negative) amount */
  outgoing: z.array(z.string()),
  /** Default sign when no keyword matches */
  defaultSign: z.enum(["positive", "negative"]).default("negative"),
});

export const bankLayoutPatternsSchema = z.object({
  // ─── Section delimiters (optional — if null, entire text is one section) ───
  sectionStartMarker: z.string().nullable().optional(),
  sectionEndMarker: z.string().nullable().optional(),

  // ─── Transaction patterns ─────────────────────────────────────────────────
  /** Regex with named groups: date, valuta?, description? — first line of a multi-line tx */
  startTransactionPattern: z.string().min(1, "startTransactionPattern è obbligatorio"),
  /** Regex with named groups: amount, balance? — amount line (last line of multi-line tx) */
  amountLinePattern: z.string().min(1, "amountLinePattern è obbligatorio"),
  /** Regex with all named groups (date, description, amount, valuta?, balance?) for single-line txs */
  singleLinePattern: z.string().nullable().optional(),

  // ─── Sign determination ───────────────────────────────────────────────────
  signHints: signHintsSchema,

  // ─── Format config ────────────────────────────────────────────────────────
  dateFormat: z
    .enum(["dd/MM/yyyy", "dd.MM.yyyy", "dd-MM-yyyy", "dd/MM/yy", "dd.MM.yy"])
    .default("dd/MM/yyyy"),
  amountDecimal: z.enum([",", "."]).default(","),
  /** Regexes for lines to skip (headers, footers, blank lines) */
  skipPatterns: z.array(z.string()).default([]),
});

export type BankLayoutPatterns = z.infer<typeof bankLayoutPatternsSchema>;

/** Zod schema for creating/updating a PdfBankProfile */
export const pdfBankProfileCreateSchema = z.object({
  bankName: z.string().min(1, "Nome banca obbligatorio").max(100),
  layoutPatterns: bankLayoutPatternsSchema,
  notes: z.string().max(500).optional(),
});

export const pdfBankProfileUpdateSchema = pdfBankProfileCreateSchema.partial();
