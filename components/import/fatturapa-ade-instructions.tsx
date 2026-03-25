"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FatturapaAdeInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FatturapaAdeInstructions({ open, onOpenChange }: FatturapaAdeInstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Come scaricare le fatture dal portale AdE</DialogTitle>
          <DialogDescription>
            Segui questi passaggi per scaricare le fatture dal Cassetto Fiscale
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              1
            </span>
            <span>
              Accedi a <strong>ivaservizi.agenziaentrate.gov.it</strong> con SPID, CIE o CNS
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              2
            </span>
            <span>
              Vai su <strong>&quot;Consultazione&quot;</strong> &rarr;{" "}
              <strong>&quot;Dati rilevanti ai fini IVA&quot;</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              3
            </span>
            <span>Seleziona il periodo desiderato (trimestre o anno)</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              4
            </span>
            <span>
              Scegli <strong>&quot;Fatture Emesse&quot;</strong> o{" "}
              <strong>&quot;Fatture Ricevute&quot;</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              5
            </span>
            <span>
              Clicca <strong>&quot;Scarica archivio&quot;</strong> per ottenere il file ZIP
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-primary text-primary-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              6
            </span>
            <span>Carica il file ZIP scaricato in FinFlow</span>
          </li>
        </ol>
        <p className="text-muted-foreground mt-2 text-xs">
          Sono supportati file XML singoli, file P7M (firmati digitalmente) e archivi ZIP contenenti
          più fatture.
        </p>
      </DialogContent>
    </Dialog>
  );
}
