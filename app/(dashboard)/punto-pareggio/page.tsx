"use client";

import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { NarrativeBox } from "@/components/client/narrative-box";
import { SemaphoreBadge } from "@/components/client/semaphore-badge";
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

export default function PuntoPareggioPage() {
  const { data, isLoading, error } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 h-[350px] animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Punto di pareggio</h1>
        <p className="mt-4 text-sm text-slate-500">Nessun dato disponibile.</p>
      </div>
    );
  }

  const { incomeStatement: ce, bep } = data;

  if (!bep) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Punto di pareggio</h1>
        <p className="mt-4 text-sm text-slate-500">
          Impossibile calcolare il punto di pareggio (margine di contribuzione non disponibile).
        </p>
      </div>
    );
  }

  const chartData = [
    { name: "Ricavi", value: ce.revenue },
    { name: "Punto di pareggio", value: bep.bep },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Punto di pareggio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Qual è la soglia di ricavi sotto la quale l&apos;azienda è in perdita.
        </p>
      </div>

      {/* KPI summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Punto di Pareggio (BEP)
          </p>
          <p className="font-numeric mt-1 text-2xl font-bold tabular-nums">{formatEUR(bep.bep)}</p>
          <p className="mt-1 text-xs text-slate-500">Soglia minima per non perdere</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Margine di sicurezza
          </p>
          <p className="font-numeric mt-1 text-2xl font-bold tabular-nums">
            {fmtPct(bep.safetyMargin)}
          </p>
          <div className="mt-1.5">
            <SemaphoreBadge status={bep.safetyMarginStatus} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Ricavi attuali
          </p>
          <p className="font-numeric mt-1 text-2xl font-bold tabular-nums">
            {formatEUR(ce.revenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatEUR(ce.revenue - bep.bep)} sopra il pareggio
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold">Ricavi vs Punto di pareggio</h3>
        <p className="mb-4 text-xs text-slate-500">
          La colonna blu sono i ricavi; la colonna ambra è il pareggio
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
                <Cell fill="#0b4d8a" />
                <Cell fill="#b45309" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <NarrativeBox tag="Cosa significa">
        Il punto di pareggio (BEP, Break Even Point) è la cifra minima di ricavi che serve per
        coprire tutti i costi, senza guadagnare nulla. Sopra questa soglia si produce utile, sotto
        si va in perdita. Il BEP attuale è di {formatEUR(bep.bep)}; l&apos;azienda ha fatturato{" "}
        {formatEUR(ce.revenue)}, ben oltre. Il margine di sicurezza al {fmtPct(bep.safetyMargin)}{" "}
        dice che i ricavi potrebbero calare fino a quel valore prima di mettere a rischio la
        redditività.
      </NarrativeBox>
    </div>
  );
}
