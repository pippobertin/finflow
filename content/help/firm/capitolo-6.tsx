import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpSteps, HelpStep } from "@/components/help/help-steps";

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Il modo più rapido per portare i movimenti bancari del cliente in Finflow è caricare un
          CSV esportato dall&apos;home banking. Il sistema riconosce le colonne, importa i movimenti
          e scarta automaticamente i duplicati.
        </p>

        <h2>Caricare il CSV in tre passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri Movimenti e clicca Carica estratto conto">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>Movimenti</strong>. In alto
              trovi il pulsante <strong>Carica estratto conto</strong>. Accanto c&apos;è la barra di
              ricerca per filtrare i movimenti già presenti (utile dopo l&apos;import).
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-csv/01-pulsante-carica.png"
              alt="Scheda Movimenti con pulsante Carica estratto conto e ricerca"
              caption="Il pulsante Carica estratto conto si trova in alto nella scheda Movimenti"
              width={1635}
              height={251}
              hotspots={[
                { x: 92, y: 25, label: 1, tooltip: "Carica estratto conto" },
                { x: 35, y: 55, label: 2, tooltip: "Barra di ricerca movimenti" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Seleziona il file CSV e clicca Importa">
            <p>
              Si apre un dialog con il selettore file. Scegli il CSV esportato dall&apos;home
              banking (o un file <code>.xlsx</code>: Finflow accetta entrambi). Con i CSV non serve
              specificare la banca: il formato è standard e il parser lo legge direttamente. Clicca{" "}
              <strong>Importa</strong> per avviare il caricamento.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-csv/02-dialog-upload-csv.png"
              alt="Dialog di caricamento estratto conto con file CSV selezionato"
              caption="Il dialog per il CSV: solo selettore file, niente banca richiesta"
              width={542}
              height={224}
              hotspots={[
                { x: 50, y: 42, label: 1, tooltip: "Selettore file (CSV, PDF o XLSX)" },
                { x: 72, y: 88, label: 2, tooltip: "Pulsante Importa" },
              ]}
            />
          </HelpStep>

          <HelpStep number={3} title="Verifica i movimenti importati">
            <p>
              Dopo l&apos;import la lista si popola con i nuovi movimenti. Ogni riga mostra data,
              descrizione, importo in euro e la categoria CDG (vuota se non ancora categorizzata).
              Finflow ti notifica quanti movimenti sono stati importati e quanti scartati come
              duplicati.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-csv/03-movimenti-importati.png"
              alt="Lista movimenti dopo l'import con data, descrizione, importo"
              caption="I movimenti appena importati compaiono nella lista, pronti per la categorizzazione"
              width={1634}
              height={580}
              hotspots={[{ x: 50, y: 15, label: 1, tooltip: "Righe movimenti importati" }]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Colonne attese nel CSV</h2>
        <p>
          Il parser predefinito riconosce tre colonne principali, anche con nomi leggermente
          diversi:
        </p>
        <ul>
          <li>
            <strong>Data</strong>: la data di contabilizzazione o di valuta (formati accettati:
            GG/MM/AAAA, AAAA-MM-GG, GG-MM-AAAA).
          </li>
          <li>
            <strong>Descrizione</strong>: la causale del movimento (es. &quot;BONIFICO SEPA
            DA...&quot;, &quot;ADDEBITO UTENZA...&quot;).
          </li>
          <li>
            <strong>Importo</strong>: valore numerico positivo per le entrate, negativo per le
            uscite.
          </li>
        </ul>
        <p>
          Alcuni CSV bancari hanno due colonne separate (Entrate ed Uscite) invece di una colonna
          Importo con segno. Il parser gestisce anche questo caso: se vede due colonne numeriche
          mutualmente esclusive, le fonde automaticamente in un importo con segno.
        </p>

        <HelpCallout variant="info" title="Come funziona il riconoscimento duplicati">
          Prima di inserire ogni riga, Finflow la confronta con i movimenti già presenti nel
          database per lo stesso cliente. Se trova una corrispondenza su data + descrizione +
          importo, scarta la riga come duplicata. Questo ti permette di ricaricare lo stesso
          estratto conto senza creare doppioni, utile quando esporti mensilmente periodi
          sovrapposti.
        </HelpCallout>

        <HelpCallout variant="tip" title="Periodi mirati, file più leggeri">
          Prima di esportare il CSV dall&apos;home banking seleziona l&apos;intervallo di date
          esatto che ti serve. Evita di scaricare anni interi: file piccoli si importano in frazioni
          di secondo e sono più facili da verificare a occhio se qualcosa va storto.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Molte banche non espongono esportazioni CSV complete o pulite. In quei casi puoi caricare
          direttamente il PDF dell&apos;estratto conto: Finflow lo legge usando un parser dedicato
          alla banca scelta e ne estrae i movimenti.
        </p>

        <h2>Caricare il PDF in tre passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri il dialog di upload e seleziona il PDF">
            <p>
              Dalla scheda <strong>Movimenti</strong> clicca <strong>Carica estratto conto</strong>.
              Nel dialog seleziona il file PDF dal tuo computer. Appena Finflow riconosce
              l&apos;estensione <code>.pdf</code>, nel dialog compare un secondo campo obbligatorio:
              il selettore <strong>Banca</strong>.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-pdf/01-dialog-upload-pdf.png"
              alt="Dialog con file PDF selezionato e selettore banca visibile"
              caption="Con un PDF compare il selettore Banca: serve per scegliere il parser corretto"
              width={540}
              height={301}
              hotspots={[
                { x: 50, y: 35, label: 1, tooltip: "File PDF selezionato" },
                { x: 50, y: 65, label: 2, tooltip: "Selettore Banca (obbligatorio per PDF)" },
                { x: 75, y: 93, label: 3, tooltip: "Pulsante Importa" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Scegli la banca dal dropdown">
            <p>
              Il dropdown mostra le banche configurate: le sei supportate di default (Intesa
              Sanpaolo, Unicredit, BPER, Banco BPM, Credit Agricole, BCC) più eventuali profili
              personalizzati creati dal tuo studio. Ogni voce corrisponde a un parser dedicato che
              sa come leggere il formato specifico di quella banca.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-pdf/02-selettore-banca.png"
              alt="Dropdown banche aperto con elenco delle banche disponibili"
              caption="Le banche disponibili: ognuna ha un parser dedicato al suo formato PDF"
              width={176}
              height={231}
              hotspots={[{ x: 50, y: 50, label: 1, tooltip: "Elenco banche disponibili" }]}
            />
          </HelpStep>

          <HelpStep number={3} title="Importa e verifica il risultato">
            <p>
              Clicca <strong>Importa</strong>. Il parser analizza il PDF riga per riga, estrae date,
              descrizioni e importi, li classifica come entrate o uscite in base alla colonna di
              provenienza e alle parole chiave. Al termine la lista movimenti si popola con i nuovi
              record e Finflow ti notifica quanti movimenti sono stati importati e quanti scartati
              come duplicati.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-pdf/03-risultato-import.png"
              alt="Lista movimenti dopo l'import del PDF con righe bancarie italiane"
              caption="Dopo l'import, i movimenti del PDF compaiono nella lista pronti per la categorizzazione"
              width={1634}
              height={580}
              hotspots={[{ x: 50, y: 15, label: 1, tooltip: "Movimenti estratti dal PDF" }]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Perché serve scegliere la banca</h2>
        <p>
          Ogni banca produce PDF con un layout diverso: posizione delle colonne, formato delle date
          (gg/mm/aa vs gg-mm-aaaa), separatori numerici (virgola vs punto), presenza di colonne
          Entrate/Uscite separate o una singola colonna Importo firmato, parole chiave che indicano
          movimenti in entrata o uscita. Un parser unico non può gestire tutte queste varianti senza
          compromessi. Il sistema usa quindi profili dedicati: scegliendo la banca giusta dal
          dropdown garantisci che il parser interpreti correttamente ogni riga.
        </p>

        <HelpCallout variant="warning" title="Attenzione ai PDF scansionati">
          Il parser funziona solo su PDF con testo selezionabile (quelli generati dall&apos;home
          banking di solito lo sono). Se il PDF è una scansione fotografica, il contenuto è
          un&apos;immagine e il parser non può estrarre nulla. In quel caso richiedi al cliente
          l&apos;esportazione in CSV o, se proprio non è possibile, inserisci i movimenti a mano.
        </HelpCallout>

        <HelpCallout variant="info" title="Se la tua banca non è in lista">
          Puoi creare un profilo banca personalizzato con parametri specifici (selettori data,
          importo, descrizione, parole chiave per entrate e uscite). Leggi{" "}
          <Link href="/firm/aiuto/profilo-banca" className="font-medium underline">
            Configurare un profilo banca nuovo
          </Link>
          .
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Categorizzare un movimento significa assegnargli una delle 17 categorie CDG, le stesse
          usate per il conto economico riclassificato. È il passaggio che trasforma un elenco di
          bonifici e addebiti in un&apos;analisi per natura di costo e ricavo.
        </p>

        <h2>A cosa serve</h2>
        <p>
          Il bilancio di verifica ti dà il quadro contabile del cliente. Gli estratti conto bancari
          ti danno il quadro finanziario: cosa è passato davvero dal conto corrente, quando e verso
          chi. Categorizzando i movimenti con lo stesso schema del CE riclassificato puoi
          confrontare le due viste, individuare differenze di competenza vs cassa, e costruire
          analisi di flusso reali (Margine di contribuzione cash, EBITDA cash, burn rate) che la
          sola contabilità non mostra.
        </p>

        <h2>Come appaiono i movimenti categorizzati</h2>
        <p>
          Nella scheda Movimenti, la colonna <strong>Categoria CDG</strong> mostra lo stato di ogni
          riga: un <strong>badge blu</strong> con il nome della categoria per i movimenti
          classificati, un <strong>trattino</strong> per quelli non ancora categorizzati. Il
          contrasto visivo ti permette di valutare a colpo d&apos;occhio la copertura: più badge
          vedi, più movimenti sono già assegnati e pronti per l&apos;analisi.
        </p>
        <HelpScreenshot
          src="/help/firm/categorizzare-movimenti/01-movimenti-categorizzati.png"
          alt="Lista movimenti con mix di righe categorizzate (badge blu) e non categorizzate"
          caption="I badge blu segnano i movimenti categorizzati, il trattino quelli ancora da classificare"
          width={1627}
          height={575}
          hotspots={[
            { x: 55, y: 30, label: 1, tooltip: "Badge categoria assegnata" },
            { x: 55, y: 70, label: 2, tooltip: "Movimento ancora da categorizzare" },
          ]}
        />
        <HelpScreenshot
          src="/help/firm/categorizzare-movimenti/02-zoom-badge-categoria.png"
          alt="Dettaglio ravvicinato di due righe con categorie diverse"
          caption="Lo zoom mostra come diverse categorie convivono nella stessa lista"
          width={450}
          height={147}
          hotspots={[{ x: 50, y: 50, label: 1, tooltip: "Badge Categoria CDG" }]}
        />

        <h2>La categorizzazione passa dai Pattern</h2>
        <p>
          In Finflow non si categorizza un movimento alla volta cliccando su un dropdown: sarebbe
          impraticabile per conti con centinaia di movimenti al mese. La categorizzazione avviene
          tramite i <strong>Pattern</strong>, regole testuali che associano una porzione di
          descrizione del movimento a una categoria CDG. Definisci una regola (es.
          &quot;cedolino&quot; → Lavoro diretto) e Finflow la applica a tutti i movimenti passati e
          futuri che corrispondono.
        </p>

        <HelpCallout variant="info" title="Due passaggi: Conferma e Applica">
          Quando crei un pattern dai suggerimenti, il sistema lo <strong>registra</strong> ma non lo
          applica automaticamente ai movimenti esistenti. Per vedere i badge popolarsi devi cliccare{" "}
          <strong>Applica tutto</strong> in alto nella pagina Pattern. È un doppio passaggio voluto:
          ti permette di creare/modificare più regole e applicarle in un colpo solo, senza ricalcoli
          parziali intermedi. Se crei le regole e dimentichi l&apos;Applica, la lista movimenti
          resta senza badge.
        </HelpCallout>

        <HelpCallout variant="tip" title="Da dove partire">
          La prima volta che categorizzi un cliente, ordina mentalmente i movimenti per importo
          decrescente: i pochi movimenti grandi (stipendi, affitti, fornitori principali) coprono la
          maggior parte del volume. Crea pattern per loro per primi. Le piccole spese miste possono
          restare non categorizzate senza compromettere l&apos;analisi di CDG: conta l&apos;impatto,
          non la completezza.
        </HelpCallout>

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
    keywords: ["pattern", "riconoscimento", "automatico", "regole", "regex", "priorità"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          I Pattern sono il meccanismo principale per categorizzare i movimenti in Finflow. Ogni
          pattern è una regola che associa una porzione di descrizione (una regex) a una categoria
          CDG. Una regola ben scritta categorizza decine o centinaia di movimenti simili in un colpo
          solo.
        </p>

        <h2>Creare pattern dai suggerimenti</h2>
        <p>
          La pagina Pattern si apre con in cima una sezione <strong>Suggerimenti</strong>: Finflow
          scansiona i movimenti non ancora categorizzati, raggruppa le descrizioni simili e ti
          propone una riga per ciascun gruppo. Per ogni suggerimento scegli la categoria CDG dal
          dropdown e clicchi <strong>Conferma</strong>. Il sistema crea un pattern con la regex
          derivata dalla descrizione normalizzata del gruppo.
        </p>
        <HelpScreenshot
          src="/help/firm/pattern-riconoscimento/01-suggerimenti.png"
          alt="Sezione Suggerimenti con gruppi di movimenti non categorizzati e dropdown categoria"
          caption="I suggerimenti raggruppano movimenti simili: scegli la categoria e conferma"
          width={949}
          height={838}
          hotspots={[
            { x: 60, y: 25, label: 1, tooltip: "Descrizione normalizzata" },
            { x: 30, y: 45, label: 2, tooltip: "Dropdown Categoria CDG" },
            { x: 85, y: 45, label: 3, tooltip: "Pulsante Conferma" },
          ]}
        />

        <h2>Le regole attive e il pulsante Applica tutto</h2>
        <p>
          Sotto la sezione Suggerimenti trovi la lista dei pattern già creati: per ciascuno vedi la
          regex, la categoria CDG associata, la priorità e il conteggio movimenti matchati. In alto
          c&apos;è il pulsante <strong>Applica tutto</strong>: è il passaggio chiave che attiva le
          regole sui movimenti esistenti.
        </p>
        <HelpScreenshot
          src="/help/firm/pattern-riconoscimento/02-lista-regole.png"
          alt="Lista regole attive e pulsante Applica tutto"
          caption="La lista dei pattern configurati, con il pulsante Applica tutto in evidenza"
          width={1636}
          height={654}
          hotspots={[
            { x: 92, y: 12, label: 1, tooltip: "Applica tutto" },
            { x: 50, y: 50, label: 2, tooltip: "Lista regole attive" },
          ]}
        />

        <HelpCallout variant="warning" title="Due passaggi obbligatori: Conferma poi Applica tutto">
          Quando confermi un suggerimento, Finflow crea il pattern ma{" "}
          <strong>non lo applica automaticamente ai movimenti esistenti</strong>. Per vedere i badge
          categoria popolarsi nella scheda Movimenti, devi cliccare <strong>Applica tutto</strong>{" "}
          in questa stessa pagina. Se salti questo passaggio, le regole restano create ma i
          movimenti restano non categorizzati. È voluto: l&apos;applicazione in un unico passaggio
          ti permette di creare o modificare più regole prima di lanciare l&apos;esecuzione.
        </HelpCallout>

        <h2>Il dialog Modifica Pattern</h2>
        <p>
          Cliccando su una regola esistente si apre il dialog Modifica Pattern. Contiene quattro
          campi:
        </p>
        <ul>
          <li>
            <strong>Regex descrizione</strong>: l&apos;espressione regolare che viene testata contro
            la descrizione di ogni movimento. Quando la regex matcha, il pattern si applica.
          </li>
          <li>
            <strong>Categoria CDG</strong>: una delle 17 categorie (Ricavi, Costi variabili, Costi
            fissi, eccetera).
          </li>
          <li>
            <strong>Aliquota IVA</strong>: opzionale. Se impostata, Finflow calcola lo split
            imponibile/IVA per ogni movimento matchato e popola i campi <code>netAmount</code> e{" "}
            <code>vatAmount</code> del movimento.
          </li>
          <li>
            <strong>Priorità</strong>: numero intero (default 100). Determina l&apos;ordine in cui
            le regole vengono provate. <strong>Numero più basso = priorità più alta</strong>.
          </li>
        </ul>
        <HelpScreenshot
          src="/help/firm/pattern-riconoscimento/03-dialog-modifica.png"
          alt="Dialog Modifica Pattern con campi regex, categoria, IVA, priorità"
          caption="Il dialog per modificare un pattern: regex, categoria, IVA e priorità"
          width={531}
          height={351}
          hotspots={[
            { x: 50, y: 28, label: 1, tooltip: "Regex descrizione" },
            { x: 50, y: 50, label: 2, tooltip: "Categoria CDG" },
            { x: 25, y: 72, label: 3, tooltip: "Aliquota IVA (opzionale)" },
            { x: 75, y: 72, label: 4, tooltip: "Priorità (più basso = più prioritario)" },
          ]}
        />

        <h2>Scrivere buone regex</h2>
        <p>
          Il suggerimento automatico di Finflow talvolta produce regex troppo specifiche: se la
          descrizione normalizzata contiene ancora nomi propri, mesi o codici variabili, la regex
          matcha solo il movimento originale. In questi casi devi modificare la regex per renderla
          più generica. Le quattro sintassi che ti servono nel 90% dei casi:
        </p>
        <ul>
          <li>
            <strong>Parola chiave semplice</strong>: <code>cedolino</code> matcha qualsiasi
            descrizione che contiene la parola &quot;cedolino&quot; (case-insensitive, quindi anche
            CEDOLINO e Cedolino).
          </li>
          <li>
            <strong>Alternativa con barra verticale</strong>:{" "}
            <code>cedolino|tredicesima|quattordicesima</code> matcha se la descrizione contiene una
            qualsiasi di queste tre parole.
          </li>
          <li>
            <strong>Concatenazione con punto-asterisco</strong>: <code>CANZI CHIARA.*cedolino</code>
            matcha solo le descrizioni che contengono prima &quot;CANZI CHIARA&quot; e poi
            &quot;cedolino&quot; (in quest&apos;ordine, con qualsiasi cosa in mezzo).
          </li>
          <li>
            <strong>Gruppo con alternative</strong>:{" "}
            <code>(CANZI CHIARA|ROSSI MARIO).*cedolino</code> matcha se la descrizione contiene uno
            dei due nomi seguito da &quot;cedolino&quot;.
          </li>
        </ul>

        <HelpCallout variant="info" title="Piccoli gotcha di regex">
          L&apos;asterisco <code>*</code> da solo non significa &quot;qualsiasi cosa&quot;: è un
          quantificatore che si attacca al carattere precedente. La forma corretta per dire
          &quot;qualsiasi sequenza di caratteri&quot; è <code>.*</code> (punto più asterisco). Gli
          spazi dentro le parentesi o attorno alla barra verticale entrano nel match: evita di
          metterli se non sono voluti. I due punti <code>:</code> sono letterali, non hanno
          significato speciale.
        </HelpCallout>

        <h2>La priorità risolve i conflitti</h2>
        <p>
          Cosa succede se due regole matchano lo stesso movimento? Vince quella con priorità più
          bassa. Esempio concreto: vuoi che i cedolini dell&apos;amministratrice Canzi Chiara siano
          classificati come &quot;compensi amministratori&quot; e i cedolini di tutti gli altri
          dipendenti come &quot;lavoro diretto&quot;. Le due regole avranno entrambe la parola
          &quot;cedolino&quot; nella regex, quindi si sovrappongono. La soluzione è differenziarle
          per priorità.
        </p>
        <ul>
          <li>
            Regola <strong>compensi amministratori</strong>: regex{" "}
            <code>CANZI CHIARA.*cedolino</code>, priorità <strong>50</strong>. Più specifica, più
            alta priorità.
          </li>
          <li>
            Regola <strong>lavoro diretto</strong>: regex{" "}
            <code>cedolino|tredicesima|quattordicesima</code>, priorità <strong>100</strong>. Più
            generica, fa da fallback.
          </li>
        </ul>
        <p>
          Finflow prova prima la regola con priorità 50: se la descrizione del movimento contiene
          &quot;CANZI CHIARA&quot; la classifica come compensi amministratori; altrimenti passa alla
          regola con priorità 100 che categorizza tutti gli altri cedolini come lavoro diretto.
          Questo schema &quot;specifico prima, generico dopo&quot; è il modo più pulito per gestire
          qualunque sovrapposizione.
        </p>

        <h2>Pattern applicati ai nuovi movimenti</h2>
        <p>
          Una volta configurate le regole, ogni volta che carichi un nuovo estratto conto Finflow
          controlla automaticamente se i nuovi movimenti matchano i pattern esistenti e, se sì, li
          categorizza al momento dell&apos;import. Non serve rieseguire{" "}
          <strong>Applica tutto</strong>
          manualmente a ogni caricamento. Lo esegui solo quando cambi regex o crei nuove regole.
        </p>

        <HelpCallout variant="tip" title="Cosa fare se una regola non matcha">
          Se dopo &quot;Applica tutto&quot; vedi pochi movimenti categorizzati o nessuno, apri il
          dialog di modifica di quella regola e guarda la regex. Se è lunga e piena di parole
          specifiche (nomi di mesi, IBAN, importi), significa che la normalizzazione non ha tolto
          abbastanza dettagli. Sostituiscila con una versione più generica basata sulla parola
          chiave principale. Poi clicca di nuovo Applica tutto.
        </HelpCallout>

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
          <li>
            <Link href="/firm/aiuto/caricare-pdf">Caricare PDF</Link>
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
    keywords: ["profilo", "banca", "nuovo", "configurare", "template", "regex"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Se il cliente usa una banca non inclusa tra le sei supportate di default, puoi creare un
          profilo personalizzato che istruisce Finflow a leggere i suoi PDF. È una funzione
          avanzata: richiede dimestichezza con le espressioni regolari e la disponibilità di almeno
          un PDF di esempio su cui testare.
        </p>

        <HelpCallout variant="info" title="Prima di iniziare">
          Questa sezione è pensata per controller con esperienza tecnica. Se non hai mai scritto
          regex, valuta se puoi chiedere al cliente l&apos;esportazione CSV (universale, non
          richiede configurazione) invece di lavorare sul PDF. In alternativa, fatti aiutare da un
          collega sviluppatore o manda un ticket al supporto Finflow.
        </HelpCallout>

        <h2>Dove creare il profilo</h2>
        <p>
          Dalla dashboard dello studio vai su <strong>Templates</strong> &gt;{" "}
          <strong>PDF Banks</strong> (oppure direttamente <code>/firm/templates/pdf-banks</code>).
          Vedi la lista dei profili esistenti (di default e personalizzati) e in alto a destra il
          pulsante <strong>Nuovo profilo</strong>.
        </p>
        <HelpScreenshot
          src="/help/firm/profilo-banca/01-lista-profili.png"
          alt="Lista profili banca con profili di default e pulsante Nuovo profilo"
          caption="La pagina dei template PDF Banks con la lista profili e il pulsante per aggiungerne di nuovi"
          width={1639}
          height={459}
          hotspots={[
            { x: 92, y: 12, label: 1, tooltip: "Pulsante Nuovo profilo" },
            { x: 50, y: 60, label: 2, tooltip: "Lista profili esistenti" },
          ]}
        />

        <h2>I campi del profilo</h2>
        <p>Il form chiede i parametri che il parser userà per leggere il PDF:</p>
        <ul>
          <li>
            <strong>Nome banca</strong>: il nome che apparirà nel dropdown Banca durante il
            caricamento PDF (es. &quot;Cassa di Risparmio di Fermo&quot;).
          </li>
          <li>
            <strong>Pattern riga transazione</strong>: una regex con <em>named capture groups</em> (
            <code>?&lt;name&gt;</code>) che identifica data, descrizione e importo di una riga di
            movimento. Esempio:{" "}
            <code>
              (?&lt;date&gt;\d&#123;2&#125;/\d&#123;2&#125;/\d&#123;4&#125;)\s+(?&lt;description&gt;.+?)\s&#123;2,&#125;(?&lt;amount&gt;-?[\d.]+,\d&#123;2&#125;)
            </code>
            .
          </li>
          <li>
            <strong>Pattern continuazione</strong>: regex per le righe di descrizione aggiuntiva che
            seguono la riga principale (es. <code>^\s&#123;10,&#125;(?&lt;text&gt;.+)$</code>).
          </li>
          <li>
            <strong>Skip patterns</strong>: lista di regex (una per riga) che identificano righe da
            ignorare: intestazioni, piedi pagina, righe di saldo, totali.
          </li>
          <li>
            <strong>Formato date</strong>: pattern strftime (<code>dd/MM/yyyy</code>,{" "}
            <code>dd-MM-yy</code>, ecc.).
          </li>
          <li>
            <strong>Separatore decimale</strong>: virgola (standard italiano) o punto.
          </li>
          <li>
            <strong>Note</strong>: campo libero per ricordarti perché hai creato quel profilo.
          </li>
        </ul>
        <HelpScreenshot
          src="/help/firm/profilo-banca/02-dialog-nuovo-profilo.png"
          alt="Dialog Nuovo profilo banca con campi per regex e parametri parsing"
          caption="Il form del profilo: regex per identificare righe, skip patterns, formato data"
          width={526}
          height={586}
          hotspots={[
            { x: 50, y: 12, label: 1, tooltip: "Nome banca" },
            { x: 50, y: 28, label: 2, tooltip: "Pattern riga transazione" },
            { x: 50, y: 50, label: 3, tooltip: "Pattern continuazione" },
            { x: 50, y: 68, label: 4, tooltip: "Skip patterns" },
            { x: 50, y: 85, label: 5, tooltip: "Formato data e separatore" },
          ]}
        />

        <h2>Testare il profilo su un PDF reale</h2>
        <p>
          Salvato il profilo, la pagina mostra un&apos;area di test dove puoi caricare un PDF di
          esempio della banca. Finflow esegue il parser con i pattern appena scritti e ti mostra il
          risultato: righe riconosciute, data/descrizione/importo estratti, eventuali errori.
          Iterando regex e skip patterns fino a che il risultato è corretto, costruisci un profilo
          affidabile.
        </p>
        <HelpScreenshot
          src="/help/firm/profilo-banca/03-test-pdf.png"
          alt="Area di test con upload PDF di esempio per verificare il profilo"
          caption="L'area di test: carica un PDF campione e verifica che il parser lo interpreti correttamente"
          width={532}
          height={275}
          hotspots={[{ x: 50, y: 55, label: 1, tooltip: "Upload PDF di esempio" }]}
        />

        <h2>Usare il profilo su un cliente</h2>
        <p>
          I profili creati sono disponibili per tutti i clienti dello studio. Quando un cliente ha
          un conto con questa banca, nella scheda Movimenti clicca Carica estratto conto, scegli il
          PDF e nel dropdown Banca seleziona il profilo che hai configurato. Il parser userà i tuoi
          pattern per leggere il documento.
        </p>

        <HelpCallout variant="tip" title="Come capire il layout del PDF">
          Prima di scrivere le regex, apri il PDF in un visualizzatore e prova a selezionare il
          testo con il mouse. Se riesci a selezionare righe e colonne di movimenti è segno che il
          PDF contiene testo estraibile. Copia 3-4 righe di esempio in un editor, osserva le colonne
          (quanti spazi le separano, come sono formattate date e importi), e da lì costruisci
          incrementalmente la regex. Testa su <code>regex101.com</code> o un sito simile se
          preferisci uno strumento di debug visuale.
        </HelpCallout>

        <HelpCallout variant="warning" title="Funzione non ancora UI-friendly">
          La configurazione dei profili banca è pensata per casi limite e richiede conoscenza
          tecnica. Nel roadmap di Finflow c&apos;è l&apos;idea di aggiungere un wizard assistito che
          deduca i pattern da un PDF campione tramite euristiche, riducendo la necessità di scrivere
          regex a mano. Finché questa funzione non arriva, se la tua banca non è tra le sei
          supportate chiedi sempre prima se esiste un&apos;esportazione CSV.
        </HelpCallout>

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
