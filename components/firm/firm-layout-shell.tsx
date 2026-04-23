"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FirmSidebar } from "./firm-sidebar";

interface FirmLayoutShellProps {
  isOnboarded: boolean;
  children: React.ReactNode;
}

export function FirmLayoutShell({ isOnboarded, children }: FirmLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingPage = pathname === "/firm/onboarding";

  useEffect(() => {
    if (!isOnboarded && !isOnboardingPage) {
      router.replace("/firm/onboarding");
    }
  }, [isOnboarded, isOnboardingPage, router]);

  // Onboarding page: no sidebar, full-width
  if (isOnboardingPage) {
    return <main className="flex min-h-screen flex-col">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <FirmSidebar />
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}
