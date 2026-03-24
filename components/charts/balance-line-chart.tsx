"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Brush,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatEURCompact, formatDateChart } from "@/lib/helpers/format";

interface DataPoint {
  date: string;
  balance?: number;
  inflows?: number;
  outflows?: number;
  projected?: number;
  lower?: number;
  upper?: number;
}

interface BalanceLineChartProps {
  data: DataPoint[];
}

export function BalanceLineChart({ data }: BalanceLineChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => {
            try {
              return formatDateChart(new Date(v + "-01"));
            } catch {
              return v;
            }
          }}
          className="text-xs"
        />
        <YAxis tickFormatter={(v) => formatEURCompact(v)} className="text-xs" width={80} />
        <Tooltip content={<ChartTooltip />} />
        <Legend />

        {/* Confidence interval area */}
        <Area
          dataKey="upper"
          stroke="none"
          fill="url(#confidenceGradient)"
          fillOpacity={1}
          name="Intervallo sup."
          connectNulls={false}
        />
        <Area
          dataKey="lower"
          stroke="none"
          fill="url(#confidenceGradient)"
          fillOpacity={1}
          name="Intervallo inf."
          connectNulls={false}
        />

        {/* Historical balance area */}
        <Area
          dataKey="balance"
          fill="url(#balanceGradient)"
          fillOpacity={1}
          stroke="#6366f1"
          strokeWidth={2.5}
          name="Saldo"
          connectNulls
        />

        {/* Forecast dashed line */}
        <Line
          dataKey="projected"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeDasharray="5 5"
          dot={false}
          name="Proiezione"
          connectNulls={false}
        />

        <Brush
          dataKey="date"
          height={30}
          stroke="hsl(var(--border))"
          tickFormatter={(v) => {
            try {
              return formatDateChart(new Date(v + "-01"));
            } catch {
              return v;
            }
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
