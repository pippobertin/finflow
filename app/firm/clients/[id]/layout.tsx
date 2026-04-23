import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientHeader } from "@/components/firm/client-header";

export default async function ClientLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.accountingFirmId) redirect("/login");

  const { id } = await params;
  const org = await prisma.organization.findFirst({
    where: { id, accountingFirmId: session.user.accountingFirmId },
    select: { name: true },
  });
  if (!org) redirect("/firm/clients");

  return (
    <>
      <ClientHeader clientId={id} orgName={org.name} />
      {children}
    </>
  );
}
