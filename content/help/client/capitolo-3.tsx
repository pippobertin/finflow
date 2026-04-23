import type { HelpSection } from "../types";

const CH = 3;
const CH_TITLE = "Le tue scadenze e la tua cassa";

export const sections: HelpSection[] = [
  {
    slug: "soldi-in-banca",
    title: "I tuoi soldi in banca",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["soldi", "banca", "saldo", "conto", "liquidità"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "pagamenti-incassi",
    title: "Cosa paghi, cosa incassi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["pagamenti", "incassi", "scadenze", "flussi", "entrate", "uscite"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "previsione-anno",
    title: "Previsione chiusura anno",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["previsione", "chiusura", "anno", "forecast", "proiezione"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
