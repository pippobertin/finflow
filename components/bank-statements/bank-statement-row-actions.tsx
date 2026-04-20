"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown, ChevronUp, Link2, EyeOff, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/lib/hooks/use-reconciliation";

interface BankStatementRowActionsProps {
  suggestion?: Suggestion;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onManualMatch: () => void;
  onIgnore: () => void;
  onTrain: () => void;
}

export function BankStatementRowActions({
  suggestion,
  isExpanded,
  onToggleExpand,
  onAccept,
  onReject,
  onManualMatch,
  onIgnore,
  onTrain,
}: BankStatementRowActionsProps) {
  if (suggestion) {
    const confidenceColor =
      suggestion.confidence >= 70
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : suggestion.confidence >= 40
          ? "text-amber-700 bg-amber-50 border-amber-200"
          : "text-red-700 bg-red-50 border-red-200";

    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", confidenceColor)}>
          {suggestion.confidence}%
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleExpand}
          title="Dettaglio suggerimento"
        >
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          onClick={onAccept}
          title="Accetta suggerimento"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={onReject}
          title="Rifiuta suggerimento"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onManualMatch}
        title="Match manuale"
      >
        <Link2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onTrain}
        title="Addestra pattern"
      >
        <GraduationCap className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-slate-400 hover:text-slate-600"
        onClick={onIgnore}
        title="Ignora movimento"
      >
        <EyeOff className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
