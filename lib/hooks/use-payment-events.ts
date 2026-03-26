"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface PaymentEvent {
  id: string;
  organizationId: string;
  invoiceId: string | null;
  oneOffExpenseId: string | null;
  amount: number;
  eventDate: string;
  isActual: boolean;
  notes: string | null;
}

export function usePaymentEvents(invoiceId?: string, oneOffExpenseId?: string) {
  return useQuery<PaymentEvent[]>({
    queryKey: ["payment-events", invoiceId, oneOffExpenseId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (invoiceId) params.set("invoiceId", invoiceId);
      if (oneOffExpenseId) params.set("oneOffExpenseId", oneOffExpenseId);
      const { data } = await axios.get(`/api/payment-events?${params}`);
      return data;
    },
    enabled: !!(invoiceId || oneOffExpenseId),
  });
}

export function useCreatePaymentEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      invoiceId?: string;
      oneOffExpenseId?: string;
      amount: number;
      eventDate: string;
      isActual: boolean;
      notes?: string;
    }) => {
      const { data } = await axios.post("/api/payment-events", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-events"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["cashflow-projection"] });
    },
  });
}

export function useDeletePaymentEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.delete(`/api/payment-events?id=${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-events"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["cashflow-projection"] });
    },
  });
}
