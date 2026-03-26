"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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
import { formatEURCompact } from "@/lib/helpers/format";
import type { DailyProjectionPoint } from "@/lib/types/cashflow";

interface DecompositionChartSectionProps {
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

function DecompTooltip({
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
    <div className="glass shadow-card rounded-lg border border-l-4 border-l-indigo-500 p-3">
      <p className="text-muted-foreground mb-1 text-xs font-medium">
        {label ? formatDate(label) : ""}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="font-numeric text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function DecompositionChartSection({ data }: DecompositionChartSectionProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      "Fatture Attive": d.activeInvoices,
      "Incassi Futuri": d.futureReceivables,
      "Fatture Passive": -d.passiveInvoices,
      "Spese Ricorrenti": -d.recurringExpenses,
      "Spese Una Tantum": -d.oneOffExpenses,
      "Versamenti IVA": -(d.vatPayments ?? 0),
    }));
  }, [data]);

  if (!chartData.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
    >
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Composizione Flussi Futuri</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
              <Tooltip content={<DecompTooltip />} />
              <Area
                type="monotone"
                dataKey="Fatture Attive"
                stackId="1"
                stroke="hsl(142, 76%, 36%)"
                fill="hsl(142, 76%, 36%)"
                fillOpacity={0.5}
                animationDuration={1000}
              />
              <Area
                type="monotone"
                dataKey="Incassi Futuri"
                stackId="1"
                stroke="hsl(168, 76%, 36%)"
                fill="hsl(168, 76%, 36%)"
                fillOpacity={0.5}
                animationDuration={1000}
                animationBegin={100}
              />
              <Area
                type="monotone"
                dataKey="Fatture Passive"
                stackId="2"
                stroke="hsl(0, 84%, 60%)"
                fill="hsl(0, 84%, 60%)"
                fillOpacity={0.5}
                animationDuration={1000}
                animationBegin={200}
              />
              <Area
                type="monotone"
                dataKey="Spese Ricorrenti"
                stackId="2"
                stroke="hsl(38, 92%, 50%)"
                fill="hsl(38, 92%, 50%)"
                fillOpacity={0.5}
                animationDuration={1000}
                animationBegin={300}
              />
              <Area
                type="monotone"
                dataKey="Spese Una Tantum"
                stackId="2"
                stroke="hsl(270, 70%, 60%)"
                fill="hsl(270, 70%, 60%)"
                fillOpacity={0.5}
                animationDuration={1000}
                animationBegin={400}
              />
              <Area
                type="monotone"
                dataKey="Versamenti IVA"
                stackId="2"
                stroke="hsl(263, 70%, 50%)"
                fill="hsl(263, 70%, 50%)"
                fillOpacity={0.5}
                animationDuration={1000}
                animationBegin={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
