"use client";

import { X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEUR } from "@/lib/helpers/format";
import type { DailyProjectionPoint } from "@/lib/types/cashflow";

interface DayDetailPanelProps {
  point: DailyProjectionPoint;
  onClose: () => void;
}

const TYPE_CONFIG = {
  activeInvoice: { label: "Fattura Attiva", color: "bg-emerald-100 text-emerald-700" },
  passiveInvoice: { label: "Fattura Passiva", color: "bg-red-100 text-red-700" },
  recurringExpense: { label: "Spesa Ricorrente", color: "bg-amber-100 text-amber-700" },
  oneOffExpense: { label: "Spesa Una Tantum", color: "bg-purple-100 text-purple-700" },
} as const;

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DayDetailPanel({ point, onClose }: DayDetailPanelProps) {
  const details = point.details ?? [];
  const grouped = {
    activeInvoice: details.filter((d) => d.type === "activeInvoice"),
    passiveInvoice: details.filter((d) => d.type === "passiveInvoice"),
    recurringExpense: details.filter((d) => d.type === "recurringExpense"),
    oneOffExpense: details.filter((d) => d.type === "oneOffExpense"),
  };

  return (
    <Card className="border-primary/30 border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Dettaglio — {formatDate(point.date)}</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
          <span>
            Saldo: <strong>{formatEUR(point.balance)}</strong>
          </span>
          <span>
            Flusso netto:{" "}
            <strong className={point.netFlow >= 0 ? "text-emerald-600" : "text-red-600"}>
              {formatEUR(point.netFlow)}
            </strong>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {details.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nessun movimento previsto per questa data.
          </p>
        ) : (
          <div className="space-y-4">
            {(
              ["activeInvoice", "passiveInvoice", "recurringExpense", "oneOffExpense"] as const
            ).map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              const config = TYPE_CONFIG[type];
              const total = items.reduce((sum, i) => sum + i.amount, 0);
              const isInflow = type === "activeInvoice";

              return (
                <div key={type}>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary" className={config.color}>
                      {config.label} ({items.length})
                    </Badge>
                    <span
                      className={`text-sm font-semibold ${isInflow ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {isInflow ? "+" : "-"}
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
                            <span className="text-muted-foreground ml-2">{item.counterpart}</span>
                          )}
                        </div>
                        <span
                          className={`shrink-0 ${isInflow ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {isInflow ? "+" : "-"}
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
      </CardContent>
    </Card>
  );
}
