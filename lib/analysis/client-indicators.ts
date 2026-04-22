/**
 * client-indicators.ts — Health indicators, BEP, and narrative text for client workspace.
 *
 * Pure functions, no DB access. ADR-007 defines thresholds.
 */

import type { IncomeStatementResult } from "./income-statement";
import type { FinancialRatios } from "./financial-ratios";

// ─── Types ──────────────────────────────────────────────────────

export type HealthStatus = "ok" | "warn" | "bad";

export interface HealthIndicator {
  id: string;
  label: string;
  value: number | null;
  /** Formatted value for display (e.g. "36,7%", "€ 106.659") */
  formatted: string;
  status: HealthStatus;
  /** Short human-readable description */
  description: string;
  /** Reference range for tooltip */
  reference: string;
}

export interface BreakEvenResult {
  /** Break-even point in EUR */
  bep: number;
  /** Safety margin as percentage ((revenue - bep) / revenue * 100) */
  safetyMargin: number;
  /** Safety margin health status */
  safetyMarginStatus: HealthStatus;
}

export interface NarrativeSummary {
  /** 3-4 sentence "In breve" text */
  inBreve: string;
  /** Revenue trend description */
  revenueNote: string;
  /** Profitability description */
  profitabilityNote: string;
  /** Cost structure description */
  costNote: string;
}

// ─── Formatters ─────────────────────────────────────────────────

const fmtEUR = (v: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);

const fmtPct = (v: number): string => v.toFixed(1).replace(".", ",") + "%";

// ─── BEP ────────────────────────────────────────────────────────

/**
 * Compute break-even point and safety margin.
 * BEP = Total Fixed Costs / (MdC / Revenue)
 * Safety Margin = (Revenue - BEP) / Revenue * 100
 */
export function computeBreakEven(ce: IncomeStatementResult): BreakEvenResult | null {
  if (ce.revenue === 0 || ce.mdc === 0) return null;

  const mdcRatio = ce.mdc / ce.revenue;
  if (mdcRatio <= 0) return null;

  // Total fixed costs = operating fixed + depreciation
  const totalFixedCosts = ce.fixedCostsOperating + ce.depreciation;
  const bep = round2(totalFixedCosts / mdcRatio);
  const safetyMargin = round2(((ce.revenue - bep) / ce.revenue) * 100);

  return {
    bep,
    safetyMargin,
    safetyMarginStatus: evaluateThreshold(safetyMargin, 20, 10),
  };
}

// ─── Health Indicators ──────────────────────────────────────────

/**
 * Evaluate a value against thresholds.
 * "Higher is better" convention: ok >= greenMin, warn between yellowMin and greenMin, bad < yellowMin.
 */
function evaluateThreshold(value: number, greenMin: number, yellowMin: number): HealthStatus {
  if (value >= greenMin) return "ok";
  if (value >= yellowMin) return "warn";
  return "bad";
}

/**
 * Evaluate "lower is better" (e.g., cost ratios, debt ratios).
 */
function evaluateThresholdInverse(
  value: number,
  greenMax: number,
  yellowMax: number,
): HealthStatus {
  if (value <= greenMax) return "ok";
  if (value <= yellowMax) return "warn";
  return "bad";
}

/**
 * Build all CE-based health indicators.
 * ADR-007 defines the thresholds.
 */
export function computeHealthIndicators(
  ce: IncomeStatementResult,
  ratios: FinancialRatios,
  bep: BreakEvenResult | null,
): HealthIndicator[] {
  const indicators: HealthIndicator[] = [];

  // 1. Margine di Contribuzione %
  if (ratios.mdcMargin != null) {
    indicators.push({
      id: "mdc_margin",
      label: "Margine di Contribuzione",
      value: ratios.mdcMargin,
      formatted: fmtPct(ratios.mdcMargin),
      status: evaluateThreshold(ratios.mdcMargin, 30, 15),
      description:
        ratios.mdcMargin >= 30
          ? "Il margine sui costi variabili è solido."
          : ratios.mdcMargin >= 15
            ? "Il margine copre i costi fissi, ma con poco spazio."
            : "Il margine è troppo basso per assorbire i costi fissi.",
      reference: "Ottimo: ≥ 30% · Attenzione: 15-30% · Critico: < 15%",
    });
  }

  // 2. EBITDA Margin %
  if (ratios.ebitdaMargin != null) {
    indicators.push({
      id: "ebitda_margin",
      label: "Margine Operativo (EBITDA)",
      value: ratios.ebitdaMargin,
      formatted: fmtPct(ratios.ebitdaMargin),
      status: evaluateThreshold(ratios.ebitdaMargin, 15, 5),
      description:
        ratios.ebitdaMargin >= 15
          ? "L'attività operativa genera un buon margine."
          : ratios.ebitdaMargin >= 5
            ? "Il margine operativo è sufficiente, ma migliorabile."
            : "La redditività operativa è molto bassa.",
      reference: "Ottimo: ≥ 15% · Attenzione: 5-15% · Critico: < 5%",
    });
  }

  // 3. Margine Netto %
  if (ratios.netMargin != null) {
    indicators.push({
      id: "net_margin",
      label: "Margine Netto",
      value: ratios.netMargin,
      formatted: fmtPct(ratios.netMargin),
      status: evaluateThreshold(ratios.netMargin, 5, 0),
      description:
        ratios.netMargin >= 5
          ? "L'azienda trattiene un buon guadagno dopo tutti i costi."
          : ratios.netMargin >= 0
            ? "Il guadagno è positivo ma molto contenuto."
            : "L'azienda è in perdita.",
      reference: "Ottimo: ≥ 5% · Attenzione: 0-5% · Critico: < 0%",
    });
  }

  // 4. Incidenza Costi Variabili
  if (ratios.variableCostRatio != null) {
    indicators.push({
      id: "var_cost_ratio",
      label: "Incidenza Costi Variabili",
      value: ratios.variableCostRatio,
      formatted: fmtPct(ratios.variableCostRatio),
      status: evaluateThresholdInverse(ratios.variableCostRatio, 60, 80),
      description:
        ratios.variableCostRatio <= 60
          ? "I costi variabili sono sotto controllo."
          : ratios.variableCostRatio <= 80
            ? "I costi variabili assorbono una quota elevata dei ricavi."
            : "La quasi totalità dei ricavi è assorbita dai costi variabili.",
      reference: "Ottimo: ≤ 60% · Attenzione: 60-80% · Critico: > 80%",
    });
  }

  // 5. Incidenza Costi Fissi
  if (ratios.fixedCostRatio != null) {
    indicators.push({
      id: "fixed_cost_ratio",
      label: "Incidenza Costi Fissi",
      value: ratios.fixedCostRatio,
      formatted: fmtPct(ratios.fixedCostRatio),
      status: evaluateThresholdInverse(ratios.fixedCostRatio, 30, 50),
      description:
        ratios.fixedCostRatio <= 30
          ? "La struttura dei costi fissi è leggera."
          : ratios.fixedCostRatio <= 50
            ? "I costi fissi pesano sulla redditività."
            : "I costi fissi sono troppo elevati rispetto ai ricavi.",
      reference: "Ottimo: ≤ 30% · Attenzione: 30-50% · Critico: > 50%",
    });
  }

  // 6. Margine di Sicurezza (BEP)
  if (bep) {
    indicators.push({
      id: "safety_margin",
      label: "Margine di Sicurezza",
      value: bep.safetyMargin,
      formatted: fmtPct(bep.safetyMargin),
      status: bep.safetyMarginStatus,
      description:
        bep.safetyMargin >= 20
          ? `I ricavi superano il punto di pareggio (${fmtEUR(bep.bep)}) con ampio margine.`
          : bep.safetyMargin >= 10
            ? `I ricavi sono sopra il pareggio (${fmtEUR(bep.bep)}), ma con poco margine.`
            : `L'azienda è molto vicina al punto di pareggio (${fmtEUR(bep.bep)}).`,
      reference: "Ottimo: ≥ 20% · Attenzione: 10-20% · Critico: < 10%",
    });
  }

  return indicators;
}

// ─── Narrative Text ─────────────────────────────────────────────

/**
 * Generate deterministic narrative summary from CE data.
 * No AI — just threshold-based template selection.
 */
export function generateNarrative(
  ce: IncomeStatementResult,
  ratios: FinancialRatios,
  bep: BreakEvenResult | null,
  periodLabel: string,
): NarrativeSummary {
  const ebitdaM = ratios.ebitdaMargin ?? 0;
  const netM = ratios.netMargin ?? 0;
  const mdcM = ratios.mdcMargin ?? 0;

  // Revenue note
  const revenueNote = `Nel periodo ${periodLabel} l'azienda ha registrato ricavi per ${fmtEUR(ce.revenue)}.`;

  // Profitability
  let profitabilityNote: string;
  if (ebitdaM >= 30) {
    profitabilityNote = `La marginalità operativa è molto alta (EBITDA ${fmtPct(ebitdaM)}): l'azienda trattiene una quota significativa di ogni euro fatturato.`;
  } else if (ebitdaM >= 15) {
    profitabilityNote = `La marginalità operativa è buona (EBITDA ${fmtPct(ebitdaM)}), con un utile netto di ${fmtEUR(ce.netIncome)}.`;
  } else if (ebitdaM >= 5) {
    profitabilityNote = `La marginalità operativa è contenuta (EBITDA ${fmtPct(ebitdaM)}). C'è spazio per migliorare l'efficienza.`;
  } else {
    profitabilityNote = `La marginalità operativa è molto bassa (EBITDA ${fmtPct(ebitdaM)}). È consigliabile analizzare la struttura dei costi.`;
  }

  // Cost structure
  let costNote: string;
  if (mdcM >= 50) {
    costNote = `I costi variabili sono contenuti: il margine di contribuzione è del ${fmtPct(mdcM)}, lasciando ampio spazio per coprire i costi fissi.`;
  } else if (mdcM >= 30) {
    costNote = `Il margine di contribuzione del ${fmtPct(mdcM)} consente di coprire i costi fissi e generare utile.`;
  } else {
    costNote = `Il margine di contribuzione del ${fmtPct(mdcM)} è contenuto: i costi variabili assorbono gran parte dei ricavi.`;
  }

  // Compose "In breve"
  const sentences = [revenueNote, profitabilityNote];
  if (bep && bep.safetyMargin > 0) {
    sentences.push(
      `Il punto di pareggio è a ${fmtEUR(bep.bep)}, con un margine di sicurezza del ${fmtPct(bep.safetyMargin)}.`,
    );
  }
  if (ce.netIncome > 0) {
    sentences.push(
      `L'utile netto è di ${fmtEUR(ce.netIncome)}, pari al ${fmtPct(netM)} dei ricavi.`,
    );
  } else if (ce.netIncome < 0) {
    sentences.push(`Il periodo si chiude in perdita per ${fmtEUR(Math.abs(ce.netIncome))}.`);
  }

  return {
    inBreve: sentences.join(" "),
    revenueNote,
    profitabilityNote,
    costNote,
  };
}

// ─── Utility ────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
