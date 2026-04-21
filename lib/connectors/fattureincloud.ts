// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — Legacy connector, behind LEGACY_FATTUREINCLOUD flag. Will be removed in Block D.
import { prisma } from "@/lib/prisma";
import { autoTagInvoices } from "@/lib/tagging/auto-tagger";

const FIC_BASE = "https://api-v2.fattureincloud.it";
const PER_PAGE = 50;

// ─── Types ──────────────────────────────────────────────────

export interface FicConfig {
  accessToken: string;
  companyId: string;
  syncFromDate?: string;
  syncToDate?: string;
}

export interface FicCompany {
  id: number;
  name: string;
  type?: string;
  access_token?: string;
  connection_id?: number;
  tax_code?: string;
  vat_number?: string;
}

interface FicEntity {
  id: number;
  name: string;
  vat_number?: string;
}

interface FicPaymentSummary {
  payment_date?: string;
}

interface FicItemsListItem {
  description?: string;
  qty?: number;
  net_price?: number;
  amount_net?: number;
}

interface FicDocument {
  id: number;
  type?: string;
  number?: string | number;
  numeration?: string;
  invoice_number?: string; // Numero fattura fornitore (solo received_documents)
  date?: string;
  next_due_date?: string;
  entity?: FicEntity;
  description?: string;
  amount_net?: number;
  amount_vat?: number;
  amount_gross?: number;
  amount_due_discount?: number;
  is_marked?: boolean;
  payments_sum?: FicPaymentSummary[];
  payment_method?: { paid_date?: string };
  items_list?: FicItemsListItem[];
}

interface FicListResponse {
  current_page: number;
  last_page: number;
  data: FicDocument[];
}

// ─── API helpers ────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

/**
 * Fetch the list of companies accessible with this token.
 * GET /user/companies
 */
export async function fetchCompanies(accessToken: string): Promise<FicCompany[]> {
  const res = await fetch(`${FIC_BASE}/user/companies`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Errore recupero aziende (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data: { companies: FicCompany[] } };
  return json.data.companies;
}

// ─── Paginated fetch ────────────────────────────────────────

function buildDateQuery(fromDate: string, toDate?: string): string {
  const parts = [`date >= '${fromDate}'`];
  if (toDate) parts.push(`date <= '${toDate}'`);
  return parts.join(" and ");
}

async function fetchIssuedDocuments(
  token: string,
  companyId: string,
  dateQuery: string,
  page: number,
): Promise<FicListResponse> {
  const params = new URLSearchParams({
    type: "invoice",
    fieldset: "detailed",
    per_page: String(PER_PAGE),
    page: String(page),
    sort: "-date",
    q: dateQuery,
  });

  const url = `${FIC_BASE}/c/${companyId}/issued_documents?${params}`;
  console.log("[FiC] GET issued_documents:", url);

  const res = await fetch(url, { headers: authHeaders(token) });

  if (!res.ok) {
    const body = await res.text();
    console.error("[FiC] issued_documents error:", res.status, body.slice(0, 500));
    throw new Error(`Errore fetch fatture attive (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json();
}

async function fetchReceivedDocuments(
  token: string,
  companyId: string,
  dateQuery: string,
  page: number,
): Promise<FicListResponse> {
  const params = new URLSearchParams({
    type: "expense",
    fieldset: "detailed",
    per_page: String(PER_PAGE),
    page: String(page),
    sort: "-date",
    q: dateQuery,
  });

  const url = `${FIC_BASE}/c/${companyId}/received_documents?${params}`;
  console.log("[FiC] GET received_documents:", url);

  const res = await fetch(url, { headers: authHeaders(token) });

  if (!res.ok) {
    const body = await res.text();
    console.error("[FiC] received_documents error:", res.status, body);
    throw new Error(`Errore fetch fatture passive (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = await res.json();
  console.log("[FiC] received_documents page", page, "→", json.data?.length ?? 0, "docs");
  return json;
}

async function fetchAllPages(
  fetcher: (page: number) => Promise<FicListResponse>,
): Promise<FicDocument[]> {
  const all: FicDocument[] = [];
  let page = 1;

  while (true) {
    const response = await fetcher(page);
    all.push(...response.data);
    if (response.data.length < PER_PAGE) break;
    page++;
  }

  return all;
}

// ─── Mapping FiC → fin_invoice ──────────────────────────────

function buildConnectorRef(direction: "ACTIVE" | "PASSIVE", ficId: number): string {
  return `fic:${direction === "ACTIVE" ? "issued" : "received"}:${ficId}`;
}

function mapFicStatus(doc: FicDocument): "PAID" | "PENDING" {
  // 1. is_marked is the most reliable indicator (user marked as paid in FiC)
  if (doc.is_marked === true) {
    return "PAID";
  }

  // 2. Has payment records with dates → paid
  if (doc.payments_sum?.length) {
    const lastPayment = doc.payments_sum[doc.payments_sum.length - 1];
    if (lastPayment.payment_date) {
      return "PAID";
    }
  }

  // NOTE: amount_due_discount is NOT reliable — FiC returns 0 for all invoices
  // when no payment terms are configured. Do NOT use it to determine payment status.

  // Overdue is now determined dynamically from dueDate, not stored as status
  return "PENDING";
}

function mapPaidAt(doc: FicDocument): Date | null {
  if (doc.payment_method?.paid_date) {
    return new Date(doc.payment_method.paid_date);
  }
  if (doc.payments_sum?.length) {
    const last = doc.payments_sum[doc.payments_sum.length - 1];
    if (last.payment_date) return new Date(last.payment_date);
  }
  return null;
}

function buildDescription(doc: FicDocument): string | null {
  if (doc.description) return doc.description;
  if (doc.items_list?.length) {
    return (
      doc.items_list
        .map((item) => item.description)
        .filter(Boolean)
        .join("; ")
        .slice(0, 500) || null
    );
  }
  return null;
}

function formatInvoiceNumber(doc: FicDocument): string {
  const num = String(doc.invoice_number ?? doc.number ?? doc.id);
  if (doc.numeration && doc.numeration !== "0") {
    return `${num}/${doc.numeration}`;
  }
  return num;
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Test connection by verifying the Bearer token and company access.
 */
export async function testConnection(
  config: FicConfig,
): Promise<{ success: boolean; message: string }> {
  if (!config.accessToken || !config.companyId) {
    return { success: false, message: "Access Token o Company ID mancante" };
  }

  try {
    // Verify token is valid via /user/companies
    const companies = await fetchCompanies(config.accessToken);
    const match = companies.find((c) => String(c.id) === config.companyId);

    if (!match) {
      return {
        success: false,
        message: `Token valido, ma l'azienda con ID ${config.companyId} non è accessibile`,
      };
    }

    // Verify we can list issued documents
    const resIssued = await fetch(
      `${FIC_BASE}/c/${config.companyId}/issued_documents?type=invoice&per_page=5&page=1`,
      { headers: authHeaders(config.accessToken) },
    );

    // Verify we can list received documents (type=expense = fatture ricevute)
    const resReceived = await fetch(
      `${FIC_BASE}/c/${config.companyId}/received_documents?type=expense&per_page=5&page=1`,
      { headers: authHeaders(config.accessToken) },
    );

    const issuedOk = resIssued.ok;
    const receivedOk = resReceived.ok;

    console.log("[FiC] test issued_documents:", resIssued.status);
    console.log("[FiC] test received_documents:", resReceived.status);

    if (!issuedOk && !receivedOk) {
      return {
        success: false,
        message: `Azienda "${match.name}" trovata, ma errore accesso documenti (emessi: ${resIssued.status}, ricevuti: ${resReceived.status})`,
      };
    }

    const parts = [`Connessione OK — azienda "${match.name}"`];
    if (!issuedOk) parts.push(`(fatture emesse: errore ${resIssued.status})`);
    if (!receivedOk)
      parts.push(
        `(fatture ricevute: errore ${resReceived.status} — rigenera il token con il permesso "Fatture ricevute" abilitato)`,
      );

    return {
      success: issuedOk || receivedOk,
      message: parts.join(" "),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Errore sconosciuto";
    return { success: false, message: msg };
  }
}

/**
 * Sync invoices from Fatture in Cloud API v2.
 *
 * 1. Fetch all issued_documents (ACTIVE) + received_documents (PASSIVE) from syncFromDate
 * 2. Skip already-imported documents by connectorRef
 * 3. Create fin_invoice + fin_invoice_line records
 * 4. Auto-tag new invoices via auto-tagger
 */
export async function syncInvoices(
  config: FicConfig,
  organizationId: string,
): Promise<{
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  tagged: number;
}> {
  if (!config.accessToken || !config.companyId) {
    return {
      success: false,
      message: "Access Token o Company ID mancante",
      imported: 0,
      skipped: 0,
      tagged: 0,
    };
  }

  const fromDate = config.syncFromDate ?? `${new Date().getFullYear()}-01-01`;
  const dateQuery = buildDateQuery(fromDate, config.syncToDate);

  console.log(
    `[FiC] Sync range: ${fromDate} → ${config.syncToDate ?? "oggi"} | query: ${dateQuery}`,
  );

  // 1. Fetch all documents (paginated, stops when results < per_page)
  // Passive invoices may fail with 403 if token lacks received_documents permission
  const warnings: string[] = [];

  const [issuedDocs, receivedDocs] = await Promise.all([
    fetchAllPages((page) =>
      fetchIssuedDocuments(config.accessToken, config.companyId, dateQuery, page),
    ),
    fetchAllPages((page) =>
      fetchReceivedDocuments(config.accessToken, config.companyId, dateQuery, page),
    ).catch((err: Error) => {
      const is403 = err.message.includes("403");
      if (is403) {
        console.warn("[FiC] Permesso negato per documenti ricevuti — importo solo fatture attive");
        warnings.push(
          "Fatture passive non importate: il token non ha il permesso 'Documenti ricevuti'. Abilita il permesso nel pannello Fatture in Cloud.",
        );
      } else {
        console.warn("[FiC] Errore fetch documenti ricevuti:", err.message);
        warnings.push(`Fatture passive non importate: ${err.message}`);
      }
      return [] as FicDocument[];
    }),
  ]);

  console.log(`[FiC] Fetched: ${issuedDocs.length} emesse, ${receivedDocs.length} ricevute`);

  // Debug: log payment-related fields from first 3 issued docs
  for (const doc of issuedDocs.slice(0, 3)) {
    console.log(
      `[FiC] Sample doc #${doc.number}: gross=${doc.amount_gross}, is_marked=${doc.is_marked}, payments_sum=${JSON.stringify(doc.payments_sum)}, next_due_date=${doc.next_due_date}, → status=${mapFicStatus(doc)}`,
    );
  }

  // 2. Find existing connectorRefs to skip duplicates
  const allRefs = [
    ...issuedDocs.map((d) => buildConnectorRef("ACTIVE", d.id)),
    ...receivedDocs.map((d) => buildConnectorRef("PASSIVE", d.id)),
  ];

  // 3. Create or update invoices
  const newInvoiceIds: string[] = [];
  let skipped = 0;
  let updated = 0;

  // Build a map of existing invoices for status updates
  const existingInvoices =
    allRefs.length > 0
      ? await prisma.invoice.findMany({
          where: { organizationId, connectorRef: { in: allRefs } },
          select: { id: true, connectorRef: true, status: true, number: true },
        })
      : [];
  const existingByRef = new Map(existingInvoices.map((e) => [e.connectorRef, e]));

  async function importDoc(doc: FicDocument, direction: "ACTIVE" | "PASSIVE") {
    const ref = buildConnectorRef(direction, doc.id);
    const existingInv = existingByRef.get(ref);

    if (existingInv) {
      // Update existing invoice — never downgrade PAID → PENDING
      const ficStatus = mapFicStatus(doc);
      const correctNumber = formatInvoiceNumber(doc);

      // If locally PAID and FiC doesn't confirm PAID, keep local status
      const effectiveStatus =
        existingInv.status === "PAID" && ficStatus !== "PAID" ? "PAID" : ficStatus;
      const paidAt =
        effectiveStatus === "PAID" && existingInv.status !== "PAID" ? mapPaidAt(doc) : undefined;

      if (existingInv.status !== effectiveStatus || existingInv.number !== correctNumber) {
        await prisma.invoice.update({
          where: { id: existingInv.id },
          data: {
            status: effectiveStatus,
            number: correctNumber,
            ...(paidAt && { paidAt }),
          },
        });
        updated++;
      } else {
        skipped++;
      }
      return;
    }

    const status = mapFicStatus(doc);
    const paidAt = status === "PAID" ? mapPaidAt(doc) : null;

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        direction,
        status,
        number: formatInvoiceNumber(doc),
        date: doc.date ? new Date(doc.date) : new Date(),
        dueDate: doc.next_due_date ? new Date(doc.next_due_date) : null,
        counterpart: doc.entity?.name ?? "Sconosciuto",
        vatNumber: doc.entity?.vat_number ?? null,
        description: buildDescription(doc),
        netAmount: doc.amount_net ?? 0,
        vatAmount: doc.amount_vat ?? 0,
        grossAmount: doc.amount_gross ?? 0,
        needsTagging: true,
        paidAt,
        connectorRef: ref,
      },
      select: { id: true },
    });

    newInvoiceIds.push(invoice.id);

    if (doc.items_list?.length) {
      await prisma.invoiceLine.createMany({
        data: doc.items_list.map((item) => ({
          invoiceId: invoice.id,
          description: item.description ?? "",
          quantity: item.qty ?? 1,
          unitPrice: item.net_price ?? 0,
          amount: item.amount_net ?? 0,
        })),
      });
    }
  }

  for (const doc of issuedDocs) {
    await importDoc(doc, "ACTIVE");
  }
  for (const doc of receivedDocs) {
    await importDoc(doc, "PASSIVE");
  }

  // 4. Auto-tag new invoices
  let taggedCount = 0;
  if (newInvoiceIds.length > 0) {
    const tagResult = await autoTagInvoices(organizationId, newInvoiceIds);
    taggedCount = tagResult.tagged;
  }

  const parts = [
    `Sincronizzazione completata: ${newInvoiceIds.length} importate, ${updated} aggiornate, ${skipped} invariate, ${taggedCount} auto-taggate`,
    ...warnings,
  ];

  return {
    success: true,
    message: parts.join("\n"),
    imported: newInvoiceIds.length,
    skipped,
    tagged: taggedCount,
  };
}
