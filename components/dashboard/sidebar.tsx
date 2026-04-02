"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Receipt,
  HandCoins,
  FileWarning,
  FolderKanban,
  Upload,
  SlidersHorizontal,
  LogOut,
  TableProperties,
  ArrowLeftRight,
  TrendingUp,
  Monitor,
  Terminal,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useThemeStore } from "@/lib/stores/theme-store";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [unreconciledCount, setUnreconciledCount] = useState(0);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    fetch("/api/reconciliation/count")
      .then((r) => r.json())
      .then((data) => setUnreconciledCount(data.count ?? 0))
      .catch(() => {});
  }, []);

  const navGroups: NavGroup[] = [
    {
      title: "Panoramica",
      items: [
        { href: "/overview", label: "Dashboard", icon: LayoutDashboard },
        { href: "/financial-detail", label: "Dettaglio Finanziario", icon: TableProperties },
        { href: "/cashflow", label: "Cashflow", icon: TrendingUp },
      ],
    },
    {
      title: "Dati",
      items: [
        { href: "/invoices", label: "Fatture", icon: FileText },
        { href: "/bank-statements", label: "Movimenti Bancari", icon: Landmark },
        { href: "/expenses", label: "Spese Ricorrenti", icon: Receipt },
        { href: "/expected-payables", label: "Fatture Passive Attese", icon: FileWarning },
        { href: "/future-receivables", label: "Incassi Futuri", icon: HandCoins },
        {
          href: "/reconciliation",
          label: "Riconciliazione",
          icon: ArrowLeftRight,
          badge: unreconciledCount > 0 ? unreconciledCount : undefined,
        },
      ],
    },
    {
      title: "Configurazione",
      items: [
        { href: "/import", label: "Importa Dati", icon: Upload },
        { href: "/cost-centers", label: "Centri di Costo", icon: FolderKanban },
        { href: "/settings/organization", label: "Impostazioni", icon: SlidersHorizontal },
      ],
    },
  ];

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)]"
      style={{
        boxShadow: "2px 0 12px rgba(0,0,0,0.04)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-6">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--ring))" }}
        >
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
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group, gi) => (
          <div key={group.title}>
            {gi > 0 && (
              <div className="pt-4 pb-2">
                <div className="border-t border-[var(--sidebar-border)]" />
              </div>
            )}
            <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[#94a3b8] uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[var(--sidebar-accent)] font-semibold text-[var(--sidebar-primary)]"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]",
                    )}
                  >
                    {isActive && (
                      <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--sidebar-primary)]" />
                    )}
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-5 min-w-5 justify-center border border-red-200 bg-red-50 px-1.5 text-[10px] font-bold text-red-600"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="border-t border-[var(--sidebar-border)] px-3 py-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sidebar-foreground)] transition-colors hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
        >
          {theme === "terminal" ? (
            <Monitor className="h-4 w-4" />
          ) : (
            <Terminal className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {theme === "terminal" ? "Tema Standard" : "Tema Terminal"}
          </span>
        </button>
      </div>

      {/* Logout */}
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-accent-foreground)]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Esci
        </Button>
      </div>
    </aside>
  );
}
