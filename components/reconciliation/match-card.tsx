// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy reconciliation UI, behind LEGACY_RECONCILIATION flag. Will be removed in Block D.
"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface MatchInvoice {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number;
}

export interface MatchCardProps {
  bankStatementId: string;
  bankStatementDate: string;
  bankStatementDescription: string;
  bankStatementAmount: number;
  invoices: MatchInvoice[];
  type: "single" | "multi" | "expense" | "expectedPayable";
  confidence: number;
  pass: number;
  recurringExpenseName?: string;
  expectedPayableName?: string;
  selected?: boolean;
  onSelectClick?: (e: React.MouseEvent) => void;
  onAccept?: () => void;
  onReject?: () => void;
}

function formatEUR(value: number) {
  return value.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
}

export function MatchCard({
  bankStatementDate,
  bankStatementDescription,
  bankStatementAmount,
  invoices,
  type,
  confidence,
  recurringExpenseName,
  expectedPayableName,
  selected,
  onSelectClick,
}: MatchCardProps) {
  const confidenceColor =
    confidence >= 70
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : confidence >= 40
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";

  return (
    <tr
      className={cn(
        "border-b text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
        selected && "bg-indigo-50/50 dark:bg-indigo-950/20",
      )}
    >
      {/* Checkbox */}
      <td className="w-10 cursor-pointer px-3 py-2 align-top" onClick={onSelectClick}>
        <Checkbox checked={selected} tabIndex={-1} className="pointer-events-none mt-0.5" />
      </td>

      {/* Date + Confidence */}
      <td className="w-20 px-2 py-2 align-top whitespace-nowrap">
        <span className="text-slate-600 dark:text-slate-400">
          {new Date(bankStatementDate).toLocaleDateString("it-IT")}
        </span>
        <div className="mt-1">
          <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", confidenceColor)}>
            {confidence}%
          </Badge>
        </div>
      </td>

      {/* Bank statement description — full text, wraps */}
      <td className="px-2 py-2 align-top">
        <p className="text-[11px] leading-relaxed break-words whitespace-normal text-slate-700 dark:text-slate-300">
          {bankStatementDescription}
        </p>
        <p className="font-numeric mt-1 text-xs font-bold text-slate-900 dark:text-slate-100">
          {formatEUR(bankStatementAmount)}
        </p>
      </td>

      {/* Matched invoice / expense */}
      <td className="w-[280px] px-2 py-2 align-top">
        {type === "expense" && recurringExpenseName ? (
          <div>
            <Badge className="mb-1 border-violet-200 bg-violet-100 text-[10px] text-violet-700">
              Spesa Ricorrente
            </Badge>
            <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
              {recurringExpenseName}
            </p>
          </div>
        ) : type === "expectedPayable" && expectedPayableName ? (
          <div>
            <Badge className="mb-1 border-orange-200 bg-orange-100 text-[10px] text-orange-700">
              Fattura Passiva Attesa
            </Badge>
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
              {expectedPayableName}
            </p>
          </div>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="mb-1 last:mb-0">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Fatt. {inv.number} — {inv.counterpart}
              </p>
              <p className="font-numeric text-[11px] text-slate-500">
                {formatEUR(inv.grossAmount)}
              </p>
            </div>
          ))
        )}
        {type === "multi" && (
          <Badge variant="secondary" className="mt-1 text-[10px]">
            Multi-fattura
          </Badge>
        )}
      </td>
    </tr>
  );
}
