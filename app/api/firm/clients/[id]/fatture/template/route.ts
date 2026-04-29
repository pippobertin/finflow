import * as XLSX from "xlsx";
import { getFirmSession } from "@/lib/helpers/auth-guard";

export async function GET() {
  const { error } = await getFirmSession();
  if (error) return error;

  const headers = ["Numero", "Data", "Scadenza", "Direzione", "Imponibile", "IVA", "Note", "Stato"];

  const exampleRows = [
    ["FA-2025-0001", "15/01/2025", "15/03/2025", "Attiva", 1000, 220, "Consulenza gennaio", ""],
    ["FP-2025-0012", "20/01/2025", "20/02/2025", "Passiva", 500, 110, "Materiale ufficio", ""],
    ["FA-2025-0002", "01/02/2025", "01/04/2025", "Attiva", 2500, 550, "Progetto Alpha", "Pagata"],
  ];

  const data = [headers, ...exampleRows];

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for readability
  sheet["!cols"] = [
    { wch: 18 }, // Numero
    { wch: 12 }, // Data
    { wch: 12 }, // Scadenza
    { wch: 10 }, // Direzione
    { wch: 14 }, // Imponibile
    { wch: 10 }, // IVA
    { wch: 30 }, // Note
    { wch: 10 }, // Stato
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, "Fatture");

  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-fatture.xlsx"',
    },
  });
}
