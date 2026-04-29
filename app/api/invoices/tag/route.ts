// Legacy auto-tagging API — disabled in V2 Phase 3 (Invoice no longer has costCenterId).
// Will be removed in Block D.

export const dynamic = "force-dynamic";

export async function POST() {
  return Response.json({ error: "Auto-tagging disabilitato in V2" }, { status: 404 });
}
