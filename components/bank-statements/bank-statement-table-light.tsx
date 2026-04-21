"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";
import { CDG_CATEGORY_LABELS, CDG_CATEGORY_GROUPS } from "@/lib/helpers/cdg-labels";
import {
  useCategorizeBankStatement,
  useBulkCategorizeBankStatements,
} from "@/lib/hooks/use-bank-statements";
import { Tag, Sparkles } from "lucide-react";

interface BankStatementData {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  balance: number | string;
  netAmount: number | string | null;
  vatAmount: number | string | null;
  cdgCategory: string | null;
  reference: string | null;
  costCenter: { id: string; name: string; color: string } | null;
}

interface BankStatementTableLightProps {
  statements: BankStatementData[];
  suggestions?: Map<string, { cdgCategory: string; confidence: number } | null>;
}

export function BankStatementTableLight({ statements, suggestions }: BankStatementTableLightProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("");

  const categorize = useCategorizeBankStatement();
  const bulkCategorize = useBulkCategorizeBankStatements();

  const uncategorizedSelected = statements.filter((s) => selectedIds.has(s.id) && !s.cdgCategory);
  const allSelected = selectedIds.size === statements.length && statements.length > 0;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(statements.map((s) => s.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkCategorize() {
    if (!bulkCategory || uncategorizedSelected.length === 0) return;
    bulkCategorize.mutate(
      { ids: uncategorizedSelected.map((s) => s.id), cdgCategory: bulkCategory },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setBulkCategory("");
        },
      },
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      {uncategorizedSelected.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-2.5 dark:border-indigo-800 dark:bg-indigo-900/20">
          <Tag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm text-indigo-800 dark:text-indigo-300">
            {uncategorizedSelected.length} moviment{uncategorizedSelected.length === 1 ? "o" : "i"}{" "}
            selezionat{uncategorizedSelected.length === 1 ? "o" : "i"}
          </span>
          <Select value={bulkCategory} onValueChange={(v) => setBulkCategory(String(v ?? ""))}>
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue placeholder="Categoria CDG..." />
            </SelectTrigger>
            <SelectContent>
              {CDG_CATEGORY_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CDG_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkCategorize}
            disabled={!bulkCategory || bulkCategorize.isPending}
          >
            Categorizza
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="min-w-[250px]">Descrizione</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead className="text-right">Netto</TableHead>
            <TableHead className="text-right">IVA</TableHead>
            <TableHead className="min-w-[180px]">Categoria CDG</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((s) => {
            const amount = Number(s.amount);
            const suggestion = suggestions?.get(s.description);
            return (
              <TableRow
                key={s.id}
                className={cn(
                  "transition-colors duration-150",
                  selectedIds.has(s.id) && "bg-indigo-50/40 dark:bg-indigo-900/10",
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleOne(s.id)}
                  />
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDateShort(s.date)}
                </TableCell>
                <TableCell className="max-w-[350px] truncate text-sm">{s.description}</TableCell>
                <TableCell
                  className={cn(
                    "font-numeric text-right font-medium tabular-nums",
                    amount > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {formatEUR(s.amount)}
                </TableCell>
                <TableCell className="font-numeric text-right text-sm tabular-nums">
                  {s.netAmount != null ? formatEUR(s.netAmount) : "—"}
                </TableCell>
                <TableCell className="font-numeric text-right text-sm tabular-nums">
                  {s.vatAmount != null && Number(s.vatAmount) !== 0 ? formatEUR(s.vatAmount) : "—"}
                </TableCell>
                <TableCell>
                  {s.cdgCategory ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {CDG_CATEGORY_LABELS[s.cdgCategory] ?? s.cdgCategory}
                    </span>
                  ) : (
                    <CategorySelector
                      statementId={s.id}
                      suggestion={suggestion}
                      onCategorize={categorize}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Inline category selector for uncategorized rows ────────────────────────

function CategorySelector({
  statementId,
  suggestion,
  onCategorize,
}: {
  statementId: string;
  suggestion?: { cdgCategory: string; confidence: number } | null;
  onCategorize: ReturnType<typeof useCategorizeBankStatement>;
}) {
  return (
    <div className="flex items-center gap-1">
      <Select
        onValueChange={(value) => {
          if (value) onCategorize.mutate({ id: statementId, cdgCategory: String(value) });
        }}
      >
        <SelectTrigger className="h-7 w-40 text-xs">
          <SelectValue placeholder="Assegna..." />
        </SelectTrigger>
        <SelectContent>
          {/* Show suggestion first if available */}
          {suggestion && (
            <SelectGroup>
              <SelectLabel>
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Suggerito ({Math.round(suggestion.confidence * 100)}%)
                </span>
              </SelectLabel>
              <SelectItem value={suggestion.cdgCategory}>
                {CDG_CATEGORY_LABELS[suggestion.cdgCategory] ?? suggestion.cdgCategory}
              </SelectItem>
            </SelectGroup>
          )}
          {CDG_CATEGORY_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CDG_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
