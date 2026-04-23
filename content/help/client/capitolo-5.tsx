import type { HelpSection } from "../types";

const CH = 5;
const CH_TITLE = "Glossario";

export const sections: HelpSection[] = [
  {
    slug: "glossario",
    title: "Termini contabili spiegati",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["glossario", "termini", "contabili", "definizioni", "vocabolario"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
