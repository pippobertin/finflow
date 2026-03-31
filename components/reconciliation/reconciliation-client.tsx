"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, CheckCircle, XCircle, Link2, EyeOff, GraduationCap } from "lucide-react";
import { MatchCard } from "./match-card";
import { ExpenseMatchGroup } from "./expense-match-group";
import { ManualMatch } from "./manual-match";
import { PatternTrainingDialog } from "./pattern-training-dialog";
import { toast } from "sonner";

interface Movement {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
}

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

interface UnmatchedInvoice {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number;
  direction: string;
  date: string;
  dueDate: string | null;
  status: string;
}

export function ReconciliationClient() {
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [unmatchedInvoices, setUnmatchedInvoices] = useState<UnmatchedInvoice[]>([]);
  const [manualMatchMovement, setManualMatchMovement] = useState<Movement | null>(null);
  const [manualMatchOpen, setManualMatchOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [trainingMovement, setTrainingMovement] = useState<Movement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const lastClickedIndex = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reconciliation");
      const data = await res.json();
      setMovements(data.unreconciledMovements ?? []);
      setSuggestions(data.suggestions ?? []);
      setUnmatchedInvoices(data.unmatchedInvoices ?? []);
      setSelectedIds(new Set());
    } catch {
      toast.error("Errore nel caricamento");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Grouped expense suggestions ---
  const { expenseGroups, invoiceSuggestions } = useMemo(() => {
    const groups = new Map<string, Suggestion[]>();
    const nonExpense: Suggestion[] = [];

    for (const s of suggestions) {
      if (s.type === "expense" && s.recurringExpenseId) {
        const key = s.recurringExpenseId;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(s);
      } else {
        nonExpense.push(s);
      }
    }

    return {
      expenseGroups: Array.from(groups.entries()).map(([id, items]) => ({
        recurringExpenseId: id,
        expenseName: items[0].recurringExpenseName ?? "Spesa ricorrente",
        suggestions: items,
      })),
      invoiceSuggestions: nonExpense,
    };
  }, [suggestions]);

  // --- Selection helpers (shift-click range support) ---
  function handleSelectClick(index: number, e: React.MouseEvent) {
    const bsId = invoiceSuggestions[index].bankStatementId;

    if (e.shiftKey && lastClickedIndex.current !== null) {
      // Shift-click: select/deselect the entire range
      const from = Math.min(lastClickedIndex.current, index);
      const to = Math.max(lastClickedIndex.current, index);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (let i = from; i <= to; i++) {
          next.add(invoiceSuggestions[i].bankStatementId);
        }
        return next;
      });
    } else {
      // Normal click: toggle single item
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(bsId)) next.delete(bsId);
        else next.add(bsId);
        return next;
      });
    }
    lastClickedIndex.current = index;
  }

  function selectAll() {
    setSelectedIds(new Set(invoiceSuggestions.map((s) => s.bankStatementId)));
    lastClickedIndex.current = null;
  }

  function selectNone() {
    setSelectedIds(new Set());
    lastClickedIndex.current = null;
  }

  const allSelected =
    invoiceSuggestions.length > 0 &&
    invoiceSuggestions.every((s) => selectedIds.has(s.bankStatementId));

  // --- Bulk actions ---
  async function handleBulkConfirm() {
    const selected = invoiceSuggestions.filter((s) => selectedIds.has(s.bankStatementId));
    if (selected.length === 0) return;

    setBulkProcessing(true);
    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          matches: selected.map((s) => ({
            bankStatementId: s.bankStatementId,
            ...(s.type === "expense" && s.recurringExpenseId
              ? { recurringExpenseId: s.recurringExpenseId }
              : { invoiceIds: s.invoices.map((i) => i.id) }),
            accepted: true,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Errore server (${res.status})`);
      }
      const result = await res.json();
      toast.success(`${result.reconciled ?? selected.length} match confermati`);
      setSelectedIds(new Set());
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore nella conferma");
    } finally {
      setBulkProcessing(false);
    }
  }

  function handleBulkReject() {
    const toRemove = new Set(selectedIds);
    setSuggestions((prev) => prev.filter((s) => !toRemove.has(s.bankStatementId)));
    setSelectedIds(new Set());
  }

  // --- Single actions (used by expense groups) ---
  async function handleAcceptMatch(suggestion: Suggestion) {
    try {
      const matchPayload: Record<string, unknown> = {
        bankStatementId: suggestion.bankStatementId,
        accepted: true,
      };
      if (suggestion.type === "expense" && suggestion.recurringExpenseId) {
        matchPayload.recurringExpenseId = suggestion.recurringExpenseId;
      } else {
        matchPayload.invoiceIds = suggestion.invoices.map((i) => i.id);
      }

      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          matches: [matchPayload],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Errore server (${res.status})`);
      }
      toast.success("Match confermato");
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    }
  }

  async function handleRejectMatch(suggestion: Suggestion) {
    setSuggestions((prev) => prev.filter((s) => s.bankStatementId !== suggestion.bankStatementId));
  }

  async function handleAcceptGroup(recurringExpenseId: string) {
    const group = expenseGroups.find((g) => g.recurringExpenseId === recurringExpenseId);
    if (!group) return;

    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          matches: group.suggestions.map((s) => ({
            bankStatementId: s.bankStatementId,
            recurringExpenseId: s.recurringExpenseId,
            accepted: true,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Errore server (${res.status})`);
      }
      toast.success(`${group.suggestions.length} match confermati per "${group.expenseName}"`);
      fetchData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore nella conferma del gruppo");
    }
  }

  function handleRejectGroup(recurringExpenseId: string) {
    setSuggestions((prev) =>
      prev.filter((s) => !(s.type === "expense" && s.recurringExpenseId === recurringExpenseId)),
    );
  }

  async function handleIgnoreMovement(id: string) {
    try {
      await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ignore", bankStatementId: id }),
      });
      toast.success("Movimento ignorato");
      fetchData();
    } catch {
      toast.error("Errore");
    }
  }

  function openManualMatch(movement: Movement) {
    setManualMatchMovement(movement);
    setManualMatchOpen(true);
  }

  // Movements that don't have a suggestion
  const suggestedBsIds = new Set(suggestions.map((s) => s.bankStatementId));
  const unsuggestedMovements = movements.filter((m) => !suggestedBsIds.has(m.id));

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="font-numeric text-2xl font-bold">{movements.length}</p>
          <p className="text-xs text-slate-500">Non riconciliati</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="font-numeric text-2xl font-bold text-emerald-600">{suggestions.length}</p>
          <p className="text-xs text-emerald-600/80">Suggerimenti</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-numeric text-2xl font-bold text-amber-600">
            {unmatchedInvoices.length}
          </p>
          <p className="text-xs text-amber-600/80">Fatture senza match</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Gestione Riconciliazione</h3>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Aggiorna
        </Button>
      </div>

      {/* Section: Suggerimenti — invoice matches as selectable table */}
      {invoiceSuggestions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Suggerimenti Fatture ({invoiceSuggestions.length})
            </h4>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <span className="text-xs text-slate-500">
                  {selectedIds.size} selezionat{selectedIds.size === 1 ? "o" : "i"}
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={selectedIds.size === 0 || bulkProcessing}
                onClick={handleBulkReject}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Rifiuta
              </Button>
              <Button
                size="sm"
                disabled={selectedIds.size === 0 || bulkProcessing}
                onClick={handleBulkConfirm}
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                Conferma {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="w-10 px-3 py-2 text-left">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => (allSelected ? selectNone() : selectAll())}
                    />
                  </th>
                  <th className="w-20 px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                    Data
                  </th>
                  <th className="px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                    Movimento bancario
                  </th>
                  <th className="w-[280px] px-2 py-2 text-left text-[11px] font-medium text-slate-500">
                    Fattura abbinata
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceSuggestions.map((s, i) => (
                  <MatchCard
                    key={s.bankStatementId}
                    {...s}
                    recurringExpenseName={s.recurringExpenseName}
                    selected={selectedIds.has(s.bankStatementId)}
                    onSelectClick={(e) => handleSelectClick(i, e)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Section: Expense groups (unchanged accordion style) */}
      {expenseGroups.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Suggerimenti Spese Ricorrenti (
            {expenseGroups.reduce((s, g) => s + g.suggestions.length, 0)})
          </h4>
          {expenseGroups.map((group) => (
            <ExpenseMatchGroup
              key={group.recurringExpenseId}
              expenseName={group.expenseName}
              suggestions={group.suggestions}
              onAcceptGroup={() => handleAcceptGroup(group.recurringExpenseId)}
              onRejectGroup={() => handleRejectGroup(group.recurringExpenseId)}
              onAcceptSingle={(s) => handleAcceptMatch(s)}
              onRejectSingle={(s) => handleRejectMatch(s)}
            />
          ))}
        </section>
      )}

      {suggestions.length === 0 && (
        <p className="text-sm text-slate-500">Nessun suggerimento disponibile.</p>
      )}

      {/* Section: Movimenti senza match */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Movimenti senza match ({unsuggestedMovements.length})
        </h4>

        {unsuggestedMovements.length === 0 ? (
          <p className="text-sm text-slate-500">
            Tutti i movimenti hanno un suggerimento o sono riconciliati.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Data</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead className="w-28 text-right">Importo</TableHead>
                  <TableHead className="w-56" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {unsuggestedMovements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      {new Date(m.date).toLocaleDateString("it-IT")}
                    </TableCell>
                    <TableCell className="overflow-hidden text-sm">
                      <span className="block truncate" title={m.description}>
                        {m.description}
                      </span>
                    </TableCell>
                    <TableCell className="font-numeric text-right whitespace-nowrap">
                      {m.amount.toLocaleString("it-IT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openManualMatch(m)}>
                          <Link2 className="mr-1 h-3 w-3" />
                          Match
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTrainingMovement(m);
                            setTrainingOpen(true);
                          }}
                        >
                          <GraduationCap className="mr-1 h-3 w-3" />
                          Addestra
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleIgnoreMovement(m.id)}
                        >
                          <EyeOff className="mr-1 h-3 w-3" />
                          Ignora
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <ManualMatch
        open={manualMatchOpen}
        onOpenChange={setManualMatchOpen}
        movement={manualMatchMovement}
        invoices={unmatchedInvoices}
        onMatched={fetchData}
      />

      <PatternTrainingDialog
        open={trainingOpen}
        onOpenChange={setTrainingOpen}
        sampleDescription={trainingMovement?.description ?? ""}
        onSaved={() => {
          setTrainingOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}
