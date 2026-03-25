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

const STATUSES = [
  { value: "PENDING", label: "Da fatturare" },
  { value: "INVOICED", label: "Fatturato" },
  { value: "CANCELLED", label: "Annullato" },
];

interface ReceivableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending?: boolean;
}

export function ReceivableFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
}: ReceivableFormDialogProps) {
  const { data: costCenters = [] } = useCostCenters();
  const ccItems = costCenters as Array<{ id: string; name: string; color: string }>;

  const isEdit = !!defaultValues?.id;

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      description: "",
      counterpart: "",
      estimatedAmount: "",
      expectedInvoiceDate: "",
      expectedPaymentDate: "",
      costCenterId: "",
      notes: "",
      includeInForecast: true,
      status: "PENDING",
      ...defaultValues,
    } as Record<string, unknown>,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica" : "Nuovo"} Incasso Futuro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              {...register("description", { required: "Obbligatorio" })}
              placeholder="Progetto XYZ"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="counterpart">Cliente</Label>
              <Input
                id="counterpart"
                {...register("counterpart", { required: "Obbligatorio" })}
                placeholder="Nome cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedAmount">Importo stimato</Label>
              <Input
                id="estimatedAmount"
                type="number"
                step="0.01"
                {...register("estimatedAmount", { required: "Obbligatorio" })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expectedInvoiceDate">Data fattura prevista</Label>
              <Input id="expectedInvoiceDate" type="date" {...register("expectedInvoiceDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedPaymentDate">Data incasso prevista</Label>
              <Input id="expectedPaymentDate" type="date" {...register("expectedPaymentDate")} />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Almeno una delle due date è obbligatoria. Se non c&apos;è fattura (es. contributi,
            bandi), compila solo la data incasso.
          </p>

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
