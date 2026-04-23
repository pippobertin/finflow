"use client";

import { useQuery } from "@tanstack/react-query";
import type { ScadenzaItem } from "@/lib/queries/scadenze";

export type { ScadenzaItem };

export interface ScadenzeSummary {
  totalIn: number;
  totalOut: number;
  netFlow: number;
  count: number;
}

export interface ScadenzeData {
  items: ScadenzaItem[];
  summary: ScadenzeSummary;
  horizon: number;
}

async function fetchScadenze(days: number): Promise<ScadenzeData> {
  const res = await fetch(`/api/client/scadenze?days=${days}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Errore nel caricamento delle scadenze");
  }
  return res.json();
}

export function useClientScadenze(days = 90) {
  return useQuery({
    queryKey: ["client-scadenze", days],
    queryFn: () => fetchScadenze(days),
    staleTime: 5 * 60 * 1000,
  });
}
