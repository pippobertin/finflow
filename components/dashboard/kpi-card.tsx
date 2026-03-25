import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentMap = {
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  green: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  red: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-600",
  },
  purple: {
    border: "border-l-violet-500",
    bg: "bg-violet-50",
    text: "text-violet-600",
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
    <Card className={cn("relative overflow-hidden border-l-4", accent.border, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {subtitle && <p className="text-muted-foreground text-[11px]">{subtitle}</p>}
            <p className="text-3xl font-extrabold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs font-semibold",
                  trend.positive ? "text-emerald-600" : "text-red-600",
                )}
              >
                {trend.positive ? "+" : ""}
                {trend.value}
              </p>
            )}
          </div>
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", accent.bg)}>
            <Icon className={cn("h-6 w-6", accent.text)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
