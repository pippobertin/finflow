"use client";

import { useQuery } from "@tanstack/react-query";
import type { IncomeStatementQueryResult } from "@/lib/queries/income-statement";

async function fetchIncomeStatement(snapshotId?: string): Promise<IncomeStatementQueryResult> {
  const params = new URLSearchParams();
  if (snapshotId) params.set("snapshotId", snapshotId);

  const res = await fetch(`/api/analysis/income-statement?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Errore nel caricamento del CE");
  }
  return res.json();
}

export function useIncomeStatement(snapshotId?: string) {
  return useQuery({
    queryKey: ["income-statement", snapshotId ?? "latest"],
    queryFn: () => fetchIncomeStatement(snapshotId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
