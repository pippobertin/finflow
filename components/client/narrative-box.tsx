"use client";

import { cn } from "@/lib/utils";

interface NarrativeBoxProps {
  tag?: string;
  children: React.ReactNode;
  className?: string;
}

export function NarrativeBox({ tag = "In breve", children, className }: NarrativeBoxProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-800/40 dark:bg-blue-950/20",
        className,
      )}
    >
      <span className="mr-2 inline-block rounded-full bg-[var(--brand,#0b4d8a)] px-2.5 py-0.5 align-middle text-[10px] font-bold tracking-wider text-white uppercase">
        {tag}
      </span>
      <span className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</span>
    </div>
  );
}
