import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";

const CH = 2;
const CH_TITLE = "Come sta andando la tua azienda";

export const sections: HelpSection[] = [
  {
    slug: "dashboard-kpi",
    title: "I numeri in cima: ricavi, EBITDA, utile",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["KPI", "ricavi", "EBITDA", "utile", "dashboard"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          In cima alla dashboard trovi gli indicatori chiave del periodo: ricavi, EBITDA, utile
          netto e punto di pareggio. Sono i numeri che misurano lo stato dell&apos;azienda in quel
          momento.
        </p>

        <HelpScreenshot
          src="/help/clienti/dashboard-kpi/01-overview-cliente.png"
          alt="Dashboard cliente con i KPI in cima e grafico di andamento"
          caption="I numeri chiave in cima alla dashboard: un colpo d'occhio sull'andamento aziendale"
          width={1629}
          height={783}
        />

        <h2>Ricavi</h2>
        <p>
          Il valore complessivo di quanto fatturato ai clienti nel periodo. È importante distinguere
          il fatturato dall&apos;incassato: una fattura emessa a fine mese con pagamento a 60 giorni
          rientra nei ricavi del periodo, anche se i soldi non sono ancora arrivati sul conto. La
          liquidità effettivamente disponibile la trovi nella sezione Cassa.
        </p>

        <h2>EBITDA</h2>
        <p>
          L&apos;EBITDA misura il margine operativo lordo, cioè il guadagno generato
          dall&apos;attività ordinaria prima di tasse, interessi sui prestiti e ammortamenti. È
          l&apos;indicatore più affidabile per valutare la redditività della gestione corrente,
          perché esclude i fattori che non dipendono direttamente dalle scelte aziendali (carico
          fiscale, costo del denaro, politiche di ammortamento).
        </p>
        <p>
          Un EBITDA positivo e in crescita indica un&apos;attività operativa in salute. Un EBITDA in
          calo segnala una perdita di efficienza nella gestione, anche quando i ricavi continuano a
          crescere.
        </p>

        <h2>Utile netto</h2>
        <p>
          Il risultato finale d&apos;esercizio, calcolato sottraendo dai ricavi tutti i costi
          (operativi, finanziari, fiscali) e gli ammortamenti. Se positivo, l&apos;azienda ha
          generato utile nel periodo; se negativo, ha registrato una perdita.
        </p>

        <h2>La variazione rispetto all&apos;anno precedente</h2>
        <p>
          Accanto a ciascun KPI è riportata la variazione percentuale rispetto allo stesso periodo
          dell&apos;anno precedente, con freccia direzionale. Un +15% verde sui ricavi indica un
          fatturato superiore del 15% al pari periodo dell&apos;anno scorso; un dato rosso negativo
          indica un calo.
        </p>

        <HelpCallout variant="tip" title="L'indicatore prioritario">
          Per una lettura rapida della redditività operativa, l&apos;<strong>EBITDA</strong> è
          l&apos;indicatore di riferimento. Quando i ricavi crescono ma l&apos;EBITDA cala significa
          che l&apos;azienda sta vendendo di più con marginalità decrescenti: una dinamica che
          merita un approfondimento con il commercialista.
        </HelpCallout>

        <HelpCallout variant="info" title="Stagionalità">
          Una variazione negativa su un singolo mese può dipendere dalla stagionalità tipica del
          settore. Per una valutazione attendibile è preferibile osservare il trend su un orizzonte
          di 3-6 mesi.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/quanto-guadagno">Quanto guadagno davvero?</Link>
          </li>
          <li>
            <Link href="/aiuto/andamento-ricavi">Andamento dei ricavi nel tempo</Link>
          </li>
          <li>
            <Link href="/aiuto/glossario-termini">Glossario dei termini</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "andamento-ricavi",
    title: "Andamento dei ricavi nel tempo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["andamento", "ricavi", "grafico", "trend", "mensile"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Andamento ricavi rappresenta su un grafico l&apos;evoluzione del fatturato
          aziendale. Visualizzando la distribuzione delle vendite nel tempo, fornisce indicazioni
          che il singolo dato aggregato non può dare.
        </p>

        <h2>Lettura del grafico</h2>
        <p>
          Sull&apos;asse orizzontale sono riportati i periodi (mesi o trimestri, in base alla
          configurazione del sistema). Sull&apos;asse verticale gli importi in euro. Ogni elemento
          grafico — barra o punto — rappresenta i ricavi del periodo corrispondente.
        </p>
        <p>
          Quando è presente una linea di tendenza, questa collega i valori per evidenziare la
          direzione del trend: in crescita, in flessione o stabile.
        </p>

        <h2>Confronto con l&apos;anno precedente</h2>
        <p>
          Se sono disponibili i dati dell&apos;esercizio precedente, il grafico li sovrappone a
          quelli dell&apos;anno in corso, distinguendoli con tonalità diverse. Il confronto permette
          di valutare la performance rispetto al pari periodo dell&apos;anno passato.
        </p>

        <h2>Cosa osservare</h2>
        <p>Tre domande aiutano a estrarre informazioni utili dal grafico:</p>
        <ul>
          <li>Si riconosce una tendenza di crescita o di flessione?</li>
          <li>
            Ci sono mesi con valori particolarmente alti o bassi? Spesso riflettono la stagionalità
            tipica del settore.
          </li>
          <li>Quale è il confronto con l&apos;anno precedente, in particolare nei mesi chiave?</li>
        </ul>

        <HelpCallout variant="warning" title="Ricavi contabilizzati, non incassati">
          I valori del grafico riflettono il fatturato emesso nel periodo, non gli incassi
          effettivi. Un mese con ricavi elevati può corrispondere a incassi distribuiti su più mesi
          successivi, in funzione delle condizioni di pagamento concordate con i clienti. Per la
          liquidità reale è necessario consultare la pagina Cassa.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/dashboard-kpi">I numeri in cima: ricavi, EBITDA, utile</Link>
          </li>
          <li>
            <Link href="/aiuto/quanto-guadagno">Quanto guadagno davvero?</Link>
          </li>
          <li>
            <Link href="/aiuto/cassa-attuale">Quanto hai in cassa</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "quanto-guadagno",
    title: "Quanto guadagno davvero?",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["guadagno", "margine", "profitto", "costi", "ricavi"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Il fatturato non coincide con il guadagno effettivo. Questa pagina mostra il percorso che
          porta dai ricavi al risultato finale, con i tre margini intermedi che permettono di capire
          dove si forma e dove si erode la redditività.
        </p>

        <HelpScreenshot
          src="/help/clienti/quanto-guadagno/01-vista-quanto-guadagno.png"
          alt="Pagina Quanto guadagno con i margini progressivi e dettaglio numerico"
          caption="La pagina Quanto guadagno con i margini calcolati a partire dai ricavi"
          width={1588}
          height={828}
        />

        <h2>Margine di contribuzione</h2>
        <p>
          Il primo livello. Si ottiene sottraendo dai ricavi i costi variabili — materie prime,
          provvigioni, trasporti legati alle vendite — cioè quelli che aumentano in proporzione al
          volume venduto. È la quota di ricavo che residua per coprire i costi fissi e, oltre
          questi, generare utile.
        </p>
        <p>
          Un margine di contribuzione basso indica che ogni vendita lascia poco: i prezzi sono
          troppo bassi rispetto ai costi variabili, oppure i costi variabili stessi sono eccessivi.
        </p>

        <h2>EBITDA: il margine operativo</h2>
        <p>
          Sottraendo i costi fissi (affitto, personale, utenze, assicurazioni) dal margine di
          contribuzione si ottiene l&apos;EBITDA, ossia il guadagno operativo della gestione
          ordinaria. Non considera interessi, ammortamenti e imposte, perché queste voci dipendono
          da scelte finanziarie e fiscali e non dall&apos;efficienza dell&apos;attività
          caratteristica.
        </p>

        <h2>Utile netto</h2>
        <p>
          Il risultato finale, ottenuto sottraendo dall&apos;EBITDA gli ammortamenti, gli oneri
          finanziari e le imposte. Un valore positivo indica un esercizio in utile; un valore
          negativo indica una perdita.
        </p>
        <p>
          Una distinzione importante: un&apos;azienda può avere EBITDA positivo e utile netto
          negativo. Significa che l&apos;attività operativa funziona ma il peso del debito
          finanziario o degli ammortamenti compromette il risultato finale.
        </p>

        <HelpScreenshot
          src="/help/clienti/quanto-guadagno/02-margini-grafico.png"
          alt="Decomposizione visiva dei margini con barra orizzontale"
          caption="Vista grafica dei margini progressivi: dai ricavi al risultato finale"
          width={1569}
          height={399}
        />

        <HelpCallout variant="tip" title="L'analisi a cascata">
          La rappresentazione a cascata dei margini permette di individuare con precisione il punto
          in cui la redditività si riduce maggiormente: tra ricavi e margine di contribuzione
          (problema sui costi variabili), tra margine di contribuzione ed EBITDA (problema sui costi
          fissi), o tra EBITDA e utile netto (problema su ammortamenti, oneri finanziari o carico
          fiscale).
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/dove-vanno-soldi">
              Dove vanno i soldi: la composizione dei costi
            </Link>
          </li>
          <li>
            <Link href="/aiuto/dashboard-kpi">I numeri in cima: ricavi, EBITDA, utile</Link>
          </li>
          <li>
            <Link href="/aiuto/punto-pareggio">Il punto di pareggio (break-even)</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "dove-vanno-soldi",
    title: "Dove vanno i soldi: la composizione dei costi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["costi", "composizione", "spese", "dove", "soldi"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina ricostruisce la composizione dei costi aziendali distribuendoli per categoria.
          Permette di capire dove si concentrano le uscite e di individuare le voci con maggior peso
          sul risultato.
        </p>

        <HelpScreenshot
          src="/help/clienti/dove-vanno-soldi/01-grafico-costi.png"
          alt="Grafico complessivo della composizione dei costi"
          caption="La distribuzione dei costi per categoria: vista d'insieme"
          width={764}
          height={403}
        />

        <h2>Costi variabili e costi fissi</h2>
        <p>
          La prima distinzione di un&apos;analisi di costo riguarda la loro natura. I{" "}
          <strong>costi variabili</strong> dipendono dal volume di attività: aumentano con le
          vendite (materie prime, provvigioni, trasporti). I <strong>costi fissi</strong> restano
          sostanzialmente stabili al variare dei volumi: affitto, personale, assicurazioni,
          ammortamenti.
        </p>
        <p>
          Una struttura prevalentemente fissa è meno flessibile in caso di calo del fatturato: i
          costi continuano a maturare anche con minori ricavi. Una struttura prevalentemente
          variabile si adatta meglio alle oscillazioni della domanda, ma può comprimere il margine
          di contribuzione unitario.
        </p>

        <HelpScreenshot
          src="/help/clienti/dove-vanno-soldi/02-costi-fissi.png"
          alt="Dettaglio dei costi fissi raggruppati per categoria"
          caption="Il dettaglio dei costi fissi: le voci che impattano la struttura aziendale"
          width={771}
          height={411}
        />

        <h2>Le categorie principali</h2>
        <p>I costi sono raggruppati nelle macro-categorie tipiche:</p>
        <ul>
          <li>
            <strong>Materie prime e merci</strong>: acquisti destinati alla produzione o alla
            rivendita.
          </li>
          <li>
            <strong>Personale</strong>: stipendi, contributi previdenziali, TFR.
          </li>
          <li>
            <strong>Servizi esterni</strong>: consulenze, manutenzioni, trasporti, lavorazioni di
            terzi.
          </li>
          <li>
            <strong>Affitti e locazioni</strong>: canoni per immobili, attrezzature, leasing
            operativi.
          </li>
          <li>
            <strong>Utenze e spese generali</strong>: energia, gas, telefonia, cancelleria.
          </li>
        </ul>

        <h2>Lettura dei grafici</h2>
        <p>
          Il grafico a torta o ad anello rappresenta il peso percentuale di ciascuna categoria sul
          totale dei costi: una quota del 40% sul personale indica che quaranta centesimi di ogni
          euro speso sono assorbiti dagli stipendi. Il grafico a barre, quando presente, riporta gli
          importi assoluti per ciascuna voce, utile per dimensionare in valore i singoli capitoli di
          spesa.
        </p>

        <HelpCallout variant="tip" title="Confronto temporale">
          Il valore informativo della pagina aumenta confrontando la composizione dei costi tra
          periodi diversi. Una categoria che cresce in modo non proporzionale rispetto ai ricavi è
          un segnale di inefficienza in arrivo, che vale la pena approfondire prima che pesi sui
          margini.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/quanto-guadagno">Quanto guadagno davvero?</Link>
          </li>
          <li>
            <Link href="/aiuto/punto-pareggio">Il punto di pareggio (break-even)</Link>
          </li>
          <li>
            <Link href="/aiuto/glossario-termini">Glossario dei termini</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "punto-pareggio",
    title: "Il punto di pareggio (break-even)",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["pareggio", "break-even", "punto", "equilibrio", "minimo"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Il punto di pareggio (in inglese <em>break-even point</em>) rappresenta il livello di
          ricavi necessario per coprire l&apos;insieme dei costi aziendali. Al di sotto si registra
          una perdita, al di sopra si genera utile. È un parametro di riferimento fondamentale per
          le decisioni di gestione.
        </p>

        <HelpScreenshot
          src="/help/clienti/punto-pareggio/01-vista-pareggio.png"
          alt="Pagina punto di pareggio con valore di break-even in evidenza"
          caption="Il punto di pareggio: il fatturato minimo per non generare perdite"
          width={1091}
          height={253}
        />

        <h2>Come si calcola</h2>
        <p>
          Il calcolo si fonda sulla distinzione tra costi variabili e costi fissi. Ciascuna unità
          venduta produce un margine di contribuzione (ricavo unitario meno costo variabile
          unitario). Il punto di pareggio coincide con il volume di vendite il cui margine di
          contribuzione complessivo equivale ai costi fissi totali. Sopra quella soglia, ogni unità
          aggiuntiva contribuisce direttamente all&apos;utile.
        </p>

        <h2>Lettura del grafico</h2>
        <p>
          Il grafico confronta direttamente due valori: il <strong>fatturato corrente</strong>{" "}
          (barra blu) e il <strong>punto di pareggio</strong> (barra arancione). La lettura è
          immediata: se la barra blu dei ricavi è più alta di quella arancione, l&apos;azienda opera
          in utile; se è più bassa, opera in perdita. Lo spazio tra le due barre rappresenta
          visivamente il margine di sicurezza.
        </p>

        <HelpScreenshot
          src="/help/clienti/punto-pareggio/02-grafico-pareggio.png"
          alt="Confronto a barre tra fatturato corrente e punto di pareggio"
          caption="Confronto diretto: a sinistra il fatturato attuale, a destra la soglia di pareggio"
          width={1569}
          height={362}
        />

        <h2>Le applicazioni pratiche</h2>
        <p>La conoscenza del break-even consente di rispondere a domande di gestione concrete:</p>
        <ul>
          <li>Qual è il fatturato minimo mensile per evitare perdite?</li>
          <li>
            Quale impatto avrebbe la perdita di un cliente significativo sulla tenuta dei costi?
          </li>
          <li>
            Quale incremento di ricavi è necessario per assorbire un aumento dei costi fissi (es.
            assunzione, nuovo affitto)?
          </li>
        </ul>

        <h2>Margine di sicurezza</h2>
        <p>
          La distanza tra il fatturato corrente e il punto di pareggio costituisce il margine di
          sicurezza dell&apos;azienda: misura quanto il fatturato può ridursi prima che
          l&apos;attività entri in perdita. Un margine ampio offre maggior tolleranza agli shock; un
          margine stretto rende l&apos;azienda vulnerabile a oscillazioni anche modeste della
          domanda.
        </p>

        <HelpCallout variant="warning" title="Il break-even non è statico">
          Il punto di pareggio si modifica al variare dei costi fissi e dei margini sui prodotti.
          L&apos;assunzione di personale, un nuovo canone di locazione o una variazione del listino
          prezzi spostano la soglia. Verifiche periodiche sono opportune in particolare a ridosso di
          decisioni che incidono sulla struttura dei costi.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/quanto-guadagno">Quanto guadagno davvero?</Link>
          </li>
          <li>
            <Link href="/aiuto/dove-vanno-soldi">
              Dove vanno i soldi: la composizione dei costi
            </Link>
          </li>
          <li>
            <Link href="/aiuto/salute-finanziaria">Salute finanziaria: il semaforo</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "salute-finanziaria",
    title: "Salute finanziaria: il semaforo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 6,
    keywords: ["salute", "finanziaria", "semaforo", "indicatori", "verde", "rosso"],
    content: () => (
      <>
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          La pagina Salute finanziaria sintetizza una serie di indicatori in un sistema a tre colori
          — verde, giallo, rosso — per restituire una lettura immediata dello stato aziendale.
        </p>

        <HelpScreenshot
          src="/help/clienti/salute-finanziaria/02-salute-finanziaria.png"
          alt="Pagina salute finanziaria con indicatori a semaforo verde giallo rosso"
          caption="Gli indicatori a semaforo: lettura immediata dello stato di salute aziendale"
          width={1632}
          height={469}
        />

        <h2>Cosa misurano gli indicatori</h2>
        <p>Ogni indicatore copre un aspetto specifico della gestione aziendale:</p>
        <ul>
          <li>
            <strong>Margine EBITDA</strong>: la quota di ricavi che si trasforma in margine
            operativo. Un valore basso indica una redditività operativa insufficiente.
          </li>
          <li>
            <strong>Margine netto</strong>: la quota di ricavi che resta dopo tutti i costi, inclusi
            quelli fiscali. Un valore negativo segnala una perdita di esercizio.
          </li>
          <li>
            <strong>Copertura del debito</strong>: il rapporto tra il margine operativo e le rate
            dei finanziamenti in essere. Un valore basso evidenzia difficoltà nel servire il debito.
          </li>
          <li>
            <strong>Liquidità</strong>: il livello di disponibilità per le spese a breve termine. Un
            valore basso indica un rischio di tensione finanziaria sui pagamenti correnti.
          </li>
        </ul>

        <h2>Significato dei colori</h2>
        <p>
          <strong>Verde</strong>: indicatore in norma, nessun intervento richiesto.
        </p>
        <p>
          <strong>Giallo</strong>: il valore si avvicina alla soglia critica. Da monitorare nei mesi
          successivi.
        </p>
        <p>
          <strong>Rosso</strong>: il valore è fuori norma e richiede un&apos;analisi approfondita
          per individuare le cause e definire eventuali interventi correttivi.
        </p>

        <h2>Lettura del quadro complessivo</h2>
        <p>
          L&apos;ordine di priorità di lettura va dai rossi (priorità) ai gialli (monitoraggio) ai
          verdi (conferma). Una maggioranza di indicatori verdi configura una situazione
          complessivamente positiva, anche in presenza di singoli gialli o rossi su aspetti
          specifici.
        </p>

        <HelpCallout variant="tip" title="Contestualizzare il dato">
          Un indicatore in rosso non equivale automaticamente a una situazione critica
          d&apos;azienda. Può riflettere una circostanza temporanea, ad esempio l&apos;impatto di un
          acconto fiscale sulla liquidità del periodo, che si normalizza nei mesi successivi. Il
          confronto con il commercialista serve a separare le situazioni contingenti da quelle
          strutturali.
        </HelpCallout>

        <HelpCallout variant="info" title="Soglie tarate sul settore">
          Le soglie che attivano i tre colori sono impostate dal commercialista tenendo conto delle
          caratteristiche del settore. Un margine EBITDA del 5% può essere fisiologico nella grande
          distribuzione e insufficiente nei servizi professionali: la calibrazione settoriale evita
          confronti fuorvianti con benchmark generici.
        </HelpCallout>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/aiuto/dashboard-kpi">I numeri in cima: ricavi, EBITDA, utile</Link>
          </li>
          <li>
            <Link href="/aiuto/quanto-guadagno">Quanto guadagno davvero?</Link>
          </li>
          <li>
            <Link href="/aiuto/glossario-termini">Glossario dei termini</Link>
          </li>
        </ul>
      </>
    ),
  },
];
