import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOverviewData } from "@/lib/queries/overview";
import { OverviewClient } from "@/components/overview/overview-client";

export default async function OverviewPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const data = await getOverviewData(session.user.organizationId);

  return <OverviewClient initialData={data} />;
}
