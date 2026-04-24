import Link from "next/link";
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
        <p>
          Se un cliente non appare nella tua dashboard, il problema ha quasi sempre una spiegazione
          semplice. Questa sezione elenca le cause più frequenti e i passaggi per risolvere.
        </p>

        <h2>Causa 1: il cliente appartiene a un altro studio</h2>
        <p>
          Ogni cliente è collegato a un singolo studio professionale. Se un collega di un altro
          studio ha creato il cliente, non puoi vederlo nel tuo account. Verifica con chi ha
          effettuato la creazione del cliente. La dashboard mostra solo i clienti associati al tuo
          studio.
        </p>

        <h2>Causa 2: l&apos;utente non ha il ruolo CONTROLLER</h2>
        <p>
          Per accedere alla lista completa dei clienti, il tuo account deve avere il ruolo
          <strong> CONTROLLER</strong> (o superiore). Se hai un ruolo diverso, potresti non vedere
          tutti i clienti. Chiedi all&apos;amministratore del tuo studio di verificare i tuoi
          permessi nella sezione <strong>Utenti e permessi</strong>.
        </p>

        <h2>Causa 3: il cliente è stato eliminato</h2>
        <p>
          Se il cliente è stato cancellato dal sistema, non appare più in nessuna vista. La
          cancellazione è un&apos;operazione definitiva. Se pensi che il cliente sia stato eliminato
          per errore, contatta il supporto FinFlow: in alcuni casi è possibile recuperare i dati dal
          backup.
        </p>

        <h2>Passaggi di verifica</h2>
        <p>Segui questa checklist:</p>
        <ul>
          <li>
            Apri la dashboard e controlla che non ci siano filtri attivi che nascondono il cliente
          </li>
          <li>Usa la barra di ricerca per cercare il nome o la partita IVA del cliente</li>
          <li>Verifica il tuo ruolo nella pagina del profilo utente</li>
          <li>Chiedi a un collega con ruolo amministratore se il cliente esiste nel sistema</li>
        </ul>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se il problema persiste dopo tutti i controlli, prova a uscire e rientrare
            nell&apos;applicazione. In rari casi, la sessione può contenere dati non aggiornati che
            si risolvono con un nuovo accesso.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/utenti-permessi">Utenti e permessi</Link>
          </li>
        </ul>
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
        <p>
          Il parser PDF potrebbe non riconoscere le transazioni per diversi motivi. Qui trovi una
          guida rapida per diagnosticare e risolvere il problema senza perdere tempo.
        </p>

        <h2>Verifica 1: profilo banca corretto</h2>
        <p>
          Questa è la causa numero uno di parsing fallito. Prima del caricamento, hai selezionato la
          banca dal menu a tendina. Se hai scelto &quot;Intesa Sanpaolo&quot; ma il PDF è di
          UniCredit, il parser cerca le colonne nella posizione sbagliata e non trova nulla. Torna
          al caricamento, seleziona la banca corretta e riprova.
        </p>

        <h2>Verifica 2: il PDF contiene testo selezionabile</h2>
        <p>
          Apri il PDF con un lettore qualsiasi (ad esempio Anteprima su Mac o Adobe Reader su
          Windows). Prova a selezionare il testo con il mouse e a copiarlo. Se riesci a incollare il
          testo in un editor, il PDF è testuale e il parser dovrebbe funzionare. Se il testo non si
          seleziona, il PDF è una scansione (immagine) e non può essere elaborato dal parser.
        </p>

        <h2>Verifica 3: formato PDF non standard</h2>
        <p>
          Alcune banche modificano il formato dei propri PDF nel tempo. Se il parser è stato
          calibrato su un formato precedente, potrebbe non riconoscere il nuovo layout. Segnali di
          questo problema: il parser importa solo alcune righe, oppure le date e gli importi sono
          confusi. In questi casi, prova il caricamento via CSV come alternativa immediata.
        </p>

        <h2>Quando usare il CSV al posto del PDF</h2>
        <p>
          Il formato CSV è più affidabile del PDF perché ha una struttura dati predefinita (colonne
          separate da delimitatori). Se il PDF continua a dare problemi, esporta i movimenti in CSV
          dall&apos;home banking della banca. Il CSV funziona con qualsiasi istituto, senza bisogno
          di un profilo banca specifico.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Non caricare lo stesso file più volte con profili banca diversi nella speranza che uno
            funzioni. Se il parsing sbagliato importa movimenti con dati errati, dovrai eliminarli
            manualmente prima di importare quelli corretti.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/problemi-parsing">Risolvere problemi di parsing</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-csv">Caricare CSV da home banking</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/banche-supportate">Le sei banche supportate di default</Link>
          </li>
        </ul>
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
        <p>
          Capita di confrontare i dati mostrati in FinFlow con un foglio Excel e trovare differenze.
          Nella maggior parte dei casi non si tratta di un errore del sistema, ma di differenze nel
          perimetro dei dati o nel periodo selezionato.
        </p>

        <h2>Causa 1: periodo diverso</h2>
        <p>
          Verifica che il periodo selezionato in FinFlow (anno e mese) corrisponda esattamente al
          periodo del tuo foglio Excel. Se in FinFlow hai selezionato &quot;2024&quot; e nel foglio
          Excel stai guardando i dati al 30/09/2024, i numeri saranno diversi perché FinFlow
          potrebbe mostrare dati accumulati fino a un mese diverso.
        </p>

        <h2>Causa 2: bilancio di verifica non aggiornato</h2>
        <p>
          Se hai caricato un bilancio di verifica vecchio e nel frattempo la contabilità è avanzata,
          i dati in FinFlow saranno in ritardo rispetto all&apos;Excel. Soluzione: carica un
          bilancio di verifica aggiornato allo stesso periodo che stai confrontando.
        </p>

        <h2>Causa 3: conti non mappati</h2>
        <p>
          Questa è la causa più insidiosa. Il Conto Economico riclassificato in FinFlow include solo
          i conti che sono stati mappati verso una categoria CDG. Se ci sono conti nel piano dei
          conti che non hanno una mappatura, i loro valori vengono esclusi dalla riclassificazione.
          Il totale in FinFlow risulta quindi inferiore a quello del bilancio completo.
        </p>
        <p>
          Per verificare, vai alla pagina <strong>Mapping piano dei conti</strong> e filtra per
          &quot;Non mappati&quot;. Se trovi conti con importi significativi, assegna loro una
          categoria CDG e rigenera la riclassificazione.
        </p>

        <h2>Causa 4: arrotondamenti</h2>
        <p>
          FinFlow arrotonda i valori al centesimo di euro. Se il tuo foglio Excel usa precisioni
          diverse (ad esempio 4 decimali), le differenze di arrotondamento possono accumularsi e
          produrre scostamenti di qualche euro. Questo è un comportamento normale e non richiede
          intervento.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Per un confronto preciso, esporta i dati di FinFlow e del gestionale con la stessa data
            di riferimento. Controlla i conti non mappati: sono la causa più comune di discrepanze
            significative.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/mapping-piano-conti">
              Mappare il piano dei conti verso le categorie CDG
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
        </ul>
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
        <p>
          Quando inviti un cliente ad accedere al workspace, il sistema invia un&apos;email con il
          link di attivazione. Se il cliente dice di non averla ricevuta, segui questi passaggi per
          risolvere.
        </p>

        <h2>Controllare l&apos;indirizzo email</h2>
        <p>
          La prima cosa da verificare: l&apos;indirizzo email è corretto? Apri la scheda del
          cliente, vai alla sezione <strong>Utenti</strong> e controlla l&apos;email inserita. Un
          errore di battitura (ad esempio &quot;gmail.con&quot; al posto di &quot;gmail.com&quot;) è
          sufficiente a far perdere il messaggio. Se l&apos;indirizzo è sbagliato, correggilo e
          rinvia l&apos;invito.
        </p>

        <h2>Controllare la cartella spam</h2>
        <p>
          Chiedi al cliente di controllare la cartella spam, posta indesiderata o promotions (su
          Gmail). I filtri anti-spam di alcuni provider sono aggressivi e possono intercettare
          l&apos;email di invito, specialmente se è la prima volta che ricevono un messaggio da
          FinFlow. Se il messaggio è nello spam, il cliente deve segnarlo come &quot;Non spam&quot;
          per ricevere le future comunicazioni nella posta in arrivo.
        </p>

        <h2>Blocchi del provider email</h2>
        <p>
          Alcuni provider aziendali (ad esempio server Exchange configurati in modo restrittivo)
          bloccano le email provenienti da domini sconosciuti. In questi casi, il cliente deve
          chiedere al suo reparto IT di autorizzare il dominio di invio di FinFlow. In alternativa,
          usa un indirizzo email personale del cliente (Gmail, Outlook.com) come workaround
          temporaneo.
        </p>

        <h2>Ambiente di sviluppo</h2>
        <p>
          Se stai usando FinFlow in ambiente di sviluppo locale (development mode), le email non
          vengono inviate. Il sistema le registra nella console del server. Questo è il
          comportamento atteso in sviluppo. In produzione, le email vengono inviate regolarmente
          tramite il servizio email configurato.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Non inviare l&apos;invito ripetutamente. Ogni invio genera un nuovo link di attivazione
            e invalida i precedenti. Se il cliente ha ricevuto più email, deve usare sempre
            l&apos;ultima.
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
            <Link href="/firm/aiuto/contatti-supporto">Contatti e supporto</Link>
          </li>
        </ul>
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
        <p>
          Se hai un problema che non riesci a risolvere con questa guida, puoi contattare il team
          FinFlow. Rispondiamo di norma entro un giorno lavorativo.
        </p>

        <h2>Segnalare un problema tecnico</h2>
        <p>
          Per i problemi tecnici (errori dell&apos;applicazione, pagine che non si caricano, dati
          che non appaiono), invia un&apos;email al supporto tecnico FinFlow. Nel messaggio includi
          le seguenti informazioni:
        </p>
        <ul>
          <li>
            <strong>Descrizione del problema</strong> &mdash; cosa stavi facendo e cosa è successo
            di diverso da quanto atteso
          </li>
          <li>
            <strong>Nome del cliente</strong> &mdash; a quale cliente si riferisce il problema
          </li>
          <li>
            <strong>Periodo</strong> &mdash; quale anno e mese stavi consultando
          </li>
          <li>
            <strong>Screenshot</strong> &mdash; se possibile, allega una cattura dello schermo che
            mostra l&apos;errore
          </li>
          <li>
            <strong>Browser</strong> &mdash; quale browser usi (Chrome, Safari, Firefox, Edge)
          </li>
        </ul>
        <p>
          Queste informazioni aiutano il team a riprodurre il problema e a trovare una soluzione più
          rapidamente.
        </p>

        <h2>Richiedere una nuova funzione</h2>
        <p>
          Se hai un&apos;idea per migliorare FinFlow o hai bisogno di una funzionalità che al
          momento non esiste, puoi segnalarla al team di prodotto. Descrivi lo scenario d&apos;uso:
          cosa vorresti fare, perché ti serve e con quale frequenza lo faresti. Le richieste vengono
          valutate e inserite nella roadmap in base alla priorità.
        </p>

        <h2>Tempi di risposta</h2>
        <p>
          Le segnalazioni tecniche che impediscono l&apos;uso dell&apos;applicazione hanno priorità
          alta e vengono prese in carico entro poche ore. Le richieste di nuove funzioni e i
          problemi non bloccanti vengono gestiti in base alla disponibilità del team, di norma entro
          2-3 giorni lavorativi.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Prima di contattare il supporto, prova a cercare il problema in questa guida usando la
            barra di ricerca. Molti problemi comuni hanno una soluzione documentata che puoi
            applicare subito.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/cliente-non-visibile">Non vedo un cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/parser-pdf-problemi">
              Parser PDF non riconosce le transazioni
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/numeri-non-quadrano">
              Numeri che non quadrano con l&apos;Excel
            </Link>
          </li>
        </ul>
      </>
    ),
  },
];
