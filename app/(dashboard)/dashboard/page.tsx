"use client";

import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { KpiHeroGrid, type HeroKpi } from "@/components/client/kpi-hero-grid";
import { NarrativeBox } from "@/components/client/narrative-box";
import { SemaphoreBadge } from "@/components/client/semaphore-badge";
import { formatEUR } from "@/lib/helpers/format";
import { DollarSign, TrendingUp, PiggyBank, Wallet } from "lucide-react";
import Link from "next/link";
import type { HealthIndicator } from "@/lib/analysis/client-indicators";

function fmtPct(v: number): string {
  return v.toFixed(1).replace(".", ",") + "%";
}

export default function ClientDashboardPage() {
  const { data, isLoading, error } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
          <div className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Come sta andando la tua azienda</h1>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {error instanceof Error ? error.message : "Nessun bilancio disponibile."} Contatta il
            tuo commercialista per il caricamento dei dati.
          </p>
        </div>
      </div>
    );
  }

  const { incomeStatement: ce, ratios, bep, indicators, narrative } = data;
  const period = `${data.periodStart} – ${data.periodEnd}`;

  const kpis: HeroKpi[] = [
    {
      label: "Ricavi",
      value: formatEUR(ce.revenue),
      note: `Periodo: ${period}`,
      icon: DollarSign,
      featured: true,
    },
    {
      label: "EBITDA",
      value: formatEUR(ce.ebitda),
      icon: TrendingUp,
      trend:
        ratios.ebitdaMargin != null
          ? { value: `Margine ${fmtPct(ratios.ebitdaMargin)}`, positive: ratios.ebitdaMargin >= 15 }
          : undefined,
    },
    {
      label: "Utile Netto",
      value: formatEUR(ce.netIncome),
      icon: PiggyBank,
      trend:
        ratios.netMargin != null
          ? { value: fmtPct(ratios.netMargin), positive: ce.netIncome > 0 }
          : undefined,
    },
    {
      label: "Punto di Pareggio",
      value: bep ? formatEUR(bep.bep) : "N/D",
      note: bep ? `Margine di sicurezza: ${fmtPct(bep.safetyMargin)}` : undefined,
      icon: Wallet,
    },
  ];

  // Select top 4 indicators for the summary
  const topIndicators = indicators.slice(0, 4);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Controllo di gestione — sintesi per il cliente
        </p>
        <h1 className="mt-1 text-2xl font-bold lg:text-3xl">Come sta andando la tua azienda</h1>
        <p className="mt-1 text-sm text-slate-500">Dati dal bilancio di verifica: {period}</p>
      </div>

      {/* KPI Grid */}
      <KpiHeroGrid kpis={kpis} />

      {/* Narrative box */}
      <NarrativeBox>{narrative.inBreve}</NarrativeBox>

      {/* Health indicators summary */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Indicatori di salute</h2>
          <Link
            href="/salute-finanziaria"
            className="text-sm font-medium text-[var(--brand,#0b4d8a)] hover:underline"
          >
            Vedi tutti →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topIndicators.map((ind: HealthIndicator) => (
            <div
              key={ind.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                {ind.label}
              </p>
              <p className="font-numeric mt-1 text-xl font-bold tabular-nums">{ind.formatted}</p>
              <div className="mt-1.5">
                <SemaphoreBadge status={ind.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/andamento" title="Andamento ricavi" desc="Come evolve il fatturato" />
        <QuickLink href="/quanto-guadagno" title="Quanto guadagno" desc="Dal ricavo all'utile" />
        <QuickLink
          href="/dove-vanno-i-soldi"
          title="Dove vanno i soldi"
          desc="Composizione dei costi"
        />
        <QuickLink
          href="/punto-pareggio"
          title="Punto di pareggio"
          desc="Soglia minima di ricavi"
        />
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
    >
      <p className="text-sm font-semibold group-hover:text-[var(--brand,#0b4d8a)]">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </Link>
  );
}
