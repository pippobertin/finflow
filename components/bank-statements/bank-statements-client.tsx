"use client";

import { useState } from "react";
import { Landmark, Trash2, FileText } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BankStatementTable } from "./bank-statement-table";
import { Pagination } from "@/components/dashboard/pagination";
import { DataTableSkeleton } from "@/components/dashboard/data-table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  useBankStatements,
  useBankStatementUploads,
  useDeleteBankStatementUpload,
} from "@/lib/hooks/use-bank-statements";
import { formatDateShort } from "@/lib/helpers/format";

const PAGE_SIZE = 50;

export function BankStatementsClient() {
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const isReconciled = tab === "RECONCILED" ? true : tab === "UNRECONCILED" ? false : undefined;

  const { data, isLoading } = useBankStatements({
    isReconciled,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: uploads } = useBankStatementUploads();
  const deleteUpload = useDeleteBankStatementUpload();

  const statements = (data as { data: unknown[] } | undefined)?.data ?? [];
  const total = (data as { total: number } | undefined)?.total ?? 0;
  const totalPages = (data as { totalPages: number } | undefined)?.totalPages ?? 1;

  function handleTabChange(v: string) {
    setTab(v ?? "ALL");
    setPage(1);
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <>
      <Navbar title="Estratti Conto" />
      <div className="space-y-4 p-6">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="ALL">Tutti</TabsTrigger>
            <TabsTrigger value="RECONCILED">Riconciliati</TabsTrigger>
            <TabsTrigger value="UNRECONCILED">Non riconciliati</TabsTrigger>
            <TabsTrigger value="UPLOADS">Documenti caricati</TabsTrigger>
          </TabsList>

          {tab !== "UPLOADS" && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Input
                placeholder="Cerca per descrizione, riferimento..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-72"
              />
            </div>
          )}

          {/* Movements tabs */}
          {tab !== "UPLOADS" && (
            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <DataTableSkeleton columns={8} rows={8} />
              ) : statements.length === 0 ? (
                <EmptyState
                  icon={Landmark}
                  title="Nessun movimento"
                  description="Non ci sono movimenti bancari che corrispondono ai filtri selezionati."
                />
              ) : (
                <>
                  <BankStatementTable statements={statements as never[]} />

                  {totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      total={total}
                      itemLabel="movimenti"
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </TabsContent>
          )}

          {/* Uploads tab */}
          <TabsContent value="UPLOADS" className="mt-4">
            {!uploads || uploads.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nessun documento caricato"
                description="Importa un estratto conto dalla sezione Import per visualizzarlo qui."
              />
            ) : (
              <div className="space-y-3">
                {uploads.map((upload, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <FileText className="text-muted-foreground h-8 w-8" />
                        <div>
                          <p className="font-medium">
                            {upload.sourceFile ?? "Import senza nome file"}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            Periodo: {formatDateShort(upload.periodFrom)} —{" "}
                            {formatDateShort(upload.periodTo)}
                            {" · "}
                            {upload.count} moviment{upload.count === 1 ? "o" : "i"}
                            {" · "}Importato il {formatDateShort(upload.importedAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUpload.mutate(upload.sourceFile)}
                        disabled={deleteUpload.isPending}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Elimina
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
