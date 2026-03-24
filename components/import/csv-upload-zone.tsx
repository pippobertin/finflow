"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CsvUploadZoneProps {
  onFileSelect: (file: File, direction: "ACTIVE" | "PASSIVE") => void;
}

export function CsvUploadZone({ onFileSelect }: CsvUploadZoneProps) {
  const [direction, setDirection] = useState<"ACTIVE" | "PASSIVE">("PASSIVE");
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        onFileSelect(file, direction);
      }
    },
    [direction, onFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file, direction);
      }
    },
    [direction, onFileSelect],
  );

  return (
    <div className="space-y-4">
      <Tabs value={direction} onValueChange={(v) => v && setDirection(v as "ACTIVE" | "PASSIVE")}>
        <TabsList>
          <TabsTrigger value="PASSIVE">Fatture Passive (Acquisto)</TabsTrigger>
          <TabsTrigger value="ACTIVE">Fatture Attive (Vendita)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
          dragActive
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
        <FileSpreadsheet className="text-muted-foreground mb-4 h-12 w-12" />
        <p className="text-lg font-medium">Trascina qui il file CSV</p>
        <p className="text-muted-foreground mt-1 text-sm">oppure clicca per selezionare</p>
        <label className="mt-4 cursor-pointer">
          <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
          <span className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium">
            <Upload className="h-4 w-4" />
            Seleziona File
          </span>
        </label>
      </div>
    </div>
  );
}
