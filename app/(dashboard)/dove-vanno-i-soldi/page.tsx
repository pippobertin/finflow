"use client";

import { useClientCdg } from "@/lib/hooks/use-client-cdg";
import { NarrativeBox } from "@/components/client/narrative-box";
import { formatEUR } from "@/lib/helpers/format";
import { CHART_TOOLTIP_PROPS, formatTooltipEUR } from "@/components/client/chart-tooltip-styles";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#0b4d8a",
  "#1168b3",
  "#4691cc",
  "#0e7c66",
  "#3aa58f",
  "#b45309",
  "#d97706",
  "#94a3b8",
  "#f59e0b",
  "#a855f7",
  "#cbd5e1",
];

export default function DoveVannoISoldiPage() {
  const { data, isLoading, error } = useClientCdg();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="h-[400px] animate-pulse rounded-xl bg-slate-200" />
          <div className="h-[400px] animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Dove vanno i soldi</h1>
        <p className="mt-4 text-sm text-slate-500">Nessun dato disponibile.</p>
      </div>
    );
  }

  const { incomeStatement: ce, narrative } = data;

  // Build doughnut data: all cost categories
  const allCosts = [
    ...ce.variableCostDetail.map((d) => ({ name: d.label, value: d.amount })),
    ...ce.fixedCostOperatingDetail.map((d) => ({ name: d.label, value: d.amount })),
    ...ce.depreciationDetail.map((d) => ({ name: d.label, value: d.amount })),
  ].filter((c) => c.value > 0);

  // Build fixed costs horizontal bar
  const fixedCosts = ce.fixedCostOperatingDetail
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold">Dove vanno i soldi</h1>
        <p className="mt-1 text-sm text-slate-500">Composizione dei costi operativi.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Doughnut chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold">Ripartizione dei costi</h3>
          <p className="mb-4 text-xs text-slate-500">
            Le principali voci che sottraggono valore ai ricavi
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allCosts}
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allCosts.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  {...CHART_TOOLTIP_PROPS}
                  formatter={(value) => formatTooltipEUR(value as number)}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fixed costs bar chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold">Costi fissi principali</h3>
          <p className="mb-4 text-xs text-slate-500">
            Le voci con maggiore incidenza sulla struttura
          </p>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fixedCosts.map((d) => ({ name: d.label, value: d.amount }))}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(v) => formatEUR(v)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={160}
                />
                <Tooltip
                  {...CHART_TOOLTIP_PROPS}
                  formatter={(value) => [formatTooltipEUR(value as number), ""]}
                />
                <Bar dataKey="value" fill="#0b4d8a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <NarrativeBox tag="Nota">{narrative.costNote}</NarrativeBox>
    </div>
  );
}
