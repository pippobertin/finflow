/**
 * Default BankLayoutPatterns for the 6 most common Italian banks.
 *
 * These are the same patterns seeded into the DB via migration SQL.
 * Exported here for use in tests and as reference documentation.
 *
 * Pattern design notes:
 * - Italian bank PDFs typically have: Data Operazione, Data Valuta, Descrizione, Importo, Saldo
 * - Amounts use Italian format: 1.234,56 (dot as thousands, comma as decimal)
 * - Dates vary: dd/MM/yyyy (most common), dd.MM.yyyy (Unicredit, MPS)
 * - Multi-line descriptions are common for Intesa and Crédit Agricole
 * - These are pragmatic approximations — the controller can fine-tune per studio
 */
import type { BankLayoutPatterns } from "@/lib/validations/pdf-bank-profile";

export const BANK_PROFILES: Record<string, BankLayoutPatterns> = {
  "Intesa Sanpaolo": {
    linePattern:
      "(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})",
    continuationPattern: "^\\s{10,}(?<text>.+)$",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+Valuta",
      "SALDO\\s+INIZIALE",
      "SALDO\\s+FINALE",
      "TOTALE",
      "Pagina\\s+\\d",
      "IBAN",
    ],
    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    signConvention: "signed",
  },

  Unicredit: {
    linePattern:
      "(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<valuta>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.{20,60})\\s+(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
    continuationPattern: "^\\s{20,}(?<text>.+)$",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+Valuta",
      "Saldo\\s+iniziale",
      "Saldo\\s+finale",
      "TOTALE",
      "Pag\\.?\\s*\\d",
    ],
    dateFormat: "dd.MM.yyyy",
    amountDecimal: ",",
    signConvention: "signed",
  },

  "BPER Banca": {
    linePattern:
      "(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
    continuationPattern: "^\\s{8,}(?<text>.+)$",
    skipPatterns: ["^\\s*$", "DATA\\s+OPER", "SALDO\\s+CONTABILE", "TOTALE", "Pagina"],
    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    signConvention: "signed",
  },

  MPS: {
    linePattern:
      "(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
    continuationPattern: "^\\s{6,}(?<text>.+)$",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+operazione",
      "Saldo\\s+iniziale",
      "Saldo\\s+finale",
      "TOTALE",
      "Pag\\.",
    ],
    dateFormat: "dd.MM.yyyy",
    amountDecimal: ",",
    signConvention: "signed",
  },

  "Crédit Agricole": {
    linePattern:
      "(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})",
    continuationPattern: "^\\s{12,}(?<text>.+)$",
    skipPatterns: [
      "^\\s*$",
      "Data\\s+Operaz",
      "SALDO",
      "TOTALE",
      "Pag\\.",
      "Estratto",
      "Conto\\s+corrente",
    ],
    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    signConvention: "signed",
  },

  "Banca Sella": {
    linePattern:
      "(?<date>\\d{2}/\\d{2}/\\d{2,4})\\s+(?<description>.+?)\\s{2,}(?<amount>-?[\\d.]+,\\d{2})(?:\\s+(?<balance>-?[\\d.]+,\\d{2}))?",
    continuationPattern: null,
    skipPatterns: ["^\\s*$", "Data", "Saldo", "TOTALE", "Pag\\."],
    dateFormat: "dd/MM/yyyy",
    amountDecimal: ",",
    signConvention: "signed",
  },
};

/** Ordered list of supported bank names */
export const SUPPORTED_BANKS = Object.keys(BANK_PROFILES);
