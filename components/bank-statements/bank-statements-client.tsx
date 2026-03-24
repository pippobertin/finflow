"use client";

import { useState } from "react";
import { Landmark, ChevronLeft, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BankStatementTable } from "./bank-statement-table";
import { DataTableSkeleton } from "@/components/dashboard/data-table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useBankStatements } from "@/lib/hooks/use-bank-statements";

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
          </TabsList>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Cerca per descrizione, riferimento..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-72"
            />
          </div>

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
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <p className="text-muted-foreground text-sm">
                      {total} movimenti — pagina {page} di {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Precedente
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Successiva
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
