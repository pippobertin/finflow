import { prisma } from "../lib/prisma";

async function main() {
  const org = await prisma.organization.findFirst({ select: { id: true, settings: true } });
  if (!org) {
    console.log("No org");
    process.exit(1);
  }

  const settings = (org.settings as Record<string, unknown>) ?? {};
  console.log("=== SETTINGS ===");
  console.log("currentBalance:", settings.currentBalance);
  console.log("currentBalanceUpdatedAt:", settings.currentBalanceUpdatedAt);

  // Last bank statement of 2025
  const lastBs2025 = await prisma.bankStatement.findFirst({
    where: { organizationId: org.id, date: { lte: new Date("2025-12-31T23:59:59") } },
    orderBy: { date: "desc" },
    select: { date: true, description: true, amount: true, balance: true },
  });
  console.log("\n=== ULTIMO MOVIMENTO 2025 ===");
  console.log(
    lastBs2025
      ? {
          date: lastBs2025.date.toISOString().slice(0, 10),
          desc: lastBs2025.description.slice(0, 60),
          amount: Number(lastBs2025.amount),
          balance: Number(lastBs2025.balance),
        }
      : "Nessun movimento 2025",
  );

  // Last bank statement overall
  const lastBsAll = await prisma.bankStatement.findFirst({
    where: { organizationId: org.id },
    orderBy: { date: "desc" },
    select: { date: true, description: true, amount: true, balance: true },
  });
  console.log("\n=== ULTIMO MOVIMENTO ASSOLUTO ===");
  console.log(
    lastBsAll
      ? {
          date: lastBsAll.date.toISOString().slice(0, 10),
          desc: lastBsAll.description.slice(0, 60),
          amount: Number(lastBsAll.amount),
          balance: Number(lastBsAll.balance),
        }
      : "Nessun movimento",
  );

  // Sum of all 2026 movements
  const sum2026 = await prisma.bankStatement.aggregate({
    where: {
      organizationId: org.id,
      date: { gte: new Date("2026-01-01"), lte: new Date("2026-12-31") },
    },
    _sum: { amount: true },
    _count: true,
  });
  console.log("\n=== SOMMA MOVIMENTI 2026 ===");
  console.log("count:", sum2026._count);
  console.log("sum:", Number(sum2026._sum.amount));

  // First bank statement of 2026
  const firstBs2026 = await prisma.bankStatement.findFirst({
    where: { organizationId: org.id, date: { gte: new Date("2026-01-01") } },
    orderBy: { date: "asc" },
    select: { date: true, description: true, amount: true, balance: true },
  });
  console.log("\n=== PRIMO MOVIMENTO 2026 ===");
  console.log(
    firstBs2026
      ? {
          date: firstBs2026.date.toISOString().slice(0, 10),
          desc: firstBs2026.description.slice(0, 60),
          amount: Number(firstBs2026.amount),
          balance: Number(firstBs2026.balance),
        }
      : "Nessun movimento 2026",
  );

  // Calcoli
  const currentBalance = Number(settings.currentBalance) || 0;
  const totalMovements2026 = Number(sum2026._sum.amount) || 0;
  const reverseCalcOpening = currentBalance - totalMovements2026;
  const lastBalance2025 = lastBs2025 ? Number(lastBs2025.balance) : null;
  const lastBalanceAll = lastBsAll ? Number(lastBsAll.balance) : null;

  console.log("\n=== CONFRONTO ===");
  console.log(
    "Reverse-calc opening (currentBalance - movimenti2026):",
    reverseCalcOpening.toFixed(2),
  );
  console.log("Ultimo saldo EC 2025 (balance field):", lastBalance2025?.toFixed(2) ?? "N/A");
  console.log("Ultimo saldo assoluto (balance field):", lastBalanceAll?.toFixed(2) ?? "N/A");

  if (lastBalance2025 !== null) {
    const forwardCalc = lastBalance2025 + totalMovements2026;
    console.log("\nForward-calc (saldoEC2025 + movimenti2026):", forwardCalc.toFixed(2));
    console.log("currentBalance impostato:", currentBalance.toFixed(2));
    console.log("Differenza:", (forwardCalc - currentBalance).toFixed(2));
  }

  await prisma.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
