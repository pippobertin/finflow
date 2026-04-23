import type { HelpSection } from "../types";

const CH = 2;
const CH_TITLE = "Gestione studio e clienti";

export const sections: HelpSection[] = [
  {
    slug: "anagrafica-studio",
    title: "Anagrafica studio e branding",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["anagrafica", "studio", "branding", "logo", "impostazioni"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "creare-cliente",
    title: "Creare un nuovo cliente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["creare", "nuovo", "cliente", "aggiungere", "organizzazione"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "invitare-cliente",
    title: "Invitare l'imprenditore cliente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["invitare", "imprenditore", "email", "invito", "accesso"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "utenti-permessi",
    title: "Utenti e permessi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["utenti", "permessi", "ruoli", "accesso", "collaboratori"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "gruppo-clienti",
    title: "Gestire più clienti dello stesso gruppo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["gruppo", "clienti", "multi", "società", "holding"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
