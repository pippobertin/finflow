"use client";

import { useState, useCallback, useMemo } from "react";
import { Tags, FileText, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceFilters } from "./invoice-filters";
import { InvoiceTable } from "./invoice-table";
import { DataTableSkeleton } from "@/components/dashboard/data-table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { useInvoices, useAutoTag, useBulkUpdateStatus } from "@/lib/hooks/use-invoices";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const statusOptions = [
  { value: "PAID", label: "Pagata" },
  { value: "PENDING", label: "In attesa" },
  { value: "OVERDUE", label: "Scaduta" },
  { value: "DRAFT", label: "Bozza" },
];

export function InvoicesClient() {
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");

  const direction = tab === "ACTIVE" ? "ACTIVE" : tab === "PASSIVE" ? "PASSIVE" : undefined;
  const needsTagging = tab === "UNTAGGED" ? true : undefined;

  const { data, isLoading } = useInvoices({
    direction,
    needsTagging,
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const autoTag = useAutoTag();
  const bulkUpdate = useBulkUpdateStatus();

  const invoices = useMemo(() => (data as { data: unknown[] } | undefined)?.data ?? [], [data]);
  const total = (data as { total: number } | undefined)?.total ?? 0;
  const totalPages = (data as { totalPages: number } | undefined)?.totalPages ?? 1;
  const untaggedCount = tab === "UNTAGGED" ? total : undefined;

  function resetSelection() {
    setSelectedIds(new Set());
    setBulkStatus("");
  }

  function handleTabChange(v: string) {
    setTab(v ?? "ALL");
    setPage(1);
    resetSelection();
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
    resetSelection();
  }

  function handleStatusChange(v: string) {
    setStatusFilter(v);
    setPage(1);
    resetSelection();
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    resetSelection();
  }

  function handleAutoTag() {
    autoTag.mutate(undefined, {
      onSuccess: (data) => {
        const result = data as { tagged: number; untagged: number };
        toast.success(
          `Classificate ${result.tagged} fatture, ${result.untagged} ancora da classificare`,
        );
      },
      onError: (err) => toast.error(err.message),
    });
  }

  const handleSelectionChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const ids = (invoices as Array<{ id: string }>).map((inv) => inv.id);
        setSelectedIds(new Set(ids));
      } else {
        setSelectedIds(new Set());
      }
    },
    [invoices],
  );

  function handleBulkUpdate() {
    if (!bulkStatus || selectedIds.size === 0) return;
    bulkUpdate.mutate(
      { invoiceIds: Array.from(selectedIds), status: bulkStatus },
      { onSuccess: () => resetSelection() },
    );
  }

  return (
    <>
      <Navbar title="Fatture" />
      <div className="space-y-4 p-6">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="ALL">Tutte</TabsTrigger>
              <TabsTrigger value="ACTIVE">Attive</TabsTrigger>
              <TabsTrigger value="PASSIVE">Passive</TabsTrigger>
              <TabsTrigger value="UNTAGGED" className="gap-1.5">
                Da Classificare
                {untaggedCount !== undefined && untaggedCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-[10px]">
                    {untaggedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {tab === "UNTAGGED" && (
              <Button size="sm" onClick={handleAutoTag} disabled={autoTag.isPending}>
                <Tags className="mr-2 h-4 w-4" />
                {autoTag.isPending ? "Classificazione..." : "Auto-classifica tutto"}
              </Button>
            )}
          </div>

          <InvoiceFilters
            search={search}
            onSearchChange={handleSearchChange}
            status={statusFilter}
            onStatusChange={handleStatusChange}
          />

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-2">
              <span className="text-sm font-medium">
                {selectedIds.size} fattur{selectedIds.size === 1 ? "a" : "e"} selezionat
                {selectedIds.size === 1 ? "a" : "e"}
              </span>
              <Select value={bulkStatus} onValueChange={(v) => v && setBulkStatus(v)}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Nuovo stato..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleBulkUpdate}
                disabled={!bulkStatus || bulkUpdate.isPending}
              >
                {bulkUpdate.isPending ? "Aggiornamento..." : "Aggiorna stato"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <DataTableSkeleton columns={7} />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nessuna fattura"
                description="Non ci sono fatture che corrispondono ai filtri selezionati."
              />
            ) : (
              <>
                <InvoiceTable
                  invoices={invoices as never[]}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  onSelectAll={handleSelectAll}
                />

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <p className="text-muted-foreground text-sm">
                      {total} fatture — pagina {page} di {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Precedente
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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
