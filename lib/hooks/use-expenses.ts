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

export function useCreateRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RecurringExpenseCreateInput) =>
      fetchJson("/api/expenses/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", "recurring"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", "recurring"] }),
  });
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/expenses/recurring/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", "recurring"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", "one-off"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", "one-off"] }),
  });
}

export function useDeleteOneOffExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/expenses/one-off/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", "one-off"] }),
  });
}
