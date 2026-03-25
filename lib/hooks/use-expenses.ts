"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  RecurringExpenseCreateInput,
  RecurringExpenseUpdateInput,
  OneOffExpenseCreateInput,
  OneOffExpenseUpdateInput,
} from "@/lib/validations/expenses";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

// ── Recurring ───────────────────────────────────────────────

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ["expenses", "recurring"],
    queryFn: () => fetchJson<unknown[]>("/api/expenses/recurring"),
  });
}

function invalidateExpensesAndCashflow(
  qc: ReturnType<typeof useQueryClient>,
  type: "recurring" | "one-off",
) {
  qc.invalidateQueries({ queryKey: ["expenses", type] });
  qc.invalidateQueries({ queryKey: ["cashflow-projection"] });
  qc.invalidateQueries({ queryKey: ["overview"] });
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecurringExpenseCreateInput) =>
      fetchJson("/api/expenses/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "recurring"),
  });
}

export function useUpdateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecurringExpenseUpdateInput }) =>
      fetchJson(`/api/expenses/recurring/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "recurring"),
  });
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/expenses/recurring/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "recurring"),
  });
}

export function useBulkDeleteRecurringExpenses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      fetchJson("/api/expenses/recurring/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "recurring"),
  });
}

// ── One-Off ─────────────────────────────────────────────────

export function useOneOffExpenses() {
  return useQuery({
    queryKey: ["expenses", "one-off"],
    queryFn: () => fetchJson<unknown[]>("/api/expenses/one-off"),
  });
}

export function useCreateOneOffExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OneOffExpenseCreateInput) =>
      fetchJson("/api/expenses/one-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "one-off"),
  });
}

export function useUpdateOneOffExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OneOffExpenseUpdateInput }) =>
      fetchJson(`/api/expenses/one-off/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "one-off"),
  });
}

export function useDeleteOneOffExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/expenses/one-off/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "one-off"),
  });
}

export function useBulkDeleteOneOffExpenses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      fetchJson("/api/expenses/one-off/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => invalidateExpensesAndCashflow(qc, "one-off"),
  });
}
