"use client";

import { formatEUR } from "@/lib/helpers/format";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass shadow-card rounded-lg border border-l-4 border-l-indigo-500 px-3 py-2">
      {label && <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-numeric font-medium">{formatEUR(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}
