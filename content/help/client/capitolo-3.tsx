import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Cassa risponde a due domande operative: la liquidità disponibile in questo
          momento e la sua proiezione rispetto alle scadenze in arrivo nei prossimi mesi.
        </p>

        <HelpScreenshot
          src="/help/clienti/cassa-attuale/03-cassa-cliente.png"
          alt="Pagina cassa con saldo attuale, soglia minima e prossime scadenze"
          caption="La pagina Cassa: saldo corrente, soglia minima e scadenze nei prossimi 90 giorni"
          width={1629}
          height={604}
        />

        <h2>Origine del dato</h2>
        <p>
          Il saldo di cassa è calcolato a partire dai movimenti dei conti correnti aziendali,
          importati periodicamente dal commercialista. Il sistema somma le entrate, sottrae le
          uscite (fornitori, stipendi, rate, tributi) e restituisce il saldo netto.
        </p>
        <p>
          Il valore mostrato è aggiornato all&apos;ultimo caricamento disponibile: per il saldo in
          tempo reale è opportuno consultare l&apos;home banking. La pagina Cassa serve invece per
          la visione d&apos;insieme che integra saldo e proiezione delle uscite future.
        </p>

        <h2>La distinzione tra cassa e ricavi</h2>
        <p>
          I ricavi misurano il valore delle vendite fatturate; la cassa misura la liquidità
          effettivamente disponibile sui conti. Le due grandezze possono divergere
          significativamente: con clienti che pagano a 60 giorni, una fattura emessa a marzo
          incrementa i ricavi del periodo ma genera incasso solo a maggio. Vanno lette in parallelo
          per avere un quadro completo.
        </p>

        <h2>La soglia minima di liquidità</h2>
        <p>
          La soglia mostrata sotto il saldo è un parametro concordato con il commercialista, che
          rappresenta il livello minimo di cassa raccomandato per garantire la regolarità dei
          pagamenti correnti. Quando il saldo previsto si avvicina a questa soglia, il sistema
          attiva una segnalazione visiva.
        </p>

        <h2>Le scadenze nei prossimi 90 giorni</h2>
        <p>
          Sotto il saldo trovi l&apos;elenco delle uscite di cassa programmate: tributi, F24, rate
          di finanziamenti, fatture fornitori, con data, importo e tipologia. La somma algebrica con
          il saldo corrente permette di verificare la tenuta della cassa nei mesi a venire.
        </p>

        <HelpCallout variant="warning" title="Tempestività degli interventi">
          Quando il saldo previsto si avvicina alla soglia minima, è opportuno attivare per tempo le
          contromisure: sollecito degli incassi, rinegoziazione delle scadenze fornitori,
          valutazione di linee di credito. Le opzioni disponibili sono efficaci se attivate prima
          che la situazione diventi urgente.
        </HelpCallout>

        <HelpCallout variant="tip" title="Monitoraggio periodico">
          Una verifica settimanale della pagina Cassa, con controllo del saldo corrente e delle
          scadenze dei 30 giorni successivi, è sufficiente per identificare per tempo eventuali
          criticità di liquidità.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Scadenze raccoglie in un unico elenco gli impegni di pagamento e di incasso
          programmati: fatture passive verso fornitori, fatture attive verso clienti, versamenti F24
          e rate di finanziamenti, ordinati per data.
        </p>

        <HelpScreenshot
          src="/help/clienti/scadenze-prossime/01-scadenze.png"
          alt="Lista scadenze ordinate per data con codice colore di urgenza"
          caption="Tutte le scadenze in arrivo, ordinate per data e differenziate per stato"
          width={1611}
          height={460}
        />

        <h2>Il codice colore</h2>
        <p>
          Lo stato di ogni scadenza è identificato visivamente da un colore che rappresenta il
          livello di urgenza:
        </p>
        <ul>
          <li>
            <strong>Rosso</strong>: scadenza superata e non ancora saldata. Richiede intervento
            immediato.
          </li>
          <li>
            <strong>Giallo / arancione</strong>: scadenza imminente, prevista nei giorni successivi.
            Da pianificare per il pagamento o, in caso di credito, per il sollecito.
          </li>
          <li>
            <strong>Grigio</strong>: scadenza futura, fuori dall&apos;orizzonte di azione immediata.
            Funzione di pianificazione.
          </li>
        </ul>

        <h2>Tipologie di scadenze</h2>
        <p>L&apos;elenco aggrega diverse tipologie:</p>
        <ul>
          <li>
            <strong>Fatture passive</strong>: documenti emessi dai fornitori, in attesa di
            pagamento.
          </li>
          <li>
            <strong>Fatture attive</strong>: documenti emessi ai clienti, in attesa di incasso.
          </li>
          <li>
            <strong>F24</strong>: versamenti fiscali e contributivi (IVA, ritenute, contributi).
          </li>
          <li>
            <strong>Rate prestiti</strong>: rate periodiche dei finanziamenti in essere.
          </li>
        </ul>

        <h2>Modalità di consultazione</h2>
        <p>
          Una verifica settimanale è sufficiente per non perdere il controllo. La sequenza corretta
          privilegia prima le voci in rosso (gli arretrati) e poi quelle in giallo (le scadenze
          imminenti), in modo da pianificare per tempo la liquidità necessaria.
        </p>

        <HelpCallout variant="tip" title="Scadenze rosse persistenti">
          Una concentrazione di scadenze in rosso può dipendere da pagamenti già effettuati ma non
          ancora registrati nel sistema, oppure da arretrati effettivi. In entrambi i casi è
          opportuno il confronto con il commercialista, sia per allineare i dati che per gestire
          eventuali ritardi reali.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Fatture restituisce il quadro completo dei rapporti documentali
          dell&apos;azienda: le fatture <strong>attive</strong> emesse ai clienti e quelle{" "}
          <strong>passive</strong> ricevute dai fornitori. È la rappresentazione di
          quanto&apos;l&apos;azienda deve incassare e quanto deve pagare.
        </p>

        <h2>Fatture attive</h2>
        <p>
          Le fatture attive sono i documenti emessi a fronte di vendite di beni o servizi. Per
          ciascuna riga sono riportati il cliente, l&apos;importo, la data di emissione, la data di
          scadenza e lo stato di pagamento (pagata, parzialmente pagata, non pagata). Una fattura
          attiva con stato non pagato e scadenza superata segnala un ritardo nel pagamento da parte
          del cliente.
        </p>
        <HelpScreenshot
          src="/help/clienti/fatture-attive-passive/01-fatture-attive.png"
          alt="Lista delle fatture attive emesse ai clienti"
          caption="Le fatture attive: documenti emessi ai clienti, in attesa di incasso"
          width={1368}
          height={411}
        />

        <h2>Fatture passive</h2>
        <p>
          Le fatture passive sono i documenti ricevuti dai fornitori. La tabella riporta il
          fornitore, l&apos;importo, le date e lo stato di pagamento. Le scadenze imminenti
          richiedono pianificazione di liquidità per garantire il pagamento puntuale.
        </p>
        <HelpScreenshot
          src="/help/clienti/fatture-attive-passive/02-fatture-passive.png"
          alt="Lista delle fatture passive ricevute dai fornitori"
          caption="Le fatture passive: documenti ricevuti dai fornitori, in attesa di pagamento"
          width={1446}
          height={448}
        />

        <h2>Da dove arrivano le fatture</h2>
        <p>
          Le fatture passate e correnti — quelle realmente emesse e ricevute — vengono importate dal
          commercialista tramite un caricamento Excel massivo: il commercialista esporta le fatture
          dal proprio gestionale contabile (Profis, ProOffice, Fatture in Cloud o altro software) e
          le carica in Finflow periodicamente, in genere dopo ogni chiusura mensile o trimestrale.
          Questo è il canale principale di alimentazione dei dati fattura. In futuro sarà
          disponibile anche l&apos;importazione diretta dal Sistema di Interscambio (SDI).
        </p>
        <p>
          Tu come imprenditore puoi aggiungere fatture previste con data futura, per anticipare la
          pianificazione finanziaria: una fattura attiva da emettere a giugno, una passiva attesa da
          un fornitore, eventi che sai si verificheranno.
        </p>
        <p>
          Le fatture previste contribuiscono alla proiezione di cassa, alle scadenze e
          all&apos;andamento dei ricavi insieme alle fatture reali, e sono distinte da un badge
          &quot;Prevista&quot; nella tabella. Quando il commercialista caricherà la fattura reale
          corrispondente, potrai cancellare la previsione manualmente.
        </p>

        <HelpCallout variant="info" title="Il Sistema di Interscambio (SDI)">
          Dal 2019 tutte le fatture tra soggetti IVA italiani devono transitare in formato
          elettronico attraverso il SDI. Questo garantisce che i dati siano completi e certificati.
          Il tuo commercialista gestisce il flusso SDI e importa le fatture in FinFlow: non è
          necessario alcun intervento da parte tua.
        </HelpCallout>

        <h2>Le colonne della tabella</h2>
        <ul>
          <li>
            <strong>Controparte</strong>: nominativo del cliente (per le attive) o del fornitore
            (per le passive).
          </li>
          <li>
            <strong>Importo</strong>: valore della fattura, IVA inclusa.
          </li>
          <li>
            <strong>Data emissione</strong>: data di emissione del documento.
          </li>
          <li>
            <strong>Data scadenza</strong>: termine ultimo per il pagamento.
          </li>
          <li>
            <strong>Stato</strong>: pagata, in scadenza, scaduta.
          </li>
        </ul>

        <h2>L&apos;IVA in sintesi</h2>
        <p>
          L&apos;Imposta sul Valore Aggiunto è una componente di ogni fattura. L&apos;azienda
          incassa IVA dai propri clienti sulle fatture attive e paga IVA ai propri fornitori sulle
          fatture passive: la differenza tra IVA incassata e IVA pagata costituisce il saldo da
          versare periodicamente tramite F24, oppure il credito da utilizzare a compensazione. Il
          calcolo dettagliato e la gestione delle liquidazioni sono in capo al commercialista.
        </p>

        <HelpCallout variant="tip" title="Crediti commerciali e cassa">
          Le fatture attive con scadenza superata rappresentano crediti incagliati che incidono
          direttamente sulla liquidità aziendale. Il sollecito tempestivo dei pagamenti scaduti è
          un&apos;azione di gestione che protegge la cassa e mantiene ordinato il rapporto
          commerciale. Per le procedure di sollecito, il commercialista può fornire il supporto
          operativo.
        </HelpCallout>

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
