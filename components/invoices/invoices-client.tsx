"use client";

import { useState, useCallback, useMemo } from "react";
import { FileText, X, Trash2 } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { BulkPaidDialog } from "./bulk-paid-dialog";
import { DataTableSkeleton } from "@/components/dashboard/data-table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Pagination } from "@/components/dashboard/pagination";
import { useInvoices, useBulkUpdateStatus, useBulkDeleteInvoices } from "@/lib/hooks/use-invoices";
import { getStatusOptions } from "@/lib/helpers/invoice-labels";
import { formatEUR } from "@/lib/helpers/format";

const PAGE_SIZE = 50;

export function InvoicesClient() {
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkPaidDialog, setShowBulkPaidDialog] = useState(false);

  const direction = tab === "ACTIVE" ? "ACTIVE" : tab === "PASSIVE" ? "PASSIVE" : undefined;

  const { data, isLoading } = useInvoices({
    direction,
    search: search || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const bulkUpdate = useBulkUpdateStatus();
  const bulkDelete = useBulkDeleteInvoices();

  const invoices = useMemo(() => (data as { data: unknown[] } | undefined)?.data ?? [], [data]);
  const total = (data as { total: number } | undefined)?.total ?? 0;
  const totalPages = (data as { totalPages: number } | undefined)?.totalPages ?? 1;
  const totalGrossAmount =
    (data as { totalGrossAmount: number } | undefined)?.totalGrossAmount ?? 0;

  const statusOpts = useMemo(() => getStatusOptions(direction), [direction]);

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

  function handleStartDateChange(v: string) {
    setStartDate(v);
    setPage(1);
    resetSelection();
  }

  function handleEndDateChange(v: string) {
    setEndDate(v);
    setPage(1);
    resetSelection();
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    resetSelection();
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
    if (bulkStatus === "PAID") {
      setShowBulkPaidDialog(true);
      return;
    }
    bulkUpdate.mutate(
      { invoiceIds: Array.from(selectedIds), status: bulkStatus },
      { onSuccess: () => resetSelection() },
    );
  }

  function handleBulkPaidConfirm(paidAtMap: Record<string, string>) {
    bulkUpdate.mutate(
      { invoiceIds: Array.from(selectedIds), status: "PAID", paidAtMap },
      {
        onSuccess: () => {
          setShowBulkPaidDialog(false);
          resetSelection();
        },
      },
    );
  }

  // Invoices selected for bulk paid dialog
  const selectedInvoicesForDialog = useMemo(
    () =>
      (invoices as Array<{ id: string; number: string }>).filter((inv) => selectedIds.has(inv.id)),
    [invoices, selectedIds],
  );

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
            </TabsList>
          </div>

          <InvoiceFilters
            search={search}
            onSearchChange={handleSearchChange}
            status={statusFilter}
            onStatusChange={handleStatusChange}
            direction={direction}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
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
                  {statusOpts.map((opt) => (
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
              <div className="bg-border mx-1 h-5 w-px" />
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  bulkDelete.mutate(Array.from(selectedIds), {
                    onSuccess: () => resetSelection(),
                  })
                }
                disabled={bulkDelete.isPending}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                {bulkDelete.isPending ? "Eliminazione..." : "Elimina"}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetSelection}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <DataTableSkeleton columns={6} />
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

                {/* Totals row */}
                {(tab === "ACTIVE" || tab === "PASSIVE") && total > 0 && (
                  <div className="bg-muted/30 mt-2 flex items-center justify-between rounded-lg border px-4 py-3">
                    <span className="text-sm font-medium">
                      Totale {total} fattur{total === 1 ? "a" : "e"} filtrat
                      {total === 1 ? "a" : "e"}
                    </span>
                    <span className="font-numeric text-base font-semibold">
                      {formatEUR(totalGrossAmount)}
                    </span>
                  </div>
                )}

                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    itemLabel="fatture"
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showBulkPaidDialog && (
        <BulkPaidDialog
          open={showBulkPaidDialog}
          onOpenChange={setShowBulkPaidDialog}
          invoices={selectedInvoicesForDialog}
          onConfirm={handleBulkPaidConfirm}
          isPending={bulkUpdate.isPending}
          direction={direction}
        />
      )}
    </>
  );
}
