import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/helpers/auth-guard";
import { prisma } from "@/lib/prisma";

// POST: Test a regex against unreconciled bank statements
export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const { regex, type } = body;

  if (!regex || !type) {
    return Response.json({ error: "Campi obbligatori: regex, type" }, { status: 400 });
  }

  // Validate regex
  let re: RegExp;
  try {
    re = new RegExp(regex, type === "invoiceRefPatterns" ? "gi" : "i");
  } catch {
    return Response.json({ error: "Regex non valida" }, { status: 400 });
  }

  // ReDoS protection: test regex execution time on a worst-case string
  const testStr = "A".repeat(1000);
  const start = Date.now();
  try {
    re.test(testStr);
  } catch {
    return Response.json({ error: "Regex troppo complessa" }, { status: 400 });
  }
  if (Date.now() - start > 100) {
    return Response.json(
      { error: "Regex troppo lenta — potrebbe causare problemi di performance" },
      { status: 400 },
    );
  }

  // Fetch unreconciled movements
  const movements = await prisma.bankStatement.findMany({
    where: { organizationId, isReconciled: false },
    select: { description: true },
    take: 500,
  });

  const matchedDescriptions: string[] = [];
  for (const m of movements) {
    // Reset lastIndex for global regex
    re.lastIndex = 0;
    const match = re.exec(m.description);
    if (match && match[1]) {
      matchedDescriptions.push(`${match[1]} ← ${m.description.slice(0, 80)}`);
    }
  }

  return Response.json({
    matches: matchedDescriptions.length,
    total: movements.length,
    samples: matchedDescriptions.slice(0, 5),
  });
}
