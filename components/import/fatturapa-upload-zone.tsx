"use client";

import { useCallback, useState } from "react";
import { Upload, FileCode, ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FatturapaUploadZoneProps {
  direction: "ACTIVE" | "PASSIVE";
  isParsing: boolean;
  onFileSelect: (file: File) => void;
  onBack: () => void;
}

const ACCEPTED_EXTENSIONS = [".xml", ".p7m", ".zip"];

function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function FatturapaUploadZone({
  direction,
  isParsing,
  onFileSelect,
  onBack,
}: FatturapaUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && isAcceptedFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isParsing}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Indietro
        </Button>
        <Badge variant={direction === "PASSIVE" ? "default" : "secondary"}>
          {direction === "PASSIVE" ? "Fatture Ricevute (Passive)" : "Fatture Emesse (Attive)"}
        </Badge>
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
          isParsing
            ? "border-muted-foreground/25 pointer-events-none opacity-60"
            : dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {isParsing ? (
          <>
            <Loader2 className="text-muted-foreground mb-4 h-12 w-12 animate-spin" />
            <p className="text-lg font-medium">Analisi fatture in corso...</p>
            <p className="text-muted-foreground mt-1 text-sm">Estrazione e parsing dei file XML</p>
          </>
        ) : (
          <>
            <FileCode className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Trascina qui il file FatturaPA</p>
            <p className="text-muted-foreground mt-1 text-sm">Formati supportati: XML, P7M, ZIP</p>
            <label className="mt-4 cursor-pointer">
              <input
                type="file"
                accept=".xml,.p7m,.zip"
                className="hidden"
                onChange={handleFileInput}
              />
              <span className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
                <Upload className="h-4 w-4" />
                Seleziona File
              </span>
            </label>
          </>
        )}
      </div>
    </div>
  );
}
