"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyProjectionPoint } from "@/lib/types/cashflow";

interface MainForecastChartProps {
  data: DailyProjectionPoint[];
  baseData?: DailyProjectionPoint[];
  threshold: number;
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

function CustomTooltip({
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
    <div className="border-l-primary shadow-card rounded-lg border border-l-4 bg-white p-3 dark:bg-slate-900">
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

export function MainForecastChart({ data, baseData, threshold }: MainForecastChartProps) {
  const today = new Date().toISOString().split("T")[0];
  const hasDualCurve = !!baseData && baseData.length > 0;

  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      historical: d.date <= today ? d.balance : undefined,
      projected: d.date >= today ? d.balance : undefined,
      baseBalance: hasDualCurve ? baseData[i]?.balance : undefined,
    }));
  }, [data, baseData, today, hasDualCurve]);

  const { zeroOffset, hasNegative } = useMemo(() => {
    if (!data.length) return { zeroOffset: 1, hasNegative: false };
    const allBalances = [...data.map((d) => d.balance), ...(baseData?.map((d) => d.balance) ?? [])];
    const maxBal = Math.max(...allBalances, 0);
    const minBal = Math.min(...allBalances, 0);
    const range = maxBal - minBal;
    return {
      zeroOffset: range > 0 ? maxBal / range : 1,
      hasNegative: minBal < 0,
    };
  }, [data, baseData]);

  const gradientStops = useMemo(() => {
    const pct = `${(zeroOffset * 100).toFixed(2)}%`;
    return { pct };
  }, [zeroOffset]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>
          {hasDualCurve ? "Proiezione Saldo — Base vs What If" : "Proiezione Saldo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset={gradientStops.pct} stopColor="#4F46E5" stopOpacity={0.05} />
                <stop offset={gradientStops.pct} stopColor="#DC2626" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0.35} />
              </linearGradient>
              <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                <stop offset={gradientStops.pct} stopColor="#4F46E5" stopOpacity={0.02} />
                <stop offset={gradientStops.pct} stopColor="#DC2626" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="whatIfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
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
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 11, fill: "#64748B" }}
              width={90}
              stroke="#E2E8F0"
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Base curve (gray) when dual mode */}
            {hasDualCurve && (
              <Line
                type="monotone"
                dataKey="baseBalance"
                name="Scenario base"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
              />
            )}

            {/* Historical balance */}
            <Area
              type="monotone"
              dataKey="historical"
              name="Storico"
              stroke="#4F46E5"
              fill="url(#histGradient)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />

            {/* Projected balance (main or what-if curve) */}
            <Area
              type="monotone"
              dataKey="projected"
              name={hasDualCurve ? "What If" : "Proiezione"}
              stroke={hasDualCurve ? "#059669" : "#4F46E5"}
              fill={hasDualCurve ? "url(#whatIfGradient)" : "url(#projGradient)"}
              strokeWidth={2}
              strokeDasharray={hasDualCurve ? undefined : "8 4"}
              dot={false}
              connectNulls={false}
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

            {threshold !== 0 && (
              <ReferenceLine
                y={threshold}
                stroke="#DC2626"
                strokeDasharray="6 3"
                label={{
                  value: `Soglia minima ${formatCurrency(threshold)}`,
                  position: "insideTopRight",
                  fill: "#DC2626",
                  fontSize: 11,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
