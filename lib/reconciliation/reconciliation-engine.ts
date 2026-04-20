import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ProposedMatch {
  bankStatementId: string;
  bankStatementDate: Date;
  bankStatementDescription: string;
  bankStatementAmount: number;
  invoiceId: string;
  invoiceNumber: string;
  invoiceCounterpart: string;
  invoiceGrossAmount: number;
  confidence: "exact" | "approximate";
}

export interface ConfirmMatchInput {
  bankStatementId: string;
  invoiceId: string;
  accepted: boolean;
}

// Words to ignore when matching counterpart names
const STOP_WORDS = new Set([
  "srl",
  "spa",
  "snc",
  "sas",
  "srls",
  "di",
  "e",
  "la",
  "il",
  "lo",
  "s.r.l.",
  "s.p.a.",
  "s.r.l",
  "s.n.c",
  "s.a.s",
  "societa",
  "società",
  "cooperativa",
  "sociale",
  "associazione",
  "fondazione",
  "ets",
  "odv",
  "aps",
]);

// Keywords indicating non-invoice movements (fees, taxes, salaries, etc.)
const NON_INVOICE_KEYWORDS = [
  "commissione",
  "commissioni",
  "canone",
  "imposta",
  "bollo",
  "interessi",
  "rata mutuo",
  "competenze",
  "spese tenuta",
  "tassa",
  "addebito",
  "recupero spese",
  "f24",
  "tribut",
  "stipend",
  "salari",
  "contribut",
];

// ─── Extraction helpers ──────────────────────────────────────

/**
 * Extract counterpart name from Italian bank description patterns.
 * Ordered by specificity — first match wins.
 *
 * Patterns:
 *  1. "DA: NAME PER:"        — Intesa, BPM (colon-separated)
 *  2. "DA  NAME PER"         — UniCredit (multi-space)
 *  3. "DA  NAME TRN..." / EOL — UniCredit (no PER)
 *  4. "A: NAME PER|TRN"      — outgoing (colon or multi-space)
 *  5. "SDD da IBAN NAME mandato" — SEPA DD
 *  6. "ORD: NAME" / "ORDINANTE: NAME"
 *  7. "BEN: NAME" / "BENEFICIARIO: NAME"
 */
const COUNTERPART_PATTERNS: RegExp[] = [
  /\bDA:\s*(.+?)\s+PER:/i,
  /\bDA\s{2,}(.+?)\s{1,}PER\b/i,
  /\bDA\s{2,}(.+?)\s{1,}(?:TRN|$)/i,
  /\bA[:\s]\s*(.{4,}?)\s+(?:PER|TRN)\b/i,
  /SDD\s+da\s+IT\w+\s+(?:DLL\s+)?(.+?)\s+mandato/i,
  /\bORD(?:INANTE)?:\s*(.+?)(?:\s+(?:BEN|PER|TRN)|$)/i,
  /\bBEN(?:EFICIARIO)?:\s*(.+?)(?:\s+(?:PER|TRN|CAUS)|$)/i,
];

function extractCounterpartFromDescription(
  description: string,
  customPatterns?: RegExp[],
): string | null {
  // Try custom patterns first (user-trained)
  const allPatterns = customPatterns
    ? [...customPatterns, ...COUNTERPART_PATTERNS]
    : COUNTERPART_PATTERNS;

  for (const re of allPatterns) {
    const match = description.match(re);
    if (match && match[1]?.trim().length > 2) return match[1].trim();
  }

  return null;
}

/**
 * Extract invoice number references from Italian bank descriptions.
 *
 * Patterns: FT 113, FT.110, FATT. 108, FATT 108, fattura n. 162, ft 151,
 *           FATT. N. 148, ftt 1201, FT 113/2025
 *
 * Returns the numeric part (e.g. "113" from "FT 113/2025").
 */
const INVOICE_REF_PATTERN = /\bF(?:ATT(?:URA)?|TT?)\.?\s*(?:N(?:UM|R)?\.?\s*)?(\d+)/gi;

function extractInvoiceRefs(description: string, customPatterns?: RegExp[]): string[] {
  const refs: string[] = [];

  // Try custom patterns first
  if (customPatterns) {
    for (const re of customPatterns) {
      const pattern = new RegExp(re.source, re.flags);
      let m;
      while ((m = pattern.exec(description)) !== null) {
        if (m[1]) refs.push(m[1]);
      }
    }
  }

  // Built-in pattern
  const re = new RegExp(INVOICE_REF_PATTERN.source, INVOICE_REF_PATTERN.flags);
  let m;
  while ((m = re.exec(description)) !== null) {
    refs.push(m[1]);
  }
  return [...new Set(refs)];
}

/**
 * Check if an invoice number matches any of the extracted refs from a description.
 * Handles variations like invoice "113/2025" matching extracted ref "113".
 */
function matchesInvoiceNumber(invoiceNumber: string, extractedRefs: string[]): boolean {
  if (extractedRefs.length === 0) return false;
  // Extract leading digits from invoice number (e.g. "113" from "113/2025")
  const invNumMatch = invoiceNumber.match(/(\d+)/);
  if (!invNumMatch) return false;
  const invNum = invNumMatch[1];
  return extractedRefs.some((ref) => ref === invNum);
}

/**
 * Check if a bank statement description contains significant parts of
 * an invoice counterpart name. Used to match e.g. "ARTIMEC GROUP S.R.L."
 * in the description to "ARTIMEC GROUP SRL" in the invoice.
 */
function matchesCounterpart(bsDescriptionLower: string, invoiceCounterpart: string): boolean {
  // Split counterpart into significant words (>2 chars, not stop words)
  const parts = invoiceCounterpart
    .toLowerCase()
    .split(/[\s.\-,]+/)
    .filter((p) => p.length > 2 && !STOP_WORDS.has(p));

  if (parts.length === 0) return false;

  // At least one significant word must appear in the BS description
  return parts.some((part) => bsDescriptionLower.includes(part));
}

/**
 * Compare an extracted counterpart from the BS description against the
 * invoice counterpart using fuzzy word matching. Requires majority overlap.
 */
function matchesExtractedCounterpart(
  extractedCounterpart: string,
  invoiceCounterpart: string,
): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .split(/[\s.\-,]+/)
      .filter((p) => p.length > 2 && !STOP_WORDS.has(p));

  const extractedParts = normalize(extractedCounterpart);
  const invoiceParts = normalize(invoiceCounterpart);

  if (extractedParts.length === 0 || invoiceParts.length === 0) return false;

  // Count how many significant words from the invoice appear in the extracted name
  const matched = invoiceParts.filter((p) =>
    extractedParts.some((ep) => ep.includes(p) || p.includes(ep)),
  ).length;

  // Require at least half of significant words match
  return matched >= Math.ceil(invoiceParts.length / 2);
}

// ─── Main matching ──────────────────────────────────────────

/**
 * Find potential matches between unreconciled bank statements and pending invoices.
 * Amount < 0 → match PASSIVE invoices, amount > 0 → match ACTIVE invoices.
 *
 * Matching signals (in priority order):
 *  1. Invoice number extracted from description matches invoice.number
 *  2. Counterpart name extracted from description matches invoice counterpart
 *  3. Invoice counterpart words found in BS description (legacy)
 *  4. Date proximity (tiebreaker)
 */
export async function findMatches(
  organizationId: string,
  bankStatementIds?: string[],
): Promise<ProposedMatch[]> {
  const bankStatements = await prisma.bankStatement.findMany({
    where: {
      organizationId,
      isReconciled: false,
      ...(bankStatementIds?.length ? { id: { in: bankStatementIds } } : {}),
    },
    orderBy: { date: "asc" },
  });

  const pendingInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      OR: [
        { status: "PENDING" },
        { status: "PAID", bankStatements: { none: { isReconciled: true } } },
      ],
    },
    select: {
      id: true,
      number: true,
      counterpart: true,
      grossAmount: true,
      direction: true,
      dueDate: true,
      date: true,
    },
  });

  const matches: ProposedMatch[] = [];
  const usedInvoiceIds = new Set<string>();
  const usedBsIds = new Set<string>();

  for (const bs of bankStatements) {
    if (usedBsIds.has(bs.id)) continue;

    const bsAmount = Number(bs.amount);
    const targetDirection = bsAmount < 0 ? "PASSIVE" : "ACTIVE";
    const absAmount = Math.abs(bsAmount);
    const bsDescLower = bs.description.toLowerCase();

    // Extract structured info from description
    const extractedCounterpart = extractCounterpartFromDescription(bs.description);
    const extractedInvoiceRefs = extractInvoiceRefs(bs.description);

    let bestMatch: {
      invoice: (typeof pendingInvoices)[0];
      confidence: "exact" | "approximate";
      dateDiff: number;
      score: number; // higher = better
    } | null = null;

    for (const inv of pendingInvoices) {
      if (usedInvoiceIds.has(inv.id)) continue;
      if (inv.direction !== targetDirection) continue;

      const invAmount = Number(inv.grossAmount);
      const amountDiff = Math.abs(absAmount - invAmount);

      // Check date proximity
      const refDate = inv.dueDate ?? inv.date;
      const dateDiff = Math.abs((bs.date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

      // Score signals
      const invoiceRefMatch = matchesInvoiceNumber(inv.number, extractedInvoiceRefs);
      const extractedNameMatch = extractedCounterpart
        ? matchesExtractedCounterpart(extractedCounterpart, inv.counterpart)
        : false;
      const nameMatch = matchesCounterpart(bsDescLower, inv.counterpart);

      // Any counterpart/ref signal present?
      const hasSignal = invoiceRefMatch || extractedNameMatch || nameMatch;

      // Gate: require counterpart/ref signal OR exact amount — amount alone is last resort
      if (!hasSignal && amountDiff > 0.01) continue;

      // Allow wider date window for strong signals
      const maxDateDiff = hasSignal ? 90 : 15;
      if (dateDiff > maxDateDiff) continue;

      const confidence: "exact" | "approximate" = amountDiff < 0.005 ? "exact" : "approximate";

      // Score: invoice ref (100) > counterpart (50/20) > amount match (10) > date proximity
      let score = 0;
      if (invoiceRefMatch) score += 100;
      if (extractedNameMatch) score += 50;
      if (nameMatch) score += 20;
      if (amountDiff < 0.01) score += 10;
      score += Math.max(0, 10 - dateDiff / 10);

      if (
        !bestMatch ||
        score > bestMatch.score ||
        (score === bestMatch.score && dateDiff < bestMatch.dateDiff)
      ) {
        bestMatch = { invoice: inv, confidence, dateDiff, score };
      }
    }

    if (bestMatch) {
      usedInvoiceIds.add(bestMatch.invoice.id);
      usedBsIds.add(bs.id);

      matches.push({
        bankStatementId: bs.id,
        bankStatementDate: bs.date,
        bankStatementDescription: bs.description,
        bankStatementAmount: bsAmount,
        invoiceId: bestMatch.invoice.id,
        invoiceNumber: bestMatch.invoice.number,
        invoiceCounterpart: bestMatch.invoice.counterpart,
        invoiceGrossAmount: Number(bestMatch.invoice.grossAmount),
        confidence: bestMatch.confidence,
      });
    }
  }

  return matches;
}

/**
 * Confirm reconciliation matches.
 * For accepted matches: BS → isReconciled=true, Invoice → status=PAID.
 */
export async function confirmMatches(
  organizationId: string,
  matches: ConfirmMatchInput[],
): Promise<{ reconciled: number; rejected: number }> {
  const accepted = matches.filter((m) => m.accepted);
  const rejected = matches.filter((m) => !m.accepted);

  await prisma.$transaction(
    async (tx) => {
      for (const match of accepted) {
        // Verify ownership
        const bs = await tx.bankStatement.findFirst({
          where: { id: match.bankStatementId, organizationId, isReconciled: false },
        });
        if (!bs) continue;

        const inv = await tx.invoice.findFirst({
          where: { id: match.invoiceId, organizationId },
        });
        if (!inv) continue;

        await tx.bankStatement.update({
          where: { id: match.bankStatementId },
          data: {
            isReconciled: true,
            reconciledInvoiceId: match.invoiceId,
            reconciledAt: new Date(),
          },
        });

        await tx.invoice.update({
          where: { id: match.invoiceId },
          data: {
            status: "PAID",
            paidAt: bs.date,
          },
        });
      }
    },
    { timeout: 60000 },
  );

  return {
    reconciled: accepted.length,
    rejected: rejected.length,
  };
}

// ─── Enhanced 3-pass reconciliation ─────────────────────────

export interface EnhancedMatch {
  bankStatementId: string;
  bankStatementDate: string;
  bankStatementDescription: string;
  bankStatementAmount: number;
  invoices: Array<{
    id: string;
    number: string;
    counterpart: string;
    grossAmount: number;
  }>;
  type: "single" | "multi" | "expense" | "expectedPayable";
  confidence: number; // 0-100
  pass: 1 | 1.5 | 2 | 3;
  recurringExpenseId?: string;
  recurringExpenseName?: string;
  expectedPayableId?: string;
  expectedPayableName?: string;
}

export interface ConfirmEnhancedMatchInput {
  bankStatementId: string;
  invoiceIds?: string[];
  recurringExpenseId?: string;
  expectedPayableId?: string;
  accepted: boolean;
}

// Custom pattern shape from BankProfile.descriptionPatterns
interface DescriptionPatterns {
  counterpartPatterns?: Array<{
    label: string;
    regex: string;
    flags?: string;
    sample: string;
    recurringExpenseId?: string;
  }>;
  invoiceRefPatterns?: Array<{ label: string; regex: string; flags?: string; sample: string }>;
}

function normalize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.'"\-,()]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function counterpartScore(bsDescription: string, invoiceCounterpart: string): number {
  const bsWords = normalize(bsDescription);
  const invWords = normalize(invoiceCounterpart);
  if (invWords.length === 0) return 0;
  const matched = invWords.filter((w) => bsWords.some((bw) => bw.includes(w) || w.includes(bw)));
  return matched.length / invWords.length;
}

function findSubsetSum(
  invoices: Array<{ id: string; number: string; counterpart: string; grossAmount: number }>,
  target: number,
  maxSize: number,
): typeof invoices | null {
  const sorted = [...invoices].sort((a, b) => b.grossAmount - a.grossAmount);
  const tolerance = 0.02;
  let result: typeof invoices | null = null;

  function dfs(idx: number, current: typeof invoices, remaining: number) {
    if (result) return;
    if (Math.abs(remaining) < tolerance) {
      result = [...current];
      return;
    }
    if (remaining < -tolerance) return;
    if (current.length >= maxSize) return;
    if (idx >= sorted.length) return;

    for (let i = idx; i < sorted.length; i++) {
      if (sorted[i].grossAmount > remaining + tolerance) continue;
      current.push(sorted[i]);
      dfs(i + 1, current, remaining - sorted[i].grossAmount);
      current.pop();
      if (result) return;
    }
  }

  dfs(0, [], target);
  return result;
}

/**
 * Load custom regex patterns from BankProfile.descriptionPatterns for the org.
 */
async function loadCustomPatterns(organizationId: string): Promise<{
  counterpart: RegExp[];
  invoiceRef: RegExp[];
  linkedExpenses: Map<string, string>;
}> {
  const counterpart: RegExp[] = [];
  const invoiceRef: RegExp[] = [];
  // Maps regex source → recurringExpenseId for patterns linked to an expense
  const linkedExpenses = new Map<string, string>();

  try {
    const profiles = await prisma.bankProfile.findMany({
      where: {
        bankAccount: { organizationId },
        descriptionPatterns: { not: Prisma.JsonNull },
      },
      select: { descriptionPatterns: true },
    });

    for (const profile of profiles) {
      const patterns = profile.descriptionPatterns as DescriptionPatterns | null;
      if (!patterns) continue;

      for (const p of patterns.counterpartPatterns ?? []) {
        try {
          const re = new RegExp(p.regex, p.flags ?? "i");
          counterpart.push(re);
          if (p.recurringExpenseId) {
            linkedExpenses.set(re.source, p.recurringExpenseId);
          }
        } catch {
          /* skip invalid */
        }
      }
      for (const p of patterns.invoiceRefPatterns ?? []) {
        try {
          invoiceRef.push(new RegExp(p.regex, p.flags ?? "gi"));
        } catch {
          /* skip invalid */
        }
      }
    }
  } catch {
    // descriptionPatterns column may not exist yet — ignore
  }

  return { counterpart, invoiceRef, linkedExpenses };
}

/**
 * Enhanced reconciliation engine.
 * Pass 1a:  Counterpart + Invoice Number (strongest identification, no amount gate)
 * Pass 1b:  Counterpart only — date proximity tiebreaker, then amount
 * Pass 1.5: RecurringExpense matching for outflows
 * Pass 2:   Unique exact-amount match without counterpart (last resort, low confidence)
 * Pass 3:   Multi-invoice subset-sum match (high confidence if counterpart matches)
 */
export async function findMatchesEnhanced(organizationId: string): Promise<EnhancedMatch[]> {
  // Load custom patterns once
  const customPatterns = await loadCustomPatterns(organizationId);
  const customCounterpartPatterns =
    customPatterns.counterpart.length > 0 ? customPatterns.counterpart : undefined;
  const customInvoiceRefPatterns =
    customPatterns.invoiceRef.length > 0 ? customPatterns.invoiceRef : undefined;

  // Load dismissed matches so we skip previously rejected pairs
  let dismissedPairs = new Set<string>();
  try {
    const dismissed = await prisma.dismissedMatch.findMany({
      where: { organizationId },
      select: { bankStatementId: true, targetId: true, targetType: true },
    });
    dismissedPairs = new Set(
      dismissed.map((d) => `${d.bankStatementId}::${d.targetId}::${d.targetType}`),
    );
  } catch {
    // Table may not exist yet — proceed without filtering
  }

  const rawBs = await prisma.bankStatement.findMany({
    where: { organizationId, isReconciled: false },
    orderBy: { date: "asc" },
    select: { id: true, date: true, description: true, amount: true },
  });

  const rawInv = await prisma.invoice.findMany({
    where: {
      organizationId,
      OR: [
        { status: "PENDING" },
        // Include PAID invoices not yet linked to a reconciled bank statement
        // (e.g. marked paid by FiC sync but never reconciled against a BS)
        { status: "PAID", bankStatements: { none: { isReconciled: true } } },
      ],
    },
    select: {
      id: true,
      number: true,
      counterpart: true,
      grossAmount: true,
      direction: true,
      date: true,
      dueDate: true,
      status: true,
    },
  });

  // Load recurring expenses for Pass 1.5
  let recurringExpenses: Array<{
    id: string;
    name: string;
    counterpart: string | null;
    amount: number;
  }> = [];
  try {
    const rawExpenses = await prisma.recurringExpense.findMany({
      where: { organizationId },
      select: { id: true, name: true, counterpart: true, amount: true },
    });
    recurringExpenses = rawExpenses.map((e) => ({ ...e, amount: Number(e.amount) }));
  } catch {
    // table may not exist
  }

  const bankStatements = rawBs.map((bs) => ({ ...bs, amount: Number(bs.amount) }));
  const invoices = rawInv.map((inv) => ({ ...inv, grossAmount: Number(inv.grossAmount) }));

  const usedBsIds = new Set<string>();
  const usedInvIds = new Set<string>();
  const matches: EnhancedMatch[] = [];

  const inflows = bankStatements.filter((bs) => bs.amount > 0);
  const outflows = bankStatements.filter((bs) => bs.amount < 0);
  const activeInv = invoices.filter((inv) => inv.direction === "ACTIVE");
  const passiveInv = invoices.filter((inv) => inv.direction === "PASSIVE");

  function isDismissed(bsId: string, targetId: string, targetType: string): boolean {
    return dismissedPairs.has(`${bsId}::${targetId}::${targetType}`);
  }

  function matchDirection(bsList: typeof bankStatements, invList: typeof invoices) {
    // ── Pass 1a: Counterpart + Invoice Number (strongest identification) ──
    // No amount gate — invoice ref + counterpart is definitive identification.
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);
      const extracted = extractCounterpartFromDescription(
        bs.description,
        customCounterpartPatterns,
      );
      const invoiceRefs = extractInvoiceRefs(bs.description, customInvoiceRefPatterns);

      if (invoiceRefs.length === 0) continue; // No ref → skip to Pass 1b

      let best: { inv: (typeof invList)[0]; cpScore: number; amountDiff: number } | null = null;

      for (const inv of invList) {
        if (usedInvIds.has(inv.id)) continue;
        if (isDismissed(bs.id, inv.id, "INVOICE")) continue;
        if (!matchesInvoiceNumber(inv.number, invoiceRefs)) continue;

        // Counterpart score for disambiguation (same invoice # from different suppliers)
        let cpScore = counterpartScore(bs.description, inv.counterpart);
        if (extracted) {
          cpScore = Math.max(cpScore, counterpartScore(extracted, inv.counterpart));
        }

        const amountDiff = Math.abs(inv.grossAmount - absAmt);

        if (
          !best ||
          cpScore > best.cpScore ||
          (cpScore === best.cpScore && amountDiff < best.amountDiff)
        ) {
          best = { inv, cpScore, amountDiff };
        }
      }

      if (best) {
        usedBsIds.add(bs.id);
        usedInvIds.add(best.inv.id);
        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: [
            {
              id: best.inv.id,
              number: best.inv.number,
              counterpart: best.inv.counterpart,
              grossAmount: best.inv.grossAmount,
            },
          ],
          type: "single",
          confidence: best.cpScore >= 0.4 ? 95 : 85,
          pass: 1,
        });
      }
    }

    // ── Pass 1b: Counterpart only (no invoice ref extracted or matched) ──
    // Uses date proximity as primary tiebreaker, amount as secondary.
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);
      const extracted = extractCounterpartFromDescription(
        bs.description,
        customCounterpartPatterns,
      );

      // Skip non-invoice movements (fees, taxes, etc.)
      if (NON_INVOICE_KEYWORDS.some((kw) => bs.description.toLowerCase().includes(kw))) continue;

      let best: {
        inv: (typeof invList)[0];
        cpScore: number;
        dateDiff: number;
        amountDiff: number;
      } | null = null;

      for (const inv of invList) {
        if (usedInvIds.has(inv.id)) continue;
        if (isDismissed(bs.id, inv.id, "INVOICE")) continue;

        let cpScore = counterpartScore(bs.description, inv.counterpart);
        if (extracted) {
          cpScore = Math.max(cpScore, counterpartScore(extracted, inv.counterpart));
        }

        if (cpScore < 0.4) continue;

        const refDate = inv.dueDate ?? inv.date;
        const dateDiff = refDate
          ? Math.abs((bs.date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const amountDiff = Math.abs(inv.grossAmount - absAmt);

        // Tiebreaker priority: higher cpScore → closer date (3-day tolerance) → closer amount
        if (
          !best ||
          cpScore > best.cpScore ||
          (cpScore === best.cpScore && dateDiff < best.dateDiff - 3) ||
          (cpScore === best.cpScore &&
            Math.abs(dateDiff - best.dateDiff) <= 3 &&
            amountDiff < best.amountDiff)
        ) {
          best = { inv, cpScore, dateDiff, amountDiff };
        }
      }

      if (best) {
        usedBsIds.add(bs.id);
        usedInvIds.add(best.inv.id);
        const amountPct = absAmt > 0 ? Math.abs(best.inv.grossAmount - absAmt) / absAmt : 1;
        let confidence: number;
        if (amountPct < 0.02) confidence = 70;
        else if (amountPct < 0.1) confidence = 60;
        else if (amountPct < 0.3) confidence = 50;
        else confidence = 40;

        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: [
            {
              id: best.inv.id,
              number: best.inv.number,
              counterpart: best.inv.counterpart,
              grossAmount: best.inv.grossAmount,
            },
          ],
          type: "single",
          confidence,
          pass: 1,
        });
      }
    }

    // ── Pass 2: Unique exact-amount match (last resort, no counterpart signal) ──
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;

      // Skip non-invoice movements (handled by Pass 1.5 expense matching)
      if (NON_INVOICE_KEYWORDS.some((kw) => bs.description.toLowerCase().includes(kw))) continue;

      const absAmt = Math.abs(bs.amount);

      const amountMatches = invList.filter(
        (inv) =>
          !usedInvIds.has(inv.id) &&
          !isDismissed(bs.id, inv.id, "INVOICE") &&
          Math.abs(inv.grossAmount - absAmt) < 0.02,
      );

      if (amountMatches.length === 1) {
        usedBsIds.add(bs.id);
        usedInvIds.add(amountMatches[0].id);
        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: [
            {
              id: amountMatches[0].id,
              number: amountMatches[0].number,
              counterpart: amountMatches[0].counterpart,
              grossAmount: amountMatches[0].grossAmount,
            },
          ],
          type: "single",
          confidence: 25,
          pass: 2,
        });
      }
    }

    // Pass 3: Multi-invoice (subset-sum)
    for (const bs of bsList) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);
      const extracted = extractCounterpartFromDescription(
        bs.description,
        customCounterpartPatterns,
      );
      if (!extracted) continue;

      const candidates = invList.filter((inv) => {
        if (usedInvIds.has(inv.id)) return false;
        if (isDismissed(bs.id, inv.id, "INVOICE")) return false;
        return counterpartScore(extracted, inv.counterpart) >= 0.4;
      });

      if (candidates.length < 2) continue;

      const found = findSubsetSum(
        candidates.map((c) => ({
          id: c.id,
          number: c.number,
          counterpart: c.counterpart,
          grossAmount: c.grossAmount,
        })),
        absAmt,
        6,
      );

      if (found) {
        usedBsIds.add(bs.id);
        for (const inv of found) usedInvIds.add(inv.id);
        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: found,
          type: "multi",
          confidence: 75,
          pass: 3,
        });
      }
    }
  }

  matchDirection(inflows, activeInv);
  matchDirection(outflows, passiveInv);

  // Pass 1.25: Custom pattern → linked RecurringExpense (outflows only)
  // For patterns explicitly linked to a recurring expense via the training wizard,
  // match outflows by regex + amount ±10% → confidence 90.
  if (customPatterns.linkedExpenses.size > 0 && recurringExpenses.length > 0) {
    for (const bs of outflows) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);

      for (const re of customPatterns.counterpart) {
        const expenseId = customPatterns.linkedExpenses.get(re.source);
        if (!expenseId) continue;

        re.lastIndex = 0;
        if (!re.test(bs.description)) continue;

        if (isDismissed(bs.id, expenseId, "EXPENSE")) continue;

        const expense = recurringExpenses.find((e) => e.id === expenseId);
        if (!expense) continue;

        // Amount within ±10%
        if (Math.abs(expense.amount - absAmt) > expense.amount * 0.1) continue;

        usedBsIds.add(bs.id);
        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: [],
          type: "expense",
          confidence: 90,
          pass: 1.5,
          recurringExpenseId: expense.id,
          recurringExpenseName: expense.name,
        });
        break; // First matching pattern wins for this BS
      }
    }
  }

  // Pass 1.5: RecurringExpense matching (outflows only)
  if (recurringExpenses.length > 0) {
    for (const bs of outflows) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);

      let bestExpense: { expense: (typeof recurringExpenses)[0]; score: number } | null = null;

      for (const expense of recurringExpenses) {
        if (isDismissed(bs.id, expense.id, "EXPENSE")) continue;
        // Amount must be within ±5%
        if (Math.abs(expense.amount - absAmt) > expense.amount * 0.05) continue;

        const matchName = expense.counterpart ?? expense.name;
        const score = counterpartScore(bs.description, matchName);

        if (score >= 0.4 && (!bestExpense || score > bestExpense.score)) {
          bestExpense = { expense, score };
        }
      }

      if (bestExpense) {
        usedBsIds.add(bs.id);
        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: [],
          type: "expense",
          confidence: Math.round(Math.min(100, bestExpense.score * 100 + 20)),
          pass: 1.5,
          recurringExpenseId: bestExpense.expense.id,
          recurringExpenseName: bestExpense.expense.name,
        });
      }
    }
  }

  // Pass 1.6: ExpectedPayable matching (outflows only)
  let expectedPayables: Array<{
    id: string;
    description: string;
    counterpart: string;
    amount: number;
  }> = [];
  try {
    const rawPayables = await prisma.expectedPayable.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true, description: true, counterpart: true, amount: true },
    });
    expectedPayables = rawPayables.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));
  } catch {
    // table may not exist
  }

  if (expectedPayables.length > 0) {
    for (const bs of outflows) {
      if (usedBsIds.has(bs.id)) continue;
      const absAmt = Math.abs(bs.amount);

      let bestPayable: { payable: (typeof expectedPayables)[0]; score: number } | null = null;

      for (const payable of expectedPayables) {
        if (isDismissed(bs.id, payable.id, "EXPECTED_PAYABLE")) continue;
        // Amount tolerance: ±15% of the per-invoice amount
        if (Math.abs(payable.amount - absAmt) > payable.amount * 0.15) continue;

        const score = counterpartScore(bs.description, payable.counterpart);

        if (score >= 0.4 && (!bestPayable || score > bestPayable.score)) {
          bestPayable = { payable, score };
        }
      }

      if (bestPayable) {
        usedBsIds.add(bs.id);
        matches.push({
          bankStatementId: bs.id,
          bankStatementDate: bs.date.toISOString(),
          bankStatementDescription: bs.description,
          bankStatementAmount: bs.amount,
          invoices: [],
          type: "expectedPayable",
          confidence: Math.round(Math.min(100, bestPayable.score * 100 + 20)),
          pass: 1.5,
          expectedPayableId: bestPayable.payable.id,
          expectedPayableName: bestPayable.payable.description,
        });
      }
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Confirm enhanced matches (supports multi-invoice and expense matches).
 */
export async function confirmMatchesEnhanced(
  organizationId: string,
  matches: ConfirmEnhancedMatchInput[],
): Promise<{ reconciled: number; rejected: number }> {
  const accepted = matches.filter((m) => m.accepted);
  const rejected = matches.filter((m) => !m.accepted);

  await prisma.$transaction(
    async (tx) => {
      for (const match of accepted) {
        const bs = await tx.bankStatement.findFirst({
          where: { id: match.bankStatementId, organizationId, isReconciled: false },
        });
        if (!bs) continue;

        if (match.expectedPayableId) {
          // Expected payable match — just mark bank statement as reconciled
          await tx.bankStatement.update({
            where: { id: match.bankStatementId },
            data: {
              isReconciled: true,
              reconciledAt: new Date(),
            },
          });
        } else if (match.recurringExpenseId) {
          // Expense match
          const updateData: Record<string, unknown> = {
            isReconciled: true,
            reconciledAt: new Date(),
          };
          // Use reconciledExpenseId + reconciledType if columns exist (migration-v2)
          try {
            await tx.bankStatement.update({
              where: { id: match.bankStatementId },
              data: {
                ...updateData,
                reconciledExpenseId: match.recurringExpenseId,
                reconciledType: "EXPENSE",
              },
            });
          } catch {
            // Columns may not exist yet — fallback to basic reconciliation
            await tx.bankStatement.update({
              where: { id: match.bankStatementId },
              data: updateData,
            });
          }
        } else {
          // Invoice match
          const invoiceIds = match.invoiceIds ?? [];
          const updateData: Record<string, unknown> = {
            isReconciled: true,
            reconciledInvoiceId: invoiceIds[0] ?? null,
            reconciledAt: new Date(),
          };
          try {
            await tx.bankStatement.update({
              where: { id: match.bankStatementId },
              data: { ...updateData, reconciledInvoiceIds: invoiceIds, reconciledType: "INVOICE" },
            });
          } catch {
            await tx.bankStatement.update({
              where: { id: match.bankStatementId },
              data: updateData,
            });
          }

          for (const invoiceId of invoiceIds) {
            const inv = await tx.invoice.findFirst({
              where: { id: invoiceId, organizationId },
            });
            if (!inv) continue;

            await tx.invoice.update({
              where: { id: invoiceId },
              data: { status: "PAID", paidAt: bs.date },
            });
          }
        }
      }
    },
    { timeout: 60000 },
  );

  return {
    reconciled: accepted.length,
    rejected: rejected.length,
  };
}
