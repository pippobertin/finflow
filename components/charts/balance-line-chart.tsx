"use client";

import {
  ComposedChart,
  Area,
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
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="none" stroke="#f1f5f9" strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => {
            try {
              return formatDateChart(new Date(v + "-01"));
            } catch {
              return v;
            }
          }}
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          stroke="transparent"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatEURCompact(v)}
          tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
          width={60}
          stroke="transparent"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<ChartTooltip />} />
        <Legend />

        {/* Historical balance area — soft curve */}
        <Area
          type="monotone"
          dataKey="balance"
          fill="url(#balanceGradient)"
          fillOpacity={1}
          stroke="#4F46E5"
          strokeWidth={2.5}
          strokeLinecap="round"
          name="Saldo"
          connectNulls
          animationDuration={1200}
          dot={{ r: 3, fill: "#4F46E5", stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#4F46E5", stroke: "#fff", strokeWidth: 2.5 }}
        />

        {/* Projection — soft dashed curve with subtle area fill */}
        <Area
          type="monotone"
          dataKey="projected"
          fill="url(#projectionGradient)"
          fillOpacity={1}
          stroke="#059669"
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinecap="round"
          name="Proiezione"
          connectNulls
          animationDuration={1200}
          dot={{ r: 0 }}
          activeDot={{ r: 4, fill: "#059669", stroke: "#fff", strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
