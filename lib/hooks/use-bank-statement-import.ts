"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BankStatementImportInput } from "@/lib/validations/bank-statement-import";
import type { BankStatementImportResult } from "@/lib/connectors/bank-statement-import";
import type { ProposedMatch } from "@/lib/reconciliation/reconciliation-engine";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore sconosciuto" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export function useBankStatementImport() {
  const qc = useQueryClient();

  return useMutation<
    BankStatementImportResult,
    Error,
    { file: File; config: BankStatementImportInput }
  >({
    mutationFn: async ({ file, config }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(config));

      const res = await fetch("/api/import/bank-statement", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Errore import" }));
        throw new Error(err.error ?? `Errore ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}

export function useReconciliationMatches(bankStatementIds: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["reconciliation-matches", bankStatementIds],
    queryFn: () =>
      fetchJson<ProposedMatch[]>(
        `/api/bank-statements/reconciliation?bankStatementIds=${bankStatementIds.join(",")}`,
      ),
    enabled: enabled && bankStatementIds.length > 0,
  });
}

export function useConfirmReconciliation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (matches: { bankStatementId: string; invoiceId: string; accepted: boolean }[]) =>
      fetchJson<{ reconciled: number; rejected: number }>("/api/bank-statements/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matches }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["reconciliation-matches"] });
    },
  });
}
