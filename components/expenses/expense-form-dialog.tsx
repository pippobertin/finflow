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

/** Convert ISO date string or Date to yyyy-MM-dd for HTML date input */
function toDateInput(value: unknown): string {
  if (!value) return "";
  const s = String(value);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "recurring" | "one-off";
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending?: boolean;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  type,
  defaultValues,
  onSubmit,
  isPending,
}: ExpenseFormDialogProps) {
  const { data: costCenters = [] } = useCostCenters("COST");
  const ccItems = costCenters as Array<{ id: string; name: string; color: string }>;

  const isEdit = !!defaultValues?.id;

  // Prepare defaults with properly formatted dates and nulls → ""
  const prepared = defaultValues
    ? {
        name: defaultValues.name ?? "",
        category: defaultValues.category ?? "OTHER",
        amount: defaultValues.amount ?? "",
        vatIncluded: defaultValues.vatIncluded ?? true,
        costCenterId:
          (defaultValues.costCenter as { id: string } | null)?.id ??
          defaultValues.costCenterId ??
          "",
        description: defaultValues.description ?? "",
        counterpart: defaultValues.counterpart ?? "",
        ...(type === "recurring"
          ? {
              frequency: defaultValues.frequency ?? "MONTHLY",
              startDate: toDateInput(defaultValues.startDate),
              endDate: toDateInput(defaultValues.endDate),
            }
          : {
              date: toDateInput(defaultValues.date),
              isPaid: defaultValues.isPaid ?? false,
            }),
      }
    : {
        name: "",
        category: "OTHER",
        amount: "",
        vatIncluded: true,
        costCenterId: "",
        description: "",
        counterpart: "",
        ...(type === "recurring"
          ? { frequency: "MONTHLY", startDate: "", endDate: "" }
          : { date: "", isPaid: false }),
      };

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: prepared as Record<string, unknown>,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifica" : "Nuova"} Spesa{" "}
            {type === "recurring" ? "Ricorrente" : "Una Tantum"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register("name", { required: "Obbligatorio" })}
              placeholder="Nome della spesa"
            />
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
              <Label htmlFor="amount">Importo</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { required: "Obbligatorio" })}
                placeholder="0,00"
              />
            </div>
          </div>

          {type === "recurring" && (
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
                <Label htmlFor="startDate">Data Inizio</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate", { required: "Obbligatorio" })}
                />
              </div>
            </div>
          )}

          {type === "recurring" && (
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fine (opzionale)</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          )}

          {type === "one-off" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" type="date" {...register("date", { required: "Obbligatorio" })} />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={watch("isPaid") as boolean}
                    onCheckedChange={(v) => setValue("isPaid", !!v)}
                  />
                  Pagata
                </label>
              </div>
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
            <Label htmlFor="counterpart">Controparte</Label>
            <Input id="counterpart" {...register("counterpart")} placeholder="Fornitore" />
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
