"use client";

import { useQuery } from "@tanstack/react-query";
import type { IncomeStatementResult } from "@/lib/analysis/income-statement";
import type { FinancialRatios } from "@/lib/analysis/financial-ratios";
import type {
  BreakEvenResult,
  HealthIndicator,
  NarrativeSummary,
} from "@/lib/analysis/client-indicators";

export interface ClientCdgData {
  snapshotId: string;
  periodStart: string;
  periodEnd: string;
  sourceFilename: string;
  isLocked: boolean;
  incomeStatement: IncomeStatementResult;
  ratios: FinancialRatios;
  bep: BreakEvenResult | null;
  indicators: HealthIndicator[];
  narrative: NarrativeSummary;
}

export interface SnapshotInfo {
  id: string;
  periodStart: string;
  periodEnd: string;
  sourceFilename: string;
  isLocked: boolean;
  uploadedAt: string;
  notes: string | null;
  _count: { lines: number };
}

async function fetchCdg(snapshotId?: string): Promise<ClientCdgData> {
  const params = new URLSearchParams();
  if (snapshotId) params.set("snapshotId", snapshotId);
  const res = await fetch(`/api/client/cdg?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Errore nel caricamento dei dati");
  }
  return res.json();
}

async function fetchSnapshots(): Promise<SnapshotInfo[]> {
  const res = await fetch("/api/client/cdg?list=true");
  if (!res.ok) throw new Error("Errore nel caricamento dei bilanci");
  const data = await res.json();
  return data.snapshots;
}

export function useClientCdg(snapshotId?: string) {
  return useQuery({
    queryKey: ["client-cdg", snapshotId ?? "latest"],
    queryFn: () => fetchCdg(snapshotId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useClientSnapshots() {
  return useQuery({
    queryKey: ["client-snapshots"],
    queryFn: fetchSnapshots,
    staleTime: 5 * 60 * 1000,
  });
}
