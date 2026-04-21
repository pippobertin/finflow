// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy connector, behind LEGACY_FATTURAPA_IMPORT flag. Will be removed in Block D.
import { prisma } from "@/lib/prisma";
import { autoTagInvoices } from "@/lib/tagging/auto-tagger";
import type { ParsedFatturaPAInvoice } from "@/lib/parsers/fatturapa-parser";
import type { FatturapaImportResult, FatturapaInvoiceSummary, ImportError } from "@/lib/types/api";
import type { InvoiceDirection } from "@prisma/client";

interface FatturapaImportOptions {
  organizationId: string;
  parsedInvoices: ParsedFatturaPAInvoice[];
  direction: InvoiceDirection;
}

function toSummary(inv: ParsedFatturaPAInvoice): FatturapaInvoiceSummary {
  return {
    number: inv.number,
    counterpart: inv.counterpart,
    grossAmount: inv.grossAmount,
    documentType: inv.documentType,
  };
}

export async function importFatturaPA(
  options: FatturapaImportOptions,
): Promise<FatturapaImportResult> {
  const { organizationId, parsedInvoices, direction } = options;

  const importErrors: ImportError[] = [];
  const importWarnings: Array<{ file: string; message: string }> = [];
  const createdIds: string[] = [];
  const importedDetails: FatturapaInvoiceSummary[] = [];
  const skippedDetails: FatturapaInvoiceSummary[] = [];
  const fixedDetails: FatturapaInvoiceSummary[] = [];

  const connectorRef = `fatturapa-import-${Date.now()}`;

  for (let i = 0; i < parsedInvoices.length; i++) {
    const inv = parsedInvoices[i];
    const rowNum = i + 1;

    try {
      // Direction mismatch warning
      if (inv.detectedDirection && inv.detectedDirection !== direction) {
        importWarnings.push({
          file: inv.fileName,
          message: `Direzione rilevata (${inv.detectedDirection}) diversa da quella selezionata (${direction})`,
        });
      }

      // Deduplication: number + date + vatNumber + organizationId
      const existing = await prisma.invoice.findFirst({
        where: {
          organizationId,
          number: inv.number,
          date: new Date(inv.date),
          vatNumber: inv.counterpartVatNumber,
        },
        select: { id: true },
      });

      if (existing) {
        skippedDetails.push(toSummary(inv));
        continue;
      }

      // Fix FIC-imported invoices: match by vatNumber + date + grossAmount
      if (inv.counterpartVatNumber) {
        const ficInvoice = await prisma.invoice.findFirst({
          where: {
            organizationId,
            vatNumber: inv.counterpartVatNumber,
            date: new Date(inv.date),
            grossAmount: inv.grossAmount,
            connectorRef: { startsWith: "fic:" },
          },
          select: { id: true, number: true },
        });

        if (ficInvoice) {
          await prisma.invoice.update({
            where: { id: ficInvoice.id },
            data: {
              number: inv.number,
              ...(inv.documentType ? { documentType: inv.documentType } : {}),
            },
          });
          fixedDetails.push(toSummary(inv));
          continue;
        }
      }

      // Create invoice with lines in a transaction
      const invoice = await prisma.$transaction(async (tx) => {
        const created = await tx.invoice.create({
          data: {
            organizationId,
            direction,
            status: "PENDING",
            number: inv.number,
            date: new Date(inv.date),
            dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
            counterpart: inv.counterpart,
            vatNumber: inv.counterpartVatNumber,
            description: inv.description,
            netAmount: inv.netAmount,
            vatAmount: inv.vatAmount,
            grossAmount: inv.grossAmount,
            documentType: inv.documentType,
            needsTagging: true,
            connectorRef,
          },
        });

        // Create invoice lines
        if (inv.lines.length > 0) {
          await tx.invoiceLine.createMany({
            data: inv.lines.map((line) => ({
              invoiceId: created.id,
              description: line.description || `Riga ${line.lineNumber}`,
              quantity: line.quantity ?? 1,
              unitPrice: line.unitPrice ?? line.amount,
              amount: line.amount,
            })),
          });
        }

        return created;
      });

      createdIds.push(invoice.id);
      importedDetails.push(toSummary(inv));
    } catch (err) {
      importErrors.push({
        row: rowNum,
        field: inv.number,
        message: err instanceof Error ? err.message : "Errore sconosciuto",
      });
    }
  }

  // Auto-tag imported invoices
  let tagged = 0;
  const taggedDetails: FatturapaInvoiceSummary[] = [];
  if (createdIds.length > 0) {
    const result = await autoTagInvoices(organizationId, createdIds);
    tagged = result.tagged;

    // Query which invoices were actually tagged
    if (tagged > 0) {
      const taggedInvoices = await prisma.invoice.findMany({
        where: { id: { in: createdIds }, needsTagging: false },
        select: { number: true, counterpart: true, grossAmount: true, documentType: true },
      });
      for (const inv of taggedInvoices) {
        taggedDetails.push({
          number: inv.number,
          counterpart: inv.counterpart,
          grossAmount: Number(inv.grossAmount),
          documentType: inv.documentType ?? "",
        });
      }
    }
  }

  return {
    imported: createdIds.length,
    tagged,
    skipped: skippedDetails.length,
    fixed: fixedDetails.length,
    errors: importErrors,
    warnings: importWarnings,
    importedDetails,
    skippedDetails,
    taggedDetails,
    fixedDetails,
  };
}
