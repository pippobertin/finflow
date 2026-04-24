import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpSteps, HelpStep } from "@/components/help/help-steps";

const CH = 4;
const CH_TITLE = "Budget e preconsuntivo";

export const sections: HelpSection[] = [
  {
    slug: "budget-excel",
    title: "Caricare il budget annuale da Excel",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["budget", "excel", "caricare", "import", "annuale"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Il budget annuale è il riferimento contro cui Finflow misura le performance effettive del
          cliente. Lo carichi da un file Excel con la ripartizione mensile delle 17 categorie CDG,
          oppure lo inserisci a mano nella griglia a 12 mesi.
        </p>

        <h2>Caricare il file in tre passi</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la scheda Budget e scegli l'anno">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>Budget</strong>. In alto a
              destra trovi il selettore dell&apos;anno (dropdown con l&apos;anno corrente e i due
              precedenti più quello successivo). Scegli l&apos;anno per cui vuoi caricare il budget.
              Accanto vedi i pulsanti <strong>Varianze</strong> (per confrontare consuntivo e
              budget), <strong>Carica Excel</strong> e, se hai già dati per l&apos;anno,{" "}
              <strong>Elimina anno</strong>.
            </p>
            <HelpScreenshot
              src="/help/firm/budget-excel/01-header-budget.png"
              alt="Fascia superiore della pagina Budget con selettore anno e pulsanti azione"
              caption="I controlli in alto a destra: Varianze, anno, Carica Excel, Elimina anno"
              width={1230}
              height={117}
              hotspots={[
                { x: 60, y: 50, label: 1, tooltip: "Selettore anno" },
                { x: 80, y: 50, label: 2, tooltip: "Carica Excel" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Clicca Carica Excel e seleziona il file">
            <p>
              Al clic si apre il file picker di sistema. Seleziona il file <code>.xlsx</code> o{" "}
              <code>.xls</code> preparato secondo il formato indicato più sotto. Finflow legge le
              celle, aggiorna la griglia del budget per l&apos;anno selezionato e mostra un
              messaggio di esito (successo o lista errori).
            </p>
          </HelpStep>

          <HelpStep number={3} title="Verifica la griglia popolata">
            <p>
              Dopo il caricamento vedi la griglia popolata: righe per le 17 categorie CDG, colonne
              per i 12 mesi. Le righe dei margini progressivi (Margine di contribuzione, EBITDA,
              EBIT, Utile ante imposte, Utile netto) sono calcolate automaticamente e mostrate con
              evidenziazione grafica. Scorri e verifica che i valori corrispondano al file sorgente.
            </p>
            <HelpScreenshot
              src="/help/firm/budget-excel/02-griglia-popolata.png"
              alt="Griglia budget completa con categorie, mesi e margini progressivi evidenziati"
              caption="La griglia budget 12 mesi × 17 categorie, con i margini progressivi calcolati"
              width={1631}
              height={620}
              hotspots={[
                { x: 50, y: 45, label: 1, tooltip: "Sezione categorie CDG" },
                { x: 50, y: 80, label: 2, tooltip: "Margini progressivi calcolati" },
              ]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>Formato del file Excel</h2>
        <p>
          Il file deve avere 13 colonne: la prima con il nome della categoria CDG, le altre dodici
          con i valori mensili da gennaio a dicembre. Ogni riga corrisponde a una delle 17 categorie
          CDG (Ricavi, Costi variabili materiali, Costi variabili servizi, Costi variabili lavoro
          diretto, le 8 sottocategorie di Costi fissi, Proventi finanziari, Oneri finanziari,
          Proventi straordinari, Oneri straordinari, Imposte).
        </p>
        <p>
          Non serve inserire le righe dei subtotali (MdC, EBITDA, EBIT, Utile netto): Finflow li
          calcola in automatico. Se il file contiene righe di subtotale, il sistema le ignora.
        </p>

        <HelpCallout variant="warning" title="Evita formule e riferimenti">
          Le celle mensili devono contenere valori numerici puri. Formule, riferimenti ad altri
          fogli o celle con errori (<code>#RIF!</code>, <code>#VALORE!</code>) bloccano la lettura.
          Se hai preparato il budget con formule, duplica il foglio e incolla i valori come
          &quot;solo valori&quot; prima di salvare il file da caricare.
        </HelpCallout>

        <h2>Modificare i valori a mano</h2>
        <p>
          Oltre al caricamento Excel, puoi editare i singoli valori direttamente nella griglia:
          clicca in una cella mensile di una categoria, scrivi il valore e premi Invio (o clicca
          fuori). Il totale della riga e i margini progressivi si ricalcolano immediatamente. Questa
          modalità è utile per correggere pochi valori senza ricaricare tutto il file o per
          impostare manualmente un budget quando non hai un Excel pronto.
        </p>
        <HelpScreenshot
          src="/help/firm/budget-excel/03-cella-editabile.png"
          alt="Cella editabile nella griglia budget con valore in modifica"
          caption="Le celle mensili sono editabili: clicca e modifica i valori a mano"
          width={573}
          height={205}
          hotspots={[{ x: 50, y: 50, label: 1, tooltip: "Cella in modifica" }]}
        />

        <h2>Aggiornare o eliminare il budget</h2>
        <p>
          Puoi ricaricare il budget in qualsiasi momento. Il nuovo file sovrascrive completamente
          quello precedente per lo stesso anno. Se vuoi partire da zero su un anno già caricato, usa{" "}
          <strong>Elimina anno</strong>: svuota la griglia senza toccare gli altri anni.
        </p>

        <HelpCallout variant="tip" title="Il prossimo passo">
          Quando il budget è caricato e il consuntivo è disponibile (bilancio di verifica mappato),
          puoi leggere il confronto andando su{" "}
          <Link href="/firm/aiuto/budget-varianze" className="font-medium underline">
            Consuntivo vs budget: leggere le varianze
          </Link>
          .
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/budget-manuale">Inserire il budget manualmente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/budget-varianze">
              Consuntivo vs budget: leggere le varianze
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/preconsuntivo">Preconsuntivo: proiezione chiusura anno</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "budget-manuale",
    title: "Inserire il budget manualmente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["budget", "manuale", "inserire", "creare", "compilare"],
    content: () => (
      <>
        <p>
          Se non disponi di un file Excel precompilato, puoi inserire il budget direttamente
          nell&apos;interfaccia di Finflow. La griglia di inserimento manuale ti permette di
          compilare i valori mese per mese, con calcolo automatico dei subtotali.
        </p>

        <h2>La griglia di inserimento</h2>
        <p>
          Dalla scheda &quot;Budget&quot; del cliente, seleziona l&apos;anno e clicca
          &quot;Inserimento manuale&quot;. Si apre una griglia con 17 righe (una per ogni categoria
          CDG) e 12 colonne (una per ogni mese). Le celle sono editabili: clicca su una cella,
          digita il valore e premi Tab per passare alla cella successiva.
        </p>

        <h2>Subtotali automatici</h2>
        <p>Mentre inserisci i valori, Finflow calcola in tempo reale i subtotali progressivi:</p>
        <ul>
          <li>
            <strong>Margine di Contribuzione</strong> = Ricavi - somma dei Costi Variabili
          </li>
          <li>
            <strong>EBITDA</strong> = MdC - Costi Fissi (esclusi ammortamenti)
          </li>
          <li>
            <strong>EBIT</strong> = EBITDA - Ammortamenti
          </li>
          <li>
            <strong>Utile Netto</strong> = EBIT +/- Gestione finanziaria +/- Straordinari - Imposte
          </li>
        </ul>
        <p>
          I subtotali appaiono come righe evidenziate nella griglia e non sono editabili: si
          aggiornano automaticamente in base ai valori che inserisci nelle righe delle categorie.
        </p>

        <h2>Salvare e modificare</h2>
        <p>
          Quando hai completato l&apos;inserimento, clicca &quot;Salva budget&quot;. Puoi tornare a
          modificare i valori in qualsiasi momento: apri la griglia, cambia le celle desiderate e
          salva di nuovo. Le modifiche si riflettono immediatamente nella pagina delle varianze.
        </p>

        <h2>Compilazione parziale</h2>
        <p>
          Non sei obbligato a compilare tutte le celle in una sola sessione. Puoi inserire i valori
          per i primi mesi, salvare, e completare i mesi restanti in seguito. Le celle vuote vengono
          trattate come zero nei calcoli. Quando le compilerai, i subtotali si aggiorneranno di
          conseguenza.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Se il cliente ha un budget costante mese per mese (ad esempio costi fissi uguali ogni
            mese), inserisci il valore nel primo mese e usa la funzione &quot;Replica su tutti i
            mesi&quot; per copiarlo sulle altre 11 colonne. Risparmierai tempo sulla compilazione
            delle voci ricorrenti.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/budget-excel">Caricare il budget annuale da Excel</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/budget-varianze">
              Consuntivo vs budget: leggere le varianze
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
    slug: "budget-varianze",
    title: "Consuntivo vs budget: leggere le varianze",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["consuntivo", "budget", "varianze", "scostamenti", "analisi"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Varianze confronta il consuntivo (dai bilanci mappati) con il budget annuale e
          mostra gli scostamenti in euro e in percentuale, con codifica cromatica che rende la
          lettura immediata.
        </p>

        <h2>I tre KPI di sintesi</h2>
        <p>
          In cima alla pagina tre card riassumono le grandezze principali: Ricavi, EBITDA e Utile
          Netto. Ciascuna card mostra il valore consuntivo in evidenza, il valore di budget come
          riferimento e la varianza (in euro e in percentuale). Ti basta uno sguardo per capire dove
          il cliente sta andando meglio o peggio rispetto alle attese.
        </p>
        <HelpScreenshot
          src="/help/firm/budget-varianze/01-kpi-varianze.png"
          alt="Tre card KPI Ricavi, EBITDA e Utile Netto con budget, consuntivo e varianza"
          caption="Le tre card di sintesi in alto con budget, consuntivo e scostamenti"
          width={1639}
          height={182}
          hotspots={[
            { x: 18, y: 50, label: 1, tooltip: "KPI Ricavi" },
            { x: 50, y: 50, label: 2, tooltip: "KPI EBITDA" },
            { x: 82, y: 50, label: 3, tooltip: "KPI Utile Netto" },
          ]}
        />

        <h2>La tabella dettagliata</h2>
        <p>
          Sotto i KPI trovi la tabella completa che scompone il conto economico nelle 17 categorie
          CDG più i subtotali progressivi. Le colonne sono:
        </p>
        <ul>
          <li>
            <strong>Voce</strong>: la categoria o il margine (MdC, EBITDA, EBIT, utile netto).
          </li>
          <li>
            <strong>Budget</strong>: il valore previsto per la voce nel periodo selezionato.
          </li>
          <li>
            <strong>Consuntivo</strong>: il valore effettivo dal conto economico riclassificato.
          </li>
          <li>
            <strong>Var. €</strong>: la differenza in valore assoluto (consuntivo meno budget).
          </li>
          <li>
            <strong>Var. %</strong>: la stessa differenza espressa come percentuale del budget.
          </li>
        </ul>
        <p>
          Le righe dei subtotali hanno sfondo più scuro e testo in grassetto, così distingui a colpo
          d&apos;occhio le voci operative dai margini aggregati.
        </p>
        <HelpScreenshot
          src="/help/firm/budget-varianze/02-tabella-varianze.png"
          alt="Tabella varianze con Voce, Budget, Consuntivo, Var. euro, Var. percentuale"
          caption="La tabella dettagliata con tutte le categorie e i subtotali progressivi"
          width={1635}
          height={524}
          hotspots={[
            { x: 50, y: 10, label: 1, tooltip: "Intestazione colonne" },
            { x: 82, y: 50, label: 2, tooltip: "Varianze con codice colore" },
          ]}
        />

        <h2>Leggere i colori</h2>
        <p>
          Finflow colora le varianze in base alla loro natura rispetto alla voce, non al segno
          aritmetico:
        </p>
        <ul>
          <li>
            <strong>Verde</strong>: varianza favorevole. Per i ricavi significa consuntivo sopra
            budget; per i costi significa consuntivo sotto budget (ho speso meno del previsto).
          </li>
          <li>
            <strong>Rosso</strong>: varianza sfavorevole. Per i ricavi consuntivo sotto budget; per
            i costi consuntivo sopra budget (ho speso più del previsto).
          </li>
        </ul>
        <p>
          La logica si inverte automaticamente tra ricavi e costi: il sistema sa che per un costo un
          valore inferiore al budget è positivo, non negativo, e colora di conseguenza.
        </p>
        <HelpScreenshot
          src="/help/firm/budget-varianze/03-dettaglio-varianza.png"
          alt="Dettaglio di tre righe della tabella con varianze verdi e rosse"
          caption="Zoom su righe con varianze favorevoli (verde) e sfavorevoli (rosso)"
          width={903}
          height={201}
          hotspots={[
            { x: 70, y: 30, label: 1, tooltip: "Varianza favorevole (verde)" },
            { x: 70, y: 70, label: 2, tooltip: "Varianza sfavorevole (rosso)" },
          ]}
        />

        <h2>Scegliere l&apos;anno</h2>
        <p>
          Il selettore in alto sceglie l&apos;anno di riferimento. La pagina mostra il cumulato
          anno-a-oggi: tutti i mesi disponibili sommati, confrontati con il budget dei mesi
          corrispondenti. Questo evita confronti distorti (non paragoni 12 mesi di budget con 4 mesi
          di consuntivo).
        </p>

        <HelpCallout variant="tip" title="Dove concentrare l'attenzione">
          Una varianza del 50% su una voce da 500 euro incide poco sul risultato. Una varianza del
          5% su una voce da 200.000 euro invece vale 10.000 euro di impatto a bilancio. Guarda
          sempre la varianza in euro, non solo la percentuale, quando decidi cosa approfondire.
          Varianze entro il ±5% sono di norma fisiologiche; sopra il 10% meritano un&apos;analisi.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/budget-excel">Caricare il budget annuale da Excel</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/budget-manuale">Inserire il budget manualmente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/preconsuntivo">Preconsuntivo: proiezione chiusura anno</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "preconsuntivo",
    title: "Preconsuntivo: proiezione chiusura anno",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["preconsuntivo", "proiezione", "chiusura", "anno", "forecast"],
    content: () => (
      <>
        <p>
          Il preconsuntivo risponde alla domanda: &quot;Se l&apos;andamento attuale si conferma,
          come chiuderà l&apos;anno il cliente?&quot;. Finflow combina i dati reali dei mesi già
          trascorsi con le previsioni di budget per i mesi restanti e produce una stima della
          chiusura annuale.
        </p>

        <h2>Come viene costruito</h2>
        <p>Il preconsuntivo utilizza due fonti di dati:</p>
        <ul>
          <li>
            <strong>Mesi con dati reali</strong> — per ogni mese coperto da un bilancio di verifica
            (periodo congelato) o da dati operativi, il sistema usa il valore effettivo del conto
            economico riclassificato
          </li>
          <li>
            <strong>Mesi senza dati reali</strong> — per i mesi futuri o non ancora caricati, il
            sistema usa i valori del budget mensile come previsione
          </li>
        </ul>
        <p>
          Il risultato è una proiezione che integra il consuntivo parziale con la pianificazione
          residua. Ad esempio, se a fine giugno hai caricato i bilanci di verifica dei primi sei
          mesi, il preconsuntivo mostrerà: i valori reali per gennaio-giugno e i valori di budget
          per luglio-dicembre.
        </p>

        <h2>Cosa mostra la pagina</h2>
        <p>
          La vista del preconsuntivo presenta una tabella con le stesse 17 categorie CDG del conto
          economico riclassificato, più i subtotali (MdC, EBITDA, EBIT, Utile Netto). Per ogni riga
          trovi:
        </p>
        <ul>
          <li>
            <strong>Consuntivo parziale</strong> — la somma dei valori reali dei mesi già trascorsi
          </li>
          <li>
            <strong>Previsione residua</strong> — la somma dei valori di budget per i mesi restanti
          </li>
          <li>
            <strong>Preconsuntivo annuale</strong> — la somma delle due componenti precedenti
          </li>
          <li>
            <strong>Budget annuale</strong> — il totale annuo del budget originario
          </li>
          <li>
            <strong>Varianza attesa</strong> — la differenza tra preconsuntivo e budget annuale
          </li>
        </ul>

        <h2>Quando aggiornare il preconsuntivo</h2>
        <p>
          Il preconsuntivo si aggiorna automaticamente ogni volta che carichi un nuovo bilancio di
          verifica. Man mano che i mesi reali aumentano, la componente &quot;previsione&quot; si
          riduce e la stima diventa più accurata. A fine anno, quando tutti i 12 mesi hanno dati
          reali, il preconsuntivo coincide con il consuntivo finale.
        </p>

        <h2>Utilità per il controller</h2>
        <p>
          Il preconsuntivo è lo strumento con cui anticipi i problemi. Se a metà anno il
          preconsuntivo mostra un EBITDA significativamente inferiore al budget, hai il tempo per
          discutere con l&apos;imprenditore e valutare azioni correttive. Senza preconsuntivo,
          queste informazioni emergerebbero solo a consuntivo, quando non c&apos;è più margine di
          intervento.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Per ottenere un preconsuntivo affidabile, assicurati che il budget sia compilato per
            tutti i 12 mesi. Se mancano i valori di budget per i mesi futuri, il preconsuntivo userà
            zero come previsione per quei mesi, sottostimando il risultato atteso.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/budget-varianze">
              Consuntivo vs budget: leggere le varianze
            </Link>
          </li>
          <li>
            <Link href="/firm/aiuto/congelamento-periodi">Congelamento periodi chiusi</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
        </ul>
      </>
    ),
  },
];
