"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ExpectedPayableCreateInput,
  ExpectedPayableUpdateInput,
} from "@/lib/validations/expected-payables";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useExpectedPayables() {
  return useQuery({
    queryKey: ["expected-payables"],
    queryFn: () => fetchJson<unknown[]>("/api/expected-payables"),
  });
}

function invalidatePayablesAndCashflow(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["expected-payables"] });
  qc.invalidateQueries({ queryKey: ["cashflow-projection"] });
  qc.invalidateQueries({ queryKey: ["overview"] });
}

export function useCreateExpectedPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpectedPayableCreateInput) =>
      fetchJson("/api/expected-payables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidatePayablesAndCashflow(qc),
  });
}

export function useUpdateExpectedPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpectedPayableUpdateInput }) =>
      fetchJson(`/api/expected-payables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidatePayablesAndCashflow(qc),
  });
}

export function useDeleteExpectedPayable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/expected-payables/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidatePayablesAndCashflow(qc),
  });
}

export function useBulkDeleteExpectedPayables() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      fetchJson("/api/expected-payables/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => invalidatePayablesAndCashflow(qc),
  });
}
