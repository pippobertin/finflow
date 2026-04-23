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
