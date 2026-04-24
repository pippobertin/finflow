import Link from "next/link";
import type { HelpSection } from "../types";

const CH = 2;
const CH_TITLE = "Gestione studio e clienti";

export const sections: HelpSection[] = [
  {
    slug: "anagrafica-studio",
    title: "Anagrafica studio e branding",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["anagrafica", "studio", "branding", "logo", "impostazioni"],
    content: () => (
      <>
        <p>
          La sezione Branding ti consente di personalizzare l&apos;aspetto dello studio
          all&apos;interno di Finflow. Le impostazioni qui definite si riflettono nella dashboard
          che vedono i tuoi clienti e nei report PDF generati dal sistema.
        </p>

        <h2>Accedere alle impostazioni</h2>
        <p>
          Dalla barra laterale, clicca su &quot;Branding&quot;. Si apre la pagina di configurazione
          con quattro campi principali: nome dello studio, logo, colore primario e colore di
          accento.
        </p>

        <h2>Nome dello studio</h2>
        <p>
          Inserisci la denominazione con cui vuoi che lo studio appaia ai clienti. Può essere la
          ragione sociale completa o un nome abbreviato. Questo testo compare nell&apos;intestazione
          della dashboard cliente e nei report PDF.
        </p>

        <h2>Logo</h2>
        <p>
          Carica il logo dello studio in formato PNG, JPG o SVG. Il sistema lo ridimensiona
          automaticamente per adattarsi alle diverse aree dell&apos;interfaccia. Usa
          un&apos;immagine con sfondo trasparente per il miglior risultato sia in modalità chiara
          che scura.
        </p>

        <h2>Colori del brand</h2>
        <p>
          Il <strong>colore primario</strong> viene utilizzato per pulsanti, intestazioni e elementi
          di navigazione nella dashboard del cliente. Il <strong>colore di accento</strong> serve
          per evidenziazioni, bordi attivi e dettagli grafici secondari. Entrambi si impostano
          tramite selettore colore o inserendo il codice esadecimale (ad esempio #4F46E5).
        </p>
        <p>
          La modifica dei colori è immediata: salva e ricarica la dashboard cliente per verificare
          l&apos;effetto. I colori influenzano anche i grafici e le barre di progresso visibili al
          cliente.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Scegli colori che abbiano un buon contrasto con lo sfondo bianco e con lo sfondo scuro
            (dark mode). Evita gialli e colori molto chiari come colore primario, perché risultano
            poco leggibili sui pulsanti.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
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
    slug: "creare-cliente",
    title: "Creare un nuovo cliente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 2,
    keywords: ["creare", "nuovo", "cliente", "aggiungere", "organizzazione"],
    content: () => (
      <>
        <p>
          Per iniziare a lavorare con un nuovo cliente, devi creare la sua Organizzazione in
          Finflow. Il processo richiede meno di un minuto e ti prepara lo spazio per caricare
          bilanci, budget e movimenti.
        </p>

        <h2>Come creare il cliente</h2>
        <p>
          Dalla barra laterale vai su &quot;Clienti&quot;, poi clicca il pulsante &quot;Nuovo&quot;
          in alto a destra. Si apre il modulo di creazione con i seguenti campi:
        </p>
        <ul>
          <li>
            <strong>Nome organizzazione</strong> (obbligatorio) — la ragione sociale o il nome con
            cui identifichi il cliente
          </li>
          <li>
            <strong>Partita IVA</strong> (facoltativo) — utile per i report e per
            l&apos;identificazione univoca
          </li>
          <li>
            <strong>Indirizzo</strong> (facoltativo) — sede legale del cliente
          </li>
          <li>
            <strong>Email</strong> (facoltativo) — email di riferimento dell&apos;azienda
          </li>
          <li>
            <strong>Granularità CDG</strong> (facoltativo) — scegli tra &quot;mensile&quot; e
            &quot;trimestrale&quot;; determina come il sistema segmenta i periodi nel conto
            economico riclassificato
          </li>
        </ul>

        <h2>Dopo la creazione</h2>
        <p>
          Una volta creato il cliente, il sistema ti porta alla sua pagina di dettaglio. Da qui
          puoi:
        </p>
        <ul>
          <li>Caricare il primo bilancio di verifica (scheda Bilanci)</li>
          <li>Mappare il piano dei conti sulle categorie CDG</li>
          <li>Inserire o importare il budget annuale (scheda Budget)</li>
          <li>Invitare l&apos;imprenditore ad accedere alla dashboard (scheda Utenti)</li>
        </ul>
        <p>
          Non c&apos;è un ordine obbligatorio, ma il flusso consigliato è: prima il bilancio, poi la
          mappatura, poi il budget. L&apos;invito al cliente può avvenire in qualsiasi momento.
        </p>

        <h2>Granularità mensile o trimestrale</h2>
        <p>
          La granularità determina la frequenza con cui il conto economico riclassificato viene
          segmentato. Con granularità &quot;mensile&quot;, ogni mese è un periodo distinto. Con
          &quot;trimestrale&quot;, i dati vengono aggregati per trimestre (Q1, Q2, Q3, Q4). La
          scelta dipende dalla frequenza con cui il cliente aggiorna i dati contabili e dalla
          complessità dell&apos;azienda.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            La granularità del CDG può essere cambiata anche dopo la creazione, ma il cambio
            influisce sulla visualizzazione di tutti i periodi già caricati. Valuta con attenzione
            prima di modificarla a posteriori.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/caricare-bilancio">Caricare il bilancio di verifica</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/mapping-piano-conti">Mappare il piano dei conti</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/invitare-cliente">Invitare l&apos;imprenditore cliente</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "invitare-cliente",
    title: "Invitare l'imprenditore cliente",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 3,
    keywords: ["invitare", "imprenditore", "email", "invito", "accesso"],
    content: () => (
      <>
        <p>
          Una volta configurato il cliente e caricati i primi dati, puoi invitare
          l&apos;imprenditore ad accedere alla propria dashboard. L&apos;invito avviene tramite
          email e richiede meno di un minuto.
        </p>

        <h2>Come inviare l&apos;invito</h2>
        <p>
          Apri la pagina di dettaglio del cliente e vai alla scheda &quot;Utenti&quot;. Clicca
          &quot;Nuovo utente&quot; e compila i campi richiesti:
        </p>
        <ul>
          <li>
            <strong>Email</strong> — l&apos;indirizzo email dell&apos;imprenditore
          </li>
          <li>
            <strong>Ruolo</strong> — seleziona &quot;CLIENT_OWNER&quot; per dare accesso completo in
            lettura alla dashboard
          </li>
        </ul>
        <p>
          Dopo il salvataggio, il sistema invia un&apos;email automatica all&apos;indirizzo
          specificato. L&apos;email contiene un link per impostare la password e accedere alla
          piattaforma.
        </p>

        <h2>Cosa vede il cliente dopo il login</h2>
        <p>
          L&apos;imprenditore accede a un&apos;interfaccia dedicata, separata da quella dello
          studio. La sua dashboard mostra:
        </p>
        <ul>
          <li>I KPI principali: ricavi, EBITDA, utile netto</li>
          <li>I grafici di andamento mensile o trimestrale</li>
          <li>Gli indicatori di salute finanziaria</li>
          <li>Lo stato delle scadenze (IVA, F24, rate prestiti)</li>
        </ul>
        <p>
          Il cliente non può modificare i dati, caricare bilanci, cambiare la mappatura dei conti o
          alterare il budget. Tutte le operazioni di scrittura restano riservate al controller dello
          studio.
        </p>

        <h2>Reinviare l&apos;invito</h2>
        <p>
          Se il cliente non ha ricevuto l&apos;email o il link è scaduto, puoi reinviare
          l&apos;invito dalla stessa scheda Utenti. Individua l&apos;utente nell&apos;elenco e usa
          l&apos;azione di reinvio. Il sistema genera un nuovo link con una nuova scadenza.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Invita il cliente solo quando hai già caricato almeno un bilancio e completato la
            mappatura. In questo modo, al primo accesso l&apos;imprenditore troverà subito dati
            significativi nella dashboard, non una pagina vuota.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/utenti-permessi">Utenti e permessi</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/anagrafica-studio">Anagrafica studio e branding</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "utenti-permessi",
    title: "Utenti e permessi",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 4,
    keywords: ["utenti", "permessi", "ruoli", "accesso", "collaboratori"],
    content: () => (
      <>
        <p>
          Finflow prevede un sistema di ruoli per controllare cosa ogni utente può vedere
          all&apos;interno della dashboard del cliente. Il controller dello studio decide chi
          invitare e con quale livello di accesso.
        </p>

        <h2>Ruoli disponibili per il cliente</h2>
        <p>
          Quando crei un utente nella scheda Utenti di un cliente, devi assegnargli uno di questi
          due ruoli:
        </p>
        <ul>
          <li>
            <strong>CLIENT_OWNER</strong> — accesso completo in lettura a tutta la dashboard del
            cliente. Vede KPI, conto economico riclassificato, budget, varianze, movimenti, IVA,
            F24, prestiti e indicatori di salute. Non può modificare i dati.
          </li>
          <li>
            <strong>CLIENT_ADMIN_BANK_ONLY</strong> — accesso limitato ai soli movimenti bancari e
            alle fatture. Non vede il conto economico riclassificato, il budget, le varianze e gli
            indicatori aggregati. Questo ruolo è adatto a figure operative (ad esempio il
            responsabile amministrativo) che devono consultare i movimenti senza accedere
            all&apos;analisi gestionale completa.
          </li>
        </ul>

        <h2>Come assegnare i ruoli</h2>
        <p>
          Il ruolo viene assegnato al momento della creazione dell&apos;utente. Vai nella scheda
          Utenti del cliente, clicca &quot;Nuovo utente&quot;, inserisci l&apos;email e seleziona il
          ruolo dal menu a tendina. Il ruolo determina automaticamente quali sezioni della dashboard
          saranno visibili dopo il login.
        </p>

        <h2>Modificare o revocare l&apos;accesso</h2>
        <p>
          Puoi modificare il ruolo di un utente esistente o eliminarlo dall&apos;elenco per
          revocargli l&apos;accesso. La revoca è immediata: al prossimo tentativo di login,
          l&apos;utente non potrà più accedere alla dashboard del cliente.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Attenzione</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            Non condividere le credenziali dello studio con i clienti. Ogni cliente deve avere il
            proprio utente con un ruolo appropriato. Gli utenti dello studio e quelli dei clienti
            operano su interfacce separate.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/invitare-cliente">Invitare l&apos;imprenditore cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "gruppo-clienti",
    title: "Gestire più clienti dello stesso gruppo",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 5,
    keywords: ["gruppo", "clienti", "multi", "società", "holding"],
    content: () => (
      <>
        <p>
          Quando lo studio gestisce più società appartenenti allo stesso gruppo imprenditoriale, la
          funzione ClientGroup permette di raggrupparle e di condividere impostazioni comuni tra le
          aziende collegate.
        </p>

        <h2>Cos&apos;è un ClientGroup</h2>
        <p>
          Un ClientGroup è un contenitore logico che riunisce più clienti (organizzazioni) sotto un
          unico ombrello. Un caso tipico è la holding con più società operative: la capogruppo e le
          controllate vengono inserite nello stesso ClientGroup. Questo non altera l&apos;isolamento
          dei dati: ogni società mantiene il proprio bilancio, il proprio budget e i propri
          movimenti. Il raggruppamento serve a facilitare la gestione operativa.
        </p>

        <h2>Vantaggi del raggruppamento</h2>
        <p>I clienti appartenenti allo stesso gruppo possono condividere:</p>
        <ul>
          <li>
            <strong>Template di mappatura</strong> — se le società del gruppo usano piani dei conti
            simili (cosa frequente per aziende della stessa filiera), puoi creare la mappatura una
            sola volta e applicarla come template alle altre società del gruppo
          </li>
          <li>
            <strong>Impostazioni CDG</strong> — la granularità (mensile o trimestrale) e altre
            preferenze possono essere replicate tra le società del gruppo
          </li>
        </ul>

        <h2>Come creare un gruppo</h2>
        <p>
          Dalla lista Clienti, seleziona un cliente e accedi alla sua anagrafica. Nel campo
          &quot;Gruppo&quot; puoi creare un nuovo gruppo oppure assegnare il cliente a un gruppo
          esistente. Ripeti l&apos;operazione per ogni società che vuoi includere nel gruppo.
          L&apos;appartenenza a un gruppo è visibile nell&apos;elenco clienti tramite un badge
          colorato.
        </p>

        <h2>Gestione dei gruppi nel tempo</h2>
        <p>
          Puoi aggiungere o rimuovere clienti da un gruppo in qualsiasi momento. La rimozione non
          cancella i dati del cliente: semplicemente non sarà più associato a quel gruppo. Puoi
          anche rinominare un gruppo o eliminarlo quando non serve più (a condizione che non
          contenga clienti).
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Anche se gestisci una sola società di un gruppo, crea comunque il ClientGroup se prevedi
            di aggiungere altre società in futuro. Potrai così applicare subito i template di
            mappatura alle nuove aziende.
          </p>
        </div>

        <h3>Link correlati</h3>
        <ul>
          <li>
            <Link href="/firm/aiuto/clienti-multi-tenant">Chi sono i tuoi clienti</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/creare-cliente">Creare un nuovo cliente</Link>
          </li>
          <li>
            <Link href="/firm/aiuto/wizard-mapping">Il wizard di mapping automatico</Link>
          </li>
        </ul>
      </>
    ),
  },
];
