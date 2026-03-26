"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentMap = {
  blue: {
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    badge: "bg-indigo-50 text-indigo-700",
  },
  green: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700",
  },
  red: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-600",
    badge: "bg-red-50 text-red-700",
  },
  purple: {
    border: "border-l-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-600",
    badge: "bg-violet-50 text-violet-700",
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
        "shadow-card hover:shadow-card-hover relative overflow-hidden border-l-4 transition-shadow duration-200",
        accent.border,
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {subtitle && <p className="text-muted-foreground text-[11px]">{subtitle}</p>}
            <p className="font-numeric text-2xl font-bold tracking-tight xl:text-3xl">{value}</p>
            {trend && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                  trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
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
