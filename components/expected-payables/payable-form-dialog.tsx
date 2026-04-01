"use client";

import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";

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

const STATUSES = [
  { value: "ACTIVE", label: "Attivo" },
  { value: "EXHAUSTED", label: "Esaurito" },
  { value: "CANCELLED", label: "Annullato" },
];

function toDateInput(value: unknown): string {
  if (!value) return "";
  const s = String(value);
  if (s.length >= 10) return s.slice(0, 10);
  return "";
}

interface PayableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending?: boolean;
}

export function PayableFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
}: PayableFormDialogProps) {
  const { data: costCenters = [] } = useCostCenters();
  const ccItems = costCenters as Array<{ id: string; name: string; color: string }>;

  const isEdit = !!defaultValues?.id;

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      description: "",
      counterpart: "",
      amount: "",
      frequency: "MONTHLY",
      dayOfMonth: "",
      startDate: "",
      endDate: "",
      costCenterId: "",
      category: "CONSULTING",
      notes: "",
      includeInForecast: true,
      status: "ACTIVE",
      ...(defaultValues
        ? {
            ...defaultValues,
            amount: defaultValues.amount != null ? String(defaultValues.amount) : "",
            dayOfMonth: defaultValues.dayOfMonth != null ? String(defaultValues.dayOfMonth) : "",
            startDate: toDateInput(defaultValues.startDate),
            endDate: toDateInput(defaultValues.endDate),
          }
        : {}),
    } as Record<string, unknown>,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica" : "Nuova"} Fattura Passiva Attesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              {...register("description", { required: "Obbligatorio" })}
              placeholder="es. Collaboratore Mario Rossi"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="counterpart">Controparte</Label>
              <Input
                id="counterpart"
                {...register("counterpart", { required: "Obbligatorio" })}
                placeholder="Nome come appare nell'EC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Importo fattura (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { required: "Obbligatorio" })}
                placeholder="2000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Frequenza</Label>
              <Select
                value={watch("frequency") as string}
                onValueChange={(v) => v && setValue("frequency", v)}
              >
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
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Giorno del mese</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min={1}
                max={31}
                {...register("dayOfMonth")}
                placeholder="es. 15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data inizio</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate", { required: "Obbligatorio" })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data fine</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={watch("category") as string}
                onValueChange={(v) => v && setValue("category", v)}
              >
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
            <div className="space-y-2">
              <Label>Centro di Costo</Label>
              <Select
                value={watch("costCenterId") as string}
                onValueChange={(v) => v && setValue("costCenterId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {ccItems.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: cc.color }}
                        />
                        {cc.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label>Stato</Label>
              <Select
                value={watch("status") as string}
                onValueChange={(v) => v && setValue("status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Note aggiuntive..." rows={2} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="includeInForecast"
              checked={watch("includeInForecast") as boolean}
              onCheckedChange={(v) => setValue("includeInForecast", !!v)}
            />
            <Label htmlFor="includeInForecast" className="cursor-pointer">
              Includi nelle previsioni cashflow
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : isEdit ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
