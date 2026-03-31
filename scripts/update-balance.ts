import { prisma } from "../lib/prisma";

async function main() {
  const org = await prisma.organization.findFirst({ select: { id: true, settings: true } });
  if (!org) {
    console.log("No org");
    process.exit(1);
  }

  const settings = (org.settings as Record<string, unknown>) ?? {};
  const oldBalance = settings.currentBalance;

  settings.currentBalance = 75826.62;
  settings.currentBalanceUpdatedAt = new Date().toISOString();

  await prisma.organization.update({
    where: { id: org.id },
    data: { settings },
  });

  console.log(`currentBalance aggiornato: ${oldBalance} → 75826.62`);
  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
