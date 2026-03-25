"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InvoiceEntry {
  id: string;
  number: string;
  counterpart: string;
}

interface BulkPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceEntry[];
  onConfirm: (paidAtMap: Record<string, string>) => void;
  isPending?: boolean;
}

function buildTodayMap(invoices: InvoiceEntry[]): Record<string, string> {
  const today = format(new Date(), "yyyy-MM-dd");
  return Object.fromEntries(invoices.map((inv) => [inv.id, today]));
}

export function BulkPaidDialog({
  open,
  onOpenChange,
  invoices,
  onConfirm,
  isPending,
}: BulkPaidDialogProps) {
  // Component is conditionally mounted by parent, so initial state is always fresh
  const [dates, setDates] = useState<Record<string, string>>(() => buildTodayMap(invoices));

  function setAllToday() {
    setDates(buildTodayMap(invoices));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Data di pagamento</DialogTitle>
          <DialogDescription>
            Seleziona la data di pagamento per ciascuna fattura.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 font-medium">Fattura</th>
                <th className="py-2 font-medium">Controparte</th>
                <th className="py-2 text-right font-medium">Data pagamento</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{inv.number}</td>
                  <td className="text-muted-foreground py-2">{inv.counterpart}</td>
                  <td className="py-2 text-right">
                    <input
                      type="date"
                      value={dates[inv.id] ?? ""}
                      onChange={(e) => setDates((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                      className="border-input bg-background rounded border px-2 py-1 text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-start">
          <Button variant="outline" size="sm" onClick={setAllToday}>
            Imposta tutte a oggi
          </Button>
        </div>

        <DialogFooter>
          <Button onClick={() => onConfirm(dates)} disabled={isPending}>
            {isPending ? "Aggiornamento..." : "Conferma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
