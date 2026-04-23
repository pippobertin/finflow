import type { HelpSection } from "../types";

const CH = 2;
const CH_TITLE = "Come sta andando la tua azienda";

export const sections: HelpSection[] = [
  {
    slug: "dashboard",
    title: "La dashboard",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["dashboard", "panoramica", "home", "riepilogo", "sintesi"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "andamento-ricavi",
    title: "Andamento dei ricavi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["andamento", "ricavi", "fatturato", "vendite", "grafico"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "quanto-guadagni",
    title: "Quanto guadagna davvero l'azienda",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["guadagno", "utile", "margine", "profitto", "risultato"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "dove-vanno-soldi",
    title: "Dove vanno i soldi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["costi", "spese", "uscite", "categorie", "analisi"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "punto-pareggio",
    title: "Punto di pareggio",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["pareggio", "break-even", "BEP", "soglia", "copertura"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "salute-finanziaria",
    title: "Salute finanziaria",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 6,
    keywords: ["salute", "finanziaria", "indicatori", "KPI", "solidità"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
