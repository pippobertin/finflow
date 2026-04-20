"use client";

import { useState, Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { useReassignBankStatement } from "@/lib/hooks/use-bank-statements";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";
import { cn } from "@/lib/utils";
import { BankStatementRowActions } from "./bank-statement-row-actions";
import { SuggestionDetail } from "./suggestion-detail";
import type { Suggestion } from "@/lib/hooks/use-reconciliation";

export interface BankStatementData {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  balance: number | string;
  reference: string | null;
  isReconciled: boolean;
  reconciledInvoice: {
    id: string;
    number: string;
    counterpart: string;
  } | null;
  reconciledInvoices?: Array<{
    id: string;
    number: string;
    counterpart: string;
  }>;
  costCenter: { id: string; name: string; color: string } | null;
}

interface BankStatementTableProps {
  statements: BankStatementData[];
  suggestionMap?: Map<string, Suggestion>;
  onAcceptSuggestion?: (s: Suggestion) => void;
  onRejectSuggestion?: (s: Suggestion) => void;
  onManualMatch?: (movement: {
    id: string;
    date: string;
    description: string;
    amount: number;
  }) => void;
  onIgnore?: (id: string) => void;
  onTrain?: (movement: { id: string; date: string; description: string; amount: number }) => void;
  onUnreconcile?: (id: string) => void;
}

const UNASSIGNED = "__none__";
const COL_COUNT = 9;

export function BankStatementTable({
  statements,
  suggestionMap,
  onAcceptSuggestion,
  onRejectSuggestion,
  onManualMatch,
  onIgnore,
  onTrain,
  onUnreconcile,
}: BankStatementTableProps) {
  const reassign = useReassignBankStatement();
  const { data: costCenters = [] } = useCostCenters();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const ccItems = costCenters as Array<{ id: string; name: string; color: string }>;

  function handleCostCenterChange(id: string, value: string | null) {
    reassign.mutate({
      id,
      costCenterId: !value || value === UNASSIGNED ? null : value,
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrizione</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Riferimento</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Fattura</TableHead>
          <TableHead>Centro di Costo</TableHead>
          <TableHead className="w-[140px]">Azioni</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statements.map((s) => {
          const suggestion = suggestionMap?.get(s.id);
          const isExpanded = expandedRowId === s.id;
          const hasSuggestion = !!suggestion && !s.isReconciled;

          return (
            <Fragment key={s.id}>
              <TableRow className={cn(hasSuggestion && "border-l-2 border-l-indigo-400")}>
                <TableCell className="whitespace-nowrap">{formatDateShort(s.date)}</TableCell>
                <TableCell className="max-w-[300px] truncate" title={s.description}>
                  {s.description}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium whitespace-nowrap",
                    Number(s.amount) > 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {formatEUR(s.amount)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {formatEUR(s.balance)}
                </TableCell>
                <TableCell className="text-muted-foreground">{s.reference ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={s.isReconciled ? "default" : "secondary"}>
                    {s.isReconciled ? "Riconciliato" : "Da riconciliare"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.reconciledInvoices && s.reconciledInvoices.length > 0 ? (
                    <div className="space-y-0.5">
                      {s.reconciledInvoices.map((inv) => (
                        <span key={inv.id} className="block text-sm">
                          <span className="font-medium">{inv.number}</span>
                          {" — "}
                          <span className="text-muted-foreground">{inv.counterpart}</span>
                        </span>
                      ))}
                    </div>
                  ) : s.reconciledInvoice ? (
                    <span className="text-sm">
                      <span className="font-medium">{s.reconciledInvoice.number}</span>
                      {" — "}
                      <span className="text-muted-foreground">
                        {s.reconciledInvoice.counterpart}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={s.costCenter?.id ?? UNASSIGNED}
                    onValueChange={(v) => handleCostCenterChange(s.id, v)}
                  >
                    <SelectTrigger className="h-7 w-44 text-xs">
                      <SelectValue>
                        {s.costCenter ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: s.costCenter.color }}
                            />
                            {s.costCenter.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Assegna...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>
                        <span className="text-muted-foreground">— Nessuno —</span>
                      </SelectItem>
                      {ccItems.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: cc.color }}
                            />
                            {cc.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {s.isReconciled && onUnreconcile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-500"
                      onClick={() => onUnreconcile(s.id)}
                      title="Annulla riconciliazione"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!s.isReconciled && (
                    <BankStatementRowActions
                      suggestion={suggestion}
                      isExpanded={isExpanded}
                      onToggleExpand={() => setExpandedRowId(isExpanded ? null : s.id)}
                      onAccept={
                        suggestion && onAcceptSuggestion
                          ? () => onAcceptSuggestion(suggestion)
                          : undefined
                      }
                      onReject={
                        suggestion && onRejectSuggestion
                          ? () => onRejectSuggestion(suggestion)
                          : undefined
                      }
                      onManualMatch={() =>
                        onManualMatch?.({
                          id: s.id,
                          date: s.date,
                          description: s.description,
                          amount: Number(s.amount),
                        })
                      }
                      onIgnore={() => onIgnore?.(s.id)}
                      onTrain={() =>
                        onTrain?.({
                          id: s.id,
                          date: s.date,
                          description: s.description,
                          amount: Number(s.amount),
                        })
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
              {isExpanded && suggestion && (
                <SuggestionDetail suggestion={suggestion} colSpan={COL_COUNT} />
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
