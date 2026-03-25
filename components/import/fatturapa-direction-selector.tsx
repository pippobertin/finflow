"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FatturapaAdeInstructions } from "./fatturapa-ade-instructions";

interface FatturapaDirectionSelectorProps {
  onSelect: (direction: "ACTIVE" | "PASSIVE") => void;
}

export function FatturapaDirectionSelector({ onSelect }: FatturapaDirectionSelectorProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Seleziona il tipo di fatture che stai importando. Puoi scaricarle dal portale{" "}
        <button
          type="button"
          className="text-primary underline"
          onClick={() => setShowInstructions(true)}
        >
          Fatture e Corrispettivi dell&apos;Agenzia delle Entrate
        </button>
        .
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <button type="button" className="text-left" onClick={() => onSelect("PASSIVE")}>
          <Card
            className={cn("hover:border-primary cursor-pointer transition-all hover:shadow-md")}
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <ArrowDownLeft className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Fatture Ricevute (Passive)</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Fatture da fornitori — acquisti, spese, servizi ricevuti
                </p>
              </div>
            </CardContent>
          </Card>
        </button>

        <button type="button" className="text-left" onClick={() => onSelect("ACTIVE")}>
          <Card
            className={cn("hover:border-primary cursor-pointer transition-all hover:shadow-md")}
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Fatture Emesse (Attive)</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Fatture emesse da te — vendite, prestazioni, servizi erogati
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <FatturapaAdeInstructions open={showInstructions} onOpenChange={setShowInstructions} />
    </div>
  );
}
