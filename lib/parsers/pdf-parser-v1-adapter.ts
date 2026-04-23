/**
 * Adapter: converts V1 pdf-parser output (Data/Descrizione/Uscite/Entrate)
 * to the display format expected by the Test Pattern dialog.
 *
 * The V1 parser (pdf-parser.ts) returns {headers, rows: Record<string,string>[], ecMetadata}.
 * This adapter converts to {rows: DisplayRow[], warnings, stats} for the UI.
 */
import type { PdfParseResult } from "@/lib/parsers/pdf-parser";

/** Max plausible transaction amount for a PMI (10 million EUR) */
const MAX_AMOUNT = 10_000_000;

export interface V1DisplayRow {
  date: string;
  valuta?: string;
  description: string;
  amount: number;
  balance?: number;
}

export interface V1AdapterResult {
  rows: V1DisplayRow[];
  warnings: string[];
  totalRows: number;
  ecMetadata: PdfParseResult["ecMetadata"];
}

function parseItalianAmount(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num !== 0 ? num : null;
}

/**
 * Convert V1 parser output to display rows with signed amounts.
 * - Entrate > 0 → positive amount (incoming)
 * - Uscite > 0 → negative amount (outgoing)
 * - Both present → warning, skip row
 * - |amount| > 10M → warning, skip row
 */
export function adaptV1ToDisplay(result: PdfParseResult): V1AdapterResult {
  const warnings: string[] = [];
  const rows: V1DisplayRow[] = [];

  for (const row of result.rows) {
    const date = row["Data"] ?? "";
    const valuta = row["Valuta"] || undefined;
    const description = row["Descrizione"] ?? "";
    const rawUscite = row["Uscite"] ?? "";
    const rawEntrate = row["Entrate"] ?? "";

    const uscite = parseItalianAmount(rawUscite);
    const entrate = parseItalianAmount(rawEntrate);

    let amount: number;

    if (entrate != null && uscite != null) {
      // Both columns have values — use net (entrate - uscite)
      warnings.push(
        `Riga con sia Uscite (${rawUscite}) che Entrate (${rawEntrate}): "${description.slice(0, 60)}"`,
      );
      amount = entrate - uscite;
    } else if (entrate != null) {
      amount = entrate;
    } else if (uscite != null) {
      amount = -uscite;
    } else {
      warnings.push(`Riga senza importo: "${description.slice(0, 60)}"`);
      continue;
    }

    // MAX_AMOUNT safety guard
    if (Math.abs(amount) > MAX_AMOUNT) {
      warnings.push(
        `Transazione scartata, amount anomalo: ${amount} EUR su "${description.slice(0, 80)}"`,
      );
      continue;
    }

    rows.push({ date, valuta, description, amount });
  }

  return {
    rows,
    warnings,
    totalRows: rows.length,
    ecMetadata: result.ecMetadata,
  };
}
