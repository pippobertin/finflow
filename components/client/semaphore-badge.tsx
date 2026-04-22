"use client";

import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/analysis/client-indicators";

const statusConfig = {
  ok: {
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
    label: "Ottimo",
  },
  warn: {
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    label: "Attenzione",
  },
  bad: {
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
    label: "Critico",
  },
} as const;

interface SemaphoreBadgeProps {
  status: HealthStatus;
  className?: string;
}

export function SemaphoreBadge({ status, className }: SemaphoreBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
