"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  PiggyBank,
  CircleDollarSign,
  Target,
  Building2,
  HeartPulse,
  BookOpen,
  HelpCircle,
  Landmark,
  CalendarClock,
  FileText,
  ArrowDownUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfileDropdown } from "@/components/shared/user-profile-dropdown";

const navSections = [
  {
    title: "Panoramica",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/andamento", label: "Andamento ricavi", icon: TrendingUp },
      { href: "/quanto-guadagno", label: "Quanto guadagno", icon: PiggyBank },
      { href: "/dove-vanno-i-soldi", label: "Dove vanno i soldi", icon: CircleDollarSign },
    ],
  },
  {
    title: "Analisi",
    items: [
      { href: "/punto-pareggio", label: "Punto di pareggio", icon: Target },
      { href: "/situazione-patrimoniale", label: "Situazione patrimoniale", icon: Building2 },
      { href: "/salute-finanziaria", label: "Salute finanziaria", icon: HeartPulse },
      { href: "/previsione-anno", label: "Previsione anno", icon: Target },
    ],
  },
  {
    title: "Operativo",
    items: [
      { href: "/cassa", label: "Cassa", icon: Landmark },
      { href: "/scadenze", label: "Scadenze", icon: CalendarClock },
      { href: "/fatture", label: "Fatture", icon: FileText },
      { href: "/movimenti", label: "Movimenti", icon: ArrowDownUp },
    ],
  },
  {
    title: "Risorse",
    items: [
      { href: "/glossario", label: "Glossario", icon: BookOpen },
      { href: "/aiuto", label: "Aiuto", icon: HelpCircle },
    ],
  },
];

/** Paths accessible to CLIENT_ADMIN_BANK_ONLY users */
const BANK_ONLY_ALLOWED = new Set(["/movimenti", "/fatture"]);

interface ClientSidebarProps {
  firmName?: string;
  firmLogoUrl?: string;
  userType?: string;
}

export function ClientSidebar({ firmName, firmLogoUrl, userType }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
        {firmLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firmLogoUrl}
            alt={firmName ?? ""}
            className="h-8 w-8 rounded-lg object-contain"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, var(--brand, #0b4d8a), var(--accent, #0e7c66))",
            }}
          >
            F
          </div>
        )}
        <div className="flex flex-col">
          <span
            className="text-lg leading-tight font-bold"
            style={{
              background: "linear-gradient(135deg, var(--brand, #0b4d8a), var(--accent, #0e7c66))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {firmName ?? "FinFlow"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navSections.map((section) => {
          const isBankOnly = userType === "CLIENT_ADMIN_BANK_ONLY";
          const visibleItems = isBankOnly
            ? section.items.filter((item) => BANK_ONLY_ALLOWED.has(item.href))
            : section.items;
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-white font-semibold text-[var(--brand,#0b4d8a)] shadow-sm dark:bg-slate-800 dark:text-blue-400"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                      )}
                    >
                      {isActive && (
                        <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--brand,#0b4d8a)]" />
                      )}
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <UserProfileDropdown />
      </div>
    </aside>
  );
}
