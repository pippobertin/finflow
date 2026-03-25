import { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/helpers/auth-guard";
import { bulkDeleteFutureReceivables } from "@/lib/queries/future-receivables";
import { futureReceivableBulkDeleteSchema } from "@/lib/validations/future-receivables";

export async function POST(request: NextRequest) {
  const { error, organizationId } = await getAdminSession();
  if (error) return error;

  const body = await request.json();
  const parsed = futureReceivableBulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Dati non validi", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const deleted = await bulkDeleteFutureReceivables(parsed.data.ids, organizationId);
  return Response.json({ deleted });
}
