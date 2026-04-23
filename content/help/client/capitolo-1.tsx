import type { HelpSection } from "../types";

const CH = 1;
const CH_TITLE = "Benvenuto";

export const sections: HelpSection[] = [
  {
    slug: "cose-finflow",
    title: "Cos'è Finflow",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["introduzione", "cos'è", "finflow", "panoramica", "benvenuto"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "invito-commercialista",
    title: "Il tuo commercialista ti ha invitato qui",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["invito", "commercialista", "accesso", "registrazione", "primo"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "sezioni-dashboard",
    title: "Le sezioni della tua dashboard",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["sezioni", "dashboard", "navigazione", "menu", "aree"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
