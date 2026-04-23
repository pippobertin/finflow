import { PDFParse } from "pdf-parse";

export interface EcMetadata {
  openingBalance: number | null;
  closingBalance: number | null;
  openingDate: string | null;
  closingDate: string | null;
}

interface RawParseResult {
  headers: string[];
  rows: Record<string, string>[];
}

export interface PdfParseResult extends RawParseResult {
  ecMetadata: EcMetadata;
}

// ─── Constants ─────────────────────────────────────────────

const HEADER_KEYWORDS = [
  "data",
  "valuta",
  "descrizione",
  "causale",
  "importo",
  "dare",
  "avere",
  "saldo",
  "uscite",
  "entrate",
];

const AMOUNT_RE_G = /-?\s?\d{1,3}(?:[.\u00a0\s]\d{3})*,\d{2}-?/g;

const MAX_AMOUNT = 10_000_000;

// Noise: amounts preceded by fee/commission or currency keywords
// COMM: 1,20 / SPESE: 0,00 / COMM SERV: 0,00 / DI EUR 19,76 / DI USD 20,00
const NOISE_PREFIX_RE = /(?:COMM|SPESE|COMM\s*SERV|(?:DI\s*)?(?:EURO?|USD|GBP|CHF))\s*[:\s]*$/i;

// Rows to skip
const SKIP_ROW_PATTERNS = [
  /sconfinamenti/i,
  /saldo\s*iniziale/i,
  /saldo\s*finale/i,
  /coordinate\s*bancarie/i,
  /^iban\b/i,
  /^bic\b/i,
  /^swift\b/i,
  /^filiale\b/i,
  /intestat/i,
  /estratto\s*conto/i,
  /^pagina\b/i,
  /^pag\.\s*\d/i,
  /^\d+\s*\/\s*\d+$/,
  /^page\s/i,
  /totale\s*(?:uscite|entrate|dare|avere)/i,
  /elenco\s*movimenti/i,
  /competenze\s*e\s*spese/i,
  /riepilog/i,
  /^riporto\b/i,
  /centrale\s*(?:dei\s*)?rischi/i,
  /circolare\s*della\s*banca/i,
  /presupposti\s*previsti/i,
  /numero\s*rapporto/i,
  /affidamento\s*saranno/i,
];

// Direction classification keywords
const OUTFLOW_KW = [
  "addebito",
  "pagamento",
  "disposizione di bonifico",
  "imposta",
  "prelievo",
  "canone",
  "bollo",
  "commissione",
  "rata ",
  "e-commerce",
  "contactless",
  "costo fisso",
  "f24",
  "mav",
  "rid",
  "sdd",
];
const INFLOW_KW = [
  "bonifico a vostro favore",
  "accredito",
  "versamento",
  "incasso",
  "rimborso",
  "stipendio",
  "a vostro favore",
];

// ─── Helpers ───────────────────────────────────────────────

function shouldSkipRow(text: string): boolean {
  return SKIP_ROW_PATTERNS.some((re) => re.test(text.trim()));
}

function cleanAmount(raw: string): string {
  let s = raw.replace(/[\s\u00a0]/g, "");
  if (s.endsWith("-") && !s.startsWith("-")) s = "-" + s.slice(0, -1);
  return s;
}

function parseNumericValue(s: string): number {
  return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function looksLikeHeader(row: string[]): boolean {
  const joined = row.join(" ").toLowerCase();
  return HEADER_KEYWORDS.filter((k) => joined.includes(k)).length >= 2;
}

function classifyDirection(desc: string): "uscite" | "entrate" | "unknown" {
  const lower = desc.toLowerCase();
  const out = OUTFLOW_KW.some((k) => lower.includes(k));
  const inc = INFLOW_KW.some((k) => lower.includes(k));
  if (out && !inc) return "uscite";
  if (inc && !out) return "entrate";
  return "unknown";
}

// Priority keyword lists — checked BEFORE classifyDirection.
// Income keywords first: if "BONIFICO A VOSTRO FAVORE" is present,
// it wins even if "PAGAMENTO" also appears in a sub-reference.
const INCOME_PRIORITY_KW = [
  "BONIFICO A VOSTRO FAVORE",
  "A VOSTRO FAVORE",
  "SALDO INIZIALE A VS. CREDITO",
  "STORNO A VOSTRO FAVORE",
  "VOSTRA DISPOSIZIONE STORNO",
  "ACCREDITO",
];

const EXPENSE_PRIORITY_KW = [
  "ADDEBITO SEPA",
  "ADDEBITO BOLLETTA",
  "DISPOSIZIONE DI BONIFICO",
  "PAGAMENTO",
  "COMMISSIONI",
  "IMPOSTA",
  "PRELIEVO",
  "IMPRENDO ONE",
  "COSTO FISSO",
];

/**
 * Deterministic sign override with priority keywords.
 * Income keywords are checked first (higher priority).
 * Falls back to classifyDirection heuristic when no keyword matches.
 */
function determineSign(description: string): "uscite" | "entrate" | "unknown" {
  const upper = description.toUpperCase();

  for (const kw of INCOME_PRIORITY_KW) {
    if (upper.includes(kw)) return "entrate";
  }
  for (const kw of EXPENSE_PRIORITY_KW) {
    if (upper.includes(kw)) return "uscite";
  }

  // No priority keyword matched — use existing heuristic
  return classifyDirection(description);
}

// ─── Amount extraction ─────────────────────────────────────

interface CandidateAmount {
  value: string;
  original: string;
  numeric: number;
  isNoise: boolean;
}

function findAmountsInText(text: string): CandidateAmount[] {
  const results: CandidateAmount[] = [];
  const matches = [...text.matchAll(AMOUNT_RE_G)];

  for (const match of matches) {
    const idx = match.index!;
    const prefix = text.slice(Math.max(0, idx - 20), idx);
    const isNoise = NOISE_PREFIX_RE.test(prefix);
    const value = cleanAmount(match[0]);
    const numeric = Math.abs(parseNumericValue(value));

    results.push({ value, original: match[0], numeric, isNoise });
  }

  return results;
}

/**
 * Select THE ONE real transaction amount from candidates.
 * 1. Discard noise (COMM/SPESE)
 * 2. Discard garbage (> MAX_AMOUNT)
 * 3. Take the LARGEST remaining
 */
function selectTransactionAmount(candidates: CandidateAmount[]): string | null {
  const real = candidates.filter((a) => !a.isNoise && a.numeric < MAX_AMOUNT && a.numeric > 0);
  if (real.length === 0) return null;
  real.sort((a, b) => b.numeric - a.numeric);
  return real[0].value;
}

// ─── Find column index by keywords ─────────────────────────

function findColumnIdx(headers: string[], keywords: string[]): number {
  return headers.findIndex((h) => {
    const lower = h.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  });
}

// ─── Strategy 1: Table extraction (PRIMARY) ────────────────
//
// Table extraction preserves column structure → dates are correct.
// Amounts may be wrong for multi-line descriptions (COMM values leak
// into Uscite/Entrate columns). We fix amounts in post-processing
// by scanning the full row text with noise filtering + largest selection.

function parseFromTables(tables: Array<Array<string>>[]): RawParseResult | null {
  let bestTable: Array<Array<string>> | null = null;
  let bestLen = 0;

  for (const table of tables) {
    if (table.length > bestLen) {
      bestLen = table.length;
      bestTable = table;
    }
  }

  if (!bestTable || bestTable.length < 2) return null;

  // Find header row
  let headerIdx = -1;
  for (let i = 0; i < Math.min(bestTable.length, 5); i++) {
    if (looksLikeHeader(bestTable[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;

  const rawHeaders = bestTable[headerIdx].map((h) => h.trim()).filter(Boolean);
  if (rawHeaders.length < 3) return null;

  // Identify key columns in the source table
  const dateIdx = findColumnIdx(rawHeaders, ["data"]);
  const valutaIdx = findColumnIdx(rawHeaders, ["valuta"]);
  const descIdx = findColumnIdx(rawHeaders, ["descrizione", "causale"]);

  if (dateIdx < 0 || descIdx < 0) return null;

  // Build output with normalized headers: Data, Valuta, Descrizione, Uscite, Entrate
  const outHeaders = ["Data"];
  if (valutaIdx >= 0) outHeaders.push("Valuta");
  outHeaders.push("Descrizione", "Uscite", "Entrate");

  const rows: Record<string, string>[] = [];

  for (let i = headerIdx + 1; i < bestTable.length; i++) {
    const cells = bestTable[i];
    if (cells.every((c) => !c.trim())) continue;

    // Skip junk rows
    const rowText = cells.join(" ");
    if (shouldSkipRow(rowText)) continue;

    const dateVal = (cells[dateIdx] ?? "").trim();
    const descVal = (cells[descIdx] ?? "").trim();

    // Must have a date and description
    if (!dateVal || !descVal) continue;

    // Skip meaningless descriptions
    const alphaDesc = descVal.replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ]/g, "");
    if (alphaDesc.length < 3) continue;

    // --- Amount post-processing ---
    // Scan the FULL row text to find the real transaction amount.
    // This handles cases where COMM/SPESE values end up in amount columns.
    const allAmounts = findAmountsInText(rowText);
    const bestAmount = selectTransactionAmount(allAmounts);

    if (!bestAmount) continue;

    // Classify direction by description (priority keywords → heuristic fallback)
    const direction = determineSign(descVal);

    const row: Record<string, string> = {};
    row["Data"] = dateVal;
    if (valutaIdx >= 0) row["Valuta"] = (cells[valutaIdx] ?? "").trim();
    row["Descrizione"] = descVal;

    if (direction === "uscite") {
      row["Uscite"] = bestAmount;
      row["Entrate"] = "";
    } else if (direction === "entrate") {
      row["Uscite"] = "";
      row["Entrate"] = bestAmount;
    } else {
      row["Uscite"] = bestAmount;
      row["Entrate"] = "";
    }

    rows.push(row);
  }

  if (rows.length === 0) return null;
  return { headers: outHeaders, rows };
}

// ─── Strategy 2: Text parsing (FALLBACK) ───────────────────

interface TxBlock {
  dates: string[];
  descParts: string[];
  allAmounts: CandidateAmount[];
}

function parseFromText(text: string): RawParseResult {
  const lines = text.split("\n");
  const blocks: TxBlock[] = [];
  let current: TxBlock | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (shouldSkipRow(line)) continue;

    const lower = line.toLowerCase();
    if (HEADER_KEYWORDS.filter((k) => lower.includes(k)).length >= 2) continue;

    // New transaction = TWO consecutive dates at line start (Data + Valuta)
    const twoDateStart = line.match(
      /^(\d{2}[\/.\-]\d{2}[\/.\-](?:\d{4}|\d{2}))\s+(\d{2}[\/.\-]\d{2}[\/.\-](?:\d{4}|\d{2}))/,
    );

    if (twoDateStart) {
      if (current && selectTransactionAmount(current.allAmounts)) {
        blocks.push(current);
      }

      const dates = [twoDateStart[1], twoDateStart[2]];
      const amounts = findAmountsInText(line);

      let desc = line;
      for (const d of dates) desc = desc.replace(d, " ");
      for (const a of amounts) desc = desc.replace(a.original, " ");
      desc = desc.replace(/\s{2,}/g, " ").trim();

      current = {
        dates,
        descParts: desc ? [desc] : [],
        allAmounts: amounts,
      };
    } else if (current) {
      const amounts = findAmountsInText(line);
      current.allAmounts.push(...amounts);

      let desc = line;
      for (const a of amounts) desc = desc.replace(a.original, " ");
      desc = desc.replace(/\s{2,}/g, " ").trim();
      if (desc && desc.length > 1 && !/^\d+$/.test(desc)) {
        current.descParts.push(desc);
      }
    }
  }

  if (current && selectTransactionAmount(current.allAmounts)) {
    blocks.push(current);
  }

  if (blocks.length === 0) return { headers: [], rows: [] };

  const hasTwoDates = blocks.filter((b) => b.dates.length >= 2).length > blocks.length / 2;

  const headers = ["Data"];
  if (hasTwoDates) headers.push("Valuta");
  headers.push("Descrizione", "Uscite", "Entrate");

  const rows: Record<string, string>[] = [];

  for (const block of blocks) {
    const description = block.descParts
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!description) continue;
    const alphaDesc = description.replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ]/g, "");
    if (alphaDesc.length < 3) continue;

    const amount = selectTransactionAmount(block.allAmounts);
    if (!amount) continue;

    const direction = determineSign(description);
    const row: Record<string, string> = {};
    row["Data"] = block.dates[0] || "";
    if (hasTwoDates) row["Valuta"] = block.dates[1] || block.dates[0] || "";
    row["Descrizione"] = description;

    if (direction === "uscite") {
      row["Uscite"] = amount;
      row["Entrate"] = "";
    } else if (direction === "entrate") {
      row["Uscite"] = "";
      row["Entrate"] = amount;
    } else {
      row["Uscite"] = amount;
      row["Entrate"] = "";
    }

    rows.push(row);
  }

  return { headers, rows };
}

// ─── EC metadata extraction (RIEPILOGO GENERALE) ─────────

function extractEcMetadata(text: string): EcMetadata {
  const result: EcMetadata = {
    openingBalance: null,
    closingBalance: null,
    openingDate: null,
    closingDate: null,
  };

  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasSaldoIniziale = /saldo\s*iniziale/i.test(line);
    const hasSaldoFinale = /saldo\s*finale/i.test(line);

    if (!hasSaldoIniziale && !hasSaldoFinale) continue;

    // Extract dates: "al DD.MM.YYYY"
    const dateMatches = [...line.matchAll(/al\s+(\d{2}[./]\d{2}[./]\d{4})/g)];

    // Find amounts — check this line, and if none found, the next line
    let amounts = findAmountsInText(line).filter((a) => !a.isNoise);
    if (amounts.length === 0 && i + 1 < lines.length) {
      amounts = findAmountsInText(lines[i + 1]).filter((a) => !a.isNoise);
    }

    if (hasSaldoIniziale && hasSaldoFinale) {
      // RIEPILOGO header: both on same line, amounts on this or next line
      // First amount = opening, last = closing
      if (amounts.length >= 2) {
        result.openingBalance = amounts[0].numeric;
        result.closingBalance = amounts[amounts.length - 1].numeric;
      }
      if (dateMatches.length >= 2) {
        result.openingDate = dateMatches[0][1];
        result.closingDate = dateMatches[1][1];
      }
    } else if (hasSaldoFinale) {
      if (amounts.length > 0) {
        result.closingBalance = amounts[amounts.length - 1].numeric;
      }
      if (dateMatches.length > 0) {
        result.closingDate = dateMatches[dateMatches.length - 1][1];
      }
    } else if (hasSaldoIniziale) {
      if (amounts.length > 0) {
        result.openingBalance = amounts[0].numeric;
      }
      if (dateMatches.length > 0) {
        result.openingDate = dateMatches[0][1];
      }
    }
  }

  return result;
}

// ─── Main export ──────────────────────────────────────────

/**
 * Parse a bank statement PDF into structured rows.
 *
 * PRIMARY: text parsing with two-date block detection.
 * Each transaction starts with "DD.MM.YY DD.MM.YY" (Data + Valuta).
 * Dates are correct because they come directly from the text flow.
 *
 * FALLBACK: table extraction (may misalign dates on multi-line rows).
 */
export async function parseBankStatementPdf(buffer: Buffer): Promise<PdfParseResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    // Primary: text parsing (correct dates from two-date block detection)
    const textResult = await parser.getText();
    const fullText = textResult.text;

    // Extract EC metadata (saldo iniziale/finale) from RIEPILOGO
    const ecMetadata = extractEcMetadata(fullText);
    if (ecMetadata.closingBalance !== null) {
      console.log(
        `[pdf-parser] EC metadata: opening=${ecMetadata.openingBalance} (${ecMetadata.openingDate}), closing=${ecMetadata.closingBalance} (${ecMetadata.closingDate})`,
      );
    }

    const textParsed = parseFromText(fullText);

    if (textParsed.rows.length >= 3) {
      console.log(
        `[pdf-parser] Text parsing: ${textParsed.rows.length} rows, headers: [${textParsed.headers.join(", ")}]`,
      );
      return { ...textParsed, ecMetadata };
    }

    // Fallback: table extraction
    console.log(`[pdf-parser] Text gave ${textParsed.rows.length} rows, trying table extraction`);
    const tableResult = await parser.getTable();
    const allTables = tableResult.mergedTables;

    if (allTables.length > 0) {
      const tableParsed = parseFromTables(allTables);
      if (tableParsed && tableParsed.rows.length > textParsed.rows.length) {
        console.log(`[pdf-parser] Table extraction: ${tableParsed.rows.length} rows`);
        return { ...tableParsed, ecMetadata };
      }
    }

    console.log(`[pdf-parser] Final: ${textParsed.rows.length} rows`);
    return { ...textParsed, ecMetadata };
  } finally {
    await parser.destroy();
  }
}
