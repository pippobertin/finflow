import type { HelpSection } from "../types";

const CH = 8;
const CH_TITLE = "Troubleshooting e FAQ";

export const sections: HelpSection[] = [
  {
    slug: "cliente-non-visibile",
    title: "Non vedo un cliente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["cliente", "non visibile", "mancante", "errore", "accesso"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "parser-pdf-problemi",
    title: "Parser PDF non riconosce le transazioni",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["parser", "PDF", "transazioni", "errore", "riconoscimento"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "numeri-non-quadrano",
    title: "Numeri che non quadrano con l'Excel",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["numeri", "quadrano", "Excel", "differenze", "errore"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "email-invito",
    title: "Il cliente non riceve l'email di invito",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["email", "invito", "non riceve", "spam", "errore"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "contatti-supporto",
    title: "Contatti e supporto",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["contatti", "supporto", "assistenza", "help", "email"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
