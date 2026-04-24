import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpSteps, HelpStep } from "@/components/help/help-steps";

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina IVA calcola le liquidazioni periodiche del cliente a partire dai movimenti
          bancari categorizzati con aliquota IVA e dal bilancio di verifica. Ti restituisce una
          tabella con IVA a debito, a credito, saldo, eventuale credito riportato dal periodo
          precedente e importo da versare, con scadenza e stato di ogni periodo.
        </p>

        <h2>Come si ricalcola l&apos;IVA</h2>

        <HelpSteps>
          <HelpStep number={1} title="Scegli l'anno e clicca Ricalcola">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>IVA</strong>. In alto a destra
              trovi il selettore <strong>Anno</strong> e il pulsante <strong>Ricalcola</strong>
              (con icona refresh). Seleziona l&apos;anno che ti interessa e clicca Ricalcola.
            </p>
            <HelpScreenshot
              src="/help/firm/ricalcolo-iva/01-pulsante-ricalcola.png"
              alt="Fascia superiore della pagina IVA con pulsante Ricalcola e selettore anno"
              caption="I controlli in alto a destra: pulsante Ricalcola e selettore anno"
              width={1635}
              height={183}
              hotspots={[
                { x: 82, y: 50, label: 1, tooltip: "Pulsante Ricalcola" },
                { x: 93, y: 50, label: 2, tooltip: "Selettore Anno" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Finflow genera le liquidazioni periodiche">
            <p>
              Il motore IVA legge i movimenti categorizzati con aliquota e i saldi del bilancio,
              aggrega IVA a debito e a credito per periodo (mensile o trimestrale in base alla
              granularità CDG del cliente), e produce una liquidazione per ciascun periodo
              dell&apos;anno. Il pulsante mostra &quot;Ricalcolo...&quot; durante l&apos;operazione;
              dopo pochi secondi appare la tabella.
            </p>
          </HelpStep>

          <HelpStep number={3} title="Verifica la tabella delle liquidazioni">
            <p>
              La tabella ha colonne Periodo, IVA a debito, IVA a credito, Saldo, Riporto, Da
              versare, Scadenza, Stato, Azioni. Per ogni periodo ti dice quanto il cliente deve
              versare (o quanto ha di credito), qual è la data di scadenza del versamento e se il
              periodo è già stato pagato, da pagare o scaduto.
            </p>
            <HelpScreenshot
              src="/help/firm/ricalcolo-iva/02-tabella-iva.png"
              alt="Tabella liquidazioni IVA con colonne periodo, debito, credito, saldo, scadenza"
              caption="Le liquidazioni periodiche: una riga per ogni periodo dell'anno scelto"
              width={1623}
              height={278}
              hotspots={[
                { x: 30, y: 20, label: 1, tooltip: "IVA a debito" },
                { x: 50, y: 20, label: 2, tooltip: "IVA a credito e saldo" },
                { x: 80, y: 20, label: 3, tooltip: "Da versare, scadenza, stato" },
              ]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Leggere gli stati</h2>
        <p>Ogni riga della tabella mostra uno stato con codice colore:</p>
        <ul>
          <li>
            <strong>A credito</strong> (blu): il periodo chiude con credito IVA. Non c&apos;è nulla
            da versare; l&apos;importo viene riportato al periodo successivo.
          </li>
          <li>
            <strong>Da pagare</strong> (ambra): il periodo chiude con debito e la scadenza del
            versamento non è ancora passata. Importo da programmare per il versamento.
          </li>
          <li>
            <strong>Scaduta</strong> (rosso): la scadenza del versamento è passata e il periodo
            risulta ancora non pagato. Segnale da portare subito all&apos;attenzione del cliente.
          </li>
        </ul>
        <HelpScreenshot
          src="/help/firm/ricalcolo-iva/03-stati-iva.png"
          alt="Dettaglio di righe con stati diversi: A credito, Da pagare, Scaduta"
          caption="I tre stati possibili con codice colore: A credito (blu), Da pagare (ambra), Scaduta (rosso)"
          width={1012}
          height={267}
          hotspots={[{ x: 70, y: 50, label: 1, tooltip: "Badge di stato con colore" }]}
        />

        <h2>Come Finflow calcola l&apos;IVA</h2>
        <p>
          Il motore aggrega due fonti di dati. Dai <strong>movimenti bancari</strong> categorizzati
          con aliquota IVA (impostata sulla regola Pattern o manualmente), calcola lo split
          netto/IVA di ogni movimento usando la formula{" "}
          <code>iva = importo * aliquota / (100 + aliquota)</code>. Dal{" "}
          <strong>bilancio di verifica</strong> legge i saldi dei conti IVA già presenti in
          contabilità, così l&apos;IVA risultante è allineata al dato contabile e non dipende solo
          dal categorizzato bancario. Le due fonti si completano: movimenti per il dettaglio
          operativo, bilancio per l&apos;autorità contabile.
        </p>

        <h2>Quando eseguire il ricalcolo</h2>
        <p>
          Il ricalcolo IVA <strong>non è automatico</strong>: richiede un clic esplicito. Le
          situazioni in cui è buona pratica rieseguirlo sono tre. Dopo aver caricato un nuovo
          bilancio di verifica, per allineare i saldi IVA con il dato contabile aggiornato. Dopo
          aver categorizzato nuovi movimenti bancari con aliquota IVA (via Pattern o modifica
          manuale). Dopo aver modificato una regola Pattern esistente cambiandone l&apos;aliquota,
          perché i movimenti matchati hanno un nuovo split netto/IVA.
        </p>

        <HelpCallout variant="tip" title="Credito IVA riportato">
          Se l&apos;anno parte con un credito IVA residuo dall&apos;anno precedente, lo imposti
          nell&apos;anagrafica del cliente nel campo <code>vatCarryForward</code>. Il motore lo
          somma automaticamente al primo periodo come valore di partenza del calcolo. Conviene
          impostarlo all&apos;inizio del primo utilizzo di Finflow per quel cliente, altrimenti i
          conteggi del primo mese/trimestre risultano disallineati.
        </HelpCallout>

        <HelpCallout variant="info" title="Se i numeri non tornano">
          Se l&apos;importo IVA calcolato da Finflow differisce dal dato del gestionale contabile
          del cliente, controlla nell&apos;ordine: che il bilancio di verifica caricato sia
          aggiornato, che il mapping dei conti IVA sia completo (nessun conto natura IVA senza
          categoria CDG), che i movimenti con aliquota siano stati categorizzati dai Pattern e non
          siano rimasti fuori.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          L&apos;F24 è il modello unificato per il pagamento di imposte, contributi e tributi.
          Inserendo manualmente le scadenze F24 del cliente in Finflow, le trovi insieme alle altre
          scadenze finanziarie (IVA, rate prestiti) nello scadenziario unificato e nei report PDF
          periodici.
        </p>

        <h2>Inserire una nuova scadenza in tre passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la scheda F24 e clicca Nuovo F24">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>F24</strong>. Trovi una tabella
              con le scadenze già registrate per l&apos;anno selezionato (eventualmente vuota, se
              stai partendo da zero) e in alto a destra il pulsante <strong>Nuovo F24</strong>.
            </p>
            <HelpScreenshot
              src="/help/firm/scadenze-f24/01-lista-f24.png"
              alt="Scheda F24 con tabella scadenze e pulsante Nuovo F24"
              caption="La pagina F24 con il pulsante per aggiungere una nuova scadenza"
              width={1627}
              height={285}
              hotspots={[
                { x: 92, y: 20, label: 1, tooltip: "Pulsante Nuovo F24" },
                { x: 50, y: 75, label: 2, tooltip: "Tabella scadenze registrate" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Compila il form e salva">
            <p>Il dialog chiede cinque dati, di cui tre obbligatori:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Periodo</strong> (obbligatorio): etichetta leggibile per distinguere la
                scadenza (es. &quot;Gennaio 2026&quot;, &quot;IRES Saldo 2025&quot;, &quot;IRAP
                Acconto II rata&quot;).
              </li>
              <li>
                <strong>Codice tributo</strong>: il codice identificativo usato sul modello F24 (es.
                1001 per ritenute lavoro dipendente, 2001 per IRES). Opzionale ma utile per il
                riconoscimento rapido in lista e nei report.
              </li>
              <li>
                <strong>Importo</strong> (obbligatorio): l&apos;ammontare in euro.
              </li>
              <li>
                <strong>Scadenza</strong> (obbligatoria): la data entro cui effettuare il pagamento.
              </li>
              <li>
                <strong>Note</strong>: testo libero per qualsiasi annotazione utile.
              </li>
            </ul>
            <p className="mt-2">
              Clicca <strong>Salva</strong>. La scadenza viene aggiunta immediatamente alla tabella
              e allo scadenziario unificato.
            </p>
            <HelpScreenshot
              src="/help/firm/scadenze-f24/02-dialog-nuovo-f24.png"
              alt="Dialog Nuovo F24 con campi periodo, codice tributo, importo, scadenza, note"
              caption="Il form di inserimento: tre campi obbligatori (periodo, importo, scadenza) più due opzionali"
              width={527}
              height={481}
              hotspots={[
                { x: 50, y: 20, label: 1, tooltip: "Periodo (obbligatorio)" },
                { x: 50, y: 35, label: 2, tooltip: "Codice tributo" },
                { x: 50, y: 50, label: 3, tooltip: "Importo (obbligatorio)" },
                { x: 50, y: 65, label: 4, tooltip: "Scadenza (obbligatoria)" },
                { x: 85, y: 93, label: 5, tooltip: "Pulsante Salva" },
              ]}
            />
          </HelpStep>

          <HelpStep number={3} title="Rivedi la tabella e, se serve, modifica">
            <p>
              Ogni riga della tabella ha le azioni di modifica e cancellazione. Clicca sulla matita
              per aggiornare uno qualsiasi dei campi, sul cestino per eliminare la scadenza. Le
              scadenze scadute (data passata senza conferma di pagamento) vengono evidenziate per
              aiutarti a non dimenticarle.
            </p>
            <HelpScreenshot
              src="/help/firm/scadenze-f24/03-tabella-popolata.png"
              alt="Tabella scadenze F24 popolata con più righe"
              caption="La tabella scadenze con azioni di modifica ed eliminazione per ogni riga"
              width={1628}
              height={155}
              hotspots={[{ x: 95, y: 70, label: 1, tooltip: "Azioni: Modifica ed Elimina" }]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Codici tributo più comuni</h2>
        <p>Un promemoria rapido dei codici più frequenti per ricordarteli al volo:</p>
        <ul>
          <li>
            <strong>1001</strong>: ritenute IRPEF lavoro dipendente
          </li>
          <li>
            <strong>1040</strong>: ritenute IRPEF lavoro autonomo
          </li>
          <li>
            <strong>2001 / 2002</strong>: IRES saldo / acconto
          </li>
          <li>
            <strong>3800 / 3812 / 3813</strong>: IRAP saldo / acconti
          </li>
          <li>
            <strong>6099</strong>: IVA periodica (se versata via F24 invece che tramite liquidazione
            IVA)
          </li>
        </ul>

        <HelpCallout variant="tip" title="Inserisci tutto l'anno a inizio gennaio">
          Molti tributi hanno scadenze fisse nell&apos;anno (16 di ogni mese per ritenute, 16 giugno
          per saldo IRES/IRAP, 30 novembre per acconto). A inizio anno inserisci tutte le scadenze
          note del cliente: lo scadenziario diventa da subito una fotografia completa del carico
          fiscale e il report PDF 90 giorni riflette sempre l&apos;intero orizzonte fiscale.
        </HelpCallout>

        <HelpCallout variant="info" title="Perché inserire F24 a mano">
          A differenza delle liquidazioni IVA, che Finflow calcola dai movimenti e dai bilanci, le
          scadenze F24 sono un input dello studio: tu conosci il calendario fiscale del cliente,
          Finflow lo registra per te. In futuro questa sezione potrà essere integrata con il
          gestionale fiscale per l&apos;alimentazione automatica.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La sezione Prestiti registra mutui, finanziamenti bancari e linee di credito del cliente.
          Definisci una volta i parametri (importo, rata, date, frequenza) e Finflow tiene traccia
          delle prossime rate in scadenza, le integra nello scadenziario unificato e le include nel
          report PDF 90 giorni.
        </p>

        <h2>Inserire un prestito in tre passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la scheda Prestiti e clicca Nuovo prestito">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>Prestiti</strong>. In alto a
              destra trovi il pulsante <strong>Nuovo prestito</strong>. La tabella sotto mostra i
              prestiti già registrati (vuota la prima volta).
            </p>
            <HelpScreenshot
              src="/help/firm/prestiti/01-lista-prestiti.png"
              alt="Scheda Prestiti con tabella e pulsante Nuovo prestito"
              caption="La pagina Prestiti con il pulsante per aggiungere un nuovo finanziamento"
              width={1624}
              height={281}
              hotspots={[{ x: 92, y: 22, label: 1, tooltip: "Pulsante Nuovo prestito" }]}
            />
          </HelpStep>

          <HelpStep number={2} title="Compila il form del prestito">
            <p>
              Il dialog chiede diversi dati; i quattro obbligatori sono nome, importo totale, rata e
              data inizio. Gli altri campi rifiniscono il piano e migliorano i calcoli del debito
              residuo.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Nome prestito</strong> (obbligatorio): etichetta descrittiva (es.
                &quot;Mutuo sede&quot;, &quot;Leasing furgone&quot;).
              </li>
              <li>
                <strong>Banca</strong>: istituto erogante (es. Intesa Sanpaolo, Unicredit).
              </li>
              <li>
                <strong>Importo totale</strong> (obbligatorio): capitale iniziale del finanziamento.
              </li>
              <li>
                <strong>Rata</strong> (obbligatoria): importo della rata periodica.
              </li>
              <li>
                <strong>Quota capitale</strong> e <strong>Quota interessi</strong>: ripartizione
                della rata, utile per la classificazione contabile (capitale come rientro del
                debito, interessi come oneri finanziari).
              </li>
              <li>
                <strong>Frequenza</strong>: mensile, trimestrale, semestrale, annuale.
              </li>
              <li>
                <strong>Giorno del mese</strong>: il giorno in cui scade la rata (es. 15).
              </li>
              <li>
                <strong>Data inizio</strong> (obbligatoria) e <strong>Data fine</strong>: intervallo
                dell&apos;ammortamento. Se conosci la data fine esatta Finflow può stimare il numero
                di rate residue.
              </li>
              <li>
                <strong>Note</strong>: annotazioni libere.
              </li>
            </ul>
            <p className="mt-2">Clicca Salva per registrare il prestito.</p>
            <HelpScreenshot
              src="/help/firm/prestiti/02-dialog-nuovo-prestito.png"
              alt="Dialog Nuovo prestito con tutti i campi compilati"
              caption="Il form completo: i quattro campi obbligatori sono contrassegnati con asterisco"
              width={523}
              height={544}
              hotspots={[
                { x: 50, y: 12, label: 1, tooltip: "Nome prestito (obbligatorio)" },
                { x: 50, y: 30, label: 2, tooltip: "Importo totale e Rata (obbligatori)" },
                { x: 50, y: 55, label: 3, tooltip: "Frequenza e giorno del mese" },
                { x: 50, y: 78, label: 4, tooltip: "Data inizio (obbligatoria) e fine" },
              ]}
            />
          </HelpStep>

          <HelpStep number={3} title="Rivedi la tabella e gestisci i prestiti esistenti">
            <p>
              Dopo il salvataggio il prestito compare nella tabella con nome, banca, importo totale,
              rata e date di inizio/fine. Le azioni per riga ti permettono di modificare i dati (se
              cambia il piano di ammortamento, se estingui in anticipo) o eliminare il record.
            </p>
            <HelpScreenshot
              src="/help/firm/prestiti/03-tabella-popolata.png"
              alt="Tabella prestiti con un prestito registrato"
              caption="Ogni riga della tabella rappresenta un prestito attivo con le sue azioni"
              width={1636}
              height={161}
              hotspots={[{ x: 95, y: 70, label: 1, tooltip: "Azioni: Modifica ed Elimina" }]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Perché separare Quota capitale e Quota interessi</h2>
        <p>
          In un piano di ammortamento alla francese (il più comune nei mutui italiani) la rata è
          costante ma la composizione interna cambia nel tempo: all&apos;inizio prevale la quota
          interessi, poi man mano la quota capitale cresce. Finflow non calcola il piano per te
          (quello te lo fornisce la banca), ma ti permette di registrare la suddivisione media così
          la categorizzazione CDG è coerente: la quota capitale riduce il debito, la quota interessi
          alimenta la categoria <code>FINANCIAL_EXPENSE</code>. Se non hai questi dati puoi
          lasciarli vuoti: il prestito viene comunque tracciato nello scadenziario con la rata
          intera.
        </p>

        <HelpCallout variant="warning" title="Il debito residuo è una stima">
          Finflow calcola il debito residuo sulla base delle rate costanti registrate. Se il
          prestito ha tasso variabile, rinegoziazioni o rate saltate, il valore stimato differisce
          da quello reale della banca. Per l&apos;analisi di gestione è un&apos;ottima
          approssimazione; per la comunicazione ufficiale al cliente, allega sempre il piano di
          ammortamento aggiornato fornito dalla banca.
        </HelpCallout>

        <HelpCallout variant="tip" title="Registra anche le linee di credito">
          Oltre a mutui e finanziamenti strutturati, conviene registrare qui anche le linee di
          credito attive (fidi, aperture di credito): importo accordato come &quot;importo
          totale&quot;, interessi stimati come rata periodica. Così nello scadenziario appaiono
          anche gli oneri finanziari ricorrenti, non solo le rate piene.
        </HelpCallout>

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
