import { format as fnsFormat } from "date-fns";
import { it } from "date-fns/locale";

const eurFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurCompactFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("it-IT", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Format amount as EUR currency (e.g. "€ 1.234,56") */
export function formatEUR(amount: number | string): string {
  return eurFormatter.format(Number(amount));
}

/** Format amount as compact EUR (e.g. "€ 1,2K") */
export function formatEURCompact(amount: number | string): string {
  return eurCompactFormatter.format(Number(amount));
}

/** Format as plain number with Italian separators */
export function formatNumber(value: number | string): string {
  return numberFormatter.format(Number(value));
}

/** Format as percentage (0.15 → "15,0%") */
export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

/** Format date in Italian (e.g. "15 gen 2025") */
export function formatDate(date: Date | string): string {
  return fnsFormat(new Date(date), "d MMM yyyy", { locale: it });
}

/** Format date as short (e.g. "15/01/2025") */
export function formatDateShort(date: Date | string): string {
  return fnsFormat(new Date(date), "dd/MM/yyyy");
}

/** Format date for charts (e.g. "Gen '25") */
export function formatDateChart(date: Date | string): string {
  return fnsFormat(new Date(date), "MMM ''yy", { locale: it });
}

/** Italian month names abbreviated */
export const MONTH_LABELS = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];
