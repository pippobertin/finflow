import Link from "next/link";
import type { HelpSection } from "../types";

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
        <p>
          Il bilancio di verifica è il dato di partenza per il controllo di gestione. Finflow lo
          importa direttamente dal file Excel esportato dal gestionale contabile (ProOffice o altro
          software compatibile) e lo usa per generare il conto economico riclassificato.
        </p>

        <h2>Esportare il bilancio da ProOffice</h2>
        <p>
          In ProOffice, vai alla sezione di stampa del bilancio di verifica e scegli il formato XLS
          o XLSX. Assicurati che il file contenga almeno queste colonne: codice conto, descrizione
          del conto, importo Dare e importo Avere. Il file può contenere colonne aggiuntive (saldo
          iniziale, saldo finale, ecc.): Finflow le ignora e utilizza solo le colonne che riconosce.
        </p>

        <h2>Caricare il file in Finflow</h2>
        <p>
          Apri la pagina di dettaglio del cliente e vai alla scheda &quot;Bilanci&quot;. Clicca
          &quot;Carica bilancio&quot; e seleziona il file Excel dal tuo computer. Durante il
          caricamento, il sistema ti chiede di specificare:
        </p>
        <ul>
          <li>
            <strong>Anno di riferimento</strong> — l&apos;esercizio contabile a cui si riferisce il
            bilancio
          </li>
          <li>
            <strong>Periodo</strong> — il mese o il trimestre fino a cui i dati sono aggiornati (ad
            esempio: &quot;fino a marzo 2024&quot; oppure &quot;Q1 2024&quot;)
          </li>
        </ul>

        <h2>Anteprima e conferma</h2>
        <p>
          Dopo il caricamento, Finflow mostra un&apos;anteprima dei dati letti dal file:
          l&apos;elenco dei conti con codice, descrizione e importi. Verifica che i dati siano
          corretti. Se il file ha un formato imprevisto (ad esempio colonne in ordine diverso o
          righe di intestazione multiple), il sistema segnala il problema e ti chiede di correggere
          il file o di indicare manualmente la riga di partenza dei dati.
        </p>
        <p>
          Conferma il caricamento per salvare il bilancio. Il sistema lo registra nell&apos;elenco
          dei bilanci del cliente con la data di caricamento e il periodo di riferimento.
        </p>

        <h2>Aggiornare il bilancio</h2>
        <p>
          Puoi caricare più bilanci per lo stesso anno ma con periodi diversi. Ad esempio: un
          bilancio aggiornato a marzo, poi uno aggiornato a giugno, poi a settembre. Ogni
          caricamento aggiorna il conto economico riclassificato per il periodo corrispondente. I
          periodi già caricati vengono congelati automaticamente.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Controlla sempre che il file Excel non contenga righe vuote o formule che restituiscono
            errore (#RIF!, #VALORE!). Questi elementi possono impedire la lettura corretta dei dati.
            Esporta preferibilmente il bilancio come &quot;valori&quot; anziché come
            &quot;formule&quot;.
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
            <Link href="/firm/aiuto/wizard-mapping">Il wizard di mapping automatico</Link>
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
        <p>
          La mappatura del piano dei conti è il processo con cui associ ogni conto del bilancio di
          verifica a una delle categorie del controllo di gestione. Questa associazione permette a
          Finflow di generare il conto economico riclassificato con margini progressivi.
        </p>

        <h2>Le 17 categorie CDG</h2>
        <p>
          Finflow utilizza una struttura a 17 categorie che coprono l&apos;intero conto economico.
          Ecco le macro-aree:
        </p>
        <ul>
          <li>
            <strong>Ricavi</strong> — ricavi delle vendite e delle prestazioni
          </li>
          <li>
            <strong>Costi Variabili</strong> (3 categorie) — materie prime, servizi variabili, altri
            costi variabili
          </li>
          <li>
            <strong>Costi Fissi</strong> (8 categorie) — personale, affitti, utenze, ammortamenti,
            consulenze, assicurazioni, manutenzioni, altri costi fissi
          </li>
          <li>
            <strong>Gestione finanziaria</strong> — interessi attivi e passivi, oneri bancari
          </li>
          <li>
            <strong>Gestione straordinaria</strong> — componenti non ricorrenti (plusvalenze,
            minusvalenze, sopravvenienze)
          </li>
          <li>
            <strong>Imposte</strong> — IRES, IRAP e altre imposte sul reddito
          </li>
        </ul>

        <h2>Come funziona la mappatura</h2>
        <p>
          Dopo il caricamento del primo bilancio di verifica, Finflow presenta l&apos;elenco di
          tutti i conti trovati nel file. Per ogni conto devi indicare a quale categoria CDG
          appartiene. Il sistema offre un menu a tendina con le 17 categorie disponibili. Seleziona
          la categoria corretta e passa al conto successivo.
        </p>
        <p>
          La mappatura si fa una sola volta per ogni conto. Quando carichi un secondo bilancio per
          lo stesso cliente, i conti già mappati vengono riconosciuti automaticamente tramite il
          codice conto. Solo i conti nuovi (mai visti prima) richiedono una nuova mappatura.
        </p>

        <h2>Cosa succede dopo la mappatura</h2>
        <p>
          Completata la mappatura di tutti i conti, Finflow genera il conto economico
          riclassificato. I valori vengono aggregati per categoria e presentati con i margini
          progressivi:
        </p>
        <ul>
          <li>
            <strong>Margine di Contribuzione (MdC)</strong> = Ricavi - Costi Variabili
          </li>
          <li>
            <strong>EBITDA</strong> = MdC - Costi Fissi (esclusi ammortamenti)
          </li>
          <li>
            <strong>EBIT</strong> = EBITDA - Ammortamenti
          </li>
          <li>
            <strong>Utile Netto</strong> = EBIT - Gestione finanziaria +/- Straordinari - Imposte
          </li>
        </ul>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se gestisci clienti con piani dei conti simili (ad esempio aziende dello stesso settore
            o dello stesso gruppo), usa i template di mappatura. Mappa il primo cliente e salva la
            mappatura come template. Per i clienti successivi, applica il template e correggi solo
            le differenze.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/wizard-mapping">Il wizard di mapping automatico</Link>
          </li>
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
    slug: "wizard-mapping",
    title: "Il wizard di mapping automatico",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["wizard", "mapping", "automatico", "AI", "suggerimenti"],
    content: () => (
      <>
        <p>
          Il wizard di mapping automatico velocizza la fase di associazione dei conti alle categorie
          CDG. Analizza il nome di ogni conto e propone una categoria basandosi su regole e pattern
          ricorrenti nei piani dei conti italiani.
        </p>

        <h2>Come funziona il wizard</h2>
        <p>
          Quando avvii la mappatura di un bilancio di verifica, il wizard si attiva automaticamente.
          Per ogni conto non ancora mappato, il sistema analizza la descrizione testuale e propone
          la categoria CDG più probabile. Ad esempio:
        </p>
        <ul>
          <li>
            &quot;Ricavi da vendita merci&quot; viene proposto come <strong>Ricavi</strong>
          </li>
          <li>
            &quot;Acquisto materie prime&quot; viene proposto come{" "}
            <strong>Costi Variabili — Materie prime</strong>
          </li>
          <li>
            &quot;Stipendi e salari&quot; viene proposto come{" "}
            <strong>Costi Fissi — Personale</strong>
          </li>
          <li>
            &quot;Ammortamento impianti&quot; viene proposto come{" "}
            <strong>Costi Fissi — Ammortamenti</strong>
          </li>
          <li>
            &quot;Interessi passivi su mutui&quot; viene proposto come{" "}
            <strong>Gestione finanziaria</strong>
          </li>
        </ul>
        <p>
          Per ogni proposta, il wizard mostra un indicatore di confidenza. I conti con nomi chiari e
          standard ottengono una confidenza alta. I conti con nomi ambigui o generici (ad esempio
          &quot;Conto transitorio&quot;) ottengono una confidenza bassa e richiedono la tua verifica
          manuale.
        </p>

        <h2>Confermare o correggere le proposte</h2>
        <p>
          Scorri l&apos;elenco dei conti e verifica le proposte del wizard. Puoi accettare la
          proposta con un clic oppure selezionare una categoria diversa dal menu a tendina. Una
          volta confermati tutti i conti, clicca &quot;Salva mappatura&quot; per completare il
          processo.
        </p>

        <h2>Template studio</h2>
        <p>
          Dopo aver completato la mappatura per un cliente, puoi salvarla come &quot;Template
          studio&quot;. Il template registra le associazioni codice conto - categoria CDG. Quando
          crei un nuovo cliente con un piano dei conti simile, puoi applicare il template: tutti i
          conti con lo stesso codice vengono mappati automaticamente. Dovrai mappare manualmente
          solo i conti che non esistono nel template.
        </p>
        <p>
          I template sono gestiti nella sezione &quot;Template&quot; della barra laterale. Puoi
          crearli, modificarli, duplicarli o eliminarli in qualsiasi momento.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Anche se il wizard propone le categorie corrette, prenditi il tempo di scorrere tutti i
            conti almeno la prima volta. Alcuni conti possono avere nomi fuorvianti (ad esempio
            &quot;Consulenze&quot; che in realtà sono costi variabili legati alla produzione, non
            costi fissi). La qualità della mappatura determina la qualità di tutta l&apos;analisi a
            valle.
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
          <li>
            <Link href="/firm/aiuto/gruppo-clienti">Gestire più clienti dello stesso gruppo</Link>
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
    section: 4,
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
    section: 5,
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
