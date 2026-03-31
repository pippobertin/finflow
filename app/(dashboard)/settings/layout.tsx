"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/dashboard/navbar";

const tabs = [
  { label: "Organizzazione", href: "/settings/organization" },
  { label: "Connettori", href: "/settings/connectors" },
  { label: "Avanzate", href: "/settings/advanced" },
] as const;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Navbar title="Impostazioni" />
      <div className="border-border/50 border-b px-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </>
  );
}
