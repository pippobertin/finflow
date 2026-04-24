import Link from "next/link";
import type { HelpSection } from "../types";
import { HelpCallout } from "@/components/help/help-callout";
import { HelpScreenshot } from "@/components/help/help-screenshot";
import { HelpSteps, HelpStep } from "@/components/help/help-steps";

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          Creare un cliente in Finflow significa aprire lo spazio dove poi caricherai i suoi
          bilanci, il budget, i movimenti bancari. L&apos;operazione richiede meno di un minuto.
        </p>

        <h2>Come creare il cliente</h2>

        <HelpSteps>
          <HelpStep number={1} title="Vai alla lista clienti e clicca Nuovo">
            <p>
              Dalla barra laterale seleziona <strong>Clienti</strong>. In alto a destra trovi il
              pulsante <strong>Nuovo</strong> (o <strong>Nuovo cliente</strong> a seconda della
              larghezza dello schermo). Cliccalo per aprire il modulo di creazione.
            </p>
            <HelpScreenshot
              src="/help/firm/creare-cliente/01-pulsante-nuovo-cliente.png"
              alt="Intestazione lista clienti con pulsante Nuovo in alto a destra"
              caption="Il pulsante per creare un nuovo cliente si trova in alto a destra nella lista"
              width={1627}
              height={119}
              hotspots={[{ x: 95, y: 50, label: 1, tooltip: "Pulsante Nuovo cliente" }]}
            />
          </HelpStep>

          <HelpStep number={2} title="Compila il modulo">
            <p>
              Il modulo chiede pochi dati essenziali. Solo il <strong>Nome organizzazione</strong> è
              obbligatorio; tutto il resto lo puoi integrare in seguito dall&apos;anagrafica del
              cliente.
            </p>
            <HelpScreenshot
              src="/help/firm/creare-cliente/02-form-cliente.png"
              alt="Modulo di creazione nuovo cliente con campi nome, partita IVA, email, telefono, granularità"
              caption="I campi del modulo di creazione: Nome (obbligatorio), dati fiscali e granularità CDG"
              width={654}
              height={452}
              hotspots={[
                { x: 50, y: 18, label: 1, tooltip: "Nome organizzazione (obbligatorio)" },
                { x: 50, y: 40, label: 2, tooltip: "Partita IVA" },
                { x: 50, y: 62, label: 3, tooltip: "Email e telefono" },
                { x: 50, y: 84, label: 4, tooltip: "Granularità CDG" },
              ]}
            />
          </HelpStep>

          <HelpStep number={3} title="Conferma e atterra sul cliente">
            <p>
              Al salvataggio, Finflow ti porta direttamente alla pagina di dettaglio del nuovo
              cliente, con la tab bar delle sue aree (Anagrafica, Utenti, CDG, Bilanci, Budget, IVA,
              Movimenti, Pattern, F24, Prestiti, Report). Da qui puoi iniziare subito a caricare il
              primo bilancio.
            </p>
            <HelpScreenshot
              src="/help/firm/creare-cliente/03-cliente-creato.png"
              alt="Pagina di dettaglio del cliente appena creato"
              caption="Dopo il salvataggio atterri sulla pagina del cliente, pronto per le operazioni"
              width={685}
              height={584}
              hotspots={[
                { x: 35, y: 10, label: 1, tooltip: "Nome del cliente in alto" },
                { x: 50, y: 22, label: 2, tooltip: "Tab bar delle aree del cliente" },
              ]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>I campi del modulo in dettaglio</h2>
        <ul>
          <li>
            <strong>Nome organizzazione</strong> (obbligatorio): la ragione sociale o il nome con
            cui identifichi il cliente nei tuoi elenchi e nei report.
          </li>
          <li>
            <strong>Partita IVA</strong>: utile per i report ufficiali e per l&apos;identificazione
            univoca. Non obbligatoria in fase di creazione, puoi aggiungerla dopo.
          </li>
          <li>
            <strong>Email</strong>: l&apos;indirizzo di riferimento dell&apos;azienda (non è la
            stessa cosa dell&apos;email che userai per invitare l&apos;imprenditore al workspace,
            quella la inserirai in un secondo momento).
          </li>
          <li>
            <strong>Telefono</strong>: facoltativo, serve per l&apos;anagrafica interna.
          </li>
          <li>
            <strong>Granularità CDG</strong>: <code>MONTHLY</code> (mensile) o{" "}
            <code>QUARTERLY</code> (trimestrale). Determina come il conto economico riclassificato
            segmenta i periodi. Il default è <code>MONTHLY</code>.
          </li>
        </ul>

        <h2>Cosa fare subito dopo</h2>
        <p>
          Una volta creato il cliente, il flusso consigliato è: caricare il primo bilancio di
          verifica dalla scheda <strong>Bilanci</strong>, mappare i conti dalla pagina{" "}
          <strong>Mapping conti</strong>, poi inserire il budget dalla scheda{" "}
          <strong>Budget</strong>. L&apos;invito all&apos;imprenditore può avvenire in qualsiasi
          momento, anche prima di avere dati in CDG (il cliente vedrà semplicemente una dashboard
          vuota finché non carichi qualcosa).
        </p>

        <HelpCallout variant="warning" title="Granularità: meglio scegliere bene all'inizio">
          La granularità CDG può essere cambiata anche dopo la creazione, ma la modifica impatta la
          visualizzazione di tutti i periodi già caricati (ricalcolo e rienumerazione). Scegli in
          base alla frequenza con cui il cliente chiude la contabilità: se lavora su base mensile,
          usa <code>MONTHLY</code>; se chiude solo a trimestre, <code>QUARTERLY</code> evita di
          mostrare 12 colonne vuote.
        </HelpCallout>

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
        <p className="lead text-lg text-slate-600 dark:text-slate-400">
          L&apos;invito dà all&apos;imprenditore l&apos;accesso alla propria dashboard, dove può
          consultare KPI, andamenti e scadenze della sua azienda. Il flusso è in tre passi e
          richiede meno di un minuto.
        </p>

        <h2>Come inviare l&apos;invito</h2>

        <HelpSteps>
          <HelpStep number={1} title="Apri la scheda Utenti del cliente">
            <p>
              Dal dettaglio del cliente seleziona la scheda <strong>Utenti</strong> nella tab bar in
              alto. Vedi la lista degli utenti già associati (se ne hai creati in passato) e il form
              per aggiungerne uno nuovo.
            </p>
            <HelpScreenshot
              src="/help/firm/invitare-cliente/01-scheda-utenti.png"
              alt="Scheda Utenti del cliente con lista utenti e form di invito"
              caption="La scheda Utenti mostra utenti esistenti e form per aggiungerne di nuovi"
              width={746}
              height={391}
              hotspots={[
                { x: 50, y: 30, label: 1, tooltip: "Form per aggiungere un nuovo utente" },
              ]}
            />
          </HelpStep>

          <HelpStep number={2} title="Compila Email, Nome e Ruolo">
            <p>Il form chiede tre dati:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Email</strong> (obbligatoria): l&apos;indirizzo dove arriverà il link di
                invito.
              </li>
              <li>
                <strong>Nome</strong> (opzionale): il nome e cognome dell&apos;utente, utile per
                riconoscerlo nella lista.
              </li>
              <li>
                <strong>Ruolo</strong>: determina cosa l&apos;utente può vedere. Per
                l&apos;imprenditore cliente scegli <code>CLIENT_OWNER</code> (accesso completo in
                sola lettura alla dashboard). Il default <code>CLIENT_ADMIN_BANK_ONLY</code> è
                pensato per un collaboratore che deve solo inserire movimenti bancari.
              </li>
            </ul>
            <HelpScreenshot
              src="/help/firm/invitare-cliente/02-form-invito.png"
              alt="Form di invito compilato con email, nome e ruolo"
              caption="I campi del form di invito: email, nome opzionale, dropdown ruolo"
              width={736}
              height={250}
              hotspots={[
                { x: 25, y: 50, label: 1, tooltip: "Email (obbligatoria)" },
                { x: 55, y: 50, label: 2, tooltip: "Nome (opzionale)" },
                { x: 85, y: 50, label: 3, tooltip: "Ruolo" },
              ]}
            />
          </HelpStep>

          <HelpStep number={3} title="Invia l'invito">
            <p>
              Clicca il pulsante di creazione. Finflow registra l&apos;utente, gli associa il ruolo
              scelto e invia un&apos;email automatica con il link per impostare la password. Appena
              il salvataggio va a buon fine vedi il messaggio di conferma e il nuovo utente compare
              nella lista.
            </p>
            <HelpScreenshot
              src="/help/firm/invitare-cliente/03-invito-inviato.png"
              alt="Scheda Utenti dopo l'invio con messaggio di successo e nuovo utente in lista"
              caption="Dopo l'invio: messaggio di successo e nuovo utente aggiunto all'elenco"
              width={734}
              height={451}
              hotspots={[
                { x: 50, y: 20, label: 1, tooltip: "Messaggio di conferma" },
                { x: 50, y: 60, label: 2, tooltip: "Nuovo utente nella lista" },
              ]}
            />
          </HelpStep>
        </HelpSteps>

        <h2>I ruoli disponibili</h2>
        <ul>
          <li>
            <strong>
              <code>CLIENT_OWNER</code>
            </strong>
            : l&apos;imprenditore titolare dell&apos;azienda. Vede tutta la dashboard in sola
            lettura (KPI, CE, grafici, scadenze, cassa, documenti). Non può modificare dati,
            bilanci, mapping o budget.
          </li>
          <li>
            <strong>
              <code>CLIENT_ADMIN_BANK_ONLY</code>
            </strong>
            : un collaboratore interno del cliente (es. addetto amministrativo) che deve solo
            caricare estratti conto e categorizzare movimenti. Vede la sezione Movimenti, non il
            resto della dashboard.
          </li>
        </ul>

        <h2>Cosa vede il cliente dopo il login</h2>
        <p>
          L&apos;imprenditore accede a un&apos;interfaccia separata da quella dello studio. La sua
          dashboard include KPI principali (ricavi, EBITDA, utile netto), grafici di andamento
          mensile o trimestrale, indicatori di salute finanziaria e stato delle scadenze (IVA, F24,
          rate prestiti). Tutte le operazioni di scrittura (caricare bilanci, cambiare mapping,
          alterare budget) restano riservate al controller dello studio.
        </p>

        <h2>Reinviare l&apos;invito</h2>
        <p>
          Se il cliente non ha ricevuto l&apos;email o il link è scaduto, dalla stessa scheda Utenti
          puoi reinviare l&apos;invito. Individua l&apos;utente nell&apos;elenco e usa l&apos;azione
          di reinvio: Finflow genera un nuovo link con una nuova scadenza, sostituendo il
          precedente.
        </p>

        <HelpCallout variant="tip" title="Quando invitare">
          Il momento migliore per invitare l&apos;imprenditore è quando hai già caricato almeno un
          bilancio e completato la mappatura dei conti. Al primo accesso troverà subito dati
          significativi e non una pagina vuota, e la sua prima esperienza della piattaforma sarà
          positiva.
        </HelpCallout>

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
        </ul>
      </>
    ),
  },
];
