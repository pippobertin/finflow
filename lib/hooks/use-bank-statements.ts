"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCostCenterFilter } from "@/lib/stores/cost-center-filter";
import { toast } from "sonner";

interface BankStatementFilters {
  isReconciled?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
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

export function useBankStatements(filters: BankStatementFilters = {}) {
  const { selectedIds } = useCostCenterFilter();

  const params = new URLSearchParams();
  if (filters.isReconciled !== undefined) params.set("isReconciled", String(filters.isReconciled));
  if (filters.search) params.set("search", filters.search);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (selectedIds.length) params.set("costCenterId", selectedIds[0]);

  const qs = params.toString();

  return useQuery({
    queryKey: ["bank-statements", filters, selectedIds],
    queryFn: () => fetchJson(`/api/bank-statements${qs ? `?${qs}` : ""}`),
  });
}

export function useReassignBankStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, costCenterId }: { id: string; costCenterId: string | null }) =>
      fetchJson(`/api/bank-statements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costCenterId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-statements"] });
      toast.success("Centro di costo aggiornato");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
