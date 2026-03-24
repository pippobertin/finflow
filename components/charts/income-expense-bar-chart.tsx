"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatEURCompact } from "@/lib/helpers/format";

interface CategoryData {
  costCenter: string;
  color: string;
  income: number;
  expense: number;
}

interface IncomeExpenseBarChartProps {
  data: CategoryData[];
}

export function IncomeExpenseBarChart({ data }: IncomeExpenseBarChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="costCenter" className="text-xs" angle={-20} textAnchor="end" height={60} />
        <YAxis tickFormatter={(v) => formatEURCompact(v)} className="text-xs" width={80} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />
        <Bar dataKey="income" name="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Uscite" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
