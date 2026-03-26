/**
 * Enhanced bulk reconciliation script (v2).
 *
 * Improvements over v1:
 * - Includes OVERDUE invoices (not just PENDING)
 * - No date proximity limit (invoices from months/years ago can match)
 * - Multi-invoice matching: one bank transfer can cover N invoices if sum matches
 * - Counterpart name matching with fuzzy logic
 *
 * Usage: npx tsx scripts/bulk-reconcile-v2.ts [--dry-run]
 */
import { prisma } from "../lib/prisma";

const dryRun = process.argv.includes("--dry-run");

const STOP_WORDS = new Set([
  "srl",
  "spa",
  "snc",
  "sas",
  "srls",
  "s.r.l.",
  "s.p.a.",
  "s.r.l",
  "s.n.c",
  "s.a.s",
  "di",
  "e",
  "la",
  "il",
  "lo",
  "del",
  "dei",
  "della",
  "delle",
  "degli",
  "societa",
  "società",
  "cooperativa",
  "sociale",
  "associazione",
  "fondazione",
  "ets",
  "odv",
  "aps",
  "onlus",
  "a",
  "per",
  "the",
]);

function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.'"\-,()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function extractCounterpart(description: string): string | null {
  let match = description.match(/\bDA\s{2,}(.+?)\s{1,}PER\b/i);
  if (match && match[1].trim().length > 2) return match[1].trim();
  match = description.match(/\bDA:\s*(.+?)\s+PER:/i);
  if (match && match[1].trim().length > 2) return match[1].trim();
  match = description.match(/\bDA\s{2,}(.+?)\s{1,}(?:TRN|$)/i);
  if (match && match[1].trim().length > 2) return match[1].trim();
  match = description.match(/SDD\s+da\s+IT\w+\s+(?:DLL\s+)?(.+?)\s+mandato/i);
  if (match && match[1].trim().length > 2) return match[1].trim();
  return null;
}

function counterpartMatch(bsDescription: string, invoiceCounterpart: string): number {
  const bsWords = normalize(bsDescription);
  const invWords = normalize(invoiceCounterpart);
  if (invWords.length === 0) return 0;

  const matched = invWords.filter((w) => bsWords.some((bw) => bw.includes(w) || w.includes(bw)));
  return matched.length / invWords.length; // 0..1
}

interface BsRow {
  id: string;
  date: Date;
  description: string;
  amount: number;
}

interface InvRow {
  id: string;
  number: string;
  counterpart: string;
  grossAmount: number;
  direction: string;
}

interface MatchResult {
  bs: BsRow;
  invoices: InvRow[];
  type: "single" | "multi";
  confidence: number;
}

async function main() {
  const org = await prisma.organization.findFirst({ select: { id: true, name: true } });
  if (!org) {
    console.log("Nessuna organizzazione.");
    process.exit(1);
  }
  console.log(`Organizzazione: ${org.name}`);

  // Fetch unreconciled bank statements
  const rawBs = await prisma.bankStatement.findMany({
    where: { organizationId: org.id, isReconciled: false },
    orderBy: { date: "asc" },
    select: { id: true, date: true, description: true, amount: true },
  });
  const bankStatements: BsRow[] = rawBs.map((bs) => ({
    ...bs,
    amount: Number(bs.amount),
  }));

  // Fetch unpaid invoices (PENDING + OVERDUE)
  const rawInv = await prisma.invoice.findMany({
    where: { organizationId: org.id, status: { in: ["PENDING", "OVERDUE"] } },
    select: { id: true, number: true, counterpart: true, grossAmount: true, direction: true },
  });
  const invoices: InvRow[] = rawInv.map((inv) => ({
    ...inv,
    grossAmount: Number(inv.grossAmount),
  }));

  console.log(`\nMovimenti non riconciliati: ${bankStatements.length}`);
  console.log(`Fatture non pagate (PENDING+OVERDUE): ${invoices.length}`);

  const usedBsIds = new Set<string>();
  const usedInvIds = new Set<string>();
  const matches: MatchResult[] = [];

  // Split by direction
  const inflows = bankStatements.filter((bs) => bs.amount > 0);
  const outflows = bankStatements.filter((bs) => bs.amount < 0);
  const activeInv = invoices.filter((inv) => inv.direction === "ACTIVE");
  const passiveInv = invoices.filter((inv) => inv.direction === "PASSIVE");

  function matchDirection(bsList: BsRow[], invList: InvRow[]) {
    // Pass 1: exact 1-to-1 amount match with counterpart confirmation
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);
      const extracted = extractCounterpart(bs.description);

      // Find invoices matching by amount
      const amountMatches = invList.filter(
        (inv) => !usedInvIds.has(inv.id) && Math.abs(inv.grossAmount - absAmt) < 0.02,
      );

      if (amountMatches.length === 0) continue;

      // Score each by counterpart match
      let best: { inv: InvRow; score: number } | null = null;
      for (const inv of amountMatches) {
        let score = counterpartMatch(bs.description, inv.counterpart);
        if (extracted) {
          const extractedScore = counterpartMatch(extracted, inv.counterpart);
          score = Math.max(score, extractedScore);
        }
        if (!best || score > best.score) best = { inv, score };
      }

      if (best && best.score >= 0.3) {
        usedBsIds.add(bs.id);
        usedInvIds.add(best.inv.id);
        matches.push({ bs, invoices: [best.inv], type: "single", confidence: best.score });
      }
    }

    // Pass 2: 1-to-1 amount match WITHOUT counterpart (weaker, but still useful)
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);

      const amountMatches = invList.filter(
        (inv) => !usedInvIds.has(inv.id) && Math.abs(inv.grossAmount - absAmt) < 0.02,
      );

      if (amountMatches.length === 1) {
        // Unique amount match - safe even without name match
        usedBsIds.add(bs.id);
        usedInvIds.add(amountMatches[0].id);
        matches.push({ bs, invoices: [amountMatches[0]], type: "single", confidence: 0.2 });
      }
    }

    // Pass 3: multi-invoice matching (one bank transfer = sum of N invoices from same counterpart)
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);
      const extracted = extractCounterpart(bs.description);
      if (!extracted) continue; // Need counterpart for multi-match

      // Find all unused invoices from matching counterpart
      const candidateInvs = invList.filter((inv) => {
        if (usedInvIds.has(inv.id)) return false;
        const score = counterpartMatch(extracted, inv.counterpart);
        return score >= 0.4;
      });

      if (candidateInvs.length < 2) continue;

      // Try combinations (up to 6 invoices)
      const found = findSubsetSum(candidateInvs, absAmt, 6);
      if (found) {
        usedBsIds.add(bs.id);
        for (const inv of found) usedInvIds.add(inv.id);
        matches.push({ bs, invoices: found, type: "multi", confidence: 0.8 });
      }
    }
  }

  matchDirection(inflows, activeInv);
  matchDirection(outflows, passiveInv);

  console.log(
    `\nMatch trovati: ${matches.length} (${matches.filter((m) => m.type === "single").length} singoli, ${matches.filter((m) => m.type === "multi").length} multipli)`,
  );

  for (const m of matches) {
    const invDesc = m.invoices
      .map((i) => `Fatt.${i.number} (${i.counterpart.slice(0, 25)}) ${i.grossAmount.toFixed(2)}€`)
      .join(" + ");
    console.log(
      `  [${m.type}${m.confidence >= 0.5 ? " STRONG" : ""}] BS ${m.bs.date.toISOString().slice(0, 10)} ${m.bs.amount.toFixed(2)}€ → ${invDesc}`,
    );
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Nessuna modifica applicata.");
    await prisma.$disconnect();
    return;
  }

  // Apply matches
  console.log("\nApplicazione match...");
  let appliedCount = 0;
  for (const match of matches) {
    try {
      // Mark BS as reconciled (link to first invoice)
      await prisma.bankStatement.update({
        where: { id: match.bs.id },
        data: {
          isReconciled: true,
          reconciledInvoiceId: match.invoices[0].id,
          reconciledAt: new Date(),
        },
      });

      // Mark all matched invoices as PAID with paidAt = BS date
      for (const inv of match.invoices) {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: "PAID", paidAt: match.bs.date },
        });
      }

      appliedCount++;
    } catch (e) {
      console.error(`  Errore: BS ${match.bs.id}:`, e);
    }
  }
  console.log(
    `  ${appliedCount} match applicati (${matches.reduce((s, m) => s + m.invoices.length, 0)} fatture aggiornate).`,
  );

  // Report remaining
  const remaining = await prisma.invoice.count({
    where: { organizationId: org.id, direction: "ACTIVE", status: { in: ["PENDING", "OVERDUE"] } },
  });
  const remainingBs = await prisma.bankStatement.count({
    where: { organizationId: org.id, isReconciled: false, amount: { gt: 0 } },
  });
  console.log(`\nFatture ACTIVE ancora non pagate: ${remaining}`);
  console.log(`Movimenti in entrata ancora non riconciliati: ${remainingBs}`);

  await prisma.$disconnect();
  console.log("Done.");
}

/**
 * Find a subset of invoices whose grossAmounts sum to the target (within tolerance).
 * Uses DFS with pruning, limited to maxSize items.
 */
function findSubsetSum(invoices: InvRow[], target: number, maxSize: number): InvRow[] | null {
  // Sort descending for better pruning
  const sorted = [...invoices].sort((a, b) => b.grossAmount - a.grossAmount);
  const tolerance = 0.02;

  let result: InvRow[] | null = null;

  function dfs(idx: number, current: InvRow[], remaining: number) {
    if (result) return; // Already found
    if (Math.abs(remaining) < tolerance) {
      result = [...current];
      return;
    }
    if (remaining < -tolerance) return; // Overshot
    if (current.length >= maxSize) return;
    if (idx >= sorted.length) return;

    for (let i = idx; i < sorted.length; i++) {
      if (sorted[i].grossAmount > remaining + tolerance) continue; // Too large
      current.push(sorted[i]);
      dfs(i + 1, current, remaining - sorted[i].grossAmount);
      current.pop();
      if (result) return;
    }
  }

  dfs(0, [], target);
  return result;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
