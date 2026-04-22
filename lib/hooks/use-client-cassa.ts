"use client";

import { useQuery } from "@tanstack/react-query";

export interface CassaMilestones {
  days30: number | null;
  days60: number | null;
  days90: number | null;
}

export interface CassaChartPoint {
  date: string;
  balance: number;
  netFlow: number;
}

export interface CassaNextItem {
  date: string;
  type: string;
  label: string;
  counterpart?: string;
  amount: number;
}

export interface CassaData {
  currentBalance: number;
  asOfDate: string;
  milestones: CassaMilestones;
  chartData: CassaChartPoint[];
  nextItems: CassaNextItem[];
  threshold: number;
}

async function fetchCassa(): Promise<CassaData> {
  const res = await fetch("/api/client/cassa");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Errore nel caricamento dei dati di cassa");
  }
  return res.json();
}

export function useClientCassa() {
  return useQuery({
    queryKey: ["client-cassa"],
    queryFn: fetchCassa,
    staleTime: 5 * 60 * 1000,
  });
}
