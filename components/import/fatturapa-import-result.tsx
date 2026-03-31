"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, AlertTriangle, SkipForward, XCircle, Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FatturapaImportResult, FatturapaInvoiceSummary } from "@/lib/types/api";
import { createPortal } from "react-dom";

interface FatturapaImportResultProps {
  result: FatturapaImportResult;
  onReset: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
}

function DetailPanel({
  items,
  emptyLabel,
  isError,
}: {
  items: FatturapaInvoiceSummary[];
  emptyLabel: string;
  isError?: boolean;
}) {
  if (items.length === 0) {
    return <div className="text-muted-foreground p-3 text-center text-xs">{emptyLabel}</div>;
  }
  return (
    <div className="max-h-60 overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b text-left">
            <th className="px-2 py-1.5 font-medium">N.</th>
            <th className="px-2 py-1.5 font-medium">{isError ? "Errore" : "Controparte"}</th>
            {!isError && <th className="px-2 py-1.5 text-right font-medium">Importo</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((inv, i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="px-2 py-1.5 font-mono whitespace-nowrap">{inv.number}</td>
              <td className="max-w-[220px] truncate px-2 py-1.5">{inv.counterpart}</td>
              {!isError && (
                <td className="px-2 py-1.5 text-right whitespace-nowrap">
                  {formatCurrency(inv.grossAmount)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  items: FatturapaInvoiceSummary[];
  emptyLabel: string;
  isError?: boolean;
}

function StatCard({ icon, value, label, items, emptyLabel, isError }: StatCardProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show() {
    clearTimeout(timeoutRef.current);
    if (value === 0) return;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 320) });
    }
    setOpen(true);
  }

  function hide() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  function keepOpen() {
    clearTimeout(timeoutRef.current);
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <>
      <div ref={cardRef} onMouseEnter={show} onMouseLeave={hide}>
        <Card className={`transition-shadow ${value > 0 ? "cursor-default hover:shadow-md" : ""}`}>
          <CardContent className="flex items-center gap-3 p-4">
            {icon}
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-muted-foreground text-sm">{label}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {open &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            onMouseEnter={keepOpen}
            onMouseLeave={hide}
            className="bg-popover animate-in fade-in-0 zoom-in-95 fixed z-[9999] rounded-lg border shadow-lg duration-100"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className="text-muted-foreground border-b px-3 py-2 text-xs font-semibold">
              {label} ({value})
            </div>
            <DetailPanel items={items} emptyLabel={emptyLabel} isError={isError} />
          </div>,
          document.body,
        )}
    </>
  );
}

export function FatturapaImportResultView({ result, onReset }: FatturapaImportResultProps) {
  const errorItems: FatturapaInvoiceSummary[] = result.errors.map((err) => ({
    number: err.field ?? `#${err.row}`,
    counterpart: err.message.length > 80 ? err.message.slice(0, 80) + "..." : err.message,
    grossAmount: 0,
    documentType: "",
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-5">
        <StatCard
          icon={<CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />}
          value={result.imported}
          label="Importate"
          items={result.importedDetails ?? []}
          emptyLabel="Nessuna fattura importata"
        />
        <StatCard
          icon={<Wrench className="h-8 w-8 shrink-0 text-violet-500" />}
          value={result.fixed ?? 0}
          label="Numeri corretti"
          items={result.fixedDetails ?? []}
          emptyLabel="Nessuna correzione"
        />
        <StatCard
          icon={<AlertTriangle className="h-8 w-8 shrink-0 text-amber-500" />}
          value={result.tagged}
          label="Auto-classificate"
          items={result.taggedDetails ?? []}
          emptyLabel="Nessuna auto-classificazione"
        />
        <StatCard
          icon={<SkipForward className="h-8 w-8 shrink-0 text-blue-500" />}
          value={result.skipped}
          label="Saltate (duplicati)"
          items={result.skippedDetails ?? []}
          emptyLabel="Nessun duplicato"
        />
        <StatCard
          icon={<XCircle className="h-8 w-8 shrink-0 text-red-500" />}
          value={result.errors.length}
          label="Errori"
          items={errorItems}
          emptyLabel="Nessun errore"
          isError
        />
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 font-medium text-amber-800">Avvisi</h3>
          <ul className="space-y-1 text-sm text-amber-700">
            {result.warnings.slice(0, 10).map((w, i) => (
              <li key={i}>
                {w.file}: {w.message}
              </li>
            ))}
            {result.warnings.length > 10 && (
              <li>...e altri {result.warnings.length - 10} avvisi</li>
            )}
          </ul>
        </div>
      )}

      <Button onClick={onReset}>Importa un altro file</Button>
    </div>
  );
}
