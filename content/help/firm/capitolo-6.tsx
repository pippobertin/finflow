import type { HelpSection } from "../types";

const CH = 6;
const CH_TITLE = "Estratti conto e movimenti";

export const sections: HelpSection[] = [
  {
    slug: "caricare-csv",
    title: "Caricare CSV da home banking",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["caricare", "CSV", "home banking", "import", "estratto conto"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "caricare-pdf",
    title: "Caricare PDF",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["caricare", "PDF", "estratto conto", "import", "documento"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "banche-supportate",
    title: "Le sei banche supportate di default",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["banche", "supportate", "default", "intesa", "unicredit", "bper"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "categorizzare-movimenti",
    title: "Categorizzare movimenti verso il CDG",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["categorizzare", "movimenti", "CDG", "classificare", "conti"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "pattern-riconoscimento",
    title: "Pattern di riconoscimento automatico",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["pattern", "riconoscimento", "automatico", "regole", "AI"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "profilo-banca",
    title: "Configurare un profilo banca nuovo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 6,
    keywords: ["profilo", "banca", "nuovo", "configurare", "template"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "problemi-parsing",
    title: "Risolvere problemi di parsing",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 7,
    keywords: ["problemi", "parsing", "errori", "debug", "formato"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
