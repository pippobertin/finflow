"use client";

import { Navbar } from "@/components/dashboard/navbar";
import { KpiGrid } from "./kpi-grid";
import { BalanceChartSection } from "./balance-chart-section";
import { CategoryChartSection } from "./category-chart-section";
import { DistributionSection } from "./distribution-section";
import { useOverview } from "@/lib/hooks/use-overview";
import type { OverviewData } from "@/lib/queries/overview";

interface OverviewClientProps {
  initialData: OverviewData;
}

export function OverviewClient({ initialData }: OverviewClientProps) {
  const { data } = useOverview(initialData);
  const overview = data ?? initialData;

  return (
    <>
      <Navbar title="Panoramica" />
      <div className="space-y-6 p-6">
        <KpiGrid kpis={overview.kpis} />

        <BalanceChartSection historicalData={overview.balanceChart} />

        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChartSection data={overview.categoryChart} />
          <DistributionSection data={overview.distribution} />
        </div>
      </div>
    </>
  );
}
