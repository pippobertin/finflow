"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Receipt,
  HandCoins,
  FolderKanban,
  Upload,
  Building2,
  Plug,
  SlidersHorizontal,
  LogOut,
  FlaskConical,
  TableProperties,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  { href: "/overview", label: "Panoramica", icon: LayoutDashboard },
  { href: "/cashflow", label: "What If", icon: FlaskConical },
  { href: "/financial-detail", label: "Dettaglio Finanziario", icon: TableProperties },
  { href: "/invoices", label: "Fatture", icon: FileText },
  { href: "/bank-statements", label: "Estratti Conto", icon: Landmark },
  { href: "/expenses", label: "Spese", icon: Receipt },
  { href: "/future-receivables", label: "Incassi Futuri", icon: HandCoins },
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
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r border-white/[0.06]"
      style={{
        background: "linear-gradient(180deg, #1E1B4B 0%, #312E81 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-white">
          F
        </div>
        <span
          className="text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, #818CF8, #22D3EE)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          FinFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Settings separator */}
        <div className="pt-4 pb-2">
          <div className="border-t border-white/[0.08]" />
          <p className="px-3 pt-3 text-xs font-semibold tracking-wider text-white/40 uppercase">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.12] text-white shadow-sm"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/[0.08] p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-white/60 hover:bg-white/[0.06] hover:text-white/90"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Esci
        </Button>
      </div>
    </aside>
  );
}
