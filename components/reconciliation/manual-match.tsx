"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Movement {
  id: string;
  date: string;
  description: string;
  amount: number;
}

interface Invoice {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number;
  direction: string;
  status: string;
}

interface ManualMatchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: Movement | null;
  invoices: Invoice[];
  onMatched: () => void;
}

export function ManualMatch({
  open,
  onOpenChange,
  movement,
  invoices,
  onMatched,
}: ManualMatchProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  if (!movement) return null;
  const currentMovement = movement;

  const direction = currentMovement.amount < 0 ? "PASSIVE" : "ACTIVE";
  const compatibleInvoices = invoices.filter((inv) => inv.direction === direction);
  const absAmount = Math.abs(currentMovement.amount);
  const selectedTotal = compatibleInvoices
    .filter((inv) => selectedIds.has(inv.id))
    .reduce((sum, inv) => sum + inv.grossAmount, 0);
  const diff = Math.abs(absAmount - selectedTotal);

  function toggleInvoice(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleConfirm() {
    if (selectedIds.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual-match",
          bankStatementId: currentMovement.id,
          invoiceIds: [...selectedIds],
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Riconciliazione manuale completata");
      onOpenChange(false);
      onMatched();
    } catch {
      toast.error("Errore nella riconciliazione");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Riconciliazione Manuale</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Movement info */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20">
            <p className="text-xs text-slate-500">
              {new Date(currentMovement.date).toLocaleDateString("it-IT")}
            </p>
            <p className="text-sm font-medium">{currentMovement.description}</p>
            <p className="font-numeric text-lg font-bold">
              {currentMovement.amount.toLocaleString("it-IT", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          </div>

          {/* Invoice selection */}
          <div className="max-h-64 overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Fattura</TableHead>
                  <TableHead>Controparte</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compatibleInvoices.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => toggleInvoice(inv.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(inv.id)}
                        onCheckedChange={() => toggleInvoice(inv.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{inv.number}</TableCell>
                    <TableCell>{inv.counterpart}</TableCell>
                    <TableCell className="font-numeric text-right">
                      {inv.grossAmount.toLocaleString("it-IT", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <span className="text-sm">
                {selectedIds.size} fattur{selectedIds.size === 1 ? "a" : "e"} selezionat
                {selectedIds.size === 1 ? "a" : "e"}
              </span>
              <div className="text-right">
                <span className="font-numeric text-sm">
                  Totale:{" "}
                  {selectedTotal.toLocaleString("it-IT", { style: "currency", currency: "EUR" })}
                </span>
                {diff > 0.02 && (
                  <span className="ml-2 text-xs text-amber-600">
                    (diff: {diff.toLocaleString("it-IT", { style: "currency", currency: "EUR" })})
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button onClick={handleConfirm} disabled={saving || selectedIds.size === 0}>
              {saving ? "Salvataggio..." : "Conferma"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
