"use client";

import { cn } from "@/lib/utils";
import { useCashflowSettings } from "@/lib/stores/cashflow-settings";
import type { ScenarioType } from "@/lib/types/cashflow";

const scenarios: { key: ScenarioType; label: string }[] = [
  { key: "base", label: "Base" },
  { key: "optimistic", label: "Ottimistico" },
  { key: "pessimistic", label: "Pessimistico" },
];

export function ScenarioSelector() {
  const { scenario, setScenario } = useCashflowSettings();

  return (
    <div className="bg-muted inline-flex rounded-lg p-1">
      {scenarios.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => setScenario(s.key)}
          className={cn(
            "relative rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            scenario === s.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
