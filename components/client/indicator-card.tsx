"use client";

import { cn } from "@/lib/utils";
import { SemaphoreBadge } from "./semaphore-badge";
import type { HealthIndicator } from "@/lib/analysis/client-indicators";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const meterColors = {
  ok: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  warn: "bg-gradient-to-r from-amber-500 to-amber-400",
  bad: "bg-gradient-to-r from-red-500 to-red-400",
} as const;

interface IndicatorCardProps {
  indicator: HealthIndicator;
  className?: string;
}

export function IndicatorCard({ indicator, className }: IndicatorCardProps) {
  // Compute meter width (0-100%) based on value
  const meterWidth =
    indicator.value != null ? Math.min(Math.max(Math.abs(indicator.value), 0), 100) : 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {indicator.label}
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <Info className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">{indicator.reference}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <p className="font-numeric mt-1 text-2xl font-bold tabular-nums">{indicator.formatted}</p>

      <div className="mt-1.5 flex items-center gap-2">
        <SemaphoreBadge status={indicator.status} />
      </div>

      {/* Meter bar */}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            meterColors[indicator.status],
          )}
          style={{ width: `${meterWidth}%` }}
        />
      </div>

      <p className="mt-2 text-[13px] leading-snug text-slate-500 dark:text-slate-400">
        {indicator.description}
      </p>
    </div>
  );
}
