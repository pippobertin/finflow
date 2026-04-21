"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEUR, formatDateShort } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

interface BankStatementData {
  id: string;
  date: string;
  description: string;
  amount: number | string;
  balance: number | string;
  reference: string | null;
  costCenter: { id: string; name: string; color: string } | null;
}

interface BankStatementTableLightProps {
  statements: BankStatementData[];
}

export function BankStatementTableLight({ statements }: BankStatementTableLightProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead className="min-w-[300px]">Descrizione</TableHead>
          <TableHead>Riferimento</TableHead>
          <TableHead className="text-right">Importo</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Centro di costo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statements.map((s) => {
          const amount = Number(s.amount);
          return (
            <TableRow key={s.id} className="transition-colors duration-150">
              <TableCell className="whitespace-nowrap">{formatDateShort(s.date)}</TableCell>
              <TableCell className="max-w-[400px] truncate text-sm">{s.description}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{s.reference ?? "—"}</TableCell>
              <TableCell
                className={cn(
                  "font-numeric text-right font-medium tabular-nums",
                  amount > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {formatEUR(s.amount)}
              </TableCell>
              <TableCell className="font-numeric text-right tabular-nums">
                {formatEUR(s.balance)}
              </TableCell>
              <TableCell>
                {s.costCenter ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"
                    style={{ borderColor: s.costCenter.color + "40", color: s.costCenter.color }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.costCenter.color }}
                    />
                    {s.costCenter.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
