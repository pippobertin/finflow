import { getAuthSession } from "@/lib/helpers/auth-guard";
import { parseBankStatementPdf } from "@/lib/parsers/pdf-parser";

export async function POST(request: Request) {
  const { error } = await getAuthSession();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return Response.json({ error: "Nessun file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseBankStatementPdf(buffer);

    // Try to extract closing balance from the PDF text
    const closingInfo = extractClosingBalance(result.rows);

    return Response.json({
      rowCount: result.rows.length,
      closingBalance: closingInfo.balance,
      closingDate: closingInfo.date,
      openingBalance: closingInfo.openingBalance,
    });
  } catch (err) {
    console.error("[parse-ec]", err);
    return Response.json({ error: "Errore nel parsing" }, { status: 500 });
  }
}

function extractClosingBalance(rows: Record<string, string>[]): {
  balance: number | null;
  date: string | null;
  openingBalance: number | null;
} {
  // The last row's balance column typically contains the closing balance
  // Also check for explicit "Saldo" patterns in the rows
  let closingBalance: number | null = null;
  let closingDate: string | null = null;
  let openingBalance: number | null = null;

  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    // Check if there's a Saldo/Balance column
    for (const [key, value] of Object.entries(lastRow)) {
      if (/saldo|balance/i.test(key) && value) {
        const parsed = parseItalianNumber(value);
        if (parsed !== null) closingBalance = parsed;
      }
    }

    // Get date from last row
    const dateVal = lastRow["Data"] || lastRow["data"];
    if (dateVal) closingDate = dateVal;

    // Opening balance from first row
    if (rows.length > 1) {
      const firstRow = rows[0];
      for (const [key, value] of Object.entries(firstRow)) {
        if (/saldo|balance/i.test(key) && value) {
          const parsed = parseItalianNumber(value);
          if (parsed !== null) {
            // Opening = balance before first transaction
            const firstAmount = parseItalianNumber(
              firstRow["Entrate"] || firstRow["Uscite"] || firstRow["Importo"] || "0",
            );
            openingBalance = parsed - (firstAmount || 0);
          }
        }
      }
    }
  }

  return { balance: closingBalance, date: closingDate, openingBalance };
}

function parseItalianNumber(s: string): number | null {
  if (!s) return null;
  const cleaned = s
    .replace(/[\s\u00a0]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}
