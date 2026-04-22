import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BankLayoutPatterns } from "@/lib/validations/pdf-bank-profile";

// Module-level mock text holder
let mockText = "";
let mockError: Error | null = null;

// Mock PDFParse as a class
vi.mock("pdf-parse", () => ({
  PDFParse: class MockPDFParse {
    async getText() {
      if (mockError) throw mockError;
      return { text: mockText };
    }
    async destroy() {}
  },
}));

import { parsePdfWithProfile } from "../pdf-bank-statement-parser";

const intesaPatterns: BankLayoutPatterns = {
  linePattern:
    "^(?<date>\\d{2}/\\d{2}/\\d{4})\\s+(?<valuta>\\d{2}/\\d{2}/\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>[\\-]?[\\d\\.]+,\\d{2})(?:\\s+(?<balance>[\\-]?[\\d\\.]+,\\d{2}))?$",
  continuationPattern: "^\\s{10,}(?<text>.+)$",
  skipPatterns: ["^\\s*$", "Data\\s+Valuta", "Pagina\\s+\\d", "SALDO\\s+(INIZIALE|FINALE)"],
  dateFormat: "dd/MM/yyyy",
  amountDecimal: ",",
  signConvention: "signed",
};

describe("parsePdfWithProfile", () => {
  beforeEach(() => {
    mockText = "";
    mockError = null;
  });

  it("parses simple Intesa Sanpaolo-style rows", async () => {
    mockText = [
      "Data    Valuta    Descrizione                     Importo        Saldo",
      "15/01/2024  15/01/2024  BONIFICO DA MARIO ROSSI        1.500,00     10.500,00",
      "16/01/2024  16/01/2024  PAGAMENTO FORNITORE SRL       -2.300,50      8.199,50",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].date).toBe("15/01/2024");
    expect(result.rows[0].amount).toBe(1500.0);
    expect(result.rows[0].balance).toBe(10500.0);
    expect(result.rows[0].description).toContain("BONIFICO DA MARIO ROSSI");
    expect(result.rows[1].amount).toBe(-2300.5);
  });

  it("handles continuation lines (multi-line descriptions)", async () => {
    mockText = [
      "15/01/2024  15/01/2024  BONIFICO DA MARIO ROSSI        1.500,00     10.500,00",
      "                    TRN 1234567890ABCDEF",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].description).toContain("TRN 1234567890ABCDEF");
  });

  it("skips header/footer lines", async () => {
    mockText = [
      "Data    Valuta    Descrizione    Importo    Saldo",
      "Pagina 1 di 3",
      "SALDO INIZIALE AL 01/01/2024: 10.000,00",
      "15/01/2024  15/01/2024  PAGAMENTO                     -500,00      9.500,00",
      "SALDO FINALE AL 31/01/2024: 9.500,00",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rows).toHaveLength(1);
    expect(result.skippedLines).toBeGreaterThan(0);
  });

  it("handles empty PDF text", async () => {
    mockText = "";

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("testo estraibile");
  });

  it("returns warnings for invalid linePattern", async () => {
    mockText = "some text\n";

    const badPatterns: BankLayoutPatterns = {
      ...intesaPatterns,
      linePattern: "(?<invalid_unclosed",
    };

    const result = await parsePdfWithProfile(Buffer.from("fake"), badPatterns);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("linePattern non valido"))).toBe(true);
  });

  it("returns quality warning when no transactions found on large document", async () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i}: some random content`);
    mockText = lines.join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("Nessuna transazione"))).toBe(true);
  });

  it("handles dot decimal format (MPS style)", async () => {
    const mpsPatterns: BankLayoutPatterns = {
      linePattern:
        "^(?<date>\\d{2}\\.\\d{2}\\.\\d{4})\\s+(?<description>.+?)\\s{2,}(?<amount>[\\-]?[\\d,]+\\.\\d{2})$",
      skipPatterns: ["^\\s*$"],
      dateFormat: "dd.MM.yyyy",
      amountDecimal: ".",
      signConvention: "signed",
    };

    mockText = "15.01.2024  PAGAMENTO FORNITORE              -1,500.00\n";

    const result = await parsePdfWithProfile(Buffer.from("fake"), mpsPatterns);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("15.01.2024");
    expect(result.rows[0].amount).toBe(-1500.0);
  });

  it("handles 2-digit year expansion", async () => {
    const patterns: BankLayoutPatterns = {
      linePattern:
        "^(?<date>\\d{2}/\\d{2}/\\d{2})\\s+(?<description>.+?)\\s{2,}(?<amount>[\\-]?[\\d\\.]+,\\d{2})$",
      skipPatterns: ["^\\s*$"],
      dateFormat: "dd/MM/yy",
      amountDecimal: ",",
      signConvention: "signed",
    };

    mockText = "15/01/24  PAGAMENTO                          -500,00\n";

    const result = await parsePdfWithProfile(Buffer.from("fake"), patterns);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("15/01/2024");
  });

  it("provides rawTextPreview (max 500 chars)", async () => {
    mockText = "A".repeat(1000);

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rawTextPreview.length).toBe(500);
  });

  it("handles PDF parse error gracefully", async () => {
    mockError = new Error("PDF corrupted");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings[0]).toContain("Errore lettura PDF");
  });

  it("passes through PDF parse successfully", async () => {
    mockText = "No matching lines here";

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaPatterns);

    expect(result.totalLines).toBeGreaterThan(0);
  });
});
