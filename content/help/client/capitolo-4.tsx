import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";

const CH = 4;
const CH_TITLE = "Operatività quotidiana";

export const sections: HelpSection[] = [
  {
    slug: "movimenti-bancari",
    title: "I tuoi movimenti bancari",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["movimenti", "bancari", "transazioni", "conto", "banca"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Movimenti raccoglie tutte le operazioni dei conti correnti aziendali: bonifici
          in entrata, pagamenti in uscita, addebiti automatici e ogni altra transazione registrata
          dalla banca. Funziona come un estratto conto, con un&apos;organizzazione più leggibile e
          l&apos;aggiunta della categorizzazione per tipologia di costo o ricavo.
        </p>

        <HelpScreenshot
          src="/help/clienti/movimenti-bancari/01-movimenti-bancari.png"
          alt="Lista movimenti bancari con data, descrizione, importo e categoria"
          caption="La lista movimenti: data, descrizione, importo e categoria di ogni operazione"
          width={1437}
          height={531}
        />

        <h2>Origine dei dati</h2>
        <p>
          I movimenti vengono importati periodicamente dal commercialista, a partire dagli estratti
          conto bancari o dai dati del gestionale contabile. L&apos;accesso del cliente è in sola
          lettura: la consultazione è libera, ma non è possibile aggiungere o modificare voci.
        </p>
        <p>
          Eventuali movimenti recenti non ancora visibili indicano semplicemente che l&apos;ultimo
          caricamento non è stato ancora effettuato. Il flusso non è in tempo reale:
          l&apos;aggiornamento avviene secondo la cadenza concordata con lo studio.
        </p>

        <h2>La categorizzazione</h2>
        <p>
          Ogni movimento è associato a una categoria, identificata da un&apos;etichetta colorata. Le
          categorie raggruppano le operazioni per natura: ricavi da vendite, costi del personale,
          utenze, materie prime e così via.
        </p>
        <p>
          La gestione della categorizzazione è in capo al commercialista, sia nella sua parte
          automatica (riconoscimento di pattern ricorrenti come stipendi o utenze) sia nelle
          attribuzioni manuali sulle voci atipiche. La presenza delle categorie consente una lettura
          immediata della distribuzione delle entrate e delle uscite, senza la necessità di
          analizzare ogni singola descrizione.
        </p>

        <h2>Le colonne della tabella</h2>
        <ul>
          <li>
            <strong>Data</strong>: data contabile dell&apos;operazione.
          </li>
          <li>
            <strong>Descrizione</strong>: causale del movimento, riportata come da estratto conto
            bancario.
          </li>
          <li>
            <strong>Importo</strong>: positivo per le entrate, negativo per le uscite.
          </li>
          <li>
            <strong>Categoria</strong>: la classificazione gestionale assegnata al movimento.
          </li>
        </ul>

        <HelpCallout variant="tip" title="Quando segnalare un'anomalia">
          La revisione periodica dei movimenti è un controllo utile. In presenza di operazioni non
          riconosciute, di importi anomali o di categorizzazioni che non corrispondono alla natura
          della spesa, è opportuno segnalarle al commercialista, che provvederà alla correzione. Una
          categorizzazione accurata si riflette direttamente sulla qualità dei report e degli
          indicatori.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/cassa-attuale">Quanto hai in cassa</Link>
          </li>
          <li>
            <Link href="/aiuto/dove-vanno-soldi">
              Dove vanno i soldi: la composizione dei costi
            </Link>
          </li>
          <li>
            <Link href="/aiuto/contattare-commercialista">Contattare il tuo commercialista</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "cambiare-password",
    title: "Cambiare la password",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["password", "cambiare", "sicurezza", "profilo", "accesso"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La modifica della password si effettua dalla pagina del proprio profilo, accessibile dal
          menu utente in alto a destra.
        </p>

        <h2>Procedura</h2>
        <p>
          Cliccando sull&apos;icona o sulle iniziali del profilo nell&apos;intestazione si apre il
          menu utente. La voce dedicata al profilo o alle impostazioni dell&apos;account contiene il
          campo di cambio password. È richiesta l&apos;immissione della password attuale, seguita
          dalla nuova password digitata due volte per conferma.
        </p>

        <h2>Requisiti</h2>
        <p>La nuova password deve rispettare i seguenti requisiti minimi:</p>
        <ul>
          <li>almeno 8 caratteri di lunghezza;</li>
          <li>combinazione di lettere e numeri.</li>
        </ul>
        <p>
          Sono da evitare sequenze elementari (es. <code>12345678</code>) o parole comuni
          riconducibili al contesto aziendale. Una password di lunghezza maggiore, anche se
          interamente alfabetica ma non riconducibile a frasi note, offre già un livello di
          sicurezza adeguato per un&apos;area gestionale.
        </p>

        <h2>Password dimenticata</h2>
        <p>
          In caso di password dimenticata e impossibilità di accesso, il riferimento è il
          commercialista, che può procedere al reset dell&apos;account e all&apos;invio di un nuovo
          link per la creazione della password. Non è al momento disponibile un sistema automatico
          di recupero.
        </p>

        <HelpCallout variant="warning" title="Riservatezza delle credenziali">
          Le credenziali di accesso non vanno condivise con terzi, incluso il commercialista, che
          dispone di un proprio accesso separato e non ha necessità della password del cliente per
          gestire i dati aziendali.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/invito-commercialista">
              Il tuo commercialista ti ha invitato qui
            </Link>
          </li>
          <li>
            <Link href="/aiuto/contattare-commercialista">Contattare il tuo commercialista</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "contattare-commercialista",
    title: "Contattare il tuo commercialista",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["contattare", "commercialista", "supporto", "domande", "aiuto"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Finflow rappresenta i dati aziendali; la loro gestione resta interamente in capo al
          commercialista. Per qualunque richiesta di chiarimento, segnalazione di anomalia o
          discussione dei risultati, il riferimento operativo è il professionista che cura la
          contabilità dell&apos;azienda.
        </p>

        <h2>Quando rivolgersi al commercialista</h2>
        <p>Le situazioni più frequenti che giustificano un contatto:</p>
        <ul>
          <li>un dato visualizzato non coincide con le aspettative o appare incongruente;</li>
          <li>
            i dati recenti non risultano aggiornati (ad esempio mancano i movimenti dell&apos;ultimo
            mese);
          </li>
          <li>un movimento bancario risulta categorizzato in modo non corretto;</li>
          <li>è necessario un chiarimento sul significato di un indicatore o di un grafico;</li>
          <li>occorre il reset della password per impossibilità di accesso;</li>
          <li>
            si vuole impostare un confronto sui risultati e sulle azioni di miglioramento possibili.
          </li>
        </ul>

        <h2>Sola lettura per il cliente</h2>
        <p>
          L&apos;accesso del cliente alla piattaforma è in modalità di sola lettura: non è
          consentito aggiungere, modificare o eliminare dati. La scelta è voluta e garantisce la
          coerenza tra i valori esposti in dashboard e la contabilità ufficiale gestita dallo
          studio. Ogni intervento sui dati passa dal commercialista.
        </p>

        <h2>Modalità di contatto</h2>
        <p>
          Il contatto avviene attraverso i canali abitualmente concordati con lo studio (telefono,
          email, messaggistica). Per agevolare la verifica è utile fornire al commercialista
          riferimenti precisi: la pagina consultata, il valore segnalato e il periodo di
          riferimento.
        </p>

        <HelpCallout variant="tip" title="Allegare lo screenshot">
          Allegare uno screenshot della pagina o del dato segnalato accelera notevolmente la
          verifica da parte del commercialista. Su macOS la cattura si effettua con la combinazione{" "}
          <code>Cmd+Shift+4</code>; il file viene salvato sulla scrivania ed è pronto per essere
          inviato.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/cambiare-password">Cambiare la password</Link>
          </li>
          <li>
            <Link href="/aiuto/cose-finflow">Cos&apos;è Finflow</Link>
          </li>
          <li>
            <Link href="/aiuto/glossario-termini">Glossario dei termini</Link>
          </li>
        </ul>
      </>
    ),
  },
];
