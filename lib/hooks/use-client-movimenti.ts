"use client";

import { useQuery } from "@tanstack/react-query";

interface MovimentiFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  categorized?: boolean;
  page?: number;
  pageSize?: number;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useClientMovimenti(filters: MovimentiFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.categorized !== undefined) params.set("categorized", String(filters.categorized));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const qs = params.toString();

  return useQuery({
    queryKey: ["client-movimenti", filters],
    queryFn: () => fetchJson(`/api/client/movimenti${qs ? `?${qs}` : ""}`),
  });
}
