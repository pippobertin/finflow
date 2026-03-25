"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ParsedFatturaPA } from "@/lib/parsers/fatturapa-parser";
import type { FatturapaImportResult } from "@/lib/types/api";

interface FatturapaRequest {
  file: File;
  direction: "ACTIVE" | "PASSIVE";
}

async function postFatturapa<T>(file: File, direction: string, action: string): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("config", JSON.stringify({ direction, action }));

  const res = await fetch("/api/import/fatturapa", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Errore import" }));
    throw new Error(err.error ?? `Errore ${res.status}`);
  }

  return res.json();
}

export function useFatturapaPreview() {
  return useMutation<ParsedFatturaPA, Error, FatturapaRequest>({
    mutationFn: ({ file, direction }) => postFatturapa<ParsedFatturaPA>(file, direction, "parse"),
  });
}

export function useFatturapaImport() {
  const qc = useQueryClient();

  return useMutation<FatturapaImportResult, Error, FatturapaRequest>({
    mutationFn: ({ file, direction }) =>
      postFatturapa<FatturapaImportResult>(file, direction, "import"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
