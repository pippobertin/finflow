import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpSteps, HelpStep } from "@/components/help/help-steps";

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Il report PDF è il documento che consegni al cliente: sintetizza la situazione
          economico-finanziaria dell&apos;anno scelto, con conto economico riclassificato,
          indicatori di salute, scadenze e riepilogo IVA. Porta il branding dello studio (logo e
          colori) ed è pronto da inviare via email senza ulteriori passaggi di formattazione.
        </p>

        <h2>Generare il report in tre passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la scheda Report e scegli anno e sezioni">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>Report</strong>. Trovi un
              selettore <strong>Anno</strong> (dall&apos;anno corrente fino a 2019) e una lista di
              quattro sezioni selezionabili via checkbox. Spunta quelle che vuoi includere: di
              default spunta tutte per un report completo, oppure seleziona solo ciò che serve in
              quel momento (es. solo CE + IVA per una revisione puntuale).
            </p>
            <HelpScreenshot
              src="/help/firm/generare-report/01-form-report.png"
              alt="Scheda Report con selettore anno, 4 checkbox sezioni e pulsante Genera"
              caption="Il form per configurare il report: anno, sezioni e pulsante di generazione"
              width={510}
              height={509}
              hotspots={[
                { x: 20, y: 20, label: 1, tooltip: "Selettore Anno" },
                { x: 50, y: 55, label: 2, tooltip: "Checkbox sezioni da includere" },
                { x: 50, y: 92, label: 3, tooltip: "Pulsante Genera Report PDF" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Clicca Genera Report PDF">
            <p>
              Il pulsante è disabilitato finché non selezioni almeno una sezione. Una volta
              cliccato, Finflow costruisce il PDF lato server raccogliendo bilancio riclassificato
              dello snapshot più recente (e affidabile) dell&apos;anno scelto, indicatori di salute
              calcolati su ricavi, MdC, EBITDA e utile netto, scadenze aperte nei prossimi 90 giorni
              (IVA, F24, rate prestiti), e ricalcolo IVA del periodo.
            </p>
            <p className="mt-2">
              Durante la generazione il pulsante diventa <em>Generazione in corso...</em> con uno
              spinner. Dopo pochi secondi il PDF viene scaricato automaticamente dal browser con
              nome <code>Report_&lt;anno&gt;.pdf</code>.
            </p>
          </HelpStep>

          <HelpStep number={3} title="Apri il PDF e condividilo con il cliente">
            <p>
              Il file ha la prima pagina con intestazione brandizzata (logo e nome dello studio,
              colori accent), il nome del cliente e l&apos;anno. Le pagine successive ospitano le
              sezioni richieste, ciascuna con titolo, introduzione breve e tabelle o grafici.
            </p>
            <HelpScreenshot
              src="/help/firm/generare-report/02-pdf-copertina.png"
              alt="Prima pagina del PDF con branding dello studio, nome cliente e anno"
              caption="La copertina del PDF porta il branding dello studio e l'intestazione cliente"
              width={515}
              height={420}
            />
            <HelpScreenshot
              src="/help/firm/generare-report/03-pdf-sezione-ce.png"
              alt="Pagina del PDF con conto economico riclassificato"
              caption="La sezione CE riclassificato del PDF: tabella con categorie, valori e margini"
              width={732}
              height={397}
            />
            <p className="mt-3">
              Il file è pronto da allegare a un&apos;email o da caricare in un&apos;area riservata
              del tuo studio. Se vuoi far accedere il cliente direttamente alla sua dashboard invece
              che inviargli il PDF, vedi{" "}
              <Link href="/firm/aiuto/invitare-cliente" className="font-medium underline">
                Invitare l&apos;imprenditore cliente
              </Link>
              .
            </p>
          </HelpStep>
        </HelpSteps>

        <h2>Le quattro sezioni selezionabili</h2>
        <ul>
          <li>
            <strong>CE Riclassificato</strong>: il conto economico dell&apos;anno con le 17
            categorie CDG aggregate, margini progressivi (MdC, EBITDA, EBIT, utile netto) e
            percentuali sui ricavi. È la sezione con il maggior peso informativo.
          </li>
          <li>
            <strong>Indicatori di Salute</strong>: un sistema di soglie (buono / attenzione /
            critico) applicate ai margini principali. Dà al cliente un&apos;autodiagnosi immediata
            dello stato aziendale.
          </li>
          <li>
            <strong>Scadenze 90 giorni</strong>: elenco delle scadenze aperte (IVA, F24, rate
            prestiti) con date, importi e stato. Utile per la pianificazione finanziaria.
          </li>
          <li>
            <strong>IVA del Periodo</strong>: riepilogo del ricalcolo IVA per il periodo: IVA a
            debito, a credito, saldo, eventuale credito riportato dal periodo precedente.
          </li>
        </ul>

        <HelpCallout variant="info" title="Da dove vengono i dati del report">
          Il CE e l&apos;IVA provengono dallo snapshot del bilancio di verifica più recente e con
          flag <code>isTrusted</code> attivo per l&apos;anno selezionato. Se il cliente ha solo
          snapshot non confermati per quell&apos;anno, il sistema li usa lo stesso ma mostra un
          banner di avviso nel PDF. Per avere un report affidabile, assicurati che il bilancio di
          verifica sia stato caricato come &quot;Confermato&quot;.
        </HelpCallout>

        <HelpCallout variant="tip" title="Quando generare il report">
          Il momento giusto è dopo aver caricato il bilancio di verifica aggiornato al periodo che
          vuoi rappresentare, aver completato mapping e eventuali correzioni di varianze. Un report
          generato &quot;a caldo&quot; subito dopo un upload appena fatto rischia di includere dati
          provvisori; aspettare la conferma finale del bilancio evita di dover rigenerare e
          rispedire il PDF al cliente.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Quando inviti l&apos;imprenditore cliente, accede a un&apos;area separata dalla vista
          controller. Il design parte da una premessa: l&apos;imprenditore non è un commercialista,
          quindi non vede bilanci grezzi o piani dei conti, ma indicatori, grafici e numeri di
          sintesi in linguaggio piano.
        </p>

        <h2>Come sta andando la tua azienda</h2>
        <p>
          La homepage del cliente (<code>/overview</code>) apre con un saluto e i KPI principali del
          periodo corrente: Ricavi, EBITDA, Utile netto e Break-even (punto di pareggio). Ogni card
          mostra il valore assoluto, la percentuale sui ricavi dove pertinente, e il confronto con
          il periodo precedente (freccia su/giù e variazione). Sotto, un grafico di andamento
          mensile mostra la traiettoria dei ricavi.
        </p>
        <HelpScreenshot
          src="/help/firm/workspace-cliente/01-overview-cliente.png"
          alt="Dashboard cliente con KPI Ricavi EBITDA Utile netto Break-even e grafico andamento"
          caption="La homepage del cliente: quattro KPI principali e grafico di andamento"
          width={1629}
          height={783}
          hotspots={[
            { x: 50, y: 20, label: 1, tooltip: "KPI del periodo" },
            { x: 50, y: 75, label: 2, tooltip: "Grafico andamento mensile" },
          ]}
        />

        <h2>Salute finanziaria con sistema a semaforo</h2>
        <p>
          La pagina <code>/salute-finanziaria</code> traduce gli indicatori tecnici in tre stati
          visivi: verde (buono), giallo (attenzione), rosso (critico). Sotto ogni indicatore
          c&apos;è una breve spiegazione in linguaggio non tecnico: invece di &quot;EBITDA margin
          12%&quot; il cliente legge &quot;La tua azienda genera un margine operativo nella media
          del settore&quot;. Le soglie sono configurate lato studio e possono essere personalizzate
          per il singolo cliente.
        </p>
        <HelpScreenshot
          src="/help/firm/workspace-cliente/02-salute-finanziaria.png"
          alt="Pagina salute finanziaria con indicatori a semaforo verde giallo rosso"
          caption="Gli indicatori di salute con codice colore semplice: il cliente capisce a colpo d'occhio"
          width={1632}
          height={469}
          hotspots={[
            { x: 50, y: 50, label: 1, tooltip: "Indicatori con stato verde/giallo/rosso" },
          ]}
        />

        <h2>La cassa: quanto c&apos;è, quando arriva, quando esce</h2>
        <p>
          La pagina <code>/cassa</code> è forse la più utile per l&apos;imprenditore: posizione di
          liquidità attuale, soglia minima configurata dal controller, prossime scadenze che
          impatteranno la cassa (IVA, F24, rate prestiti, fornitori), e una proiezione cashflow. Se
          il saldo previsto scende sotto la soglia minima, il sistema avvisa visivamente.
        </p>
        <HelpScreenshot
          src="/help/firm/workspace-cliente/03-cassa-cliente.png"
          alt="Pagina cassa cliente con posizione liquidità, scadenze e proiezione"
          caption="La pagina cassa: il cliente vede subito se ha problemi di liquidità in arrivo"
          width={1629}
          height={604}
          hotspots={[
            { x: 30, y: 20, label: 1, tooltip: "Posizione cassa corrente" },
            { x: 70, y: 20, label: 2, tooltip: "Soglia minima e scadenze" },
          ]}
        />

        <h2>Le altre pagine del workspace cliente</h2>
        <p>
          Oltre a overview, salute finanziaria e cassa, il cliente ha accesso a diverse pagine
          operative, tutte pensate per essere leggibili senza competenze contabili. Tra le più
          rilevanti: <code>/andamento</code> (trend mensili di ricavi, costi, margini),{" "}
          <code>/dove-vanno-i-soldi</code> (cost breakdown per categoria),{" "}
          <code>/quanto-guadagno</code> (dettaglio ricavi), <code>/salute-finanziaria</code>,
          <code>/previsione-anno</code> (preconsuntivo), <code>/punto-pareggio</code> (break-even
          analisi), <code>/situazione-patrimoniale</code>, <code>/scadenze</code>,{" "}
          <code>/glossario</code> (spiegazioni dei termini). Ogni voce del menu corrisponde a una
          pagina.
        </p>

        <h2>Cosa il cliente NON vede</h2>
        <p>
          Per isolamento di dati e responsabilità, il workspace cliente esclude pagine di
          configurazione dello studio, bilanci di verifica grezzi, mapping del piano dei conti,
          gestione pattern, template banche e ovviamente dati di altri clienti dello stesso studio.
          La lettura è l&apos;unica modalità: il cliente non può modificare valori, caricare file o
          creare utenti. Ogni cambio ai dati passa dal controller.
        </p>

        <HelpCallout variant="info" title="Il ruolo CLIENT_ADMIN_BANK_ONLY">
          Esiste un secondo ruolo cliente, <code>CLIENT_ADMIN_BANK_ONLY</code>, pensato per un
          collaboratore interno (tipico: un addetto amministrativo) che deve solo caricare estratti
          conto e categorizzare movimenti. Vede la sezione <code>/movimenti</code> e poco altro,
          niente dashboard principale né KPI. Usalo quando il cliente vuole delegare la parte
          operativa a un suo dipendente senza dargli la visione completa riservata al titolare.
        </HelpCallout>

        <HelpCallout variant="warning" title="Il primo accesso è decisivo">
          Il cliente giudicherà il servizio in base a ciò che vede al primo login. Dati incompleti,
          mapping parziale o KPI fuori scala minano la fiducia ancora prima che tu possa spiegargli
          il metodo. Invitalo solo dopo aver caricato il bilancio dell&apos;anno corrente,
          completato il mapping e verificato che i KPI nella sua dashboard abbiano senso. Se la
          dashboard appare &quot;vuota&quot; è meglio aspettare.
        </HelpCallout>

        <HelpCallout variant="tip" title="Prova il workspace cliente dal tuo lato">
          Per capire cosa vede davvero un tuo cliente, fai un test: crea un utente cliente
          temporaneo con la tua email alternativa e fai login. Scorri le pagine come farebbe
          l&apos;imprenditore. Scoprirai cose utili, come quali indicatori sono poco chiari, dove
          servirebbe un testo più esplicativo, quali numeri risaltano di più. Poi torna come
          controller e aggiusta eventuali mapping incompleti o soglie mal tarate.
        </HelpCallout>

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
