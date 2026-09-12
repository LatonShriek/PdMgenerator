# Generatore attività — PdM CDCD

App web a pagina singola (`index.html`, nessun framework, nessuna build) per generare materiale per la stimolazione cognitiva: sette moduli, ciascuno con un livello di difficoltà 1-16 (il fascicolo esercizi a casa usa "settimana" al posto di "livello"), materiale sempre nuovo ad ogni generazione, esportazione in PowerPoint o Word, anteprima completa a schermo prima di scaricare.

Gira interamente nel browser. Nessun server, nessuna build, nessuna dipendenza da installare: si apre `index.html` e basta. Le uniche chiamate di rete sono verso CDN pubbliche (per le librerie) e, se configurata, verso Firebase (cronologia condivisa) e Openverse (foto per la Categorizzazione).

## I sette moduli

| Modulo | Cosa genera | Schermate per sessione |
|---|---|---|
| Griglie-Conteggio | Griglie 5×7 di simboli (cifre, lettere, forme, cirillico, ideogrammi, ge'ez...) con regole di conteggio per attributo singolo, doppio, posizionale o combinato | 6 griglie, regole in ordine di complessità crescente |
| Intruso percettivo | Serie di elementi ripetuti con un solo intruso da trovare; le famiglie di simboli si sbloccano gradualmente col livello (mai gli ideogrammi al livello 1, per dire) | 9 schermate |
| Inversione e riordino | Blocchi di lettere/numeri/alfanumerico da invertire o riordinare, con controllo manuale sul numero di stimoli per blocco | variabile |
| Serie attentive alternate | Sequenza di 154 stimoli (A/B/1/2, colore alternato) con regola di risposta; ogni livello offre 2 regole (una speculare all'altra, stessa difficoltà, mappatura diversa) | 154 stimoli, uno alla volta |
| Accesso lessicale online | Una parola per denominazione con cueing graduato; il font si adatta alla lunghezza della parola | 1 parola |
| Categorizzazione | 6 immagini reali (foto da Openverse, fallback testuale se la rete non risponde) da dividere in due gruppi da 3 secondo un criterio; 190 criteri in libreria (142 osservati nei materiali originali + 48 proposti, marcati "da verificare" finché non confermati) | 9 prove, sempre criteri diversi nella stessa sessione |
| Fascicolo esercizi a casa | Fascicolo stampabile in Word (.docx) con 12 blocchi (griglie, crucipuzzle, labirinto generato algoritmicamente, accesso lessicale, anagrammi, calcolo...) organizzati per settimana | 12 blocchi per settimana |

Ogni modulo ha un pulsante "Genera nuovo materiale" (contenuto sempre diverso, stessa struttura e difficoltà), "Mostra risposta/regola", esportazione nel formato appropriato, e uno storico locale delle generazioni.

## Librerie usate (tutte da CDN, nessuna installazione)

- **pptxgenjs** — esportazione PowerPoint
- **docx** — esportazione Word (fascicolo esercizi a casa)
- **FileSaver.js** — download dei file generati
- **Firebase** (app + auth + firestore, compat build) — cronologia condivisa, opzionale
- **Openverse API** (`api.openverse.org`, nessuna chiave richiesta) — foto reali per la Categorizzazione

Se una qualunque di queste chiamate fallisce (rete assente, CORS, rate limit), l'app degrada in modo pulito: mai un errore visibile, sempre un'alternativa testuale o locale.

## Cronologia condivisa (Firebase) — setup

Di norma la cronologia delle generazioni resta solo nel browser che le ha fatte. Per **Categorizzazione** e **Accesso lessicale**, dove il materiale viene da una libreria finita (criteri, parole), questo significa che a distanza di mesi o da un altro dispositivo si può ripresentare lo stesso contenuto allo stesso gruppo/paziente. La cronologia condivisa risolve questo: un gruppo/paziente (identificato per nome, campo in fondo alla sidebar) non rivede criteri o parole già usati di recente, indipendentemente dal dispositivo o browser usato — a patto che Firebase sia configurato.

Finché la configurazione sotto resta vuota, questa funzione è semplicemente spenta e l'app si comporta come se non esistesse.

**1. Crea (o riusa) un progetto Firebase**
Vai su [console.firebase.google.com](https://console.firebase.google.com), crea un nuovo progetto (o usa uno già esistente per gli altri tuoi strumenti — Borgo Planner, Progress Tracker).

**2. Abilita Firestore e l'autenticazione anonima**
- Firestore Database → Crea database → modalità produzione
- Authentication → Sign-in method → abilita "Anonimo"

(Non serve il login Google qui: la cronologia non contiene dati sensibili — solo etichette di criteri e parole — quindi basta un utente anonimo autenticato per soddisfare le regole di sicurezza.)

**3. Incolla la configurazione nel codice**
In `index.html`, cerca `const firebaseConfig = {` e incolla i valori da Impostazioni progetto → Le tue app → Configurazione SDK:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

**4. Imposta le regole Firestore**
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

**5. Ricarica l'app**
Lo stato della connessione compare sotto il campo "Nome gruppo/paziente" in sidebar. Inserisci un nome (es. "Gruppo martedì mattina") — da quel momento Categorizzazione e Accesso lessicale evitano i criteri/parole già usati di recente per quel nome, anche aprendo l'app da un altro computer.

Come per gli altri tuoi progetti, la chiave API nel codice non è un problema di sicurezza: l'accesso è comunque limitato dalle regole Firestore, non dalla segretezza della chiave.

## Deploy

Nessuna build, nessun'azione GitHub. Basta pubblicare `index.html` da solo (root del branch `main`) su GitHub Pages, come per Borgo Planner e Progress Tracker.

## Limiti noti

- Le foto della Categorizzazione dipendono da Openverse (`api.openverse.org`); se la rete o il CORS non rispondono, l'etichetta testuale dell'oggetto sostituisce la foto — l'esercizio resta comunque completo e stampabile.
- I criteri di Categorizzazione marcati **"(proposta — da verificare)"** non sono ancora stati confermati: compaiono normalmente in generazione ma vanno controllati quando emergono, esattamente come i criteri incerti già segnalati e corretti in precedenza.
- La cronologia condivisa richiede una configurazione Firebase tua; senza, tutto funziona lo stesso ma la cronologia resta locale al browser.
