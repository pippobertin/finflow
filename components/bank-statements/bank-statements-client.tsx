"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Landmark, Trash2, FileText, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/dashboard/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BankStatementTable } from "./bank-statement-table";
import { Pagination } from "@/components/dashboard/pagination";
import { DataTableSkeleton } from "@/components/dashboard/data-table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  useBankStatements,
  useBankStatementUploads,
  useDeleteBankStatementUpload,
} from "@/lib/hooks/use-bank-statements";
import {
  useReconciliationData,
  useConfirmMatch,
  useDismissMatch,
  useIgnoreMovement,
  useConfirmExpenseGroup,
  useUnreconcile,
} from "@/lib/hooks/use-reconciliation";
import type { Suggestion } from "@/lib/hooks/use-reconciliation";
import { ExpenseMatchGroup } from "@/components/reconciliation/expense-match-group";
import { ManualMatch } from "@/components/reconciliation/manual-match";
import { PatternTrainingDialog } from "@/components/reconciliation/pattern-training-dialog";
import { formatDateShort } from "@/lib/helpers/format";

const PAGE_SIZE = 50;

interface SimpleMovement {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export function BankStatementsClient() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("MOVEMENTS");
  const [reconciliationFilter, setReconciliationFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Manual match dialog state
  const [manualMatchOpen, setManualMatchOpen] = useState(false);
  const [manualMatchMovement, setManualMatchMovement] = useState<SimpleMovement | null>(null);

  // Pattern training dialog state
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [trainingMovement, setTrainingMovement] = useState<SimpleMovement | null>(null);

  const isReconciled =
    reconciliationFilter === "RECONCILED"
      ? true
      : reconciliationFilter === "UNRECONCILED"
        ? false
        : undefined;

  const { data, isLoading } = useBankStatements({
    isReconciled,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: uploads } = useBankStatementUploads();
  const deleteUpload = useDeleteBankStatementUpload();

  // Reconciliation data
  const {
    suggestionMap,
    expenseGroups,
    invoiceSuggestions,
    unmatchedInvoices,
    isLoading: reconciliationLoading,
    refetch: refetchReconciliation,
  } = useReconciliationData();

  // Mutations
  const confirmMatch = useConfirmMatch();
  const dismissMatch = useDismissMatch();
  const ignoreMovement = useIgnoreMovement();
  const unreconcile = useUnreconcile();
  const confirmGroup = useConfirmExpenseGroup();

  const statements = (data as { data: unknown[] } | undefined)?.data ?? [];
  const total = (data as { total: number } | undefined)?.total ?? 0;
  const totalPages = (data as { totalPages: number } | undefined)?.totalPages ?? 1;

  const unreconciledCount = suggestionMap?.size ?? 0;
  const suggestionCount =
    invoiceSuggestions.length + expenseGroups.reduce((s, g) => s + g.suggestions.length, 0);

  function handleFilterChange(v: string) {
    setReconciliationFilter(v);
    setPage(1);
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleAcceptSuggestion(s: Suggestion) {
    confirmMatch.mutate([s]);
  }

  function handleRejectSuggestion(s: Suggestion) {
    dismissMatch.mutate([s]);
  }

  function handleManualMatch(movement: SimpleMovement) {
    setManualMatchMovement(movement);
    setManualMatchOpen(true);
  }

  function handleIgnore(id: string) {
    ignoreMovement.mutate(id);
  }

  function handleUnreconcile(id: string) {
    unreconcile.mutate(id);
  }

  function handleTrain(movement: SimpleMovement) {
    setTrainingMovement(movement);
    setTrainingOpen(true);
  }

  function handleAcceptGroup(groupId: string) {
    const group = expenseGroups.find((g) => g.recurringExpenseId === groupId);
    if (group) confirmGroup.mutate(group);
  }

  function handleRejectGroup(groupId: string) {
    const group = expenseGroups.find((g) => g.recurringExpenseId === groupId);
    if (group) dismissMatch.mutate(group.suggestions);
  }

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        {/* Sticky header: navbar + tabs + summary + filters */}
        <div className="bg-background sticky top-0 z-10 border-b">
          <Navbar title="Estratti Conto" />
          <div className="space-y-3 px-6 pb-4">
            <TabsList>
              <TabsTrigger value="MOVEMENTS">Movimenti</TabsTrigger>
              <TabsTrigger value="UPLOADS">File caricati</TabsTrigger>
            </TabsList>

            {tab === "MOVEMENTS" && (
              <>
                {/* Summary bar */}
                {suggestionCount > 0 && (
                  <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-2.5 dark:border-indigo-800 dark:bg-indigo-900/20">
                    <span className="text-sm text-indigo-700 dark:text-indigo-300">
                      <span className="font-numeric font-bold">{unreconciledCount}</span>{" "}
                      suggerimenti disponibili
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-numeric font-medium">{expenseGroups.length}</span>{" "}
                      gruppi spese
                    </span>
                    <div className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => refetchReconciliation()}
                      disabled={reconciliationLoading}
                    >
                      <RefreshCw
                        className={`mr-1.5 h-3 w-3 ${reconciliationLoading ? "animate-spin" : ""}`}
                      />
                      Aggiorna suggerimenti
                    </Button>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    placeholder="Cerca per descrizione, riferimento..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-72"
                  />
                  <Select
                    value={reconciliationFilter}
                    onValueChange={(v) => v && handleFilterChange(v)}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Stato riconciliazione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tutti</SelectItem>
                      <SelectItem value="RECONCILED">Riconciliati</SelectItem>
                      <SelectItem value="UNRECONCILED">Non riconciliati</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Dal</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-36 rounded-lg border bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3"
                    />
                    <span className="text-xs text-slate-500">al</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-36 rounded-lg border bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-3"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="space-y-4 p-6">
          {/* Movements tab */}
          <TabsContent value="MOVEMENTS" className="mt-0 space-y-4">
            {/* Expense Groups — accordion above table */}
            {expenseGroups.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Suggerimenti Spese Ricorrenti (
                  {expenseGroups.reduce((s, g) => s + g.suggestions.length, 0)})
                </h4>
                {expenseGroups.map((group) => (
                  <ExpenseMatchGroup
                    key={group.recurringExpenseId}
                    expenseName={group.expenseName}
                    suggestions={group.suggestions}
                    onAcceptGroup={() => handleAcceptGroup(group.recurringExpenseId)}
                    onRejectGroup={() => handleRejectGroup(group.recurringExpenseId)}
                    onAcceptSingle={(s) => handleAcceptSuggestion(s)}
                    onRejectSingle={(s) => handleRejectSuggestion(s)}
                  />
                ))}
              </section>
            )}

            {isLoading ? (
              <DataTableSkeleton columns={9} rows={8} />
            ) : statements.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="Nessun movimento"
                description="Non ci sono movimenti bancari che corrispondono ai filtri selezionati."
              />
            ) : (
              <>
                <BankStatementTable
                  statements={statements as never[]}
                  suggestionMap={suggestionMap}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onRejectSuggestion={handleRejectSuggestion}
                  onManualMatch={handleManualMatch}
                  onIgnore={handleIgnore}
                  onTrain={handleTrain}
                  onUnreconcile={handleUnreconcile}
                />

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

          {/* Uploads tab */}
          <TabsContent value="UPLOADS" className="mt-0">
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
        </div>
      </Tabs>

      {/* Dialogs */}
      <ManualMatch
        open={manualMatchOpen}
        onOpenChange={setManualMatchOpen}
        movement={manualMatchMovement}
        invoices={unmatchedInvoices}
        onMatched={() => {
          refetchReconciliation();
          queryClient.invalidateQueries({ queryKey: ["bank-statements"] });
        }}
      />

      <PatternTrainingDialog
        open={trainingOpen}
        onOpenChange={setTrainingOpen}
        sampleDescription={trainingMovement?.description ?? ""}
        sampleAmount={trainingMovement?.amount}
        onSaved={(createdExpense) => {
          setTrainingOpen(false);
          refetchReconciliation();
          queryClient.invalidateQueries({ queryKey: ["bank-statements"] });
          if (createdExpense) {
            queryClient.invalidateQueries({ queryKey: ["expenses", "recurring"] });
            queryClient.invalidateQueries({ queryKey: ["cashflow-projection"] });
          }
        }}
      />
    </>
  );
}
