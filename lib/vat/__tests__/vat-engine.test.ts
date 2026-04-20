/**
 * Test di non-regressione per lib/vat/vat-engine.ts
 *
 * Filosofia: fissano il comportamento ATTUALE del codice,
 * non il comportamento teorico desiderato dalla normativa.
 * Eventuali discrepanze con la spec AdE sono annotate come BUG POTENZIALE
 * e saranno gestite in ADR-004 / Fase 5.
 *
 * @see docs/adr/002-feature-flags-over-deletion.md
 */
import { describe, it, expect } from "vitest";
import {
  nextBusinessDay,
  generateVatPeriods,
  calculateVatForYear,
  getVatOutflows,
} from "../vat-engine";

// ─── Helper ──────────────────────────────────────────────────
/** Crea Date locale (mese 1-based per leggibilità nei test) */
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/** Formatta Date per assertion leggibili */
function fmt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ═════════════════════════════════════════════════════════════
// Gruppo 1: nextBusinessDay — weekend e festività italiane
// ═════════════════════════════════════════════════════════════
describe("nextBusinessDay", () => {
  it("giorno lavorativo normale → invariato", () => {
    // 2024-01-02 = Martedì, non festivo
    expect(fmt(nextBusinessDay(d(2024, 1, 2)))).toBe("2024-01-02");
  });

  it("sabato → lunedì successivo", () => {
    // 2024-01-13 = Sabato
    expect(fmt(nextBusinessDay(d(2024, 1, 13)))).toBe("2024-01-15");
  });

  it("domenica → lunedì successivo", () => {
    // 2024-01-14 = Domenica
    expect(fmt(nextBusinessDay(d(2024, 1, 14)))).toBe("2024-01-15");
  });

  // ─── Festività fisse — anno 2024 ───────────────────────────

  describe("festività italiane fisse (anno 2024)", () => {
    it("Capodanno (1 gen, lunedì) → 2 gennaio", () => {
      expect(fmt(nextBusinessDay(d(2024, 1, 1)))).toBe("2024-01-02");
    });

    it("Epifania (6 gen, sabato) → lunedì 8 gennaio", () => {
      // Il codice controlla sabato (dow===6) prima di isItalianHoliday,
      // quindi salta direttamente a lunedì 8 (che non è festivo).
      expect(fmt(nextBusinessDay(d(2024, 1, 6)))).toBe("2024-01-08");
    });

    it("Liberazione (25 apr, giovedì) → 26 aprile", () => {
      expect(fmt(nextBusinessDay(d(2024, 4, 25)))).toBe("2024-04-26");
    });

    it("Festa del Lavoro (1 mag, mercoledì) → 2 maggio", () => {
      expect(fmt(nextBusinessDay(d(2024, 5, 1)))).toBe("2024-05-02");
    });

    it("Festa della Repubblica (2 giu, domenica) → 3 giugno", () => {
      // domenica → +1 = lunedì 3 giu (non festivo)
      expect(fmt(nextBusinessDay(d(2024, 6, 2)))).toBe("2024-06-03");
    });

    it("Ferragosto (15 ago, giovedì) → 16 agosto", () => {
      expect(fmt(nextBusinessDay(d(2024, 8, 15)))).toBe("2024-08-16");
    });

    it("Ognissanti (1 nov, venerdì) → 4 novembre (festivo → sab → lun)", () => {
      // 1 nov (festivo, ven) → +1 = 2 nov (sabato) → +2 = 4 nov (lunedì)
      expect(fmt(nextBusinessDay(d(2024, 11, 1)))).toBe("2024-11-04");
    });

    it("Immacolata (8 dic, domenica) → 9 dicembre", () => {
      // domenica → +1 = lunedì 9 dic (non festivo)
      expect(fmt(nextBusinessDay(d(2024, 12, 8)))).toBe("2024-12-09");
    });

    it("Natale (25 dic, mercoledì) → 27 dic (salta anche Santo Stefano)", () => {
      // 25 dic (festivo) → +1 = 26 dic (Santo Stefano, festivo) → +1 = 27 dic (venerdì)
      expect(fmt(nextBusinessDay(d(2024, 12, 25)))).toBe("2024-12-27");
    });

    it("Santo Stefano (26 dic, giovedì) → 27 dicembre", () => {
      expect(fmt(nextBusinessDay(d(2024, 12, 26)))).toBe("2024-12-27");
    });
  });

  // ─── Pasquetta (Easter Monday via Computus) ────────────────

  describe("Pasquetta (algoritmo Computus)", () => {
    it("2024: Pasquetta 1 aprile (lunedì) → 2 aprile", () => {
      // Pasqua 2024 = 31 marzo (domenica), Pasquetta = 1 aprile
      expect(fmt(nextBusinessDay(d(2024, 4, 1)))).toBe("2024-04-02");
    });

    it("2025: Pasquetta 21 aprile (lunedì) → 22 aprile", () => {
      // Pasqua 2025 = 20 aprile (domenica), Pasquetta = 21 aprile
      expect(fmt(nextBusinessDay(d(2025, 4, 21)))).toBe("2025-04-22");
    });

    // BUG POTENZIALE: isItalianHoliday non riconosce la Domenica di Pasqua come
    // festività (solo Pasquetta). Irrilevante per nextBusinessDay perché la domenica
    // viene già saltata, ma isItalianHoliday è tecnicamente incompleta per altri usi.
    // Vedi ADR-004 da aprire.
  });
});

// ═════════════════════════════════════════════════════════════
// Gruppo 2: generateVatPeriods — regime mensile
// ═════════════════════════════════════════════════════════════
describe("generateVatPeriods (mensile)", () => {
  const periods = generateVatPeriods(2024, "monthly");

  it("genera esattamente 12 periodi", () => {
    expect(periods).toHaveLength(12);
  });

  it("tutti i periodi hanno periodType 'monthly'", () => {
    periods.forEach((p) => expect(p.periodType).toBe("monthly"));
  });

  it("nessuna maggiorazione (surchargeRate = 0 per tutti)", () => {
    periods.forEach((p) => expect(p.surchargeRate).toBe(0));
  });

  it("ogni periodo copre esattamente un mese solare", () => {
    // Gennaio
    expect(fmt(periods[0].periodStart)).toBe("2024-01-01");
    expect(fmt(periods[0].periodEnd)).toBe("2024-01-31");
    // Febbraio 2024 (anno bisestile → 29 giorni)
    expect(fmt(periods[1].periodStart)).toBe("2024-02-01");
    expect(fmt(periods[1].periodEnd)).toBe("2024-02-29");
    // Dicembre
    expect(fmt(periods[11].periodStart)).toBe("2024-12-01");
    expect(fmt(periods[11].periodEnd)).toBe("2024-12-31");
  });

  it("scadenze: 16 del mese successivo, aggiustate per weekend/festivi", () => {
    // Gennaio → 16 feb (venerdì) → invariato
    expect(fmt(periods[0].dueDate)).toBe("2024-02-16");
    // Febbraio → 16 mar (sabato) → lunedì 18
    expect(fmt(periods[1].dueDate)).toBe("2024-03-18");
    // Marzo → 16 apr (martedì) → invariato
    expect(fmt(periods[2].dueDate)).toBe("2024-04-16");
    // Aprile → 16 mag (giovedì) → invariato
    expect(fmt(periods[3].dueDate)).toBe("2024-05-16");
    // Maggio → 16 giu (domenica) → lunedì 17
    expect(fmt(periods[4].dueDate)).toBe("2024-06-17");
    // Giugno → 16 lug (martedì) → invariato
    expect(fmt(periods[5].dueDate)).toBe("2024-07-16");
    // Luglio → 16 ago (venerdì) → invariato
    expect(fmt(periods[6].dueDate)).toBe("2024-08-16");
    // Agosto → 16 set (lunedì) → invariato
    expect(fmt(periods[7].dueDate)).toBe("2024-09-16");
    // Settembre → 16 ott (mercoledì) → invariato
    expect(fmt(periods[8].dueDate)).toBe("2024-10-16");
    // Ottobre → 16 nov (sabato) → lunedì 18
    expect(fmt(periods[9].dueDate)).toBe("2024-11-18");
    // Novembre → 16 dic (lunedì) → invariato
    expect(fmt(periods[10].dueDate)).toBe("2024-12-16");
    // Dicembre → 16 gen 2025 (giovedì) → invariato
    expect(fmt(periods[11].dueDate)).toBe("2025-01-16");
  });

  it("label con nome mese italiano e anno", () => {
    expect(periods[0].label).toBe("Gennaio 2024");
    expect(periods[3].label).toBe("Aprile 2024");
    expect(periods[7].label).toBe("Agosto 2024");
    expect(periods[11].label).toBe("Dicembre 2024");
  });
});

// ═════════════════════════════════════════════════════════════
// Gruppo 3: generateVatPeriods — regime trimestrale
// ═════════════════════════════════════════════════════════════
describe("generateVatPeriods (trimestrale)", () => {
  const periods = generateVatPeriods(2024, "quarterly");

  it("genera esattamente 4 periodi", () => {
    expect(periods).toHaveLength(4);
  });

  it("tutti i periodi hanno periodType 'quarterly'", () => {
    periods.forEach((p) => expect(p.periodType).toBe("quarterly"));
  });

  it("Q1: gen–mar, scadenza 16 maggio 2024", () => {
    expect(fmt(periods[0].periodStart)).toBe("2024-01-01");
    expect(fmt(periods[0].periodEnd)).toBe("2024-03-31");
    // 16 mag 2024 = giovedì, non festivo → invariato
    expect(fmt(periods[0].dueDate)).toBe("2024-05-16");
    expect(periods[0].surchargeRate).toBe(0);
    expect(periods[0].label).toBe("I Trimestre 2024");
  });

  it("Q2: apr–giu, scadenza 20 agosto 2024 (proroga feriale)", () => {
    expect(fmt(periods[1].periodStart)).toBe("2024-04-01");
    expect(fmt(periods[1].periodEnd)).toBe("2024-06-30");
    // 20 ago 2024 = martedì → invariato
    expect(fmt(periods[1].dueDate)).toBe("2024-08-20");
    expect(periods[1].surchargeRate).toBe(0);
    expect(periods[1].label).toBe("II Trimestre 2024");
  });

  it("Q3: lug–set, scadenza 16 novembre (sabato → lunedì 18)", () => {
    expect(fmt(periods[2].periodStart)).toBe("2024-07-01");
    expect(fmt(periods[2].periodEnd)).toBe("2024-09-30");
    // 16 nov 2024 = sabato → lunedì 18
    expect(fmt(periods[2].dueDate)).toBe("2024-11-18");
    expect(periods[2].surchargeRate).toBe(0);
    expect(periods[2].label).toBe("III Trimestre 2024");
  });

  it("Q4: ott–dic, scadenza 16 marzo anno successivo + maggiorazione 1%", () => {
    expect(fmt(periods[3].periodStart)).toBe("2024-10-01");
    expect(fmt(periods[3].periodEnd)).toBe("2024-12-31");
    // 16 mar 2025 = domenica → lunedì 17
    expect(fmt(periods[3].dueDate)).toBe("2025-03-17");
    expect(periods[3].surchargeRate).toBe(1.0);
    expect(periods[3].label).toBe("IV Trimestre 2024");
  });

  it("cross-check anno 2025: tutte le scadenze corrette", () => {
    const p2025 = generateVatPeriods(2025, "quarterly");
    // Q1: 16 mag 2025 (venerdì) → invariato
    expect(fmt(p2025[0].dueDate)).toBe("2025-05-16");
    // Q2: 20 ago 2025 (mercoledì) → invariato
    expect(fmt(p2025[1].dueDate)).toBe("2025-08-20");
    // Q3: 16 nov 2025 (domenica) → lunedì 17
    expect(fmt(p2025[2].dueDate)).toBe("2025-11-17");
    // Q4: 16 mar 2026 (lunedì) → invariato
    expect(fmt(p2025[3].dueDate)).toBe("2026-03-16");
  });
});

// ═════════════════════════════════════════════════════════════
// Gruppo 4: calculateVatForYear — logica liquidazione IVA
// ═════════════════════════════════════════════════════════════
describe("calculateVatForYear", () => {
  // Fixture: periodi trimestrali 2024
  const periods = generateVatPeriods(2024, "quarterly");

  it("solo fatture attive → IVA a debito, amountDue positivo", () => {
    const invoices = [
      { direction: "ACTIVE", vatAmount: 2200, date: d(2024, 2, 15) }, // Q1
    ];
    const results = calculateVatForYear(periods, invoices);
    const q1 = results[0];
    expect(q1.vatDebit).toBe(2200);
    expect(q1.vatCredit).toBe(0);
    expect(q1.vatBalance).toBe(2200);
    expect(q1.amountDue).toBe(2200);
    expect(q1.creditCarriedOut).toBe(0);
  });

  it("solo fatture passive → credito riportato, amountDue = 0", () => {
    const invoices = [
      { direction: "PASSIVE", vatAmount: 1500, date: d(2024, 1, 20) }, // Q1
    ];
    const results = calculateVatForYear(periods, invoices);
    const q1 = results[0];
    expect(q1.vatDebit).toBe(0);
    expect(q1.vatCredit).toBe(1500);
    expect(q1.vatBalance).toBe(-1500);
    expect(q1.amountDue).toBe(0);
    expect(q1.creditCarriedOut).toBe(1500);
  });

  it("il credito del periodo N riduce il debito del periodo N+1", () => {
    const invoices = [
      // Q1: solo credito → carry forward 1000
      { direction: "PASSIVE", vatAmount: 1000, date: d(2024, 2, 10) },
      // Q2: debito lordo 800, netto dopo carry = 800 − 1000 = −200 → ancora credito
      { direction: "ACTIVE", vatAmount: 800, date: d(2024, 5, 15) },
    ];
    const results = calculateVatForYear(periods, invoices);

    // Q1
    expect(results[0].amountDue).toBe(0);
    expect(results[0].creditCarriedOut).toBe(1000);

    // Q2
    expect(results[1].carryForward).toBe(1000);
    expect(results[1].vatBalance).toBe(800);
    expect(results[1].amountDue).toBe(0);
    expect(results[1].creditCarriedOut).toBe(200);
  });

  it("Q4 trimestrale: maggiorazione 1% sul netto positivo", () => {
    const invoices = [
      { direction: "ACTIVE", vatAmount: 5000, date: d(2024, 11, 15) }, // Q4
      { direction: "PASSIVE", vatAmount: 2000, date: d(2024, 10, 20) }, // Q4
    ];
    const results = calculateVatForYear(periods, invoices);
    const q4 = results[3];

    expect(q4.vatBalance).toBe(3000);
    // Surcharge: Math.round(3000 × 0.01 × 100) / 100 = 30.00
    expect(q4.surchargeAmount).toBe(30);
    // AmountDue: 3000 + 30 = 3030
    expect(q4.amountDue).toBe(3030);
  });

  it("nessuna fattura → tutti i campi a zero", () => {
    const results = calculateVatForYear(periods, []);
    results.forEach((r) => {
      expect(r.vatDebit).toBe(0);
      expect(r.vatCredit).toBe(0);
      expect(r.vatBalance).toBe(0);
      expect(r.amountDue).toBe(0);
      expect(r.creditCarriedOut).toBe(0);
      expect(r.surchargeAmount).toBe(0);
    });
  });

  it("initialCarryForward riduce il debito del primo periodo", () => {
    const invoices = [
      { direction: "ACTIVE", vatAmount: 1000, date: d(2024, 1, 15) }, // Q1
    ];
    const results = calculateVatForYear(periods, invoices, 400);
    const q1 = results[0];
    expect(q1.carryForward).toBe(400);
    expect(q1.amountDue).toBe(600); // 1000 − 400
    expect(q1.creditCarriedOut).toBe(0);
  });

  it("arrotondamento a 2 decimali su tutti gli importi", () => {
    const invoices = [
      { direction: "ACTIVE", vatAmount: 100.456, date: d(2024, 2, 10) }, // Q1
      { direction: "PASSIVE", vatAmount: 33.331, date: d(2024, 2, 10) }, // Q1
    ];
    const results = calculateVatForYear(periods, invoices);
    const q1 = results[0];

    // vatDebit: round(100.456) → 100.46
    expect(q1.vatDebit).toBe(100.46);
    // vatCredit: round(33.331) → 33.33
    expect(q1.vatCredit).toBe(33.33);
    // vatBalance: round(100.456 − 33.331 = 67.125) → 67.13
    expect(q1.vatBalance).toBe(67.13);
    expect(q1.amountDue).toBe(67.13);
  });
});

// ═════════════════════════════════════════════════════════════
// Gruppo 5: getVatOutflows — output per cashflow forecast
// ═════════════════════════════════════════════════════════════
describe("getVatOutflows", () => {
  const periods = generateVatPeriods(2024, "quarterly");

  it("include solo periodi con amountDue > 0", () => {
    const calculations = calculateVatForYear(periods, [
      { direction: "ACTIVE", vatAmount: 2000, date: d(2024, 2, 15) }, // Q1 → debito
      // Q2–Q4: nessuna fattura → amountDue = 0
    ]);
    const outflows = getVatOutflows(calculations, d(2024, 1, 1));
    expect(outflows).toHaveLength(1);
    expect(outflows[0].periodLabel).toBe("I Trimestre 2024");
  });

  it("esclude scadenze passate rispetto a today", () => {
    const calculations = calculateVatForYear(periods, [
      { direction: "ACTIVE", vatAmount: 2000, date: d(2024, 2, 15) }, // Q1 → scad. 16 mag
      { direction: "ACTIVE", vatAmount: 3000, date: d(2024, 5, 15) }, // Q2 → scad. 20 ago
    ]);
    // today = 1 luglio: Q1 (16 maggio) è passato, Q2 (20 agosto) è futuro
    const outflows = getVatOutflows(calculations, d(2024, 7, 1));
    expect(outflows).toHaveLength(1);
    expect(outflows[0].periodLabel).toBe("II Trimestre 2024");
  });

  it("formato output: date yyyy-MM-dd, label con prefisso, amount numerico", () => {
    const calculations = calculateVatForYear(periods, [
      { direction: "ACTIVE", vatAmount: 1000, date: d(2024, 2, 15) }, // Q1
    ]);
    const outflows = getVatOutflows(calculations, d(2024, 1, 1));
    expect(outflows[0]).toEqual({
      date: "2024-05-16",
      amount: 1000,
      label: "Versamento IVA — I Trimestre 2024",
      periodLabel: "I Trimestre 2024",
    });
  });

  it("lista vuota se nessun periodo ha debito", () => {
    const calculations = calculateVatForYear(periods, []);
    const outflows = getVatOutflows(calculations, d(2024, 1, 1));
    expect(outflows).toHaveLength(0);
  });
});
