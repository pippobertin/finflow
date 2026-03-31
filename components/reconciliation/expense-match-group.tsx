"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  bankStatementId: string;
  bankStatementDate: string;
  bankStatementDescription: string;
  bankStatementAmount: number;
  invoices: Array<{
    id: string;
    number: string;
    counterpart: string;
    grossAmount: number;
  }>;
  type: "single" | "multi" | "expense";
  confidence: number;
  pass: number;
  recurringExpenseId?: string;
  recurringExpenseName?: string;
}

interface ExpenseMatchGroupProps {
  expenseName: string;
  suggestions: Suggestion[];
  onAcceptGroup: () => void;
  onRejectGroup: () => void;
  onAcceptSingle: (suggestion: Suggestion) => void;
  onRejectSingle: (suggestion: Suggestion) => void;
}

export function ExpenseMatchGroup({
  expenseName,
  suggestions,
  onAcceptGroup,
  onRejectGroup,
  onAcceptSingle,
  onRejectSingle,
}: ExpenseMatchGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const totalAmount = suggestions.reduce((sum, s) => sum + s.bankStatementAmount, 0);
  const dates = suggestions
    .map((s) => new Date(s.bankStatementDate))
    .sort((a, b) => a.getTime() - b.getTime());
  const dateFrom = dates[0]?.toLocaleDateString("it-IT");
  const dateTo = dates[dates.length - 1]?.toLocaleDateString("it-IT");
  const avgConfidence = Math.round(
    suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length,
  );

  const confidenceColor =
    avgConfidence >= 70
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : avgConfidence >= 40
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-900/10">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between gap-3 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {expanded ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-violet-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-violet-500" />
            )}
            <span className="truncate font-semibold text-violet-700 dark:text-violet-400">
              {expenseName}
            </span>
          </div>
          <Badge className="shrink-0 border-violet-200 bg-violet-100 text-violet-700">
            {suggestions.length} movimenti
          </Badge>
          <Badge variant="outline" className={cn("shrink-0 text-xs", confidenceColor)}>
            ~{avgConfidence}%
          </Badge>
          <span className="font-numeric shrink-0 text-sm font-bold">
            {totalAmount.toLocaleString("it-IT", {
              style: "currency",
              currency: "EUR",
            })}
          </span>
          <span className="shrink-0 text-xs text-slate-500">
            {dateFrom} — {dateTo}
          </span>
        </div>

        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onAcceptGroup}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Conferma tutti
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={onRejectGroup}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Rifiuta tutti
          </Button>
        </div>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-violet-200 dark:border-violet-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">Descrizione</TableHead>
                <TableHead className="text-right text-xs">Importo</TableHead>
                <TableHead className="text-center text-xs">Confidenza</TableHead>
                <TableHead className="w-24 text-xs" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => {
                const confColor =
                  s.confidence >= 70
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                    : s.confidence >= 40
                      ? "text-amber-600 bg-amber-50 border-amber-200"
                      : "text-red-600 bg-red-50 border-red-200";

                return (
                  <TableRow key={s.bankStatementId}>
                    <TableCell className="text-xs">
                      {new Date(s.bankStatementDate).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="max-w-[300px] overflow-hidden text-sm">
                      <span className="block truncate" title={s.bankStatementDescription}>
                        {s.bankStatementDescription}
                      </span>
                    </TableCell>
                    <TableCell className="font-numeric text-right text-sm">
                      {s.bankStatementAmount.toLocaleString("it-IT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-xs", confColor)}>
                        {s.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAcceptSingle(s)}
                          className="text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRejectSingle(s)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
