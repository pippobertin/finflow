"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BankStatementImportInput } from "@/lib/validations/bank-statement-import";
import type { BankStatementImportResult } from "@/lib/connectors/bank-statement-import";

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
