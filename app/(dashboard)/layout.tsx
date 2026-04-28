import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ClientSidebar } from "@/components/client/client-sidebar";
import { BankOnlyGuard } from "@/components/client/bank-only-guard";
import { prisma } from "@/lib/prisma";

interface BrandingJson {
  logoDataUrl?: string;
  brandColor?: string;
  accentColor?: string;
  displayName?: string;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userType = session.user.userType;
  const isClientUser = userType === "CLIENT_OWNER" || userType === "CLIENT_ADMIN_BANK_ONLY";

  // Fetch branding from accounting firm if client user
  let organizationName: string | undefined;
  let firmName: string | undefined;
  let firmLogoUrl: string | undefined;
  let brandColor: string | undefined;
  let accentColor: string | undefined;

  if (isClientUser && session.user.organizationId) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: {
          name: true,
          accountingFirm: {
            select: { name: true, branding: true },
          },
        },
      });
      if (org) {
        organizationName = org.name || undefined;
      }
      if (org?.accountingFirm) {
        const branding = (org.accountingFirm.branding as BrandingJson) ?? {};
        firmName = branding.displayName || org.accountingFirm.name;
        firmLogoUrl = branding.logoDataUrl || undefined;
        brandColor = branding.brandColor || undefined;
        accentColor = branding.accentColor || undefined;
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
      {isClientUser ? (
        <>
          <ClientSidebar
            organizationName={organizationName}
            firmName={firmName}
            firmLogoUrl={firmLogoUrl}
            userType={userType ?? undefined}
          />
          <BankOnlyGuard userType={userType ?? undefined} />
          <div className="flex flex-1 flex-col overflow-auto">
            <main className="flex-1">{children}</main>
            {/* Powered by attribution */}
            <footer className="border-t border-slate-100 px-6 py-3 text-center dark:border-slate-800">
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                powered by <span className="font-semibold">FinFlow</span>
              </span>
            </footer>
          </div>
        </>
      ) : (
        <>
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-auto">{children}</main>
        </>
      )}
    </div>
  );
}
