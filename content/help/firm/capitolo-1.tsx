import Link from "next/link";
import type { HelpSection } from "../types";

const CH = 1;
const CH_TITLE = "Primi passi";

export const sections: HelpSection[] = [
  {
    slug: "cose-finflow",
    title: "Cos'è Finflow",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["introduzione", "panoramica", "cos'è", "finflow"],
    content: () => (
      <>
        <p>
          Finflow è lo strumento di controllo di gestione integrato nell&apos;app dello studio
          professionale. Permette al controller di gestire più clienti da un unico pannello,
          caricare bilanci di verifica, costruire budget e generare report di analisi economica in
          tempo reale.
        </p>

        <h2>A chi si rivolge</h2>
        <p>
          Finflow è pensato per lo studio commercialista o la società di consulenza che offre
          servizi di controllo di gestione ai propri clienti. Il controller lavora nello studio e
          gestisce i dati di ogni cliente: carica i bilanci di verifica esportati dal gestionale
          contabile, mappa il piano dei conti sulle categorie CDG e monitora l&apos;andamento
          economico con indicatori e grafici.
        </p>
        <p>
          L&apos;imprenditore cliente, a sua volta, può accedere a una dashboard dedicata dove
          consulta i propri indicatori di salute finanziaria, senza poter modificare i dati. Questo
          modello separa il lavoro tecnico del controller dalla consultazione da parte del cliente.
        </p>

        <h2>Architettura multi-tenant</h2>
        <p>
          Finflow adotta un modello multi-tenant: un singolo studio gestisce molti clienti, e ogni
          cliente dispone del proprio spazio dati isolato. I bilanci, i budget, i movimenti bancari
          e le fatture di un cliente non sono mai visibili agli altri clienti.
        </p>
        <p>
          Lo studio vede tutti i clienti nella propria area riservata e può navigare rapidamente
          dall&apos;uno all&apos;altro. Ogni cliente ha la propria dashboard con KPI, conto
          economico riclassificato, varianze di budget e indicatori di salute.
        </p>

        <h2>Cosa produce il sistema</h2>
        <p>
          Una volta caricato il bilancio di verifica e completata la mappatura del piano dei conti,
          Finflow genera automaticamente:
        </p>
        <ul>
          <li>
            Il conto economico riclassificato a margini progressivi (Margine di Contribuzione,
            EBITDA, EBIT, Utile Netto)
          </li>
          <li>Il confronto consuntivo vs budget con varianze in euro e in percentuale</li>
          <li>Il preconsuntivo di fine anno (dati reali + proiezione sui mesi restanti)</li>
          <li>
            Gli indicatori di salute finanziaria (liquidità, sostenibilità del debito, efficienza
            operativa)
          </li>
        </ul>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Per iniziare subito, segui la guida passo-passo nella sezione &quot;Il tuo primo
            accesso&quot;. In pochi minuti avrai il primo cliente configurato e il primo conto
            economico riclassificato.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/clienti-multi-tenant">Chi sono i tuoi clienti</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/primo-accesso">Il tuo primo accesso</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/panoramica-aree">Panoramica delle aree dell&apos;app</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "clienti-multi-tenant",
    title: "Chi sono i tuoi clienti",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["clienti", "multi-tenant", "studio", "organizzazioni"],
    content: () => (
      <>
        <p>
          In Finflow ogni cliente dello studio corrisponde a un&apos;Organizzazione. Lo studio
          gestisce tutte le organizzazioni da un pannello centralizzato, mentre ogni cliente vede
          solo la propria area riservata.
        </p>

        <h2>Il concetto di Organizzazione</h2>
        <p>
          Quando crei un nuovo cliente in Finflow, il sistema genera un&apos;Organizzazione
          dedicata. Ogni Organizzazione è un contenitore isolato: i dati contabili, i bilanci, i
          movimenti bancari e i budget appartengono esclusivamente a quella specifica realtà
          aziendale. Nessun dato viene condiviso tra organizzazioni diverse.
        </p>
        <p>
          All&apos;interno dell&apos;Organizzazione trovi tutte le schede di lavoro: anagrafica,
          conto economico riclassificato (CDG), bilanci caricati, budget, IVA, movimenti bancari,
          scadenze F24, prestiti e la gestione degli utenti che possono accedere.
        </p>

        <h2>Il punto di vista dello studio</h2>
        <p>
          Come controller, accedi alla lista di tutti i clienti dalla voce &quot;Clienti&quot; nella
          barra laterale. Da qui puoi cercare, filtrare e accedere al dettaglio di ogni cliente con
          un clic. La dashboard dello studio mostra una vista aggregata: quanti clienti sono attivi,
          quanti bilanci sono aggiornati, eventuali anomalie da verificare.
        </p>

        <h2>Il punto di vista del cliente</h2>
        <p>
          L&apos;imprenditore cliente, una volta invitato, accede a un&apos;interfaccia separata
          dove vede solo i dati della propria azienda. La sua dashboard mostra i KPI principali
          (ricavi, EBITDA, utile netto), i grafici di andamento e gli indicatori di salute. Non può
          modificare dati, caricare bilanci o alterare la mappatura dei conti: queste operazioni
          restano di competenza del controller.
        </p>

        <h2>Gruppi di clienti</h2>
        <p>
          Se gestisci aziende dello stesso gruppo societario (ad esempio una holding con più
          controllate), puoi raggrupparle in un ClientGroup. I clienti appartenenti allo stesso
          gruppo possono condividere template di mappatura del piano dei conti, velocizzando la
          configurazione iniziale delle società collegate.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Assegna a ogni cliente un nome chiaro e riconoscibile (ragione sociale completa). Ti
            aiuterà nella ricerca e nel filtraggio quando il numero di clienti cresce.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/invitare-cliente">Invitare l&apos;imprenditore cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/gruppo-clienti">Gestire più clienti dello stesso gruppo</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "primo-accesso",
    title: "Il tuo primo accesso",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["login", "primo", "accesso", "onboarding", "wizard"],
    content: () => (
      <>
        <p>
          Al primo accesso, Finflow ti guida attraverso una procedura di configurazione iniziale. In
          pochi passaggi imposti lo studio, crei il primo cliente e carichi il primo bilancio di
          verifica.
        </p>

        <h2>Passo 1 — Configura lo studio</h2>
        <p>
          Inserisci il nome dello studio, carica il logo e scegli i colori del brand (colore
          primario e colore di accento). Queste impostazioni vengono applicate alla dashboard che
          vedranno i tuoi clienti: il logo dello studio compare nell&apos;intestazione, i colori
          personalizzano grafici e pulsanti. Puoi modificare tutto anche in seguito dalla sezione
          Branding.
        </p>

        <h2>Passo 2 — Crea il primo cliente</h2>
        <p>
          Inserisci la ragione sociale del cliente. In questa fase puoi anche compilare i dati
          facoltativi: partita IVA, indirizzo, email di riferimento e la granularità del controllo
          di gestione (mensile o trimestrale). La granularità determina con quale frequenza il
          sistema segmenta i dati nel conto economico riclassificato.
        </p>

        <h2>Passo 3 — Carica il bilancio di verifica</h2>
        <p>
          Esporta il bilancio di verifica dal gestionale contabile (ad esempio ProOffice) in formato
          XLS o XLSX. Caricalo nella scheda Bilanci del cliente appena creato. Finflow legge
          automaticamente le colonne del file: codice conto, descrizione, dare, avere.
        </p>

        <h2>Passo 4 — Mappa il piano dei conti</h2>
        <p>
          Dopo il caricamento, il sistema chiede di associare ogni conto del bilancio di verifica a
          una delle 17 categorie CDG (Ricavi, Costi Variabili, Costi Fissi, ecc.). Il wizard di
          mapping propone associazioni automatiche basate sul nome del conto. Tu confermi o
          correggi. Completata la mappatura, il conto economico riclassificato si genera in
          automatico.
        </p>

        <h2>Passo 5 — Invita il cliente</h2>
        <p>
          Se vuoi che l&apos;imprenditore possa consultare i propri dati, vai nella scheda Utenti
          del cliente e crea un utente con ruolo CLIENT_OWNER. Il sistema invia un&apos;email con il
          link per impostare la password. Da quel momento il cliente accede alla propria dashboard.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            La mappatura del piano dei conti è il passaggio chiave per la qualità dei report. Dedica
            tempo a verificare le associazioni proposte dal wizard, soprattutto per i conti che non
            hanno un nome standard.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/anagrafica-studio">Anagrafica studio e branding</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "panoramica-aree",
    title: "Panoramica delle aree dell'app",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["aree", "navigazione", "sezioni", "menu"],
    content: () => (
      <>
        <p>
          Finflow si organizza in aree accessibili dalla barra laterale. Ogni area ha una funzione
          specifica. Ecco una mappa rapida per orientarti nell&apos;applicazione.
        </p>

        <h2>Dashboard</h2>
        <p>
          La pagina iniziale dello studio. Mostra una vista d&apos;insieme su tutti i clienti:
          quanti sono attivi, lo stato di aggiornamento dei bilanci, eventuali segnalazioni. Da qui
          puoi accedere rapidamente al dettaglio di qualsiasi cliente.
        </p>

        <h2>Clienti</h2>
        <p>
          L&apos;elenco di tutti i clienti (organizzazioni) gestiti dallo studio. Cliccando su un
          cliente si apre la sua area di lavoro, organizzata in schede (tab):
        </p>
        <ul>
          <li>
            <strong>Anagrafica</strong> — dati identificativi, partita IVA, indirizzo, impostazioni
            CDG
          </li>
          <li>
            <strong>CDG</strong> — conto economico riclassificato con margini progressivi
          </li>
          <li>
            <strong>Bilanci</strong> — elenco dei bilanci di verifica caricati, upload di nuovi
            bilanci
          </li>
          <li>
            <strong>Budget</strong> — budget annuale per categoria CDG, inserimento manuale o da
            Excel
          </li>
          <li>
            <strong>IVA</strong> — ricalcolo IVA del periodo, calendario scadenze
          </li>
          <li>
            <strong>Movimenti</strong> — movimenti bancari importati, con categorizzazione
            automatica
          </li>
          <li>
            <strong>Pattern</strong> — regole di categorizzazione ricorrente sui movimenti
          </li>
          <li>
            <strong>F24</strong> — scadenze fiscali F24 con importi e date di versamento
          </li>
          <li>
            <strong>Prestiti</strong> — finanziamenti attivi con piano rate e scadenziario
          </li>
          <li>
            <strong>Utenti</strong> — gestione degli utenti del cliente (inviti, ruoli, permessi)
          </li>
          <li>
            <strong>Report</strong> — generazione e download di report PDF personalizzati
          </li>
        </ul>

        <h2>Branding</h2>
        <p>
          Configurazione dell&apos;identità visiva dello studio: nome, logo, colore primario e
          colore di accento. Queste impostazioni si riflettono sulla dashboard vista dai clienti e
          nei report PDF generati dal sistema.
        </p>

        <h2>Template</h2>
        <p>
          Gestione dei template riutilizzabili. Include i template di mappatura del piano dei conti
          (per applicare la stessa mappatura a clienti con piani dei conti simili) e i template per
          la generazione di report PDF personalizzati.
        </p>

        <h2>Aiuto</h2>
        <p>
          Il centro assistenza in cui ti trovi adesso. Contiene guide dettagliate su ogni funzione
          dell&apos;applicazione, organizzate in capitoli tematici. Puoi cercare per parola chiave o
          navigare l&apos;indice nella barra laterale.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Le schede del cliente si comportano come tab: il passaggio da una all&apos;altra è
            istantaneo e non richiede il ricaricamento della pagina. Usa la navigazione a tab per
            passare velocemente tra CDG, Budget e Bilanci durante l&apos;analisi.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/cose-finflow">Cos&apos;è Finflow</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/anagrafica-studio">Anagrafica studio e branding</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
        </ul>
      </>
    ),
  },
];
