import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HelpStepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function HelpStep({ number, title, children }: HelpStepProps) {
  return (
    <li className="not-prose relative pl-12">
      <span className="absolute top-0 left-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm">
        {number}
      </span>
      <div className="pb-6">
        <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{children}</div>
      </div>
    </li>
  );
}

interface HelpStepsProps {
  children: ReactNode;
  className?: string;
}

export function HelpSteps({ children, className }: HelpStepsProps) {
  return (
    <ol
      className={cn(
        "not-prose relative my-6 ml-0 list-none space-y-0 border-l-2 border-dashed border-slate-200 pl-0 dark:border-slate-800",
        className,
      )}
      style={{ marginLeft: "1.125rem" }}
    >
      {children}
    </ol>
  );
}
