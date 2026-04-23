"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Users,
  BarChart3,
  FileSpreadsheet,
  Calculator,
  Receipt,
  ArrowUpDown,
  Sparkles,
  Landmark,
  Banknote,
  FileBarChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ─── Tab configuration ───────────────────────────────────────────

interface TabDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface TabGroup {
  label: string;
  tabs: TabDef[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: "Dati",
    tabs: [
      { href: "anagrafica", label: "Anagrafica", icon: Building2 },
      { href: "utenti", label: "Utenti", icon: Users },
    ],
  },
  {
    label: "CdG",
    tabs: [
      { href: "cdg", label: "CDG", icon: BarChart3 },
      { href: "bilanci", label: "Bilanci", icon: FileSpreadsheet },
      { href: "budget", label: "Budget", icon: Calculator },
      { href: "iva", label: "IVA", icon: Receipt },
    ],
  },
  {
    label: "Operativo",
    tabs: [
      { href: "movimenti", label: "Movimenti", icon: ArrowUpDown },
      { href: "movimenti/patterns", label: "Pattern", icon: Sparkles },
      { href: "f24", label: "F24", icon: Landmark },
      { href: "prestiti", label: "Prestiti", icon: Banknote },
    ],
  },
  {
    label: "Report",
    tabs: [{ href: "report", label: "Report", icon: FileBarChart }],
  },
];

// Flat list for label lookup, longest-match first for correct path resolution
const ALL_TABS = TAB_GROUPS.flatMap((g) => g.tabs).sort((a, b) => b.href.length - a.href.length);

// ─── Component ───────────────────────────────────────────────────

interface ClientHeaderProps {
  clientId: string;
  orgName: string;
}

export function ClientHeader({ clientId, orgName }: ClientHeaderProps) {
  const pathname = usePathname();
  const prefix = `/firm/clients/${clientId}/`;
  const subPath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";

  // Match active tab (longest match first so "movimenti/patterns" beats "movimenti")
  const activeTab = ALL_TABS.find((t) => subPath === t.href || subPath.startsWith(t.href + "/"));
  const sectionLabel = activeTab?.label ?? "Dettaglio";
  const isReportPage = activeTab?.href === "report";

  return (
    <div className="bg-card border-b px-6 pt-5 pb-0">
      {/* Hero section */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Link href="/firm/clients" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl leading-tight font-bold">{orgName}</h1>
            <p className="text-muted-foreground text-sm">{sectionLabel}</p>
          </div>
        </div>
        {!isReportPage && (
          <Link
            href={`/firm/clients/${clientId}/report`}
            className={buttonVariants({ variant: "default" })}
          >
            <FileBarChart className="mr-2 h-4 w-4" />
            Genera Report
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <nav className="flex items-center gap-1 overflow-x-auto">
        {TAB_GROUPS.map((group, gi) => (
          <div key={group.label} className="flex items-center">
            {gi > 0 && <div className="bg-border mx-2 h-5 w-px" aria-hidden="true" />}
            <div className="flex items-center gap-0.5">
              {group.tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab?.href === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={`/firm/clients/${clientId}/${tab.href}`}
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{tab.label}</span>
                    {isActive && (
                      <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
