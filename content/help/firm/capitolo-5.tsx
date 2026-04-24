import Link from "next/link";
import type { HelpSection } from "../types";

const CH = 5;
const CH_TITLE = "IVA, F24, prestiti";

export const sections: HelpSection[] = [
  {
    slug: "ricalcolo-iva",
    title: "Ricalcolo IVA del periodo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["ricalcolo", "IVA", "periodo", "liquidazione", "trimestrale"],
    content: () => (
      <>
        <p>
          FinFlow calcola l&apos;IVA a partire dai dati del bilancio di verifica caricato per il
          cliente. Ogni volta che carichi un nuovo bilancio o aggiorni i dati, puoi ricalcolare la
          posizione IVA per verificare debiti e crediti del periodo selezionato.
        </p>

        <h2>Come accedere alla pagina IVA</h2>
        <p>
          Dalla scheda del cliente, seleziona il tab <strong>IVA</strong>. La pagina mostra tre
          valori principali: l&apos;IVA a debito (sulle vendite), l&apos;IVA a credito (sugli
          acquisti) e la posizione netta. Se il saldo netto è positivo, il cliente ha IVA da
          versare; se è negativo, ha un credito IVA da riportare.
        </p>

        <h2>Ricalcolare dopo un aggiornamento</h2>
        <p>
          Quando carichi un bilancio di verifica aggiornato, i valori IVA non si aggiornano in
          automatico. Premi il pulsante <strong>Ricalcola</strong> per elaborare di nuovo i dati. Il
          sistema rielabora tutte le voci con aliquota IVA e aggiorna i totali. Il ricalcolo
          richiede pochi secondi.
        </p>

        <h2>Selezionare l&apos;anno</h2>
        <p>
          In alto nella pagina trovi un selettore per l&apos;anno. Puoi scegliere qualsiasi anno per
          cui esistono dati caricati. I valori mostrati si riferiscono sempre all&apos;anno
          selezionato. Per confrontare due anni, apri la pagina in due schede del browser con anni
          diversi.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Dopo ogni caricamento di bilancio, premi sempre &quot;Ricalcola&quot; per avere i dati
            IVA allineati. Se i numeri non corrispondono al gestionale, verifica che tutte le voci
            del piano dei conti siano mappate correttamente.
          </p>
        </div>

        <h2>Come vengono calcolati i valori</h2>
        <p>
          Il motore IVA legge le voci del bilancio di verifica che hanno natura IVA (conti con
          codice IVA associato) e le aggrega per tipo: IVA a debito e IVA a credito. La posizione
          netta è la differenza tra le due. I valori sono espressi in euro e arrotondati al
          centesimo.
        </p>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/calendario-iva">Leggere il calendario IVA</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/scadenze-f24">Inserire scadenze F24</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "calendario-iva",
    title: "Leggere il calendario IVA",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["calendario", "IVA", "scadenze", "date", "versamenti"],
    content: () => (
      <>
        <p>
          Il calendario IVA di FinFlow mostra le scadenze di versamento IVA distribuite nel tempo.
          Ogni riga riporta il mese (o trimestre, a seconda del regime del cliente), l&apos;importo
          da versare e lo stato del pagamento.
        </p>

        <h2>Struttura del calendario</h2>
        <p>Il calendario è organizzato in righe cronologiche. Per ogni scadenza trovi:</p>
        <ul>
          <li>
            <strong>Periodo</strong> &mdash; il mese o il trimestre di riferimento
          </li>
          <li>
            <strong>Data scadenza</strong> &mdash; il giorno entro cui effettuare il versamento
          </li>
          <li>
            <strong>Importo</strong> &mdash; la somma da versare all&apos;Erario
          </li>
          <li>
            <strong>Stato</strong> &mdash; da versare, versato, o scaduto
          </li>
        </ul>

        <h2>Liquidazione mensile e trimestrale</h2>
        <p>
          Il calendario si adatta al regime IVA del cliente. I contribuenti mensili vedono 12
          scadenze all&apos;anno (entro il 16 del mese successivo). I contribuenti trimestrali
          vedono 4 scadenze (entro il 16 del secondo mese successivo alla chiusura del trimestre).
          Il regime viene impostato nell&apos;anagrafica del cliente.
        </p>

        <h2>A cosa serve il calendario</h2>
        <p>
          Il calendario ti permette di comunicare al cliente gli importi e le date di pagamento in
          anticipo. Puoi usarlo durante le riunioni periodiche per pianificare la liquidità. Le
          scadenze scadute vengono evidenziate in rosso, quelle imminenti in giallo.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Gli importi del calendario dipendono dal ricalcolo IVA. Se non hai premuto
            &quot;Ricalcola&quot; dopo l&apos;ultimo caricamento del bilancio, le cifre potrebbero
            non essere aggiornate.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/ricalcolo-iva">Ricalcolo IVA del periodo</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/scadenziario">Lo scadenziario unificato</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "scadenze-f24",
    title: "Inserire scadenze F24",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["scadenze", "F24", "tributi", "imposte", "pagamenti"],
    content: () => (
      <>
        <p>
          L&apos;F24 è il modello unificato per il pagamento di imposte, contributi e tributi in
          Italia. FinFlow ti permette di registrare le scadenze F24 per ogni cliente, in modo da
          tenerle sotto controllo insieme a tutte le altre scadenze finanziarie.
        </p>

        <h2>Aggiungere una nuova scadenza F24</h2>
        <p>
          Dalla scheda del cliente, apri il tab <strong>F24</strong>. Premi il pulsante
          <strong> Nuovo F24</strong> in alto a destra. Si apre un modulo con i seguenti campi:
        </p>
        <ul>
          <li>
            <strong>Data scadenza</strong> &mdash; la data entro cui effettuare il pagamento
          </li>
          <li>
            <strong>Importo</strong> &mdash; l&apos;ammontare in euro da versare
          </li>
          <li>
            <strong>Descrizione</strong> &mdash; una nota libera (ad es. &quot;Acconto IRES II
            rata&quot;)
          </li>
          <li>
            <strong>Codice tributo</strong> &mdash; il codice identificativo del tributo (ad es.
            2001, 3800)
          </li>
        </ul>
        <p>
          Premi <strong>Salva</strong> per confermare. La scadenza viene aggiunta alla lista e
          appare anche nello scadenziario unificato.
        </p>

        <h2>Modificare o eliminare una scadenza</h2>
        <p>
          Nella lista delle scadenze F24, clicca sulla riga che vuoi modificare. Puoi aggiornare
          tutti i campi o eliminare la scadenza con il pulsante di cancellazione. Le scadenze già
          pagate possono essere marcate come &quot;pagato&quot; per tenerle in archivio senza che
          vengano segnalate come in scadenza.
        </p>

        <h2>Scadenze ricorrenti</h2>
        <p>
          Molti tributi hanno scadenze fisse durante l&apos;anno (16 marzo, 16 giugno, 30 novembre,
          ecc.). Ti consigliamo di inserire tutte le scadenze note a inizio anno, in modo da avere
          una visione completa del carico fiscale del cliente.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Usa la descrizione per distinguere acconti e saldi dello stesso tributo. Ad esempio:
            &quot;IRES Acconto I rata&quot; e &quot;IRES Saldo&quot;. In questo modo trovi subito la
            voce giusta nello scadenziario.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/scadenziario">Lo scadenziario unificato</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/prestiti">Inserire prestiti e finanziamenti</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "prestiti",
    title: "Inserire prestiti e finanziamenti",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["prestiti", "finanziamenti", "mutui", "leasing", "rate"],
    content: () => (
      <>
        <p>
          La sezione Prestiti ti consente di registrare mutui, finanziamenti e linee di credito
          attive per il cliente. Il sistema tiene traccia delle rate, del debito residuo e delle
          prossime scadenze di pagamento.
        </p>

        <h2>Aggiungere un nuovo prestito</h2>
        <p>
          Dalla scheda del cliente, apri il tab <strong>Prestiti</strong>. Premi
          <strong> Nuovo prestito</strong> e compila i campi richiesti:
        </p>
        <ul>
          <li>
            <strong>Banca / ente erogante</strong> &mdash; il nome dell&apos;istituto che ha
            concesso il finanziamento
          </li>
          <li>
            <strong>Importo totale</strong> &mdash; il capitale iniziale del prestito
          </li>
          <li>
            <strong>Data inizio</strong> &mdash; la data di erogazione o di inizio del piano di
            ammortamento
          </li>
          <li>
            <strong>Data fine</strong> &mdash; la data di scadenza finale del prestito
          </li>
          <li>
            <strong>Tasso di interesse</strong> &mdash; il tasso annuo (in percentuale)
          </li>
          <li>
            <strong>Rata mensile</strong> &mdash; l&apos;importo della rata periodica
          </li>
        </ul>
        <p>
          Dopo il salvataggio, il prestito compare nella lista con un riepilogo del debito residuo
          calcolato in base alle rate già scadute.
        </p>

        <h2>Monitorare il debito residuo</h2>
        <p>
          Per ogni prestito, FinFlow mostra il saldo residuo stimato e le prossime rate in scadenza.
          Queste informazioni confluiscono nello scadenziario unificato, dove appaiono insieme alle
          scadenze IVA e F24. In questo modo hai una vista unica su tutti gli impegni finanziari del
          cliente.
        </p>

        <h2>Modificare un prestito esistente</h2>
        <p>
          Clicca sul prestito nella lista per aprire il dettaglio. Puoi modificare tutti i campi
          tranne l&apos;importo iniziale (che resta come dato storico). Se il prestito è stato
          estinto in anticipo, aggiorna la data di fine e il sistema ricalcola il piano.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il calcolo del debito residuo è una stima basata sulle rate costanti. Se il prestito ha
            un piano di ammortamento variabile (es. tasso variabile), i valori reali potrebbero
            differire leggermente.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/scadenziario">Lo scadenziario unificato</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/scadenze-f24">Inserire scadenze F24</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "scadenziario",
    title: "Lo scadenziario unificato",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["scadenziario", "unificato", "scadenze", "calendario", "promemoria"],
    content: () => (
      <>
        <p>
          Lo scadenziario unificato raccoglie in un&apos;unica vista cronologica tutte le scadenze
          finanziarie del cliente: fatture attive e passive, versamenti IVA, F24 e rate dei
          prestiti. Non serve più consultare pagine diverse per sapere cosa c&apos;è in arrivo.
        </p>

        <h2>Quali scadenze include</h2>
        <p>Lo scadenziario aggrega automaticamente le scadenze provenienti da quattro fonti:</p>
        <ul>
          <li>
            <strong>Fatture attive</strong> &mdash; la data di scadenza del pagamento atteso dai
            clienti del tuo assistito
          </li>
          <li>
            <strong>Fatture passive</strong> &mdash; la data di pagamento verso i fornitori
          </li>
          <li>
            <strong>Scadenze F24</strong> &mdash; imposte e tributi inseriti manualmente
          </li>
          <li>
            <strong>Rate prestiti</strong> &mdash; le rate mensili dei finanziamenti registrati
          </li>
          <li>
            <strong>Scadenze IVA</strong> &mdash; le liquidazioni IVA periodiche
          </li>
        </ul>

        <h2>Leggere la vista cronologica</h2>
        <p>
          Le scadenze appaiono ordinate per data, dalla più vicina alla più lontana. Ogni riga
          mostra: la data, il tipo di scadenza (con un&apos;etichetta colorata), la descrizione e
          l&apos;importo. Le scadenze scadute appaiono evidenziate in rosso. Quelle dei prossimi 7
          giorni hanno un indicatore giallo.
        </p>

        <h2>Filtrare per tipo</h2>
        <p>
          In alto nello scadenziario trovi i filtri per tipo. Puoi selezionare solo le fatture
          attive, solo i prestiti, o qualsiasi combinazione. Il filtro &quot;Tutti&quot; mostra
          l&apos;elenco completo. I filtri si applicano in tempo reale, senza ricaricare la pagina.
        </p>

        <h2>Usare lo scadenziario nelle riunioni con il cliente</h2>
        <p>
          Lo scadenziario è uno strumento utile durante gli incontri periodici con
          l&apos;imprenditore. Mostra in modo chiaro e ordinato tutte le uscite previste nelle
          prossime settimane. Puoi condividerlo dal report PDF oppure mostrarlo a schermo durante la
          videochiamata.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Controlla lo scadenziario almeno una volta alla settimana per ogni cliente attivo. Le
            scadenze in rosso indicano pagamenti in ritardo che richiedono attenzione immediata.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/scadenze-f24">Inserire scadenze F24</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/prestiti">Inserire prestiti e finanziamenti</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/calendario-iva">Leggere il calendario IVA</Link>
          </li>
        </ul>
      </>
    ),
  },
];
