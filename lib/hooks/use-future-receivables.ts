"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  FutureReceivableCreateInput,
  FutureReceivableUpdateInput,
} from "@/lib/validations/future-receivables";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useFutureReceivables() {
  return useQuery({
    queryKey: ["future-receivables"],
    queryFn: () => fetchJson<unknown[]>("/api/future-receivables"),
  });
}

function invalidateReceivablesAndCashflow(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["future-receivables"] });
  qc.invalidateQueries({ queryKey: ["cashflow-projection"] });
  qc.invalidateQueries({ queryKey: ["overview"] });
}

export function useCreateFutureReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FutureReceivableCreateInput) =>
      fetchJson("/api/future-receivables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateReceivablesAndCashflow(qc),
  });
}

export function useUpdateFutureReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FutureReceivableUpdateInput }) =>
      fetchJson(`/api/future-receivables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateReceivablesAndCashflow(qc),
  });
}

export function useDeleteFutureReceivable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/future-receivables/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateReceivablesAndCashflow(qc),
  });
}

export function useBulkDeleteFutureReceivables() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      fetchJson("/api/future-receivables/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => invalidateReceivablesAndCashflow(qc),
  });
}
