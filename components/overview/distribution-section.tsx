"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDonutChart } from "@/components/charts/expense-donut-chart";
import type { DistributionSlice } from "@/lib/queries/overview";

interface DistributionSectionProps {
  data: DistributionSlice[];
}

export function DistributionSection({ data }: DistributionSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Distribuzione Spese</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseDonutChart data={data} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
