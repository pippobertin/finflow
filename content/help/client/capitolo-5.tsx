import Link from "next/link";
import type { HelpSection } from "../types";

const CH = 5;
const CH_TITLE = "Glossario";

export const sections: HelpSection[] = [
  {
    slug: "glossario-termini",
    title: "Glossario dei termini",
    chapter: CH,
    chapterTitle: CH_TITLE,
    section: 1,
    keywords: ["glossario", "termini", "definizioni", "significato", "vocabolario"],
    content: () => (
      <>
        <p>
          Qui trovi tutti i termini contabili e finanziari che incontri nella dashboard, spiegati in
          modo semplice e diretto. Se trovi una parola che non conosci mentre navighi Finflow, torna
          qui per cercarla.
        </p>

        <h2>Ricavi</h2>
        <p>
          Il totale delle vendite della tua azienda in un dato periodo. Se hai venduto prodotti o
          servizi per 100.000 euro in un trimestre, quelli sono i tuoi ricavi. Non significa che hai
          già incassato tutto: i ricavi indicano il valore delle vendite, non i soldi sul conto.
        </p>

        <h2>Costi variabili</h2>
        <p>
          Sono i costi che cambiano a seconda di quanto vendi. Se vendi di più, questi costi
          crescono; se vendi di meno, calano. Esempi tipici: materie prime, merci da rivendere,
          provvigioni agli agenti, costi di trasporto legati alle vendite.
        </p>

        <h2>Costi fissi</h2>
        <p>
          Sono i costi che paghi comunque, a prescindere da quanto vendi. Anche se in un mese non
          fatturi nulla, questi costi restano. Esempi: affitto del locale, stipendi dei dipendenti,
          canoni di leasing, assicurazioni, bollette (in buona parte).
        </p>

        <h2>Margine di contribuzione</h2>
        <p>
          È quello che resta dei ricavi dopo aver tolto i costi variabili. In pratica: quanto ti
          rimane di ogni euro di vendita per pagare i costi fissi e, sperabilmente, generare un
          guadagno. Se vendi a 100 e i costi variabili sono 60, il tuo margine di contribuzione è
          40.
        </p>

        <h2>EBITDA</h2>
        <p>
          Sta per &quot;Earnings Before Interest, Taxes, Depreciation and Amortization&quot;. In
          italiano: il guadagno operativo prima di interessi, tasse e ammortamenti. È il margine di
          contribuzione meno i costi fissi. Ti dice se l&apos;attività quotidiana della tua azienda
          genera valore, senza farti confondere da voci che dipendono da scelte finanziarie o
          fiscali.
        </p>

        <h2>EBIT</h2>
        <p>
          Simile all&apos;EBITDA, ma include anche gli ammortamenti. Sta per &quot;Earnings Before
          Interest and Taxes&quot;: il guadagno prima di interessi e tasse. Gli ammortamenti sono il
          costo figurativo dell&apos;usura dei macchinari, degli impianti e delle attrezzature nel
          tempo. L&apos;EBIT ti dà un quadro più completo dell&apos;EBITDA perché tiene conto anche
          di questo &quot;consumo&quot; dei beni aziendali.
        </p>

        <h2>Utile netto</h2>
        <p>
          È il risultato finale: quanto resta dopo aver pagato tutto — costi variabili, costi fissi,
          ammortamenti, interessi sui debiti e tasse. Se il numero è positivo, l&apos;azienda ha
          guadagnato. Se è negativo, ha chiuso in perdita.
        </p>

        <h2>Punto di pareggio (break-even)</h2>
        <p>
          Il livello minimo di ricavi che devi raggiungere per coprire tutti i costi fissi. Sotto il
          punto di pareggio sei in perdita, sopra inizi a guadagnare. Si calcola dividendo i costi
          fissi per la percentuale di margine di contribuzione sui ricavi.
        </p>

        <h2>Cash flow (flusso di cassa)</h2>
        <p>
          Il movimento di denaro in entrata e in uscita dall&apos;azienda in un dato periodo. È
          diverso dall&apos;utile: puoi chiudere l&apos;anno in utile ma avere avuto mesi con la
          cassa vuota, o viceversa. Il cash flow misura i soldi reali che si muovono, non i valori
          contabili.
        </p>

        <h2>IVA (Imposta sul Valore Aggiunto)</h2>
        <p>
          Una tassa che si applica a quasi tutte le vendite e gli acquisti. Quando vendi, incassi
          l&apos;IVA dal cliente. Quando compri, paghi l&apos;IVA al fornitore. La differenza tra
          IVA incassata e IVA pagata va versata allo Stato. In Italia le aliquote più comuni sono il
          22%, il 10% e il 4%.
        </p>

        <h2>F24</h2>
        <p>
          È il modulo che si usa per pagare le tasse allo Stato italiano: IVA, ritenute
          d&apos;acconto, contributi INPS, IRAP e altre imposte. Ha scadenze fisse durante
          l&apos;anno (di solito il 16 del mese). In Finflow vedi le scadenze F24 nella sezione
          dedicata.
        </p>

        <h2>Fattura attiva</h2>
        <p>
          Una fattura che la tua azienda emette verso un cliente. È &quot;attiva&quot; perché genera
          un credito: il cliente ti deve dei soldi. Quando il cliente paga, la fattura si chiude.
        </p>

        <h2>Fattura passiva</h2>
        <p>
          Una fattura che un fornitore emette verso la tua azienda. È &quot;passiva&quot; perché
          genera un debito: sei tu a dover pagare. Quando paghi il fornitore, la fattura si chiude.
        </p>

        <h2>Bilancio di verifica</h2>
        <p>
          Un documento contabile che riassume tutti i conti dell&apos;azienda con i relativi saldi.
          È la base da cui il commercialista parte per costruire il conto economico e lo stato
          patrimoniale. Viene esportato dal software contabile e caricato in Finflow.
        </p>

        <h2>Piano dei conti</h2>
        <p>
          L&apos;elenco organizzato di tutti i conti contabili usati dalla tua azienda: cassa,
          banca, clienti, fornitori, ricavi, costi di vario tipo. Ogni azienda ha il suo piano dei
          conti, più o meno dettagliato. In Finflow il piano dei conti viene mappato su categorie
          standard per generare i report.
        </p>

        <h2>Budget</h2>
        <p>
          Il piano finanziario per l&apos;anno. Contiene le previsioni di ricavi e costi, mese per
          mese o trimestre per trimestre. Serve come riferimento: confrontando i dati reali con il
          budget si capisce se l&apos;azienda sta andando come previsto o se ci sono scostamenti da
          gestire.
        </p>

        <h2>Preconsuntivo</h2>
        <p>
          Una stima del risultato di fine anno che combina dati reali (i mesi già chiusi) e
          proiezioni (i mesi che restano). Ad esempio, se siamo a settembre, il preconsuntivo prende
          i dati reali da gennaio ad agosto e proietta settembre-dicembre sulla base
          dell&apos;andamento attuale o del budget.
        </p>

        <h2>Varianze (scostamenti)</h2>
        <p>
          La differenza tra il dato reale e il dato previsto dal budget. Se avevi previsto ricavi
          per 50.000 euro e ne hai fatti 55.000, la varianza è +5.000 euro (positiva, buon segno).
          Se hai speso 30.000 invece dei 25.000 previsti, la varianza è -5.000 euro (negativa, hai
          speso più del previsto). Le varianze ti dicono dove le cose stanno andando diversamente
          dai piani.
        </p>

        <div className="not-prose rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-4 dark:border-indigo-600 dark:bg-indigo-950/30">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Suggerimento</p>
          <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-400">
            Non devi ricordare tutto a memoria. Quando nella dashboard trovi un termine che non ti è
            chiaro, torna qui e cercalo. Con il tempo questi concetti diventeranno familiari.
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
            <Link href="/aiuto/punto-pareggio">Il punto di pareggio (break-even)</Link>
          </li>
          <li>
            <Link href="/aiuto/cose-finflow">Cos&apos;è Finflow</Link>
          </li>
        </ul>
      </>
    ),
  },
];
