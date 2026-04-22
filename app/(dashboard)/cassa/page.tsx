"use client";

import { useClientCassa } from "@/lib/hooks/use-client-cassa";
import { formatEUR } from "@/lib/helpers/format";
import { Landmark, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatChartDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function CassaPage() {
  const { data, isLoading, error } = useClientCassa();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Posizione di cassa</h1>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">
            Nessun dato disponibile. Carica un estratto conto dalla sezione Movimenti.
          </p>
        </div>
      </div>
    );
  }

  const { currentBalance, milestones, chartData, nextItems } = data;

  const kpis = [
    {
      label: "Saldo attuale",
      value: formatEUR(currentBalance),
      icon: Landmark,
      featured: true,
    },
    {
      label: "Proiezione 30gg",
      value: milestones.days30 != null ? formatEUR(milestones.days30) : "N/D",
      icon: ArrowRight,
      delta: milestones.days30 != null ? milestones.days30 - currentBalance : null,
    },
    {
      label: "Proiezione 60gg",
      value: milestones.days60 != null ? formatEUR(milestones.days60) : "N/D",
      icon: ArrowRight,
      delta: milestones.days60 != null ? milestones.days60 - currentBalance : null,
    },
    {
      label: "Proiezione 90gg",
      value: milestones.days90 != null ? formatEUR(milestones.days90) : "N/D",
      icon: ArrowRight,
      delta: milestones.days90 != null ? milestones.days90 - currentBalance : null,
    },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Operativo</p>
        <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Posizione di cassa</h1>
        <p className="mt-1 text-sm text-slate-500">
          Saldo attuale e proiezione a 30, 60, 90 giorni
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-4 ${
              kpi.featured
                ? "border-[var(--brand,#0b4d8a)]/20 bg-gradient-to-br from-[var(--brand,#0b4d8a)]/5 to-transparent"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  kpi.featured
                    ? "bg-[var(--brand,#0b4d8a)]/10 text-[var(--brand,#0b4d8a)]"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <kpi.icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {kpi.label}
              </p>
            </div>
            <p className="font-numeric mt-2 text-xl font-bold tabular-nums">{kpi.value}</p>
            {kpi.delta != null && (
              <div className="mt-1 flex items-center gap-1">
                {kpi.delta >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    kpi.delta >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {kpi.delta >= 0 ? "+" : ""}
                  {formatEUR(kpi.delta)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Projection Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Andamento saldo proiettato
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand, #0b4d8a)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--brand, #0b4d8a)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <Tooltip
                  formatter={(value) => [formatEUR(Number(value)), "Saldo"]}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return d.toLocaleDateString("it-IT");
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--brand, #0b4d8a)"
                  strokeWidth={2}
                  fill="url(#balanceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {nextItems.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Prossimi movimenti previsti
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {nextItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      item.amount > 0 ? "bg-emerald-500" : "bg-red-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(item.date).toLocaleDateString("it-IT")}
                      {item.counterpart && ` · ${item.counterpart}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-numeric text-sm font-semibold tabular-nums ${
                    item.amount > 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {item.amount > 0 ? "+" : ""}
                  {formatEUR(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
