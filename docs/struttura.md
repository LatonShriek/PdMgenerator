# Struttura del codice e perché è fatta così

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## Struttura del repository e perché è fatta così

```
index.html                  struttura della pagina e tag <script> in ordine (dal passo 9 non contiene più codice)
REGOLE_DI_LAVORO.md      regole di lavoro e stato dei passi di refactoring
README.md                   presentazione e indice della documentazione
docs/                       la documentazione, un file per argomento (passo 6)
GUIDA_BUONE_PRATICHE.md     guida di buone pratiche per costruire web app (documento vivo)
data/                       dati puri, separati dalla logica
  classificazioni.js          banca categorie per Classificazioni (voci «proposta», da validare)
  intruso-concettuale.js      domini delle categorie (distanza dell'intruso)
  analogie.js                 banca di coppie per Analogie (voci «proposta», da validare)
  categorizzazione.js         libreria dei criteri di categorizzazione
  fascicolo-parole.js         banca di parole per anagrammi e crucipuzzle del Fascicolo (passo 10)
  accesso-extra.js            parole aggiuntive per Accesso lessicale, 4 fasce (passo 11)
  base.js                     dati di base: alfabeti, parole reali, fasce lessicali, regole delle serie (passo 9)
  openmoji-map.js             mappa termine inglese -> icona OpenMoji
  inv-real-block.js           lessico di controllo per le non-parole dell'Intruso
css/style.css                l'aspetto dell'app (passo 6)
js/                         il codice, un file per argomento (passi 4, 5 e 8)
  engine/engine.js            motore del Fascicolo (logica pura senza DOM, testato in Node; passo 8)
  generators/                 genera il materiale: griglie, intruso, inversione, serie, accesso, fascicolo, categorizzazione (motore, passo 8), classificazioni
  renderers/                  lo disegna a schermo: i sei sopra + categorizzazione
  export/                     esportazioni PowerPoint (un file per esercizio) e Word (fascicolo, con docbuilder.js); exporters.js sceglie quella giusta
  history/                    cronologia condivisa (localStorage + Firestore), storico delle generazioni e avvisi sul salvataggio online (online-status.js)
  util.js                     utilità: casuale, pesca senza ripetizioni, livelli (passo 9)
  state.js                    stato dell'app, elenco degli esercizi, numerazione (passo 9)
  level-notes.js              note di livello in sidebar (passo 9)
  registry.js                 mappe degli esercizi: renderer, generatori, cronologia (passo 9)
  controls.js                 controlli della sidebar specifici di ogni esercizio (passo 9)
  app.js                      collegamento dell'interfaccia e avvio (passo 9)
  progression.js              progressione del gruppo (mantieni / sali di livello)
  backup/                     copia di sicurezza: backup.js (logica pura) e backup-ui.js (collegamento alla pagina)
  firebase-config.js          configurazione Firebase (l'unico file da toccare per collegare/scollegare la cronologia online)
vendor/                     librerie esterne, versione fissata, servite in locale
  README.md                   tabella versioni/licenze e come aggiornarle
  licenses/                   testi delle licenze
tools/                      strumenti di controllo non automatici: audit-verbale.js (4 cicli sui moduli verbali), audit-browser.js (4 cicli in browser)
tests/                      test automatici (Node, nessuna dipendenza da installare)
  load-engine.js              carica da index.html il motore del Fascicolo e da js/backup/ il modulo di backup
  fascicolo.test.js           test con seme fisso, regole di qualità, anti-ripetizione, dati
  backup.test.js              test della copia di sicurezza (salva / ripristina)
  snapshots.json              impronte di riferimento del fascicolo (settimane 1-12, 3 semi)
  golden-browser.js           controllo "prima e dopo" in un browser vero: tutti gli esercizi (249 casi)
  golden-browser.json         le impronte di riferimento di quel controllo
  export-browser.js           controllo "prima e dopo" delle esportazioni: scarica i file PowerPoint e Word e ne confronta l'interno
  export-browser.json         le impronte di riferimento di quel controllo
  online-browser.js           prova dell'avviso sul salvataggio online (Firestore finto, nessuna rete)
  style-browser.js            controllo "prima e dopo" dell'aspetto: stili calcolati di ogni elemento in 16 stati (computer e telefono)
  style-browser.json          le impronte di riferimento di quel controllo
```

| Scelta | Perché |
|---|---|
| **`index.html` + file `.js`/`.css` caricati con `<script src>` e `<link>`** (senza strumenti di costruzione) | Si apre con doppio clic e si pubblica su GitHub Pages senza build. Il refactoring l'ha spezzata gradualmente (vedi "Stato del refactoring" in [pubblicazione-e-refactoring.md](pubblicazione-e-refactoring.md)), non d'un colpo, per non rompere nulla. |
| **`data/` separato** | I dati (liste di criteri, icone, lessico) erano quasi la metà del file ed erano mescolati alla logica. Separati si possono rivedere e correggere senza leggere codice, e non appesantiscono più `index.html` (da 543 KB a 362 KB). |
| **Dati in file `.js` e non `.json`** | Un `.json` va letto con una richiesta di rete che il browser blocca aprendo `index.html` con doppio clic. Un `.js` caricato con `<script src>` funziona ovunque: doppio clic e GitHub Pages. |
| **`vendor/` con versioni fissate** | L'app non dipende più da CDN esterni (salvo il fallback di sicurezza per `docx`, che scatta solo se il file locale non si carica): funziona anche se un CDN cambia o sparisce o se la rete (es. aziendale) lo blocca. Le versioni non cambiano da sole. |
| **`tests/` senza dipendenze** | Si usa il test runner incluso in Node (`node --test`), niente da installare. Servono a verificare che il riordino del codice non cambi ciò che l'app produce. |
| **Motore del Fascicolo autonomo** (`engine`) | È l'unica parte con generatore casuale seedabile (`mulberry32`) e senza DOM: per questo è testabile in Node. Le sue banche di parole restano nel motore volutamente, per non rompere i test. |
| **Copia di sicurezza in un file** | La memoria dei gruppi vive nel browser (e, se Firebase funziona, anche online). Un file salvato sul computer è una copia indipendente da entrambi: serve se si perdono i dati del browser, se si cambia computer o se Firebase non salva davvero. Il ripristino **aggiunge e non cancella mai**. |
| **Cronologia in `localStorage` + Firebase opzionale** | Funziona sempre in locale; la condivisione tra colleghi è un di più che si attiva solo configurando Firebase. |

## Come funziona l'app dentro

`index.html` carica, in quest'ordine, script con responsabilità distinte (dal passo 9 tutti in file; i punti 1-9 sotto sono raggruppati per argomento, l'ordine esatto è quello dei tag):

1. **Librerie** (`vendor/`): `pptxgenjs`, `docx`, `FileSaver`, Firebase (`app`, `auth`, `firestore`).
2. **Motore del Fascicolo** (`js/engine/engine.js`, modulo UMD): logica pura senza DOM, funzione `buildFascicolo(settimana, seme, esclusioni)`. Dato lo stesso seme, la stessa settimana e le stesse esclusioni produce sempre lo stesso fascicolo.
3. **Costruttore Word** (`js/export/docbuilder.js`): trasforma il fascicolo in `.docx` (versione esercizi e versione con soluzioni).
4. **Dati** (`data/*.js`): criteri di categorizzazione, mappa icone, lessico di controllo, caricati prima degli script che li usano.
5. **Motore di categorizzazione** (`js/generators/categorizzazione.js`): campionamento dei criteri e recupero dei pittogrammi OpenMoji, con fallback testuale.
6. **Cronologia, progressione, copia di sicurezza, esportazioni** (`js/history/`, `js/progression.js`, `js/backup/`, `js/export/`, `js/firebase-config.js`): dal passo 5 stanno in file propri. `js/backup/backup.js` è un modulo UMD con logica pura (niente pagina, niente localStorage), provato dai test; `js/backup/backup-ui.js` lo collega alla pagina.
8. **File degli esercizi** (`js/generators/*.js`, `js/renderers/*.js`): script classici caricati con `<script src>` prima dell'app principale; usano le stesse variabili globali (`state`, `rnd`, `pick`…) di prima. Un piccolo controllo subito dopo avvisa con una banda rossa se uno di questi file manca (caricamento incompleto).
9. **App principale**: stato, mappe `GENERATORS` (un generatore per esercizio) e `RENDERERS` (un renderer per esercizio), `weekParams(week)` per il Fascicolo, pannello di progressione, esportazioni, interfaccia, pulsanti della copia di sicurezza.

Flusso di una generazione: l'utente sceglie esercizio e livello → `GENERATORS[esercizio]` costruisce il materiale (escludendo ciò che la cronologia del gruppo segnala già usato) → `RENDERERS[esercizio]` lo disegna → l'esportazione (PowerPoint/Word) riusa gli stessi dati.
