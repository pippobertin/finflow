/**
 * Quick test: parse the sample Unicredit PDF with V1 parser.
 * Run: npx tsx scripts/_test-v1-unicredit.ts
 */
import fs from "fs";
import path from "path";

// Inline the parser to avoid Next.js module resolution issues
async function main() {
  const pdfPath = path.join(process.cwd(), "cowork/_sample-unicredit.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error("File not found:", pdfPath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(pdfPath);

  // Dynamic import to handle ESM/CJS
  const { parseBankStatementPdf } = await import("../lib/parsers/pdf-parser");

  console.log("Parsing:", pdfPath);
  console.log("File size:", (buffer.length / 1024).toFixed(1), "KB\n");

  const result = await parseBankStatementPdf(Buffer.from(buffer));

  console.log("=== RISULTATI V1 PARSER ===\n");
  console.log("Headers:", result.headers.join(" | "));
  console.log("Total rows:", result.rows.length);
  console.log("EC Metadata:", JSON.stringify(result.ecMetadata, null, 2));

  // Show first 15 transactions
  console.log("\n--- Prime 15 transazioni ---\n");
  const preview = result.rows.slice(0, 15);
  for (let i = 0; i < preview.length; i++) {
    const r = preview[i];
    const date = r["Data"] ?? "";
    const desc = (r["Descrizione"] ?? "").slice(0, 50);
    const uscite = r["Uscite"] ?? "";
    const entrate = r["Entrate"] ?? "";
    console.log(
      `${String(i + 1).padStart(2)}. ${date}  ${desc.padEnd(50)}  U: ${uscite.padStart(12)}  E: ${entrate.padStart(12)}`,
    );
  }

  // Check for anomalous amounts
  const MAX = 10_000_000;
  let anomalous = 0;
  for (const r of result.rows) {
    const u = parseFloat((r["Uscite"] ?? "0").replace(/\./g, "").replace(",", ".")) || 0;
    const e = parseFloat((r["Entrate"] ?? "0").replace(/\./g, "").replace(",", ".")) || 0;
    if (Math.abs(u) > MAX || Math.abs(e) > MAX) {
      anomalous++;
      console.log(
        `\n⚠ ANOMALO: ${r["Data"]} ${(r["Descrizione"] ?? "").slice(0, 60)} U:${r["Uscite"]} E:${r["Entrate"]}`,
      );
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log("Transazioni:", result.rows.length);
  console.log("Anomale (>10M):", anomalous);
  console.log("Saldo iniziale:", result.ecMetadata.openingBalance ?? "non rilevato");
  console.log("Saldo finale:", result.ecMetadata.closingBalance ?? "non rilevato");
}

main().catch(console.error);
