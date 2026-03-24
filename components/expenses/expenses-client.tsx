"use client";

import { useState } from "react";
import { Plus, Receipt, Trash2, Pencil } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ExpenseFormDialog } from "./expense-form-dialog";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import {
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  useOneOffExpenses,
  useCreateOneOffExpense,
  useUpdateOneOffExpense,
  useDeleteOneOffExpense,
} from "@/lib/hooks/use-expenses";
import { toast } from "sonner";

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

interface ExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: number | string;
  frequency?: string;
  date?: string;
  startDate?: string;
  isPaid?: boolean;
  costCenter: { id: string; name: string; color: string } | null;
}

export function ExpensesClient() {
  const [tab, setTab] = useState("recurring");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseItem | null>(null);

  const recurringQuery = useRecurringExpenses();
  const oneOffQuery = useOneOffExpenses();
  const createRecurring = useCreateRecurringExpense();
  const updateRecurring = useUpdateRecurringExpense();
  const deleteRecurring = useDeleteRecurringExpense();
  const createOneOff = useCreateOneOffExpense();
  const updateOneOff = useUpdateOneOffExpense();
  const deleteOneOff = useDeleteOneOffExpense();

  const recurring = (recurringQuery.data ?? []) as ExpenseItem[];
  const oneOff = (oneOffQuery.data ?? []) as ExpenseItem[];

  function openCreate() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: ExpenseItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  function handleSubmit(data: Record<string, unknown>) {
    if (tab === "recurring") {
      if (editItem) {
        updateRecurring.mutate(
          { id: editItem.id, data: data as never },
          {
            onSuccess: () => {
              toast.success("Spesa aggiornata");
              setDialogOpen(false);
            },
            onError: (e) => toast.error(e.message),
          },
        );
      } else {
        createRecurring.mutate(data as never, {
          onSuccess: () => {
            toast.success("Spesa creata");
            setDialogOpen(false);
          },
          onError: (e) => toast.error(e.message),
        });
      }
    } else {
      if (editItem) {
        updateOneOff.mutate(
          { id: editItem.id, data: data as never },
          {
            onSuccess: () => {
              toast.success("Spesa aggiornata");
              setDialogOpen(false);
            },
            onError: (e) => toast.error(e.message),
          },
        );
      } else {
        createOneOff.mutate(data as never, {
          onSuccess: () => {
            toast.success("Spesa creata");
            setDialogOpen(false);
          },
          onError: (e) => toast.error(e.message),
        });
      }
    }
  }

  function handleDelete(id: string) {
    if (tab === "recurring") {
      deleteRecurring.mutate(id, {
        onSuccess: () => toast.success("Spesa eliminata"),
        onError: (e) => toast.error(e.message),
      });
    } else {
      deleteOneOff.mutate(id, {
        onSuccess: () => toast.success("Spesa eliminata"),
        onError: (e) => toast.error(e.message),
      });
    }
  }

  const isLoading = tab === "recurring" ? recurringQuery.isLoading : oneOffQuery.isLoading;
  const items = tab === "recurring" ? recurring : oneOff;
  const isPending =
    createRecurring.isPending ||
    updateRecurring.isPending ||
    createOneOff.isPending ||
    updateOneOff.isPending;

  return (
    <>
      <Navbar title="Spese" />
      <div className="space-y-4 p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v ?? "recurring")}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="recurring">Ricorrenti</TabsTrigger>
              <TabsTrigger value="one-off">Una Tantum</TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi
            </Button>
          </div>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <DataTableSkeleton columns={tab === "recurring" ? 6 : 7} />
            ) : items.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nessuna spesa"
                description={`Non ci sono spese ${tab === "recurring" ? "ricorrenti" : "una tantum"}.`}
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi la prima
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    {tab === "recurring" && <TableHead>Frequenza</TableHead>}
                    {tab === "one-off" && <TableHead>Data</TableHead>}
                    <TableHead className="text-right">Importo</TableHead>
                    {tab === "one-off" && <TableHead>Stato</TableHead>}
                    <TableHead>Centro di Costo</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[item.category] ?? item.category}
                        </Badge>
                      </TableCell>
                      {tab === "recurring" && (
                        <TableCell>
                          {FREQUENCY_LABELS[item.frequency ?? ""] ?? item.frequency}
                        </TableCell>
                      )}
                      {tab === "one-off" && (
                        <TableCell>{item.date ? formatDateShort(item.date) : "-"}</TableCell>
                      )}
                      <TableCell className="text-right font-medium">
                        {formatEUR(item.amount)}
                      </TableCell>
                      {tab === "one-off" && (
                        <TableCell>
                          <Badge variant={item.isPaid ? "default" : "secondary"}>
                            {item.isPaid ? "Pagata" : "Da pagare"}
                          </Badge>
                        </TableCell>
                      )}
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
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={tab === "recurring" ? "recurring" : "one-off"}
        defaultValues={editItem ? (editItem as unknown as Record<string, unknown>) : undefined}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </>
  );
}
