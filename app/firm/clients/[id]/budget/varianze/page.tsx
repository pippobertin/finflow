"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEUR, formatPercent } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import type { VarianceLine } from "@/lib/analysis/budget-variance";

interface VarianceData {
  year: number;
  upToMonth: number;
  snapshotPeriodEnd: string;
  revenue: VarianceLine;
  variableCosts: VarianceLine;
  mdc: VarianceLine;
  fixedCostsOperating: VarianceLine;
  ebitda: VarianceLine;
  depreciation: VarianceLine;
  ebit: VarianceLine;
  financialNet: VarianceLine;
  extraordinaryNet: VarianceLine;
  pretaxIncome: VarianceLine;
  tax: VarianceLine;
  netIncome: VarianceLine;
}

const MONTH_NAMES = [
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

const CE_ROWS: { key: keyof VarianceData; isSubtotal?: boolean }[] = [
  { key: "revenue" },
  { key: "variableCosts" },
  { key: "mdc", isSubtotal: true },
  { key: "fixedCostsOperating" },
  { key: "ebitda", isSubtotal: true },
  { key: "depreciation" },
  { key: "ebit", isSubtotal: true },
  { key: "financialNet" },
  { key: "extraordinaryNet" },
  { key: "pretaxIncome", isSubtotal: true },
  { key: "tax" },
  { key: "netIncome", isSubtotal: true },
];

export default function VarianzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<VarianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVariance = useCallback(
    async (signal: AbortSignal) => {
      try {
        const res = await fetch(`/api/firm/clients/${id}/budget/varianze?year=${year}`, { signal });
        if (signal.aborted) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error ?? `Errore ${res.status}`);
          setData(null);
        } else {
          setError(null);
          setData(await res.json());
        }
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Errore di rete");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [id, year],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadVariance(controller.signal);
    return () => controller.abort();
  }, [loadVariance]);

  const handleYearChange = useCallback((v: string) => {
    setYear(Number(v));
    setLoading(true);
    setError(null);
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/firm/clients/${id}/budget`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Varianze Budget</h1>
            <p className="text-muted-foreground text-sm">Budget vs Consuntivo</p>
          </div>
        </div>
        <Select value={String(year)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-muted-foreground">Caricamento...</p>}
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Period info */}
          <p className="text-muted-foreground text-xs">
            Consuntivo al {data.snapshotPeriodEnd} — confronto fino a{" "}
            {MONTH_NAMES[data.upToMonth - 1]} {data.year}
          </p>

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KPICard label="Ricavi" line={data.revenue} />
            <KPICard label="EBITDA" line={data.ebitda} />
            <KPICard label="Utile Netto" line={data.netIncome} />
          </div>

          {/* Variance table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Voce</th>
                  <th className="px-4 py-2.5 text-right font-medium">Budget</th>
                  <th className="px-4 py-2.5 text-right font-medium">Consuntivo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Var. €</th>
                  <th className="px-4 py-2.5 text-right font-medium">Var. %</th>
                </tr>
              </thead>
              <tbody>
                {CE_ROWS.map(({ key, isSubtotal }) => {
                  const line = data[key] as VarianceLine;
                  if (!line) return null;
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "border-b last:border-0",
                        isSubtotal && "bg-slate-50 font-semibold dark:bg-slate-900/50",
                      )}
                    >
                      <td className="px-4 py-2">{line.label}</td>
                      <td className="font-numeric px-4 py-2 text-right">
                        {formatEUR(line.budget)}
                      </td>
                      <td className="font-numeric px-4 py-2 text-right">
                        {formatEUR(line.actual)}
                      </td>
                      <td
                        className={cn(
                          "font-numeric px-4 py-2 text-right",
                          line.favorable === true && "text-emerald-600",
                          line.favorable === false && "text-red-600",
                        )}
                      >
                        {line.varianceAbs >= 0 ? "+" : ""}
                        {formatEUR(line.varianceAbs)}
                      </td>
                      <td
                        className={cn(
                          "font-numeric px-4 py-2 text-right",
                          line.favorable === true && "text-emerald-600",
                          line.favorable === false && "text-red-600",
                        )}
                      >
                        {line.variancePct != null ? (
                          <>
                            {line.variancePct >= 0 ? "+" : ""}
                            {formatPercent(line.variancePct / 100)}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, line }: { label: string; line: VarianceLine }) {
  const Icon =
    line.favorable === true ? TrendingUp : line.favorable === false ? TrendingDown : Minus;
  const color =
    line.favorable === true
      ? "text-emerald-600"
      : line.favorable === false
        ? "text-red-600"
        : "text-slate-500";

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-slate-950">
      <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
      <p className="font-numeric text-xl font-bold">{formatEUR(line.actual)}</p>
      <div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", color)}>
        <Icon className="h-3.5 w-3.5" />
        <span>
          {line.variancePct != null
            ? `${line.variancePct >= 0 ? "+" : ""}${formatPercent(line.variancePct / 100)}`
            : "—"}{" "}
          vs budget
        </span>
      </div>
    </div>
  );
}
