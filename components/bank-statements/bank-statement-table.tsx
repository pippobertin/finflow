"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { useReassignBankStatement } from "@/lib/hooks/use-bank-statements";
import { useCostCenters } from "@/lib/hooks/use-cost-centers";
import { cn } from "@/lib/utils";

interface BankStatementData {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  balance: number | string;
  reference: string | null;
  isReconciled: boolean;
  reconciledInvoice: {
    id: string;
    number: string;
    counterpart: string;
  } | null;
  costCenter: { id: string; name: string; color: string } | null;
}

interface BankStatementTableProps {
  statements: BankStatementData[];
}

const UNASSIGNED = "__none__";

export function BankStatementTable({ statements }: BankStatementTableProps) {
  const reassign = useReassignBankStatement();
  const { data: costCenters = [] } = useCostCenters();

  const ccItems = costCenters as Array<{ id: string; name: string; color: string }>;

  function handleCostCenterChange(id: string, value: string | null) {
    reassign.mutate({
      id,
      costCenterId: !value || value === UNASSIGNED ? null : value,
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrizione</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Riferimento</TableHead>
          <TableHead>Stato</TableHead>
          <TableHead>Fattura</TableHead>
          <TableHead>Centro di Costo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statements.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="whitespace-nowrap">{formatDateShort(s.date)}</TableCell>
            <TableCell className="max-w-[300px] truncate" title={s.description}>
              {s.description}
            </TableCell>
            <TableCell
              className={cn(
                "text-right font-medium whitespace-nowrap",
                Number(s.amount) > 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {formatEUR(s.amount)}
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">{formatEUR(s.balance)}</TableCell>
            <TableCell className="text-muted-foreground">{s.reference ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={s.isReconciled ? "default" : "secondary"}>
                {s.isReconciled ? "Riconciliato" : "Da riconciliare"}
              </Badge>
            </TableCell>
            <TableCell>
              {s.reconciledInvoice ? (
                <span className="text-sm">
                  <span className="font-medium">{s.reconciledInvoice.number}</span>
                  {" — "}
                  <span className="text-muted-foreground">{s.reconciledInvoice.counterpart}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Select
                value={s.costCenter?.id ?? UNASSIGNED}
                onValueChange={(v) => handleCostCenterChange(s.id, v)}
              >
                <SelectTrigger className="h-7 w-44 text-xs">
                  <SelectValue>
                    {s.costCenter ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: s.costCenter.color }}
                        />
                        {s.costCenter.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Assegna...</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>
                    <span className="text-muted-foreground">— Nessuno —</span>
                  </SelectItem>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
