import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { buildFullTimeline } from "@/lib/queries/cashflow-projection";
import { CashflowClient } from "@/components/cashflow/cashflow-client";

export default async function CashflowPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const data = await buildFullTimeline(session.user.organizationId);

  return <CashflowClient initialData={data} />;
}
