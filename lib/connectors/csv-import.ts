// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy connector, behind LEGACY_FATTURAPA_IMPORT flag. Will be removed in Block D.
import { prisma } from "@/lib/prisma";
import { parseCsv, parseItalianNumber, parseDate } from "@/lib/parsers/csv-parser";
import { autoTagInvoices } from "@/lib/tagging/auto-tagger";
import type { CsvColumnMapping } from "@/lib/validations/import";
import type { ImportResult, ImportError } from "@/lib/types/api";
import type { InvoiceDirection, InvoiceStatus } from "@prisma/client";

interface CsvImportOptions {
  organizationId: string;
  csvContent: string;
  direction: InvoiceDirection;
  mapping: CsvColumnMapping;
  dateFormat?: string;
  decimalSeparator?: "," | ".";
  skipRows?: number;
}

export async function importCsv(options: CsvImportOptions): Promise<ImportResult> {
  const {
    organizationId,
    csvContent,
    direction,
    mapping,
    dateFormat = "dd/MM/yyyy",
    decimalSeparator = ",",
    skipRows = 0,
  } = options;

  const { rows, errors: parseErrors } = parseCsv(csvContent, { skipRows });
  const importErrors: ImportError[] = [];
  const createdIds: string[] = [];

  // Report parse errors
  for (const pe of parseErrors) {
    importErrors.push({
      row: pe.row ?? 0,
      message: pe.message,
    });
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1 + skipRows;

    try {
      // Required fields
      const number = row[mapping.number]?.trim();
      const dateStr = row[mapping.date]?.trim();
      const counterpart = row[mapping.counterpart]?.trim();
      const netAmountStr = row[mapping.netAmount]?.trim();

      if (!number) {
        importErrors.push({ row: rowNum, field: "number", message: "Numero fattura mancante" });
        continue;
      }
      if (!counterpart) {
        importErrors.push({ row: rowNum, field: "counterpart", message: "Controparte mancante" });
        continue;
      }

      const date = parseDate(dateStr ?? "", dateFormat);
      if (!date) {
        importErrors.push({ row: rowNum, field: "date", message: "Data non valida" });
        continue;
      }

      const netAmount = parseItalianNumber(netAmountStr ?? "", decimalSeparator);
      if (netAmount === null || netAmount <= 0) {
        importErrors.push({ row: rowNum, field: "netAmount", message: "Importo netto non valido" });
        continue;
      }

      // Optional fields
      const vatAmount = mapping.vatAmount
        ? (parseItalianNumber(row[mapping.vatAmount] ?? "", decimalSeparator) ?? 0)
        : Math.round(netAmount * 0.22 * 100) / 100;

      const grossAmount = mapping.grossAmount
        ? (parseItalianNumber(row[mapping.grossAmount] ?? "", decimalSeparator) ??
          netAmount + vatAmount)
        : netAmount + vatAmount;

      const dueDate = mapping.dueDate ? parseDate(row[mapping.dueDate] ?? "", dateFormat) : null;

      const description = mapping.description ? (row[mapping.description]?.trim() ?? null) : null;

      const vatNumber = mapping.vatNumber ? (row[mapping.vatNumber]?.trim() ?? null) : null;

      let status: InvoiceStatus = "PENDING";
      if (mapping.status) {
        const raw = row[mapping.status]?.trim()?.toUpperCase();
        if (raw === "PAID" || raw === "PAGATA") status = "PAID";
        // All other statuses (OVERDUE, DRAFT, etc.) map to PENDING
      }

      const invoice = await prisma.invoice.create({
        data: {
          organizationId,
          direction,
          status,
          number,
          date,
          dueDate,
          counterpart,
          vatNumber,
          description,
          netAmount,
          vatAmount,
          grossAmount,
          needsTagging: true,
          connectorRef: `csv-import-${Date.now()}`,
        },
      });

      createdIds.push(invoice.id);
    } catch (err) {
      importErrors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Errore sconosciuto",
      });
    }
  }

  // Auto-tag imported invoices
  let tagged = 0;
  if (createdIds.length > 0) {
    const result = await autoTagInvoices(organizationId, createdIds);
    tagged = result.tagged;
  }

  return {
    imported: createdIds.length,
    tagged,
    errors: importErrors,
  };
}
