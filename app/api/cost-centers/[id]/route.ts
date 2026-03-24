import { NextRequest } from "next/server";
import { getAuthSession, getAdminSession } from "@/lib/helpers/auth-guard";
import { getCostCenterById, updateCostCenter, deleteCostCenter } from "@/lib/queries/cost-centers";
import { costCenterUpdateSchema } from "@/lib/validations/cost-center";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  const data = await getCostCenterById(id, organizationId);
  if (!data) {
    return Response.json({ error: "Centro di costo non trovato" }, { status: 404 });
  }
  return Response.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = costCenterUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = await updateCostCenter(id, organizationId, parsed.data);
  if (!data) {
    return Response.json({ error: "Centro di costo non trovato" }, { status: 404 });
  }
  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const { id } = await params;
  const data = await deleteCostCenter(id, organizationId);
  if (!data) {
    return Response.json({ error: "Centro di costo non trovato" }, { status: 404 });
  }
  return Response.json({ success: true });
}
