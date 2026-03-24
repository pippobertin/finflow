"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  FileText,
  Landmark,
  Receipt,
  FolderKanban,
  Upload,
  Building2,
  Plug,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { href: "/overview", label: "Panoramica", icon: LayoutDashboard },
  { href: "/cashflow", label: "Previsione", icon: TrendingUp },
  { href: "/invoices", label: "Fatture", icon: FileText },
  { href: "/bank-statements", label: "Estratti Conto", icon: Landmark },
  { href: "/expenses", label: "Spese", icon: Receipt },
  { href: "/cost-centers", label: "Centri di Costo", icon: FolderKanban },
  { href: "/import", label: "Importa", icon: Upload },
];

const settingsNavItems = [
  { href: "/settings/organization", label: "Organizzazione", icon: Building2 },
  { href: "/settings/connectors", label: "Connettori", icon: Plug },
  { href: "/settings/advanced", label: "Avanzate", icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-sidebar-border bg-sidebar text-sidebar-foreground flex h-full w-64 shrink-0 flex-col border-r">
      <div className="border-sidebar-border flex h-16 items-center gap-2 border-b px-6">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold">
          F
        </div>
        <span className="text-lg font-semibold text-white">FinFlow</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Settings separator */}
        <div className="pt-4 pb-2">
          <div className="border-sidebar-border border-t" />
          <p className="text-sidebar-foreground/50 px-3 pt-3 text-xs font-semibold tracking-wider uppercase">
            Impostazioni
          </p>
        </div>

        {settingsNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full justify-start gap-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Esci
        </Button>
      </div>
    </aside>
  );
}
