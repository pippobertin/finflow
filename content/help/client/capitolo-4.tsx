import Link from "next/link";
import type { HelpSection } from "../types";

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
        <p>
          La pagina Movimenti ti mostra tutte le operazioni del tuo conto corrente: bonifici in
          entrata, pagamenti in uscita, addebiti automatici e qualsiasi altro movimento registrato
          dalla banca. È come un estratto conto, ma organizzato in modo più leggibile.
        </p>

        <h2>Chi carica i movimenti</h2>
        <p>
          I movimenti bancari vengono importati dal tuo commercialista. Lui scarica l&apos;estratto
          conto dalla banca (o dal gestionale contabile) e lo carica in Finflow. Tu puoi
          consultarli, ma non puoi modificarli o aggiungerne di nuovi.
        </p>
        <p>
          Se mancano movimenti recenti, è probabile che il commercialista non abbia ancora fatto
          l&apos;ultimo aggiornamento. I dati non arrivano in tempo reale dalla banca: vengono
          caricati periodicamente.
        </p>

        <h2>Le categorie colorate</h2>
        <p>
          Ogni movimento ha una categoria assegnata, indicata da un&apos;etichetta colorata. Le
          categorie raggruppano i movimenti per tipo: ricavi da vendite, costi del personale,
          utenze, acquisti di materie prime e così via.
        </p>
        <p>
          La categorizzazione la gestisce il tuo commercialista. Alcuni movimenti vengono
          categorizzati automaticamente dal sistema (ad esempio gli stipendi ricorrenti), altri
          vengono classificati manualmente.
        </p>
        <p>
          Le categorie sono utili perché ti permettono di capire a colpo d&apos;occhio dove vanno i
          soldi senza dover leggere ogni singola descrizione.
        </p>

        <h2>Cosa trovi in ogni riga</h2>
        <p>Per ogni movimento vedi:</p>
        <ul>
          <li>
            <strong>Data</strong> — quando è avvenuta l&apos;operazione
          </li>
          <li>
            <strong>Descrizione</strong> — il testo del movimento bancario (causale)
          </li>
          <li>
            <strong>Importo</strong> — positivo se sono soldi in entrata, negativo se in uscita
          </li>
          <li>
            <strong>Categoria</strong> — il tipo di costo o ricavo a cui appartiene
          </li>
        </ul>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se noti un movimento che non riconosci o che ti sembra classificato nel modo sbagliato,
            segnalalo al tuo commercialista. Lui può correggerlo e assicurarsi che i report siano
            accurati.
          </p>
        </div>

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
        <p>
          Puoi cambiare la tua password in qualsiasi momento dal tuo profilo. Ecco come fare, passo
          per passo.
        </p>

        <h2>Come cambiare la password</h2>
        <p>
          Clicca sulla tua icona profilo (o sulle tue iniziali) in alto a destra nella barra
          dell&apos;applicazione. Si apre un menu: seleziona la voce che porta al tuo profilo o alle
          impostazioni dell&apos;account. Da lì trovi il campo per cambiare la password.
        </p>
        <p>
          Ti verrà chiesto di inserire la password attuale e poi di scegliere una nuova password.
          Conferma la nuova password scrivendola due volte e salva.
        </p>

        <h2>Requisiti della password</h2>
        <p>La password deve avere:</p>
        <ul>
          <li>Almeno 8 caratteri</li>
          <li>Una combinazione di lettere e numeri</li>
        </ul>
        <p>
          Evita password troppo semplici come &quot;12345678&quot; o &quot;password&quot;. Scegli
          qualcosa che sia facile da ricordare per te ma difficile da indovinare per gli altri.
        </p>

        <h2>Password dimenticata</h2>
        <p>
          Se hai dimenticato la password e non riesci ad accedere, contatta il tuo commercialista.
          Lui può resettare l&apos;accesso e inviarti un nuovo link per impostare una nuova
          password. Non esiste al momento un sistema automatico di recupero password: il riferimento
          è sempre il tuo commercialista.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Non condividere la tua password con nessuno, nemmeno con il commercialista. Lui ha il
            suo accesso separato e non ha bisogno della tua password per gestire i tuoi dati.
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
        <p>
          Finflow ti mostra i dati della tua azienda, ma la gestione dei dati è tutta in mano al tuo
          commercialista. Se qualcosa non torna, se hai domande su un numero o se hai bisogno di un
          chiarimento, il tuo riferimento è sempre lui.
        </p>

        <h2>Quando contattare il commercialista</h2>
        <p>Ecco alcune situazioni in cui è il caso di sentirlo:</p>
        <ul>
          <li>Vedi un numero che ti sembra sbagliato o diverso da quello che ti aspettavi</li>
          <li>Mancano dati recenti (ad esempio i movimenti dell&apos;ultimo mese non compaiono)</li>
          <li>Un movimento bancario è categorizzato in modo sbagliato</li>
          <li>Vuoi capire meglio cosa significa un indicatore o un grafico</li>
          <li>Hai dimenticato la password e non riesci ad accedere</li>
          <li>Vuoi discutere i risultati e capire cosa fare per migliorare la situazione</li>
        </ul>

        <h2>Tu non puoi modificare i dati</h2>
        <p>
          Il tuo accesso a Finflow è in sola lettura. Non puoi aggiungere, modificare o cancellare
          nessun dato. Questa scelta è voluta: garantisce che i numeri che vedi siano sempre
          coerenti con la contabilità ufficiale gestita dal professionista. Se qualcosa va cambiato,
          è il commercialista a farlo.
        </p>

        <h2>Come raggiungerlo</h2>
        <p>
          Contatta il tuo commercialista con i canali che usate abitualmente: telefono, email,
          WhatsApp o quello che preferite. Quando gli segnali qualcosa, cerca di essere specifico:
          digli quale pagina stavi guardando, quale numero ti sembra strano e in quale periodo. Così
          potrà verificare più velocemente.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Quando segnali qualcosa al commercialista, fai uno screenshot della pagina.
            Un&apos;immagine vale più di mille parole e gli farà capire subito cosa stai vedendo.
          </p>
        </div>

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
