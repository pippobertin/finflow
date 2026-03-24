"use client";

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
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function MainForecastChart({ data, threshold }: MainForecastChartProps) {
  // Split into historical (first 7 days) and projected
  const today = new Date().toISOString().split("T")[0];
  const chartData = data.map((d) => ({
    ...d,
    historical: d.date <= today ? d.balance : undefined,
    projected: d.date >= today ? d.balance : undefined,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proiezione Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
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

            {/* Historical balance - solid area */}
            <Area
              type="monotone"
              dataKey="historical"
              name="Storico"
              stroke="hsl(210, 100%, 56%)"
              fill="url(#balanceGradient)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />

            {/* Projected balance - dashed line */}
            <Line
              type="monotone"
              dataKey="projected"
              name="Proiezione"
              stroke="hsl(210, 100%, 56%)"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              connectNulls={false}
            />

            {/* Threshold reference line */}
            {threshold !== 0 && (
              <ReferenceLine
                y={threshold}
                stroke="hsl(0, 84%, 60%)"
                strokeDasharray="6 3"
                label={{
                  value: `Soglia ${formatCurrency(threshold)}`,
                  position: "insideTopRight",
                  fill: "hsl(0, 84%, 60%)",
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
