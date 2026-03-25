"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import type { RevenueDistributionSlice } from "@/lib/queries/overview";

interface RevenueChartSectionProps {
  data: RevenueDistributionSlice[];
}

export function CategoryChartSection({ data }: RevenueChartSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuzione Entrate per Centro di Ricavo</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ExpenseDonutChart data={data} />
        ) : (
          <p className="text-muted-foreground py-12 text-center text-sm">
            Nessuna entrata associata a centri di ricavo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
