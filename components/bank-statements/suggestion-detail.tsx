// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy reconciliation UI, behind LEGACY_RECONCILIATION flag. Will be removed in Block D.
"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/lib/hooks/use-reconciliation";

interface SuggestionDetailProps {
  suggestion: Suggestion;
  colSpan: number;
}

function formatEUR(value: number) {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function SuggestionDetail({ suggestion, colSpan }: SuggestionDetailProps) {
  const s = suggestion;
  const absMovement = Math.abs(s.bankStatementAmount);

  const typeBadge = {
    single: { label: "Fattura singola", color: "border-blue-200 bg-blue-50 text-blue-700" },
    multi: { label: "Multi-fattura", color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
    expense: { label: "Spesa Ricorrente", color: "border-violet-200 bg-violet-50 text-violet-700" },
    expectedPayable: {
      label: "Fattura Passiva Attesa",
      color: "border-orange-200 bg-orange-50 text-orange-700",
    },
  }[s.type];

  return (
    <TableRow className="bg-slate-50/50 dark:bg-slate-800/20">
      <TableCell colSpan={colSpan} className="p-0">
        <div className="border-l-2 border-indigo-400 px-4 py-3">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px]", typeBadge.color)}>
              {typeBadge.label}
            </Badge>
            <span className="text-[11px] text-slate-500">
              Pass {s.pass} &middot; Confidenza {s.confidence}%
            </span>
          </div>

          {s.type === "expense" && s.recurringExpenseName ? (
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-violet-700 dark:text-violet-400">
                {s.recurringExpenseName}
              </span>
              <span className="font-numeric text-sm text-slate-600">{formatEUR(absMovement)}</span>
            </div>
          ) : s.type === "expectedPayable" && s.expectedPayableName ? (
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                {s.expectedPayableName}
              </span>
              <span className="font-numeric text-sm text-slate-600">{formatEUR(absMovement)}</span>
            </div>
          ) : (
            <div className="space-y-1">
              {s.invoices.map((inv) => {
                const diff = Math.abs(absMovement - inv.grossAmount);
                return (
                  <div key={inv.id} className="flex items-baseline gap-3 text-sm">
                    <span className="font-medium">Fatt. {inv.number}</span>
                    <span className="text-slate-500">{inv.counterpart}</span>
                    <span className="font-numeric text-slate-600">
                      {formatEUR(inv.grossAmount)}
                    </span>
                    {s.type === "single" && diff > 0.02 && (
                      <span className="text-[11px] text-amber-600">(diff: {formatEUR(diff)})</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
