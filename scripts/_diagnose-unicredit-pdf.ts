/**
 * Diagnostic script: dump raw text extracted by pdf-parse from a bank PDF.
 *
 * Usage:
 *   npx tsx scripts/_diagnose-unicredit-pdf.ts <path-to-pdf>
 *
 * Output: page count, line count, text length, then the raw text (first 200 lines).
 */

import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: npx tsx scripts/_diagnose-unicredit-pdf.ts <path-to-pdf>");
    process.exit(1);
  }

  const resolved = path.resolve(pdfPath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(resolved);

  // Use PDFParse class (same pattern as lib/parsers/pdf-bank-statement-parser.ts)
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();

  const lines = result.text.split("\n");

  console.log("=== PDF DIAGNOSTIC ===");
  console.log(`Total lines: ${lines.length}`);
  console.log(`Text length: ${result.text.length} chars`);
  console.log("======================\n");

  const maxLines = 200;
  const output = lines.length > maxLines ? lines.slice(0, maxLines) : lines;

  for (let i = 0; i < output.length; i++) {
    console.log(`${String(i + 1).padStart(4, " ")} | ${output[i]}`);
  }

  if (lines.length > maxLines) {
    console.log(`\n... (${lines.length - maxLines} more lines truncated)`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
