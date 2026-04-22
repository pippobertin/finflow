import { prisma } from "@/lib/prisma";
import { parseCsv, parseItalianNumber, parseDate } from "@/lib/parsers/csv-parser";
import { parseBankStatementPdf } from "@/lib/parsers/pdf-parser";
import { computeFingerprint } from "@/lib/import/dedup-engine";
import type { BankStatementMapping } from "@/lib/validations/bank-statement-import";
import type { ImportError } from "@/lib/types/api";

interface BankStatementImportOptions {
  organizationId: string;
  csvContent?: string;
  pdfBuffer?: Buffer;
  /** Pre-parsed rows from profile-based parser (skips CSV/PDF parsing) */
  parsedRows?: Record<string, string>[];
  mapping: BankStatementMapping;
  dateFormat?: string;
  decimalSeparator?: "," | ".";
  skipRows?: number;
  sourceFile?: string;
}

export interface BankStatementImportResult {
  imported: number;
  duplicates: number;
  totalParsed: number;
  errors: ImportError[];
  bankStatementIds: string[];
  ecMetadata?: {
    openingBalance: number | null;
    closingBalance: number | null;
    closingDate: string | null;
    linkedPeriod: string | null;
  };
}

/**
 * Compute the signed amount from the mapping.
 * - If `mapping.amount` is set → use it directly (already signed)
 * - If `mapping.uscite` + `mapping.entrate` → entrate - uscite
 */
function resolveAmount(
  row: Record<string, string>,
  mapping: BankStatementMapping,
  decimalSeparator: "," | ".",
): { amount: number | null; error?: string } {
  if (mapping.amount) {
    const raw = row[mapping.amount]?.trim();
    const amount = parseItalianNumber(raw ?? "", decimalSeparator);
    if (amount === null) return { amount: null, error: "Importo non valido" };
    return { amount };
  }

  if (mapping.uscite && mapping.entrate) {
    const rawUscite = row[mapping.uscite]?.trim() || "0";
    const rawEntrate = row[mapping.entrate]?.trim() || "0";
    const uscite = parseItalianNumber(rawUscite, decimalSeparator) ?? 0;
    const entrate = parseItalianNumber(rawEntrate, decimalSeparator) ?? 0;

    // uscite are outflows (negative), entrate are inflows (positive)
    // Each row typically has one or the other (the other being 0/empty)
    const amount = entrate - uscite;
    if (amount === 0 && rawUscite === "0" && rawEntrate === "0") {
      return { amount: null, error: "Nessun importo (uscite e entrate vuoti)" };
    }
    return { amount };
  }

  return { amount: null, error: "Nessuna colonna importo mappata" };
}

export async function importBankStatements(
  options: BankStatementImportOptions,
): Promise<BankStatementImportResult> {
  const {
    organizationId,
    csvContent,
    pdfBuffer,
    parsedRows: preRows,
    mapping,
    dateFormat = "dd/MM/yyyy",
    decimalSeparator = ",",
    skipRows = 0,
    sourceFile,
  } = options;

  let rows: Record<string, string>[];
  const importErrors: ImportError[] = [];
  let detectedEcMetadata: BankStatementImportResult["ecMetadata"] = undefined;

  if (preRows) {
    // Pre-parsed rows from profile-based parser
    rows = preRows;
  } else if (pdfBuffer) {
    const pdfResult = await parseBankStatementPdf(pdfBuffer);
    rows = pdfResult.rows;

    // Capture EC metadata if detected (RIEPILOGO with saldo finale)
    if (pdfResult.ecMetadata.closingBalance !== null) {
      detectedEcMetadata = {
        openingBalance: pdfResult.ecMetadata.openingBalance,
        closingBalance: pdfResult.ecMetadata.closingBalance,
        closingDate: pdfResult.ecMetadata.closingDate,
        linkedPeriod: null,
      };
    }
  } else if (csvContent) {
    const { rows: csvRows, errors: parseErrors } = parseCsv(csvContent, { skipRows });
    rows = csvRows;
    for (const pe of parseErrors) {
      importErrors.push({
        row: pe.row ?? 0,
        message: pe.message,
      });
    }
  } else {
    return {
      imported: 0,
      duplicates: 0,
      totalParsed: 0,
      errors: [{ row: 0, message: "Nessun file fornito" }],
      bankStatementIds: [],
    };
  }

  const createdIds: string[] = [];
  let duplicateCount = 0;

  console.log(
    `[bank-statement-import] Parsed ${rows.length} rows from ${pdfBuffer ? "PDF" : "CSV"}`,
  );
  if (rows.length > 0) {
    console.log(`[bank-statement-import] First row keys: [${Object.keys(rows[0]).join(", ")}]`);
    console.log(
      `[bank-statement-import] Mapping: date=${mapping.date}, desc=${mapping.description}, amount=${mapping.amount}, uscite=${mapping.uscite}, entrate=${mapping.entrate}`,
    );
    console.log(
      `[bank-statement-import] First row sample: date="${rows[0][mapping.date]}", desc="${rows[0][mapping.description]?.slice(0, 40)}"`,
    );
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1 + (csvContent ? skipRows : 0);

    try {
      const dateStr = row[mapping.date]?.trim();
      const description = row[mapping.description]?.trim();
      const reference = mapping.reference ? row[mapping.reference]?.trim() : undefined;

      if (!description) {
        if (importErrors.length === 0)
          console.log(
            `[bank-statement-import] Row ${rowNum}: description missing. Row keys: [${Object.keys(row).join(", ")}], mapping.description="${mapping.description}"`,
          );
        importErrors.push({
          row: rowNum,
          field: "description",
          message: `Descrizione mancante (colonna "${mapping.description}")`,
        });
        continue;
      }

      const date = parseDate(dateStr ?? "", dateFormat);
      if (!date) {
        if (importErrors.length === 0)
          console.log(
            `[bank-statement-import] Row ${rowNum}: date invalid. dateStr="${dateStr}", dateFormat="${dateFormat}"`,
          );
        importErrors.push({ row: rowNum, field: "date", message: `Data non valida: "${dateStr}"` });
        continue;
      }

      // Resolve amount (single column or uscite+entrate)
      const { amount, error: amountError } = resolveAmount(row, mapping, decimalSeparator);
      if (amount === null) {
        if (importErrors.length === 0)
          console.log(`[bank-statement-import] Row ${rowNum}: amount error. ${amountError}`);
        importErrors.push({
          row: rowNum,
          field: "amount",
          message: amountError ?? "Importo non valido",
        });
        continue;
      }

      // Balance is optional — default to 0 if not mapped
      let balance = 0;
      if (mapping.balance) {
        const balanceStr = row[mapping.balance]?.trim();
        if (balanceStr) {
          const parsed = parseItalianNumber(balanceStr, decimalSeparator);
          if (parsed !== null) balance = parsed;
        }
      }

      // If no reference column mapped, try to extract TRN from description
      let ref = reference;
      if (!ref && description) {
        const trnMatch = description.match(/TRN\s+(\S+)/i);
        if (trnMatch) ref = trnMatch[1];
      }

      // Compute fingerprint for dedup
      const fingerprint = computeFingerprint(date, amount, description);

      // Check for duplicate
      const existingDup = await prisma.bankStatement.findFirst({
        where: { organizationId, fingerprint },
        select: { id: true },
      });
      if (existingDup) {
        duplicateCount++;
        continue;
      }

      const bs = await prisma.bankStatement.create({
        data: {
          organizationId,
          date,
          description,
          amount,
          balance,
          reference: ref || null,
          sourceFile: sourceFile || null,
          fingerprint,
        },
      });

      createdIds.push(bs.id);
    } catch (err) {
      importErrors.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Errore sconosciuto",
      });
    }
  }

  console.log(
    `[bank-statement-import] Result: ${createdIds.length} imported, ${duplicateCount} duplicates, ${importErrors.length} errors out of ${rows.length} parsed`,
  );

  // If EC metadata detected (PDF with saldo finale), auto-create BalanceSnapshot + DataPeriod
  if (
    detectedEcMetadata?.closingBalance != null &&
    detectedEcMetadata.closingDate &&
    createdIds.length > 0
  ) {
    try {
      // Parse closing date: "DD.MM.YYYY" or "DD/MM/YYYY"
      const cdParts = detectedEcMetadata.closingDate.replace(/\//g, ".").split(".");
      if (cdParts.length === 3) {
        const day = parseInt(cdParts[0]);
        const month = parseInt(cdParts[1]) - 1;
        const year = parseInt(cdParts[2]);
        const qNum = Math.floor(month / 3) + 1;
        const period = `Q${qNum}_${year}`;
        const qStartMonth = (qNum - 1) * 3;
        // Use UTC noon to avoid timezone-shift issues with PostgreSQL
        const qStart = new Date(Date.UTC(year, qStartMonth, 1, 12, 0, 0));
        const qEnd = new Date(Date.UTC(year, qStartMonth + 3, 0, 12, 0, 0));

        detectedEcMetadata.linkedPeriod = period;

        // Create DataPeriod if not already linked
        const existingDp = await prisma.dataPeriod.findFirst({
          where: {
            organizationId,
            type: "EC_QUARTERLY",
            startDate: { lte: qEnd },
            endDate: { gte: qStart },
          },
        });
        if (!existingDp) {
          await prisma.dataPeriod.create({
            data: {
              organizationId,
              type: "EC_QUARTERLY",
              startDate: qStart,
              endDate: qEnd,
              sourceFile: sourceFile || null,
            },
          });
        }

        // Create BalanceSnapshot
        const bankAccount = await prisma.bankAccount.findFirst({
          where: { organizationId, isDefault: true },
          select: { id: true },
        });
        if (bankAccount) {
          await prisma.balanceSnapshot.upsert({
            where: {
              bankAccountId_date_source: {
                bankAccountId: bankAccount.id,
                date: qEnd,
                source: "EC_QUARTERLY",
              },
            },
            update: {
              balance: detectedEcMetadata.closingBalance,
              period,
              sourceFile: sourceFile || null,
            },
            create: {
              bankAccountId: bankAccount.id,
              date: qEnd,
              balance: detectedEcMetadata.closingBalance,
              source: "EC_QUARTERLY",
              period,
              sourceFile: sourceFile || null,
            },
          });
          console.log(
            `[bank-statement-import] EC detected: period=${period}, closingBalance=${detectedEcMetadata.closingBalance}, date=${qEnd.toISOString().slice(0, 10)}`,
          );
        }
      }
    } catch (err) {
      console.error("[bank-statement-import] Error saving EC metadata:", err);
    }
  }

  return {
    imported: createdIds.length,
    duplicates: duplicateCount,
    totalParsed: rows.length,
    errors: importErrors,
    bankStatementIds: createdIds,
    ecMetadata: detectedEcMetadata,
  };
}
