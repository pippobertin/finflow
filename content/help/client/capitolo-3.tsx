import Link from "next/link";
import type { HelpSection } from "../types";

const CH = 3;
const CH_TITLE = "Le tue scadenze e la tua cassa";

export const sections: HelpSection[] = [
  {
    slug: "cassa-attuale",
    title: "Quanto hai in cassa",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["cassa", "liquidità", "saldo", "disponibilità", "denaro"],
    content: () => (
      <>
        <p>
          La pagina Cassa ti mostra una stima di quanti soldi ha la tua azienda in questo momento. È
          il numero che risponde alla domanda più diretta: &quot;quanti soldi ho?&quot;
        </p>

        <h2>Da dove viene il numero</h2>
        <p>
          Il saldo di cassa viene calcolato a partire dai movimenti bancari importati dal tuo
          commercialista. Il sistema somma tutti gli incassi (soldi in entrata) e sottrae tutti i
          pagamenti (soldi in uscita): fornitori, stipendi, rate di prestiti, tasse e ogni altra
          uscita registrata.
        </p>
        <p>
          Tieni presente che il dato è aggiornato all&apos;ultimo caricamento fatto dal
          commercialista. Se l&apos;ultimo import dei movimenti risale a una settimana fa, il saldo
          potrebbe non riflettere le operazioni più recenti.
        </p>

        <h2>Cassa e ricavi sono cose diverse</h2>
        <p>
          Un errore comune è confondere la cassa con i ricavi. I ricavi sono il valore delle vendite
          fatturate; la cassa è il denaro effettivamente disponibile sul conto. Puoi avere ricavi
          alti ma poca cassa, ad esempio se i clienti pagano con ritardo. Oppure puoi avere molta
          cassa ma ricavi in calo, se stai incassando fatture dei mesi precedenti.
        </p>

        <h2>Perché tenerla sotto controllo</h2>
        <p>
          La cassa è la linfa vitale della tua azienda. Anche un&apos;azienda che guadagna può
          trovarsi in difficoltà se resta senza liquidità. Le bollette, gli stipendi e i fornitori
          non aspettano: vanno pagati a scadenza, indipendentemente da quando i tuoi clienti ti
          pagheranno.
        </p>
        <p>
          Se la cassa scende sotto un certo livello, è il momento di parlarne con il commercialista
          per capire come gestire la situazione, ad esempio sollecitando i pagamenti dei clienti o
          rinegoziando le condizioni con i fornitori.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il saldo di cassa mostrato in Finflow è una stima basata sui dati importati. Per il
            saldo esatto in tempo reale, consulta il tuo home banking. I due numeri dovrebbero
            essere vicini, ma piccole differenze sono normali.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/scadenze-prossime">Le scadenze dei prossimi giorni</Link>
          </li>
          <li>
            <Link href="/aiuto/movimenti-bancari">I tuoi movimenti bancari</Link>
          </li>
          <li>
            <Link href="/aiuto/fatture-attive-passive">Fatture attive e passive</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "scadenze-prossime",
    title: "Le scadenze dei prossimi giorni",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["scadenze", "pagamenti", "fatture", "prossimi", "calendario"],
    content: () => (
      <>
        <p>
          La pagina Scadenze ti mostra un elenco di tutto quello che devi pagare e tutto quello che
          devi incassare nei prossimi giorni e settimane. Fatture dei fornitori, rate di prestiti,
          versamenti F24 e fatture dei clienti in attesa di incasso: tutto in un unico posto.
        </p>

        <h2>I colori delle scadenze</h2>
        <p>Ogni scadenza ha un colore che ti dice a che punto sei:</p>
        <ul>
          <li>
            <strong>Rosso</strong> — scadenza già passata, cioè un pagamento scaduto e non ancora
            saldato. Va gestito il prima possibile.
          </li>
          <li>
            <strong>Giallo / arancione</strong> — scadenza imminente, a pochi giorni dalla data. È
            il momento di prepararsi al pagamento o sollecitare l&apos;incasso.
          </li>
          <li>
            <strong>Grigio</strong> — scadenza futura, c&apos;è ancora tempo. La vedi per
            pianificare, non per agire subito.
          </li>
        </ul>

        <h2>Tipi di scadenze</h2>
        <p>Nella lista trovi diversi tipi di scadenze:</p>
        <ul>
          <li>
            <strong>Fatture passive</strong> — fatture dei fornitori da pagare
          </li>
          <li>
            <strong>Fatture attive</strong> — fatture emesse ai clienti, in attesa di incasso
          </li>
          <li>
            <strong>F24</strong> — versamenti fiscali (IVA, ritenute, contributi)
          </li>
          <li>
            <strong>Rate prestiti</strong> — rate di finanziamenti in corso
          </li>
        </ul>

        <h2>Come usare la pagina</h2>
        <p>
          Guarda la pagina almeno una volta alla settimana. Parti dalle scadenze rosse (se ce ne
          sono) e poi controlla quelle gialle. Questo ti permette di non farti cogliere di sorpresa
          da pagamenti dimenticati e di pianificare la liquidità necessaria nei prossimi giorni.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se vedi molte scadenze rosse (pagamenti scaduti), parlane con il tuo commercialista.
            Potrebbe trattarsi di dati non ancora aggiornati — ad esempio un pagamento che hai già
            fatto ma che non è stato registrato — oppure di veri ritardi da gestire.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/cassa-attuale">Quanto hai in cassa</Link>
          </li>
          <li>
            <Link href="/aiuto/fatture-attive-passive">Fatture attive e passive</Link>
          </li>
          <li>
            <Link href="/aiuto/contattare-commercialista">Contattare il tuo commercialista</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "fatture-attive-passive",
    title: "Fatture attive e passive",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["fatture", "attive", "passive", "clienti", "fornitori"],
    content: () => (
      <>
        <p>
          La pagina Fatture elenca tutte le fatture della tua azienda: quelle che hai emesso ai
          clienti (fatture attive) e quelle che hai ricevuto dai fornitori (fatture passive). È la
          fotografia di quanto ti devono i clienti e quanto devi tu ai fornitori.
        </p>

        <h2>Fatture attive: quelle che emetti tu</h2>
        <p>
          Le fatture attive sono i documenti che la tua azienda emette quando vende un prodotto o un
          servizio. Ogni riga della tabella mostra il cliente, l&apos;importo, la data di emissione,
          la data di scadenza e lo stato (pagata, non pagata, parzialmente pagata).
        </p>
        <p>
          Se una fattura attiva risulta &quot;non pagata&quot; e la scadenza è passata, significa
          che il tuo cliente è in ritardo con il pagamento.
        </p>

        <h2>Fatture passive: quelle che ricevi</h2>
        <p>
          Le fatture passive sono quelle che i fornitori emettono verso la tua azienda. Ogni riga
          mostra il fornitore, l&apos;importo, le date e lo stato di pagamento. Se una fattura
          passiva è in scadenza, devi prepararti a pagarla.
        </p>

        <h2>La tabella delle fatture</h2>
        <p>Per ogni fattura vedi:</p>
        <ul>
          <li>
            <strong>Controparte</strong> — il nome del cliente o del fornitore
          </li>
          <li>
            <strong>Importo</strong> — il valore della fattura, IVA inclusa
          </li>
          <li>
            <strong>Data emissione</strong> — quando è stata emessa
          </li>
          <li>
            <strong>Data scadenza</strong> — entro quando va pagata
          </li>
          <li>
            <strong>Stato</strong> — pagata, in scadenza, scaduta
          </li>
        </ul>

        <h2>IVA: cos&apos;è in breve</h2>
        <p>
          Ogni fattura include l&apos;IVA (Imposta sul Valore Aggiunto). È una tassa che il cliente
          paga a te e che tu poi giri allo Stato. Allo stesso modo, l&apos;IVA che paghi ai
          fornitori ti viene &quot;restituita&quot; in detrazione. Il saldo tra IVA incassata e IVA
          pagata va versato periodicamente tramite F24. Per i dettagli su come funziona l&apos;IVA,
          chiedi al tuo commercialista.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se vedi fatture attive scadute da tempo, potrebbe valere la pena sollecitare il
            pagamento. Ogni fattura non incassata è denaro che manca alla tua cassa. Parlane con il
            commercialista se non sai come procedere.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/scadenze-prossime">Le scadenze dei prossimi giorni</Link>
          </li>
          <li>
            <Link href="/aiuto/cassa-attuale">Quanto hai in cassa</Link>
          </li>
          <li>
            <Link href="/aiuto/glossario-termini">Glossario dei termini</Link>
          </li>
        </ul>
      </>
    ),
  },
];
