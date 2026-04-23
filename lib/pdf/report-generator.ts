/**
 * Server-side PDF report generator using jsPDF (programmatic, no DOM).
 * Generates branded financial reports for firm controllers.
 */
import { jsPDF } from "jspdf";
import type { IncomeStatementResult } from "@/lib/analysis/income-statement";
import type { FinancialRatios } from "@/lib/analysis/financial-ratios";
import type { HealthIndicator, BreakEvenResult } from "@/lib/analysis/client-indicators";
import type { ScadenzaItem } from "@/lib/queries/scadenze";

// ─── Types ───────────────────────────────────────────────────────

export interface ReportConfig {
  orgName: string;
  firmName: string;
  brandColor: string;
  year: number;
  sections: string[];
  data: {
    ce?: {
      incomeStatement: IncomeStatementResult;
      ratios: FinancialRatios;
      periodStart: string;
      periodEnd: string;
    };
    health?: {
      indicators: HealthIndicator[];
      bep: BreakEvenResult | null;
    };
    scadenze?: {
      items: ScadenzaItem[];
      summary: { totalIn: number; totalOut: number; netFlow: number; count: number };
    };
    iva?: {
      snapshots: Array<{
        periodLabel: string;
        vatDebit: number;
        vatCredit: number;
        amountDue: number;
        dueDate: string | null;
        isPaid: boolean;
      }>;
    };
  };
}

// ─── Formatters ─────────────────────────────────────────────────

const fmtEUR = (v: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);

const fmtPct = (v: number | null): string =>
  v != null ? v.toFixed(1).replace(".", ",") + "%" : "—";

// ─── Helpers ────────────────────────────────────────────────────

const PAGE_W = 210;
const MARGIN_L = 15;
const MARGIN_R = 15;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;
const FOOTER_Y = 282;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

class PdfBuilder {
  pdf: jsPDF;
  y: number;
  brandColor: [number, number, number];
  firmName: string;
  pageNum: number;

  constructor(brandColor: string, firmName: string) {
    this.pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y = 30;
    this.brandColor = hexToRgb(brandColor || "#0b4d8a");
    this.firmName = firmName;
    this.pageNum = 1;
  }

  checkPageBreak(needed: number) {
    if (this.y + needed > FOOTER_Y) {
      this.addFooter();
      this.pdf.addPage();
      this.pageNum++;
      this.y = 20;
      this.addHeader();
    }
  }

  addHeader() {
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(...this.brandColor);
    this.pdf.text(this.firmName, MARGIN_L, 12);
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.line(MARGIN_L, 15, PAGE_W - MARGIN_R, 15);
    this.pdf.setTextColor(0, 0, 0);
  }

  addFooter() {
    const dateStr = new Date().toLocaleDateString("it-IT");
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(150, 150, 150);
    this.pdf.text(`Generato il ${dateStr}`, MARGIN_L, 290);
    this.pdf.text(`Pagina ${this.pageNum}`, PAGE_W - MARGIN_R, 290, { align: "right" });
    this.pdf.text("Powered by FinFlow", PAGE_W / 2, 290, { align: "center" });
  }

  sectionTitle(title: string) {
    this.checkPageBreak(20);
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...this.brandColor);
    this.pdf.text(title, MARGIN_L, this.y);
    this.y += 2;
    this.pdf.setDrawColor(...this.brandColor);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(MARGIN_L, this.y, MARGIN_L + 60, this.y);
    this.y += 8;
    this.pdf.setTextColor(0, 0, 0);
  }

  tableRow(
    cols: string[],
    widths: number[],
    opts?: { bold?: boolean; bg?: [number, number, number] },
  ) {
    this.checkPageBreak(7);
    const rowH = 6;
    if (opts?.bg) {
      this.pdf.setFillColor(...opts.bg);
      this.pdf.rect(MARGIN_L, this.y - 4, CONTENT_W, rowH, "F");
    }
    this.pdf.setFontSize(9);
    if (opts?.bold) {
      this.pdf.setFont("helvetica", "bold");
    } else {
      this.pdf.setFont("helvetica", "normal");
    }
    let x = MARGIN_L;
    for (let i = 0; i < cols.length; i++) {
      const align = i === 0 ? "left" : "right";
      const textX = i === 0 ? x + 1 : x + widths[i] - 1;
      this.pdf.text(cols[i], textX, this.y, { align });
      x += widths[i];
    }
    this.y += rowH;
    this.pdf.setFont("helvetica", "normal");
  }

  getBuffer(): Buffer {
    this.addFooter();
    return Buffer.from(this.pdf.output("arraybuffer"));
  }
}

// ─── Section renderers ──────────────────────────────────────────

function renderCoverPage(b: PdfBuilder, config: ReportConfig) {
  b.y = 80;
  b.pdf.setFontSize(28);
  b.pdf.setTextColor(...b.brandColor);
  b.pdf.text("Report Finanziario", PAGE_W / 2, b.y, { align: "center" });
  b.y += 15;
  b.pdf.setFontSize(18);
  b.pdf.setTextColor(80, 80, 80);
  b.pdf.text(config.orgName, PAGE_W / 2, b.y, { align: "center" });
  b.y += 12;
  b.pdf.setFontSize(14);
  b.pdf.text(`Anno ${config.year}`, PAGE_W / 2, b.y, { align: "center" });
  b.y += 25;
  b.pdf.setFontSize(11);
  b.pdf.setTextColor(...b.brandColor);
  b.pdf.text(config.firmName, PAGE_W / 2, b.y, { align: "center" });
  b.y += 8;
  b.pdf.setFontSize(9);
  b.pdf.setTextColor(130, 130, 130);
  b.pdf.text(`Generato il ${new Date().toLocaleDateString("it-IT")}`, PAGE_W / 2, b.y, {
    align: "center",
  });
}

function renderCE(b: PdfBuilder, config: ReportConfig) {
  const ce = config.data.ce;
  if (!ce) return;
  b.sectionTitle("CE Riclassificato");
  const is = ce.incomeStatement;
  const w = [100, 40, 40];

  b.tableRow(["Voce", "Importo", "% Ricavi"], w, { bold: true, bg: [240, 240, 240] });

  const rows: [string, number, number | null][] = [
    ["Ricavi", is.revenue, null],
    ["Costi Variabili", is.variableCosts, ce.ratios.variableCostRatio],
    ["Margine di Contribuzione", is.mdc, ce.ratios.mdcMargin],
    ["Costi Fissi Operativi", is.fixedCostsOperating, ce.ratios.fixedCostRatio],
    ["EBITDA", is.ebitda, ce.ratios.ebitdaMargin],
    ["Ammortamenti", is.depreciation, null],
    ["EBIT", is.ebit, ce.ratios.ebitMargin],
    ["Gestione Finanziaria", is.financialNet, null],
    ["Gestione Straordinaria", is.extraordinaryNet, null],
    ["Utile ante Imposte", is.pretaxIncome, null],
    ["Imposte", is.tax, null],
    ["Utile Netto", is.netIncome, ce.ratios.netMargin],
  ];

  const subtotalLines = new Set(["Margine di Contribuzione", "EBITDA", "EBIT", "Utile Netto"]);

  for (const [label, value, pct] of rows) {
    const isSub = subtotalLines.has(label);
    b.tableRow(
      [label, fmtEUR(value), pct != null ? fmtPct(pct) : ""],
      w,
      isSub ? { bold: true } : undefined,
    );
  }
  b.y += 6;
}

function renderHealth(b: PdfBuilder, config: ReportConfig) {
  const health = config.data.health;
  if (!health) return;
  b.sectionTitle("Indicatori di Salute");
  const w = [65, 35, 30, 50];

  b.tableRow(["Indicatore", "Valore", "Stato", "Riferimento"], w, {
    bold: true,
    bg: [240, 240, 240],
  });

  const statusLabel = (s: string) => (s === "ok" ? "OK" : s === "warn" ? "Attenzione" : "Critico");

  for (const ind of health.indicators) {
    b.tableRow([ind.label, ind.formatted, statusLabel(ind.status), ind.reference], w);
  }

  if (health.bep) {
    b.y += 4;
    b.pdf.setFontSize(10);
    b.pdf.setFont("helvetica", "bold");
    b.pdf.text(`Punto di Pareggio: ${fmtEUR(health.bep.bep)}`, MARGIN_L, b.y);
    b.y += 5;
    b.pdf.setFont("helvetica", "normal");
    b.pdf.text(
      `Margine di sicurezza: ${fmtPct(health.bep.safetyMargin)} (${statusLabel(health.bep.safetyMarginStatus)})`,
      MARGIN_L,
      b.y,
    );
    b.y += 8;
  }
  b.y += 4;
}

function renderScadenze(b: PdfBuilder, config: ReportConfig) {
  const sc = config.data.scadenze;
  if (!sc) return;
  b.sectionTitle("Scadenze 90 Giorni");

  // Summary
  b.pdf.setFontSize(10);
  b.pdf.text(
    `Incassi attesi: ${fmtEUR(sc.summary.totalIn)}  |  Pagamenti: ${fmtEUR(sc.summary.totalOut)}  |  Saldo netto: ${fmtEUR(sc.summary.netFlow)}`,
    MARGIN_L,
    b.y,
  );
  b.y += 8;

  if (sc.items.length === 0) {
    b.pdf.setFontSize(9);
    b.pdf.text("Nessuna scadenza nei prossimi 90 giorni.", MARGIN_L, b.y);
    b.y += 8;
    return;
  }

  const w = [25, 80, 35, 20];
  b.tableRow(["Data", "Descrizione", "Importo", "Dir."], w, { bold: true, bg: [240, 240, 240] });

  const maxRows = Math.min(sc.items.length, 30);
  for (let i = 0; i < maxRows; i++) {
    const item = sc.items[i];
    const dateStr = item.date.split("-").reverse().join("/");
    const desc = item.label.length > 50 ? item.label.slice(0, 47) + "..." : item.label;
    b.tableRow(
      [dateStr, desc, fmtEUR(item.amount), item.direction === "in" ? "Entrata" : "Uscita"],
      w,
    );
  }
  if (sc.items.length > 30) {
    b.pdf.setFontSize(8);
    b.pdf.setTextColor(130, 130, 130);
    b.pdf.text(`... e altre ${sc.items.length - 30} scadenze`, MARGIN_L, b.y);
    b.pdf.setTextColor(0, 0, 0);
    b.y += 6;
  }
  b.y += 4;
}

function renderIVA(b: PdfBuilder, config: ReportConfig) {
  const iva = config.data.iva;
  if (!iva) return;
  b.sectionTitle("IVA del Periodo");

  if (iva.snapshots.length === 0) {
    b.pdf.setFontSize(9);
    b.pdf.text("Nessun dato IVA disponibile.", MARGIN_L, b.y);
    b.y += 8;
    return;
  }

  const w = [40, 30, 30, 30, 30];
  b.tableRow(["Periodo", "Debito", "Credito", "Dovuto", "Stato"], w, {
    bold: true,
    bg: [240, 240, 240],
  });

  for (const s of iva.snapshots) {
    b.tableRow(
      [
        s.periodLabel,
        fmtEUR(s.vatDebit),
        fmtEUR(s.vatCredit),
        fmtEUR(s.amountDue),
        s.isPaid ? "Pagato" : "Da pagare",
      ],
      w,
    );
  }
  b.y += 4;
}

// ─── Main generator ─────────────────────────────────────────────

export async function generateReportPdf(config: ReportConfig): Promise<Buffer> {
  const b = new PdfBuilder(config.brandColor, config.firmName);

  // Cover page
  renderCoverPage(b, config);

  // Section pages
  for (const section of config.sections) {
    b.addFooter();
    b.pdf.addPage();
    b.pageNum++;
    b.y = 20;
    b.addHeader();

    switch (section) {
      case "ce":
        renderCE(b, config);
        break;
      case "health":
        renderHealth(b, config);
        break;
      case "scadenze":
        renderScadenze(b, config);
        break;
      case "iva":
        renderIVA(b, config);
        break;
    }
  }

  return b.getBuffer();
}
