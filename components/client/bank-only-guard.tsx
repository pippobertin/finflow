"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const ALLOWED_PREFIXES = ["/movimenti", "/fatture", "/import"];

interface BankOnlyGuardProps {
  userType?: string;
}

/**
 * Client-side safety net: redirects CLIENT_ADMIN_BANK_ONLY users
 * to /movimenti if they navigate to a disallowed path.
 */
export function BankOnlyGuard({ userType }: BankOnlyGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (userType !== "CLIENT_ADMIN_BANK_ONLY") return;
    const isAllowed = ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isAllowed) {
      router.replace("/movimenti");
    }
  }, [pathname, userType, router]);

  return null;
}
