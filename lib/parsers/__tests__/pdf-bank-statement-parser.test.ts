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
import { BANK_PROFILES } from "../bank-profile-defaults";

// ─── Test profiles ──────────────────────────────────────────

const unicreditProfile = BANK_PROFILES["Unicredit"];

const intesaProfile = BANK_PROFILES["Intesa Sanpaolo"];

// ─── Tests ──────────────────────────────────────────────────

describe("parsePdfWithProfile — V2 state machine", () => {
  beforeEach(() => {
    mockText = "";
    mockError = null;
  });

  // ── Unicredit: multi-line transaction ───────────────────

  it("parses Unicredit multi-line transaction (2-line: dates + description, then amount)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "Data Operazione Data Valuta Descrizione",
      "03.01.25  03.01.25  BONIFICO A VOSTRO FAVORE DA MARIO ROSSI",
      "                    1.500,00     10.500,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("03.01.2025");
    expect(result.rows[0].valuta).toBe("03.01.2025");
    expect(result.rows[0].description).toContain("BONIFICO A VOSTRO FAVORE");
    expect(result.rows[0].amount).toBe(1500.0); // incoming → positive
    expect(result.rows[0].balance).toBe(10500.0);
  });

  it("parses Unicredit dates-only start line (description on next lines)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "02.01.25  02.01.25",
      "BONIFICO A VOSTRO FAVORE",
      "BONIFICO SEPA DA: CLIENTE PER: SALDO FATTURA",
      "1.234,56",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("02.01.2025");
    expect(result.rows[0].description).toContain("BONIFICO A VOSTRO FAVORE");
    expect(result.rows[0].description).toContain("SALDO FATTURA");
    expect(result.rows[0].amount).toBe(1234.56); // incoming → positive
  });

  it("parses Unicredit multi-line with continuation (3+ lines)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "07.01.25  07.01.25  PAGAMENTO FORNITORE SRL",
      "                    TRN 1234567890ABCDEF",
      "                    CAUSALE: FATTURA 2025/001",
      "                    2.300,50",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("07.01.2025");
    expect(result.rows[0].description).toContain("PAGAMENTO FORNITORE SRL");
    expect(result.rows[0].description).toContain("TRN 1234567890ABCDEF");
    expect(result.rows[0].description).toContain("FATTURA 2025/001");
    expect(result.rows[0].amount).toBe(-2300.5); // "PAGAMENTO" → negative
  });

  // ── Unicredit: single-line transaction ──────────────────

  it("parses Unicredit single-line transaction", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "15.02.25  15.02.25  ACCREDITO STIPENDIO            3.200,00     15.000,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("15.02.2025");
    expect(result.rows[0].amount).toBe(3200.0); // "ACCREDITO" → positive
    expect(result.rows[0].balance).toBe(15000.0);
  });

  // ── Unicredit: mixed single + multi-line ────────────────

  it("handles mixed single-line and multi-line transactions", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "03.01.25  03.01.25  ACCREDITO STIPENDIO            3.200,00",
      "05.01.25  05.01.25  PAGAMENTO FORNITORE ABC",
      "                    TRN 999888777",
      "                    1.100,00",
      "10.01.25  10.01.25  RIMBORSO ASSICURAZIONE          500,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].amount).toBe(3200.0); // ACCREDITO → +
    expect(result.rows[1].amount).toBe(-1100.0); // PAGAMENTO → -
    expect(result.rows[2].amount).toBe(500.0); // RIMBORSO → +
  });

  // ── Section markers ─────────────────────────────────────

  it("ignores text outside section markers", async () => {
    mockText = [
      "CONTO CORRENTE N. 12345",
      "INTESTATO A: MARIO ROSSI",
      "IBAN: IT60X0542811101000000123456",
      "",
      "LISTA MOVIMENTI",
      "03.01.25  03.01.25  VERSAMENTO CONTANTI             200,00",
      "SALDO FINALE AL 31/01/2025: 10.200,00",
      "",
      "Documento generato automaticamente",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(200.0); // VERSAMENTO → positive
  });

  // ── Sign determination ──────────────────────────────────

  it("determines sign from description keywords", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "10.03.25  10.03.25  COMMISSIONE BANCARIA TRIMESTRALE",
      "                    25,00",
      "11.03.25  11.03.25  INCASSO EFFETTO CLIENTE",
      "                    5.000,00",
      "12.03.25  12.03.25  OPERAZIONE SCONOSCIUTA",
      "                    100,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].amount).toBe(-25.0); // "COMMISSIONE" → outgoing
    expect(result.rows[1].amount).toBe(5000.0); // "INCASSO" → incoming
    expect(result.rows[2].amount).toBe(-100.0); // no match → defaultSign "negative"
  });

  // ── Override incoming: STORNO beats outgoing ───────────

  it("STORNO overrides outgoing keywords (reversal = incoming)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "15.05.25  15.05.25",
      "BONIFICO SEPA VOSTRA DISPOSIZIONE STORNO",
      "VERSO: FORNITORE SRL TRN 123456",
      "522,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    // "DISPOSIZIONE" → outgoing match, BUT "STORNO" → overrideIncoming wins
    expect(result.rows[0].amount).toBe(522.0);
  });

  it("A VOSTRO FAVORE overrides DISPOSIZIONE DI BONIFICO", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "20.06.25  20.06.25  BONIFICO A VOSTRO FAVORE          2.000,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    // "A VOSTRO FAVORE" in overrideIncoming wins over any outgoing
    expect(result.rows[0].amount).toBe(2000.0);
  });

  // ── Outgoing-first priority (ADDEBITO + Incasso, no override) ───

  it("outgoing still wins over regular incoming (no override keyword)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "01.10.25  01.10.25",
      "ADDEBITO SEPA DD PER FATTURA A VOSTRO CARICO",
      "Incasso 131982/01 DLL Renting Solutions S.R.L.",
      "230,81",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    // No overrideIncoming match → ADDEBITO outgoing wins over Incasso regular incoming
    expect(result.rows[0].amount).toBe(-230.81);
  });

  // ── Amount anchoring (COMM: 0,00 not captured) ────────

  it("does not capture inline amounts from description lines (COMM: 0,00)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "01.10.25  01.10.25",
      "BONIFICO A VOSTRO FAVORE",
      "BONIFICO SEPA DA: TRE GELSI S.N.C. PER: CUP: B68J25000240007 COMM: 0,00 SPESE: 0,00 COMM SERV: 0,00",
      "3.196,40",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(3196.4); // correct amount, not 0,00
    expect(result.rows[0].description).toContain("BONIFICO A VOSTRO FAVORE");
    expect(result.rows[0].description).toContain("COMM: 0,00"); // continuation preserved
  });

  // ── Already-signed amounts ──────────────────────────────

  it("respects already-signed (negative) amounts without applying signHints", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "20.01.25  20.01.25  ACCREDITO STIPENDIO            -500,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    // Amount is already negative — parser should keep it as -500, not flip to +500
    expect(result.rows[0].amount).toBe(-500.0);
  });

  // ── Empty PDF ───────────────────────────────────────────

  it("handles empty PDF text", async () => {
    mockText = "";

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("testo estraibile");
  });

  // ── Invalid regex ───────────────────────────────────────

  it("returns warnings for invalid startTransactionPattern", async () => {
    mockText = "some text\n";

    const badPatterns: BankLayoutPatterns = {
      ...unicreditProfile,
      startTransactionPattern: "(?<invalid_unclosed",
    };

    const result = await parsePdfWithProfile(Buffer.from("fake"), badPatterns);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("startTransactionPattern non valido"))).toBe(
      true,
    );
  });

  // ── Quality warning ─────────────────────────────────────

  it("warns when no transactions found on large document", async () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i}: some random content`);
    mockText = lines.join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("Nessuna transazione"))).toBe(true);
  });

  // ── No section markers (Intesa) ─────────────────────────

  it("works without section markers (entire text = section)", async () => {
    mockText = [
      "Data    Valuta    Descrizione                     Importo        Saldo",
      "15/01/2024  15/01/2024  BONIFICO DA MARIO ROSSI        1.500,00     10.500,00",
      "16/01/2024  16/01/2024  PAGAMENTO FORNITORE SRL       -2.300,50      8.199,50",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaProfile);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].date).toBe("15/01/2024");
    expect(result.rows[0].amount).toBe(1500.0); // signed amount, SIGNED_AMOUNT_HINTS → keep as-is
    expect(result.rows[0].balance).toBe(10500.0);
    expect(result.rows[1].amount).toBe(-2300.5);
  });

  // ── Intesa multi-line (continuation) ────────────────────

  it("handles Intesa multi-line descriptions via COLLECTING state", async () => {
    mockText = [
      "15/01/2024  15/01/2024  BONIFICO DA MARIO ROSSI",
      "                    TRN 1234567890ABCDEF",
      "                    1.500,00     10.500,00",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), intesaProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].description).toContain("BONIFICO DA MARIO ROSSI");
    expect(result.rows[0].description).toContain("TRN 1234567890ABCDEF");
    expect(result.rows[0].amount).toBe(1500.0);
  });

  // ── rawTextPreview ──────────────────────────────────────

  it("provides rawTextPreview (max 500 chars)", async () => {
    mockText = "A".repeat(1000);

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rawTextPreview.length).toBe(500);
  });

  // ── PDF parse error ─────────────────────────────────────

  it("handles PDF parse error gracefully", async () => {
    mockError = new Error("PDF corrupted");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings[0]).toContain("Errore lettura PDF");
  });

  // ── 2-digit year expansion ──────────────────────────────

  it("expands 2-digit year dates (dd.MM.yy → dd.MM.yyyy)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "31.12.99  31.12.99  ACCREDITO VECCHIO               100,00",
      "01.01.00  01.01.00  ACCREDITO NUOVO                 200,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].date).toBe("31.12.1999"); // 99 → 1999
    expect(result.rows[1].date).toBe("01.01.2000"); // 00 → 2000
  });

  // ── Skip patterns in section ────────────────────────────

  it("skips matching skipPatterns inside section", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "Pag. 1",
      "",
      "03.01.25  03.01.25  VERSAMENTO CONTANTI             500,00",
      "Pag. 2",
      "",
      "05.01.25  05.01.25  PRELIEVO BANCOMAT               100,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].amount).toBe(500.0); // VERSAMENTO → positive
    expect(result.rows[1].amount).toBe(-100.0); // PRELIEVO → negative
  });

  // ── Inline amount extraction (fallback) ────────────────

  it("extracts inline amount from last continuation line (EUR 19,76 embedded)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "05.01.25  01.10.25",
      "PAGAMENTO E-Commerce del 01/10/2025",
      "CARTA *9384 DI EUR 19,76 Google GSUITE_blmproje Milan",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(-19.76); // PAGAMENTO → negative
    expect(result.rows[0].description).toContain("CARTA *9384");
    expect(result.rows[0].description).toContain("PAGAMENTO E-Commerce");
  });

  it("strips fee metadata (COMM/SPESE) and finds real amount in description", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "10.02.25  10.02.25",
      "BONIFICO A VOSTRO FAVORE",
      "DA: CLIENTE SRL COMM: 0,00 SPESE: 0,00 IMPORTO: 1.500,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(1500.0); // COMM/SPESE stripped, IMPORTO kept
  });

  it("avoids 0,00 when fee metadata is the only content on last line", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "12.03.25  12.03.25",
      "DISPOSIZIONE DI BONIFICO VERSO: ABC SRL 1.500,00",
      "COMM: 0,00 SPESE: 0,00 COMM SERV: 0,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    // Fee line stripped → finds 1.500,00 from description, not 0,00
    expect(result.rows[0].amount).toBe(-1500.0); // DISPOSIZIONE DI BONIFICO → negative
    expect(result.rows[0].amount).not.toBe(0);
  });

  it("still uses strict amount-only line when available (no fallback needed)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "20.03.25  20.03.25",
      "ADDEBITO CANONE MENSILE",
      "50,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(-50.0); // ADDEBITO → negative, normal strict match
  });

  it("extracts inline amount at section end (flush triggers fallback)", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "15.04.25  15.04.25",
      "PRELIEVO ATM del 15/04/2025 EUR 200,00 Roma Centro",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(-200.0); // PRELIEVO → negative
  });

  // ── MAX_AMOUNT safety guard ────────────────────────────

  it("discards transactions with absurd amounts (> 10M) and warns", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "05.01.25  01.10.25  PAGAMENTO E-Commerce             21.453.835.025,48",
      "10.01.25  10.01.25  VERSAMENTO CONTANTI               500,00",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    // First transaction discarded (21 billion), second kept
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(500.0);
    expect(result.warnings.some((w) => w.includes("amount anomalo"))).toBe(true);
  });

  it("discards absurd amounts from fallback extraction too", async () => {
    mockText = [
      "LISTA MOVIMENTI",
      "05.01.25  01.10.25",
      "PAGAMENTO E-Commerce del 01/10/2025",
      "CARTA *9384 DI EUR 21.453.835.025,48 Google Milan",
      "SALDO FINALE",
    ].join("\n");

    const result = await parsePdfWithProfile(Buffer.from("fake"), unicreditProfile);

    expect(result.rows).toHaveLength(0);
    expect(result.warnings.some((w) => w.includes("amount anomalo"))).toBe(true);
  });
});
