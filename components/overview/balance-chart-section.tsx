"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BalanceLineChart } from "@/components/charts/balance-line-chart";
import type { BalanceChartPoint, ProjectedChartPoint } from "@/lib/queries/overview";

interface BalanceChartSectionProps {
  historicalData: BalanceChartPoint[];
  projectionData: ProjectedChartPoint[];
}

export function BalanceChartSection({ historicalData, projectionData }: BalanceChartSectionProps) {
  // Merge historical + projection into one dataset
  const chartData = [
    ...historicalData.map((d) => ({
      date: d.date,
      balance: d.balance,
      inflows: d.inflows,
      outflows: d.outflows,
      projected: undefined as number | undefined,
    })),
    ...projectionData.map((d) => ({
      date: d.date,
      balance: undefined as number | undefined,
      inflows: undefined as number | undefined,
      outflows: undefined as number | undefined,
      projected: d.projected,
    })),
  ];

  // Bridge: last historical point also gets projected = balance so the lines connect
  if (historicalData.length > 0 && projectionData.length > 0) {
    chartData[historicalData.length - 1].projected =
      historicalData[historicalData.length - 1].balance;
  }

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
