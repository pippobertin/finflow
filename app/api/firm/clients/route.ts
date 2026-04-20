import { NextRequest } from "next/server";
import { getFirmSession } from "@/lib/helpers/auth-guard";
import {
  listFirmOrganizations,
  createFirmOrganization,
  type CreateOrganizationInput,
} from "@/lib/queries/firm";

export async function GET() {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const organizations = await listFirmOrganizations(accountingFirmId);
  return Response.json(organizations);
}

export async function POST(request: NextRequest) {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const body = (await request.json()) as CreateOrganizationInput;

  if (!body.name?.trim()) {
    return Response.json({ error: "Il nome è obbligatorio" }, { status: 400 });
  }

  const org = await createFirmOrganization(accountingFirmId, body);
  return Response.json(org, { status: 201 });
}
