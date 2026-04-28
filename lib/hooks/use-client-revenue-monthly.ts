"use client";

import { useQuery } from "@tanstack/react-query";

export interface RevenueMonthlyData {
  year: number;
  months: number[]; // 12 values, one per month
  total: number;
  monthDataSource: string[]; // "bank" | "projection"
}

interface FinancialDetailRow {
  name: string;
  type: string;
  months: number[];
  total: number;
}

interface FinancialDetailResponse {
  year: number;
  rows: FinancialDetailRow[];
  monthDataSource: string[];
}

async function fetchRevenueForYear(year: number): Promise<RevenueMonthlyData> {
  const res = await fetch(`/api/analysis/financial-detail?year=${year}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Errore nel caricamento dei ricavi");
  }
  const json: FinancialDetailResponse = await res.json();
  const revenueRow = json.rows.find((r) => r.name === "Fatture attive");
  const months = revenueRow?.months ?? Array(12).fill(0);
  return {
    year: json.year,
    months,
    total: months.reduce((a, b) => a + b, 0),
    monthDataSource: json.monthDataSource,
  };
}

export function useClientRevenueMonthly(year: number) {
  const current = useQuery({
    queryKey: ["client-revenue-monthly", year],
    queryFn: () => fetchRevenueForYear(year),
    staleTime: 5 * 60 * 1000,
  });

  const previous = useQuery({
    queryKey: ["client-revenue-monthly", year - 1],
    queryFn: () => fetchRevenueForYear(year - 1),
    staleTime: 10 * 60 * 1000,
  });

  return {
    currentYear: current.data,
    previousYear: previous.data,
    isLoading: current.isLoading,
    error: current.error,
  };
}
