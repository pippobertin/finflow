import type { HelpSection } from "../types";

const CH = 5;
const CH_TITLE = "IVA, F24, prestiti";

export const sections: HelpSection[] = [
  {
    slug: "ricalcolo-iva",
    title: "Ricalcolo IVA del periodo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["ricalcolo", "IVA", "periodo", "liquidazione", "trimestrale"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "calendario-iva",
    title: "Leggere il calendario IVA",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["calendario", "IVA", "scadenze", "date", "versamenti"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "scadenze-f24",
    title: "Inserire scadenze F24",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["scadenze", "F24", "tributi", "imposte", "pagamenti"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "prestiti",
    title: "Inserire prestiti e finanziamenti",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["prestiti", "finanziamenti", "mutui", "leasing", "rate"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "scadenziario",
    title: "Lo scadenziario unificato",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["scadenziario", "unificato", "scadenze", "calendario", "promemoria"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
