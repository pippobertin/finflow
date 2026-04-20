import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { FirmSidebar } from "@/components/firm/firm-sidebar";

export default async function FirmLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only CONTROLLER users can access the firm workspace
  if (session.user.userType !== "CONTROLLER") {
    redirect("/overview");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <FirmSidebar />
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}
