import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FirmLayoutShell } from "@/components/firm/firm-layout-shell";

export default async function FirmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only CONTROLLER users can access the firm workspace
  if (session.user.userType !== "CONTROLLER") {
    redirect("/overview");
  }

  // Check onboarding status
  const firm = session.user.accountingFirmId
    ? await prisma.accountingFirm.findUnique({
        where: { id: session.user.accountingFirmId },
        select: { isOnboarded: true },
      })
    : null;

  return <FirmLayoutShell isOnboarded={firm?.isOnboarded ?? true}>{children}</FirmLayoutShell>;
}
