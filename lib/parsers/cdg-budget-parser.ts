import * as XLSX from "xlsx";

// ─── Types ──────────────────────────────────────────────────

export interface ParsedBudgetRow {
  cdgCategory: string; // CdgCategory enum value
  month: number; // 1-12
  amount: number;
}

export interface ParsedBudget {
  rows: ParsedBudgetRow[];
  year: number | null;
  sheetName: string;
  /** Categories found and matched */
  matchedCategories: string[];
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

// ─── CDG Code → CdgCategory mapping ────────────────────────

/** Maps CDG model numeric codes to CdgCategory enum values */
const CODE_TO_CATEGORY: Record<number, string> = {
  100: "REVENUE",
  200: "VAR_COST_MATERIALS",
  205: "VAR_COST_MATERIALS", // Var. Rimanenze MP
  215: "VAR_COST_MATERIALS", // Var. Rimanenze Semilavorati
  225: "VAR_COST_SERVICES", // Lavorazioni terzi
  230: "VAR_COST_DIRECT_LABOR",
  235: "VAR_COST_SERVICES", // Provvigioni
  240: "VAR_COST_SERVICES", // Altri costi variabili
  400: "FIXED_COST_DEPRECIATION",
  405: "FIXED_COST_DEPRECIATION", // Leasing
  408: "FIXED_COST_GENERAL", // Accantonamenti
  410: "VAR_COST_DIRECT_LABOR", // Mano d'opera indiretta
  411: "FIXED_COST_ADMIN_COMPENSATION",
  415: "FIXED_COST_GENERAL", // Costi generali industriali
  416: "FIXED_COST_CONSULTING", // Consulenze tecniche
  430: "FIXED_COST_GENERAL", // Manutenzioni
  435: "FIXED_COST_MARKETING", // Costi commerciali
  436: "FIXED_COST_MARKETING", // Fiere
  445: "FIXED_COST_MARKETING", // Pubblicità
  455: "FIXED_COST_GENERAL", // Costi generali amministrativi
  465: "FIXED_COST_CONSULTING", // Consulenze amministrative
  475: "FIXED_COST_GENERAL", // Costi generali vari
  476: "FIXED_COST_UTILITIES", // Spese telefoniche/Internet
  477: "FIXED_COST_CONSULTING", // Consulenze generali/informatiche
  478: "FIXED_COST_GENERAL", // Mensa e costi personale
  479: "FIXED_COST_INSURANCE",
  480: "FIXED_COST_GENERAL", // Tasse
  481: "FINANCIAL_EXPENSE", // Spese bancarie
  482: "FIXED_COST_RENT",
  490: "FIXED_COST_GENERAL", // Spese automezzi
  500: "FINANCIAL_EXPENSE", // Gestione finanziaria (sign-based below)
  600: "EXTRAORDINARY_EXPENSE", // Gestione accessoria (sign-based below)
  700: "EXTRAORDINARY_EXPENSE", // Gestione straordinaria (sign-based below)
  800: "TAX_INCOME",
};

/** Codes where sign determines income vs expense */
const SIGN_SENSITIVE_CODES: Record<number, { positive: string; negative: string }> = {
  500: { positive: "FINANCIAL_INCOME", negative: "FINANCIAL_EXPENSE" },
  600: { positive: "EXTRAORDINARY_INCOME", negative: "EXTRAORDINARY_EXPENSE" },
  700: { positive: "EXTRAORDINARY_INCOME", negative: "EXTRAORDINARY_EXPENSE" },
};

/** Subtotal abbreviations to skip */
const SKIP_ABBREVIATIONS = new Set([
  "CV",
  "MC1",
  "MC2",
  "CF",
  "RO",
  "RNp",
  "RN",
  "VP",
  "RIN",
  "VA",
  "MOL",
]);

/** Label-based fuzzy matching for the 12-column format */
const LABEL_TO_CATEGORY: Record<string, string> = {
  ricavi: "REVENUE",
  "ricavi netti": "REVENUE",
  fatturato: "REVENUE",
  "ricavi di vendita": "REVENUE",
  "materie prime": "VAR_COST_MATERIALS",
  materiali: "VAR_COST_MATERIALS",
  acquisti: "VAR_COST_MATERIALS",
  "lavorazioni terzi": "VAR_COST_SERVICES",
  servizi: "VAR_COST_SERVICES",
  "costi esterni": "VAR_COST_SERVICES",
  provvigioni: "VAR_COST_SERVICES",
  "altri costi variabili": "VAR_COST_SERVICES",
  "manodopera diretta": "VAR_COST_DIRECT_LABOR",
  "mano d'opera diretta": "VAR_COST_DIRECT_LABOR",
  personale: "VAR_COST_DIRECT_LABOR",
  ammortamenti: "FIXED_COST_DEPRECIATION",
  "compensi amministratori": "FIXED_COST_ADMIN_COMPENSATION",
  "compensi soci": "FIXED_COST_ADMIN_COMPENSATION",
  affitto: "FIXED_COST_RENT",
  affitti: "FIXED_COST_RENT",
  utenze: "FIXED_COST_UTILITIES",
  telefono: "FIXED_COST_UTILITIES",
  assicurazioni: "FIXED_COST_INSURANCE",
  "consulenze amministrative": "FIXED_COST_CONSULTING",
  consulenze: "FIXED_COST_CONSULTING",
  marketing: "FIXED_COST_MARKETING",
  pubblicita: "FIXED_COST_MARKETING",
  fiere: "FIXED_COST_MARKETING",
  "costi generali": "FIXED_COST_GENERAL",
  manutenzioni: "FIXED_COST_GENERAL",
  "proventi finanziari": "FINANCIAL_INCOME",
  "oneri finanziari": "FINANCIAL_EXPENSE",
  "gestione finanziaria": "FINANCIAL_EXPENSE",
  "proventi straordinari": "EXTRAORDINARY_INCOME",
  "oneri straordinari": "EXTRAORDINARY_EXPENSE",
  "gestione straordinaria": "EXTRAORDINARY_EXPENSE",
  imposte: "TAX_INCOME",
  "imposte sul reddito": "TAX_INCOME",
};

/** Labels that indicate subtotal rows (to skip) */
const SKIP_LABELS = new Set([
  "totale",
  "margine di contribuzione",
  "mdc",
  "ebitda",
  "ebit",
  "utile ante imposte",
  "utile netto",
  "costi variabili",
  "costi fissi",
  "risultato operativo",
  "risultato netto",
  "valore aggiunto",
  "valore della produzione",
]);

/** Italian month name abbreviations for 12-column format detection */
const MONTH_NAMES_IT = [
  "gen",
  "feb",
  "mar",
  "apr",
  "mag",
  "giu",
  "lug",
  "ago",
  "set",
  "ott",
  "nov",
  "dic",
];
const MONTH_NAMES_FULL_IT = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

// ─── Parser ─────────────────────────────────────────────────

const DEFAULT_SHEET_NAME = "5-BUDGET";

/**
 * Parse a CDG budget Excel file.
 *
 * Supports two formats:
 * 1. **CDG Model format** (e.g. BLM Modello CDG):
 *    - Col A: numeric code (100, 200, ...)
 *    - Col B: abbreviation
 *    - Col C: description
 *    - Col J (index 9): annual budget value
 *    Annual value is distributed evenly across 12 months.
 *
 * 2. **12-column monthly format**:
 *    - Col A: description/label
 *    - Cols B-M (or similar): monthly values Jan-Dec
 *    Monthly values used directly.
 */
export function parseBudgetExcel(
  buffer: Buffer,
  options?: { sheetName?: string; year?: number; budgetColumnIndex?: number },
): ParsedBudget {
  const sheetName = options?.sheetName ?? DEFAULT_SHEET_NAME;
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return emptyResult(sheetName, errors, [{ message: "Impossibile leggere il file Excel" }]);
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return emptyResult(sheetName, warnings, [
      {
        message: `Foglio "${sheetName}" non trovato. Fogli disponibili: ${workbook.SheetNames.join(", ")}`,
      },
    ]);
  }

  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    rawNumbers: true,
  });

  if (raw.length < 3) {
    return emptyResult(sheetName, warnings, [
      { message: "Foglio troppo corto, servono almeno 3 righe" },
    ]);
  }

  // Detect format: check if headers contain month names
  const format = detectFormat(raw);

  if (format.type === "monthly") {
    return parseMonthlyFormat(raw, format.monthColumns, sheetName, options?.year, warnings, errors);
  } else {
    return parseCdgModelFormat(
      raw,
      sheetName,
      options?.year,
      options?.budgetColumnIndex,
      warnings,
      errors,
    );
  }
}

// ─── Format Detection ───────────────────────────────────────

interface MonthlyFormat {
  type: "monthly";
  monthColumns: number[]; // 12 column indices for Jan-Dec
}

interface CdgModelFormat {
  type: "cdg_model";
}

function detectFormat(raw: unknown[][]): MonthlyFormat | CdgModelFormat {
  // Priority 1: Check if column A has numeric CDG codes (100, 200, etc.)
  // This identifies the CDG Model format even if month headers exist elsewhere
  let codeCount = 0;
  for (let r = 3; r < Math.min(15, raw.length); r++) {
    const row = raw[r];
    if (!row) continue;
    const code = Number(row[0]);
    if (Number.isInteger(code) && code >= 100 && code <= 999) {
      codeCount++;
    }
  }
  if (codeCount >= 3) {
    return { type: "cdg_model" };
  }

  // Priority 2: Scan first 5 rows for month names in early columns (< 15)
  // to detect the standard 12-column monthly format
  for (let r = 0; r < Math.min(5, raw.length); r++) {
    const row = raw[r];
    if (!row) continue;

    const monthColumns: number[] = new Array(12).fill(-1);
    for (let c = 0; c < Math.min(row.length, 15); c++) {
      const cell = String(row[c] ?? "")
        .toLowerCase()
        .trim();
      if (!cell) continue;
      let monthIdx = MONTH_NAMES_IT.findIndex((m) => cell.startsWith(m));
      if (monthIdx === -1) {
        monthIdx = MONTH_NAMES_FULL_IT.findIndex((m) => cell.startsWith(m));
      }
      if (monthIdx !== -1 && monthColumns[monthIdx] === -1) {
        monthColumns[monthIdx] = c;
      }
    }

    const found = monthColumns.filter((v) => v !== -1).length;
    if (found >= 6) {
      return { type: "monthly", monthColumns };
    }
  }

  return { type: "cdg_model" };
}

// ─── CDG Model Format Parser ────────────────────────────────

function parseCdgModelFormat(
  raw: unknown[][],
  sheetName: string,
  year: number | undefined,
  budgetColumnIndex: number | undefined,
  warnings: ParseWarning[],
  errors: ParseError[],
): ParsedBudget {
  // Detect year from row 1 (typically has year values)
  let detectedYear = year ?? null;
  const budgetCol = budgetColumnIndex ?? 9; // Default: column J (index 9) = Budget column

  if (!detectedYear) {
    for (let r = 0; r < Math.min(5, raw.length); r++) {
      const row = raw[r];
      if (!row) continue;
      // Look for a 4-digit year in the budget column or nearby
      for (let c = budgetCol - 1; c <= budgetCol + 1 && c < row.length; c++) {
        const val = Number(row[c]);
        if (val >= 2020 && val <= 2040) {
          detectedYear = val;
          break;
        }
      }
      if (detectedYear) break;
    }
  }

  const rows: ParsedBudgetRow[] = [];
  const matchedCategories = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const rawCode = row[0];
    const abbreviation = String(row[1] ?? "").trim();
    const description = String(row[2] ?? "").trim();

    // Skip subtotal rows
    if (SKIP_ABBREVIATIONS.has(abbreviation)) continue;

    // Must have a numeric code
    const code = Number(rawCode);
    if (!Number.isInteger(code) || code <= 0) continue;

    const category = CODE_TO_CATEGORY[code];
    if (!category) {
      warnings.push({
        row: i + 1,
        message: `Riga ${i + 1}: codice ${code} ("${description}") non mappato a nessuna categoria CDG`,
      });
      continue;
    }

    const rawAmount = parseAmount(row[budgetCol]);
    if (rawAmount === null || rawAmount === 0) continue; // Skip zero/empty budget rows

    // Handle sign-sensitive codes (financial, extraordinary)
    let finalCategory = category;
    if (SIGN_SENSITIVE_CODES[code]) {
      finalCategory =
        rawAmount > 0 ? SIGN_SENSITIVE_CODES[code].positive : SIGN_SENSITIVE_CODES[code].negative;
    }

    // Distribute annual amount evenly across 12 months
    const monthlyAmount = round2(Math.abs(rawAmount) / 12);
    const remainder = round2(Math.abs(rawAmount) - monthlyAmount * 12);

    for (let m = 1; m <= 12; m++) {
      // Add remainder to December to ensure total matches
      const amount = m === 12 ? round2(monthlyAmount + remainder) : monthlyAmount;
      if (amount !== 0) {
        rows.push({ cdgCategory: finalCategory, month: m, amount });
      }
    }

    matchedCategories.add(finalCategory);
  }

  if (rows.length === 0) {
    errors.push({
      message:
        "Nessuna riga budget valida trovata. Verificare che il foglio contenga codici CDG in colonna A e valori budget.",
    });
  }

  return {
    rows,
    year: detectedYear,
    sheetName,
    matchedCategories: [...matchedCategories],
    warnings,
    errors,
  };
}

// ─── Monthly Format Parser ──────────────────────────────────

function parseMonthlyFormat(
  raw: unknown[][],
  monthColumns: number[],
  sheetName: string,
  year: number | undefined,
  warnings: ParseWarning[],
  errors: ParseError[],
): ParsedBudget {
  const rows: ParsedBudgetRow[] = [];
  const matchedCategories = new Set<string>();

  // Find the first data row (skip header rows — those that had month names)
  let startRow = 0;
  for (let r = 0; r < Math.min(5, raw.length); r++) {
    const row = raw[r];
    if (!row) continue;
    const firstCell = String(row[0] ?? "")
      .toLowerCase()
      .trim();
    // If first cell looks like a month name or header label, skip
    if (
      MONTH_NAMES_IT.some((m) => firstCell.includes(m)) ||
      MONTH_NAMES_FULL_IT.some((m) => firstCell.includes(m)) ||
      firstCell === "" ||
      firstCell === "voce" ||
      firstCell === "categoria"
    ) {
      startRow = r + 1;
    }
  }

  for (let i = startRow; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const label = String(row[0] ?? "").trim();
    if (!label) continue;

    const normalizedLabel = normalizeLabel(label);

    // Skip subtotal rows
    if (SKIP_LABELS.has(normalizedLabel)) continue;

    // Try to match label to category
    const category = matchLabelToCategory(normalizedLabel);
    if (!category) {
      warnings.push({
        row: i + 1,
        message: `Riga ${i + 1}: "${label}" non mappata a nessuna categoria CDG`,
      });
      continue;
    }

    let hasAnyValue = false;
    for (let m = 0; m < 12; m++) {
      const colIdx = monthColumns[m];
      if (colIdx === -1) continue;

      const amount = parseAmount(row[colIdx]);
      if (amount !== null && amount !== 0) {
        rows.push({
          cdgCategory: category,
          month: m + 1,
          amount: round2(Math.abs(amount)),
        });
        hasAnyValue = true;
      }
    }

    if (hasAnyValue) {
      matchedCategories.add(category);
    }
  }

  if (rows.length === 0) {
    errors.push({
      message: "Nessuna riga budget valida trovata. Verificare le intestazioni mese e le voci CDG.",
    });
  }

  return {
    rows,
    year: year ?? null,
    sheetName,
    matchedCategories: [...matchedCategories],
    warnings,
    errors,
  };
}

// ─── Helpers ────────────────────────────────────────────────

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[àáâã]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9\s']/g, "")
    .trim();
}

function matchLabelToCategory(normalizedLabel: string): string | null {
  // Exact match first
  if (LABEL_TO_CATEGORY[normalizedLabel]) {
    return LABEL_TO_CATEGORY[normalizedLabel];
  }

  // Partial match: check if any key is contained in the label
  for (const [key, category] of Object.entries(LABEL_TO_CATEGORY)) {
    if (normalizedLabel.includes(key)) {
      return category;
    }
  }

  return null;
}

/**
 * Parse a cell value as a numeric amount.
 * Handles: numbers, Italian format "1.234,56", space-separated thousands.
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

function emptyResult(
  sheetName: string,
  warnings: ParseWarning[],
  errors: ParseError[],
): ParsedBudget {
  return {
    rows: [],
    year: null,
    sheetName,
    matchedCategories: [],
    warnings,
    errors,
  };
}
