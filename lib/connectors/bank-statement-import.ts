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
    mapping,
    dateFormat = "dd/MM/yyyy",
    decimalSeparator = ",",
    skipRows = 0,
    sourceFile,
  } = options;

  let rows: Record<string, string>[];
  const importErrors: ImportError[] = [];

  if (pdfBuffer) {
    const pdfResult = await parseBankStatementPdf(pdfBuffer);
    rows = pdfResult.rows;
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

  return {
    imported: createdIds.length,
    duplicates: duplicateCount,
    totalParsed: rows.length,
    errors: importErrors,
    bankStatementIds: createdIds,
  };
}
