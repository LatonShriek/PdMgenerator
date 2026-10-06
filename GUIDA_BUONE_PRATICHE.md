# Guida di buone pratiche per costruire un'applicazione web

*Documento vivo: nasce dal lavoro di riordino di PdM CDCD e si aggiorna a ogni passo. Ogni regola dice **cosa fare**, **perché**, **come si è visto nel progetto** e **come si controlla**. Scritta in italiano semplice: non serve essere programmatori per capire il "perché".*

*Aggiornata al passo 5 del refactoring.*

---

## Come leggere questa guida

Una web app è come una cucina professionale. Le buone pratiche servono a tre cose: **non perdere i dati**, **poter cambiare una cosa senza rompere le altre**, **accorgersi subito quando qualcosa non va**. Ogni capitolo risponde a una di queste tre.

---

## Parte A — Non perdere i dati

### A1. Ogni dato importante deve avere una copia fuori dal posto in cui vive
- **Cosa fare:** un pulsante "Salva copia di sicurezza" e uno "Ripristina", che producono e leggono un file.
- **Perché:** il browser può svuotare la propria memoria (cambio computer, pulizia dei dati, profilo diverso). Un dato che esiste in un solo posto prima o poi si perde.
- **Nel progetto:** passo 7. Il ripristino **aggiunge e non cancella mai**: se lo premi due volte per sbaglio non succede nulla di male (si dice "idempotente").
- **Come si controlla:** prova di andata e ritorno automatica: salva, svuota tutto, ripristina, confronta. Se i dati tornano uguali, funziona.

### A2. Un file che arriva da fuori non è mai fidato
- **Cosa fare:** prima di usarlo, controllare che sia del tipo giusto, della versione giusta e di dimensioni ragionevoli; usare solo le voci che l'app conosce ("lista delle voci ammesse").
- **Perché:** un file sbagliato o manomesso non deve poter cancellare o riempire la memoria dell'app.
- **Nel progetto:** il ripristino rifiuta un file sbagliato con un messaggio chiaro e ignora le voci sconosciute. C'è un test per questo.

### A3. Se un salvataggio può fallire, l'app deve dirlo
- **Cosa fare:** mai "ingoiare" gli errori in silenzio. Se una scrittura online viene rifiutata, mostrare un avviso comprensibile.
- **Perché:** il messaggio "Connesso" dice solo che l'accesso è riuscito, non che i dati vengono salvati. Nel progetto per mesi tre esercizi non hanno salvato online perché mancava una regola, senza che nessuno se ne accorgesse.
- **Come si controlla:** guardare davvero nel database se i dati ci sono, non fidarsi della scritta verde. *(Miglioramento ancora da fare nell'app.)*

### A4. La privacy si decide prima di scrivere il codice
- **Cosa fare:** chiedersi "quali dati personali potrebbero finire qui dentro?" e avvisare l'utente nel punto in cui li scrive.
- **Nel progetto:** il nome del gruppo viene usato così com'è come nome del documento online e compare nei file di copia di sicurezza. Per questo non deve mai contenere dati che identificano un paziente.
- **Regola pratica:** la "chiave" di Firebase scritta nel codice è pubblica per natura (come l'indirizzo di casa). Ciò che protegge i dati sono le **regole** del database: vanno scritte e riviste. Chi è proprietario dei dati deve poter leggere le regole e capirle.

---

## Parte B — Cambiare una cosa senza rompere le altre

### B1. Prima il controllo, poi il riordino
- **Cosa fare:** prima di spostare o riscrivere codice, costruire una prova che dice "il risultato è identico a prima". Solo dopo si sposta.
- **Perché:** riordinare è facile, accorgersi di aver rotto qualcosa è difficile. Con una prova automatica basta un minuto.
- **Nel progetto:** tre livelli di controllo.
  1. **Test sul motore** (`node --test`): 62 prove, senza browser.
  2. **Controllo "prima e dopo" dell'output** (`golden-browser`): 183 casi, tutti gli esercizi a più livelli, con i "dadi truccati" (generatore casuale con un seme fisso). Si confronta l'impronta del materiale e di ciò che viene disegnato.
  3. **Controllo "prima e dopo" delle esportazioni** (`export-browser`): scarica i file PowerPoint e Word e confronta l'impronta di ogni parte interna.
- **Attenzione:** questo tipo di controllo dimostra "non è cambiato niente", non "è giusto". Le regole di qualità vanno provate a parte.

### B2. Un passo alla volta, e a fine passo l'app funziona
- **Cosa fare:** ogni passo è un pezzo piccolo, con la sua verifica e un messaggio di commit leggibile. Se un passo va male, si torna indietro di uno solo.
- **Nel progetto:** 7 passi numerati. A volte più passi si fanno insieme quando la stessa prova copre tutto (passo 4 e 5: uno spostamento solo meccanico, dimostrato identico).

### B3. Spostare il codice senza cambiarlo
- **Cosa fare:** quando si divide un file, si **sposta** e basta. Niente "già che ci sono, sistemo". Miglioramenti e spostamenti non si mescolano mai nello stesso passo.
- **Perché:** se qualcosa cambia dopo uno spostamento puro, il colpevole è lo spostamento; se si è mescolato altro, non si sa più.
- **Come:** lo spostamento è fatto da uno strumento che taglia sui confini esatti delle istruzioni (analizzatore di codice), non a mano e non a occhio.

### B4. Dividere l'app in file senza "strumenti di costruzione"
- **Cosa fare (per un'app semplice):** file `.js` normali caricati con `<script src="...">`, nell'ordine giusto. Niente compilatori, niente installazioni. Si apre con doppio clic e si pubblica su GitHub Pages.
- **Tre trappole da conoscere:**
  1. **L'ordine conta.** Una funzione può essere usata prima della riga in cui è scritta *solo dentro lo stesso file*. Fra file diversi, se il codice chiama una funzione appena caricato il file, quel file deve già essere stato caricato.
  2. **Le "costanti" nascono al loro posto.** Una costante usata prima della sua riga dà errore.
  3. **Le chiamate "al caricamento" non si spostano alla cieca.** Si spostano le definizioni (funzioni e costanti), non le istruzioni che *fanno partire* qualcosa.
- **Nel progetto:** dopo ogni spostamento il controllo 183 casi + 20 esportazioni conferma che l'ordine è giusto.

### B5. I dati stanno in file di dati, la logica in file di logica
- **Cosa fare:** liste di parole, criteri, icone vanno in `data/`, separate dalle istruzioni. Chi è esperto del contenuto (qui: il clinico) può rivederle senza leggere codice.
- **Formato:** `.js` e non `.json` se l'app deve aprirsi con doppio clic: il browser, aprendo un file locale, blocca la lettura di un `.json` (ma non di un `.js`).

### B6. Le librerie esterne si tengono in casa, con la versione segnata
- **Cosa fare:** scaricare le librerie in `vendor/`, scrivere versione e licenza, non caricarle da internet a ogni apertura.
- **Perché:** se il sito che le ospita cambia, chiude o è bloccato dalla rete aziendale (succede nelle AUSL), l'app smette di funzionare. Una versione fissa non cambia da sola.

### B7. La configurazione sta in un posto solo
- **Nel progetto (passo 5):** `js/firebase-config.js` contiene solo la configurazione di Firebase. Per collegare o scollegare la cronologia online si tocca solo quel file; il resto del codice non va aperto.

---

## Parte C — Accorgersi subito quando qualcosa non va

### C1. Se manca un pezzo, l'app lo dice
- **Cosa fare:** un piccolo controllo all'avvio verifica che i file fondamentali siano stati caricati e, se no, mostra una banda rossa con il nome di ciò che manca.
- **Perché:** un caricamento incompleto su GitHub (cartella dimenticata o nel posto sbagliato) altrimenti produce solo pulsanti che non fanno niente.
- **Nel progetto:** provato togliendo apposta un file alla volta.

### C2. Provare ciò che l'utente fa davvero
- **Cosa fare:** oltre ai test sul codice, una prova che apre l'app in un browser vero, preme i pulsanti e guarda cosa succede (salva copia, ripristina, scarica un PowerPoint).
- **Perché:** i test sul codice non vedono un pulsante scollegato.

### C3. Dopo ogni pubblicazione, un giro di controllo manuale
Attendere 1–2 minuti, ricaricare con Ctrl+Maiusc+R, generare un'attività per ogni esercizio, scaricare e aprire un PowerPoint e un Word. Cinque minuti che evitano la sorpresa davanti ai colleghi.

---

## Parte D — Come si lavora e si consegna

### D1. Una "memoria di lavoro" scritta
Un file (`CLAUDE_pdmgenerator.md`) dice a chi lavora al progetto — persona o assistente — come si lavora, a che punto si è e cosa non va toccato. Ogni sessione parte da lì invece che da zero. Il README spiega **cosa** fa l'app e **perché** è fatta così: va tenuto aggiornato, non è un optional.

### D2. Mai riscrivere un file intero per una correzione
Modifiche mirate, una per volta, dicendo quali righe cambiano e perché. Un file riscritto per intero può perdere cose che nessuno nota.

### D3. Consegnare solo ciò che è cambiato, e verificare il percorso prima del "Commit"
- Una zip per cartella; il contenuto della zip è la cartella stessa, non una cartella dentro un'altra.
- Prima del Commit su GitHub, nell'elenco i nomi devono avere il prefisso giusto (es. `js/renderers/serie.js`). Se vedi `js/js/...` o file nella radice che dovrebbero stare in una cartella, **non fare Commit**.
- *Errore reale accaduto:* la cartella `js` è finita dentro un'altra `js`. L'app avrebbe mostrato la banda rossa (vedi C1) e per questo il sito vecchio, intatto, ha continuato a funzionare finché non è stato caricato anche `index.html`. **Regola: `index.html` si carica per ultimo.**

### D4. Mai consegnare segreti nelle copie di lavoro
Le copie del codice condivise in un progetto Claude hanno la configurazione Firebase tolta; quella vera sta solo nel repository. Ora è confinata in `js/firebase-config.js`, quindi basta non copiare quel file.

### D5. Provare le modifiche prima di pubblicarle *(non ancora attivo)*
Lavorare su una copia di prova (ramo separato) e pubblicare solo dopo il controllo.

---

## Lista rapida: da dove partire con una nuova app

1. Scrivi in una frase cosa fa e per chi (e quali dati personali tocca).
2. Decidi dove vivono i dati e come se ne fa la copia di sicurezza.
3. Metti le librerie esterne in casa con la versione scritta.
4. Separa dati, logica e interfaccia fin dall'inizio, in file con nomi che si capiscono.
5. Costruisci subito il generatore di prova con un seme fisso e il controllo "prima e dopo".
6. Aggiungi il controllo "manca un file" e i messaggi chiari agli errori.
7. Scrivi README e memoria di lavoro mentre costruisci, non dopo.
8. Dopo ogni pubblicazione: giro di controllo manuale di cinque minuti.

## Cosa resta da migliorare (ordine di importanza)
1. Avvisare l'utente quando una scrittura online viene rifiutata (A3).
2. Regole Firestore riviste e scritte nel README (A4).
3. Un controllore automatico che lancia i test a ogni caricamento (C2).
4. Numero di versione visibile nell'app e breve elenco "cosa è cambiato".
5. Ramo di prova prima della pubblicazione (D5).
6. Licenza del codice e riconoscimenti (OpenMoji, CC BY-SA).
