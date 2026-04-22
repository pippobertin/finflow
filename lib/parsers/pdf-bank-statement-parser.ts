/**
 * Profile-based PDF bank statement parser.
 *
 * Uses configurable BankLayoutPatterns (stored in PdfBankProfile) to extract
 * transaction rows from Italian bank PDF statements. Each bank has different
 * layout conventions — this parser applies bank-specific regex patterns
 * rather than the generic heuristic approach in pdf-parser.ts.
 *
 * Supports only text-based PDFs (not scanned/OCR).
 */
import { PDFParse } from "pdf-parse";
import type { BankLayoutPatterns } from "@/lib/validations/pdf-bank-profile";

// ─── Public interfaces ──────────────────────────────────────

export interface ParsedBankRow {
  date: string;
  valuta?: string;
  description: string;
  amount: number;
  balance?: number;
}

export interface PdfBankParseResult {
  rows: ParsedBankRow[];
  warnings: string[];
  rawTextPreview: string;
  totalLines: number;
  matchedLines: number;
  skippedLines: number;
}

// ─── Amount parsing ─────────────────────────────────────────

function parseAmount(raw: string, decimal: "," | "."): number | null {
  if (!raw) return null;
  let cleaned = raw.trim();

  if (decimal === ",") {
    // Italian: 1.234,56 → 1234.56
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Standard: 1,234.56 → 1234.56
    cleaned = cleaned.replace(/,/g, "");
  }

  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

// ─── Date normalization ─────────────────────────────────────

/**
 * Normalize date string to ISO-like format for downstream parsing.
 * We don't fully parse here — we return the raw string and let the
 * import connector handle date parsing with its flexible parseDate().
 */
function normalizeDate(raw: string, format: string): string {
  const trimmed = raw.trim();
  // If 2-digit year (dd/MM/yy), expand to 4-digit
  if (format.endsWith("yy") && !format.endsWith("yyyy")) {
    const match = trimmed.match(/^(\d{2})(.)(\d{2})\2(\d{2})$/);
    if (match) {
      const year = parseInt(match[4], 10);
      const fullYear = year >= 50 ? 1900 + year : 2000 + year;
      return `${match[1]}${match[2]}${match[3]}${match[2]}${fullYear}`;
    }
  }
  return trimmed;
}

// ─── Core parser ────────────────────────────────────────────

export async function parsePdfWithProfile(
  buffer: Buffer,
  patterns: BankLayoutPatterns,
): Promise<PdfBankParseResult> {
  const warnings: string[] = [];

  // 1. Extract text from PDF
  let fullText: string;
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    fullText = textResult.text;
    await parser.destroy();
  } catch (err) {
    return {
      rows: [],
      warnings: [`Errore lettura PDF: ${err instanceof Error ? err.message : "sconosciuto"}`],
      rawTextPreview: "",
      totalLines: 0,
      matchedLines: 0,
      skippedLines: 0,
    };
  }

  if (!fullText || fullText.trim().length === 0) {
    return {
      rows: [],
      warnings: ["Il PDF non contiene testo estraibile (potrebbe essere scansionato)."],
      rawTextPreview: "",
      totalLines: 0,
      matchedLines: 0,
      skippedLines: 0,
    };
  }

  const rawTextPreview = fullText.slice(0, 500);
  const lines = fullText.split("\n");
  const totalLines = lines.length;

  // 2. Compile regex patterns
  let lineRegex: RegExp;
  try {
    lineRegex = new RegExp(patterns.linePattern);
  } catch (err) {
    return {
      rows: [],
      warnings: [`Regex linePattern non valido: ${err instanceof Error ? err.message : "errore"}`],
      rawTextPreview,
      totalLines,
      matchedLines: 0,
      skippedLines: 0,
    };
  }

  const skipRegexes: RegExp[] = [];
  for (const sp of patterns.skipPatterns) {
    try {
      skipRegexes.push(new RegExp(sp));
    } catch {
      warnings.push(`Skip pattern non valido, ignorato: ${sp}`);
    }
  }

  let continuationRegex: RegExp | null = null;
  if (patterns.continuationPattern) {
    try {
      continuationRegex = new RegExp(patterns.continuationPattern);
    } catch {
      warnings.push("continuationPattern non valido, ignorato");
    }
  }

  // 3. Process lines
  const rows: ParsedBankRow[] = [];
  let currentRow: ParsedBankRow | null = null;
  let matchedLines = 0;
  let skippedLines = 0;

  for (const line of lines) {
    // Skip blank or matching skip patterns
    if (skipRegexes.some((re) => re.test(line))) {
      skippedLines++;
      continue;
    }

    // Try main line pattern
    const match = lineRegex.exec(line);
    if (match?.groups) {
      // Flush previous row
      if (currentRow) {
        rows.push(currentRow);
      }

      const dateRaw = match.groups.date;
      const valutaRaw = match.groups.valuta;
      const descRaw = match.groups.description?.trim() ?? "";
      const amountRaw = match.groups.amount;
      const balanceRaw = match.groups.balance;

      const amount = parseAmount(amountRaw, patterns.amountDecimal);
      if (amount === null) {
        warnings.push(`Importo non valido alla riga: "${line.trim().slice(0, 80)}"`);
        currentRow = null;
        continue;
      }

      currentRow = {
        date: normalizeDate(dateRaw, patterns.dateFormat),
        ...(valutaRaw ? { valuta: normalizeDate(valutaRaw, patterns.dateFormat) } : {}),
        description: descRaw,
        amount,
        ...(balanceRaw
          ? { balance: parseAmount(balanceRaw, patterns.amountDecimal) ?? undefined }
          : {}),
      };
      matchedLines++;
      continue;
    }

    // Try continuation pattern (append to current row description)
    if (continuationRegex && currentRow) {
      const contMatch = continuationRegex.exec(line);
      if (contMatch?.groups?.text) {
        currentRow.description += " " + contMatch.groups.text.trim();
        continue;
      }
    }

    // Unmatched non-empty line (don't warn for very short lines — likely whitespace)
    if (line.trim().length > 3) {
      // Only count as potentially interesting if it has digits (could be a missed transaction)
      if (/\d/.test(line)) {
        skippedLines++;
      }
    }
  }

  // Flush last row
  if (currentRow) {
    rows.push(currentRow);
  }

  // 4. Quality warnings
  if (rows.length === 0 && totalLines > 10) {
    warnings.push(
      `Nessuna transazione trovata su ${totalLines} righe. Il pattern potrebbe non corrispondere al formato di questa banca.`,
    );
  } else if (matchedLines < totalLines * 0.05 && totalLines > 20) {
    warnings.push(
      `Solo ${matchedLines} transazioni trovate su ${totalLines} righe (${Math.round((matchedLines / totalLines) * 100)}%). Verifica il pattern.`,
    );
  }

  return {
    rows,
    warnings,
    rawTextPreview,
    totalLines,
    matchedLines,
    skippedLines,
  };
}
