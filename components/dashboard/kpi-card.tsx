"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentMap = {
  blue: {
    gradient: "gradient-border-top gradient-border-top-indigo",
    bg: "bg-[var(--primary-light)]",
    text: "text-[color:var(--primary)]",
    badge: "bg-[var(--primary-light)] text-[color:var(--primary)]",
  },
  green: {
    gradient: "gradient-border-top gradient-border-top-emerald",
    bg: "bg-[var(--success-light)]",
    text: "text-[color:var(--success)]",
    badge: "bg-[var(--success-light)] text-[color:var(--success)]",
  },
  red: {
    gradient: "gradient-border-top gradient-border-top-red",
    bg: "bg-[var(--danger-light)]",
    text: "text-[color:var(--danger)]",
    badge: "bg-[var(--danger-light)] text-[color:var(--danger)]",
  },
  purple: {
    gradient: "gradient-border-top gradient-border-top-violet",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  },
} as const;

type AccentColor = keyof typeof accentMap;

interface KpiCardProps {
  title: string;
  subtitle?: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accentColor?: AccentColor;
  className?: string;
}

export function KpiCard({
  title,
  subtitle,
  value,
  icon: Icon,
  trend,
  accentColor = "blue",
  className,
}: KpiCardProps) {
  const accent = accentMap[accentColor];

  return (
    <Card
      className={cn(
        "shadow-card hover:shadow-card-hover relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
        accent.gradient,
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {subtitle && <p className="text-muted-foreground text-[11px]">{subtitle}</p>}
            <p className="font-numeric text-[28px] leading-none font-bold tracking-tight">
              {value}
            </p>
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.positive
                    ? "bg-[var(--success-light)] text-[color:var(--success)]"
                    : "bg-[var(--danger-light)] text-[color:var(--danger)]",
                )}
              >
                {trend.positive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {trend.value}
              </div>
            )}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", accent.bg)}>
            <Icon className={cn("h-5 w-5", accent.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
