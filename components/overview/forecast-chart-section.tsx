"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEURCompact } from "@/lib/helpers/format";
import type { DailyProjectionPoint } from "@/lib/types/cashflow";

interface ForecastChartSectionProps {
  data: DailyProjectionPoint[];
  historyLength: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function ForecastTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass shadow-card rounded-lg border border-l-4 border-l-indigo-500 p-3">
      <p className="text-muted-foreground mb-1 text-xs font-medium">
        {label ? formatDate(label) : ""}
      </p>
      {payload.map((entry, i) => {
        if (entry.value == null) return null;
        const isNegative = entry.value < 0;
        return (
          <p
            key={i}
            className="font-numeric text-sm font-medium"
            style={{ color: isNegative ? "#DC2626" : entry.color }}
          >
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        );
      })}
    </div>
  );
}

export function ForecastChartSection({ data }: ForecastChartSectionProps) {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { chartData, zeroOffset, hasNegative } = useMemo(() => {
    if (!data.length) return { chartData: [], zeroOffset: 1, hasNegative: false };

    const mapped = data.map((d) => ({
      date: d.date,
      historical: d.date <= today ? d.balance : undefined,
      projected: d.date >= today ? d.balance : undefined,
    }));

    const allBalances = data.map((d) => d.balance);
    const maxBal = Math.max(...allBalances, 0);
    const minBal = Math.min(...allBalances, 0);
    const range = maxBal - minBal;

    return {
      chartData: mapped,
      zeroOffset: range > 0 ? maxBal / range : 1,
      hasNegative: minBal < 0,
    };
  }, [data, today]);

  if (!chartData.length) return null;

  const pct = `${(zeroOffset * 100).toFixed(2)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
    >
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Proiezione Saldo Giornaliera</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="ovHistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                  <stop offset={pct} stopColor="#4F46E5" stopOpacity={0.05} />
                  <stop offset={pct} stopColor="#DC2626" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.35} />
                </linearGradient>
                <linearGradient id="ovProjGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset={pct} stopColor="#4F46E5" stopOpacity={0.02} />
                  <stop offset={pct} stopColor="#DC2626" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "#64748B" }}
                interval="preserveStartEnd"
                stroke="#E2E8F0"
              />
              <YAxis
                tickFormatter={(v: number) => formatEURCompact(v)}
                tick={{ fontSize: 11, fill: "#64748B" }}
                width={80}
                stroke="#E2E8F0"
              />
              <Tooltip content={<ForecastTooltip />} />

              <Area
                type="monotone"
                dataKey="historical"
                name="Storico"
                stroke="#4F46E5"
                fill="url(#ovHistGrad)"
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                connectNulls={false}
                animationDuration={1200}
              />
              <Area
                type="monotone"
                dataKey="projected"
                name="Proiezione"
                stroke="#4F46E5"
                fill="url(#ovProjGrad)"
                strokeWidth={2}
                strokeDasharray="8 4"
                strokeLinecap="round"
                dot={false}
                connectNulls={false}
                animationDuration={1200}
              />

              {hasNegative && (
                <ReferenceLine
                  y={0}
                  stroke="#DC2626"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  label={{
                    value: "Zero",
                    position: "insideTopRight",
                    fill: "#DC2626",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
