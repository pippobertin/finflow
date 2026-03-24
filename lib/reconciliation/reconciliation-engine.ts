import { prisma } from "@/lib/prisma";

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

// ─── Extraction helpers ──────────────────────────────────────

/**
 * Extract counterpart name from common Italian bank description patterns.
 *
 * Patterns handled:
 *  - "BONIFICO SEPA DA  {NAME} PER"   (incoming transfers)
 *  - "BONIFICO ... A  {NAME} PER"     (outgoing transfers)
 *  - "SDD da {IBAN} {NAME} mandato"   (SEPA direct debit)
 */
function extractCounterpartFromDescription(description: string): string | null {
  // 1. Incoming: "DA  {NAME} PER" (2+ spaces after DA)
  let match = description.match(/\bDA\s{2,}(.+?)\s{1,}PER\b/i);
  if (match && match[1].trim().length > 2) return match[1].trim();

  // 2. Outgoing: "A  {NAME} PER" (2+ spaces after A, at least 4 chars of name)
  match = description.match(/\bA\s{2,}(.+?)\s{1,}(?:PER|TRN)\b/i);
  if (match && match[1].trim().length > 3) return match[1].trim();

  // 3. SEPA DD: "SDD da {IBAN} [DLL] {NAME} mandato"
  match = description.match(/SDD\s+da\s+IT\w+\s+(?:DLL\s+)?(.+?)\s+mandato/i);
  if (match && match[1].trim().length > 2) return match[1].trim();

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
function extractInvoiceRefs(description: string): string[] {
  const refs: string[] = [];
  // Match: F + ATT/ATTURA or TT? → optional dot → optional N. → digits
  const re = /\bF(?:ATT(?:URA)?|TT?)\.?\s*(?:N\.?\s*)?(\d+)/gi;
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
      status: "PENDING",
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

      if (amountDiff > 0.01) continue;

      // Check date proximity
      const refDate = inv.dueDate ?? inv.date;
      const dateDiff = Math.abs((bs.date.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

      // Score signals
      const invoiceRefMatch = matchesInvoiceNumber(inv.number, extractedInvoiceRefs);
      const extractedNameMatch = extractedCounterpart
        ? matchesExtractedCounterpart(extractedCounterpart, inv.counterpart)
        : false;
      const nameMatch = matchesCounterpart(bsDescLower, inv.counterpart);

      // Any name/ref signal present?
      const hasSignal = invoiceRefMatch || extractedNameMatch || nameMatch;

      // Allow wider date window for strong signals
      const maxDateDiff = hasSignal ? 90 : 15;
      if (dateDiff > maxDateDiff) continue;

      const confidence = amountDiff < 0.005 ? "exact" : "approximate";

      // Compute score: invoice ref match is strongest, then extracted name, then word match
      let score = 0;
      if (invoiceRefMatch) score += 100;
      if (extractedNameMatch) score += 50;
      if (nameMatch) score += 20;
      // Closer dates score higher (subtract normalized date diff)
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

  await prisma.$transaction(async (tx) => {
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
  });

  return {
    reconciled: accepted.length,
    rejected: rejected.length,
  };
}
