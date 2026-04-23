import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { getIncomeStatement } from "@/lib/queries/income-statement";
import { computeBreakEven, computeHealthIndicators } from "@/lib/analysis/client-indicators";
import { computeFinancialRatios } from "@/lib/analysis/financial-ratios";
import { fetchScadenze } from "@/lib/queries/scadenze";
import { getVatSnapshots } from "@/lib/queries/vat-snapshots";
import { generateReportPdf, type ReportConfig } from "@/lib/pdf/report-generator";

interface BrandingJson {
  logoDataUrl?: string;
  brandColor?: string;
  accentColor?: string;
  displayName?: string;
}

const VALID_SECTIONS = new Set(["ce", "health", "scadenze", "iva"]);

/**
 * POST /api/firm/clients/[id]/report
 *
 * Generate a branded PDF report for the client.
 * Body: { year: number, sections: string[] }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const { id } = await params;

  // Verify ownership + fetch org with firm branding
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId },
    select: {
      id: true,
      name: true,
      accountingFirm: { select: { name: true, branding: true } },
    },
  });
  if (!org) {
    return Response.json({ error: "Organizzazione non trovata" }, { status: 404 });
  }

  const body = await request.json();
  const year = body.year ?? new Date().getFullYear();
  const sections: string[] = (body.sections ?? []).filter((s: string) => VALID_SECTIONS.has(s));

  if (sections.length === 0) {
    return Response.json({ error: "Seleziona almeno una sezione" }, { status: 400 });
  }

  const branding = (org.accountingFirm?.branding as BrandingJson) ?? {};
  const firmName = branding.displayName || org.accountingFirm?.name || "FinFlow";
  const brandColor = branding.brandColor || "#0b4d8a";

  // Fetch data for each requested section
  const data: ReportConfig["data"] = {};
  let snapshotWarning: string | undefined;

  if (sections.includes("ce") || sections.includes("health")) {
    // Find the best snapshot for the requested year:
    // 1. Prefer trusted snapshot covering the year
    // 2. Fallback to untrusted (with warning)
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    let snapshot = await prisma.trialBalanceSnapshot.findFirst({
      where: {
        organizationId: id,
        isLocked: true,
        isTrusted: true,
        periodStart: { lte: yearEnd },
        periodEnd: { gte: yearStart },
      },
      orderBy: { periodEnd: "desc" },
      select: { id: true },
    });

    if (!snapshot) {
      // Fallback: untrusted snapshot for the year
      snapshot = await prisma.trialBalanceSnapshot.findFirst({
        where: {
          organizationId: id,
          isLocked: true,
          periodStart: { lte: yearEnd },
          periodEnd: { gte: yearStart },
        },
        orderBy: { periodEnd: "desc" },
        select: { id: true },
      });
      if (snapshot) {
        snapshotWarning =
          "Dati basati su snapshot non validato — i numeri potrebbero non essere accurati";
      }
    }

    if (!snapshot) {
      return Response.json(
        { error: `Nessun bilancio disponibile per l'anno ${year}` },
        { status: 404 },
      );
    }

    const ceResult = await getIncomeStatement(id, snapshot.id);
    if (ceResult) {
      const { incomeStatement, ratios, periodStart, periodEnd } = ceResult;
      if (sections.includes("ce")) {
        data.ce = { incomeStatement, ratios, periodStart, periodEnd };
      }
      if (sections.includes("health")) {
        const indicators = computeHealthIndicators(
          incomeStatement,
          computeFinancialRatios(incomeStatement),
          computeBreakEven(incomeStatement),
        );
        data.health = {
          indicators,
          bep: computeBreakEven(incomeStatement),
        };
      }
    }
  }

  if (sections.includes("scadenze")) {
    try {
      data.scadenze = await fetchScadenze(id, 90);
    } catch {
      // scadenze data unavailable
    }
  }

  if (sections.includes("iva")) {
    try {
      const snapshots = await getVatSnapshots(id, year);
      data.iva = {
        snapshots: snapshots.map((s) => {
          const ps = typeof s.periodStart === "string" ? s.periodStart : String(s.periodStart);
          const dd = s.dueDate
            ? typeof s.dueDate === "string"
              ? s.dueDate.slice(0, 10)
              : String(s.dueDate).slice(0, 10)
            : null;
          return {
            periodLabel: `${s.periodType} ${ps.slice(0, 7)}`,
            vatDebit: Number(s.vatDebit),
            vatCredit: Number(s.vatCredit),
            amountDue: Number(s.amountDue),
            dueDate: dd,
            isPaid: s.isPaid,
          };
        }),
      };
    } catch {
      // IVA data unavailable
    }
  }

  const pdfBuffer = await generateReportPdf({
    orgName: org.name,
    firmName,
    brandColor,
    year,
    sections,
    data,
    snapshotWarning,
  });

  const filename = `Report_${org.name.replace(/\s+/g, "_")}_${year}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
