"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConnectorCreateInput, ConnectorUpdateInput } from "@/lib/validations/connector";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useConnectors() {
  return useQuery({
    queryKey: ["connectors"],
    queryFn: () => fetchJson<unknown[]>("/api/connectors"),
  });
}

export function useCreateConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConnectorCreateInput) =>
      fetchJson("/api/connectors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}

export function useUpdateConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConnectorUpdateInput }) =>
      fetchJson(`/api/connectors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}

export function useDeleteConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/connectors/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connectors"] }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/api/connectors/${id}/test`, {
        method: "POST",
      }),
  });
}

export function useSyncConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{
        success: boolean;
        message: string;
        imported: number;
        skipped: number;
        tagged: number;
      }>(`/api/connectors/${id}/sync`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connectors"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

interface FicCompanyItem {
  id: number;
  name: string;
}

export function useFicCompanies() {
  return useMutation({
    mutationFn: (accessToken: string) =>
      fetchJson<{ companies: FicCompanyItem[] }>("/api/connectors/fic-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      }),
  });
}
