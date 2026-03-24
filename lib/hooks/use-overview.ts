"use client";

import { useQuery } from "@tanstack/react-query";
import { useCostCenterFilter } from "@/lib/stores/cost-center-filter";
import type { OverviewData } from "@/lib/queries/overview";

export function useOverview(initialData?: OverviewData) {
  const { selectedIds } = useCostCenterFilter();

  const params = selectedIds.length ? `?costCenterIds=${selectedIds.join(",")}` : "";

  return useQuery<OverviewData>({
    queryKey: ["overview", selectedIds],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/overview${params}`);
      if (!res.ok) throw new Error("Errore caricamento dati");
      return res.json();
    },
    initialData: selectedIds.length === 0 ? initialData : undefined,
  });
}

export function useForecast(months: 3 | 6 | 12 = 3) {
  const { selectedIds } = useCostCenterFilter();

  const params = new URLSearchParams({ months: String(months) });
  if (selectedIds.length) params.set("costCenterIds", selectedIds.join(","));

  return useQuery({
    queryKey: ["forecast", months, selectedIds],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/forecast?${params}`);
      if (!res.ok) throw new Error("Errore caricamento previsioni");
      return res.json();
    },
  });
}

export function useAnomalies() {
  const { selectedIds } = useCostCenterFilter();

  const params = selectedIds.length ? `?costCenterIds=${selectedIds.join(",")}` : "";

  return useQuery({
    queryKey: ["anomalies", selectedIds],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/anomalies${params}`);
      if (!res.ok) throw new Error("Errore caricamento anomalie");
      return res.json();
    },
  });
}
