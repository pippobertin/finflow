"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImportResult } from "@/lib/types/api";
import type { CsvImportInput } from "@/lib/validations/import";

export function useCsvImport() {
  const qc = useQueryClient();

  return useMutation<ImportResult, Error, { file: File; config: CsvImportInput }>({
    mutationFn: async ({ file, config }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(config));

      const res = await fetch("/api/import/csv", {
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
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
