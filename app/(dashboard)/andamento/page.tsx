"use client";

import { useState } from "react";
import { useClientRevenueMonthly } from "@/lib/hooks/use-client-revenue-monthly";
import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { NarrativeBox } from "@/components/client/narrative-box";
import { formatEUR } from "@/lib/helpers/format";
import { CHART_TOOLTIP_PROPS, formatTooltipEUR } from "@/components/client/chart-tooltip-styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_LABELS = [
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

const MONTH_LABELS_FULL = [
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

export default function AndamentoPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const {
    currentYear: currentData,
    previousYear: prevData,
    isLoading,
    error,
  } = useClientRevenueMonthly(year);
  const { data: cdgData } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 h-[350px] animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !currentData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Andamento dei ricavi</h1>
        <p className="mt-4 text-sm text-slate-500">Nessun dato disponibile.</p>
      </div>
    );
  }

  // Build chart data
  const chartData = MONTH_LABELS.map((label, i) => ({
    name: label,
    [String(year)]: currentData.months[i],
    ...(prevData ? { [String(year - 1)]: prevData.months[i] } : {}),
  }));

  const currentMonth = currentYear === year ? new Date().getMonth() : 11;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
            Panoramica
          </p>
          <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Andamento dei ricavi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Il fatturato mese per mese, a confronto con l&apos;anno precedente.
          </p>
        </div>
        {/* Year selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-numeric min-w-[4ch] text-center text-sm font-semibold tabular-nums">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
            disabled={year >= currentYear}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI totale anno */}
      <div
        className="rounded-xl p-4 text-white"
        style={{ backgroundColor: "var(--brand, #0b4d8a)" }}
      >
        <p className="text-xs font-semibold tracking-wide text-white/70 uppercase">
          Ricavi totali {year}
        </p>
        <p className="font-numeric mt-1 text-2xl font-bold tabular-nums">
          {formatEUR(currentData.total)}
        </p>
        {prevData && prevData.total > 0 && (
          <p className="mt-0.5 text-xs text-white/60">
            {currentData.total >= prevData.total ? "+" : ""}
            {((currentData.total / prevData.total - 1) * 100).toFixed(1).replace(".", ",")}% vs{" "}
            {year - 1} ({formatEUR(prevData.total)})
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold">Ricavi mensili</h3>
        <p className="mb-4 text-xs text-slate-500">
          Fatture attive emesse per mese
          {prevData ? ` — confronto ${year} vs ${year - 1}` : ""}
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => formatEUR(v)}
                width={90}
              />
              <Tooltip
                {...CHART_TOOLTIP_PROPS}
                formatter={(value, name) => [formatTooltipEUR(value as number), name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-400">{value}</span>
                )}
              />
              {prevData && (
                <Bar dataKey={String(year - 1)} fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
              )}
              <Bar
                dataKey={String(year)}
                fill="var(--brand, #4f46e5)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">
                Mese
              </th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                {year}
              </th>
              {prevData && (
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                  {year - 1}
                </th>
              )}
              {prevData && (
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">
                  Δ %
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {MONTH_LABELS_FULL.map((label, i) => {
              const curr = currentData.months[i];
              const prev = prevData?.months[i] ?? 0;
              const delta = prev > 0 ? (curr / prev - 1) * 100 : null;
              const isFuture = year === currentYear && i > currentMonth;
              return (
                <tr key={label} className={isFuture ? "opacity-40" : ""}>
                  <td className="px-3 py-2 font-medium">{label}</td>
                  <td className="font-numeric px-3 py-2 text-right tabular-nums">
                    {formatEUR(curr)}
                  </td>
                  {prevData && (
                    <td className="font-numeric px-3 py-2 text-right text-slate-500 tabular-nums">
                      {formatEUR(prev)}
                    </td>
                  )}
                  {prevData && (
                    <td
                      className={`font-numeric px-3 py-2 text-right text-xs tabular-nums ${
                        delta === null
                          ? "text-slate-400"
                          : delta >= 0
                            ? "text-emerald-600"
                            : "text-red-500"
                      }`}
                    >
                      {delta !== null
                        ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1).replace(".", ",")}%`
                        : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-semibold dark:border-slate-700 dark:bg-slate-800/30">
              <td className="px-3 py-2">Totale</td>
              <td className="font-numeric px-3 py-2 text-right tabular-nums">
                {formatEUR(currentData.total)}
              </td>
              {prevData && (
                <td className="font-numeric px-3 py-2 text-right text-slate-500 tabular-nums">
                  {formatEUR(prevData.total)}
                </td>
              )}
              {prevData && (
                <td
                  className={`font-numeric px-3 py-2 text-right text-xs tabular-nums ${
                    prevData.total > 0 && currentData.total >= prevData.total
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {prevData.total > 0
                    ? `${currentData.total >= prevData.total ? "+" : ""}${((currentData.total / prevData.total - 1) * 100).toFixed(1).replace(".", ",")}%`
                    : "—"}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Narrative from CDG */}
      {cdgData?.narrative && (
        <NarrativeBox tag="Cosa significa">
          {cdgData.narrative.revenueNote} {cdgData.narrative.profitabilityNote}
        </NarrativeBox>
      )}
    </div>
  );
}
