"use client";

import { useQuery } from "@tanstack/react-query";
import type { PreconsuntivoQueryResult } from "@/lib/queries/budget-variance";

async function fetchPreconsuntivo(year: number): Promise<PreconsuntivoQueryResult> {
  const res = await fetch(`/api/client/preconsuntivo?year=${year}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useClientPreconsuntivo(year: number) {
  return useQuery({
    queryKey: ["client-preconsuntivo", year],
    queryFn: () => fetchPreconsuntivo(year),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
