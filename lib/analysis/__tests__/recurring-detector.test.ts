import { describe, it, expect } from "vitest";
import { normalizeDescription, tokenize, tokenSimilarity } from "../recurring-detector";

describe("normalizeDescription", () => {
  it("removes dates in DD/MM/YYYY format", () => {
    const result = normalizeDescription("PAGAMENTO 15/01/2024 FORNITORE");
    expect(result).not.toContain("15/01/2024");
    expect(result).toContain("PAGAMENTO");
    expect(result).toContain("FORNITORE");
  });

  it("removes dates in DD.MM.YYYY format", () => {
    const result = normalizeDescription("BONIFICO 15.01.2024 ROSSI");
    expect(result).not.toContain("15.01.2024");
  });

  it("removes dates in DD-MM-YYYY format", () => {
    const result = normalizeDescription("PAGAMENTO 15-01-2024 SRL");
    expect(result).not.toContain("15-01-2024");
  });

  it("removes Italian-formatted amounts (1.234,56)", () => {
    const result = normalizeDescription("BONIFICO 1.234,56 EURO");
    expect(result).not.toContain("1.234,56");
  });

  it("removes TRN references", () => {
    const result = normalizeDescription("BONIFICO TRN ABC123DEF456 DA ROSSI");
    expect(result).not.toContain("TRN");
    expect(result).not.toContain("ABC123DEF456");
  });

  it("removes MANDATO references", () => {
    const result = normalizeDescription("PAGAMENTO MANDATO 12345678 FORNITORE");
    expect(result).not.toContain("MANDATO");
    expect(result).not.toContain("12345678");
  });

  it("removes long numeric sequences", () => {
    const result = normalizeDescription("PAGAMENTO 123456789012 BOLLETTA");
    expect(result).not.toContain("123456789012");
  });

  it("normalizes whitespace", () => {
    const result = normalizeDescription("PAGAMENTO   FORNITORE    SRL");
    expect(result).toBe("PAGAMENTO FORNITORE SRL");
  });

  it("converts to uppercase", () => {
    const result = normalizeDescription("Pagamento fornitore");
    expect(result).toBe("PAGAMENTO FORNITORE");
  });

  it("handles empty string", () => {
    expect(normalizeDescription("")).toBe("");
  });
});

describe("tokenize", () => {
  it("splits into lowercase words", () => {
    const tokens = tokenize("PAGAMENTO FORNITORE SRL");
    expect(tokens).toContain("pagamento");
    expect(tokens).toContain("fornitore");
    expect(tokens).toContain("srl");
  });

  it("filters out short words (length ≤ 2)", () => {
    const tokens = tokenize("PAGAMENTO DI UN FORNITORE");
    expect(tokens).not.toContain("di");
    expect(tokens).not.toContain("un");
    expect(tokens).toContain("pagamento");
    expect(tokens).toContain("fornitore");
  });

  it("returns empty set for empty string", () => {
    expect(tokenize("").size).toBe(0);
  });

  it("deduplicates tokens", () => {
    const tokens = tokenize("PAGAMENTO PAGAMENTO PAGAMENTO");
    expect(tokens.size).toBe(1);
  });
});

describe("tokenSimilarity (Jaccard)", () => {
  it("returns 1.0 for identical sets", () => {
    const a = tokenize("PAGAMENTO FORNITORE SRL");
    const b = tokenize("PAGAMENTO FORNITORE SRL");
    expect(tokenSimilarity(a, b)).toBe(1);
  });

  it("returns 0 for completely different sets", () => {
    const a = tokenize("PAGAMENTO FORNITORE");
    const b = tokenize("STIPENDIO DIPENDENTE");
    expect(tokenSimilarity(a, b)).toBe(0);
  });

  it("returns correct partial overlap", () => {
    const a = tokenize("PAGAMENTO FORNITORE ROSSI");
    const b = tokenize("PAGAMENTO FORNITORE BIANCHI");
    // intersection: pagamento, fornitore (2)
    // union: pagamento, fornitore, rossi, bianchi (4)
    // Jaccard: 2/4 = 0.5
    expect(tokenSimilarity(a, b)).toBe(0.5);
  });

  it("returns 1 for two empty sets", () => {
    expect(tokenSimilarity(new Set(), new Set())).toBe(1);
  });

  it("returns 0 when one set is empty", () => {
    const a = tokenize("PAGAMENTO");
    expect(tokenSimilarity(a, new Set())).toBe(0);
  });

  it("similarity ≥ 0.7 for similar descriptions", () => {
    const a = tokenize("BONIFICO SEPA DA ROSSI MARIO SRL");
    const b = tokenize("BONIFICO SEPA DA ROSSI MARIO");
    expect(tokenSimilarity(a, b)).toBeGreaterThanOrEqual(0.7);
  });

  it("similarity < 0.5 for different expense types", () => {
    const a = tokenize("CANONE MENSILE TELECOM ITALIA");
    const b = tokenize("PAGAMENTO BOLLETTA ENEL ENERGIA");
    expect(tokenSimilarity(a, b)).toBeLessThan(0.5);
  });
});
