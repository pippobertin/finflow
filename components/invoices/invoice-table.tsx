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
import { useUpdateInvoice, useDeleteInvoice } from "@/lib/hooks/use-invoices";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";
import { toast } from "sonner";

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  counterpart: string;
  grossAmount: number | string;
  status: string;
  paidAt: string | null;
  direction: string;
  needsTagging: boolean;
  costCenter: { id: string; name: string; color: string; type: string } | null;
}

interface InvoiceTableProps {
  invoices: InvoiceData[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  /** Current tab direction filter — used for column header label */
  direction?: "ACTIVE" | "PASSIVE";
}

const statusLabels: Record<string, string> = {
  PAID: "Pagata",
  PENDING: "In attesa",
  OVERDUE: "Scaduta",
  DRAFT: "Bozza",
};

const statusOptions = [
  { value: "PAID", label: "Pagata" },
  { value: "PENDING", label: "In attesa" },
  { value: "OVERDUE", label: "Scaduta" },
  { value: "DRAFT", label: "Bozza" },
];

const statusColors: Record<string, string> = {
  PAID: "bg-primary text-primary-foreground",
  PENDING: "bg-secondary text-secondary-foreground",
  OVERDUE: "bg-destructive text-destructive-foreground",
  DRAFT: "border border-input bg-background text-muted-foreground",
};

const UNASSIGNED = "__none__";

export function InvoiceTable({
  invoices,
  selectedIds,
  onSelectionChange,
  onSelectAll,
  direction,
}: InvoiceTableProps) {
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const { data: costCenters = [] } = useCostCenters();
  const [paidPicker, setPaidPicker] = useState<{ invoiceId: string; date: Date } | null>(null);

  const ccItems = costCenters as Array<{ id: string; name: string; color: string; type: string }>;
  const costItems = ccItems.filter((cc) => cc.type === "COST");
  const revenueItems = ccItems.filter((cc) => cc.type === "REVENUE");

  function ccItemsForDirection(dir: string) {
    return dir === "ACTIVE" ? revenueItems : costItems;
  }

  const centerColumnLabel =
    direction === "ACTIVE"
      ? "Centro di Profitto"
      : direction === "PASSIVE"
        ? "Centro di Costo"
        : "CdC / CdP";

  const allSelected = invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id));
  const someSelected = invoices.some((inv) => selectedIds.has(inv.id)) && !allSelected;

  function handleCostCenterChange(invoiceId: string, value: string | null) {
    updateInvoice.mutate({
      invoiceId,
      costCenterId: !value || value === UNASSIGNED ? null : value,
    });
  }

  function handleStatusChange(invoiceId: string, status: string) {
    if (status === "PAID") {
      setPaidPicker({ invoiceId, date: new Date() });
      return;
    }
    updateInvoice.mutate(
      { invoiceId, status },
      {
        onSuccess: () => toast.success(`Stato aggiornato a "${statusLabels[status]}"`),
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
          toast.success('Stato aggiornato a "Pagata"');
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
            <TableHead>Controparte</TableHead>
            <TableHead className="text-right">Importo</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>{centerColumnLabel}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id} data-state={selectedIds.has(inv.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(inv.id)}
                  onCheckedChange={(checked) => onSelectionChange(inv.id, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">{inv.number}</TableCell>
              <TableCell>{formatDateShort(inv.date)}</TableCell>
              <TableCell>{inv.counterpart}</TableCell>
              <TableCell className="text-right font-medium">{formatEUR(inv.grossAmount)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={inv.status}
                    onValueChange={(v) => v && handleStatusChange(inv.id, v)}
                  >
                    <SelectTrigger className="h-7 w-28 border-0 p-0 text-xs shadow-none">
                      <SelectValue>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? "border-input border"}`}
                        >
                          {statusLabels[inv.status] ?? inv.status}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[opt.value]}`}
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
                {(() => {
                  const items = ccItemsForDirection(inv.direction);
                  const isRevenue = inv.direction === "ACTIVE";
                  return (
                    <Select
                      value={inv.costCenter?.id ?? UNASSIGNED}
                      onValueChange={(v) => handleCostCenterChange(inv.id, v)}
                    >
                      <SelectTrigger className="h-7 w-44 text-xs">
                        <SelectValue>
                          {inv.costCenter ? (
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: inv.costCenter.color }}
                              />
                              {inv.costCenter.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {isRevenue ? "Assegna CdP..." : "Assegna CdC..."}
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UNASSIGNED}>
                          <span className="text-muted-foreground">— Nessuno —</span>
                        </SelectItem>
                        {items.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: cc.color }}
                              />
                              {cc.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                })()}
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
            <DialogTitle>Data di pagamento</DialogTitle>
            <DialogDescription>
              Seleziona la data di pagamento per questa fattura.
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
