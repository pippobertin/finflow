"use client";

import { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEUR } from "@/lib/helpers/format";
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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function formatDateLong(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TYPE_CONFIG = {
  activeInvoice: {
    label: "Fatture Attive",
    color: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    sign: "+",
  },
  futureReceivable: {
    label: "Incassi Futuri",
    color: "text-teal-600",
    badge: "bg-teal-100 text-teal-700",
    sign: "+",
  },
  passiveInvoice: {
    label: "Fatture Passive",
    color: "text-red-600",
    badge: "bg-red-100 text-red-700",
    sign: "-",
  },
  recurringExpense: {
    label: "Spese Ricorrenti",
    color: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    sign: "-",
  },
  oneOffExpense: {
    label: "Spese Una Tantum",
    color: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    sign: "-",
  },
  expectedPayable: {
    label: "Fatture Passive Attese",
    color: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    sign: "-",
  },
  vatPayment: {
    label: "Versamenti IVA",
    color: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
    sign: "-",
  },
} as const;

// Tooltip shown on hover (follows mouse)
function HoverTooltip({
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
      <p className="text-primary mt-1.5 text-[10px] font-medium">Clicca per vedere il dettaglio</p>
    </div>
  );
}

// Detail panel below chart for a selected (locked) date
function DetailSection({ point, onClose }: { point: DailyProjectionPoint; onClose: () => void }) {
  const details = point.details ?? [];
  const grouped = {
    activeInvoice: details.filter((d) => d.type === "activeInvoice"),
    futureReceivable: details.filter((d) => d.type === "futureReceivable"),
    passiveInvoice: details.filter((d) => d.type === "passiveInvoice"),
    recurringExpense: details.filter((d) => d.type === "recurringExpense"),
    oneOffExpense: details.filter((d) => d.type === "oneOffExpense"),
    expectedPayable: details.filter((d) => d.type === "expectedPayable"),
    vatPayment: details.filter((d) => d.type === "vatPayment"),
  };

  return (
    <div className="border-primary/20 mt-4 rounded-lg border-2 bg-white p-4 dark:bg-neutral-950">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{formatDateLong(point.date)}</p>
          <div className="text-muted-foreground flex gap-4 text-xs">
            <span>
              Saldo: <strong className="text-foreground">{formatEUR(point.balance)}</strong>
            </span>
            <span>
              Flusso netto:{" "}
              <strong className={point.netFlow >= 0 ? "text-emerald-600" : "text-red-600"}>
                {formatEUR(point.netFlow)}
              </strong>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground rounded px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Chiudi dettaglio
        </button>
      </div>

      {details.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun movimento previsto per questa data.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              "activeInvoice",
              "futureReceivable",
              "passiveInvoice",
              "recurringExpense",
              "oneOffExpense",
              "expectedPayable",
              "vatPayment",
            ] as const
          ).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const config = TYPE_CONFIG[type];
            const total = items.reduce((sum, i) => sum + i.amount, 0);

            return (
              <div key={type} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="secondary" className={config.badge}>
                    {config.label} ({items.length})
                  </Badge>
                  <span className={`text-sm font-semibold ${config.color}`}>
                    {config.sign}
                    {formatEUR(total)}
                  </span>
                </div>
                <div className="divide-y text-sm">
                  {items.map((item, i) => (
                    <div
                      key={`${item.id}-${i}`}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{item.label}</span>
                        {item.counterpart && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            {item.counterpart}
                          </span>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs ${config.color}`}>
                        {config.sign}
                        {formatEUR(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DecompositionChart({ data }: DecompositionChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleClick = useCallback((e: { activeLabel?: string | number } | null) => {
    if (e?.activeLabel) {
      const date = String(e.activeLabel);
      setSelectedDate((prev) => (prev === date ? null : date));
    }
  }, []);

  const selectedPoint = selectedDate ? (data.find((d) => d.date === selectedDate) ?? null) : null;

  // Show negative values for outflows
  const chartData = data.map((d) => ({
    date: d.date,
    "Fatture Attive": d.activeInvoices,
    "Incassi Futuri": d.futureReceivables,
    "Fatture Passive": -d.passiveInvoices,
    "Spese Ricorrenti": -d.recurringExpenses,
    "Spese Una Tantum": -d.oneOffExpenses,
    "Fatture Passive Attese": -(d.futurePayables ?? 0),
    "Versamenti IVA": -(d.vatPayments ?? 0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composizione Flussi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            onClick={handleClick}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid
              strokeDasharray="none"
              stroke="#f1f5f9"
              strokeWidth={1}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              interval="preserveStartEnd"
              stroke="transparent"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => formatCurrency(v)}
              tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}
              width={70}
              stroke="transparent"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<HoverTooltip />} />
            {selectedDate && (
              <ReferenceLine
                x={selectedDate}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                strokeOpacity={0.6}
              />
            )}
            <Area
              type="monotone"
              dataKey="Fatture Attive"
              stackId="1"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Area
              type="monotone"
              dataKey="Incassi Futuri"
              stackId="1"
              stroke="#0d9488"
              fill="#0d9488"
              fillOpacity={0.3}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Area
              type="monotone"
              dataKey="Fatture Passive"
              stackId="2"
              stroke="#dc2626"
              fill="#dc2626"
              fillOpacity={0.3}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Area
              type="monotone"
              dataKey="Spese Ricorrenti"
              stackId="2"
              stroke="#d97706"
              fill="#d97706"
              fillOpacity={0.3}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Area
              type="monotone"
              dataKey="Spese Una Tantum"
              stackId="2"
              stroke="#7c3aed"
              fill="#7c3aed"
              fillOpacity={0.3}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Area
              type="monotone"
              dataKey="Fatture Passive Attese"
              stackId="2"
              stroke="#ea580c"
              fill="#ea580c"
              fillOpacity={0.25}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Area
              type="monotone"
              dataKey="Versamenti IVA"
              stackId="2"
              stroke="#6d28d9"
              fill="#6d28d9"
              fillOpacity={0.25}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Detail panel — appears below the chart, inside the card */}
        {selectedPoint && (
          <DetailSection point={selectedPoint} onClose={() => setSelectedDate(null)} />
        )}
      </CardContent>
    </Card>
  );
}
