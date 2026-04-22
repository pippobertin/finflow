/**
 * Engine IVA — Calcolo scadenze e saldi IVA per normativa italiana.
 *
 * Regime mensile: versamento entro il 16 del mese successivo
 * Regime trimestrale:
 *   Q1 (gen-mar) → 16 maggio
 *   Q2 (apr-giu) → 16 agosto (proroga 20 agosto)
 *   Q3 (lug-set) → 16 novembre
 *   Q4 (ott-dic) → 16 marzo anno successivo + maggiorazione 1%
 *
 * Se il 16 cade di sabato o festivo → primo giorno lavorativo successivo
 */

import {
  endOfMonth,
  getDay,
  addDays,
  format,
  isAfter,
  isBefore,
  getMonth,
  getYear,
} from "date-fns";

// Italian public holidays (fixed dates — ricorrenze fisse)
const ITALIAN_HOLIDAYS: Array<[number, number]> = [
  [1, 1], // Capodanno
  [1, 6], // Epifania
  [4, 25], // Liberazione
  [5, 1], // Festa del Lavoro
  [6, 2], // Festa della Repubblica
  [8, 15], // Ferragosto
  [11, 1], // Ognissanti
  [12, 8], // Immacolata
  [12, 25], // Natale
  [12, 26], // Santo Stefano
];

// Easter-based holidays (approximate — Pasqua e Lunedì dell'Angelo)
// We use a simplified calculation. For exact dates, use an Easter algorithm.
function getEasterDate(year: number): Date {
  // Computus algorithm (Anonymous Gregorian algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isItalianHoliday(date: Date): boolean {
  const month = getMonth(date) + 1;
  const day = date.getDate();
  const year = getYear(date);

  // Check fixed holidays
  if (ITALIAN_HOLIDAYS.some(([m, d]) => m === month && d === day)) {
    return true;
  }

  // Check Easter Monday (Pasquetta)
  const easter = getEasterDate(year);
  const easterMonday = addDays(easter, 1);
  if (getMonth(easterMonday) === getMonth(date) && easterMonday.getDate() === date.getDate()) {
    return true;
  }

  return false;
}

/**
 * If the date falls on a Saturday, Sunday, or Italian holiday,
 * move to the next business day.
 */
export function nextBusinessDay(date: Date): Date {
  let d = new Date(date);

  while (true) {
    const dow = getDay(d);
    if (dow === 0) {
      // Sunday
      d = addDays(d, 1);
    } else if (dow === 6) {
      // Saturday
      d = addDays(d, 2);
    } else if (isItalianHoliday(d)) {
      d = addDays(d, 1);
    } else {
      return d;
    }
  }
}

export type VatPeriodicity = "monthly" | "quarterly";

export interface VatPeriod {
  periodStart: Date;
  periodEnd: Date;
  periodType: VatPeriodicity;
  dueDate: Date;
  /** Only Q4 quarterly has the 1% surcharge */
  surchargeRate: number;
  label: string;
}

/**
 * Generate all VAT periods for a given year and periodicity.
 */
export function generateVatPeriods(year: number, periodicity: VatPeriodicity): VatPeriod[] {
  const periods: VatPeriod[] = [];

  if (periodicity === "monthly") {
    for (let m = 0; m < 12; m++) {
      const periodStart = new Date(year, m, 1);
      const periodEnd = endOfMonth(periodStart);
      // Due date: 16th of the following month
      const rawDueDate = new Date(m === 11 ? year + 1 : year, m === 11 ? 0 : m + 1, 16);
      const dueDate = nextBusinessDay(rawDueDate);
      const monthNames = [
        "Gennaio",
        "Febbraio",
        "Marzo",
        "Aprile",
        "Maggio",
        "Giugno",
        "Luglio",
        "Agosto",
        "Settembre",
        "Ottobre",
        "Novembre",
        "Dicembre",
      ];
      periods.push({
        periodStart,
        periodEnd,
        periodType: "monthly",
        dueDate,
        surchargeRate: 0,
        label: `${monthNames[m]} ${year}`,
      });
    }
  } else {
    // Quarterly
    const quarterlyDueDates: Array<{
      months: [number, number, number];
      dueDateMonth: number;
      dueDateDay: number;
      dueDateYear: number;
      surcharge: number;
      label: string;
    }> = [
      {
        months: [0, 1, 2],
        dueDateMonth: 4,
        dueDateDay: 16,
        dueDateYear: year,
        surcharge: 0,
        label: `I Trimestre ${year}`,
      },
      {
        months: [3, 4, 5],
        dueDateMonth: 7,
        dueDateDay: 20,
        dueDateYear: year,
        surcharge: 0,
        label: `II Trimestre ${year}`,
      }, // 20 agosto
      {
        months: [6, 7, 8],
        dueDateMonth: 10,
        dueDateDay: 16,
        dueDateYear: year,
        surcharge: 0,
        label: `III Trimestre ${year}`,
      },
      {
        months: [9, 10, 11],
        dueDateMonth: 2,
        dueDateDay: 16,
        dueDateYear: year + 1,
        surcharge: 1.0,
        label: `IV Trimestre ${year}`,
      }, // +1%
    ];

    for (const q of quarterlyDueDates) {
      const periodStart = new Date(year, q.months[0], 1);
      const periodEnd = endOfMonth(new Date(year, q.months[2], 1));
      const rawDueDate = new Date(q.dueDateYear, q.dueDateMonth, q.dueDateDay);
      const dueDate = nextBusinessDay(rawDueDate);

      periods.push({
        periodStart,
        periodEnd,
        periodType: "quarterly",
        dueDate,
        surchargeRate: q.surcharge,
        label: q.label,
      });
    }
  }

  return periods;
}

export interface VatCalculation {
  period: VatPeriod;
  vatDebit: number; // IVA su vendite (fatture attive)
  vatCredit: number; // IVA su acquisti (fatture passive)
  vatBalance: number; // debito - credito
  carryForward: number; // credito riportato dal periodo precedente
  surchargeAmount: number; // maggiorazione (solo Q4 trimestrale)
  amountDue: number; // effettivo da versare (0 se credito)
  creditCarriedOut: number; // credito che passa al periodo successivo
}

/**
 * Calculate VAT for each period of a given year.
 * Invoices are bucketed by their `date` field into periods.
 * Credit from one period carries forward to offset debit in the next.
 */
export function calculateVatForYear(
  periods: VatPeriod[],
  invoices: Array<{
    direction: string;
    vatAmount: number;
    date: Date;
  }>,
  initialCarryForward: number = 0,
): VatCalculation[] {
  const results: VatCalculation[] = [];
  let currentCarryForward = initialCarryForward;

  for (const period of periods) {
    // Filter invoices in this period
    const periodInvoices = invoices.filter(
      (inv) => !isBefore(inv.date, period.periodStart) && !isAfter(inv.date, period.periodEnd),
    );

    const vatDebit = periodInvoices
      .filter((inv) => inv.direction === "ACTIVE")
      .reduce((sum, inv) => sum + inv.vatAmount, 0);

    const vatCredit = periodInvoices
      .filter((inv) => inv.direction === "PASSIVE")
      .reduce((sum, inv) => sum + inv.vatAmount, 0);

    const vatBalance = vatDebit - vatCredit;

    // Apply carry forward from previous period
    const netAfterCarry = vatBalance - currentCarryForward;

    let amountDue: number;
    let creditCarriedOut: number;
    let surchargeAmount = 0;

    if (netAfterCarry > 0) {
      // We owe money
      surchargeAmount =
        period.surchargeRate > 0
          ? Math.round(netAfterCarry * (period.surchargeRate / 100) * 100) / 100
          : 0;
      amountDue = Math.round((netAfterCarry + surchargeAmount) * 100) / 100;
      creditCarriedOut = 0;
    } else {
      // We have credit — carry it forward
      amountDue = 0;
      creditCarriedOut = Math.abs(netAfterCarry);
    }

    results.push({
      period,
      vatDebit: Math.round(vatDebit * 100) / 100,
      vatCredit: Math.round(vatCredit * 100) / 100,
      vatBalance: Math.round(vatBalance * 100) / 100,
      carryForward: Math.round(currentCarryForward * 100) / 100,
      surchargeAmount,
      amountDue,
      creditCarriedOut: Math.round(creditCarriedOut * 100) / 100,
    });

    currentCarryForward = creditCarriedOut;
  }

  return results;
}

// ─── V2 Adapter ─────────────────────────────────────────────────

/** Revenue-type categories that contribute to VAT debit (IVA su vendite) */
const REVENUE_CATEGORIES = new Set(["REVENUE"]);

/** Cost-type categories that contribute to VAT credit (IVA su acquisti) */
const COST_CATEGORIES = new Set([
  "VAR_COST_MATERIALS",
  "VAR_COST_SERVICES",
  "VAR_COST_DIRECT_LABOR",
  "FIXED_COST_DEPRECIATION",
  "FIXED_COST_ADMIN_COMPENSATION",
  "FIXED_COST_RENT",
  "FIXED_COST_UTILITIES",
  "FIXED_COST_INSURANCE",
  "FIXED_COST_CONSULTING",
  "FIXED_COST_MARKETING",
  "FIXED_COST_GENERAL",
]);

/**
 * V2 adapter: normalizes bank statements + invoices into the unified invoice
 * format expected by calculateVatForYear.
 *
 * Bank statements with revenue-type cdgCategory → direction ACTIVE (VAT debit)
 * Bank statements with cost-type cdgCategory → direction PASSIVE (VAT credit)
 * Invoices pass through as-is.
 */
export function normalizeV2VatSources(
  bankStatements: Array<{ date: Date; vatAmount: number; cdgCategory: string | null }>,
  invoices: Array<{ direction: string; vatAmount: number; date: Date }>,
): Array<{ direction: string; vatAmount: number; date: Date }> {
  const normalized: Array<{ direction: string; vatAmount: number; date: Date }> = [];

  // Bank statements → derive direction from category
  for (const bs of bankStatements) {
    if (!bs.vatAmount || bs.vatAmount === 0) continue;
    const cat = bs.cdgCategory ?? "";
    let direction: string;
    if (REVENUE_CATEGORIES.has(cat)) {
      direction = "ACTIVE";
    } else if (COST_CATEGORIES.has(cat)) {
      direction = "PASSIVE";
    } else {
      // Unknown category — skip or use sign: positive amount = revenue (ACTIVE)
      direction = bs.vatAmount > 0 ? "ACTIVE" : "PASSIVE";
    }
    normalized.push({
      direction,
      vatAmount: Math.abs(bs.vatAmount),
      date: bs.date,
    });
  }

  // Invoices pass through
  for (const inv of invoices) {
    if (!inv.vatAmount || inv.vatAmount === 0) continue;
    normalized.push({
      direction: inv.direction,
      vatAmount: Math.abs(inv.vatAmount),
      date: inv.date,
    });
  }

  return normalized;
}

/**
 * Get VAT due dates as cashflow outflows for the forecasting engine.
 */
export function getVatOutflows(
  calculations: VatCalculation[],
  today: Date = new Date(),
): Array<{
  date: string;
  amount: number;
  label: string;
  periodLabel: string;
}> {
  return calculations
    .filter((c) => c.amountDue > 0 && !isBefore(c.period.dueDate, today))
    .map((c) => ({
      date: format(c.period.dueDate, "yyyy-MM-dd"),
      amount: c.amountDue,
      label: `Versamento IVA — ${c.period.label}`,
      periodLabel: c.period.label,
    }));
}
