"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroKpi {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  /** If true, renders as the large featured card */
  featured?: boolean;
  trend?: { value: string; positive: boolean };
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

interface KpiHeroGridProps {
  kpis: HeroKpi[];
  className?: string;
}

export function KpiHeroGrid({ kpis, className }: KpiHeroGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.label} variants={item} className={cn(kpi.featured && "sm:col-span-2")}>
          {kpi.featured ? <FeaturedKpiCard kpi={kpi} /> : <StandardKpiCard kpi={kpi} />}
        </motion.div>
      ))}
    </motion.div>
  );
}

function FeaturedKpiCard({ kpi }: { kpi: HeroKpi }) {
  const Icon = kpi.icon;
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--brand,#0b4d8a)] to-[var(--brand,#0b4d8a)]/80 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase opacity-70">{kpi.label}</p>
          <p className="font-numeric mt-2 text-4xl font-bold tabular-nums">{kpi.value}</p>
          {kpi.note && <p className="mt-1.5 text-sm opacity-70">{kpi.note}</p>}
          {kpi.trend && (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                kpi.trend.positive ? "bg-white/20 text-emerald-200" : "bg-white/20 text-red-200",
              )}
            >
              {kpi.trend.positive ? "+" : ""}
              {kpi.trend.value}
            </span>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
          <Icon className="h-6 w-6 text-white/80" />
        </div>
      </div>
    </div>
  );
}

function StandardKpiCard({ kpi }: { kpi: HeroKpi }) {
  const Icon = kpi.icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {kpi.label}
          </p>
          <p className="font-numeric text-[26px] leading-none font-bold tabular-nums">
            {kpi.value}
          </p>
          {kpi.trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                kpi.trend.positive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
              )}
            >
              {kpi.trend.positive ? "+" : ""}
              {kpi.trend.value}
            </span>
          )}
          {kpi.note && <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.note}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
      </div>
    </div>
  );
}
