"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientPreconsuntivo } from "@/lib/hooks/use-client-preconsuntivo";
import { formatEUR } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import type { IncomeStatementResult } from "@/lib/analysis/income-statement";

const MONTH_NAMES_SHORT = [
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

/** CE rows to display in the projection table */
const CE_DISPLAY_KEYS: { key: keyof IncomeStatementResult; label: string; isSubtotal?: boolean }[] =
  [
    { key: "revenue", label: "Ricavi" },
    { key: "variableCosts", label: "Costi variabili" },
    { key: "mdc", label: "Margine di Contribuzione", isSubtotal: true },
    { key: "fixedCostsOperating", label: "Costi fissi operativi" },
    { key: "ebitda", label: "EBITDA", isSubtotal: true },
    { key: "depreciation", label: "Ammortamenti" },
    { key: "ebit", label: "EBIT", isSubtotal: true },
    { key: "financialNet", label: "Gestione finanziaria" },
    { key: "extraordinaryNet", label: "Gestione straordinaria" },
    { key: "pretaxIncome", label: "Utile ante imposte", isSubtotal: true },
    { key: "tax", label: "Imposte" },
    { key: "netIncome", label: "Utile Netto", isSubtotal: true },
  ];

export default function PrevisioneAnnoPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading, error } = useClientPreconsuntivo(year);

  const { data: yearsData } = useQuery({
    queryKey: ["client-preconsuntivo-years"],
    queryFn: async () => {
      const res = await fetch("/api/client/preconsuntivo/years");
      if (!res.ok) return { years: [currentYear + 1, currentYear, currentYear - 1] };
      return res.json() as Promise<{ years: number[] }>;
    },
    staleTime: 10 * 60 * 1000,
  });
  const availableYears = yearsData?.years ?? [currentYear + 1, currentYear, currentYear - 1];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dove arriveremo a fine anno</h1>
          <p className="text-muted-foreground text-sm">
            Proiezione basata sui dati effettivi e sul budget rimanente
          </p>
        </div>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-muted-foreground">Caricamento previsione...</p>}

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error instanceof Error ? error.message : "Errore nel caricamento"}
        </div>
      )}

      {data && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ProjectionKPI
              label="Ricavi previsti"
              value={data.projected.revenue}
              icon={TrendingUp}
            />
            <ProjectionKPI label="EBITDA previsto" value={data.projected.ebitda} icon={BarChart3} />
            <ProjectionKPI
              label="Utile Netto previsto"
              value={data.projected.netIncome}
              icon={Calendar}
            />
          </div>

          {/* Source badges */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Effettivo (Gen–{MONTH_NAMES_SHORT[data.boundaryMonth - 1]})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
              Budget ({MONTH_NAMES_SHORT[data.boundaryMonth]}–Dic)
            </span>
          </div>

          {/* CE projection table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-2.5 text-left font-medium">Voce</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Effettivo
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-indigo-500" />
                    Budget
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">Proiezione anno</th>
                </tr>
              </thead>
              <tbody>
                {CE_DISPLAY_KEYS.map(({ key, label, isSubtotal }) => {
                  const actualVal = data.actualPortion[key] as number;
                  const budgetVal = data.budgetPortion[key] as number;
                  const projectedVal = data.projected[key] as number;

                  return (
                    <tr
                      key={key}
                      className={cn(
                        "border-b last:border-0",
                        isSubtotal && "bg-slate-50 font-semibold dark:bg-slate-900/50",
                      )}
                    >
                      <td className="px-4 py-2">{label}</td>
                      <td className="font-numeric px-4 py-2 text-right text-emerald-700 dark:text-emerald-400">
                        {formatEUR(actualVal)}
                      </td>
                      <td className="font-numeric px-4 py-2 text-right text-indigo-700 dark:text-indigo-400">
                        {formatEUR(budgetVal)}
                      </td>
                      <td className="font-numeric px-4 py-2 text-right font-semibold">
                        {formatEUR(projectedVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Deterministic narrative */}
          <Narrative data={data} year={year} />
        </>
      )}
    </div>
  );
}

function ProjectionKPI({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
          <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
      </div>
      <p className="font-numeric mt-2 text-xl font-bold">{formatEUR(value)}</p>
    </div>
  );
}

function Narrative({
  data,
  year,
}: {
  data: {
    projected: IncomeStatementResult;
    actualPortion: IncomeStatementResult;
    boundaryMonth: number;
  };
  year: number;
}) {
  const projRev = data.projected.revenue;
  const projNet = data.projected.netIncome;
  const projEbitda = data.projected.ebitda;
  const marginePct = projRev > 0 ? ((projNet / projRev) * 100).toFixed(1) : "0.0";
  const ebitdaPct = projRev > 0 ? ((projEbitda / projRev) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-5 py-4 text-sm leading-relaxed dark:border-indigo-900 dark:bg-indigo-950/30">
      <p>
        Sulla base dei primi <strong>{data.boundaryMonth} mesi</strong> effettivi e del budget per i
        restanti <strong>{12 - data.boundaryMonth} mesi</strong>, la proiezione {year} indica ricavi
        di <strong className="font-numeric">{formatEUR(projRev)}</strong> con un EBITDA di{" "}
        <strong className="font-numeric">{formatEUR(projEbitda)}</strong> ({ebitdaPct}% dei ricavi)
        e un utile netto di <strong className="font-numeric">{formatEUR(projNet)}</strong> (margine{" "}
        {marginePct}%).
      </p>
    </div>
  );
}
