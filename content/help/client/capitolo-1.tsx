import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";

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
        <p>
          Finflow è la tua dashboard finanziaria personale. Il tuo commercialista l&apos;ha
          preparata per te, in modo che tu possa avere sempre sotto controllo come sta andando la
          tua azienda: quanto fatturi, quanto guadagni, dove vanno i soldi e quanto hai in cassa.
        </p>

        <h2>A cosa serve</h2>
        <p>
          Pensa a Finflow come al cruscotto della tua auto, ma per l&apos;azienda. Invece di
          velocità e giri del motore, vedi i ricavi, i margini, le scadenze e la liquidità. Tutto
          aggiornato dal tuo commercialista, senza che tu debba inserire nulla.
        </p>
        <p>
          Non devi essere un esperto di contabilità per usarlo. Ogni numero ha una spiegazione
          semplice, e se trovi un termine che non conosci puoi consultare il{" "}
          <Link href="/aiuto/glossario-termini">glossario</Link> in qualsiasi momento.
        </p>

        <h2>Chi inserisce i dati</h2>
        <p>
          I dati li carica il tuo commercialista. Lui importa i bilanci, i movimenti bancari, le
          fatture e tutto il resto. Tu non devi fare niente: apri Finflow, leggi i numeri e ti fai
          un&apos;idea chiara della situazione.
        </p>
        <p>
          Se noti qualcosa di strano o hai dubbi su un numero, il riferimento è sempre il tuo
          commercialista. Lui gestisce i dati, tu li consulti.
        </p>

        <h2>Come è organizzata questa guida</h2>
        <p>
          La guida è divisa in capitoli. Questo primo capitolo ti spiega come accedere e cosa trovi
          nella dashboard. I capitoli successivi entrano nel dettaglio di ogni sezione: i numeri
          dell&apos;azienda, la cassa, le scadenze e le operazioni quotidiane. L&apos;ultimo
          capitolo è un glossario con tutti i termini contabili spiegati in modo semplice.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Non serve leggere tutto in una volta. Parti dalla dashboard, esplora le sezioni che ti
            interessano di più e torna qui quando hai bisogno di una spiegazione.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/invito-commercialista">
              Il tuo commercialista ti ha invitato qui
            </Link>
          </li>
          <li>
            <Link href="/aiuto/sezioni-dashboard">Le sezioni della tua dashboard</Link>
          </li>
          <li>
            <Link href="/aiuto/glossario-termini">Glossario dei termini</Link>
          </li>
        </ul>
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
        <p>
          Se stai leggendo questa pagina, probabilmente il tuo commercialista ti ha inviato
          un&apos;email con un invito a Finflow. Ecco come funziona il processo e cosa aspettarti al
          primo accesso.
        </p>

        <h2>L&apos;email di invito</h2>
        <p>
          Il tuo commercialista ha creato un account per te all&apos;interno di Finflow. Hai
          ricevuto un&apos;email con un link per impostare la tua password. Clicca sul link, scegli
          una password sicura e il gioco è fatto.
        </p>
        <p>
          Se non trovi l&apos;email, controlla la cartella spam o posta indesiderata. Il mittente è
          il sistema Finflow, non il tuo commercialista direttamente.
        </p>

        <h2>Impostare la password</h2>
        <p>
          Cliccando sul link dell&apos;email arrivi a una pagina dove inserire la tua nuova
          password. Scegli qualcosa di sicuro: almeno 8 caratteri, con lettere e numeri. Dopo aver
          confermato la password, il sistema ti porta direttamente alla tua dashboard.
        </p>

        <h2>Il primo accesso</h2>
        <p>
          Dopo il login vedi subito la tua dashboard con i numeri della tua azienda. Non ti viene
          chiesto di configurare nulla: il tuo commercialista ha già preparato tutto per te. I dati
          che vedi dipendono da quello che lui ha caricato nel sistema.
        </p>

        <h2>Tu leggi, il commercialista gestisce</h2>
        <p>
          Il tuo ruolo in Finflow è consultivo. Puoi navigare tutte le sezioni, leggere i numeri,
          guardare i grafici e le tabelle, ma non puoi modificare i dati. Inserimenti, correzioni e
          aggiornamenti sono di competenza del tuo commercialista. Questo garantisce che i numeri
          che vedi siano sempre affidabili e coerenti con la contabilità ufficiale.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il link nell&apos;email di invito ha una scadenza. Se lo clicchi dopo troppo tempo e non
            funziona più, contatta il tuo commercialista e chiedigli di inviarti un nuovo invito.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/cose-finflow">Cos&apos;è Finflow</Link>
          </li>
          <li>
            <Link href="/aiuto/sezioni-dashboard">Le sezioni della tua dashboard</Link>
          </li>
          <li>
            <Link href="/aiuto/cambiare-password">Cambiare la password</Link>
          </li>
        </ul>
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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Nella barra laterale trovi le pagine della dashboard. Ognuna risponde a una domanda
          specifica sull&apos;andamento aziendale. Di seguito una panoramica del contenuto di
          ciascuna.
        </p>

        <HelpScreenshot
          src="/help/clienti/sezioni-dashboard/01-menu-dashboard.png"
          alt="Barra laterale della dashboard cliente con tutte le sezioni elencate"
          caption="Il menu laterale: ogni voce è una pagina della tua dashboard"
          width={248}
          height={674}
        />

        <h2>Dashboard</h2>
        <p>
          È la prima pagina che vedi quando entri. In alto i numeri chiave (ricavi, EBITDA, utile
          netto), sotto i grafici di andamento. Se hai poco tempo, è qui che capisci subito come sta
          andando.
        </p>

        <h2>Andamento ricavi</h2>
        <p>
          Il fatturato rappresentato mese per mese su un grafico. Risponde alla domanda
          &quot;l&apos;azienda sta crescendo, è stabile o sta rallentando?&quot; con una vista
          immediata dei mesi forti e di quelli deboli.
        </p>

        <h2>Quanto guadagno</h2>
        <p>
          Distingue il fatturato dal guadagno effettivo: una volta sottratti fornitori, dipendenti,
          affitto, utenze e tasse, qual è il margine reale che resta. Il numero che orienta le
          decisioni di gestione.
        </p>

        <h2>Dove vanno i soldi</h2>
        <p>
          La composizione delle uscite per voce di costo: materie prime, personale, affitto, tasse e
          tutte le altre. La pagina di partenza per pianificare interventi di razionalizzazione.
        </p>

        <h2>Punto di pareggio</h2>
        <p>
          Il fatturato minimo necessario per coprire i costi fissi. Sotto questa soglia
          l&apos;attività genera perdite; sopra, inizia a produrre utili.
        </p>

        <h2>Salute finanziaria</h2>
        <p>
          Un sistema a semaforo che restituisce, indicatore per indicatore, lo stato aziendale:
          verde quando il valore è in norma, giallo se richiede attenzione, rosso quando serve
          intervenire. Lettura sintetica in pochi secondi.
        </p>

        <h2>Previsione anno</h2>
        <p>
          Una proiezione di chiusura d&apos;esercizio basata sui mesi già consuntivati e su ipotesi
          di andamento per i mesi residui. Permette di anticipare il risultato finale e intervenire
          per tempo se necessario.
        </p>

        <h2>Cassa</h2>
        <p>
          Saldo corrente dei conti aziendali e proiezione di liquidità nei prossimi 90 giorni, con
          dettaglio delle scadenze in arrivo (tasse, F24, rate prestiti, fornitori).
        </p>

        <h2>Scadenze</h2>
        <p>
          L&apos;elenco completo dei pagamenti previsti — IVA, F24, rate prestiti, fatture fornitori
          — ordinati per data, con importo e dettagli per ciascuna voce.
        </p>

        <h2>Fatture</h2>
        <p>
          L&apos;archivio delle fatture emesse (attive) e ricevute (passive), aggiornato dal
          commercialista tramite il Sistema di Interscambio.
        </p>

        <h2>Movimenti</h2>
        <p>
          Le operazioni dei conti correnti aziendali, importate dagli estratti conto bancari e
          classificate per tipologia di entrata o uscita.
        </p>

        <h2>Glossario e Aiuto</h2>
        <p>
          Il glossario raccoglie le definizioni dei termini contabili usati nella dashboard (EBITDA,
          margine di contribuzione, margine netto e così via). L&apos;aiuto, dove ti trovi ora,
          ospita le guide operative di ogni pagina.
        </p>

        <HelpCallout variant="tip" title="Le pagine prioritarie">
          Per un controllo rapido bastano due pagine: <strong>Dashboard</strong> per la visione
          d&apos;insieme e <strong>Cassa</strong> per la situazione di liquidità. Le altre servono
          per gli approfondimenti e per le riunioni con il commercialista.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/dashboard-kpi">I numeri in cima: ricavi, EBITDA, utile</Link>
          </li>
          <li>
            <Link href="/aiuto/cassa-attuale">Quanto hai in cassa</Link>
          </li>
          <li>
            <Link href="/aiuto/salute-finanziaria">Salute finanziaria: il semaforo</Link>
          </li>
        </ul>
      </>
    ),
  },
];
