import * as XLSX from "xlsx";

// ─── Types ──────────────────────────────────────────────────

export interface ParsedTrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ParsedTrialBalance {
  rows: ParsedTrialBalanceRow[];
  totals: { debit: number; credit: number; balance: number };
  sheetName: string;
  warnings: ParseWarning[];
  errors: ParseError[];
}

export interface ParseWarning {
  row?: number;
  message: string;
}

export interface ParseError {
  row?: number;
  message: string;
}

// ─── Constants ──────────────────────────────────────────────

const DEFAULT_SHEET_NAME = "1-BV";
const ACCOUNT_CODE_REGEX = /^\d{2}\.\d{2}\.\d{2}$/;

// ─── Parser ─────────────────────────────────────────────────

/**
 * Parse a trial balance (bilancio di verifica) Excel file.
 *
 * Expected columns:
 * - A: account code (e.g. "55.01.19")
 * - C: description
 * - D: Dare (debit)
 * - E: Avere (credit)
 *
 * Columns B, F-J are ignored.
 */
export function parseTrialBalanceExcel(
  buffer: Buffer,
  options?: { sheetName?: string },
): ParsedTrialBalance {
  const sheetName = options?.sheetName ?? DEFAULT_SHEET_NAME;
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return {
      rows: [],
      totals: { debit: 0, credit: 0, balance: 0 },
      sheetName,
      warnings,
      errors: [{ message: "Impossibile leggere il file Excel" }],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      rows: [],
      totals: { debit: 0, credit: 0, balance: 0 },
      sheetName,
      warnings,
      errors: [
        {
          message: `Foglio "${sheetName}" non trovato. Fogli disponibili: ${workbook.SheetNames.join(", ")}`,
        },
      ],
    };
  }

  // Read as array of arrays (no headers)
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    rawNumbers: true,
  });

  const rows: ParsedTrialBalanceRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const rawCode = String(row[0] ?? "").trim();

    // Skip non-data rows (headers, empty, totals)
    if (!rawCode || !ACCOUNT_CODE_REGEX.test(rawCode)) continue;

    const accountCode = rawCode;
    const accountName = String(row[2] ?? "").trim();
    const debit = parseAmount(row[3]);
    const credit = parseAmount(row[4]);

    if (debit === null && credit === null) {
      warnings.push({
        row: i + 1,
        message: `Riga ${i + 1}: conto ${accountCode} senza importo Dare ne' Avere, ignorata`,
      });
      continue;
    }

    const d = debit ?? 0;
    const c = credit ?? 0;
    const balance = d - c;

    if (!accountName) {
      warnings.push({
        row: i + 1,
        message: `Riga ${i + 1}: conto ${accountCode} senza descrizione`,
      });
    }

    rows.push({ accountCode, accountName, debit: d, credit: c, balance });
    totalDebit += d;
    totalCredit += c;
  }

  if (rows.length === 0) {
    errors.push({
      message:
        "Nessuna riga valida trovata. Verificare che il foglio contenga conti nel formato XX.XX.XX in colonna A.",
    });
  }

  return {
    rows,
    totals: {
      debit: round2(totalDebit),
      credit: round2(totalCredit),
      balance: round2(totalDebit - totalCredit),
    },
    sheetName,
    warnings,
    errors,
  };
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Parse a cell value as a numeric amount.
 * Handles: numbers, strings with space as thousands separator,
 * Italian format "1.234,56", and formula results.
 */
function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    let cleaned = value.trim();
    if (!cleaned) return null;

    // Remove spaces (thousands separator)
    cleaned = cleaned.replace(/\s/g, "");

    // Italian format: 1.234,56 → 1234.56
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }

    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
