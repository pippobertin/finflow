import type { ReactNode } from "react";
import { Info, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutVariant = "info" | "warning" | "success" | "tip";

interface HelpCalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const variantConfig: Record<
  CalloutVariant,
  {
    icon: typeof Info;
    wrapper: string;
    iconWrapper: string;
    iconColor: string;
    titleColor: string;
    bodyColor: string;
    defaultTitle: string;
  }
> = {
  info: {
    icon: Info,
    wrapper: "border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/30",
    iconWrapper: "bg-indigo-100 dark:bg-indigo-900/40",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    titleColor: "text-indigo-900 dark:text-indigo-200",
    bodyColor: "text-indigo-800/90 dark:text-indigo-300/90",
    defaultTitle: "Nota",
  },
  warning: {
    icon: AlertTriangle,
    wrapper: "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
    iconWrapper: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    titleColor: "text-amber-900 dark:text-amber-200",
    bodyColor: "text-amber-800/90 dark:text-amber-300/90",
    defaultTitle: "Attenzione",
  },
  success: {
    icon: CheckCircle2,
    wrapper: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30",
    iconWrapper: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    bodyColor: "text-emerald-800/90 dark:text-emerald-300/90",
    defaultTitle: "Fatto bene",
  },
  tip: {
    icon: Lightbulb,
    wrapper: "border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/30",
    iconWrapper: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    titleColor: "text-violet-900 dark:text-violet-200",
    bodyColor: "text-violet-800/90 dark:text-violet-300/90",
    defaultTitle: "Suggerimento",
  },
};

export function HelpCallout({ variant = "info", title, children }: HelpCalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const resolvedTitle = title ?? config.defaultTitle;

  return (
    <div className={cn("not-prose my-6 flex gap-3 rounded-lg border p-4", config.wrapper)}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          config.iconWrapper,
        )}
      >
        <Icon className={cn("h-4 w-4", config.iconColor)} />
      </div>
      <div className="flex-1 space-y-1">
        <p className={cn("text-sm font-semibold", config.titleColor)}>{resolvedTitle}</p>
        <div className={cn("text-sm leading-relaxed", config.bodyColor)}>{children}</div>
      </div>
    </div>
  );
}
