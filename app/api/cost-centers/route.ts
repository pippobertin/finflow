import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { listCostCenters, createCostCenter } from "@/lib/queries/cost-centers";
import { costCenterCreateSchema } from "@/lib/validations/cost-center";
import type { CostCenterType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const type = request.nextUrl.searchParams.get("type") as CostCenterType | null;
  const data = await listCostCenters(organizationId, type ?? undefined);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = costCenterCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await createCostCenter(organizationId, parsed.data);
  return Response.json(data, { status: 201 });
}
