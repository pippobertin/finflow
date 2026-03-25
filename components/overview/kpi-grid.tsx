"use client";

import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatEUR } from "@/lib/helpers/format";
import type { OverviewKpis } from "@/lib/queries/overview";

interface KpiGridProps {
  kpis: OverviewKpis;
  rangeLabel?: string;
}

export function KpiGrid({ kpis, rangeLabel }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Saldo Attuale"
        value={formatEUR(kpis.currentBalance)}
        icon={Wallet}
        accentColor="blue"
      />
      <KpiCard
        title="Crediti in Scadenza"
        subtitle={rangeLabel}
        value={formatEUR(kpis.pendingCredits)}
        icon={ArrowUpRight}
        accentColor="green"
      />
      <KpiCard
        title="Debiti in Scadenza"
        subtitle={rangeLabel}
        value={formatEUR(kpis.pendingDebits)}
        icon={ArrowDownRight}
        accentColor="red"
      />
      <KpiCard
        title="Saldo Proiettato"
        subtitle={rangeLabel}
        value={formatEUR(kpis.projectedBalance)}
        icon={TrendingUp}
        accentColor="purple"
        trend={
          kpis.projectedBalance > kpis.currentBalance
            ? { value: formatEUR(kpis.projectedBalance - kpis.currentBalance), positive: true }
            : kpis.projectedBalance < kpis.currentBalance
              ? { value: formatEUR(kpis.currentBalance - kpis.projectedBalance), positive: false }
              : undefined
        }
      />
    </div>
  );
}
