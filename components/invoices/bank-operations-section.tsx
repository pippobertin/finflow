"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useUpdateInvoice } from "@/lib/hooks/use-invoices";
import { toast } from "sonner";

interface BankOperationsSectionProps {
  invoiceId: string;
  isDiscountedAtBank: boolean;
  bankDiscountType: string | null;
  bankLiquidationDate: string | null;
  bankDiscountFee: number | null;
}

const DISCOUNT_TYPES = [
  { value: "invoice_advance", label: "Anticipo fatture" },
  { value: "order_advance", label: "Anticipo ordini" },
  { value: "salvo_buon_fine", label: "Salvo buon fine" },
];

export function BankOperationsSection({
  invoiceId,
  isDiscountedAtBank,
  bankDiscountType,
  bankLiquidationDate,
  bankDiscountFee,
}: BankOperationsSectionProps) {
  const updateInvoice = useUpdateInvoice();
  const [isDiscounted, setIsDiscounted] = useState(isDiscountedAtBank);
  const [discountType, setDiscountType] = useState(bankDiscountType ?? "");
  const [liquidationDate, setLiquidationDate] = useState(bankLiquidationDate ?? "");
  const [fee, setFee] = useState(bankDiscountFee?.toString() ?? "");

  function handleToggle(checked: boolean) {
    setIsDiscounted(checked);
    updateInvoice.mutate(
      {
        invoiceId,
        isDiscountedAtBank: checked,
        bankDiscountType: checked ? discountType || null : null,
        bankLiquidationDate: checked && liquidationDate ? liquidationDate : null,
        bankDiscountFee: checked && fee ? parseFloat(fee) : null,
      },
      {
        onSuccess: () =>
          toast.success(checked ? "Scontata in banca" : "Operazione bancaria rimossa"),
      },
    );
  }

  function handleSave() {
    updateInvoice.mutate(
      {
        invoiceId,
        isDiscountedAtBank: isDiscounted,
        bankDiscountType: discountType || null,
        bankLiquidationDate: liquidationDate || null,
        bankDiscountFee: fee ? parseFloat(fee) : null,
      },
      { onSuccess: () => toast.success("Dati bancari aggiornati") },
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4 text-indigo-500" />
          Operazioni bancarie
        </CardTitle>
        <div className="flex items-center gap-2">
          {isDiscounted && (
            <Badge className="border-indigo-200 bg-indigo-50 text-indigo-700">
              Scontata in banca
            </Badge>
          )}
          <Switch checked={isDiscounted} onCheckedChange={handleToggle} />
        </div>
      </CardHeader>
      {isDiscounted && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo operazione</Label>
              <Select
                value={discountType}
                onValueChange={(v) => {
                  if (!v) return;
                  setDiscountType(v);
                  updateInvoice.mutate(
                    {
                      invoiceId,
                      isDiscountedAtBank: true,
                      bankDiscountType: v,
                      bankLiquidationDate: liquidationDate || null,
                      bankDiscountFee: fee ? parseFloat(fee) : null,
                    },
                    { onSuccess: () => toast.success("Dati bancari aggiornati") },
                  );
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data liquidazione banca</Label>
              <Input
                type="date"
                value={liquidationDate}
                onChange={(e) => setLiquidationDate(e.target.value)}
                className="text-xs"
                onBlur={handleSave}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Commissione bancaria</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="font-numeric text-xs"
                onBlur={handleSave}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs italic">
            I campi bancari sono predisposti per la Fase 3. La logica previsionale li integrerà in
            futuro.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
