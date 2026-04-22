"use client";

import { useCallback } from "react";
import { Upload } from "lucide-react";

interface BankStatementUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_EXTENSIONS = [".csv", ".pdf"];

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function BankStatementUploadZone({ onFileSelect }: BankStatementUploadZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && isAccepted(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  return (
    <div
      className="border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Upload className="text-muted-foreground mb-4 h-10 w-10" />
      <p className="mb-2 text-sm font-medium">
        Trascina il file dell&apos;estratto conto (CSV o PDF)
      </p>
      <p className="text-muted-foreground mb-4 text-xs">
        Il segno dell&apos;importo determina la direzione (positivo = entrata, negativo = uscita)
      </p>
      <label
        className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "var(--brand, #0b4d8a)" }}
      >
        Seleziona file
        <input type="file" accept=".csv,.pdf" className="hidden" onChange={handleChange} />
      </label>
    </div>
  );
}
