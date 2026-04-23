import type { HelpSection } from "../types";

const CH = 1;
const CH_TITLE = "Primi passi";

export const sections: HelpSection[] = [
  {
    slug: "cose-finflow",
    title: "Cos'è Finflow",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["introduzione", "panoramica", "cos'è", "finflow"],
    content: () => (
      <>
        <p>Contenuto in arrivo — sezione placeholder per C3.</p>
      </>
    ),
  },
  {
    slug: "clienti-multi-tenant",
    title: "Chi sono i tuoi clienti",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["clienti", "multi-tenant", "studio", "organizzazioni"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "primo-accesso",
    title: "Il tuo primo accesso",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["login", "primo", "accesso", "onboarding", "wizard"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "panoramica-aree",
    title: "Panoramica delle aree dell'app",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["aree", "navigazione", "sezioni", "menu"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
