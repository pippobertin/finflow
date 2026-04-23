/**
 * Verify A17 sign fix: check ANFFAS SIBILLINI and all BONIFICO A VOSTRO FAVORE.
 * Run: npx tsx scripts/_verify-sign-fix.ts
 */
import fs from "fs";
import path from "path";

async function main() {
  const buffer = fs.readFileSync(path.join(process.cwd(), "cowork/_sample-unicredit.pdf"));
  const { parseBankStatementPdf } = await import("../lib/parsers/pdf-parser");
  const result = await parseBankStatementPdf(Buffer.from(buffer));

  // 1. Find ANFFAS SIBILLINI transaction
  console.log("=== ANFFAS SIBILLINI ===");
  for (const r of result.rows) {
    if ((r["Descrizione"] ?? "").includes("ANFFAS")) {
      console.log(`Data: ${r["Data"]}, Uscite: "${r["Uscite"]}", Entrate: "${r["Entrate"]}"`);
      console.log(`Desc: ${r["Descrizione"]?.slice(0, 150)}`);
    }
  }

  // 2. All "BONIFICO A VOSTRO FAVORE"
  console.log("\n=== TUTTI I BONIFICI A VOSTRO FAVORE ===");
  let countBVF = 0;
  let allPositive = true;
  for (const r of result.rows) {
    const desc = (r["Descrizione"] ?? "").toUpperCase();
    if (desc.includes("BONIFICO A VOSTRO FAVORE") || desc.includes("A VOSTRO FAVORE")) {
      countBVF++;
      const hasEntrate = Boolean(r["Entrate"] && r["Entrate"].trim());
      if (!hasEntrate) allPositive = false;
      const sign = hasEntrate ? "+" : "-";
      const amt = hasEntrate ? r["Entrate"] : r["Uscite"];
      console.log(
        `${sign} ${r["Data"]}  ${(amt ?? "").padStart(12)}  ${(r["Descrizione"] ?? "").slice(0, 80)}`,
      );
    }
  }
  console.log(`\nTotale bonifici a vostro favore: ${countBVF}`);
  console.log(`Tutti positivi (entrate): ${allPositive}`);

  // 3. Count direction stats
  let entrate = 0;
  let uscite = 0;
  for (const r of result.rows) {
    if (r["Entrate"]?.trim()) entrate++;
    if (r["Uscite"]?.trim()) uscite++;
  }
  console.log(`\n=== DIRECTION STATS ===`);
  console.log(`Entrate: ${entrate}, Uscite: ${uscite}, Totale: ${result.rows.length}`);

  // 4. Check ACCREDITO transactions
  console.log("\n=== ACCREDITO ===");
  for (const r of result.rows) {
    const desc = (r["Descrizione"] ?? "").toUpperCase();
    if (desc.includes("ACCREDITO")) {
      const hasEntrate = Boolean(r["Entrate"] && r["Entrate"].trim());
      const sign = hasEntrate ? "+" : "-";
      const amt = hasEntrate ? r["Entrate"] : r["Uscite"];
      console.log(
        `${sign} ${r["Data"]}  ${(amt ?? "").padStart(12)}  ${(r["Descrizione"] ?? "").slice(0, 80)}`,
      );
    }
  }
}

main().catch(console.error);
