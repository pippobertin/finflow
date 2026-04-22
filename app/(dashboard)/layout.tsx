import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ClientSidebar } from "@/components/client/client-sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userType = session.user.userType;
  const isClientUser = userType === "CLIENT_OWNER" || userType === "CLIENT_ADMIN_BANK_ONLY";

  // Fetch branding from accounting firm if client user
  let firmName: string | undefined;
  let firmLogoUrl: string | undefined;
  let brandColor: string | undefined;
  let accentColor: string | undefined;

  if (isClientUser && session.user.organizationId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: {
          accountingFirm: {
            select: { name: true },
          },
        },
      });
      if (org?.accountingFirm) {
        firmName = org.accountingFirm.name;
      }
    } catch {
      // Branding is optional, continue without it
    }
  }

  // Build inline CSS vars for branding
  const brandingStyle = [
    brandColor && `--brand: ${brandColor}`,
    accentColor && `--accent: ${accentColor}`,
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <div className="flex h-screen overflow-hidden">
      {brandingStyle && (
        <style dangerouslySetInnerHTML={{ __html: `:root { ${brandingStyle} }` }} />
      )}
      {isClientUser ? <ClientSidebar firmName={firmName} firmLogoUrl={firmLogoUrl} /> : <Sidebar />}
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}
