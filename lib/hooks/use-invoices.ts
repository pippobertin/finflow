"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCostCenterFilter } from "@/lib/stores/cost-center-filter";
import { toast } from "sonner";

interface InvoiceFilters {
  direction?: string;
  status?: string;
  needsTagging?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const { selectedIds } = useCostCenterFilter();

  const params = new URLSearchParams();
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.status) params.set("status", filters.status);
  if (filters.needsTagging !== undefined) params.set("needsTagging", String(filters.needsTagging));
  if (filters.search) params.set("search", filters.search);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (selectedIds.length) params.set("costCenterId", selectedIds[0]);

  const qs = params.toString();

  return useQuery({
    queryKey: ["invoices", filters, selectedIds],
    queryFn: () => fetchJson(`/api/invoices${qs ? `?${qs}` : ""}`),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      costCenterId,
      status,
      paidAt,
    }: {
      invoiceId: string;
      costCenterId?: string | null;
      status?: string;
      paidAt?: string | null;
    }) =>
      fetchJson(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(costCenterId !== undefined && { costCenterId }),
          ...(status !== undefined && { status }),
          ...(paidAt !== undefined && { paidAt }),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}

/** @deprecated Use useUpdateInvoice */
export const useReassignInvoice = useUpdateInvoice;

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceIds,
      status,
      paidAtMap,
    }: {
      invoiceIds: string[];
      status: string;
      paidAtMap?: Record<string, string>;
    }) =>
      fetchJson<{ updated: number }>("/api/invoices/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds, status, ...(paidAtMap && { paidAtMap }) }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      toast.success(`${data.updated} fatture aggiornate`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      fetchJson(`/api/invoices/${invoiceId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      toast.success("Fattura eliminata");
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useBulkDeleteInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceIds: string[]) =>
      fetchJson<{ deleted: number }>("/api/invoices/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      toast.success(`${data.deleted} fatture eliminate`);
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAutoTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceIds?: string[]) =>
      fetchJson("/api/invoices/tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
