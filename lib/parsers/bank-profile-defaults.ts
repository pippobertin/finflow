/**
 * Default BankLayoutPatterns for the 6 most common Italian banks.
 *
 * V2: State-machine profiles with startTransactionPattern, amountLinePattern,
 * singleLinePattern, and signHints (replaces linePattern + signConvention).
 *
 * These are the same patterns seeded into the DB via migration SQL.
 * Exported here for use in tests and as reference documentation.
 */
import type { BankLayoutPatterns } from "@/lib/validations/pdf-bank-profile";

/** Sign hints for banks with already-signed amounts (no keyword needed) */
const SIGNED_AMOUNT_HINTS: BankLayoutPatterns["signHints"] = {
  overrideIncoming: [],
  incoming: [],
  outgoing: [],
  defaultSign: "positive", // amounts already carry their sign
};

export const BANK_PROFILES: Record<string, BankLayoutPatterns> = {
  // ─── Unicredit ──────────────────────────────────────────────
  // Multi-line transactions, 2-digit years (dd.MM.yy), unsigned amounts.
  // Sign determined from description keywords.
  Unicredit: {
    sectionStartMarker: "ELENCO\\s+MOVIMENTI|Data\\s+Valuta\\s+Descrizione|LISTA\\s+MOVIMENTI",
    sectionEndMarker: "SALDO\\s+FINALE|TOTALE\\s+MOVIMENTI",

    // Line 1: two dates (dd.MM.yy) + description start
    startTransactionPattern:
      "^(?<date>\\d{2}\\.\\d{2}\\.\\d{2})\\s+(?<valuta>\\d{2}\\.\\d{2}\\.\\d{2})(?:\\s+(?<description>.+?))?\\s*$",

    // Amount line: ONLY an amount (+ optional balance) on the line — anchored with ^
    amountLinePattern: "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    // Some transactions fit on one line (dates + description + amount)
    singleLinePattern:
      "^(?<date>\\d{2}\\.\\d{2}\\.\\d{2})\\s+(?<valuta>\\d{2}\\.\\d{2}\\.\\d{2})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    signHints: {
      overrideIncoming: [
        "STORNO A VOSTRO FAVORE",
        "VOSTRA DISPOSIZIONE STORNO",
        "STORNO",
        "A VOSTRO FAVORE",
        "BONIFICO SEPA DA",
        "SALDO INIZIALE",
      ],
      incoming: [
        "BONIFICO A VOSTRO FAVORE",
        "ACCREDITO",
        "VERSAMENTO",
        "STIPENDIO",
        "STORNO ADDEBITO",
        "RIMBORSO",
        "INCASSO",
        "GIROCONTO A VOSTRO FAVORE",
      ],
      outgoing: [
        "PAGAMENTO",
        "ADDEBITO",
        "PRELIEVO",
        "BONIFICO DA VOI DISPOSTO",
        "DISPOSIZIONE DI BONIFICO",
        "COMMISSIONE",
        "CANONE",
        "UTENZE",
        "IMPOSTE",
        "RITENUTA",
        "GIROCONTO DA VOI DISPOSTO",
        "F24",
        "MAV",
        "RAV",
        "RID",
        "SDD",
      ],
      defaultSign: "negative",
    },

    dateFormat: "dd.MM.yy",
    amountDecimal: ",",
    skipPatterns: [
      "^\\s*$",
      "^Pag\\.?\\s*\\d",
      "^IBAN",
      "^Conto\\s+Corrente",
      "^Intestato",
      "^Divisa",
      "^N\\.\\s+Operazioni",
    ],
  },

  // ─── Intesa Sanpaolo ────────────────────────────────────────
  // Two-date blocks, multi-line descriptions, signed amounts.
  "Intesa Sanpaolo": {
    sectionStartMarker: null,
    sectionEndMarker: null,

    startTransactionPattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s*$",

    amountLinePattern: "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    singleLinePattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    signHints: SIGNED_AMOUNT_HINTS,

    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+Valuta",
      "SALDO\\s+INIZIALE",
      "SALDO\\s+FINALE",
      "TOTALE",
      "Pagina\\s+\\d",
      "IBAN",
    ],
  },

  // ─── BPER Banca ─────────────────────────────────────────────
  "BPER Banca": {
    sectionStartMarker: null,
    sectionEndMarker: null,

    startTransactionPattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s*$",

    amountLinePattern: "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    singleLinePattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    signHints: SIGNED_AMOUNT_HINTS,

    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    skipPatterns: ["^\\s*$", "DATA\\s+OPER", "SALDO\\s+CONTABILE", "TOTALE", "Pagina"],
  },

  // ─── MPS (Monte dei Paschi di Siena) ────────────────────────
  // Single date, signed amounts, dot-separated dates.
  MPS: {
    sectionStartMarker: null,
    sectionEndMarker: null,

    startTransactionPattern: "^(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s*$",

    amountLinePattern: "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    singleLinePattern:
      "^(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    signHints: SIGNED_AMOUNT_HINTS,

    dateFormat: "dd.MM.yyyy",
    amountDecimal: ",",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+operazione",
      "Saldo\\s+iniziale",
      "Saldo\\s+finale",
      "TOTALE",
      "Pag\\.",
    ],
  },

  // ─── Crédit Agricole ────────────────────────────────────────
  "Crédit Agricole": {
    sectionStartMarker: null,
    sectionEndMarker: null,

    startTransactionPattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s*$",

    amountLinePattern: "^\\s*(?<amount>-?[\\d.]+,\\d{2})\\s*$",

    singleLinePattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})\\s*$",

    signHints: SIGNED_AMOUNT_HINTS,

    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+Operaz",
      "SALDO",
      "TOTALE",
      "Pag\\.",
      "Estratto",
      "Conto\\s+corrente",
    ],
  },

  // ─── Banca Sella ────────────────────────────────────────────
  // Single date, compact format, no continuation lines.
  "Banca Sella": {
    sectionStartMarker: null,
    sectionEndMarker: null,

    startTransactionPattern: "^(?<date>\\d{2}/\\d{2}/\\d{2,4})\\s+(?<description>.+?)\\s*$",

    amountLinePattern: "^\\s*(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    singleLinePattern:
      "^(?<date>\\d{2}/\\d{2}/\\d{2,4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?\\s*$",

    signHints: SIGNED_AMOUNT_HINTS,

    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    skipPatterns: ["^\\s*$", "Data", "Saldo", "TOTALE", "Pag\\."],
  },
};

/** Ordered list of supported bank names */
export const SUPPORTED_BANKS = Object.keys(BANK_PROFILES);
