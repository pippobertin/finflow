"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MarkAsPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paidDate: string) => void;
  loading?: boolean;
  label?: string;
}

export function MarkAsPaidDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  label = "Segna come pagata",
}: MarkAsPaidDialogProps) {
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="paid-date">Data di pagamento</Label>
          <Input
            id="paid-date"
            type="date"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={() => onConfirm(paidDate)} disabled={loading || !paidDate}>
            {loading ? "Salvataggio..." : "Conferma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
