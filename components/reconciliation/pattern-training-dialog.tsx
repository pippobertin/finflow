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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface PatternTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sampleDescription: string;
  onSaved: () => void;
}

interface TestResult {
  matches: number;
  total: number;
  samples: string[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generate a regex pattern from user-selected text and its surrounding context.
 * Uses the text before and after the selection as anchors.
 */
function generateRegexFromSelection(fullText: string, selectedText: string): string {
  const idx = fullText.indexOf(selectedText);
  if (idx === -1) return escapeRegex(selectedText);

  // Find anchor before: last word boundary or known keyword before the selection
  const before = fullText.slice(Math.max(0, idx - 30), idx);
  const after = fullText.slice(idx + selectedText.length, idx + selectedText.length + 30);

  // Try to find a keyword anchor before selection
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

export function PatternTrainingDialog({
  open,
  onOpenChange,
  sampleDescription,
  onSaved,
}: PatternTrainingDialogProps) {
  const [patternType, setPatternType] = useState<"counterpart" | "invoiceRef">("counterpart");
  const [selectedText, setSelectedText] = useState("");
  const [generatedRegex, setGeneratedRegex] = useState("");
  const [label, setLabel] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

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
      // Validate regex before sending
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
      toast.error("Inserisci un nome per il pattern");
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
      toast.success("Pattern salvato");
      onSaved();
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  function resetState() {
    setSelectedText("");
    setGeneratedRegex("");
    setLabel("");
    setTestResult(null);
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
        <DialogHeader>
          <DialogTitle>Addestra Pattern di Riconciliazione</DialogTitle>
          <DialogDescription>
            Seleziona la parte del testo che contiene il nome della controparte o il numero fattura
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={patternType}
          onValueChange={(v) => {
            setPatternType(v as "counterpart" | "invoiceRef");
            resetState();
          }}
        >
          <TabsList>
            <TabsTrigger value="counterpart">Controparte</TabsTrigger>
            <TabsTrigger value="invoiceRef">Numero Fattura</TabsTrigger>
          </TabsList>

          <TabsContent value="counterpart" className="space-y-4">
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
        <Label>Nome Pattern</Label>
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
