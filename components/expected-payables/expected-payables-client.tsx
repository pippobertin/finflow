"use client";

import { useState } from "react";
import { Plus, FileWarning, Trash2, Pencil } from "lucide-react";
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
import { PayableFormDialog } from "./payable-form-dialog";
import { formatEUR } from "@/lib/helpers/format";
import {
  useExpectedPayables,
  useCreateExpectedPayable,
  useUpdateExpectedPayable,
  useDeleteExpectedPayable,
  useBulkDeleteExpectedPayables,
} from "@/lib/hooks/use-expected-payables";
import { toast } from "sonner";

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline"; className?: string }
> = {
  ACTIVE: {
    label: "Attivo",
    variant: "default",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  EXHAUSTED: { label: "Esaurito", variant: "secondary" },
  CANCELLED: {
    label: "Annullato",
    variant: "secondary",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  RENT: "Affitto",
  UTILITIES: "Utenze",
  SALARIES: "Stipendi",
  SOFTWARE: "Software",
  HARDWARE: "Hardware",
  INSURANCE: "Assicurazioni",
  TAXES: "Tasse",
  CONSULTING: "Consulenza",
  MARKETING: "Marketing",
  TRAVEL: "Viaggi",
  TRAINING: "Formazione",
  OTHER: "Altro",
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensile",
  QUARTERLY: "Trimestrale",
  ANNUAL: "Annuale",
  CUSTOM: "Personalizzata",
};

interface PayableItem {
  id: string;
  description: string;
  counterpart: string;
  amount: number | string;
  frequency: string;
  category: string;
  status: string;
  includeInForecast: boolean;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  costCenterId: string | null;
  costCenter: { id: string; name: string; color: string } | null;
}

export function ExpectedPayablesClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PayableItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const query = useExpectedPayables();
  const createMutation = useCreateExpectedPayable();
  const updateMutation = useUpdateExpectedPayable();
  const deleteMutation = useDeleteExpectedPayable();
  const bulkDeleteMutation = useBulkDeleteExpectedPayables();

  const items = (query.data ?? []) as PayableItem[];

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

  function openEdit(item: PayableItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  function handleSubmit(data: Record<string, unknown>) {
    if (editItem) {
      updateMutation.mutate(
        { id: editItem.id, data: data as never },
        {
          onSuccess: () => {
            toast.success("Fattura passiva attesa aggiornata");
            setDialogOpen(false);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      createMutation.mutate(data as never, {
        onSuccess: () => {
          toast.success("Fattura passiva attesa creata");
          setDialogOpen(false);
        },
        onError: (e) => toast.error(e.message),
      });
    }
  }

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Elemento eliminato"),
      onError: (e) => toast.error(e.message),
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;

    bulkDeleteMutation.mutate(ids, {
      onSuccess: () => {
        toast.success(`${ids.length} elementi eliminati`);
        setSelectedIds(new Set());
      },
      onError: (e) => toast.error(e.message),
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Navbar title="Fatture Passive Attese" />
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Fatture passive ricorrenti con importo e frequenza. Verranno inserite nelle previsioni
            cashflow.
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
          <DataTableSkeleton columns={10} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={FileWarning}
            title="Nessuna fattura passiva attesa"
            description="Aggiungi un budget per fatture passive ricorrenti (es. collaboratori stabili)."
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
                <TableHead>Controparte</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Frequenza</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>CdC</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.ACTIVE;

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
                      {formatEUR(Number(item.amount))}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
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
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
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

      <PayableFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editItem ? (editItem as unknown as Record<string, unknown>) : undefined}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </>
  );
}
