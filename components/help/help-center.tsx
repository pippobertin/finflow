"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { HelpChapter, HelpSection } from "@/content/help/types";

interface HelpCenterProps {
  chapters: HelpChapter[];
  basePath: string; // "/firm/aiuto" or "/aiuto"
}

export function HelpCenter({ chapters, basePath }: HelpCenterProps) {
  const params = useParams();
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Build flat list for navigation
  const allSections = useMemo(() => chapters.flatMap((ch) => ch.sections), [chapters]);

  // Determine active section from URL slug
  const slugParam = params.slug as string[] | undefined;
  const activeSlug = slugParam?.[0] ?? allSections[0]?.slug ?? "";

  const activeIndex = allSections.findIndex((s) => s.slug === activeSlug);
  const activeSection = activeIndex >= 0 ? allSections[activeIndex] : allSections[0];
  const prevSection = activeIndex > 0 ? allSections[activeIndex - 1] : null;
  const nextSection = activeIndex < allSections.length - 1 ? allSections[activeIndex + 1] : null;

  // Search filter
  const filteredChapters = useMemo(() => {
    if (!query.trim()) return chapters;
    const q = query.toLowerCase();
    return chapters
      .map((ch) => ({
        ...ch,
        sections: ch.sections.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.keywords.some((kw) => kw.toLowerCase().includes(q)),
        ),
      }))
      .filter((ch) => ch.sections.length > 0);
  }, [chapters, query]);

  const Content = activeSection?.content;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-72 shrink-0 flex-col border-r bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
        {/* Search */}
        <div className="border-b p-3 dark:border-slate-800">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Cerca nell'aiuto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        {/* Chapter list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {filteredChapters.map((ch) => (
            <div key={ch.number} className="mb-2">
              <p className="px-4 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                {ch.number}. {ch.title}
              </p>
              <div className="space-y-px">
                {ch.sections.map((s) => {
                  const isActive = s.slug === activeSlug;
                  return (
                    <Link
                      key={s.slug}
                      href={`${basePath}/${s.slug}`}
                      className={cn(
                        "block px-4 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-white font-semibold text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-400"
                          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800",
                      )}
                    >
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        {s.chapter}.{s.section}
                      </span>{" "}
                      {s.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredChapters.length === 0 && query && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Nessun risultato per &quot;{query}&quot;
            </p>
          )}
        </nav>
      </aside>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {activeSection ? (
          <>
            {/* Content */}
            <article className="prose prose-slate dark:prose-invert mx-auto w-full max-w-3xl flex-1 px-8 py-8">
              <div className="mb-1 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {activeSection.chapterTitle}
                </span>
              </div>
              <h1 className="!mt-1 !mb-6">{activeSection.title}</h1>
              {Content && <Content />}
            </article>

            {/* Prev / Next */}
            <div className="border-t px-8 py-4 dark:border-slate-800">
              <div className="mx-auto flex max-w-3xl items-center justify-between">
                {prevSection ? (
                  <button
                    onClick={() => router.push(`${basePath}/${prevSection.slug}`)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{prevSection.title}</span>
                  </button>
                ) : (
                  <div />
                )}
                {nextSection ? (
                  <button
                    onClick={() => router.push(`${basePath}/${nextSection.slug}`)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <span>{nextSection.title}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Seleziona una sezione dalla barra laterale.</p>
          </div>
        )}
      </div>
    </div>
  );
}
