"use client";

import { useState } from "react";
import { useClientScadenze, type ScadenzaItem } from "@/lib/hooks/use-client-scadenze";
import { formatEUR, formatDate } from "@/lib/helpers/format";
import { CalendarClock, ArrowDownLeft, ArrowUpRight, Filter, AlertTriangle } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  invoice_active: "Fattura attiva",
  invoice_passive: "Fattura passiva",
  recurring_expense: "Spesa ricorrente",
  expected_payable: "Pagamento atteso",
  vat: "IVA",
  f24: "F24",
  loan: "Rata prestito",
};

const TYPE_COLORS: Record<string, string> = {
  invoice_active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  invoice_passive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  recurring_expense: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  expected_payable: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  vat: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function groupByMonth(items: ScadenzaItem[]): Record<string, ScadenzaItem[]> {
  const groups: Record<string, ScadenzaItem[]> = {};
  for (const item of items) {
    const key = item.date.slice(0, 7); // YYYY-MM
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-");
  const months = [
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
  return `${months[parseInt(m) - 1]} ${y}`;
}

export default function ScadenzePage() {
  const [days, setDays] = useState(90);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<"all" | "in" | "out">("all");
  const { data, isLoading, error } = useClientScadenze(days);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Scadenze</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Errore nel caricamento delle scadenze.</p>
        </div>
      </div>
    );
  }

  const { items } = data;
  let filtered = typeFilter ? items.filter((i) => i.type === typeFilter) : items;
  if (directionFilter !== "all") {
    filtered = filtered.filter((i) => i.direction === directionFilter);
  }
  const filteredIn = filtered.filter((i) => i.direction === "in").reduce((s, i) => s + i.amount, 0);
  const filteredOut = filtered
    .filter((i) => i.direction === "out")
    .reduce((s, i) => s + i.amount, 0);
  const summary = {
    totalIn: Math.round(filteredIn),
    totalOut: Math.round(filteredOut),
    netFlow: Math.round(filteredIn - filteredOut),
    count: filtered.length,
  };
  const overdueItems = filtered.filter((i) => i.isOverdue);
  const upcomingItems = filtered.filter((i) => !i.isOverdue);
  const grouped = groupByMonth(upcomingItems);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Operativo</p>
        <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Cosa paghi, cosa incassi</h1>
        <p className="mt-1 text-sm text-slate-500">Il calendario dei prossimi {days} giorni</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600">
            <ArrowDownLeft className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Incassi attesi</span>
          </div>
          <p className="font-numeric mt-1 text-xl font-bold text-emerald-600 tabular-nums">
            +{formatEUR(summary.totalIn)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-red-500">
            <ArrowUpRight className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Uscite previste</span>
          </div>
          <p className="font-numeric mt-1 text-xl font-bold text-red-500 tabular-nums">
            −{formatEUR(summary.totalOut)}
          </p>
        </div>
        <div
          className="rounded-xl p-4 text-white"
          style={{ backgroundColor: "var(--brand, #0b4d8a)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
              <CalendarClock className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold tracking-wide text-white/70 uppercase">
              Flusso netto
            </span>
          </div>
          <p className="font-numeric mt-1 text-xl font-bold text-white tabular-nums">
            {summary.netFlow >= 0 ? "+" : ""}
            {formatEUR(summary.netFlow)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <button
          onClick={() => setTypeFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !typeFilter
              ? "bg-[var(--brand,#0b4d8a)] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          Tutte ({items.length})
        </button>
        {Object.entries(TYPE_LABELS).map(([type, label]) => {
          const count = items.filter((i) => i.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === type
                  ? "bg-[var(--brand,#0b4d8a)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}

        <div className="mx-2 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        {(
          [
            { value: "all", label: "Tutte" },
            { value: "in", label: "Solo entrate" },
            { value: "out", label: "Solo uscite" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDirectionFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              directionFilter === opt.value
                ? "bg-[var(--brand,#0b4d8a)] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="ml-auto flex gap-1">
          {[30, 60, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                days === d
                  ? "bg-[var(--brand,#0b4d8a)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {d}gg
            </button>
          ))}
        </div>
      </div>

      {/* Overdue section */}
      {overdueItems.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-red-500 uppercase">
            <AlertTriangle className="h-3.5 w-3.5" />
            In ritardo
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {overdueItems.length}
            </span>
          </h3>
          <div className="rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
            <div className="divide-y divide-red-100 dark:divide-red-900/30">
              {overdueItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 shrink-0 text-right">
                      <span className="font-numeric text-sm font-medium text-red-500 tabular-nums">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span
                    className={`font-numeric text-sm font-semibold tabular-nums ${
                      item.direction === "in" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {item.direction === "in" ? "+" : "−"}
                    {formatEUR(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timeline grouped by month */}
      {upcomingItems.length === 0 && overdueItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Nessuna scadenza nel periodo selezionato.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthItems]) => (
            <div key={month}>
              <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                {formatMonthLabel(month)}
              </h3>
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {monthItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 shrink-0 text-right">
                          <span className="font-numeric text-sm text-slate-500 tabular-nums">
                            {formatDate(item.date)}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            TYPE_COLORS[item.type] ?? "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span
                        className={`font-numeric text-sm font-semibold tabular-nums ${
                          item.direction === "in" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {item.direction === "in" ? "+" : "−"}
                        {formatEUR(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
