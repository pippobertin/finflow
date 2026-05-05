"use client";

import { use, useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEUR, formatPercent, formatDate } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import type { IncomeStatementQueryResult } from "@/lib/queries/income-statement";
import type { CECategoryDetail } from "@/lib/analysis/income-statement";

interface SnapshotListItem {
  id: string;
  periodStart: string;
  periodEnd: string;
  sourceFilename: string;
  isLocked: boolean;
  _count: { lines: number };
}

export default function FirmCdgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<IncomeStatementQueryResult | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotListItem[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch snapshot list + initial CE data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch snapshots and CE in parallel
        const [listRes, ceRes] = await Promise.all([
          fetch(`/api/firm/clients/${id}/cdg?list=true`),
          fetch(`/api/firm/clients/${id}/cdg`),
        ]);

        if (cancelled) return;

        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.snapshots) setSnapshots(listData.snapshots);
        }

        if (!ceRes.ok) {
          const body = await ceRes.json().catch(() => ({}));
          setError(body.error ?? `Errore ${ceRes.status}`);
        } else {
          setData(await ceRes.json());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Errore di rete");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSnapshotChange = useCallback(
    (snapshotId: string | null) => {
      if (!snapshotId) return;
      setSelectedSnapshotId(snapshotId);
      setLoading(true);
      setError(null);

      fetch(`/api/firm/clients/${id}/cdg?snapshotId=${snapshotId}`)
        .then((r) => {
          if (!r.ok)
            return r.json().then((b) => Promise.reject(new Error(b.error ?? `Errore ${r.status}`)));
          return r.json();
        })
        .then((result) => {
          setData(result);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    },
    [id],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { incomeStatement: ce, ratios, periodStart, periodEnd, sourceFilename } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {formatDate(periodStart)} → {formatDate(periodEnd)} · {sourceFilename}
        </p>
        {snapshots.length > 1 && (
          <Select
            value={selectedSnapshotId ?? data.snapshotId}
            onValueChange={handleSnapshotChange}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue>
                {(() => {
                  const currentId = selectedSnapshotId ?? data.snapshotId;
                  const snap = snapshots.find((s) => s.id === currentId);
                  if (!snap) return "Seleziona periodo";
                  return `${formatDate(snap.periodStart)} → ${formatDate(snap.periodEnd)}`;
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {snapshots.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {formatDate(s.periodStart)} → {formatDate(s.periodEnd)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "MdC", amount: ce.mdc, pct: ratios.mdcMargin },
          { label: "EBITDA", amount: ce.ebitda, pct: ratios.ebitdaMargin },
          { label: "EBIT", amount: ce.ebit, pct: ratios.ebitMargin },
          { label: "Utile Netto", amount: ce.netIncome, pct: ratios.netMargin },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p
              className={cn(
                "font-numeric mt-1 text-lg font-semibold tabular-nums",
                kpi.amount > 0 && "text-emerald-600 dark:text-emerald-400",
                kpi.amount < 0 && "text-red-600 dark:text-red-400",
              )}
            >
              {formatEUR(kpi.amount)}
            </p>
            <p className="font-numeric mt-0.5 text-xs text-slate-500 tabular-nums">
              {kpi.pct != null ? formatPercent(kpi.pct) : "—"}
            </p>
          </div>
        ))}
      </div>

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
              <th className="px-4 py-2.5 text-right font-medium text-slate-600 dark:text-slate-400">
                % Ricavi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            <SubtotalRow label="Ricavi" amount={ce.revenue} pct={100} variant="revenue" />
            <DetailRows items={ce.variableCostDetail} sign="negative" revenue={ce.revenue} />
            <SubtotalRow
              label="Costi Variabili"
              amount={-ce.variableCosts}
              pct={pctOf(-ce.variableCosts, ce.revenue)}
              variant="cost"
            />
            <SubtotalRow
              label="Margine di Contribuzione"
              amount={ce.mdc}
              pct={ratios.mdcMargin}
              variant="subtotal"
            />

            <DetailRows items={ce.fixedCostOperatingDetail} sign="negative" revenue={ce.revenue} />
            <SubtotalRow
              label="Costi Fissi Operativi"
              amount={-ce.fixedCostsOperating}
              pct={pctOf(-ce.fixedCostsOperating, ce.revenue)}
              variant="cost"
            />
            <SubtotalRow
              label="EBITDA"
              amount={ce.ebitda}
              pct={ratios.ebitdaMargin}
              variant="highlight"
            />

            <DetailRows items={ce.depreciationDetail} sign="negative" revenue={ce.revenue} />
            <SubtotalRow
              label="EBIT"
              amount={ce.ebit}
              pct={ratios.ebitMargin}
              variant="highlight"
            />

            <DetailRows items={ce.financialDetail} sign="mixed" revenue={ce.revenue} />
            <SubtotalRow
              label="Saldo Gestione Finanziaria"
              amount={ce.financialNet}
              pct={pctOf(ce.financialNet, ce.revenue)}
              variant="cost"
            />

            <DetailRows items={ce.extraordinaryDetail} sign="mixed" revenue={ce.revenue} />
            <SubtotalRow
              label="Saldo Gestione Straordinaria"
              amount={ce.extraordinaryNet}
              pct={pctOf(ce.extraordinaryNet, ce.revenue)}
              variant="cost"
            />

            <DetailRows items={ce.taxDetail} sign="negative" revenue={ce.revenue} />

            <SubtotalRow
              label="Utile Netto"
              amount={ce.netIncome}
              pct={ratios.netMargin}
              variant="total"
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pctOf(amount: number, revenue: number): number | null {
  if (revenue === 0) return null;
  return (amount / revenue) * 100;
}

function SubtotalRow({
  label,
  amount,
  pct,
  variant,
}: {
  label: string;
  amount: number;
  pct: number | null | undefined;
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
      <td className="font-numeric px-4 py-2 text-right text-xs text-slate-500 tabular-nums">
        {pct != null ? formatPercent(pct / 100) : ""}
      </td>
    </tr>
  );
}

function DetailRows({
  items,
  sign,
  revenue,
}: {
  items: CECategoryDetail[];
  sign: "negative" | "mixed";
  revenue: number;
}) {
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
            <td className="font-numeric px-4 py-1.5 text-right text-xs text-slate-400 tabular-nums">
              {revenue !== 0 ? formatPercent(signedAmount / revenue) : ""}
            </td>
          </tr>
        );
      })}
    </>
  );
}
