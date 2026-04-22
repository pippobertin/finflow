"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface FattureFilters {
  direction?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useClientFatture(filters: FattureFilters = {}) {
  const params = new URLSearchParams();
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();

  return useQuery({
    queryKey: ["client-fatture", filters],
    queryFn: () => fetchJson(`/api/client/fatture${qs ? `?${qs}` : ""}`),
  });
}

export interface CreateInvoiceInput {
  date: string;
  dueDate?: string;
  netAmount: number;
  vatAmount?: number;
  direction: "ACTIVE" | "PASSIVE";
  number?: string;
  notes?: string;
}

export function useCreateFattura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      fetchJson("/api/client/fatture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-fatture"] });
      qc.invalidateQueries({ queryKey: ["client-cassa"] });
      qc.invalidateQueries({ queryKey: ["client-scadenze"] });
      toast.success("Fattura creata");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useMarkFatturaPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, paidAt }: { invoiceId: string; paidAt?: string }) =>
      fetchJson("/api/client/fatture", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, paidAt }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-fatture"] });
      qc.invalidateQueries({ queryKey: ["client-cassa"] });
      qc.invalidateQueries({ queryKey: ["client-scadenze"] });
      toast.success("Fattura segnata come pagata");
    },
    onError: (err) => toast.error(err.message),
  });
}
