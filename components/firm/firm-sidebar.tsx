"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Palette, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/firm/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/firm/clients", label: "Clienti", icon: Users },
  { href: "/firm/branding", label: "Branding", icon: Palette },
];

export function FirmSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--sidebar-border)] px-6">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--ring))" }}
        >
          F
        </div>
        <div className="flex flex-col">
          <span
            className="text-lg leading-tight font-bold"
            style={{
              background: "linear-gradient(135deg, #818CF8, #22D3EE)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FinFlow
          </span>
          <span className="text-[10px] font-medium tracking-wider text-[#94a3b8] uppercase">
            Studio
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[#94a3b8] uppercase">
          Gestione
        </p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
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
              </Link>
            );
          })}
        </div>
      </nav>

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
