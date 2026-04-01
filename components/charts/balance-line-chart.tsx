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
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => {
            try {
              return formatDateChart(new Date(v + "-01"));
            } catch {
              return v;
            }
          }}
          tick={{ fontSize: 11, fill: "#64748B" }}
          stroke="#E2E8F0"
        />
        <YAxis
          tickFormatter={(v) => formatEURCompact(v)}
          tick={{ fontSize: 11, fill: "#64748B" }}
          width={80}
          stroke="#E2E8F0"
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend />

        {/* Historical balance area */}
        <Area
          dataKey="balance"
          fill="url(#balanceGradient)"
          fillOpacity={1}
          stroke="#4F46E5"
          strokeWidth={2.5}
          strokeLinecap="round"
          name="Saldo"
          connectNulls
          animationDuration={1200}
        />

        {/* Projection dashed line */}
        <Line
          dataKey="projected"
          stroke="#059669"
          strokeWidth={2.5}
          strokeDasharray="5 5"
          strokeLinecap="round"
          dot={false}
          name="Proiezione"
          connectNulls
          animationDuration={1200}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
