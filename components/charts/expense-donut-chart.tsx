"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { formatEUR, formatPercent } from "@/lib/helpers/format";

interface SliceData {
  name: string;
  value: number;
  color: string;
}

interface ExpenseDonutChartProps {
  data: SliceData[];
}

const RADIAN = Math.PI / 180;

function renderLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof midAngle !== "number" ||
    typeof innerRadius !== "number" ||
    typeof outerRadius !== "number" ||
    typeof percent !== "number" ||
    percent < 0.05
  )
    return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {formatPercent(percent)}
    </text>
  );
}

function CenterLabel({ total }: { total: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground text-[10px] leading-tight">Totale</p>
        <p className="font-numeric text-sm font-semibold">{formatEUR(total)}</p>
      </div>
    </div>
  );
}

export function ExpenseDonutChart({ data }: ExpenseDonutChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  if (!data.length) return null;

  return (
    <div className="relative">
      <CenterLabel total={total} />
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={120}
            paddingAngle={2}
            cornerRadius={4}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
            animationBegin={200}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const entry = payload[0];
              return (
                <div className="glass shadow-card rounded-lg border border-l-4 border-l-indigo-500 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.payload?.color }}
                    />
                    <span className="text-muted-foreground">{entry.name}:</span>
                    <span className="font-numeric font-medium">
                      {formatEUR(Number(entry.value))}
                    </span>
                  </div>
                </div>
              );
            }}
          />
          <Legend formatter={(value: string) => <span className="text-xs">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
