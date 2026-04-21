"use client";

import { useIncomeStatement } from "@/lib/hooks/use-income-statement";
import { formatEUR, formatPercent } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import type { IncomeStatementResult, CECategoryDetail } from "@/lib/analysis/income-statement";
import type { FinancialRatios } from "@/lib/analysis/financial-ratios";

export function CdgClient() {
  const { data, isLoading, error } = useIncomeStatement();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Controllo di Gestione</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Controllo di Gestione</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {error.message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { incomeStatement: ce, ratios, periodStart, periodEnd, sourceFilename } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">CE Riclassificato</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {periodStart} → {periodEnd} · {sourceFilename}
        </span>
      </div>

      {/* Ratios cards */}
      <RatioCards ratios={ratios} />

      {/* CE Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 dark:text-slate-400">
                Voce
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600 dark:text-slate-400">
                Importo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Revenue */}
            <SubtotalRow label="Ricavi" amount={ce.revenue} variant="revenue" />
            <DetailRows items={ce.variableCostDetail} sign="negative" />
            <SubtotalRow label="Costi Variabili" amount={-ce.variableCosts} variant="cost" />
            <SubtotalRow label="Margine di Contribuzione" amount={ce.mdc} variant="subtotal" />

            {/* Fixed costs */}
            <DetailRows items={ce.fixedCostOperatingDetail} sign="negative" />
            <SubtotalRow
              label="Costi Fissi Operativi"
              amount={-ce.fixedCostsOperating}
              variant="cost"
            />
            <SubtotalRow label="EBITDA" amount={ce.ebitda} variant="highlight" />

            {/* Depreciation */}
            <DetailRows items={ce.depreciationDetail} sign="negative" />
            <SubtotalRow label="EBIT" amount={ce.ebit} variant="highlight" />

            {/* Below EBIT */}
            <DetailRows items={ce.financialDetail} sign="mixed" />
            <SubtotalRow
              label="Saldo Gestione Finanziaria"
              amount={ce.financialNet}
              variant="cost"
            />

            <DetailRows items={ce.extraordinaryDetail} sign="mixed" />
            <SubtotalRow
              label="Saldo Gestione Straordinaria"
              amount={ce.extraordinaryNet}
              variant="cost"
            />

            <DetailRows items={ce.taxDetail} sign="negative" />

            {/* Net Income */}
            <SubtotalRow label="Utile Netto" amount={ce.netIncome} variant="total" />
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function RatioCards({ ratios }: { ratios: FinancialRatios }) {
  const items = [
    { label: "MdC Margin", value: ratios.mdcMargin },
    { label: "EBITDA Margin", value: ratios.ebitdaMargin },
    { label: "EBIT Margin", value: ratios.ebitMargin },
    { label: "Net Margin", value: ratios.netMargin },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
          <p className="font-numeric mt-1 text-lg font-semibold tabular-nums">
            {item.value != null ? formatPercent(item.value) : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

function SubtotalRow({
  label,
  amount,
  variant,
}: {
  label: string;
  amount: number;
  variant: "revenue" | "cost" | "subtotal" | "highlight" | "total";
}) {
  return (
    <tr
      className={cn(
        "font-medium",
        variant === "highlight" && "bg-indigo-50/50 dark:bg-indigo-900/10",
        variant === "total" && "bg-indigo-100/70 dark:bg-indigo-900/20",
        variant === "subtotal" && "bg-slate-50/80 dark:bg-slate-800/30",
      )}
    >
      <td className={cn("px-4 py-2", variant === "total" && "text-base font-semibold")}>{label}</td>
      <td
        className={cn(
          "font-numeric px-4 py-2 text-right tabular-nums",
          amount > 0 && "text-emerald-600 dark:text-emerald-400",
          amount < 0 && "text-red-600 dark:text-red-400",
          variant === "total" && "text-base font-semibold",
        )}
      >
        {formatEUR(amount)}
      </td>
    </tr>
  );
}

function DetailRows({ items, sign }: { items: CECategoryDetail[]; sign: "negative" | "mixed" }) {
  if (items.length === 0) return null;
  return (
    <>
      {items.map((item) => {
        const displayAmount = sign === "negative" ? -item.amount : item.amount;
        const isExpense = item.cdgCategory.includes("EXPENSE") || item.cdgCategory.includes("TAX");
        const signedAmount = sign === "mixed" && isExpense ? -item.amount : displayAmount;
        return (
          <tr key={item.cdgCategory + item.amount} className="text-slate-600 dark:text-slate-400">
            <td className="px-4 py-1.5 pl-8 text-xs">{item.label}</td>
            <td className="font-numeric px-4 py-1.5 text-right text-xs tabular-nums">
              {formatEUR(signedAmount)}
            </td>
          </tr>
        );
      })}
    </>
  );
}
