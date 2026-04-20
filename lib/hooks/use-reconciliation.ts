"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";

// --- Types ---

export interface SuggestionInvoice {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number;
}

export interface Suggestion {
  bankStatementId: string;
  bankStatementDate: string;
  bankStatementDescription: string;
  bankStatementAmount: number;
  invoices: SuggestionInvoice[];
  type: "single" | "multi" | "expense" | "expectedPayable";
  confidence: number;
  pass: number;
  recurringExpenseId?: string;
  recurringExpenseName?: string;
  expectedPayableId?: string;
  expectedPayableName?: string;
}

export interface UnmatchedInvoice {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number;
  direction: string;
  date: string;
  dueDate: string | null;
  status: string;
}

export interface Movement {
  id: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
}

export interface ExpenseGroup {
  recurringExpenseId: string;
  expenseName: string;
  suggestions: Suggestion[];
}

interface ReconciliationAPIResponse {
  unreconciledMovements: Movement[];
  suggestions: Suggestion[];
  unmatchedInvoices: UnmatchedInvoice[];
}

// --- Helpers ---

function buildDismissals(items: Suggestion[]) {
  const dismissals: Array<{ bankStatementId: string; targetId: string; targetType: string }> = [];
  for (const s of items) {
    if (s.type === "expense" && s.recurringExpenseId) {
      dismissals.push({
        bankStatementId: s.bankStatementId,
        targetId: s.recurringExpenseId,
        targetType: "EXPENSE",
      });
    } else if (s.type === "expectedPayable" && s.expectedPayableId) {
      dismissals.push({
        bankStatementId: s.bankStatementId,
        targetId: s.expectedPayableId,
        targetType: "EXPECTED_PAYABLE",
      });
    } else {
      for (const inv of s.invoices) {
        dismissals.push({
          bankStatementId: s.bankStatementId,
          targetId: inv.id,
          targetType: "INVOICE",
        });
      }
    }
  }
  return dismissals;
}

function buildMatchPayload(s: Suggestion): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    bankStatementId: s.bankStatementId,
    accepted: true,
  };
  if (s.type === "expense" && s.recurringExpenseId) {
    payload.recurringExpenseId = s.recurringExpenseId;
  } else if (s.type === "expectedPayable" && s.expectedPayableId) {
    payload.expectedPayableId = s.expectedPayableId;
  } else {
    payload.invoiceIds = s.invoices.map((i) => i.id);
  }
  return payload;
}

// --- Main hook ---

export function useReconciliationData() {
  const query = useQuery<ReconciliationAPIResponse>({
    queryKey: ["reconciliation"],
    queryFn: async () => {
      const res = await fetch("/api/reconciliation");
      if (!res.ok) throw new Error("Errore nel caricamento riconciliazione");
      return res.json();
    },
    staleTime: 30_000,
  });

  const suggestions = query.data?.suggestions ?? [];
  const unmatchedInvoices = query.data?.unmatchedInvoices ?? [];

  const { suggestionMap, expenseGroups, invoiceSuggestions } = useMemo(() => {
    const map = new Map<string, Suggestion>();
    const groups = new Map<string, Suggestion[]>();
    const nonExpense: Suggestion[] = [];

    for (const s of suggestions) {
      map.set(s.bankStatementId, s);

      if (s.type === "expense" && s.recurringExpenseId) {
        const key = s.recurringExpenseId;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(s);
      } else if (s.type === "expectedPayable" && s.expectedPayableId) {
        const key = `ep-${s.expectedPayableId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(s);
      } else {
        nonExpense.push(s);
      }
    }

    return {
      suggestionMap: map,
      expenseGroups: Array.from(groups.entries()).map(
        ([id, items]): ExpenseGroup => ({
          recurringExpenseId: id,
          expenseName: items[0].recurringExpenseName ?? items[0].expectedPayableName ?? "Spesa",
          suggestions: items,
        }),
      ),
      invoiceSuggestions: nonExpense,
    };
  }, [suggestions]);

  return {
    suggestionMap,
    invoiceSuggestions,
    expenseGroups,
    unmatchedInvoices,
    suggestions,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

// --- Mutations ---

export function useConfirmMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matches: Suggestion[]) => {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          matches: matches.map(buildMatchPayload),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Errore server (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.reconciled ?? 1} match confermati`);
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
      qc.invalidateQueries({ queryKey: ["reconciliation"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDismissMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Suggestion[]) => {
      const dismissals = buildDismissals(items);
      if (dismissals.length === 0) return;
      await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", dismissals }),
      });
    },
    onMutate: async (items) => {
      // Optimistically remove dismissed suggestions from cache immediately
      await qc.cancelQueries({ queryKey: ["reconciliation"] });
      const previous = qc.getQueryData<ReconciliationAPIResponse>(["reconciliation"]);
      const dismissedIds = new Set(items.map((s) => s.bankStatementId));
      qc.setQueryData<ReconciliationAPIResponse>(["reconciliation"], (old) => {
        if (!old) return old;
        return {
          ...old,
          suggestions: old.suggestions.filter((s) => !dismissedIds.has(s.bankStatementId)),
        };
      });
      return { previous };
    },
    onError: (_err, _items, context) => {
      if (context?.previous) {
        qc.setQueryData(["reconciliation"], context.previous);
      }
    },
    // No onSettled refetch for reconciliation — the optimistic update is the
    // source of truth. The server's dismiss is best-effort (fin_dismissed_match
    // table may not exist yet). Refetching would overwrite our local removal.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
    },
  });
}

export function useIgnoreMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bankStatementId: string) => {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ignore", bankStatementId }),
      });
      if (!res.ok) throw new Error("Errore");
    },
    onSuccess: () => {
      toast.success("Movimento ignorato");
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
      qc.invalidateQueries({ queryKey: ["reconciliation"] });
    },
    onError: () => toast.error("Errore"),
  });
}

export function useManualMatchMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bankStatementId,
      invoiceIds,
    }: {
      bankStatementId: string;
      invoiceIds: string[];
    }) => {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual-match",
          bankStatementId,
          invoiceIds,
        }),
      });
      if (!res.ok) throw new Error("Errore nella riconciliazione");
    },
    onSuccess: () => {
      toast.success("Riconciliazione manuale completata");
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
      qc.invalidateQueries({ queryKey: ["reconciliation"] });
    },
    onError: () => toast.error("Errore nella riconciliazione"),
  });
}

export function useConfirmExpenseGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (group: ExpenseGroup) => {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          matches: group.suggestions.map((s) => ({
            bankStatementId: s.bankStatementId,
            ...(s.recurringExpenseId
              ? { recurringExpenseId: s.recurringExpenseId }
              : s.expectedPayableId
                ? { expectedPayableId: s.expectedPayableId }
                : {}),
            accepted: true,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Errore server (${res.status})`);
      }
      return res.json();
    },
    onSuccess: (_data, group) => {
      toast.success(`${group.suggestions.length} match confermati per "${group.expenseName}"`);
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
      qc.invalidateQueries({ queryKey: ["reconciliation"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUnreconcile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bankStatementId: string) => {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unreconcile", bankStatementId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Errore");
      }
    },
    onSuccess: () => {
      toast.success("Riconciliazione annullata");
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
      qc.invalidateQueries({ queryKey: ["reconciliation"] });
    },
    onError: (err) => toast.error(err.message),
  });
}
