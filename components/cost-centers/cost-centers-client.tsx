"use client";

import { useState } from "react";
import { Plus, FolderKanban, Pencil, Trash2, Tags } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CostCenterFormDialog } from "./cost-center-form-dialog";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
} from "@/lib/hooks/use-cost-centers";
import { useInvoices, useReassignInvoice } from "@/lib/hooks/use-invoices";
import { formatEUR } from "@/lib/helpers/format";
import type { CostCenterCreateInput } from "@/lib/validations/cost-center";
import { toast } from "sonner";

interface CostCenterItem {
  id: string;
  name: string;
  type: "COST" | "REVENUE";
  color: string;
  keywords: string[];
  description?: string;
  _count: {
    invoices: number;
    recurringExpenses: number;
    oneOffExpenses: number;
  };
}

interface UntaggedInvoice {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number | string;
}

export function CostCentersClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CostCenterItem | null>(null);

  const { data: costCenters = [], isLoading } = useCostCenters();
  const createCC = useCreateCostCenter();
  const updateCC = useUpdateCostCenter();
  const deleteCC = useDeleteCostCenter();
  const reassign = useReassignInvoice();

  const { data: untaggedData } = useInvoices({ needsTagging: true, pageSize: 10 });
  const untaggedInvoices = ((untaggedData as { data: unknown[] } | undefined)?.data ??
    []) as UntaggedInvoice[];
  const untaggedCount = (untaggedData as { total: number } | undefined)?.total ?? 0;

  const items = costCenters as CostCenterItem[];

  function openCreate() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: CostCenterItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  function handleSubmit(data: CostCenterCreateInput) {
    if (editItem) {
      updateCC.mutate(
        { id: editItem.id, data },
        {
          onSuccess: () => {
            toast.success("Centro aggiornato");
            setDialogOpen(false);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      createCC.mutate(data, {
        onSuccess: () => {
          toast.success("Centro creato");
          setDialogOpen(false);
        },
        onError: (e) => toast.error(e.message),
      });
    }
  }

  function handleDelete(id: string) {
    deleteCC.mutate(id, {
      onSuccess: () => toast.success("Centro eliminato"),
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <>
      <Navbar title="Centri di Costo" />
      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main: cost center list */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{items.length} centri di costo</h2>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="Nessun centro di costo"
                description="Crea il primo centro di costo per organizzare entrate e uscite."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Crea il primo
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {items.map((cc) => (
                  <Card key={cc.id}>
                    <CardContent className="flex items-start justify-between p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 inline-block h-4 w-4 rounded-full"
                          style={{ backgroundColor: cc.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{cc.name}</h3>
                            <Badge variant="outline" className="text-[10px]">
                              {cc.type === "COST" ? "Costo" : "Ricavo"}
                            </Badge>
                          </div>
                          {cc.description && (
                            <p className="text-muted-foreground mt-0.5 text-xs">{cc.description}</p>
                          )}
                          {cc.keywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {cc.keywords.map((kw) => (
                                <Badge key={kw} variant="secondary" className="text-[10px]">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-muted-foreground mt-1 text-xs">
                            {cc._count.invoices} fatture &middot; {cc._count.recurringExpenses}{" "}
                            spese ricorrenti &middot; {cc._count.oneOffExpenses} una tantum
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(cc)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-7 w-7"
                          onClick={() => handleDelete(cc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: untagged invoices */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tags className="h-4 w-4" />
                  Da Classificare
                  {untaggedCount > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {untaggedCount}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {untaggedInvoices.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Tutte le fatture sono classificate.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {untaggedInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{inv.counterpart}</p>
                          <p className="text-muted-foreground text-xs">
                            {inv.number} &middot; {formatEUR(inv.grossAmount)}
                          </p>
                        </div>
                        <Select
                          value=""
                          onValueChange={(ccId) =>
                            ccId && reassign.mutate({ invoiceId: inv.id, costCenterId: ccId })
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue placeholder="Assegna" />
                          </SelectTrigger>
                          <SelectContent>
                            {items.map((cc) => (
                              <SelectItem key={cc.id} value={cc.id}>
                                <span className="flex items-center gap-1">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CostCenterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editItem ? { ...editItem } : undefined}
        onSubmit={handleSubmit}
        isPending={createCC.isPending || updateCC.isPending}
      />
    </>
  );
}
