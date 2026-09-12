# Generatore attività — PdM CDCD

App web a pagina singola (`index.html`, nessun framework, nessuna build) per generare materiale per la stimolazione cognitiva: sette moduli, ciascuno con un livello di difficoltà (16 per la maggior parte, 24 per Serie attentive alternate, "settimana" invece di "livello" per il Fascicolo esercizi a casa), materiale sempre nuovo ad ogni generazione, esportazione in PowerPoint o Word, anteprima completa a schermo prima di scaricare.

Gira interamente nel browser. Nessun server, nessuna build, nessuna dipendenza da installare: si apre `index.html` e basta. Le uniche chiamate di rete sono verso CDN pubbliche (per le librerie) e, se configurate, verso Firebase (cronologia condivisa), Openverse e Pixabay (foto per la Categorizzazione).

## I sette moduli

| Modulo | Cosa genera | Schermate per sessione |
|---|---|---|
| Griglie-Conteggio | 1 griglia 5×7 di simboli (cifre, lettere, forme, cirillico, ideogrammi, ge'ez...) con tutte le regole di conteggio valide su quella griglia (fino a una decina: attributo singolo, doppio, posizionale, combinato), elencate in forma essenziale a schermo e nel commento del file esportato | 1 griglia, tutte le regole insieme |
| Intruso percettivo | Serie di elementi ripetuti con un solo intruso da trovare; le famiglie di simboli si sbloccano gradualmente col livello (frecce/forme/dadi/semi delle carte/note musicali da subito, ideogrammi solo dal livello 13) | 9 schermate (regolabile), famiglie il più possibile diverse tra loro nella stessa sessione |
| Inversione e riordino | Blocchi di lettere/numeri/alfanumerico; tutte le trasformazioni valide per quel tipo di blocco (ripeti, inverti, riordina, somma, pari/dispari, vocali/consonanti, posizioni pari/dispari) mostrate insieme sotto ogni stimolo quando si attiva "Mostra risposta". Spunta per includere il blocco alfanumerico anche prima del livello 11, e controllo sul numero di stimoli per blocco | variabile |
| Serie attentive alternate | Sequenza di stimoli (A/B/1/2, colore alternato) con una regola per livello — **24 livelli, solo per questo esercizio** (gli altri restano a 16). Ogni schermata mostra anche un'anteprima della regola del livello successivo | numero di stimoli regolabile (default 154), uno alla volta |
| Accesso lessicale online | Una o più parole (regolabile) per denominazione con cueing graduato; il font si adatta alla lunghezza di ciascuna parola | 1-10 parole |
| Categorizzazione | 6 immagini reali (foto da Openverse, Pixabay come seconda fonte se configurata, fallback testuale se nessuna delle due risponde) da dividere in due gruppi da 3 secondo un criterio; 190 criteri in libreria (142 osservati nei materiali originali + 48 proposti, marcati "da verificare" finché non confermati); mai lo stesso criterio due volte nella stessa sessione | 9 prove (regolabile) |
| Fascicolo esercizi a casa | Fascicolo stampabile in Word (.docx) con 12 blocchi (griglie, crucipuzzle, labirinto generato algoritmicamente, accesso lessicale, anagrammi, calcolo...) organizzati per settimana | 12 blocchi per settimana |

Ogni modulo ha un pulsante "Genera nuovo materiale" (contenuto sempre diverso, stessa struttura e difficoltà), "Mostra risposta/regola", esportazione nel formato appropriato, e uno storico locale delle generazioni.

## Librerie usate (tutte da CDN, nessuna installazione)

- **pptxgenjs** — esportazione PowerPoint
- **docx** — esportazione Word (fascicolo esercizi a casa)
- **FileSaver.js** — download dei file generati
- **Firebase** (app + auth + firestore, compat build) — cronologia condivisa, opzionale
- **Openverse API** (`api.openverse.org`, nessuna chiave richiesta) — prima fonte di foto per la Categorizzazione
- **Pixabay API** (`pixabay.com/api`, chiave gratuita) — seconda fonte di foto, usata solo se configurata e solo quando Openverse non trova nulla

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

## Foto per la Categorizzazione (Openverse / Pixabay) — setup opzionale

Per default le foto vengono cercate su Openverse, gratis e senza chiave, ma il risultato non è sempre pertinente (è materiale indicizzato dalla community, non curato). Puoi aggiungere Pixabay come seconda fonte, usata solo quando Openverse non trova nulla:

1. Crea un account gratuito su **pixabay.com**.
2. Vai su **pixabay.com/api/docs/** — la tua chiave personale appare direttamente in quella pagina (nessuna approvazione richiesta).
3. In `index.html`, cerca `const PIXABAY_API_KEY = ""` e incolla la chiave tra le virgolette.

A differenza della chiave Firebase, questa identifica il tuo account e la tua quota (100 richieste/minuto) — non è un dato sensibile, ma se il repository è pubblico chiunque potrebbe consumare la tua quota. Rischio basso, da tenere comunque presente.

## Deploy

Nessuna build, nessun'azione GitHub. Basta pubblicare `index.html` da solo (root del branch `main`) su GitHub Pages, come per Borgo Planner e Progress Tracker.

## Limiti noti

- Le foto della Categorizzazione dipendono da Openverse (e da Pixabay, se configurato); se nessuna delle due risponde, l'etichetta testuale dell'oggetto sostituisce la foto — l'esercizio resta comunque completo e stampabile.
- I criteri di Categorizzazione marcati **"(proposta — da verificare)"** non sono ancora stati confermati: compaiono normalmente in generazione ma vanno controllati quando emergono.
- La cronologia condivisa richiede una configurazione Firebase tua; senza, tutto funziona lo stesso ma la cronologia resta locale al browser.
- Serie attentive alternate ha 24 livelli invece di 16: è l'unico esercizio con questo range, gli altri sei restano a 16.
