/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  STANDBY — This module is NOT actively used in the main flow.  ║
 * ║                                                                ║
 * ║  The production upload pipeline uses the V1 parser             ║
 * ║  (pdf-parser.ts) which is more robust (noise filtering,        ║
 * ║  MAX_AMOUNT guard, table extraction fallback).                 ║
 * ║                                                                ║
 * ║  This V2 state machine remains for future use when we          ║
 * ║  implement column-detection (Opzione C / Fase 7+).             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Profile-based PDF bank statement parser — V2 state machine.
 *
 * Uses configurable BankLayoutPatterns (stored in PdfBankProfile) to extract
 * transaction rows from Italian bank PDF statements. Each bank has different
 * layout conventions — this parser applies bank-specific patterns via a
 * three-state machine (SEEKING_SECTION → IN_SECTION → COLLECTING) to handle
 * multi-line transactions (e.g. Unicredit).
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

// ─── Safety constants ────────────────────────────────────────

/** Max plausible transaction amount for a PMI (10 million EUR) */
const MAX_AMOUNT = 10_000_000;

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
 * Normalize date string — expand 2-digit year to 4-digit.
 * Returns the raw string for downstream parsing by import connector.
 */
function normalizeDate(raw: string, format: string): string {
  const trimmed = raw.trim();
  // If 2-digit year (dd/MM/yy or dd.MM.yy), expand to 4-digit
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

// ─── Sign determination ─────────────────────────────────────

interface SignHints {
  overrideIncoming?: string[];
  incoming: string[];
  outgoing: string[];
  defaultSign: "positive" | "negative";
}

/**
 * Determine the sign of an amount based on description keywords.
 * Returns +1 for incoming (positive) or -1 for outgoing (negative).
 *
 * Three-tier priority:
 * 1. overrideIncoming (STORNO, A VOSTRO FAVORE, etc.) — always wins
 * 2. outgoing (ADDEBITO, PAGAMENTO, etc.) — normal debits
 * 3. incoming (ACCREDITO, INCASSO, etc.) — normal credits
 * 4. defaultSign fallback
 *
 * This handles "ADDEBITO SEPA … Incasso 131982/01" (outgoing wins over
 * regular incoming) AND "BONIFICO SEPA VOSTRA DISPOSIZIONE STORNO"
 * (override incoming wins over outgoing).
 */
function determineSign(description: string, hints: SignHints): 1 | -1 {
  const lower = description.toLowerCase();

  // 1. Override incoming — reversal keywords always mean positive
  if (hints.overrideIncoming) {
    for (const kw of hints.overrideIncoming) {
      if (lower.includes(kw.toLowerCase())) return 1;
    }
  }

  // 2. Outgoing — normal debits
  for (const kw of hints.outgoing) {
    if (lower.includes(kw.toLowerCase())) return -1;
  }

  // 3. Regular incoming — normal credits
  for (const kw of hints.incoming) {
    if (lower.includes(kw.toLowerCase())) return 1;
  }

  return hints.defaultSign === "positive" ? 1 : -1;
}

// ─── Regex compilation helper ───────────────────────────────

function tryCompileRegex(pattern: string, label: string, warnings: string[]): RegExp | null {
  try {
    return new RegExp(pattern);
  } catch (err) {
    warnings.push(`${label} non valido: ${err instanceof Error ? err.message : "errore"}`);
    return null;
  }
}

// ─── State machine types ────────────────────────────────────

type State = "SEEKING_SECTION" | "IN_SECTION" | "COLLECTING";

interface PendingRow {
  date: string;
  valuta?: string;
  description: string;
  amount?: number;
  balance?: number;
  /** Last raw continuation line — used for fallback amount extraction */
  _lastRawLine?: string;
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
  const startTxRegex = tryCompileRegex(
    patterns.startTransactionPattern,
    "startTransactionPattern",
    warnings,
  );
  if (!startTxRegex) {
    return { rows: [], warnings, rawTextPreview, totalLines, matchedLines: 0, skippedLines: 0 };
  }

  const amountRegex = tryCompileRegex(patterns.amountLinePattern, "amountLinePattern", warnings);
  if (!amountRegex) {
    return { rows: [], warnings, rawTextPreview, totalLines, matchedLines: 0, skippedLines: 0 };
  }

  const singleLineRegex = patterns.singleLinePattern
    ? tryCompileRegex(patterns.singleLinePattern, "singleLinePattern", warnings)
    : null;

  const sectionStartRegex = patterns.sectionStartMarker
    ? tryCompileRegex(patterns.sectionStartMarker, "sectionStartMarker", warnings)
    : null;

  const sectionEndRegex = patterns.sectionEndMarker
    ? tryCompileRegex(patterns.sectionEndMarker, "sectionEndMarker", warnings)
    : null;

  const skipRegexes: RegExp[] = [];
  for (const sp of patterns.skipPatterns) {
    const re = tryCompileRegex(sp, "skipPattern", warnings);
    if (re) skipRegexes.push(re);
  }

  const signHints: SignHints = patterns.signHints;

  // 3. State machine
  const rows: ParsedBankRow[] = [];
  let state: State = sectionStartRegex ? "SEEKING_SECTION" : "IN_SECTION";
  let pending: PendingRow | null = null;
  let matchedLines = 0;
  let skippedLines = 0;

  /** Regex for fallback: find the last comma-decimal number in a line */
  const fallbackAmountRe = patterns.amountDecimal === "," ? /([\d.]+,\d{2})/g : /([\d,]+\.\d{2})/g;

  /** Strip fee metadata (COMM: X,XX, SPESE: X,XX, COMM SERV: X,XX) from text */
  const feeMetadataRe = /(?:COMM(?:\s+SERV)?|SPESE)\s*:\s*[\d.]+,\d{2}/gi;

  /** Flush a completed pending row into results. Returns null (to clear pending). */
  function flushRow(p: PendingRow): null {
    // Fallback amount extraction when no amount was found during COLLECTING
    if (p.amount == null) {
      // 1. Try strict amount-only match on last accumulated line
      if (p._lastRawLine) {
        const strictMatch = amountRegex!.exec(p._lastRawLine);
        if (strictMatch?.groups?.amount) {
          const rawAmount = parseAmount(strictMatch.groups.amount, patterns.amountDecimal);
          if (rawAmount !== null) {
            p.amount =
              rawAmount < 0
                ? rawAmount
                : Math.abs(rawAmount) * determineSign(p.description, signHints);
            if (strictMatch.groups.balance) {
              p.balance =
                parseAmount(strictMatch.groups.balance, patterns.amountDecimal) ?? undefined;
            }
          }
        }
      }

      // 2. Scan full description for last comma-decimal number, excluding fee metadata
      if (p.amount == null && p.description) {
        const cleaned = p.description.replace(feeMetadataRe, "");
        const matches = [...cleaned.matchAll(fallbackAmountRe)];
        if (matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const rawAmount = parseAmount(lastMatch[1], patterns.amountDecimal);
          if (rawAmount !== null) {
            p.amount =
              rawAmount < 0
                ? rawAmount
                : Math.abs(rawAmount) * determineSign(p.description, signHints);
          }
        }
      }
    }

    if (p.amount != null) {
      // Safety guard: discard absurd amounts (parser concatenation errors)
      if (Math.abs(p.amount) > MAX_AMOUNT) {
        warnings.push(
          `Transazione scartata, amount anomalo: ${p.amount} EUR su descrizione "${p.description.trim().slice(0, 80)}"`,
        );
        return null;
      }
      rows.push({
        date: p.date,
        ...(p.valuta ? { valuta: p.valuta } : {}),
        description: p.description.trim(),
        amount: p.amount,
        ...(p.balance != null ? { balance: p.balance } : {}),
      });
      matchedLines++;
    } else if (p.description.trim().length > 0) {
      warnings.push(
        `Transazione incompleta (senza importo): "${p.description.trim().slice(0, 60)}"`,
      );
    }
    return null;
  }

  /** Build a complete row from a single-line regex match. */
  function emitSingleLine(match: RegExpExecArray): void {
    const g = match.groups!;
    const rawAmount = parseAmount(g.amount, patterns.amountDecimal);
    if (rawAmount === null) {
      warnings.push(`Importo non valido: "${match[0].trim().slice(0, 80)}"`);
      return;
    }

    const desc = (g.description ?? "").trim();
    // If the raw amount already has a sign (negative), respect it.
    // Otherwise apply signHints.
    const amount = rawAmount < 0 ? rawAmount : Math.abs(rawAmount) * determineSign(desc, signHints);

    // Safety guard: discard absurd amounts
    if (Math.abs(amount) > MAX_AMOUNT) {
      warnings.push(
        `Transazione scartata, amount anomalo: ${amount} EUR su descrizione "${desc.slice(0, 80)}"`,
      );
      return;
    }

    rows.push({
      date: normalizeDate(g.date, patterns.dateFormat),
      ...(g.valuta ? { valuta: normalizeDate(g.valuta, patterns.dateFormat) } : {}),
      description: desc,
      amount,
      ...(g.balance
        ? { balance: parseAmount(g.balance, patterns.amountDecimal) ?? undefined }
        : {}),
    });
    matchedLines++;
  }

  /** Create a new pending row from a startTransaction regex match. */
  function makePending(match: RegExpExecArray): PendingRow {
    const g = match.groups!;
    return {
      date: normalizeDate(g.date, patterns.dateFormat),
      ...(g.valuta ? { valuta: normalizeDate(g.valuta, patterns.dateFormat) } : {}),
      description: (g.description ?? "").trim(),
    };
  }

  for (const line of lines) {
    // Skip blank or matching skip patterns (in all states)
    if (skipRegexes.some((re) => re.test(line))) {
      skippedLines++;
      continue;
    }

    switch (state) {
      case "SEEKING_SECTION": {
        if (sectionStartRegex && sectionStartRegex.test(line)) {
          state = "IN_SECTION";
        }
        skippedLines++;
        break;
      }

      case "IN_SECTION": {
        // Check section end
        if (sectionEndRegex && sectionEndRegex.test(line)) {
          if (pending) pending = flushRow(pending);
          state = sectionStartRegex ? "SEEKING_SECTION" : "IN_SECTION";
          skippedLines++;
          break;
        }

        // Try single-line match first (more specific)
        if (singleLineRegex) {
          const slMatch = singleLineRegex.exec(line);
          if (slMatch?.groups) {
            if (pending) pending = flushRow(pending);
            emitSingleLine(slMatch);
            break;
          }
        }

        // Try transaction start
        {
          const stMatch = startTxRegex.exec(line);
          if (stMatch?.groups) {
            if (pending) pending = flushRow(pending);
            pending = makePending(stMatch);
            state = "COLLECTING";
            break;
          }
        }

        // Unmatched line in section — skip
        if (line.trim().length > 3 && /\d/.test(line)) {
          skippedLines++;
        }
        break;
      }

      case "COLLECTING": {
        // Check section end
        if (sectionEndRegex && sectionEndRegex.test(line)) {
          if (pending) pending = flushRow(pending);
          state = sectionStartRegex ? "SEEKING_SECTION" : "IN_SECTION";
          skippedLines++;
          break;
        }

        // Check if a new single-line transaction appears
        if (singleLineRegex) {
          const slMatch = singleLineRegex.exec(line);
          if (slMatch?.groups) {
            if (pending) pending = flushRow(pending);
            emitSingleLine(slMatch);
            state = "IN_SECTION";
            break;
          }
        }

        // Check if a new multi-line transaction starts (previous incomplete)
        {
          const stMatch = startTxRegex.exec(line);
          if (stMatch?.groups) {
            if (pending) pending = flushRow(pending);
            pending = makePending(stMatch);
            // Stay in COLLECTING
            break;
          }
        }

        // Try amount line — completes the current pending transaction
        if (pending) {
          const amMatch = amountRegex.exec(line);
          if (amMatch?.groups) {
            const rawAmount = parseAmount(amMatch.groups.amount, patterns.amountDecimal);
            if (rawAmount !== null) {
              // Apply sign from description keywords
              const amount =
                rawAmount < 0
                  ? rawAmount
                  : Math.abs(rawAmount) * determineSign(pending.description, signHints);
              pending.amount = amount;

              if (amMatch.groups.balance) {
                pending.balance =
                  parseAmount(amMatch.groups.balance, patterns.amountDecimal) ?? undefined;
              }

              pending = flushRow(pending);
              state = "IN_SECTION";
              break;
            }
          }

          // Continuation line — append to description
          if (line.trim().length > 0) {
            pending.description += " " + line.trim();
            pending._lastRawLine = line.trim();
          }
        }
        break;
      }
    }
  }

  // Flush last pending transaction
  if (pending) flushRow(pending);

  // 4. Quality warnings
  if (rows.length === 0 && totalLines > 10) {
    warnings.push(
      `Nessuna transazione trovata su ${totalLines} righe. Il pattern potrebbe non corrispondere al formato di questa banca.`,
    );
  } else if (matchedLines < totalLines * 0.05 && totalLines > 20 && matchedLines > 0) {
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
