import * as XLSX from "xlsx";
import { z } from "zod";

// ─── Types ──────────────────────────────────────────────────

export interface ParsedInvoiceRow {
  number: string;
  date: Date;
  dueDate: Date | null;
  direction: "ACTIVE" | "PASSIVE";
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  notes: string | null;
  status: "PENDING" | "PAID";
}

export interface ParsedInvoiceResult {
  rows: ParsedInvoiceRow[];
  warnings: ParseWarning[];
  errors: ParseError[];
}

export interface ParseWarning {
  row: number;
  message: string;
}

export interface ParseError {
  row: number;
  message: string;
}

// ─── Constants ──────────────────────────────────────────────

/** Mapping of common header labels → canonical field names */
const HEADER_MAP: Record<string, string> = {
  // numero
  numero: "number",
  "n.": "number",
  "nr.": "number",
  "n. fattura": "number",
  "numero fattura": "number",
  number: "number",
  // data
  data: "date",
  "data fattura": "date",
  "data emissione": "date",
  date: "date",
  // scadenza
  scadenza: "dueDate",
  "data scadenza": "dueDate",
  "due date": "dueDate",
  duedate: "dueDate",
  // direzione
  direzione: "direction",
  tipo: "direction",
  direction: "direction",
  type: "direction",
  // imponibile
  imponibile: "netAmount",
  netto: "netAmount",
  "net amount": "netAmount",
  netamount: "netAmount",
  // iva
  iva: "vatAmount",
  "importo iva": "vatAmount",
  "vat amount": "vatAmount",
  vatamount: "vatAmount",
  vat: "vatAmount",
  // note
  note: "notes",
  notes: "notes",
  descrizione: "notes",
  // stato
  stato: "status",
  status: "status",
};

const DIRECTION_MAP: Record<string, "ACTIVE" | "PASSIVE"> = {
  active: "ACTIVE",
  passive: "PASSIVE",
  attiva: "ACTIVE",
  passiva: "PASSIVE",
  a: "ACTIVE",
  p: "PASSIVE",
  vendita: "ACTIVE",
  acquisto: "PASSIVE",
};

const STATUS_MAP: Record<string, "PENDING" | "PAID"> = {
  pending: "PENDING",
  paid: "PAID",
  pagata: "PAID",
  "non pagata": "PENDING",
  "da pagare": "PENDING",
  aperta: "PENDING",
  chiusa: "PAID",
  saldata: "PAID",
};

// ─── Parser ─────────────────────────────────────────────────

export function parseInvoiceExcel(buffer: Buffer): ParsedInvoiceResult {
  const errors: ParseError[] = [];
  const warnings: ParseWarning[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    return {
      rows: [],
      warnings,
      errors: [{ row: 0, message: "Impossibile leggere il file Excel" }],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      warnings,
      errors: [{ row: 0, message: "Il file non contiene fogli" }],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    rawNumbers: true,
  });

  if (raw.length < 2) {
    return {
      rows: [],
      warnings,
      errors: [
        { row: 0, message: "Il file deve contenere almeno un'intestazione e una riga dati" },
      ],
    };
  }

  // ── Detect header row ──
  const headerRow = raw[0];
  const columnMap = resolveColumns(headerRow);

  if (columnMap.number === -1) {
    errors.push({ row: 1, message: "Colonna 'Numero' non trovata nell'intestazione" });
  }
  if (columnMap.date === -1) {
    errors.push({ row: 1, message: "Colonna 'Data' non trovata nell'intestazione" });
  }
  if (columnMap.netAmount === -1) {
    errors.push({ row: 1, message: "Colonna 'Imponibile' non trovata nell'intestazione" });
  }
  if (errors.length > 0) {
    return { rows: [], warnings, errors };
  }

  // ── Parse data rows ──
  const rows: ParsedInvoiceRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.every((c) => c === null || c === undefined || String(c).trim() === "")) {
      continue; // skip empty rows
    }

    const excelRow = i + 1; // 1-based for user display
    const cellAt = (idx: number) => (idx >= 0 && idx < row.length ? row[idx] : null);

    // number
    const rawNumber = String(cellAt(columnMap.number) ?? "").trim();
    if (!rawNumber) {
      errors.push({ row: excelRow, message: `Riga ${excelRow}: numero fattura mancante` });
      continue;
    }

    // date
    const rawDate = cellAt(columnMap.date);
    const date = parseDate(rawDate);
    if (!date) {
      errors.push({
        row: excelRow,
        message: `Riga ${excelRow}: data non valida "${String(rawDate)}"`,
      });
      continue;
    }

    // dueDate (optional)
    const rawDueDate = columnMap.dueDate >= 0 ? cellAt(columnMap.dueDate) : null;
    const dueDate = rawDueDate != null ? parseDate(rawDueDate) : null;

    // direction
    let direction: "ACTIVE" | "PASSIVE" = "ACTIVE";
    if (columnMap.direction >= 0) {
      const rawDir = String(cellAt(columnMap.direction) ?? "")
        .trim()
        .toLowerCase();
      const mapped = DIRECTION_MAP[rawDir];
      if (!mapped) {
        errors.push({
          row: excelRow,
          message: `Riga ${excelRow}: direzione non riconosciuta "${rawDir}" (usare Attiva/Passiva)`,
        });
        continue;
      }
      direction = mapped;
    } else {
      warnings.push({
        row: excelRow,
        message: `Riga ${excelRow}: colonna Direzione assente, assunto "Attiva"`,
      });
    }

    // netAmount
    const rawNet = cellAt(columnMap.netAmount);
    const netAmount = parseAmount(rawNet);
    if (netAmount === null || netAmount < 0) {
      errors.push({
        row: excelRow,
        message: `Riga ${excelRow}: imponibile non valido "${String(rawNet)}"`,
      });
      continue;
    }

    // vatAmount (default 0)
    const rawVat = columnMap.vatAmount >= 0 ? cellAt(columnMap.vatAmount) : null;
    const vatAmount = rawVat != null ? (parseAmount(rawVat) ?? 0) : 0;

    // notes (optional)
    const notes =
      columnMap.notes >= 0 ? String(cellAt(columnMap.notes) ?? "").trim() || null : null;

    // status (optional, default PENDING)
    let status: "PENDING" | "PAID" = "PENDING";
    if (columnMap.status >= 0) {
      const rawStatus = String(cellAt(columnMap.status) ?? "")
        .trim()
        .toLowerCase();
      if (rawStatus) {
        status = STATUS_MAP[rawStatus] ?? "PENDING";
      }
    }

    const grossAmount = round2(netAmount + vatAmount);

    rows.push({
      number: rawNumber,
      date,
      dueDate,
      direction,
      netAmount: round2(netAmount),
      vatAmount: round2(vatAmount),
      grossAmount,
      notes,
      status,
    });
  }

  // Emit a single warning for direction column missing (not per-row)
  if (columnMap.direction === -1 && rows.length > 0) {
    // Replace per-row warnings with a single one
    const dirWarnings = warnings.filter((w) => w.message.includes("Direzione assente"));
    if (dirWarnings.length > 1) {
      const keep = dirWarnings[0];
      for (const w of dirWarnings.slice(1)) {
        warnings.splice(warnings.indexOf(w), 1);
      }
      keep.message = `Colonna "Direzione" assente: tutte le ${rows.length} righe importate come "Attiva"`;
    }
  }

  return { rows, warnings, errors };
}

// ─── Column resolution ──────────────────────────────────────

interface ColumnIndices {
  number: number;
  date: number;
  dueDate: number;
  direction: number;
  netAmount: number;
  vatAmount: number;
  notes: number;
  status: number;
}

function resolveColumns(headerRow: unknown[]): ColumnIndices {
  const result: ColumnIndices = {
    number: -1,
    date: -1,
    dueDate: -1,
    direction: -1,
    netAmount: -1,
    vatAmount: -1,
    notes: -1,
    status: -1,
  };

  for (let i = 0; i < headerRow.length; i++) {
    const raw = String(headerRow[i] ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const field = HEADER_MAP[raw];
    if (field && field in result && result[field as keyof ColumnIndices] === -1) {
      result[field as keyof ColumnIndices] = i;
    }
  }

  return result;
}

// ─── Date parsing ───────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  // Excel serial number (e.g. 45678)
  if (typeof value === "number") {
    if (value > 1 && value < 200000) {
      // Excel date serial → JS Date
      // Excel epoch: 1900-01-01, but Excel has a leap year bug (day 60 = 1900-02-29)
      const epoch = new Date(1899, 11, 30); // Dec 30, 1899
      const d = new Date(epoch.getTime() + value * 86400000);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }

  if (typeof value !== "string") return null;

  const s = value.trim();
  if (!s) return null;

  // dd/mm/yyyy or dd-mm-yyyy or dd.mm.yyyy
  const dmyMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const [, dd, mm, yyyy] = dmyMatch;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }

  // yyyy-mm-dd
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback: try native Date parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  return null;
}

// ─── Amount parsing ─────────────────────────────────────────

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  if (typeof value === "string") {
    let cleaned = value.trim();
    if (!cleaned) return null;

    // Remove currency symbols and spaces
    cleaned = cleaned.replace(/[€$£\s]/g, "");

    // Italian format: 1.234,56 → 1234.56
    if (cleaned.includes(",")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }

    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
