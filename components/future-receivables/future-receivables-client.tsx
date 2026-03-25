"use client";

import { useState } from "react";
import { Plus, HandCoins, Trash2, Pencil } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CostCenterBadge } from "@/components/dashboard/cost-center-badge";
import { DataTableSkeleton } from "@/components/dashboard/data-table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ReceivableFormDialog } from "./receivable-form-dialog";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import {
  useFutureReceivables,
  useCreateFutureReceivable,
  useUpdateFutureReceivable,
  useDeleteFutureReceivable,
  useBulkDeleteFutureReceivables,
} from "@/lib/hooks/use-future-receivables";
import { toast } from "sonner";

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  PENDING: { label: "In attesa", variant: "outline" },
  INVOICED: { label: "Fatturato", variant: "default" },
  CANCELLED: { label: "Annullato", variant: "secondary" },
};

interface ReceivableItem {
  id: string;
  description: string;
  counterpart: string;
  estimatedAmount: number | string;
  expectedInvoiceDate: string | null;
  expectedPaymentDate: string | null;
  status: string;
  includeInForecast: boolean;
  notes: string | null;
  costCenterId: string | null;
  costCenter: { id: string; name: string; color: string } | null;
}

export function FutureReceivablesClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ReceivableItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const query = useFutureReceivables();
  const createMutation = useCreateFutureReceivable();
  const updateMutation = useUpdateFutureReceivable();
  const deleteMutation = useDeleteFutureReceivable();
  const bulkDeleteMutation = useBulkDeleteFutureReceivables();

  const items = (query.data ?? []) as ReceivableItem[];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function openCreate() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: ReceivableItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  function handleSubmit(data: Record<string, unknown>) {
    if (editItem) {
      updateMutation.mutate(
        { id: editItem.id, data: data as never },
        {
          onSuccess: () => {
            toast.success("Incasso aggiornato");
            setDialogOpen(false);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      createMutation.mutate(data as never, {
        onSuccess: () => {
          toast.success("Incasso creato");
          setDialogOpen(false);
        },
        onError: (e) => toast.error(e.message),
      });
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Incasso eliminato"),
      onError: (e) => toast.error(e.message),
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    bulkDeleteMutation.mutate(ids, {
      onSuccess: () => {
        toast.success(`${ids.length} incassi eliminati`);
        setSelectedIds(new Set());
      },
      onError: (e) => toast.error(e.message),
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Navbar title="Incassi Futuri" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Lavori completati da fatturare e relativi incassi previsti.
          </p>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {bulkDeleteMutation.isPending ? "Eliminazione..." : `Elimina (${selectedIds.size})`}
              </Button>
            )}
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          </div>
        </div>

        {query.isLoading ? (
          <DataTableSkeleton columns={9} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Nessun incasso futuro"
            description="Non ci sono lavori da fatturare registrati."
            action={
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi il primo
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === items.length && items.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Data fattura</TableHead>
                <TableHead>Data incasso</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Previsione</TableHead>
                <TableHead>CdC</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.PENDING;
                return (
                  <TableRow
                    key={item.id}
                    data-state={selectedIds.has(item.id) ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelect(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.counterpart}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatEUR(item.estimatedAmount)}
                    </TableCell>
                    <TableCell>
                      {item.expectedInvoiceDate ? (
                        formatDateShort(item.expectedInvoiceDate)
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.expectedPaymentDate ? (
                        formatDateShort(item.expectedPaymentDate)
                      ) : (
                        <span className="text-muted-foreground text-xs">auto (DSO)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.includeInForecast ? "default" : "secondary"}>
                        {item.includeInForecast ? "Sì" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.costCenter ? (
                        <CostCenterBadge
                          name={item.costCenter.name}
                          color={item.costCenter.color}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-7 w-7"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <ReceivableFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editItem ? (editItem as unknown as Record<string, unknown>) : undefined}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </>
  );
}
