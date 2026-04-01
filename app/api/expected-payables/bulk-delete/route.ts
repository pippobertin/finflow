import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { bulkDeleteExpectedPayables } from "@/lib/queries/expected-payables";
import { expectedPayableBulkDeleteSchema } from "@/lib/validations/expected-payables";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = expectedPayableBulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const deleted = await bulkDeleteExpectedPayables(parsed.data.ids, organizationId);
  return Response.json({ deleted });
}
