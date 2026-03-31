import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";
import { computeFingerprint } from "@/lib/import/dedup-engine";
import { importBankStatements } from "@/lib/connectors/bank-statement-import";
import type { BankStatementMapping } from "@/lib/validations/bank-statement-import";

// GET: Fetch onboarding state
export async function GET() {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, vatNumber: true, email: true, phone: true, settings: true },
  });

  const bankAccount = await prisma.bankAccount.findFirst({
    where: { organizationId, isDefault: true },
    include: { bankProfile: true, closingBalances: { orderBy: { date: "desc" } } },
  });

  const dataPeriods = await prisma.dataPeriod.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const settings = (org?.settings as Record<string, unknown>) ?? {};

  return Response.json({
    organization: org,
    bankAccount,
    dataPeriods,
    onboardingCompleted: settings.onboardingCompleted === true,
    onboardingStep: typeof settings.onboardingStep === "number" ? settings.onboardingStep : 0,
  });
}

// POST: Handle step submissions
export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { step, data } = body as { step: string; data: Record<string, unknown> };

  try {
    switch (step) {
      case "organization": {
        const currentSettings = await getOrgSettings(organizationId);
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            name: data.name as string,
            vatNumber: (data.vatNumber as string) || null,
            email: (data.email as string) || null,
            phone: (data.phone as string) || null,
            settings: JSON.parse(
              JSON.stringify({
                ...currentSettings,
                vatPeriodicity: (data.vatPeriodicity as string) || "quarterly",
                onboardingStep: 1,
              }),
            ),
          },
        });
        return Response.json({ success: true });
      }

      case "bank-account": {
        const existing = await prisma.bankAccount.findFirst({
          where: { organizationId, isDefault: true },
        });
        if (existing) {
          await prisma.bankAccount.update({
            where: { id: existing.id },
            data: { bankName: data.bankName as string, iban: (data.iban as string) || null },
          });
        } else {
          await prisma.bankAccount.create({
            data: {
              organizationId,
              bankName: data.bankName as string,
              iban: (data.iban as string) || null,
              isDefault: true,
            },
          });
        }
        await updateOnboardingStep(organizationId, 2);
        return Response.json({ success: true });
      }

      case "ec-annual": {
        const bankAccount = await getOrCreateDefaultAccount(organizationId);
        const balance = parseFloat(data.balance as string);
        const date = new Date(data.date as string);

        await prisma.balanceSnapshot.upsert({
          where: {
            bankAccountId_date_source: {
              bankAccountId: bankAccount.id,
              date,
              source: "EC_ANNUAL",
            },
          },
          update: { balance, sourceFile: (data.sourceFile as string) || null },
          create: {
            bankAccountId: bankAccount.id,
            date,
            balance,
            source: "EC_ANNUAL",
            period: (data.period as string) || null,
            sourceFile: (data.sourceFile as string) || null,
          },
        });
        await updateOnboardingStep(organizationId, 3);
        return Response.json({ success: true });
      }

      case "ec-quarterly": {
        const bankAccount = await getOrCreateDefaultAccount(organizationId);
        const snapshots = data.snapshots as Array<{
          date: string;
          balance: string;
          period: string;
          sourceFile?: string;
        }>;

        for (const snap of snapshots) {
          const date = new Date(snap.date);
          const balance = parseFloat(snap.balance);
          await prisma.balanceSnapshot.upsert({
            where: {
              bankAccountId_date_source: {
                bankAccountId: bankAccount.id,
                date,
                source: "EC_QUARTERLY",
              },
            },
            update: { balance, sourceFile: snap.sourceFile || null },
            create: {
              bankAccountId: bankAccount.id,
              date,
              balance,
              source: "EC_QUARTERLY",
              period: snap.period,
              sourceFile: snap.sourceFile || null,
            },
          });
        }
        await updateOnboardingStep(organizationId, 4);
        return Response.json({ success: true });
      }

      case "movements": {
        const bankAccount = await getOrCreateDefaultAccount(organizationId);
        const mapping = data.mapping as BankStatementMapping;
        const csvContent = data.csvContent as string;

        // Save bank profile
        await prisma.bankProfile.upsert({
          where: { bankAccountId: bankAccount.id },
          update: {
            columnMapping: JSON.parse(JSON.stringify(mapping)),
            dateFormat: (data.dateFormat as string) || "dd/MM/yyyy",
            delimiter: (data.delimiter as string) || ",",
            decimalSeparator: (data.decimalSeparator as string) || ",",
            skipRows: (data.skipRows as number) || 0,
          },
          create: {
            bankAccountId: bankAccount.id,
            bankName: bankAccount.bankName,
            columnMapping: JSON.parse(JSON.stringify(mapping)),
            dateFormat: (data.dateFormat as string) || "dd/MM/yyyy",
            delimiter: (data.delimiter as string) || ",",
            decimalSeparator: (data.decimalSeparator as string) || ",",
            skipRows: (data.skipRows as number) || 0,
          },
        });

        // Import with dedup
        const result = await importBankStatements({
          organizationId,
          csvContent,
          mapping,
          dateFormat: (data.dateFormat as string) || "dd/MM/yyyy",
          decimalSeparator: (data.decimalSeparator as "," | ".") || ",",
          skipRows: (data.skipRows as number) || 0,
          sourceFile: data.sourceFile as string,
        });

        // Apply fingerprints to new statements
        for (const id of result.bankStatementIds) {
          const bs = await prisma.bankStatement.findUnique({
            where: { id },
            select: { date: true, amount: true, description: true },
          });
          if (bs) {
            const fp = computeFingerprint(bs.date, Number(bs.amount), bs.description);
            await prisma.bankStatement.update({
              where: { id },
              data: { fingerprint: fp, bankAccountId: bankAccount.id },
            });
          }
        }

        // Record data period
        if (result.imported > 0) {
          const imported = await prisma.bankStatement.findMany({
            where: { id: { in: result.bankStatementIds } },
            select: { date: true },
            orderBy: { date: "asc" },
          });
          if (imported.length > 0) {
            await prisma.dataPeriod.create({
              data: {
                organizationId,
                type: "MOVEMENTS_CSV",
                startDate: imported[0].date,
                endDate: imported[imported.length - 1].date,
                sourceFile: data.sourceFile as string,
                recordCount: result.imported,
              },
            });
          }
        }

        await updateOnboardingStep(organizationId, 5);
        return Response.json({ success: true, ...result });
      }

      case "complete": {
        const completeSettings = await getOrgSettings(organizationId);
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            settings: JSON.parse(
              JSON.stringify({
                ...completeSettings,
                onboardingCompleted: true,
                onboardingStep: 7,
              }),
            ),
          },
        });
        return Response.json({ success: true });
      }

      default:
        return Response.json({ error: "Unknown step" }, { status: 400 });
    }
  } catch (err) {
    console.error("[onboarding]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Errore sconosciuto" },
      { status: 500 },
    );
  }
}

async function getOrgSettings(organizationId: string): Promise<Record<string, unknown>> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { settings: true },
  });
  return (org?.settings as Record<string, unknown>) ?? {};
}

async function updateOnboardingStep(organizationId: string, step: number) {
  const current = await getOrgSettings(organizationId);
  await prisma.organization.update({
    where: { id: organizationId },
    data: { settings: JSON.parse(JSON.stringify({ ...current, onboardingStep: step })) },
  });
}

async function getOrCreateDefaultAccount(organizationId: string) {
  let bankAccount = await prisma.bankAccount.findFirst({
    where: { organizationId, isDefault: true },
  });
  if (!bankAccount) {
    bankAccount = await prisma.bankAccount.create({
      data: { organizationId, bankName: "Conto Principale", isDefault: true },
    });
  }
  return bankAccount;
}
