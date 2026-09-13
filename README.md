# Generatore attività — PdM CDCD

App web a pagina singola (`index.html`, nessun framework, nessuna build) per generare materiale per la stimolazione cognitiva: sette moduli, ciascuno con un livello di difficoltà (16 per la maggior parte, 24 per Serie attentive alternate, "settimana" invece di "livello" per il Fascicolo esercizi a casa), materiale sempre nuovo ad ogni generazione, esportazione in PowerPoint o Word, anteprima completa a schermo prima di scaricare.

Gira interamente nel browser. Nessun server, nessuna build, nessuna dipendenza da installare: si apre `index.html` e basta. Le uniche chiamate di rete sono verso CDN pubbliche (per le librerie), verso l'API pubblica di Iconify/OpenMoji (pittogrammi per la Categorizzazione, nessuna chiave richiesta) e, se configurata, verso Firebase (cronologia condivisa).

## I sette moduli

| Modulo | Cosa genera | Schermate per sessione |
|---|---|---|
| Griglie-Conteggio | 1 griglia 5×7 di simboli (cifre, lettere, forme, cirillico, ideogrammi, ge'ez...) con tutte le regole di conteggio valide su quella griglia (fino a una decina: attributo singolo, doppio, posizionale, combinato), elencate in forma essenziale a schermo; nell'export PowerPoint le stesse regole vanno nel commento, raggruppate 3 per riga (non più una per riga) per restare leggibili a colpo d'occhio | 1 griglia, tutte le regole insieme |
| Intruso percettivo | Serie di elementi ripetuti con un solo intruso da trovare; le famiglie di simboli si sbloccano gradualmente col livello (frecce/forme/dadi/semi delle carte/note musicali da subito, ideogrammi solo dal livello 13) | 9 schermate (regolabile), famiglie il più possibile diverse tra loro nella stessa sessione |
| Inversione e riordino | Blocchi di lettere/numeri/alfanumerico; tutte le trasformazioni valide per quel tipo di blocco (ripeti, inverti, riordina, somma, pari/dispari, vocali/consonanti, posizioni pari/dispari) mostrate insieme sotto ogni stimolo quando si attiva "Mostra risposta". Spunta per includere il blocco alfanumerico anche prima del livello 11, e controllo sul numero di stimoli per blocco | variabile |
| Serie attentive alternate | Sequenza di stimoli (A/B/1/2, colore nero/rosso) con una regola per livello — **24 livelli, solo per questo esercizio** (gli altri restano a 16). Simbolo e colore sono indipendenti e scelti a ogni passo, con un solo vincolo: né lo stesso simbolo né lo stesso colore possono ripetersi per più di 3 stimoli consecutivi (prima il colore si alternava rigidamente nero/rosso a ogni stimolo, prevedibile al 100% dalla sola posizione — bug corretto). Ogni schermata mostra anche un'anteprima della regola del livello successivo | numero di stimoli regolabile (default 154), uno alla volta |
| Accesso lessicale online | Una o più parole (regolabile) per denominazione con cueing graduato; il font si adatta alla lunghezza di ciascuna parola | 1-10 parole |
| Categorizzazione | 6 pittogrammi OpenMoji (disegni, non foto — vedi sezione dedicata) da dividere in due gruppi da 3 secondo un criterio; 190 criteri in libreria (142 osservati nei materiali originali + 48 proposti, marcati "da verificare" finché non confermati); mai lo stesso criterio due volte nella stessa sessione | 9 prove (regolabile) |
| Fascicolo esercizi a casa | Fascicolo stampabile in Word (.docx) con 12 blocchi organizzati per settimana — vedi dettaglio sotto | 12 blocchi per settimana |

Ogni modulo ha un pulsante "Genera nuovo materiale" (contenuto sempre diverso, stessa struttura e difficoltà), "Mostra risposta/regola", esportazione nel formato appropriato, e uno storico locale delle generazioni.

### Fascicolo esercizi a casa — dettaglio dei 12 blocchi

1. **Tre griglie di ricerca-sequenza** (cifre, lettere latine, cirilliche): 25 righe × 12 colonne, a piena pagina. La sequenza bersaglio compare **esattamente 16 volte** in totale — 8 in orizzontale + 8 in verticale, mai un numero casuale — verificato ad ogni generazione, rigenerando la griglia se il conteggio non torna esatto.
2. **Griglia mista** ("Cerchiare tutte le sequenze indicate"): volutamente più piccola delle prime tre, per lasciare spazio alla tabella sotto. Nasconde **12 sequenze diverse**, distribuite 4 orizzontali + 4 verticali + 4 in obliquo (2 discendenti a destra, 2 a sinistra), ciascuna garantita presente almeno una volta.
3. **Crucipuzzle** (dalla settimana 3): stesso principio di ricerca, parole reali invece di sequenze astratte.
4. **Unire i numeri in ordine crescente** (lettere in ordine alfabetico dalla settimana 5, sostituzione diretta non alternata): 24-40 nodi sparsi su tutta la pagina.
5. **Risolvere il labirinto**: generato algoritmicamente (backtracking ricorsivo), dimensione crescente col livello, con un **varco reale tagliato nel perimetro** in corrispondenza di INIZIO e FINE (prima erano solo etichette di testo sovrapposte a un bordo chiuso — bug corretto).
6. **Accesso lessicale per posizione/lunghezza/categoria**: uno tra 7 schemi che ciclano ogni 14 settimane (iniziale → posizione → lettere congiunte → lettere disgiunte → lettera+categoria → lettera+lunghezza → categoria+lunghezza) — vedi sezione dedicata sotto.
7. **Accesso lessicale per categoria semantica** — vedi sezione dedicata sotto.
8. **Anagrammi**, **9. Calcolo**: banche di parole/espressioni reali, senza ripetizioni nella stessa sessione.

## Accesso lessicale — banche dati (fonemico e semantico)

**Fonemico** (schemi posizione/congiunte/disgiunte): 60 coppie di lettere per schema (prima erano 10-14), ciascuna **verificata contro un dizionario italiano reale di ~60.000 forme di parola** e tenuta solo se supera una soglia minima di parole realmente esistenti — non più solo un pugno di esempi scritti a mano, e non più combinazioni generate a caso che rischiavano di non avere soluzione (es. una coppia come "seconda lettera Z + penultima Q" è stata scartata in fase di validazione: zero parole italiane reali la rispettano).

**Semantico** (categorie): ogni fascia ampliata di 10 categorie aggiuntive rispetto a prima (fascia ampia 24→34, intermedia 19→29, stretta/insolita 16→26), per ridurre il rischio di ripetizione entro lo stesso gruppo di livelli su cicli lunghi.

Entrambe le banche vengono pescate senza ripetizione (si ricomincia un giro solo dopo aver esaurito il pool), e la cronologia condivisa (se configurata, vedi sotto) evita di riproporre le stesse combinazioni allo stesso gruppo/paziente anche a mesi di distanza.

## Categorizzazione — pittogrammi OpenMoji

Le foto reali (prima Pixabay, e Openverse ancora prima) sono state sostituite con **OpenMoji** (licenza CC BY-SA 4.0): pittogrammi disegnati in stile coerente invece di fotografie, serviti dall'API pubblica di Iconify (`api.iconify.design`, nessuna chiave richiesta) e rasterizzati in PNG direttamente nel browser.

**Copertura reale, non tutto o niente**: la libreria di Categorizzazione usa 1371 termini inglesi distinti (per la ricerca dell'immagine); di questi, **568 (circa il 41%) hanno un pittogramma OpenMoji verificato** in questa versione. Il resto (termini troppo astratti o specifici per un set di icone — es. "abstract painting", "air compressor", "antique dresser") mostra l'etichetta testuale dell'oggetto invece del disegno: non è un errore, è lo stesso comportamento di fallback già usato prima per le foto mancanti. La mappa termine→icona è stata verificata offline contro l'intero set OpenMoji (4579 pittogrammi), non generata per tentativi a runtime, per evitare di mostrare un'icona sbagliata pur di mostrarne una.

**Attribuzione**: la licenza CC BY-SA 4.0 richiede una citazione. Va messa una sola volta per fascicolo/deck esportato (es. una riga in fondo all'ultima pagina o nelle note dell'ultima slide: "Icone: OpenMoji – CC BY-SA 4.0"), non ripetuta su ogni schermata.

Se in futuro si vuole aumentare la copertura oltre il 41%, le opzioni più semplici sono: ampliare la mappa termine→icona con altre voci verificate a mano, oppure aggiungere un secondo set di icone (es. Twemoji o un set a icone lineari) come fallback prima del testo.

## Librerie usate (tutte da CDN o API pubbliche, nessuna installazione)

- **pptxgenjs** — esportazione PowerPoint
- **docx** — esportazione Word (fascicolo esercizi a casa)
- **FileSaver.js** — download dei file generati
- **Firebase** (app + auth + firestore, compat build) — cronologia condivisa, opzionale
- **Iconify / OpenMoji API** (`api.iconify.design`, nessuna chiave richiesta) — pittogrammi per la Categorizzazione

Se una qualunque di queste chiamate fallisce (rete assente, CORS, rate limit), l'app degrada in modo pulito: mai un errore visibile, sempre un'alternativa testuale o locale.

## Cronologia condivisa (Firebase) — setup

Di norma la cronologia delle generazioni resta solo nel browser che le ha fatte. Per **Categorizzazione** e **Accesso lessicale**, dove il materiale viene da una libreria finita (criteri, parole), questo significa che a distanza di mesi o da un altro dispositivo si può ripresentare lo stesso contenuto allo stesso gruppo/paziente. La cronologia condivisa risolve questo: un gruppo/paziente (identificato per nome, campo in fondo alla sidebar) non rivede criteri o parole già usati di recente, indipendentemente dal dispositivo o browser usato — a patto che Firebase sia configurato. Non si applica agli altri cinque moduli: generano materiale procedurale fresco ogni volta per costruzione, non hanno un pool finito da esaurire.

Finché la configurazione sotto resta vuota, questa funzione è semplicemente spenta e l'app si comporta come se non esistesse.

**1. Crea (o riusa) un progetto Firebase**
Vai su [console.firebase.google.com](https://console.firebase.google.com), crea un nuovo progetto (o usa uno già esistente per gli altri tuoi strumenti — Borgo Planner, Progress Tracker).

**2. Registra l'app web col metodo CDN**
Nelle impostazioni del progetto, "Le tue app" → "Aggiungi app" → Web. Al passo "Aggiungi SDK Firebase" scegli **"Usa un tag `<script>`"** (non "npm") — ti mostrerà un blocco con solo l'oggetto `firebaseConfig`, senza righe di `import` da bundler.

**3. Abilita Firestore e l'autenticazione anonima**
- Nel menu a sinistra, sotto la voce **"Build"** (va espansa cliccandoci sopra): **Firestore Database** → Crea database → modalità produzione
- Sempre sotto "Build": **Authentication** → scheda "Sign-in method" → abilita **"Anonimo"**

(Non serve il login Google qui: la cronologia non contiene dati sensibili — solo etichette di criteri e parole — quindi basta un utente anonimo autenticato per soddisfare le regole di sicurezza.)

**4. Incolla la configurazione nel codice**
In `index.html`, cerca `const firebaseConfig = {` e incolla le 6 righe (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) mostrate al passo 2.

**5. Imposta le regole Firestore**
Nella console Firebase → Firestore Database → Regole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /catHistory/{doc} {
      allow read, write: if request.auth != null;
    }
    match /accessoHistory/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**6. Ricarica l'app**
Lo stato della connessione compare sotto il campo "Nome gruppo/paziente" in sidebar — se non si connette, mostra anche il codice d'errore esatto (es. `auth/operation-not-allowed` = l'accesso Anonimo non è ancora abilitato). Inserisci un nome (es. "Gruppo martedì mattina") — da quel momento Categorizzazione e Accesso lessicale evitano i criteri/parole già usati di recente per quel nome, anche aprendo l'app da un altro computer.

Come per gli altri tuoi progetti, la chiave API nel codice non è un problema di sicurezza: l'accesso è comunque limitato dalle regole Firestore, non dalla segretezza della chiave.

## Deploy

Nessuna build, nessun'azione GitHub. Basta pubblicare `index.html` da solo (root del branch `main`) su GitHub Pages, come per Borgo Planner e Progress Tracker.

## Limiti noti

- Le icone della Categorizzazione coprono circa il 41% dei termini della libreria (568 su 1371); il resto mostra l'etichetta testuale dell'oggetto invece del pittogramma — l'esercizio resta comunque completo e stampabile, ma con più testo e meno disegni di quanto si vedrebbe con una copertura maggiore.
- I criteri di Categorizzazione marcati **"(proposta — da verificare)"** non sono ancora stati confermati: compaiono normalmente in generazione ma vanno controllati quando emergono.
- La cronologia condivisa richiede una configurazione Firebase tua; senza, tutto funziona lo stesso ma la cronologia resta locale al browser.
- Serie attentive alternate ha 24 livelli invece di 16: è l'unico esercizio con questo range, gli altri sei restano a 16.
- L'attribuzione OpenMoji (CC BY-SA 4.0) va aggiunta manualmente una volta per documento esportato — l'app non la inserisce automaticamente.
