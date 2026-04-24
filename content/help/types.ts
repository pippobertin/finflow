import type { ComponentType } from "react";

export interface HelpSection {
  slug: string;
  title: string;
  chapter: number;
  chapterTitle: string;
  section: number;
  keywords: string[];
  content: ComponentType;
}

export interface HelpChapter {
  number: number;
  title: string;
  sections: HelpSection[];
}

// Metadata-only variants (no content function — safe for server→client serialization)
export type HelpSectionMeta = Omit<HelpSection, "content">;

export interface HelpChapterMeta {
  number: number;
  title: string;
  sections: HelpSectionMeta[];
}

export function stripContent(chapters: HelpChapter[]): HelpChapterMeta[] {
  return chapters.map((ch) => ({
    number: ch.number,
    title: ch.title,
    sections: ch.sections.map(({ content: _, ...meta }) => meta),
  }));
}
