"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import type { DistributionSlice } from "@/lib/queries/overview";

interface DistributionSectionProps {
  data: DistributionSlice[];
}

export function DistributionSection({ data }: DistributionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuzione Spese</CardTitle>
      </CardHeader>
      <CardContent>
        <ExpenseDonutChart data={data} />
      </CardContent>
    </Card>
  );
}
