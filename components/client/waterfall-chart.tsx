"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { IncomeStatementResult } from "@/lib/analysis/income-statement";

const fmtEUR = (v: number): string =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);

interface WaterfallChartProps {
  ce: IncomeStatementResult;
  className?: string;
}

interface WaterfallEntry {
  name: string;
  base: number;
  value: number;
  color: string;
}

export function WaterfallChart({ ce, className }: WaterfallChartProps) {
  // Build waterfall data: from Revenue down to Net Income
  const entries: WaterfallEntry[] = [
    { name: "Ricavi", base: 0, value: ce.revenue, color: "#0b4d8a" },
    { name: "− Costi variabili", base: ce.mdc, value: ce.variableCosts, color: "#b45309" },
    { name: "MdC", base: 0, value: ce.mdc, color: "#0e7c66" },
    { name: "− Costi fissi", base: ce.ebitda, value: ce.fixedCostsOperating, color: "#b45309" },
    { name: "EBITDA", base: 0, value: ce.ebitda, color: "#0e7c66" },
    { name: "− Ammortamenti", base: ce.ebit, value: ce.depreciation, color: "#94a3b8" },
    { name: "EBIT", base: 0, value: ce.ebit, color: "#0e7c66" },
  ];

  // Add financial/extraordinary/tax if non-zero
  if (ce.financialNet !== 0 || ce.extraordinaryNet !== 0 || ce.tax !== 0) {
    const adjustments = ce.financialNet + ce.extraordinaryNet - ce.tax;
    entries.push({
      name: "± Fin./Imp.",
      base: ce.netIncome,
      value: Math.abs(adjustments),
      color: adjustments >= 0 ? "#0e7c66" : "#b45309",
    });
  }

  entries.push({ name: "Utile Netto", base: 0, value: ce.netIncome, color: "#0b4d8a" });

  return (
    <div className={cn("h-[350px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={entries} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(v) => fmtEUR(v)}
            width={90}
          />
          <Tooltip
            formatter={(_value, _name, props) => {
              const entry = (props as { payload?: WaterfallEntry })?.payload;
              if (!entry) return ["", ""];
              return [fmtEUR(entry.base + entry.value), entry.name];
            }}
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "13px",
            }}
          />
          <ReferenceLine y={0} stroke="#94a3b8" />
          {/* Invisible base bar for waterfall effect */}
          <Bar dataKey="base" stackId="waterfall" fill="transparent" />
          {/* Visible value bar */}
          <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
            {entries.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
