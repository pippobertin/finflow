"use client";

import { useQuery } from "@tanstack/react-query";
import { useCostCenterFilter } from "@/lib/stores/cost-center-filter";
import type { CashflowProjectionResult } from "@/lib/types/cashflow";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useCashflowProjection(initialData?: CashflowProjectionResult) {
  const { selectedIds } = useCostCenterFilter();

  return useQuery({
    queryKey: ["cashflow-projection", selectedIds],
    queryFn: () => {
      const params = selectedIds.length ? `?costCenterIds=${selectedIds.join(",")}` : "";
      return fetchJson<CashflowProjectionResult>(`/api/analysis/cashflow-projection${params}`);
    },
    initialData,
  });
}
