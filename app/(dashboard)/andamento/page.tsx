"use client";

import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { NarrativeBox } from "@/components/client/narrative-box";
import { formatEUR } from "@/lib/helpers/format";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function fmtPct(v: number): string {
  return v.toFixed(1).replace(".", ",") + "%";
}

export default function AndamentoPage() {
  const { data, isLoading, error } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 h-[350px] animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Andamento dei ricavi</h1>
        <p className="mt-4 text-sm text-slate-500">Nessun dato disponibile.</p>
      </div>
    );
  }

  const { incomeStatement: ce, ratios, narrative } = data;

  // CE cascade for bar chart
  const cascadeData = [
    { name: "Ricavi", value: ce.revenue, fill: "#0b4d8a" },
    { name: "Costi variabili", value: ce.variableCosts, fill: "#b45309" },
    { name: "MdC", value: ce.mdc, fill: "#0e7c66" },
    { name: "Costi fissi", value: ce.fixedCostsOperating, fill: "#d97706" },
    { name: "EBITDA", value: ce.ebitda, fill: "#0e7c66" },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Andamento dei ricavi</h1>
        <p className="mt-1 text-sm text-slate-500">
          Quanto l&apos;azienda vende, a confronto con i costi principali.
        </p>
      </div>

      {/* Revenue bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold">Ricavi e margini a confronto</h3>
        <p className="mb-4 text-xs text-slate-500">
          Periodo: {data.periodStart} – {data.periodEnd}
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cascadeData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => formatEUR(v)}
                width={90}
              />
              <Tooltip
                formatter={(value) => [formatEUR(Number(value)), ""]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {cascadeData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Voce
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Importo
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold tracking-wider text-slate-500 uppercase">
                % Ricavi
              </th>
            </tr>
          </thead>
          <tbody>
            <SummaryRow label="Ricavi netti" amount={ce.revenue} pct={100} bold />
            <SummaryRow
              label="Costi variabili"
              amount={-ce.variableCosts}
              pct={ratios.variableCostRatio}
            />
            <SummaryRow
              label="Margine di Contribuzione"
              amount={ce.mdc}
              pct={ratios.mdcMargin}
              bold
              highlight
            />
            <SummaryRow
              label="Costi fissi operativi"
              amount={-ce.fixedCostsOperating}
              pct={ratios.fixedCostRatio}
            />
            <SummaryRow
              label="EBITDA"
              amount={ce.ebitda}
              pct={ratios.ebitdaMargin}
              bold
              highlight
            />
          </tbody>
        </table>
      </div>

      <NarrativeBox tag="Cosa significa">
        {narrative.revenueNote} {narrative.profitabilityNote}
      </NarrativeBox>
    </div>
  );
}

function SummaryRow({
  label,
  amount,
  pct,
  bold,
  highlight,
}: {
  label: string;
  amount: number;
  pct: number | null | undefined;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr
      className={
        highlight
          ? "bg-slate-50/80 dark:bg-slate-800/30"
          : "border-b border-slate-50 dark:border-slate-800/50"
      }
    >
      <td className={`px-5 py-2.5 ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td
        className={`font-numeric px-5 py-2.5 text-right tabular-nums ${bold ? "font-semibold" : ""} ${
          amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {formatEUR(amount)}
      </td>
      <td className="font-numeric px-5 py-2.5 text-right text-xs text-slate-500 tabular-nums">
        {pct != null ? fmtPct(pct) : ""}
      </td>
    </tr>
  );
}
