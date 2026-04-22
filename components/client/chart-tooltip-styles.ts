/**
 * Shared Recharts Tooltip styles for all client workspace charts.
 * Dark background, white text, EUR formatting.
 *
 * Usage:
 *   <Tooltip {...CHART_TOOLTIP_PROPS} />
 *   <Tooltip {...CHART_TOOLTIP_PROPS} formatter={customFormatter} />
 */
import type { CSSProperties } from "react";

const contentStyle: CSSProperties = {
  backgroundColor: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "13px",
};

const labelStyle: CSSProperties = {
  color: "#fff",
  fontWeight: 600,
  marginBottom: "4px",
};

const itemStyle: CSSProperties = {
  color: "#fff",
};

const eurFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function formatTooltipEUR(value: number | string): string {
  return eurFormatter.format(Number(value));
}

/** Spread onto <Tooltip /> for consistent dark-bg, white-text styling. */
export const CHART_TOOLTIP_PROPS = {
  contentStyle,
  labelStyle,
  itemStyle,
  formatter: (value: number) => [formatTooltipEUR(value)],
} as const;
