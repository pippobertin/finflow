"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface VatSnapshotRow {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  periodType: string;
  vatDebit: number;
  vatCredit: number;
  vatBalance: number;
  carryForward: number;
  amountDue: number;
  dueDate: string | null;
  isPaid: boolean;
  paidDate: string | null;
  // Optional fields from on-the-fly calculations
  surchargeAmount?: number;
  creditCarriedOut?: number;
  label?: string;
  surchargeRate?: number;
}

export function useVatSnapshots(year: number) {
  return useQuery<VatSnapshotRow[]>({
    queryKey: ["vat-snapshots", year],
    queryFn: async () => {
      const { data } = await axios.get(`/api/vat-snapshots?year=${year}`);
      return data;
    },
  });
}

export function useRecalculateVat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (year: number) => {
      const { data } = await axios.post("/api/vat-snapshots", { year });
      return data as VatSnapshotRow[];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vat-snapshots"] });
    },
  });
}

export function useToggleVatPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; isPaid: boolean; paidDate?: string }) => {
      const { data } = await axios.patch(`/api/vat-snapshots/${payload.id}`, {
        isPaid: payload.isPaid,
        paidDate: payload.paidDate,
      });
      return data as VatSnapshotRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vat-snapshots"] });
    },
  });
}
