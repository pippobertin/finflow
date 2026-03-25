"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/dashboard/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ConnectorFormDialog } from "./connector-form-dialog";
import {
  useConnectors,
  useCreateConnector,
  useUpdateConnector,
  useDeleteConnector,
  useTestConnection,
  useSyncConnector,
} from "@/lib/hooks/use-connectors";
import type { ConnectorCreateInput, ConnectorUpdateInput } from "@/lib/validations/connector";
import { Plug, Plus, RefreshCw, Zap, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ConnectorItem {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  lastSyncAt: string | null;
  syncFromDate: string | null;
  syncToDate: string | null;
  companyId: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  FATTURE_IN_CLOUD: "Fatture in Cloud",
  CSV_IMPORT: "Import CSV",
  MANUAL: "Manuale",
};

export function ConnectorsClient() {
  const { data: session } = useSession();
  const isViewer = session?.user?.role === "VIEWER";
  const { data: connectors, isLoading } = useConnectors();
  const createConnector = useCreateConnector();
  const updateConnector = useUpdateConnector();
  const deleteConnector = useDeleteConnector();
  const testConnection = useTestConnection();
  const syncConnector = useSyncConnector();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [editDefaults, setEditDefaults] = useState<Partial<ConnectorCreateInput>>();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  function handleSubmit(data: ConnectorCreateInput | ConnectorUpdateInput) {
    if (editingId) {
      updateConnector.mutate(
        { id: editingId, data: { name: data.name, config: data.config } },
        {
          onSuccess: () => {
            toast.success("Connettore aggiornato");
            setDialogOpen(false);
            setEditingId(undefined);
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createConnector.mutate(data as ConnectorCreateInput, {
        onSuccess: () => {
          toast.success("Connettore creato");
          setDialogOpen(false);
        },
        onError: (err) => toast.error(err.message),
      });
    }
  }

  function handleEdit(conn: ConnectorItem) {
    setEditingId(conn.id);
    setEditDefaults({
      name: conn.name,
      type: conn.type as ConnectorCreateInput["type"],
      config: {
        accessToken: "",
        companyId: conn.companyId ?? "",
        syncFromDate: conn.syncFromDate ?? undefined,
        syncToDate: conn.syncToDate ?? undefined,
      },
    });
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Sei sicuro di voler eliminare questo connettore?")) return;
    deleteConnector.mutate(id, {
      onSuccess: () => toast.success("Connettore eliminato"),
      onError: (err) => toast.error(err.message),
    });
  }

  function handleTest(id: string) {
    setTestingId(id);
    testConnection.mutate(id, {
      onSuccess: (res) => {
        if (res.success) toast.success(res.message);
        else toast.error(res.message);
      },
      onError: (err) => toast.error(err.message),
      onSettled: () => setTestingId(null),
    });
  }

  function handleSync(id: string) {
    setSyncingId(id);
    syncConnector.mutate(id, {
      onSuccess: (res) => {
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        const lines = res.message.split("\n");
        toast.success(lines[0]);
        for (let i = 1; i < lines.length; i++) {
          toast.warning(lines[i], { duration: 8000 });
        }
      },
      onError: (err) => toast.error(err.message),
      onSettled: () => setSyncingId(null),
    });
  }

  function openCreate() {
    setEditingId(undefined);
    setEditDefaults(undefined);
    setDialogOpen(true);
  }

  const items = (connectors ?? []) as ConnectorItem[];

  return (
    <>
      <Navbar title="Connettori" />
      <div className="space-y-6 p-6">
        {!isViewer && (
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi Connettore
            </Button>
          </div>
        )}

        {isLoading ? null : items.length === 0 ? (
          <EmptyState
            icon={Plug}
            title="Nessun connettore"
            description="Aggiungi un connettore per sincronizzare i dati"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((conn) => (
              <Card key={conn.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{conn.name}</CardTitle>
                    <Badge
                      variant={conn.isActive ? "default" : "secondary"}
                      className={
                        conn.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {conn.isActive ? "Attivo" : "Inattivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground text-sm">
                    {TYPE_LABELS[conn.type] ?? conn.type}
                  </p>
                  {(conn.syncFromDate || conn.syncToDate) && (
                    <p className="text-muted-foreground text-xs">
                      Periodo:{" "}
                      {conn.syncFromDate
                        ? new Date(conn.syncFromDate + "T00:00:00").toLocaleDateString("it-IT")
                        : "—"}
                      {" → "}
                      {conn.syncToDate
                        ? new Date(conn.syncToDate + "T00:00:00").toLocaleDateString("it-IT")
                        : "oggi"}
                    </p>
                  )}
                  {conn.lastSyncAt && (
                    <p className="text-muted-foreground text-xs">
                      Ultimo sync: {new Date(conn.lastSyncAt).toLocaleString("it-IT")}
                    </p>
                  )}

                  {!isViewer && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {conn.type === "FATTURE_IN_CLOUD" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTest(conn.id)}
                            disabled={testingId !== null || syncingId !== null}
                          >
                            {testingId === conn.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="mr-1 h-3 w-3" />
                            )}
                            {testingId === conn.id ? "Test in corso..." : "Testa"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSync(conn.id)}
                            disabled={syncingId !== null || testingId !== null}
                          >
                            {syncingId === conn.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-1 h-3 w-3" />
                            )}
                            {syncingId === conn.id ? "Sincronizzazione..." : "Sincronizza"}
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleEdit(conn)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Modifica
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(conn.id)}
                        disabled={deleteConnector.isPending}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Elimina
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConnectorFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(undefined);
            setEditDefaults(undefined);
          }
        }}
        editId={editingId}
        defaultValues={editDefaults}
        onSubmit={handleSubmit}
        isPending={createConnector.isPending || updateConnector.isPending}
      />
    </>
  );
}
