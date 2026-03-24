"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyProjectionPoint } from "@/lib/types/cashflow";

interface DecompositionChartProps {
  data: DailyProjectionPoint[];
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

export function DecompositionChart({ data }: DecompositionChartProps) {
  // Show negative values for outflows
  const chartData = data.map((d) => ({
    date: d.date,
    "Fatture Attive": d.activeInvoices,
    "Fatture Passive": -d.passiveInvoices,
    "Spese Ricorrenti": -d.recurringExpenses,
    "Spese Una Tantum": -d.oneOffExpenses,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composizione Flussi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
            <Area
              type="monotone"
              dataKey="Fatture Attive"
              stackId="1"
              stroke="hsl(142, 76%, 36%)"
              fill="hsl(142, 76%, 36%)"
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="Fatture Passive"
              stackId="2"
              stroke="hsl(0, 84%, 60%)"
              fill="hsl(0, 84%, 60%)"
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="Spese Ricorrenti"
              stackId="2"
              stroke="hsl(38, 92%, 50%)"
              fill="hsl(38, 92%, 50%)"
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="Spese Una Tantum"
              stackId="2"
              stroke="hsl(270, 70%, 60%)"
              fill="hsl(270, 70%, 60%)"
              fillOpacity={0.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
