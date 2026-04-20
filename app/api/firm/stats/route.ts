import { getFirmSession } from "@/lib/helpers/auth-guard";
import { getFirmStats } from "@/lib/queries/firm";

export async function GET() {
  const { error, accountingFirmId } = await getFirmSession();
  if (error) return error;

  const stats = await getFirmStats(accountingFirmId);
  return Response.json(stats);
}
