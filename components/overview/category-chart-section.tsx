"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncomeExpenseBarChart } from "@/components/charts/income-expense-bar-chart";
import type { CategoryChartPoint } from "@/lib/queries/overview";

interface CategoryChartSectionProps {
  data: CategoryChartPoint[];
}

export function CategoryChartSection({ data }: CategoryChartSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrate vs Uscite per Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <IncomeExpenseBarChart data={data} />
      </CardContent>
    </Card>
  );
}
