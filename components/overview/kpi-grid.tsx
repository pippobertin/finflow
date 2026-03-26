"use client";

import { motion } from "framer-motion";
import { Wallet, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { formatEUR } from "@/lib/helpers/format";
import type { OverviewKpis } from "@/lib/queries/overview";

interface KpiGridProps {
  kpis: OverviewKpis;
  rangeLabel?: string;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function KpiGrid({ kpis, rangeLabel }: KpiGridProps) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <KpiCard
          title="Saldo Attuale"
          value={formatEUR(kpis.currentBalance)}
          icon={Wallet}
          accentColor="blue"
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard
          title="Crediti in Scadenza"
          subtitle={rangeLabel}
          value={formatEUR(kpis.pendingCredits)}
          icon={ArrowUpRight}
          accentColor="green"
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard
          title="Debiti in Scadenza"
          subtitle={rangeLabel}
          value={formatEUR(kpis.pendingDebits)}
          icon={ArrowDownRight}
          accentColor="red"
        />
      </motion.div>
      <motion.div variants={item}>
        <KpiCard
          title="Saldo Proiettato"
          subtitle={rangeLabel}
          value={formatEUR(kpis.projectedBalance)}
          icon={TrendingUp}
          accentColor="purple"
          trend={
            kpis.projectedBalance > kpis.currentBalance
              ? { value: formatEUR(kpis.projectedBalance - kpis.currentBalance), positive: true }
              : kpis.projectedBalance < kpis.currentBalance
                ? { value: formatEUR(kpis.currentBalance - kpis.projectedBalance), positive: false }
                : undefined
          }
        />
      </motion.div>
    </motion.div>
  );
}
