import Link from "next/link";
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
        <p>
          Il report PDF è il documento che consegni al tuo cliente. Contiene una sintesi della
          situazione economico-finanziaria, con grafici, tabelle e indicatori di salute. Lo generi
          direttamente da FinFlow in pochi secondi.
        </p>

        <h2>Come generare il report</h2>
        <p>
          Dalla scheda del cliente, apri il tab <strong>Report</strong>. Premi il pulsante
          <strong> Genera Report</strong>. Il sistema assembla il documento raccogliendo i dati più
          aggiornati disponibili per il cliente: bilancio riclassificato, varianze di budget,
          indicatori di salute e grafici di andamento.
        </p>

        <h2>Contenuto del report</h2>
        <p>Il report standard include le seguenti sezioni:</p>
        <ul>
          <li>
            <strong>Conto Economico riclassificato</strong> &mdash; i dati del bilancio di verifica
            mappati sulle 17 categorie CDG, con totali e margini intermedi
          </li>
          <li>
            <strong>Varianze di budget</strong> &mdash; il confronto tra dati consuntivi e budget,
            con le percentuali di scostamento
          </li>
          <li>
            <strong>Indicatori di salute</strong> &mdash; il sistema a semaforo (verde, giallo,
            rosso) che valuta EBITDA, margine netto e altri KPI
          </li>
          <li>
            <strong>Grafici di trend</strong> &mdash; l&apos;andamento dei ricavi e dei costi nei
            mesi, con confronto anno precedente se disponibile
          </li>
        </ul>

        <h2>Scaricare e condividere</h2>
        <p>
          Una volta generato, il report è disponibile per il download come file PDF. Puoi salvarlo
          sul tuo computer e inviarlo via email al cliente. Il nome del file include la ragione
          sociale del cliente e il periodo di riferimento per facilitare l&apos;archiviazione.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Genera il report dopo aver completato il ricalcolo IVA e aver verificato le varianze di
            budget. In questo modo il PDF contiene dati completi e aggiornati.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/sezioni-report">Scegliere le sezioni da includere</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/report-branding">Il report con branding del tuo studio</Link>
          </li>
        </ul>
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
        <p>
          Non tutti i clienti hanno bisogno dello stesso report. FinFlow ti permette di selezionare
          quali sezioni includere nel PDF, così puoi adattare il documento al livello di dettaglio
          che il cliente si aspetta.
        </p>

        <h2>Le sezioni disponibili</h2>
        <p>
          Prima di generare il report, trovi una serie di interruttori (toggle) per attivare o
          disattivare ciascuna sezione:
        </p>
        <ul>
          <li>
            <strong>Conto Economico riclassificato</strong> &mdash; la tabella completa con le 17
            categorie CDG e i margini intermedi
          </li>
          <li>
            <strong>Varianze di budget</strong> &mdash; il confronto consuntivo vs budget con gli
            scostamenti percentuali
          </li>
          <li>
            <strong>Indicatori di salute</strong> &mdash; i KPI con il sistema a semaforo
          </li>
          <li>
            <strong>Riepilogo IVA</strong> &mdash; la posizione IVA del periodo (debito, credito,
            netto)
          </li>
        </ul>

        <h2>Quando escludere una sezione</h2>
        <p>
          Ci sono casi in cui conviene disattivare alcune sezioni. Ad esempio: se non hai ancora
          caricato il budget per quel cliente, la sezione &quot;Varianze di budget&quot; mostrerebbe
          solo zeri. Se il cliente non si occupa direttamente di IVA (perché lo fa il suo consulente
          fiscale), puoi escludere il riepilogo IVA per non appesantire il report.
        </p>

        <h2>L&apos;ordine delle sezioni</h2>
        <p>
          Le sezioni appaiono nel report nello stesso ordine in cui sono elencate nella pagina di
          configurazione. Non è possibile riordinare le sezioni: l&apos;ordine segue una logica di
          lettura (prima i dati economici, poi il budget, poi gli indicatori, infine l&apos;IVA).
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Per il primo report di un nuovo cliente, includi solo il Conto Economico e gli
            indicatori di salute. Sono le sezioni più immediate da comprendere. Aggiungi le varianze
            di budget nei mesi successivi, quando avrai i dati storici per fare un confronto.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/generare-report">Generare il report PDF</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/report-branding">Il report con branding del tuo studio</Link>
          </li>
        </ul>
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
        <p>
          Il report PDF generato da FinFlow porta il marchio del tuo studio professionale. Il logo,
          il nome e i colori dello studio vengono inseriti automaticamente nel documento, dandogli
          un aspetto professionale e riconoscibile.
        </p>

        <h2>Quali elementi vengono personalizzati</h2>
        <p>Il sistema applica il branding del tuo studio in diversi punti del report:</p>
        <ul>
          <li>
            <strong>Intestazione</strong> &mdash; il logo dello studio appare nell&apos;angolo in
            alto del report, accanto al nome dello studio
          </li>
          <li>
            <strong>Piè di pagina</strong> &mdash; il nome dello studio e i contatti vengono
            riportati in ogni pagina
          </li>
          <li>
            <strong>Colori</strong> &mdash; i colori primari dello studio vengono applicati ai
            titoli e alle linee decorative del documento
          </li>
          <li>
            <strong>Copertina</strong> &mdash; la prima pagina mostra il nome del cliente, il
            periodo di riferimento e il logo dello studio
          </li>
        </ul>

        <h2>Dove configurare il branding</h2>
        <p>
          Le impostazioni di branding si trovano nella sezione <strong>Anagrafica studio</strong>.
          Da lì puoi caricare il logo (formato PNG o JPG, massimo 2 MB), inserire il nome dello
          studio, l&apos;indirizzo e i recapiti. Puoi anche scegliere il colore primario, che verrà
          usato negli accenti grafici del report.
        </p>

        <h2>Il valore del branding</h2>
        <p>
          Un report con il tuo logo e i tuoi colori comunica professionalità. Il cliente riceve un
          documento che sembra prodotto dal tuo studio, non da un software generico. Questo rafforza
          la percezione del valore del servizio di controllo di gestione che offri.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Usa un logo con sfondo trasparente (PNG) per il risultato migliore nel report. I loghi
            con sfondo bianco funzionano, ma possono creare un riquadro visibile su fondi colorati.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/anagrafica-studio">Anagrafica studio e branding</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/generare-report">Generare il report PDF</Link>
          </li>
        </ul>
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
        <p>
          Quando inviti l&apos;imprenditore cliente ad accedere a FinFlow, lui vede un workspace
          dedicato con una dashboard semplificata. La vista è progettata per chi non ha competenze
          contabili: numeri chiari, pochi tecnicismi, indicatori visivi.
        </p>

        <h2>La dashboard del cliente</h2>
        <p>Il cliente accede a una pagina con quattro KPI principali disposti in alto:</p>
        <ul>
          <li>
            <strong>Ricavi</strong> &mdash; il fatturato del periodo
          </li>
          <li>
            <strong>EBITDA</strong> &mdash; il margine operativo lordo, accompagnato dalla
            percentuale sui ricavi
          </li>
          <li>
            <strong>Utile netto</strong> &mdash; il risultato finale dopo imposte e oneri finanziari
          </li>
          <li>
            <strong>Break-even</strong> &mdash; il punto di pareggio, espresso in euro di fatturato
            necessario per coprire i costi fissi
          </li>
        </ul>
        <p>
          Ogni KPI mostra il valore del periodo corrente e un confronto con il periodo precedente
          (freccia su/giù e variazione percentuale).
        </p>

        <h2>Gli indicatori di salute</h2>
        <p>
          Sotto i KPI, il cliente trova il sistema a semaforo. Per ogni indicatore (margine EBITDA,
          margine netto, copertura oneri finanziari), un pallino colorato indica lo stato: verde se
          il valore è nella norma, giallo se richiede attenzione, rosso se c&apos;è un problema. Il
          linguaggio usato è volutamente semplice, senza sigle contabili.
        </p>

        <h2>Grafici di andamento</h2>
        <p>
          La dashboard include un grafico che mostra l&apos;andamento dei ricavi nei mesi e un
          grafico a torta con la composizione dei costi. Questi grafici aiutano l&apos;imprenditore
          a vedere l&apos;evoluzione nel tempo senza dover leggere tabelle di numeri.
        </p>

        <h2>Cosa il cliente NON vede</h2>
        <p>
          Il cliente non ha accesso alle pagine di configurazione dello studio, ai bilanci di
          verifica grezzi, al mapping del piano dei conti, né ai dati di altri clienti dello stesso
          studio. Il workspace è isolato e mostra solo i dati della propria azienda.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Prima di invitare il cliente, verifica che i dati siano aggiornati e corretti. Il
            cliente vedrà subito i numeri nella sua dashboard. Un errore visibile al primo accesso
            mina la fiducia nel servizio.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/invitare-cliente">Invitare l&apos;imprenditore cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/utenti-permessi">Utenti e permessi</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/generare-report">Generare il report PDF</Link>
          </li>
        </ul>
      </>
    ),
  },
];
