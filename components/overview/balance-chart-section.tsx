"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceLineChart } from "@/components/charts/balance-line-chart";
import { useForecast } from "@/lib/hooks/use-overview";
import type { BalanceChartPoint } from "@/lib/queries/overview";

interface BalanceChartSectionProps {
  historicalData: BalanceChartPoint[];
}

export function BalanceChartSection({ historicalData }: BalanceChartSectionProps) {
  const { data: forecastData } = useForecast(6);

  // Merge historical + forecast into one dataset
  const chartData = [
    ...historicalData.map((d) => ({
      date: d.date,
      balance: d.balance,
      inflows: d.inflows,
      outflows: d.outflows,
      projected: undefined as number | undefined,
      lower: undefined as number | undefined,
      upper: undefined as number | undefined,
    })),
    ...(forecastData?.forecast ?? []).map(
      (f: { date: string; projected: number; lower: number; upper: number }) => ({
        date: f.date,
        balance: undefined as number | undefined,
        inflows: undefined as number | undefined,
        outflows: undefined as number | undefined,
        projected: f.projected,
        lower: f.lower,
        upper: f.upper,
      }),
    ),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Andamento Saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceLineChart data={chartData} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
