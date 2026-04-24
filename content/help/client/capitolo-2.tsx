import Link from "next/link";
import type { HelpSection } from "../types";

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
        <p>
          Appena apri la dashboard, in alto trovi quattro riquadri con i numeri più importanti della
          tua azienda. Sono i cosiddetti KPI, cioè gli indicatori chiave di prestazione. Vediamo
          cosa significa ciascuno.
        </p>

        <h2>Ricavi</h2>
        <p>
          È il totale di quello che la tua azienda ha fatturato nel periodo selezionato. In parole
          semplici: quanti soldi sono entrati (o entreranno) grazie alle vendite di prodotti o
          servizi. Attenzione: fatturare non vuol dire aver già incassato. I ricavi indicano il
          valore delle vendite, non i soldi sul conto.
        </p>

        <h2>EBITDA</h2>
        <p>
          Un nome complicato per un concetto semplice. L&apos;EBITDA ti dice quanto guadagna la tua
          azienda dall&apos;attività di tutti i giorni, prima di pagare le tasse, gli interessi sui
          prestiti e gli ammortamenti. È il modo migliore per capire se il tuo business
          &quot;funziona&quot; a livello operativo, senza farsi confondere da costi che non
          dipendono dall&apos;attività quotidiana.
        </p>

        <h2>Utile netto</h2>
        <p>
          È quello che resta dopo aver pagato proprio tutto: costi operativi, interessi,
          ammortamenti e tasse. Se l&apos;utile netto è positivo, la tua azienda ha guadagnato. Se è
          negativo, ha speso più di quanto ha incassato. È il numero che alla fine dei conti ti
          dice: &quot;come è andata davvero?&quot;
        </p>

        <h2>La freccia e la variazione percentuale</h2>
        <p>
          Accanto a ogni numero vedi una freccia (su o giù) e una percentuale. Indicano il confronto
          con lo stesso periodo dell&apos;anno precedente. Se i ricavi mostrano +12% con una freccia
          verde verso l&apos;alto, significa che stai fatturando il 12% in più rispetto allo stesso
          periodo dell&apos;anno scorso. Una freccia rossa verso il basso segnala un calo.
        </p>
        <p>
          Non farti prendere dal panico per una freccia rossa su un singolo mese: può dipendere
          dalla stagionalità del tuo settore. Guarda il trend su più mesi per avere un quadro
          affidabile.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            L&apos;EBITDA è il numero da tenere d&apos;occhio per primo. Se l&apos;EBITDA cresce, il
            motore della tua azienda funziona bene. Se cala, vale la pena capire perché, anche se i
            ricavi sono in aumento.
          </p>
        </div>

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
        <p>
          La sezione Andamento ricavi ti mostra un grafico con l&apos;evoluzione del tuo fatturato
          nel tempo. Invece di guardare un solo numero totale, qui vedi come si distribuiscono le
          vendite mese per mese (o trimestre per trimestre, a seconda di come è configurato il
          sistema).
        </p>

        <h2>Come leggere il grafico</h2>
        <p>
          Sull&apos;asse orizzontale trovi i mesi (o i trimestri). Sull&apos;asse verticale trovi
          gli importi in euro. Ogni barra o punto del grafico rappresenta i ricavi di quel periodo.
          Più la barra è alta, più hai fatturato in quel mese.
        </p>
        <p>
          Se il grafico mostra una linea, questa collega i valori di ogni mese e ti permette di
          vedere la direzione del trend: sale, scende o resta stabile.
        </p>

        <h2>Confronto con l&apos;anno precedente</h2>
        <p>
          Quando sono disponibili i dati dell&apos;anno precedente, il grafico li sovrappone a
          quelli dell&apos;anno in corso. Di solito l&apos;anno corrente è rappresentato con un
          colore più marcato e l&apos;anno precedente con un colore più tenue. Questo confronto ti
          aiuta a capire se stai andando meglio o peggio rispetto a un anno fa.
        </p>

        <h2>Cosa cercare nel grafico</h2>
        <p>Ecco alcune domande utili da farti guardando il grafico:</p>
        <ul>
          <li>C&apos;è una tendenza in crescita o in calo?</li>
          <li>
            Ci sono mesi particolarmente alti o bassi? Possono dipendere dalla stagionalità del tuo
            settore.
          </li>
          <li>Come ti stai comportando rispetto all&apos;anno scorso?</li>
        </ul>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            I ricavi nel grafico sono quelli contabilizzati, non quelli incassati. Potresti avere un
            mese con ricavi altissimi ma pochi incassi effettivi, se i clienti pagano con ritardo.
            Per la liquidità reale, guarda la sezione Cassa.
          </p>
        </div>

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
        <p>
          Fatturare molto non significa per forza guadagnare molto. Questa sezione ti aiuta a capire
          quanto resta davvero della tua azienda, passo dopo passo, partendo dai ricavi e togliendo
          man mano tutti i costi.
        </p>

        <h2>Margine di contribuzione</h2>
        <p>
          Il primo passaggio. Prendi i ricavi e togli i costi variabili, cioè quelli che aumentano
          quando vendi di più (materie prime, provvigioni, trasporti legati alle vendite). Quello
          che resta è il margine di contribuzione: i soldi che servono a coprire i costi fissi e,
          idealmente, a generare un guadagno.
        </p>
        <p>
          Se il margine di contribuzione è basso rispetto ai ricavi, ogni vendita porta a casa poco.
          Potrebbe servire rivedere i prezzi o abbassare i costi variabili.
        </p>

        <h2>EBITDA: il guadagno operativo</h2>
        <p>
          Dopo aver tolto i costi variabili, il passo successivo è togliere i costi fissi (affitto,
          stipendi, utenze, assicurazioni — tutte le spese che paghi comunque, anche se non vendi
          nulla). Quello che resta è l&apos;EBITDA: il guadagno che la tua azienda produce con la
          sua attività di tutti i giorni.
        </p>
        <p>
          L&apos;EBITDA non tiene conto degli interessi sui debiti, delle tasse e degli
          ammortamenti. Perché? Perché queste voci dipendono da decisioni finanziarie e fiscali, non
          da quanto è bravo il tuo business a generare valore.
        </p>

        <h2>Utile netto: quello che resta alla fine</h2>
        <p>
          L&apos;utile netto è il risultato finale. Dall&apos;EBITDA togli gli ammortamenti, gli
          interessi sui prestiti e le tasse. Se il numero è positivo, la tua azienda ha guadagnato.
          Se è negativo, ha chiuso in perdita.
        </p>
        <p>
          Un&apos;azienda può avere un EBITDA positivo ma un utile netto negativo, ad esempio se ha
          molti debiti con interessi alti. In quel caso il business funziona, ma il peso finanziario
          lo mette in difficoltà.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Pensa ai margini come a un imbuto: in cima entrano i ricavi, e ad ogni livello esce una
            parte di costi. Più è largo l&apos;imbuto in fondo, più la tua azienda è in salute. Se
            l&apos;imbuto si stringe troppo, parlane con il tuo commercialista per capire dove
            intervenire.
          </p>
        </div>

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
        <p>
          Sai quanto fatturi, sai quanto guadagni. Ma dove finiscono i soldi? Questa sezione ti
          mostra la composizione dei costi della tua azienda, cioè come si distribuiscono le spese
          tra le diverse categorie.
        </p>

        <h2>Costi variabili e costi fissi</h2>
        <p>
          La prima distinzione è tra costi variabili e costi fissi. I costi variabili cambiano a
          seconda di quanto vendi: se vendi il doppio, usi il doppio di materie prime. I costi fissi
          li paghi comunque, che tu venda molto o poco: l&apos;affitto del capannone, gli stipendi,
          le assicurazioni.
        </p>
        <p>
          Capire questa distinzione è utile perché ti dice quanto è &quot;elastica&quot; la tua
          struttura di costi. Se hai tanti costi fissi, anche un piccolo calo di fatturato può
          metterti in difficoltà. Se i costi sono prevalentemente variabili, la struttura si adatta
          meglio ai periodi di magra.
        </p>

        <h2>Le categorie principali</h2>
        <p>
          Nei grafici e nelle tabelle trovi i costi raggruppati per categoria. Le più comuni sono:
        </p>
        <ul>
          <li>
            <strong>Materie prime e merci</strong> — quello che compri per produrre o rivendere
          </li>
          <li>
            <strong>Personale</strong> — stipendi, contributi, TFR
          </li>
          <li>
            <strong>Servizi esterni</strong> — consulenze, manutenzioni, trasporti
          </li>
          <li>
            <strong>Affitti e locazioni</strong> — canoni per uffici, capannoni, attrezzature
          </li>
          <li>
            <strong>Utenze e spese generali</strong> — luce, gas, telefono, cancelleria
          </li>
        </ul>

        <h2>Come leggere i grafici</h2>
        <p>
          Il grafico a torta (o ad anello) ti mostra la percentuale di ogni categoria sul totale dei
          costi. Se il personale pesa il 40%, significa che 40 centesimi di ogni euro speso vanno in
          stipendi. Il grafico a barre ti mostra gli importi assoluti, utile per capire le
          dimensioni reali di ogni voce.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Confronta la composizione dei costi di quest&apos;anno con quella dell&apos;anno scorso.
            Se una categoria cresce in modo sproporzionato rispetto ai ricavi, è un segnale che vale
            la pena approfondire con il commercialista.
          </p>
        </div>

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
        <p>
          Il punto di pareggio — in inglese &quot;break-even point&quot; — è il livello di ricavi
          che la tua azienda deve raggiungere per coprire tutti i costi fissi. Sotto quel livello
          sei in perdita, sopra inizi a guadagnare. È uno dei numeri più utili per capire quanto
          devi vendere per non rimetterci.
        </p>

        <h2>Come funziona il calcolo</h2>
        <p>
          Il ragionamento è questo: ogni volta che vendi qualcosa, una parte del ricavo copre i
          costi variabili (materie prime, provvigioni) e una parte resta come margine. Quel margine
          serve a pagare i costi fissi (affitto, stipendi, utenze). Il punto di pareggio è il
          momento in cui il margine accumulato copre esattamente tutti i costi fissi. Non un euro in
          più, non un euro in meno.
        </p>

        <h2>Come leggere il grafico</h2>
        <p>
          Nel grafico del punto di pareggio vedi due linee: una rappresenta i costi totali (fissi +
          variabili), l&apos;altra i ricavi. Il punto in cui le due linee si incrociano è il
          break-even. A sinistra dell&apos;incrocio l&apos;azienda è in perdita (i costi superano i
          ricavi), a destra è in utile (i ricavi superano i costi).
        </p>

        <h2>Perché è utile</h2>
        <p>Conoscere il punto di pareggio ti aiuta a rispondere a domande pratiche:</p>
        <ul>
          <li>Quanto devo fatturare al mese per non andare in perdita?</li>
          <li>Se perdo un cliente importante, riesco comunque a coprire i costi?</li>
          <li>
            Se assumo una persona in più (aumento dei costi fissi), quanto fatturato extra mi serve
            per coprire quello stipendio?
          </li>
        </ul>

        <h2>Sopra o sotto il pareggio?</h2>
        <p>
          Se i tuoi ricavi attuali sono ben sopra il punto di pareggio, hai un buon margine di
          sicurezza: anche un calo di fatturato non ti mette subito in difficoltà. Se sei vicino o
          sotto il pareggio, ogni euro di fatturato perso pesa parecchio. In quel caso è il momento
          di parlarne con il commercialista per capire come intervenire.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Il punto di pareggio cambia nel tempo. Se aumentano i costi fissi (ad esempio un nuovo
            affitto) o se cambiano i margini sui prodotti, il livello minimo di fatturato necessario
            si sposta. Controllalo periodicamente.
          </p>
        </div>

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
        <p>
          La sezione Salute finanziaria usa un sistema a semaforo per darti un colpo d&apos;occhio
          immediato su come sta la tua azienda. Ogni indicatore è colorato in verde, giallo o rosso,
          come un semaforo stradale. Non serve essere un esperto per capire il messaggio: verde va
          bene, giallo attenzione, rosso c&apos;è un problema.
        </p>

        <h2>Cosa controllano gli indicatori</h2>
        <p>Gli indicatori valutano diversi aspetti della tua azienda. I principali sono:</p>
        <ul>
          <li>
            <strong>Margine EBITDA</strong> — quanta parte dei ricavi resta come guadagno operativo.
            Se è troppo bassa, l&apos;attività non genera abbastanza valore.
          </li>
          <li>
            <strong>Margine netto</strong> — quanta parte dei ricavi resta dopo tutti i costi, tasse
            comprese. Se è negativo, l&apos;azienda sta perdendo soldi.
          </li>
          <li>
            <strong>Copertura del debito</strong> — la capacità della tua azienda di ripagare i
            debiti con il guadagno operativo. Se è troppo bassa, potresti avere difficoltà a onorare
            i prestiti.
          </li>
          <li>
            <strong>Liquidità</strong> — quanto sei coperto per le spese a breve termine. Se la
            liquidità è troppo bassa, potresti non riuscire a pagare fornitori e stipendi nei tempi.
          </li>
        </ul>

        <h2>Cosa significano i colori</h2>
        <p>
          <strong>Verde:</strong> l&apos;indicatore è nella norma. La tua azienda sta bene su
          quell&apos;aspetto. Nessun intervento necessario.
        </p>
        <p>
          <strong>Giallo:</strong> attenzione. Il valore non è in zona critica ma sta avvicinandosi
          a una soglia di rischio. Vale la pena tenerlo d&apos;occhio e magari parlarne con il
          commercialista.
        </p>
        <p>
          <strong>Rosso:</strong> c&apos;è un problema. Il valore è fuori dalla norma e richiede un
          intervento. Non significa che l&apos;azienda sta fallendo, ma che quell&apos;aspetto
          specifico ha bisogno di attenzione immediata.
        </p>

        <h2>Come usare il semaforo nella pratica</h2>
        <p>
          Quando apri la sezione Salute finanziaria, guarda prima i semafori rossi: sono le
          priorità. Poi quelli gialli: sono le cose da tenere sotto controllo. I verdi puoi
          scorrerli velocemente per confermare che va tutto bene.
        </p>
        <p>
          Se trovi un rosso, non farti prendere dall&apos;ansia. Leggere il dettaglio
          dell&apos;indicatore per capire cosa misura e poi confrontati con il tuo commercialista
          per decidere se e come intervenire.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Il semaforo è un segnale, non una sentenza. Un rosso su un singolo indicatore non
            significa che la tua azienda è nei guai. Significa che quell&apos;aspetto merita
            attenzione. Guarda il quadro d&apos;insieme: se la maggior parte degli indicatori è
            verde, la situazione complessiva è buona.
          </p>
        </div>

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
