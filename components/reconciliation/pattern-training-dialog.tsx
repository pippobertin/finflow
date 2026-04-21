// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy reconciliation UI, behind LEGACY_RECONCILIATION flag. Will be removed in Block D.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useCreateRecurringExpense } from "@/lib/hooks/use-expenses";
import { ArrowLeft, CalendarClock, TrendingDown } from "lucide-react";

interface PatternTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleDescription: string;
  sampleAmount?: number;
  onSaved: (createdExpense?: boolean) => void;
}

interface TestResult {
  matches: number;
  total: number;
  samples: string[];
}

interface PeriodicityData {
  matchCount: number;
  averageAmount: number;
  detectedFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
  detectedDayOfMonth: number | null;
  customDays: number | null;
  counterpart: string | null;
  startDate: string;
  amounts: number[];
  dates: string[];
  periodsUsed: number;
  periodTotals: number[];
}

const CATEGORIES = [
  { value: "RENT", label: "Affitto" },
  { value: "UTILITIES", label: "Utenze" },
  { value: "SALARIES", label: "Stipendi" },
  { value: "SOFTWARE", label: "Software" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "INSURANCE", label: "Assicurazioni" },
  { value: "TAXES", label: "Tasse" },
  { value: "CONSULTING", label: "Consulenza" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRAVEL", label: "Viaggi" },
  { value: "TRAINING", label: "Formazione" },
  { value: "OTHER", label: "Altro" },
];

const FREQUENCIES = [
  { value: "MONTHLY", label: "Mensile" },
  { value: "QUARTERLY", label: "Trimestrale" },
  { value: "ANNUAL", label: "Annuale" },
  { value: "CUSTOM", label: "Personalizzata" },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateRegexFromSelection(fullText: string, selectedText: string): string {
  const idx = fullText.indexOf(selectedText);
  if (idx === -1) return escapeRegex(selectedText);

  const before = fullText.slice(Math.max(0, idx - 30), idx);
  const after = fullText.slice(idx + selectedText.length, idx + selectedText.length + 30);

  const beforeAnchorMatch = before.match(/(\b\w{2,}[:\s]+)$/);
  const afterAnchorMatch = after.match(/^(\s+\w{2,}\b)/);

  let pattern = "";
  if (beforeAnchorMatch) {
    pattern += escapeRegex(beforeAnchorMatch[1].trim()) + "\\s*";
  }
  pattern += "(.+?)";
  if (afterAnchorMatch) {
    pattern += "\\s+" + escapeRegex(afterAnchorMatch[1].trim());
  } else {
    pattern += "(?:\\s|$)";
  }

  return pattern;
}

function formatEUR(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

export function PatternTrainingDialog({
  open,
  onOpenChange,
  sampleDescription,
  sampleAmount,
  onSaved,
}: PatternTrainingDialogProps) {
  const [patternType, setPatternType] = useState<"counterpart" | "invoiceRef">("counterpart");
  const [selectedText, setSelectedText] = useState("");
  const [generatedRegex, setGeneratedRegex] = useState("");
  const [label, setLabel] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 2 state
  const [step, setStep] = useState<"train" | "expense">("train");
  const [periodicityData, setPeriodicityData] = useState<PeriodicityData | null>(null);
  const [savedPatternIndex, setSavedPatternIndex] = useState<number | null>(null);

  // Expense form fields
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expFrequency, setExpFrequency] = useState<string>("MONTHLY");
  const [expCategory, setExpCategory] = useState<string>("OTHER");
  const [expCounterpart, setExpCounterpart] = useState("");
  const [expStartDate, setExpStartDate] = useState("");
  const [expDayOfMonth, setExpDayOfMonth] = useState("");

  const createExpense = useCreateRecurringExpense();

  function handleTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length < 2) return;

    setSelectedText(text);
    const regex = generateRegexFromSelection(sampleDescription, text);
    setGeneratedRegex(regex);
    setTestResult(null);
  }

  async function handleTest() {
    if (!generatedRegex) return;
    setTesting(true);
    try {
      new RegExp(generatedRegex, "i");

      const res = await fetch("/api/reconciliation/patterns/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regex: generatedRegex, type: patternType }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Errore nel test");
        return;
      }
      const data = await res.json();
      setTestResult(data);
    } catch {
      toast.error("Regex non valida");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!generatedRegex || !label) {
      toast.error("Inserisci un nome per il riconoscimento");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reconciliation/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: patternType === "counterpart" ? "counterpartPatterns" : "invoiceRefPatterns",
          regex: generatedRegex,
          flags: patternType === "counterpart" ? "i" : "gi",
          label,
          sample: selectedText,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Errore nel salvataggio");
        return;
      }
      const data = await res.json();
      toast.success("Pattern salvato");

      // If counterpart pattern + outflow → check periodicity
      if (patternType === "counterpart" && sampleAmount !== undefined && sampleAmount < 0) {
        setSavedPatternIndex((data.patternCount ?? 1) - 1);
        await checkPeriodicity();
      } else {
        onSaved();
      }
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  async function checkPeriodicity() {
    try {
      const res = await fetch("/api/reconciliation/patterns/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regex: generatedRegex,
          flags: "i",
        }),
      });
      if (!res.ok) {
        onSaved();
        return;
      }
      const data: PeriodicityData = await res.json();

      if (data.matchCount >= 2) {
        // Pre-fill expense form
        setPeriodicityData(data);
        setExpName(label);
        setExpAmount(String(data.averageAmount));
        setExpFrequency(data.detectedFrequency);
        setExpCounterpart(data.counterpart ?? "");
        setExpStartDate(data.startDate.split("T")[0]);
        setExpDayOfMonth(data.detectedDayOfMonth?.toString() ?? "");
        setStep("expense");
      } else {
        onSaved();
      }
    } catch {
      onSaved();
    }
  }

  async function handleCreateExpense() {
    if (!expName || !expAmount) {
      toast.error("Nome e importo sono obbligatori");
      return;
    }

    try {
      const result = await createExpense.mutateAsync({
        name: expName,
        amount: parseFloat(expAmount),
        frequency: expFrequency as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM",
        category: expCategory as
          | "RENT"
          | "UTILITIES"
          | "SALARIES"
          | "SOFTWARE"
          | "HARDWARE"
          | "INSURANCE"
          | "TAXES"
          | "CONSULTING"
          | "MARKETING"
          | "TRAVEL"
          | "TRAINING"
          | "OTHER",
        counterpart: expCounterpart || null,
        startDate: new Date(expStartDate),
        dayOfMonth: expDayOfMonth ? parseInt(expDayOfMonth) : null,
        customDays:
          expFrequency === "CUSTOM" && periodicityData?.customDays
            ? periodicityData.customDays
            : null,
        vatIncluded: true,
      });

      // Link the recurringExpenseId to the saved pattern via PATCH
      const expenseId = (result as { id?: string })?.id;
      if (expenseId && savedPatternIndex !== null) {
        await fetch("/api/reconciliation/patterns", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "counterpartPatterns",
            index: savedPatternIndex,
            recurringExpenseId: expenseId,
          }),
        });
      }

      toast.success("Spesa ricorrente creata");
      onSaved(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore nella creazione");
    }
  }

  function handleSkipExpense() {
    onSaved();
  }

  function resetState() {
    setSelectedText("");
    setGeneratedRegex("");
    setLabel("");
    setTestResult(null);
    setStep("train");
    setPeriodicityData(null);
    setSavedPatternIndex(null);
    setExpName("");
    setExpAmount("");
    setExpFrequency("MONTHLY");
    setExpCategory("OTHER");
    setExpCounterpart("");
    setExpStartDate("");
    setExpDayOfMonth("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl">
        {step === "train" ? (
          <>
            <DialogHeader>
              <DialogTitle>Addestra Riconoscimento Automatico</DialogTitle>
              <DialogDescription>
                Seleziona la parte del testo che contiene l&apos;informazione da estrarre
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={patternType}
              onValueChange={(v) => {
                setPatternType(v as "counterpart" | "invoiceRef");
                setSelectedText("");
                setGeneratedRegex("");
                setTestResult(null);
              }}
            >
              <TabsList>
                <TabsTrigger value="counterpart">Identifica Controparte</TabsTrigger>
                <TabsTrigger value="invoiceRef">Estrai N. Fattura</TabsTrigger>
              </TabsList>

              <TabsContent value="counterpart" className="space-y-4">
                <p className="text-muted-foreground text-xs">
                  Insegna al sistema a riconoscere il nome della controparte nelle descrizioni
                  bancarie.
                </p>
                <TrainingContent
                  sampleDescription={sampleDescription}
                  selectedText={selectedText}
                  generatedRegex={generatedRegex}
                  setGeneratedRegex={setGeneratedRegex}
                  label={label}
                  setLabel={setLabel}
                  testResult={testResult}
                  testing={testing}
                  saving={saving}
                  onTextSelection={handleTextSelection}
                  onTest={handleTest}
                  onSave={handleSave}
                  placeholder="es. Formato Intesa DA:"
                />
              </TabsContent>

              <TabsContent value="invoiceRef" className="space-y-4">
                <p className="text-muted-foreground text-xs">
                  Insegna al sistema a estrarre il numero di fattura dalle descrizioni bancarie.
                </p>
                <TrainingContent
                  sampleDescription={sampleDescription}
                  selectedText={selectedText}
                  generatedRegex={generatedRegex}
                  setGeneratedRegex={setGeneratedRegex}
                  label={label}
                  setLabel={setLabel}
                  testResult={testResult}
                  testing={testing}
                  saving={saving}
                  onTextSelection={handleTextSelection}
                  onTest={handleTest}
                  onSave={handleSave}
                  placeholder="es. Formato fattura BPM"
                />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* ── Step 2: Recurring Expense Creation ── */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-emerald-600" />
                Spesa Ricorrente Rilevata
              </DialogTitle>
              <DialogDescription>
                Abbiamo trovato un pattern periodico — vuoi creare una spesa ricorrente?
              </DialogDescription>
            </DialogHeader>

            {/* Summary */}
            {periodicityData && (
              <div className="flex flex-wrap gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {periodicityData.matchCount} movimenti in {periodicityData.periodsUsed} periodi
                  </span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Frequenza:{" "}
                  <span className="font-medium">
                    {FREQUENCIES.find((f) => f.value === periodicityData.detectedFrequency)
                      ?.label ?? periodicityData.detectedFrequency}
                  </span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Totale medio/periodo:{" "}
                  <span className="font-numeric font-medium">
                    {formatEUR(periodicityData.averageAmount)}
                  </span>
                </span>
              </div>
            )}

            {/* Pre-filled form */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Nome spesa</Label>
                <Input value={expName} onChange={(e) => setExpName(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Importo</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="font-numeric"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Frequenza</Label>
                <Select value={expFrequency} onValueChange={(v) => v && setExpFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={expCategory} onValueChange={(v) => v && setExpCategory(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Controparte</Label>
                <Input value={expCounterpart} onChange={(e) => setExpCounterpart(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Data inizio</Label>
                <input
                  type="date"
                  value={expStartDate}
                  onChange={(e) => setExpStartDate(e.target.value)}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-lg border bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:ring-3"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Giorno del mese</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={expDayOfMonth}
                  onChange={(e) => setExpDayOfMonth(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("train")}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Indietro
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSkipExpense}>
                  Salta
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateExpense}
                  disabled={createExpense.isPending || !expName || !expAmount}
                >
                  {createExpense.isPending ? "Creazione..." : "Crea Spesa Ricorrente"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TrainingContent({
  sampleDescription,
  selectedText,
  generatedRegex,
  setGeneratedRegex,
  label,
  setLabel,
  testResult,
  testing,
  saving,
  onTextSelection,
  onTest,
  onSave,
  placeholder,
}: {
  sampleDescription: string;
  selectedText: string;
  generatedRegex: string;
  setGeneratedRegex: (v: string) => void;
  label: string;
  setLabel: (v: string) => void;
  testResult: TestResult | null;
  testing: boolean;
  saving: boolean;
  onTextSelection: () => void;
  onTest: () => void;
  onSave: () => void;
  placeholder: string;
}) {
  return (
    <>
      {/* Sample description — user selects text here */}
      <div>
        <Label className="text-xs text-slate-500">
          Seleziona il testo rilevante nella descrizione:
        </Label>
        <div
          className="mt-1 cursor-text rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-relaxed select-text dark:border-slate-700 dark:bg-slate-800"
          onMouseUp={onTextSelection}
        >
          {sampleDescription || "Nessuna descrizione"}
        </div>
      </div>

      {selectedText && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20">
          <p className="mb-1 text-xs text-slate-500">Testo selezionato:</p>
          <p className="font-mono text-sm font-medium text-indigo-700">{selectedText}</p>
        </div>
      )}

      {/* Generated regex — editable */}
      {generatedRegex && (
        <div className="space-y-2">
          <Label>Pattern Regex (modificabile)</Label>
          <Input
            className="font-mono text-sm"
            value={generatedRegex}
            onChange={(e) => setGeneratedRegex(e.target.value)}
          />
        </div>
      )}

      {/* Label */}
      <div className="space-y-2">
        <Label>Dai un nome a questo riconoscimento</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={placeholder} />
      </div>

      {/* Test results */}
      {testResult && (
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant={testResult.matches > 0 ? "default" : "secondary"}>
              {testResult.matches} / {testResult.total} movimenti
            </Badge>
          </div>
          {testResult.samples.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-slate-500">Esempi di match:</p>
              {testResult.samples.map((s, i) => (
                <p key={i} className="truncate font-mono text-xs">
                  {s}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onTest} disabled={!generatedRegex || testing}>
          {testing ? "Test..." : "Testa Pattern"}
        </Button>
        <Button size="sm" onClick={onSave} disabled={!generatedRegex || !label || saving}>
          {saving ? "Salvataggio..." : "Salva Pattern"}
        </Button>
      </div>
    </>
  );
}
