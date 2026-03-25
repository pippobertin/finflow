"use client";

import { useMemo } from "react";
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
import type { DailyProjectionPoint } from "@/lib/types/cashflow";

interface MainForecastChartProps {
  data: DailyProjectionPoint[];
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
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background rounded-lg border p-3 shadow-lg">
      <p className="text-muted-foreground text-xs font-medium">{label ? formatDate(label) : ""}</p>
      {payload.map((entry, i) => {
        if (entry.value == null) return null;
        const isNegative = entry.value < 0;
        return (
          <p
            key={i}
            className="text-sm font-medium"
            style={{ color: isNegative ? "hsl(0, 84%, 60%)" : entry.color }}
          >
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        );
      })}
    </div>
  );
}

export function MainForecastChart({ data, threshold }: MainForecastChartProps) {
  const today = new Date().toISOString().split("T")[0];

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        historical: d.date <= today ? d.balance : undefined,
        projected: d.date >= today ? d.balance : undefined,
      })),
    [data, today],
  );

  // Calculate where y=0 sits in the gradient (fraction from top)
  const { zeroOffset, hasNegative } = useMemo(() => {
    if (!data.length) return { zeroOffset: 1, hasNegative: false };
    const balances = data.map((d) => d.balance);
    const maxBal = Math.max(...balances, 0);
    const minBal = Math.min(...balances, 0);
    const range = maxBal - minBal;
    return {
      zeroOffset: range > 0 ? maxBal / range : 1,
      hasNegative: minBal < 0,
    };
  }, [data]);

  const gradientStops = useMemo(() => {
    const pct = `${(zeroOffset * 100).toFixed(2)}%`;
    return { pct };
  }, [zeroOffset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proiezione Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {/* Historical fill: blue above zero, red below */}
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                <stop
                  offset={gradientStops.pct}
                  stopColor="hsl(210, 100%, 56%)"
                  stopOpacity={0.05}
                />
                <stop offset={gradientStops.pct} stopColor="hsl(0, 84%, 60%)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.35} />
              </linearGradient>
              {/* Projected fill: same split */}
              <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.15} />
                <stop
                  offset={gradientStops.pct}
                  stopColor="hsl(210, 100%, 56%)"
                  stopOpacity={0.02}
                />
                <stop offset={gradientStops.pct} stopColor="hsl(0, 84%, 60%)" stopOpacity={0.08} />
                <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Historical balance — solid area */}
            <Area
              type="monotone"
              dataKey="historical"
              name="Storico"
              stroke="hsl(210, 100%, 56%)"
              fill="url(#histGradient)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />

            {/* Projected balance — dashed area with fill */}
            <Area
              type="monotone"
              dataKey="projected"
              name="Proiezione"
              stroke="hsl(210, 100%, 56%)"
              fill="url(#projGradient)"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              connectNulls={false}
            />

            {/* Zero line — prominent when negative data exists */}
            {hasNegative && (
              <ReferenceLine
                y={0}
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                label={{
                  value: "Zero",
                  position: "insideTopRight",
                  fill: "hsl(0, 84%, 60%)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            )}

            {/* Threshold reference line */}
            {threshold !== 0 && (
              <ReferenceLine
                y={threshold}
                stroke="hsl(38, 92%, 50%)"
                strokeDasharray="6 3"
                label={{
                  value: `Soglia ${formatCurrency(threshold)}`,
                  position: "insideTopRight",
                  fill: "hsl(38, 92%, 50%)",
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
