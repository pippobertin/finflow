import type { HelpSection } from "../types";

const CH = 4;
const CH_TITLE = "Operatività quotidiana";

export const sections: HelpSection[] = [
  {
    slug: "fatture",
    title: "Le tue fatture",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["fatture", "attive", "passive", "emesse", "ricevute"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "conto-corrente",
    title: "Il tuo conto corrente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["conto", "corrente", "movimenti", "banca", "estratto"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "categorizzazione",
    title: "Il commercialista categorizza per te",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["categorizzazione", "commercialista", "classificazione", "automatico", "CDG"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
