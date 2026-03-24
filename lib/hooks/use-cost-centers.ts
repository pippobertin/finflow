"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CostCenterCreateInput, CostCenterUpdateInput } from "@/lib/validations/cost-center";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useCostCenters(type?: string) {
  return useQuery({
    queryKey: ["cost-centers", type],
    queryFn: () => fetchJson<unknown[]>(`/api/cost-centers${type ? `?type=${type}` : ""}`),
  });
}

export function useCreateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CostCenterCreateInput) =>
      fetchJson("/api/cost-centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-centers"] }),
  });
}

export function useUpdateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CostCenterUpdateInput }) =>
      fetchJson(`/api/cost-centers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-centers"] }),
  });
}

export function useDeleteCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/cost-centers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cost-centers"] }),
  });
}
