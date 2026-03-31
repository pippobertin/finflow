"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DataGap {
  type: string;
  period: string;
  label: string;
  daysOverdue: number;
  priority: "high" | "medium" | "low";
}

const DISMISS_KEY = "finflow_data_freshness_dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function DataFreshnessBanner() {
  const [gaps, setGaps] = useState<DataGap[]>([]);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION) {
      return;
    }
    // Not dismissed — fetch data gaps
    fetch("/api/data-freshness")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.gaps) && data.gaps.length > 0) {
          setGaps(data.gaps);
          setDismissed(false);
        }
      })
      .catch(() => {});
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (dismissed || gaps.length === 0) return null;

  const primary = gaps[0];

  const bgColor =
    primary.priority === "high"
      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
      : primary.priority === "medium"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
        : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30";

  const iconColor =
    primary.priority === "high"
      ? "text-red-500"
      : primary.priority === "medium"
        ? "text-amber-500"
        : "text-blue-500";

  let message: string;
  if (primary.type === "EC_QUARTERLY") {
    message = `Il ${primary.label} si è chiuso ${primary.daysOverdue + 7} giorni fa. Carica l'EC trimestrale per aggiornare il saldo.`;
  } else {
    message = `Non ci sono movimenti bancari da ${primary.daysOverdue + 30} giorni. Importa i movimenti aggiornati.`;
  }

  return (
    <div className={cn("mb-4 flex items-center gap-3 rounded-lg border p-3", bgColor)}>
      <AlertTriangle className={cn("h-5 w-5 shrink-0", iconColor)} />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {message}
          {gaps.length > 1 && (
            <span className="ml-1 text-xs opacity-70">
              (+{gaps.length - 1} altr{gaps.length - 1 === 1 ? "o" : "i"} aggiornament
              {gaps.length - 1 === 1 ? "o" : "i"})
            </span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" render={<Link href="/import" />}>
          <Upload className="mr-1 h-3 w-3" />
          Aggiorna
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
