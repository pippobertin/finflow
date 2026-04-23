import type { HelpSection } from "../types";

const CH = 4;
const CH_TITLE = "Budget e preconsuntivo";

export const sections: HelpSection[] = [
  {
    slug: "budget-excel",
    title: "Caricare il budget annuale da Excel",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["budget", "excel", "caricare", "import", "annuale"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "budget-manuale",
    title: "Inserire il budget manualmente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["budget", "manuale", "inserire", "creare", "compilare"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "budget-varianze",
    title: "Consuntivo vs budget: leggere le varianze",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["consuntivo", "budget", "varianze", "scostamenti", "analisi"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "preconsuntivo",
    title: "Preconsuntivo: proiezione chiusura anno",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["preconsuntivo", "proiezione", "chiusura", "anno", "forecast"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
