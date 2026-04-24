import Link from "next/link";
import type { HelpSection } from "../types";

const CH = 6;
const CH_TITLE = "Estratti conto e movimenti";

export const sections: HelpSection[] = [
  {
    slug: "caricare-csv",
    title: "Caricare CSV da home banking",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["caricare", "CSV", "home banking", "import", "estratto conto"],
    content: () => (
      <>
        <p>
          Puoi importare i movimenti bancari del cliente caricando un file CSV esportato
          dall&apos;home banking. Il processo richiede pochi secondi e il sistema rileva
          automaticamente le transazioni duplicate per evitare doppioni.
        </p>

        <h2>Procedura di caricamento</h2>
        <p>
          Dalla scheda del cliente, apri il tab <strong>Movimenti</strong>. Premi il pulsante
          <strong> Carica estratto conto</strong> e seleziona <strong>CSV</strong> come formato.
          Scegli il file dal tuo computer. Il sistema lo legge e mostra un&apos;anteprima dei
          movimenti trovati prima di confermare l&apos;importazione.
        </p>

        <h2>Formato delle colonne</h2>
        <p>Il mapping predefinito prevede tre colonne:</p>
        <ul>
          <li>
            <strong>Data</strong> &mdash; la data dell&apos;operazione (formati accettati:
            GG/MM/AAAA, AAAA-MM-GG)
          </li>
          <li>
            <strong>Descrizione</strong> &mdash; la causale del movimento bancario
          </li>
          <li>
            <strong>Importo</strong> &mdash; il valore dell&apos;operazione (positivo per entrate,
            negativo per uscite)
          </li>
        </ul>
        <p>
          Se il file CSV usa nomi di colonne diversi, il sistema cerca di riconoscerli
          automaticamente. In caso di errore, verifica che le intestazioni delle colonne
          corrispondano ai nomi attesi.
        </p>

        <h2>Gestione dei duplicati</h2>
        <p>
          Quando carichi un CSV, il sistema confronta ogni riga con i movimenti già presenti nel
          database. Se trova una corrispondenza (stessa data, stessa descrizione, stesso importo),
          la riga viene marcata come duplicata e non viene importata. Al termine dell&apos;import,
          il sistema mostra il conteggio dei movimenti importati e di quelli scartati come
          duplicati.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Prima di esportare il CSV dalla banca, seleziona il periodo esatto che ti serve. Evita
            di scaricare periodi troppo ampi: il file sarà più leggero e l&apos;import più veloce.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/caricare-pdf">Caricare PDF</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/categorizzare-movimenti">
              Categorizzare movimenti verso il CDG
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/problemi-parsing">Risolvere problemi di parsing</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "caricare-pdf",
    title: "Caricare PDF",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["caricare", "PDF", "estratto conto", "import", "documento"],
    content: () => (
      <>
        <p>
          FinFlow supporta anche il caricamento di estratti conto in formato PDF. Il sistema
          utilizza parser specifici per ogni banca, che leggono il documento e ne estraggono i
          movimenti in modo automatico.
        </p>

        <h2>Procedura di caricamento</h2>
        <p>
          Dalla scheda del cliente, apri il tab <strong>Movimenti</strong>. Premi
          <strong> Carica estratto conto</strong> e seleziona <strong>PDF</strong> come formato.
          Prima di caricare il file, devi scegliere la banca dal menu a tendina. La selezione della
          banca determina quale parser verrà usato per leggere il documento.
        </p>

        <h2>Come funziona il parsing</h2>
        <p>
          Ogni banca produce PDF con un formato differente: posizione delle colonne, formato delle
          date, separatori numerici. FinFlow ha un parser dedicato per ciascuna delle banche
          supportate. Il parser analizza il testo del PDF, identifica le righe dei movimenti ed
          estrae data, descrizione e importo.
        </p>

        <h2>Risultato dell&apos;importazione</h2>
        <p>Al termine del parsing, il sistema mostra un riepilogo con:</p>
        <ul>
          <li>Numero di transazioni trovate nel PDF</li>
          <li>Numero di transazioni importate (nuove)</li>
          <li>Numero di transazioni duplicate (già presenti, ignorate)</li>
        </ul>
        <p>
          Se il conteggio è zero o molto basso rispetto a quanto ti aspetti, probabilmente hai
          selezionato la banca sbagliata o il PDF ha un formato non standard. Consulta la sezione
          sui problemi di parsing per le soluzioni.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il parser funziona solo con PDF che contengono testo selezionabile. Se il PDF è una
            scansione (immagine), il sistema non riesce a estrarre i movimenti. In quel caso, usa il
            formato CSV.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/banche-supportate">Le sei banche supportate di default</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/profilo-banca">Configurare un profilo banca nuovo</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/problemi-parsing">Risolvere problemi di parsing</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "banche-supportate",
    title: "Le sei banche supportate di default",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["banche", "supportate", "default", "intesa", "unicredit", "bper"],
    content: () => (
      <>
        <p>
          FinFlow include parser PDF preconfigurati per sei banche italiane. Questi profili sono
          pronti all&apos;uso e non richiedono alcuna configurazione. Basta selezionare la banca
          corretta prima di caricare il PDF.
        </p>

        <h2>Elenco delle banche supportate</h2>
        <p>I parser di default coprono le seguenti banche:</p>
        <ul>
          <li>
            <strong>Intesa Sanpaolo</strong> &mdash; supporta gli estratti conto standard e i PDF
            multi-pagina
          </li>
          <li>
            <strong>UniCredit</strong> &mdash; riconosce sia il formato classico che il formato My
            Genius
          </li>
          <li>
            <strong>BNL / BNP Paribas</strong> &mdash; parser compatibile con i PDF generati dal
            portale BNL
          </li>
          <li>
            <strong>Banca Popolare</strong> &mdash; copre i formati più comuni delle Banche Popolari
          </li>
          <li>
            <strong>BPER Banca</strong> &mdash; supporta il formato estratto conto smart BPER
          </li>
          <li>
            <strong>Monte dei Paschi di Siena</strong> &mdash; parser per il formato PDF standard
            MPS
          </li>
        </ul>

        <h2>Come sono costruiti i parser</h2>
        <p>
          Ogni parser è calibrato sullo specifico layout del PDF prodotto dalla banca: posizione
          delle colonne, formato delle date (GG/MM/AAAA o GG-MM-AAAA), separatore dei decimali
          (virgola o punto), gestione dei segni dare/avere. Il parser legge il testo riga per riga e
          usa espressioni regolari per identificare i movimenti.
        </p>

        <h2>Cosa fare se la banca non è in elenco</h2>
        <p>
          Se il cliente ha un conto presso una banca diversa dalle sei elencate, puoi creare un
          profilo personalizzato. Consulta la sezione &quot;Configurare un profilo banca nuovo&quot;
          per i passaggi. In alternativa, esporta i movimenti in CSV dall&apos;home banking: il
          formato CSV è universale e funziona con qualsiasi banca.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se il cliente ha conti presso più banche, carica gli estratti conto uno alla volta,
            selezionando la banca corretta per ciascuno. I movimenti di tutte le banche confluiscono
            nella stessa lista.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/caricare-pdf">Caricare PDF</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/profilo-banca">Configurare un profilo banca nuovo</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "categorizzare-movimenti",
    title: "Categorizzare movimenti verso il CDG",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["categorizzare", "movimenti", "CDG", "classificare", "conti"],
    content: () => (
      <>
        <p>
          Ogni movimento bancario importato può essere assegnato a una categoria CDG (Controllo di
          Gestione). Le categorie usate sono le stesse 17 voci della riclassificazione del bilancio,
          così puoi incrociare i dati bancari con il Conto Economico.
        </p>

        <h2>A cosa serve la categorizzazione</h2>
        <p>
          Assegnare una categoria CDG ai movimenti bancari permette di costruire un secondo livello
          di analisi: oltre ai dati contabili del bilancio di verifica, puoi verificare i flussi
          reali passati dal conto corrente. Questo è utile per confrontare l&apos;andamento
          contabile con quello finanziario.
        </p>

        <h2>Come assegnare una categoria</h2>
        <p>
          Nella tabella dei movimenti, ogni riga ha una colonna <strong>Categoria</strong>. Clicca
          sul badge per aprire il menu a tendina con le 17 categorie disponibili. Seleziona la
          categoria corretta. Il badge cambia colore in base alla categoria scelta, rendendo facile
          distinguere i tipi di operazione con un colpo d&apos;occhio.
        </p>

        <h2>Le 17 categorie CDG</h2>
        <p>
          Le categorie rispecchiano la struttura del Conto Economico riclassificato: ricavi delle
          vendite, costi per materie prime, costi per servizi, costo del personale, ammortamenti,
          proventi e oneri finanziari, e così via. Ogni categoria ha un colore assegnato. Se una
          voce non rientra in nessuna categoria, puoi lasciarla come &quot;Non categorizzato&quot;.
        </p>

        <h2>Categorizzazione di massa</h2>
        <p>
          Categorizzare ogni movimento singolarmente sarebbe troppo lento. Per questo FinFlow offre
          i pattern di riconoscimento automatico. Configura i pattern una volta e il sistema applica
          la categoria a tutti i movimenti con la stessa descrizione. Vedi la sezione dedicata per i
          dettagli.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Inizia categorizzando i movimenti con importi più grandi. Sono quelli che incidono di
            più sull&apos;analisi del CDG. Le piccole spese possono restare non categorizzate senza
            compromettere la qualità del report.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/pattern-riconoscimento">
              Pattern di riconoscimento automatico
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/mapping-piano-conti">
              Mappare il piano dei conti verso le categorie CDG
            </Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "pattern-riconoscimento",
    title: "Pattern di riconoscimento automatico",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["pattern", "riconoscimento", "automatico", "regole", "AI"],
    content: () => (
      <>
        <p>
          Il sistema di pattern ti permette di assegnare categorie CDG in modo automatico ai
          movimenti bancari. FinFlow analizza le descrizioni ricorrenti e le raggruppa in pattern.
          Tu assegni la categoria una sola volta e il sistema la applica a tutti i movimenti
          corrispondenti.
        </p>

        <h2>Come funzionano i pattern</h2>
        <p>
          FinFlow scansiona tutte le descrizioni dei movimenti importati e identifica le stringhe
          che si ripetono. Ad esempio, se molti movimenti contengono &quot;STIPENDI MESE&quot;, il
          sistema crea un pattern per quella descrizione. Tu assegni la categoria &quot;Costo del
          personale&quot; a quel pattern e tutti i movimenti con quella descrizione vengono
          categorizzati in automatico.
        </p>

        <h2>La pagina Pattern</h2>
        <p>
          Accedi alla lista dei pattern dal tab <strong>Movimenti</strong> &gt;
          <strong> Pattern</strong>. Ogni riga mostra:
        </p>
        <ul>
          <li>La stringa del pattern riconosciuto</li>
          <li>Il numero di movimenti che corrispondono</li>
          <li>La categoria CDG assegnata (o &quot;da assegnare&quot;)</li>
        </ul>
        <p>
          Clicca sulla categoria per modificarla. Il menu a tendina mostra le 17 categorie CDG
          disponibili.
        </p>

        <h2>Applicare i pattern a tutti i movimenti</h2>
        <p>
          Dopo aver assegnato le categorie ai pattern, premi il pulsante
          <strong> Applica tutto</strong>. Il sistema aggiorna la categoria di tutti i movimenti che
          corrispondono ai pattern configurati. L&apos;operazione è irreversibile: i movimenti già
          categorizzati manualmente vengono sovrascritti se corrispondono a un pattern con categoria
          diversa.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            &quot;Applica tutto&quot; sovrascrive le categorie esistenti. Se hai categorizzato
            manualmente alcuni movimenti e vuoi preservarli, verifica i pattern prima di premere il
            pulsante.
          </p>
        </div>

        <h2>Nuovi movimenti e pattern esistenti</h2>
        <p>
          Quando carichi nuovi movimenti, il sistema verifica automaticamente se corrispondono a
          pattern già configurati. Se trova una corrispondenza, assegna la categoria in automatico
          senza bisogno di premere &quot;Applica tutto&quot; di nuovo.
        </p>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/categorizzare-movimenti">
              Categorizzare movimenti verso il CDG
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-csv">Caricare CSV da home banking</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "profilo-banca",
    title: "Configurare un profilo banca nuovo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 6,
    keywords: ["profilo", "banca", "nuovo", "configurare", "template"],
    content: () => (
      <>
        <p>
          Se il cliente ha un conto presso una banca non inclusa tra le sei di default, puoi creare
          un profilo personalizzato. Questa funzione è pensata per utenti avanzati che lavorano con
          istituti di credito minori o banche estere.
        </p>

        <h2>Dove creare il profilo</h2>
        <p>
          Vai su <strong>Templates</strong> &gt; <strong>PDF Banks</strong> dalla navigazione
          principale dello studio. Premi <strong>Nuovo profilo</strong>. Si apre il modulo di
          configurazione.
        </p>

        <h2>Campi da compilare</h2>
        <p>Il profilo banca richiede le seguenti informazioni:</p>
        <ul>
          <li>
            <strong>Nome banca</strong> &mdash; il nome che apparirà nel menu a tendina durante il
            caricamento PDF
          </li>
          <li>
            <strong>Mapping colonne</strong> &mdash; la posizione delle colonne nel PDF (data,
            descrizione, dare, avere o importo unico)
          </li>
          <li>
            <strong>Formato data</strong> &mdash; il formato usato dalla banca (ad es. GG/MM/AAAA,
            GG-MM-AA, AAAA-MM-GG)
          </li>
          <li>
            <strong>Separatore decimale</strong> &mdash; virgola o punto
          </li>
        </ul>

        <h2>Testare il profilo</h2>
        <p>
          Dopo aver salvato il profilo, torna alla pagina Movimenti di un cliente e prova a caricare
          un PDF della nuova banca. Seleziona il profilo appena creato dal menu a tendina. Verifica
          che il numero di movimenti estratti corrisponda a quanto presente nel PDF. Se il risultato
          non è corretto, modifica il mapping delle colonne e riprova.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Per capire il layout del PDF, apri il documento e prova a selezionare il testo con il
            mouse. Se riesci a selezionare le singole colonne, il PDF è adatto al parsing. Annota la
            posizione delle colonne data, descrizione e importo per compilare il mapping.
          </p>
        </div>

        <h2>Condividere il profilo tra clienti</h2>
        <p>
          I profili banca che crei sono disponibili per tutti i clienti del tuo studio. Non serve
          ricrearli per ogni cliente. Se più clienti usano la stessa banca, basta selezionare lo
          stesso profilo durante il caricamento.
        </p>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/banche-supportate">Le sei banche supportate di default</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-pdf">Caricare PDF</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/problemi-parsing">Risolvere problemi di parsing</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "problemi-parsing",
    title: "Risolvere problemi di parsing",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 7,
    keywords: ["problemi", "parsing", "errori", "debug", "formato"],
    content: () => (
      <>
        <p>
          A volte il caricamento di un estratto conto PDF non produce i risultati attesi: nessun
          movimento importato, movimenti parziali o importi errati. Questa sezione raccoglie i
          problemi più comuni e le relative soluzioni.
        </p>

        <h2>Problema: nessun movimento trovato</h2>
        <p>
          La causa più frequente è la selezione della banca sbagliata. Ogni banca ha un layout PDF
          diverso e il parser cerca le colonne nella posizione specifica di quella banca. Soluzione:
          torna al caricamento e verifica di aver selezionato la banca corretta dal menu a tendina.
        </p>

        <h2>Problema: il PDF è una scansione</h2>
        <p>
          Se il PDF è stato generato da uno scanner (ad esempio, un estratto conto cartaceo
          digitalizzato), il file contiene immagini e non testo. Il parser di FinFlow lavora solo
          con PDF testuali. Per verificare, apri il PDF e prova a selezionare il testo con il mouse:
          se non riesci, è una scansione. Soluzione: chiedi alla banca una copia digitale
          dell&apos;estratto conto, oppure esporta i movimenti in formato CSV dall&apos;home
          banking.
        </p>

        <h2>Problema: colonne disallineate</h2>
        <p>
          Alcune banche aggiornano il formato dei PDF nel tempo. Se il parser è calibrato su un
          formato vecchio e la banca ha cambiato layout, le colonne non corrispondono più.
          Soluzione: prova a usare un profilo banca diverso oppure usa il formato CSV. Se il
          problema persiste, crea un nuovo profilo banca con il mapping aggiornato.
        </p>

        <h2>Problema: importi con segno invertito</h2>
        <p>
          Alcune banche usano colonne separate per dare e avere, altre usano un&apos;unica colonna
          con segno positivo/negativo. Se gli importi appaiono con il segno invertito (entrate
          negative e uscite positive), il profilo banca ha bisogno di una correzione nel mapping
          delle colonne.
        </p>

        <h2>Messaggi di errore</h2>
        <p>
          Dopo ogni caricamento, il sistema mostra eventuali avvisi. Leggi con attenzione i messaggi
          in giallo e in rosso: spesso indicano la causa esatta del problema (ad esempio
          &quot;Nessun testo trovato nel PDF&quot; o &quot;Formato data non riconosciuto&quot;).
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Non forzare il caricamento con una banca sbagliata nella speranza che funzioni. I
            movimenti importati con mapping errato avranno date e importi sbagliati, e sarà
            difficile correggerli dopo.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/caricare-pdf">Caricare PDF</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-csv">Caricare CSV da home banking</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/profilo-banca">Configurare un profilo banca nuovo</Link>
          </li>
        </ul>
      </>
    ),
  },
];
