import type { HelpSection } from "../types";

const CH = 7;
const CH_TITLE = "Report e comunicazione con il cliente";

export const sections: HelpSection[] = [
  {
    slug: "generare-report",
    title: "Generare il report PDF",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["generare", "report", "PDF", "stampa", "esportare"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "sezioni-report",
    title: "Scegliere le sezioni da includere",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["sezioni", "report", "includere", "selezionare", "personalizzare"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "report-branding",
    title: "Il report con branding del tuo studio",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["report", "branding", "studio", "logo", "personalizzazione"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
  {
    slug: "workspace-cliente",
    title: "Cosa vede il tuo cliente nel workspace",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["workspace", "cliente", "vista", "dashboard", "accesso"],
    content: () => (
      <>
        <p>Contenuto in arrivo.</p>
      </>
    ),
  },
];
