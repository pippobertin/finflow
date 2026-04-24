import Link from "next/link";
import type { HelpSection } from "../types";

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
        <p>
          Nella barra laterale della tua dashboard trovi diverse sezioni. Ognuna ti mostra un
          aspetto diverso della tua azienda. Ecco un giro veloce per capire cosa trovi in ciascuna.
        </p>

        <h2>Dashboard</h2>
        <p>
          La pagina principale. Appena entri in Finflow atterri qui. In alto trovi i numeri chiave
          (ricavi, EBITDA, utile netto) e sotto una serie di grafici che riassumono l&apos;andamento
          dell&apos;azienda. È il punto di partenza per avere una visione d&apos;insieme.
        </p>

        <h2>Andamento ricavi</h2>
        <p>
          Un grafico che mostra come è andato il tuo fatturato mese per mese (o trimestre per
          trimestre). Utile per capire se stai crescendo, se sei stabile o se c&apos;è qualche mese
          più debole.
        </p>

        <h2>Quanto guadagno</h2>
        <p>
          Qui vedi quanto ti resta davvero in tasca dopo aver pagato i costi. Non basta fatturare
          tanto: quello che conta è quanto rimane dopo le spese. Questa sezione te lo mostra in modo
          chiaro.
        </p>

        <h2>Dove vanno i soldi</h2>
        <p>
          Un&apos;analisi dei tuoi costi: materie prime, personale, affitto, utenze e tutto il
          resto. Grafici e tabelle ti aiutano a capire dove finiscono i soldi che incassi.
        </p>

        <h2>Punto di pareggio</h2>
        <p>
          Ti dice quanto devi fatturare come minimo per coprire tutti i costi fissi. Sotto quel
          livello sei in perdita, sopra inizi a guadagnare. Un numero semplice ma molto utile.
        </p>

        <h2>Situazione patrimoniale</h2>
        <p>
          Una fotografia di cosa possiede l&apos;azienda (attività) e cosa deve (debiti). Ti dà
          un&apos;idea della solidità complessiva.
        </p>

        <h2>Salute finanziaria</h2>
        <p>
          Un sistema a semaforo: verde, giallo, rosso. Ogni indicatore ti dice se un aspetto della
          tua azienda è in buona forma, se richiede attenzione o se c&apos;è un problema da
          affrontare.
        </p>

        <h2>Previsione anno</h2>
        <p>
          Una stima di come chiuderai l&apos;anno. Il sistema prende i dati reali dei mesi passati e
          proietta i mesi restanti, dandoti un&apos;idea anticipata del risultato di fine anno.
        </p>

        <h2>Cassa, Scadenze, Fatture, Movimenti</h2>
        <p>
          Sezioni operative: quanto hai in cassa, cosa devi pagare nei prossimi giorni,
          l&apos;elenco delle fatture emesse e ricevute, e i movimenti del conto corrente. Tutto
          importato e aggiornato dal tuo commercialista.
        </p>

        <h2>Glossario e Aiuto</h2>
        <p>
          Il glossario spiega in modo semplice ogni termine contabile che trovi nella dashboard.
          L&apos;aiuto (dove sei adesso) contiene guide dettagliate su ogni sezione.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Non devi per forza guardare tutte le sezioni ogni volta. Se hai poco tempo, la Dashboard
            e la sezione Cassa ti danno già un quadro rapido della situazione.
          </p>
        </div>

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
