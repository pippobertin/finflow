"use client";

import { useState, useMemo } from "react";
import { format, addDays, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Navbar } from "@/components/dashboard/navbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        {/* Date range picker row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label htmlFor="kpi-from" className="text-muted-foreground text-xs">
              Da
            </Label>
            <Input
              id="kpi-from"
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kpi-to" className="text-muted-foreground text-xs">
              A
            </Label>
            <Input
              id="kpi-to"
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <p className="text-muted-foreground pb-2 text-xs">
            Intervallo per crediti, debiti e saldo proiettato
          </p>
        </div>

        <KpiGrid kpis={overview.kpis} rangeLabel={rangeLabel} />

        <BalanceChartSection historicalData={overview.balanceChart} />

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChartSection data={overview.revenueDistribution} />
          <DistributionSection data={overview.distribution} />
        </div>
      </div>
    </>
  );
}
