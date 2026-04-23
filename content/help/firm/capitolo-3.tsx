import type { HelpSection } from "../types";

const CH = 3;
const CH_TITLE = "Bilanci e piano dei conti";

export const sections: HelpSection[] = [
  {
    slug: "caricare-bilancio",
    title: "Caricare il bilancio di verifica da ProOffice",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["bilancio", "verifica", "prooffice", "caricare", "import"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "mapping-piano-conti",
    title: "Mappare il piano dei conti verso le categorie CDG",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["mapping", "piano", "conti", "categorie", "CDG", "riclassificazione"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "wizard-mapping",
    title: "Il wizard di mapping automatico",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["wizard", "mapping", "automatico", "AI", "suggerimenti"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "congelamento-periodi",
    title: "Congelamento periodi chiusi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["congelamento", "periodi", "chiusi", "blocco", "lock"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "fatture-retroattive",
    title: "Fatture retroattive su periodo congelato",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["fatture", "retroattive", "congelato", "periodo", "chiuso"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
