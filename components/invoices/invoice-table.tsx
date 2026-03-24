"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { useUpdateInvoice } from "@/lib/hooks/use-invoices";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";
import { toast } from "sonner";

interface InvoiceData {
  id: string;
  number: string;
  date: string;
  counterpart: string;
  grossAmount: number | string;
  status: string;
  direction: string;
  needsTagging: boolean;
  costCenter: { id: string; name: string; color: string; type: string } | null;
}

interface InvoiceTableProps {
  invoices: InvoiceData[];
  selectedIds: Set<string>;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
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
}: InvoiceTableProps) {
  const updateInvoice = useUpdateInvoice();
  const { data: costCenters = [] } = useCostCenters();

  const ccItems = costCenters as Array<{ id: string; name: string; color: string }>;

  const allSelected = invoices.length > 0 && invoices.every((inv) => selectedIds.has(inv.id));
  const someSelected = invoices.some((inv) => selectedIds.has(inv.id)) && !allSelected;

  function handleCostCenterChange(invoiceId: string, value: string | null) {
    updateInvoice.mutate({
      invoiceId,
      costCenterId: !value || value === UNASSIGNED ? null : value,
    });
  }

  function handleStatusChange(invoiceId: string, status: string) {
    updateInvoice.mutate(
      { invoiceId, status },
      {
        onSuccess: () => toast.success(`Stato aggiornato a "${statusLabels[status]}"`),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
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
          <TableHead>Centro di Costo</TableHead>
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
              <Select value={inv.status} onValueChange={(v) => v && handleStatusChange(inv.id, v)}>
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
            </TableCell>
            <TableCell>
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
                      <span className="text-muted-foreground">Assegna...</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>
                    <span className="text-muted-foreground">— Nessuno —</span>
                  </SelectItem>
                  {ccItems.map((cc) => (
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
