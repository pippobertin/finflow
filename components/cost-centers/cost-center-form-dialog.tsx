"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeywordInput } from "./keyword-input";
import { costCenterCreateSchema, type CostCenterCreateInput } from "@/lib/validations/cost-center";

interface CostCenterFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CostCenterCreateInput & { id: string }>;
  onSubmit: (data: CostCenterCreateInput) => void;
  isPending?: boolean;
}

const PRESET_COLORS = [
  "#6B7280",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];

export function CostCenterFormDialog({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isPending,
}: CostCenterFormDialogProps) {
  const isEdit = !!defaultValues?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CostCenterCreateInput>({
    resolver: zodResolver(costCenterCreateSchema) as never,
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "COST",
      color: defaultValues?.color ?? "#6B7280",
      keywords: defaultValues?.keywords ?? [],
      description: defaultValues?.description ?? "",
    },
  });

  const keywords = watch("keywords") ?? [];
  const color = watch("color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica" : "Nuovo"} Centro di Costo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cc-name">Nome</Label>
            <Input id="cc-name" {...register("name")} placeholder="Nome del centro" />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) => v && setValue("type", v as "COST" | "REVENUE")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COST">Costo</SelectItem>
                  <SelectItem value="REVENUE">Ricavo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Colore</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setValue("color", c)}
                  />
                ))}
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => setValue("color", e.target.value)}
                  className="h-6 w-6 cursor-pointer border-none p-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keywords (per auto-classificazione)</Label>
            <KeywordInput value={keywords} onChange={(kw) => setValue("keywords", kw)} />
            <p className="text-muted-foreground text-xs">Premi Invio o virgola per aggiungere</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-desc">Descrizione</Label>
            <Textarea
              id="cc-desc"
              {...register("description")}
              placeholder="Descrizione opzionale"
              rows={2}
            />
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
