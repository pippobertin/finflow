"use client";

import { useState } from "react";
import { Plus, FolderKanban, Pencil, Trash2 } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { CostCenterFormDialog } from "./cost-center-form-dialog";
import {
  useCostCenters,
  useCreateCostCenter,
  useUpdateCostCenter,
  useDeleteCostCenter,
} from "@/lib/hooks/use-cost-centers";
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
    recurringExpenses: number;
    oneOffExpenses: number;
    bankStatements: number;
  };
}

export function CostCentersClient() {
  const [tab, setTab] = useState<"COST" | "REVENUE">("COST");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CostCenterItem | null>(null);

  const { data: costCenters = [], isLoading } = useCostCenters();
  const createCC = useCreateCostCenter();
  const updateCC = useUpdateCostCenter();
  const deleteCC = useDeleteCostCenter();

  const allItems = costCenters as CostCenterItem[];
  const items = allItems.filter((cc) => cc.type === tab);
  const costCount = allItems.filter((cc) => cc.type === "COST").length;
  const revenueCount = allItems.filter((cc) => cc.type === "REVENUE").length;

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

  const isCost = tab === "COST";
  const label = isCost ? "costo" : "ricavo";
  const emptyTitle = isCost ? "Nessun centro di costo" : "Nessun centro di ricavo";
  const emptyDescription = isCost
    ? "Crea il primo centro di costo per organizzare le uscite."
    : "Crea il primo centro di ricavo per analizzare le entrate.";

  return (
    <>
      <Navbar title="Centri di Costo e Ricavo" />
      <div className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "COST" | "REVENUE")}>
          <TabsList>
            <TabsTrigger value="COST">
              Centri di Costo
              {costCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {costCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="REVENUE">
              Centri di Ricavo
              {revenueCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {revenueCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {items.length} centr{items.length === 1 ? "o" : "i"} di {label}
                </h2>
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
                  title={emptyTitle}
                  description={emptyDescription}
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
                            <h3 className="font-medium">{cc.name}</h3>
                            {cc.description && (
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                {cc.description}
                              </p>
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
                              {cc._count.recurringExpenses} spese ricorrenti &middot;{" "}
                              {cc._count.oneOffExpenses} una tantum &middot;{" "}
                              {cc._count.bankStatements} movimenti
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
          </TabsContent>
        </Tabs>
      </div>

      <CostCenterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={editItem ? { ...editItem } : { type: tab }}
        onSubmit={handleSubmit}
        isPending={createCC.isPending || updateCC.isPending}
      />
    </>
  );
}
