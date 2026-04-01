"use client";

import { useState, useMemo } from "react";
import { format, addDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Navbar } from "@/components/dashboard/navbar";
import { Label } from "@/components/ui/label";
import { DataFreshnessBanner } from "@/components/dashboard/data-freshness-banner";
import { KpiGrid } from "./kpi-grid";
import { BalanceChartSection } from "./balance-chart-section";
import { CategoryChartSection } from "./category-chart-section";
import { DistributionSection } from "./distribution-section";
import { useOverview } from "@/lib/hooks/use-overview";
import type { OverviewData } from "@/lib/queries/overview";

interface OverviewClientProps {
  initialData: OverviewData;
}

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function OverviewClient({ initialData }: OverviewClientProps) {
  const today = useMemo(() => new Date(), []);
  const [dateFrom, setDateFrom] = useState(toIsoDate(today));
  const [dateTo, setDateTo] = useState(toIsoDate(addDays(today, 90)));

  const { data } = useOverview(initialData, dateFrom, dateTo);
  const overview = data ?? initialData;

  const rangeLabel = useMemo(() => {
    try {
      const from = format(parseISO(dateFrom), "dd MMM yyyy", { locale: it });
      const to = format(parseISO(dateTo), "dd MMM yyyy", { locale: it });
      return `${from} → ${to}`;
    } catch {
      return "";
    }
  }, [dateFrom, dateTo]);

  return (
    <>
      <Navbar title="Panoramica" />
      <div className="space-y-6 p-6">
        <DataFreshnessBanner />
        {/* Date range picker row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="kpi-from" className="text-muted-foreground text-[11px]">
              Da
            </Label>
            <input
              id="kpi-from"
              type="date"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-40 rounded-lg border bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kpi-to" className="text-muted-foreground text-[11px]">
              A
            </Label>
            <input
              id="kpi-to"
              type="date"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-40 rounded-lg border bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <p className="text-muted-foreground pb-2 text-[11px]">
            Intervallo per crediti, debiti e saldo proiettato
          </p>
        </div>

        {/* KPI Cards */}
        <KpiGrid kpis={overview.kpis} rangeLabel={rangeLabel} />

        {/* Balance chart — monthly trend with 6-month outlook */}
        <BalanceChartSection
          historicalData={overview.balanceChart}
          projectionData={overview.projectionChart ?? []}
        />

        {/* Revenue distribution + Expense distribution side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChartSection data={overview.revenueDistribution} />
          <DistributionSection data={overview.distribution} />
        </div>
      </div>
    </>
  );
}
