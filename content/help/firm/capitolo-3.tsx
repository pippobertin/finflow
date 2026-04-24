import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpSteps, HelpStep } from "@/components/help/help-steps";

const CH = 3;
const CH_TITLE = "Bilanci e piano dei conti";

export const sections: HelpSection[] = [
  {
    slug: "caricare-bilancio",
    title: "Caricare il bilancio di verifica da ProOffice",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["bilancio", "verifica", "prooffice", "caricare", "import"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Il bilancio di verifica è il dato di partenza del controllo di gestione. Finflow lo legge
          da un file Excel esportato dal gestionale contabile (ProOffice o software compatibile) e
          lo usa per generare il conto economico riclassificato.
        </p>

        <h2>Prima di iniziare: esportare il file da ProOffice</h2>
        <p>
          In ProOffice apri la sezione di stampa del bilancio di verifica e salva il file in formato{" "}
          <strong>XLSX</strong> (o XLS). Il file deve contenere almeno queste colonne: codice conto,
          descrizione, importo Dare, importo Avere. Eventuali colonne aggiuntive (saldo iniziale,
          saldo finale) non sono un problema: Finflow le ignora.
        </p>

        <HelpCallout variant="warning" title="Evita questi errori comuni">
          Esporta sempre come <strong>valori</strong> e non come formule. File con formule che
          restituiscono <code>#RIF!</code> o <code>#VALORE!</code>, righe vuote intermedie o
          intestazioni multiple possono bloccare la lettura dei dati.
        </HelpCallout>

        <h2>Caricare il file in quattro passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la scheda Bilanci del cliente">
            <p>
              Dalla lista clienti, clicca sul nome del cliente per entrare nel suo workspace. In
              alto trovi la barra delle schede: seleziona <strong>Bilanci</strong>.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-bilancio/01-scheda-bilanci.png"
              alt="Workspace cliente con la scheda Bilanci evidenziata"
              caption="Il tab Bilanci si trova nella barra superiore del workspace cliente"
              width={1116}
              height={315}
              hotspots={[{ x: 34, y: 26, label: 1, tooltip: "Scheda Bilanci" }]}
            />
          </HelpStep>

          <HelpStep number={2} title="Clicca Carica bilancio">
            <p>
              In alto a destra nella scheda trovi il pulsante <strong>Carica bilancio</strong>,
              accanto a <strong>Mapping conti</strong> (il primo serve per caricare un nuovo file,
              il secondo per associare i conti alle categorie CDG dopo il caricamento).
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-bilancio/02-pulsante-carica.png"
              alt="Scheda Bilanci con pulsanti Mapping conti e Carica bilancio"
              caption="I pulsanti in alto a destra della scheda Bilanci"
              width={1624}
              height={348}
              hotspots={[
                { x: 83, y: 52, label: 1, tooltip: "Mapping conti" },
                { x: 93, y: 52, label: 2, tooltip: "Carica bilancio" },
              ]}
            />
          </HelpStep>

          <HelpStep number={3} title="Compila il modulo di upload">
            <p>Nel modulo ti vengono chiesti questi dati:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Inizio periodo</strong> e <strong>Fine periodo</strong>: le due date che
                delimitano il periodo coperto dal bilancio (es. 1&thinsp;gennaio 2024 –
                31&thinsp;dicembre 2024 per un bilancio annuale, o 1&thinsp;gennaio 2024 –
                31&thinsp;marzo 2024 per un Q1).
              </li>
              <li>
                <strong>Nome foglio Excel</strong>: il nome della scheda dentro il file .xlsx che
                contiene il bilancio. Il default è <code>1-BV</code>, valido per i file esportati da
                ProOffice in formato standard. Cambialo solo se il tuo file usa un nome diverso.
              </li>
              <li>
                <strong>File Excel</strong>: trascina il file nell&apos;area di upload oppure clicca
                per selezionarlo dal tuo computer.
              </li>
              <li>
                <strong>Note</strong> (opzionali): una breve descrizione che ti aiuti a identificare
                questo caricamento nell&apos;elenco (es. &quot;BV settembre 2025 definitivo&quot;).
              </li>
            </ul>
            <p className="mt-3">
              Quando hai compilato tutto, clicca <strong>Carica e analizza</strong>.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-bilancio/03-form-upload.png"
              alt="Modulo di caricamento bilancio con date, nome foglio, dropzone file e note"
              width={798}
              height={540}
              hotspots={[
                { x: 44, y: 22, label: 1, tooltip: "Inizio periodo" },
                { x: 78, y: 22, label: 2, tooltip: "Fine periodo" },
                { x: 62, y: 37, label: 3, tooltip: "Nome foglio Excel" },
                { x: 62, y: 64, label: 4, tooltip: "Dropzone file" },
                { x: 40, y: 95, label: 5, tooltip: "Carica e analizza" },
              ]}
            />
          </HelpStep>

          <HelpStep number={4} title="Verifica l'esito del caricamento">
            <p>
              Finflow legge il file e mostra subito il riepilogo: numero di righe importate, totale
              Dare, totale Avere. Se appaiono avvisi (&quot;N righe senza importo Dare né Avere,
              ignorate&quot;) è comportamento atteso: sono intestazioni di gruppo o conti padre
              privi di saldo proprio. Il parser le salta e conserva solo le righe con valori
              numerici effettivi, che sono quelle rilevanti per il CDG.
            </p>
            <HelpScreenshot
              src="/help/firm/caricare-bilancio/04-esito-upload.png"
              alt="Esito del caricamento con righe importate, totali e avvisi"
              width={492}
              height={427}
              hotspots={[
                { x: 62, y: 22, label: 1, tooltip: "Messaggio di successo con totali" },
                { x: 62, y: 55, label: 2, tooltip: "Lista avvisi (informativa)" },
              ]}
            />
            <p className="mt-3">
              Il bilancio appare nell&apos;elenco della scheda Bilanci con periodo, nome file,
              numero righe, data di upload e stato (bozza o confermato). Il periodo coperto viene
              congelato automaticamente per preservare i dati chiusi.
            </p>
          </HelpStep>
        </HelpSteps>

        <HelpCallout variant="info" title="E adesso? Il mapping">
          Il bilancio è caricato ma i singoli conti non sono ancora associati alle categorie CDG.
          Per completare il controllo di gestione vai su{" "}
          <Link href="/firm/aiuto/mapping-piano-conti" className="font-medium underline">
            Mappare il piano dei conti
          </Link>
          . Se hai già mappato lo stesso cliente in passato, i codici conto esistenti vengono
          riconosciuti automaticamente: dovrai mappare solo gli eventuali conti nuovi.
        </HelpCallout>

        <h2>Cosa succede se il file non viene letto correttamente</h2>
        <p>
          Se Finflow rileva un formato imprevisto (colonne in ordine diverso, righe di intestazione
          multiple, celle vuote dove erano attesi numeri), segnala il problema e propone due
          alternative: indicare manualmente la riga di partenza dei dati oppure correggere il file e
          ricaricarlo. La seconda è quasi sempre la scelta migliore, perché un file pulito evita
          problemi nei caricamenti successivi.
        </p>

        <h2>Aggiornare il bilancio nel corso dell&apos;anno</h2>
        <p>
          Per lo stesso anno puoi caricare più bilanci con periodi progressivi: un bilancio fino a
          marzo, poi uno fino a giugno, poi a settembre e a dicembre. Ogni caricamento aggiorna il
          conto economico del periodo corrispondente e congela i mesi già inclusi.
        </p>

        <HelpCallout variant="tip" title="Ritmo consigliato">
          Carica un bilancio aggiornato ogni mese o ogni trimestre, non appena la contabilità chiude
          il periodo. Questo mantiene il CDG allineato alla realtà contabile e riduce al minimo le
          fatture retroattive che non incidono sul CE riclassificato.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/mapping-piano-conti">
              Mappare il piano dei conti verso le categorie CDG
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/congelamento-periodi">Congelamento periodi chiusi</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "mapping-piano-conti",
    title: "Mappare il piano dei conti verso le categorie CDG",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["mapping", "piano", "conti", "categorie", "CDG", "riclassificazione"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La mappatura associa ogni conto del bilancio a una delle 17 categorie del controllo di
          gestione. È il passaggio che trasforma i numeri contabili nel conto economico
          riclassificato con i margini progressivi (MdC, EBITDA, EBIT, utile netto).
        </p>

        <HelpCallout variant="info" title="Prima di iniziare">
          Devi aver già caricato almeno un bilancio di verifica per il cliente. Se la pagina mapping
          è vuota con il messaggio &quot;Nessun conto trovato&quot;, torna prima su{" "}
          <Link href="/firm/aiuto/caricare-bilancio" className="font-medium underline">
            Caricare il bilancio di verifica
          </Link>
          .
        </HelpCallout>

        <h2>Come mappare i conti</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la pagina Mapping conti">
            <p>
              Dalla scheda <strong>Bilanci</strong> del cliente, clicca{" "}
              <strong>Mapping conti</strong> in alto a destra. Si apre la tabella con tutti i conti
              trovati nel bilancio di verifica.
            </p>
            <p className="mt-2">
              In alto vedi il conteggio dei conti ancora da mappare (in ambra) e il pulsante{" "}
              <strong>Salva</strong> a destra. Le righe con sfondo ambra chiaro sono quelle non
              ancora associate a una categoria.
            </p>
            <HelpScreenshot
              src="/help/firm/mapping-piano-conti/01-vista-mapping.png"
              alt="Pagina Mapping conti con tabella e contatore da mappare"
              caption="Vista generale della pagina di mapping: conteggio in ambra, pulsante Salva, tabella conti"
              width={1636}
              height={361}
              hotspots={[
                { x: 30, y: 25, label: 1, tooltip: "Conteggio conti da mappare" },
                { x: 95, y: 25, label: 2, tooltip: "Pulsante Salva" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Seleziona la categoria CDG per ogni conto">
            <p>
              Clicca sul menu a tendina nella colonna <strong>Categoria CdG</strong> della riga e
              scegli la voce appropriata. Le 17 categorie disponibili coprono tutte le macro-aree
              del conto economico (le vedi elencate più in basso). Quando selezioni una categoria,
              la riga cambia sfondo (diventa blu chiaro) per segnalare che c&apos;è una modifica non
              ancora salvata.
            </p>
            <HelpScreenshot
              src="/help/firm/mapping-piano-conti/02-dropdown-categorie.png"
              alt="Dropdown aperto con l'elenco delle 17 categorie CDG"
              caption="Il menu a tendina mostra tutte le categorie disponibili"
              width={1498}
              height={454}
              hotspots={[{ x: 58, y: 50, label: 1, tooltip: "Menu categorie CDG" }]}
            />
          </HelpStep>

          <HelpStep number={3} title="Salva le modifiche">
            <p>
              Il pulsante <strong>Salva</strong> mostra fra parentesi il numero di righe modificate.
              Cliccalo per confermare: le modifiche vengono scritte nel database e lo stato della
              pagina si aggiorna. Quando l&apos;operazione va a buon fine vedi il messaggio{" "}
              <strong>Salvato</strong> con spunta verde. Puoi mappare e salvare a blocchi (non serve
              fare tutto in una sola sessione).
            </p>
            <HelpScreenshot
              src="/help/firm/mapping-piano-conti/03-salvataggio.png"
              alt="Area pulsante Salva con contatore modifiche pendenti"
              width={706}
              height={327}
              hotspots={[{ x: 75, y: 50, label: 1, tooltip: "Pulsante Salva con contatore" }]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Le 17 categorie disponibili</h2>
        <p>
          La struttura è pensata per coprire l&apos;intero conto economico con una granularità utile
          al controllo di gestione ma senza frammentare troppo l&apos;analisi.
        </p>
        <ul>
          <li>
            <strong>Ricavi</strong>: vendite e prestazioni
          </li>
          <li>
            <strong>Costi variabili</strong> (3 voci): materiali, servizi, lavoro diretto
          </li>
          <li>
            <strong>Costi fissi</strong> (8 voci): ammortamenti, compensi amministratori, affitti,
            utenze, assicurazioni, consulenze, marketing, generali
          </li>
          <li>
            <strong>Gestione finanziaria</strong> (2 voci): proventi e oneri finanziari
          </li>
          <li>
            <strong>Gestione straordinaria</strong> (2 voci): proventi e oneri straordinari
          </li>
          <li>
            <strong>Imposte</strong>: IRES, IRAP e altre imposte sul reddito
          </li>
        </ul>

        <h2>I margini che ottieni</h2>
        <p>Completata la mappatura, Finflow calcola automaticamente i margini progressivi:</p>
        <ul>
          <li>
            <strong>Margine di contribuzione (MdC)</strong> = Ricavi − Costi variabili
          </li>
          <li>
            <strong>EBITDA</strong> = MdC − Costi fissi (esclusi ammortamenti)
          </li>
          <li>
            <strong>EBIT</strong> = EBITDA − Ammortamenti
          </li>
          <li>
            <strong>Utile netto</strong> = EBIT − Gestione finanziaria ± Straordinari − Imposte
          </li>
        </ul>

        <h2>Il mapping si fa una volta sola</h2>
        <p>
          Quando carichi un secondo bilancio per lo stesso cliente, i conti già mappati vengono
          riconosciuti tramite il codice conto e mantengono la loro categoria. Devi intervenire solo
          sui conti nuovi, quelli che non esistevano nel bilancio precedente. Il contatore{" "}
          <em>N conti da mappare</em> scende progressivamente man mano che lo storico del cliente si
          consolida.
        </p>

        <HelpCallout variant="tip" title="Template studio">
          Se gestisci più clienti con piani dei conti simili (stesso settore o stesso gruppo), mappa
          accuratamente il primo e salva la mappatura come template. Per i clienti successivi,
          l&apos;applicazione del template mappa in automatico tutti i codici conto condivisi: ti
          resta da sistemare solo le differenze.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/budget-varianze">
              Consuntivo vs budget: leggere le varianze
            </Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "congelamento-periodi",
    title: "Congelamento periodi chiusi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["congelamento", "periodi", "chiusi", "blocco", "lock"],
    content: () => (
      <>
        <p>
          Quando carichi un bilancio di verifica per un determinato periodo, quel periodo viene
          automaticamente &quot;congelato&quot;. Il congelamento garantisce che i dati del conto
          economico riclassificato per quel periodo provengano esclusivamente dal bilancio di
          verifica e non vengano alterati da altre fonti.
        </p>

        <h2>Perché congelare i periodi</h2>
        <p>
          In un sistema di controllo di gestione coesistono due fonti di dati: il bilancio di
          verifica (fonte contabile ufficiale) e i dati operativi (fatture, movimenti bancari,
          stime). Per i periodi in cui il bilancio di verifica è disponibile, i dati contabili sono
          la fonte più affidabile. Il congelamento impedisce che fatture caricate successivamente o
          movimenti bancari importati vadano a sovrascrivere i valori del bilancio per quei periodi
          già chiusi.
        </p>

        <h2>Come funziona in pratica</h2>
        <p>
          Supponiamo di caricare il bilancio di verifica aggiornato al 31 marzo 2024. Il sistema
          congela i mesi di gennaio, febbraio e marzo 2024. Per questi tre mesi, il conto economico
          riclassificato mostrerà i valori che derivano dal bilancio di verifica. Se una fattura
          datata febbraio 2024 viene importata successivamente, non andrà a modificare il CE
          riclassificato di febbraio.
        </p>
        <p>
          Per i mesi successivi (aprile in poi), in assenza di un bilancio di verifica aggiornato,
          il sistema può utilizzare i dati operativi (movimenti bancari, fatture) per costruire una
          stima del conto economico.
        </p>

        <h2>Visualizzare lo stato dei periodi</h2>
        <p>
          Nella scheda CDG del cliente, ogni periodo mostra un indicatore visivo del suo stato: un
          lucchetto chiuso per i periodi congelati (basati su bilancio di verifica) e un lucchetto
          aperto per i periodi non ancora coperti da un bilancio. Questo ti permette di capire a
          colpo d&apos;occhio quali mesi hanno dati definitivi e quali hanno dati stimati.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il congelamento è automatico e non reversibile manualmente. Se devi correggere i dati di
            un periodo congelato, carica un nuovo bilancio di verifica aggiornato per lo stesso
            periodo. Il nuovo bilancio sostituirà quello precedente.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/fatture-retroattive">
              Fatture retroattive su periodo congelato
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/preconsuntivo">Preconsuntivo: proiezione chiusura anno</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "fatture-retroattive",
    title: "Fatture retroattive su periodo congelato",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["fatture", "retroattive", "congelato", "periodo", "chiuso"],
    content: () => (
      <>
        <p>
          Può capitare che una fattura venga registrata nel sistema con una data che ricade in un
          periodo già congelato. Finflow gestisce questo caso con una regola precisa, definita dal
          documento architetturale ADR-006, che preserva l&apos;integrità dei dati chiusi.
        </p>

        <h2>La regola ADR-006</h2>
        <p>
          Le fatture datate in un periodo congelato vengono accettate dal sistema ma non alterano il
          conto economico riclassificato di quel periodo. Il CE riclassificato dei periodi congelati
          resta ancorato ai valori del bilancio di verifica. La fattura retroattiva viene
          registrata, archiviata e resa visibile nell&apos;elenco delle fatture, ma il suo importo
          non viene sommato ai totali del periodo congelato.
        </p>

        <h2>Come vengono segnalate</h2>
        <p>
          Le fatture retroattive che ricadono in un periodo congelato vengono contrassegnate con un
          flag visivo nell&apos;interfaccia. Questo ti permette di identificarle rapidamente e di
          valutare come gestirle. Il flag indica che la fattura è stata registrata ma non ha
          influenzato il CE del periodo di competenza.
        </p>

        <h2>Cosa può fare il controller</h2>
        <p>Quando trovi fatture retroattive su periodi congelati, hai diverse opzioni:</p>
        <ul>
          <li>
            <strong>Lasciare invariato</strong> — se il bilancio di verifica già include quella
            fattura (perché era registrata in contabilità al momento dell&apos;export), non serve
            alcuna azione
          </li>
          <li>
            <strong>Ricaricare il bilancio</strong> — se la fattura era assente dal bilancio e vuoi
            includerla, esporta un nuovo bilancio di verifica aggiornato dal gestionale e caricalo
            in Finflow. Il nuovo bilancio sostituirà quello precedente per lo stesso periodo
          </li>
          <li>
            <strong>Annotare per il prossimo periodo</strong> — in alcuni casi il controller sceglie
            di considerare l&apos;importo nel periodo successivo (non congelato), ad esempio per le
            fatture ricevute in ritardo
          </li>
        </ul>

        <h2>Perché questa scelta</h2>
        <p>
          La decisione di non alterare i periodi congelati risponde a un principio di affidabilità:
          il bilancio di verifica è la fonte ufficiale dei dati contabili. Se il sistema permettesse
          a singole fatture di modificare i totali dopo la chiusura, il conto economico
          riclassificato non sarebbe più allineato con la contabilità ufficiale. Il congelamento
          garantisce che i numeri del CDG corrispondano sempre a quelli del bilancio di verifica.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Per ridurre al minimo le fatture retroattive, carica i bilanci di verifica solo dopo
            aver verificato che tutte le registrazioni contabili del periodo siano state completate
            nel gestionale.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/congelamento-periodi">Congelamento periodi chiusi</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
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
];
