import Link from "next/link";
import type { HelpSection } from "../types";

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
        <p>
          Il budget annuale è il riferimento contro cui Finflow misura le performance effettive del
          cliente. Puoi caricarlo da un file Excel con la ripartizione mensile per ogni categoria
          CDG.
        </p>

        <h2>Formato del file Excel</h2>
        <p>
          Il file deve contenere una tabella con 13 colonne: la prima colonna indica la categoria
          CDG, le successive 12 colonne contengono i valori mensili da gennaio a dicembre. Ogni riga
          corrisponde a una delle 17 categorie CDG (Ricavi, Costi Variabili, Costi Fissi, ecc.).
        </p>
        <p>
          Non è necessario inserire le righe dei subtotali (MdC, EBITDA, EBIT, Utile Netto): Finflow
          li calcola automaticamente a partire dai valori delle singole categorie. Se il file
          contiene righe di subtotale, il sistema le ignora.
        </p>

        <h2>Procedura di caricamento</h2>
        <p>
          Apri la pagina di dettaglio del cliente e vai alla scheda &quot;Budget&quot;. Clicca
          &quot;Importa da Excel&quot; e seleziona il file. Il sistema legge le colonne e mostra
          un&apos;anteprima con i valori trovati per ogni categoria e ogni mese.
        </p>
        <p>
          Verifica che i valori nell&apos;anteprima corrispondano al file originale. Se tutto è
          corretto, conferma l&apos;importazione. Il budget viene salvato e diventa immediatamente
          disponibile per il confronto con il consuntivo nella pagina delle varianze.
        </p>

        <h2>Aggiornare il budget</h2>
        <p>
          Puoi ricaricare il budget in qualsiasi momento. Il nuovo file sovrascrive completamente il
          budget precedente per lo stesso anno. Se devi modificare solo alcuni valori, può essere
          più comodo usare l&apos;inserimento manuale invece di ricaricare l&apos;intero file.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il file Excel deve contenere solo valori numerici nelle celle mensili. Evita formule,
            riferimenti ad altri fogli o formattazioni speciali. Se usi formule, esporta il foglio
            come &quot;solo valori&quot; prima del caricamento.
          </p>
        </div>

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
        <p>
          La pagina delle varianze mette a confronto i dati effettivi (consuntivo) con il budget
          previsto. Mostra le differenze in valore assoluto e in percentuale, evidenziando dove le
          performance superano o mancano le aspettative.
        </p>

        <h2>Struttura della pagina</h2>
        <p>
          In alto trovi i KPI card che sintetizzano i dati principali: Ricavi, EBITDA e Utile Netto,
          ciascuno con il valore consuntivo, il valore di budget e la varianza percentuale. Sotto i
          KPI, la tabella dettagliata mostra tutte le 17 categorie CDG con quattro colonne:
        </p>
        <ul>
          <li>
            <strong>Budget</strong> — il valore previsto per la categoria nel periodo selezionato
          </li>
          <li>
            <strong>Consuntivo</strong> — il valore effettivo ricavato dal conto economico
            riclassificato
          </li>
          <li>
            <strong>Varianza (euro)</strong> — la differenza in valore assoluto tra consuntivo e
            budget
          </li>
          <li>
            <strong>Varianza (%)</strong> — la differenza espressa in percentuale rispetto al budget
          </li>
        </ul>

        <h2>Leggere i colori</h2>
        <p>
          Finflow usa una codifica cromatica per rendere immediata la lettura degli scostamenti:
        </p>
        <ul>
          <li>
            <strong>Verde</strong> — varianza favorevole. Per i ricavi significa che il consuntivo
            supera il budget. Per i costi significa che il consuntivo è inferiore al budget (hai
            speso meno del previsto)
          </li>
          <li>
            <strong>Rosso</strong> — varianza sfavorevole. Per i ricavi significa che il consuntivo
            è sotto il budget. Per i costi significa che hai speso più del previsto
          </li>
        </ul>
        <p>
          La logica si inverte automaticamente tra ricavi e costi: il sistema &quot;sa&quot; che per
          un costo un valore inferiore al budget è positivo, non negativo.
        </p>

        <h2>Selezionare il periodo</h2>
        <p>
          Usa il selettore in alto per scegliere l&apos;anno di riferimento. La pagina mostra i dati
          cumulati dall&apos;inizio dell&apos;anno fino all&apos;ultimo periodo disponibile. Se il
          cliente ha granularità mensile, puoi anche filtrare per singolo mese o per intervallo di
          mesi.
        </p>

        <h2>Interpretare le varianze</h2>
        <p>
          Una varianza percentuale entro il +/-5% è generalmente considerata fisiologica. Varianze
          superiori al 10% meritano un approfondimento: verifica se dipendono da eventi
          straordinari, da errori nella stesura del budget o da reali cambiamenti nell&apos;attività
          del cliente. Le varianze sono lo strumento principale per il dialogo tra controller e
          imprenditore.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Concentra l&apos;attenzione sulle varianze che hanno un impatto significativo
            sull&apos;EBITDA. Una varianza del 50% su una voce che vale 500 euro incide poco. Una
            varianza del 5% su una voce da 200.000 euro merita un&apos;analisi approfondita.
          </p>
        </div>

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
