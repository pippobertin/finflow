"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrganizationUpdateInput } from "@/lib/validations/organization";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useOrganization() {
  return useQuery({
    queryKey: ["organization"],
    queryFn: () => fetchJson<Record<string, unknown>>("/api/organization"),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrganizationUpdateInput) =>
      fetchJson("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization"] }),
  });
}
