import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { parseTrialBalanceExcel } from "../cdg-trial-balance-parser";

// ─── Helpers ────────────────────────────────────────────────

/** Build a minimal xlsx Buffer from an array of arrays */
function buildXlsx(data: unknown[][], sheetName: string = "1-BV"): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─── Fixtures ───────────────────────────────────────────────

const BASIC_DATA = [
  ["Conto", "S/Conto", "Descrizione", "Dare", "Avere"],
  ["55.01.19", "", "Oneri accessori su acquisti", 33, 0],
  ["03.03.03", "", "Software capitalizzato", 5000, 0],
  ["57.09.01", "", "Interessi bancari", 0, 120],
];

const NO_DATA_ROWS = [
  ["Conto", "S/Conto", "Descrizione", "Dare", "Avere"],
  ["TOTALE", "", "", 5033, 120],
  ["", "", "Note varie", 0, 0],
];

const MIXED_FORMAT_DATA = [
  ["Conto", "S/Conto", "Descrizione", "Dare", "Avere"],
  ["10.01.01", "", "Valore con spazi", "1 234", ""],
  ["10.01.02", "", "Valore italiano", "1.234,56", ""],
  ["10.01.03", "", "Valore plain", 500, 0],
];

// ─── Tests ──────────────────────────────────────────────────

describe("parseTrialBalanceExcel", () => {
  describe("basic parsing", () => {
    it("parses rows with valid account codes", () => {
      const buf = buildXlsx(BASIC_DATA);
      const result = parseTrialBalanceExcel(buf);

      expect(result.errors).toHaveLength(0);
      expect(result.rows).toHaveLength(3);

      expect(result.rows[0]).toEqual({
        accountCode: "55.01.19",
        accountName: "Oneri accessori su acquisti",
        debit: 33,
        credit: 0,
        balance: 33,
      });

      expect(result.rows[2]).toEqual({
        accountCode: "57.09.01",
        accountName: "Interessi bancari",
        debit: 0,
        credit: 120,
        balance: -120,
      });
    });

    it("calculates totals correctly", () => {
      const buf = buildXlsx(BASIC_DATA);
      const result = parseTrialBalanceExcel(buf);

      expect(result.totals).toEqual({
        debit: 5033,
        credit: 120,
        balance: 4913,
      });
    });

    it("returns sheet name used", () => {
      const buf = buildXlsx(BASIC_DATA);
      const result = parseTrialBalanceExcel(buf);
      expect(result.sheetName).toBe("1-BV");
    });
  });

  describe("row filtering", () => {
    it("skips header and non-account rows", () => {
      const buf = buildXlsx(NO_DATA_ROWS);
      const result = parseTrialBalanceExcel(buf);

      expect(result.rows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Nessuna riga valida");
    });

    it("skips rows where both Dare and Avere are null/zero", () => {
      const data = [
        ["Conto", "S/Conto", "Descrizione", "Dare", "Avere"],
        ["10.01.01", "", "Con importo", 100, 0],
        ["10.01.02", "", "Senza importo", null, null],
        ["10.01.03", "", "Altro importo", 0, 50],
      ];
      const buf = buildXlsx(data);
      const result = parseTrialBalanceExcel(buf);

      expect(result.rows).toHaveLength(2);
      expect(result.warnings.some((w) => w.message.includes("10.01.02"))).toBe(true);
    });
  });

  describe("number parsing", () => {
    it("handles space-separated thousands", () => {
      const buf = buildXlsx(MIXED_FORMAT_DATA);
      const result = parseTrialBalanceExcel(buf);

      expect(result.rows[0].debit).toBe(1234);
    });

    it("handles Italian comma decimal format", () => {
      const buf = buildXlsx(MIXED_FORMAT_DATA);
      const result = parseTrialBalanceExcel(buf);

      expect(result.rows[1].debit).toBe(1234.56);
    });

    it("handles plain numbers", () => {
      const buf = buildXlsx(MIXED_FORMAT_DATA);
      const result = parseTrialBalanceExcel(buf);

      expect(result.rows[2].debit).toBe(500);
    });
  });

  describe("custom sheet name", () => {
    it("reads from a different sheet when specified", () => {
      const buf = buildXlsx(BASIC_DATA, "Custom-Sheet");
      const result = parseTrialBalanceExcel(buf, {
        sheetName: "Custom-Sheet",
      });

      expect(result.errors).toHaveLength(0);
      expect(result.rows).toHaveLength(3);
      expect(result.sheetName).toBe("Custom-Sheet");
    });

    it("returns error when sheet not found", () => {
      const buf = buildXlsx(BASIC_DATA, "Other");
      const result = parseTrialBalanceExcel(buf, { sheetName: "Missing" });

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Missing");
      expect(result.errors[0].message).toContain("Other");
    });
  });

  describe("error handling", () => {
    it("returns error for invalid buffer", () => {
      const result = parseTrialBalanceExcel(Buffer.from("not an excel file"));

      // SheetJS may parse garbage as a workbook with a default sheet,
      // so we get either a read error or a missing-sheet/no-rows error
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("warns about missing description", () => {
      const data = [
        ["Conto", "S/Conto", "Descrizione", "Dare", "Avere"],
        ["10.01.01", "", "", 100, 0],
      ];
      const buf = buildXlsx(data);
      const result = parseTrialBalanceExcel(buf);

      expect(result.rows).toHaveLength(1);
      expect(result.warnings.some((w) => w.message.includes("senza descrizione"))).toBe(true);
    });
  });

  describe("integration - real BLM file", () => {
    const filePath = path.resolve(__dirname, "../../../cowork/Modello CDG settembre 2025.xlsx");
    const fileExists = fs.existsSync(filePath);

    it.skipIf(!fileExists)("parses the real BLM trial balance file", () => {
      const buf = fs.readFileSync(filePath);
      const result = parseTrialBalanceExcel(buf);

      expect(result.errors).toHaveLength(0);
      expect(result.rows.length).toBeGreaterThan(30);

      // Every row must have a valid account code
      for (const row of result.rows) {
        expect(row.accountCode).toMatch(/^\d{2}\.\d{2}\.\d{2}$/);
        expect(row.debit).toBeGreaterThanOrEqual(0);
        expect(row.credit).toBeGreaterThanOrEqual(0);
      }

      // Totals must be positive
      expect(result.totals.debit).toBeGreaterThan(0);
      expect(result.totals.credit).toBeGreaterThanOrEqual(0);
    });
  });
});
