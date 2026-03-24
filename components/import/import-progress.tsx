"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "@/lib/types/api";

interface ImportProgressProps {
  result: ImportResult;
  onReset: () => void;
}

export function ImportProgress({ result, onReset }: ImportProgressProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{result.imported}</p>
              <p className="text-muted-foreground text-sm">Importate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{result.tagged}</p>
              <p className="text-muted-foreground text-sm">Auto-classificate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{result.errors.length}</p>
              <p className="text-muted-foreground text-sm">Errori</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {result.errors.length > 0 && (
        <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4">
          <h3 className="text-destructive mb-2 font-medium">Dettaglio errori</h3>
          <ul className="space-y-1 text-sm">
            {result.errors.slice(0, 20).map((err, i) => (
              <li key={i} className="text-muted-foreground">
                Riga {err.row}
                {err.field && `, campo "${err.field}"`}: {err.message}
              </li>
            ))}
            {result.errors.length > 20 && (
              <li className="text-muted-foreground">
                ...e altri {result.errors.length - 20} errori
              </li>
            )}
          </ul>
        </div>
      )}

      <Button onClick={onReset}>Importa un altro file</Button>
    </div>
  );
}
