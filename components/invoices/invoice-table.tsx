"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { it } from "date-fns/locale";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import {
  getStatusLabel,
  getStatusOptions,
  getPaymentDateLabel,
  getPaidSuccessMessage,
  statusColors,
} from "@/lib/helpers/invoice-labels";
import { useUpdateInvoice, useDeleteInvoice } from "@/lib/hooks/use-invoices";
import { toast } from "sonner";

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  grossAmount: number | string;
  status: string;
  paidAt: string | null;
  direction: string;
}

interface InvoiceTableProps {
  invoices: InvoiceData[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export function InvoiceTable({
  invoices,
  selectedIds,
  onSelectionChange,
  onSelectAll,
}: InvoiceTableProps) {
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const [paidPicker, setPaidPicker] = useState<{
    invoiceId: string;
    date: Date;
    invoiceDirection: string;
  } | null>(null);

  const allSelected = invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id));
  const someSelected = invoices.some((inv) => selectedIds.has(inv.id)) && !allSelected;

  function handleStatusChange(invoiceId: string, status: string, invoiceDirection: string) {
    if (status === "PAID") {
      setPaidPicker({ invoiceId, date: new Date(), invoiceDirection });
      return;
    }
    updateInvoice.mutate(
      { invoiceId, status },
      {
        onSuccess: () =>
          toast.success(`Stato aggiornato a "${getStatusLabel(status, invoiceDirection)}"`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function handlePaidConfirm() {
    if (!paidPicker) return;
    updateInvoice.mutate(
      {
        invoiceId: paidPicker.invoiceId,
        status: "PAID",
        paidAt: paidPicker.date.toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(getPaidSuccessMessage(paidPicker.invoiceDirection));
          setPaidPicker(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Numero</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Scadenza</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow
              key={inv.id}
              data-state={selectedIds.has(inv.id) ? "selected" : undefined}
              className="transition-colors duration-150"
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(inv.id)}
                  onCheckedChange={(checked) => onSelectionChange(inv.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{inv.number}</TableCell>
              <TableCell>{formatDateShort(inv.date)}</TableCell>
              <TableCell>
                {inv.dueDate ? (
                  formatDateShort(inv.dueDate)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="font-numeric text-right font-medium tabular-nums">
                {formatEUR(inv.grossAmount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={inv.status}
                    onValueChange={(v) => v && handleStatusChange(inv.id, v, inv.direction)}
                  >
                    <SelectTrigger className="h-7 w-32 border-0 p-0 text-xs shadow-none">
                      <SelectValue>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? "border-input"}`}
                        >
                          {getStatusLabel(inv.status, inv.direction)}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {getStatusOptions(inv.direction).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[opt.value]}`}
                          >
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {inv.status === "PAID" && inv.paidAt && (
                    <span className="text-muted-foreground text-[10px]">
                      {formatDateShort(inv.paidAt)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                  onClick={() => deleteInvoice.mutate(inv.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!paidPicker} onOpenChange={(open) => !open && setPaidPicker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getPaymentDateLabel(paidPicker?.invoiceDirection)}</DialogTitle>
            <DialogDescription>
              Seleziona la {getPaymentDateLabel(paidPicker?.invoiceDirection).toLowerCase()} per
              questa fattura.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2">
            <Calendar
              mode="single"
              selected={paidPicker?.date}
              onSelect={(date) =>
                date && setPaidPicker((prev) => (prev ? { ...prev, date } : null))
              }
              locale={it}
            />
          </div>
          <DialogFooter>
            <Button onClick={handlePaidConfirm} disabled={updateInvoice.isPending}>
              {updateInvoice.isPending ? "Aggiornamento..." : "Conferma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
