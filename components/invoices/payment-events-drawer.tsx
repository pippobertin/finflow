"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Check, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  usePaymentEvents,
  useCreatePaymentEvent,
  useDeletePaymentEvent,
} from "@/lib/hooks/use-payment-events";
import { getPaymentActionLabel } from "@/lib/helpers/invoice-labels";
import { formatEUR } from "@/lib/helpers/format";
import { toast } from "sonner";

interface PaymentEventsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  direction: string;
}

export function PaymentEventsDrawer({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  totalAmount,
  direction,
}: PaymentEventsDrawerProps) {
  const { data: events = [] } = usePaymentEvents(invoiceId);
  const createEvent = useCreatePaymentEvent();
  const deleteEvent = useDeletePaymentEvent();

  const [amount, setAmount] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isActual, setIsActual] = useState(true);
  const [notes, setNotes] = useState("");

  const totalPaid = events.filter((e) => e.isActual).reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalAmount - totalPaid;
  const progressPct = totalAmount > 0 ? Math.min(100, (totalPaid / totalAmount) * 100) : 0;

  const actionLabel = getPaymentActionLabel(direction);
  const isActive = direction === "ACTIVE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Inserisci un importo valido");
      return;
    }

    createEvent.mutate(
      {
        invoiceId,
        amount: numAmount,
        eventDate,
        isActual,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            isActual
              ? isActive
                ? "Incasso registrato"
                : "Pagamento registrato"
              : "Evento previsto aggiunto",
          );
          setAmount("");
          setNotes("");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{actionLabel}</SheetTitle>
          <SheetDescription>
            Fattura {invoiceNumber} — Totale {formatEUR(totalAmount)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{isActive ? "Incassato" : "Pagato"}</span>
              <span className="font-numeric font-semibold">
                {formatEUR(totalPaid)} / {formatEUR(totalAmount)}
              </span>
            </div>
            <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {remaining > 0 && (
              <p className="text-muted-foreground text-xs">Residuo: {formatEUR(remaining)}</p>
            )}
          </div>

          {/* Existing events */}
          {events.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                {isActive ? "Incassi registrati" : "Pagamenti registrati"}
              </h4>
              <div className="space-y-1.5">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {ev.isActual ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      <div>
                        <span className="font-numeric text-sm font-medium">
                          {formatEUR(ev.amount)}
                        </span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {format(new Date(ev.eventDate), "dd/MM/yyyy")}
                        </span>
                        {ev.notes && <p className="text-muted-foreground text-xs">{ev.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          ev.isActual
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {ev.isActual ? "Effettivo" : "Previsto"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                        onClick={() => deleteEvent.mutate(ev.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New event form */}
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Nuovo {isActive ? "incasso" : "pagamento"}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Importo</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (opzionale)</Label>
              <Input
                placeholder="Es. Bonifico n. 12345"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={createEvent.isPending} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {createEvent.isPending ? "Salvataggio..." : "Registra"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsActual(!isActual)}
              >
                {isActual ? "Effettivo" : "Previsto"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
