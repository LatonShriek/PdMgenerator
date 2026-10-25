# CLAUDE.md — Generatore attività PdM CDCD

Leggi questo file all'inizio di ogni sessione. Aggiornalo quando cambia qualcosa
(spunta i passi fatti, aggiorna "Stato attuale").

## Cos'è
Web app (JS vanilla, nessun backend) che genera materiale di stimolazione
cognitiva per gruppi MCI/DNMi/DCL: 10 tipi di attività (categorizzazione,
intruso, griglie, serie attentive, inversione, accesso lessicale, fascicolo a
casa, più tre moduli di ragionamento verbale ispirati al VRT: Classificazioni, Intruso concettuale, Analogie), 32 livelli, anti-ripetizione per gruppo, progressione di gruppo,
esportazione PowerPoint (pptxgenjs) e Word (docx). Cronologia in
`localStorage`, condivisione opzionale via Firebase/Firestore.
Il README.md è l'indice; la documentazione dettagliata (scopo, struttura, logica, banche di parole
e regole di qualità) sta in `docs/`: **va letta prima di toccare i generatori e non va persa.**
Per Rodrigo esiste anche `SPIEGAZIONE_SEMPLICE.md` (perché la struttura è fatta
così e cosa si può ancora migliorare, in parole semplici).

## Stato attuale (refactoring: i passi 1-8 del piano sono fatti)
- **Passo 11** (25 ott 2026, contenuti, non refactoring): garanzia «4 cicli senza materiale identico» per tutti gli esercizi (ciclo = 32 livelli × 1 seduta; Fascicolo = 12 settimane). Misura con `tools/audit-verbale.js` / `tools/audit-browser.js` (ATTENZIONE: l'audit deve impostare `localStorage.pdm_group_name`, senza gruppo non c'è cronologia e i numeri sono falsi). Banche ampliate con voci `proposta` più astratte: Classificazioni 67→119 categorie (+ termini in coda alle esistenti, `EXTRA`), Analogie 14→40 relazioni e 148→538 coppie, domini per l'Intruso concettuale; Accesso 182→~1.400 parole (`data/accesso-extra.js`), con ripiego sulla fascia vicina prima di ripetere; Categorizzazione ricorda anche la singola prova (`trialKey` in `usedLabels`); Fascicolo settimana 1 varia la lunghezza (chiavi `initial:L:N`). Generatori verbali: prima la terna/quesito mai visto, poi la categoria meno recente. Tetti cronologie alzati (max 5000 per il backup). Test nuovo `tests/cicli.test.js`; baseline golden/export/stile riscritte (cambia solo materiale di accesso e moduli verbali). Da validare da Rodrigo tutte le nuove voci.
- **Passo 10** (25 ott 2026): la banca di parole del Fascicolo (`WORD_BANK_SCORED`, `WORD_BANK`, ~9 KB) è in `data/fascicolo-parole.js` (modulo UMD, caricato prima di `engine.js`); contenuto identico, impronte del Fascicolo invariate. `tests/load-engine.js` compila il motore con il suo percorso reale (serve al `require`). Restano nel motore le altre banche (`CATEGORY_POOL`, `PHONEMIC_DB`, `CATEGORY_LETTER_BANK`…, ~27 KB).
- **Passo 9** (25 ott 2026): gli ultimi script inline di `index.html` sono in file propri, spostamento identico e stesso ordine di caricamento: `data/base.js` (dati di base), `js/util.js` (casuale, anti-ripetizione), `js/state.js` (stato, elenco esercizi), `js/level-notes.js`, `js/history/fascicolo-history.js`, `js/registry.js` (mappe RENDERERS/GENERATORS/MATERIAL_HISTORY), `js/controls.js` (controlli della sidebar), `js/app.js` (interfaccia e avvio). `index.html` ora ~190 righe (solo struttura HTML e tag `<script>`). Ordine dei tag = ordine di esecuzione: non cambiarlo. 85 test, 249 casi, 29 esportazioni, 22 stati (impronta stile riscritta: solo +6 elementi `<script>`).
- **Passo 8** (24 ott 2026): fuori da `index.html` il motore del Fascicolo (`js/engine/engine.js`), il costruttore Word (`js/export/docbuilder.js`) e il motore di categorizzazione (`js/generators/categorizzazione.js`), spostamento identico. `index.html` ~1345 righe. `tests/load-engine.js` legge ora il motore dal file. `tests/style-browser.js` ritenta fino a 3 volte (l'impronta del layout ha due esiti, anche su codice invariato).
- `index.html` ~1345 righe dopo il passo 8 (era ~543 KB / ~15.000 righe). Passo 4: generatori in `js/generators/` (griglie, intruso,
  inversione, serie, accesso, fascicolo) e renderer in `js/renderers/` (gli stessi + categorizzazione),
  script classici caricati con `<script src>` PRIMA dello script principale (stesso ordine di prima;
  sono solo dichiarazioni di funzione, nessuna chiamata al caricamento). Una banda rossa avvisa se manca un file.
  Passo 5: anche esportazioni (`js/export/*`), cronologia (`js/history/*`), progressione (`js/progression.js`),
  copia di sicurezza (`js/backup/backup.js` UMD + `backup-ui.js`) e configurazione Firebase
  (`js/firebase-config.js`) stanno in file propri; tag `<script src>` dopo quelli dei renderer, prima dello
  script principale. Restano in `index.html`: motore del Fascicolo, costruttore Word, motore di categorizzazione
  (`genCategorizzazioneV2`, `genFresh`), dati di base, stato, mappe `GENERATORS`/`RENDERERS`, controlli, e le
  istruzioni che collegano i pulsanti. Banda rossa se manca un file.
- Librerie in `vendor/`, versioni fissate, niente CDN a runtime: pptxgenjs 3.12.0,
  docx 8.5.0, FileSaver 2.0.5, Firebase 10.14.1 (compat). Unica eccezione: un
  piccolo script di sicurezza in `index.html` scarica `docx` da unpkg.com solo se
  il file locale non si carica.
- Dati in `data/` (3 file `.js`): `categorizzazione.js` (190 voci: 142 reali +
  48 proposte), `openmoji-map.js` (568 voci), `inv-real-block.js`.
- Test in `tests/`: `node --test tests/*.test.js` → 90 test, tutti passano.
  Coprono il Fascicolo (seme fisso, snapshot settimane 1-12, regole di qualità,
  anti-ripetizione), i file di dati e la copia di sicurezza (`backup.test.js`).
- `tests/golden-browser.js` (Playwright, Chromium senza rete, seme fisso): 249 casi, impronte in
  `golden-browser.json`. **Regola: prima e dopo ogni spostamento di codice deve dare "OK: 183 casi identici"**
  (si lancia in background: ~2 min; NODE_PATH e CHROMIUM_PATH impostati).
- `tests/export-browser.js`: 32 esportazioni (PowerPoint dei 10 esercizi a 3 livelli + Word del fascicolo, settimane 1 e 7)
  confrontate per contenuto interno; **va lanciato prima e dopo ogni modifica alle esportazioni**.
- `tests/style-browser.js`: stili calcolati di ogni elemento in 16 stati; da lanciare prima e dopo ogni modifica al CSS.
- `tests/online-browser.js`: avviso sul salvataggio online con Firestore finto.
- Dopo il passo 5: `js/history/online-status.js` mostra un avviso rosso se un salvataggio online è rifiutato
  e ha il pulsante "Verifica il salvataggio online" (prova scrittura/lettura/cancellazione nelle 5 raccolte).
  Passo 6 (parte CSS): l'aspetto sta in `css/style.css`; il banner controlla che la variabile `--bg` sia definita.
  Lezione: le schermate a pixel sono instabili, meglio confrontare gli stili calcolati.
- Dal 24 ott 2026: scritta di versione in fondo alla barra laterale (`#appVersion`, da aggiornare a ogni rilascio) e controllo automatico dei test su GitHub (`.github/workflows/test.yml`, `node --test`).
- `GUIDA_BUONE_PRATICHE.md`: guida di buone pratiche, **da aggiornare a ogni passo** con ciò che si è imparato.
- Copia di sicurezza (passo 7): blocco `backup.js` (logica pura, UMD) dentro
  `index.html` + due pulsanti in fondo alla barra laterale. Salva/ripristina solo
  le chiavi note (`pdm_hist::`, `pdm_progress::`, storico, nome/numero gruppo);
  il ripristino aggiunge e non cancella; file importato = dato non fidato.
  Provato anche in un browser vero (Playwright) con salva → svuota → ripristina.
- Le banche di parole del Fascicolo (`WORD_BANK_EXTRA`, `CATEGORY_LETTER_BANK`,
  `PHONEMIC_DB`, `CATEGORY_POOL`…) restano dentro il motore in `index.html`:
  spostarle ora cambierebbe il motore testato. Si valuta dopo il passo 4.
- Punti di giunzione già esistenti per i prossimi passi: mappe `GENERATORS` e
  `RENDERERS`, `weekParams(week)`, sezioni commentate.
- Pittogrammi OpenMoji (CC BY-SA 4.0) con fallback testuale.

## Nuovi moduli VRT (ottobre 2026)
- Piano e specifiche condivise: Claude Doc «PdM CDCD — Piano d'azione e specifiche moduli VRT». Ogni modulo = `data/<nome>.js` + `js/generators|renderers|export/<nome>.js` + `tests/<nome>.test.js` + registrazione in `index.html` (EXERCISES, GENERATORS, RENDERERS, EXERCISE_NUMBER, MATERIAL_HISTORY, tag script, banda rossa, levelNote, controlli, storico) + `js/export/exporters.js` + `js/history/storico.js`. I generatori nuovi sono UMD (globale nel browser, `require` in Node) con `buildXxx(level,{rng,used,count})` puro e testabile.
- **Fatti**: Classificazioni (n. 7), Intruso concettuale (n. 8), Analogie (n. 9). **Parentele: rimosso su richiesta di Rodrigo (25 ott 2026)** insieme a `data/vrt-esclusi.js`. Banche Classificazioni e Analogie = `proposta`, da validare da Rodrigo.
- **Da fare**, in quest'ordine: Assurdità, Differenze e somiglianze (banche come documento di bozze `proposta`). Variante di flessibilità dell'Intruso (6 termini, 2 raggruppamenti): non fatta. **Idiomatiche: escluso su richiesta di Rodrigo (24 ott 2026).** Il materiale del VRT non va riprodotto (frasi, coppie, parole): i protocolli sono nel Progetto/scratchpad della sessione originale.
- Aggiungere un modulo cambia di proposito le impronte `style-browser` (+ elementi in elenco e tag script) e aggiunge casi a golden/export: si riscrivono con `--update` dopo aver verificato che i casi esistenti non cambino (il solo campo `rule` del fascicolo può variare: è il testo nascosto del riquadro regola rimasto dall'esercizio precedente nel test).

## Regole di lavoro (sempre)
1. **Mai riscrivere un intero file** per una correzione. Modifiche mirate,
   una cosa per volta, dicendo quali righe cambiano e perché.
2. **Non alterare banche e regole di qualità** (12 parole valide per consegna,
   ≥6 frequenti con Zipf ≥ 3.0, coppie lettera+categoria da
   `CATEGORY_LETTER_BANK`) senza richiesta esplicita.
3. **Prima i test, poi il refactoring**: con seme casuale fissato i
   generatori devono produrre lo stesso materiale prima e dopo ogni passo.
   Servono test sulle regole di qualità e sull'anti-ripetizione.
4. Un passo = un commit leggibile, app funzionante a fine passo.
5. Spiega le scelte in italiano semplice, senza gergo, passo per passo:
   Rodrigo non ha formazione informatica e vuole istruzioni come per chi parte
   da zero. Ogni termine tecnico va spiegato con un esempio quotidiano.
6. Nessun build tool pesante: moduli ES nativi o script classici, ospitabile su
   GitHub Pages e apribile con doppio clic su `index.html`.
7. Materiale nuovo, stessa struttura: mai varianti quasi identiche degli
   originali (principio di design del progetto).
8. I dati stanno in file `.js` caricati con `<script src>`, **non** in `.json`:
   un `.json` richiede una richiesta di rete che il browser blocca aprendo
   `index.html` con doppio clic.

## Come lavorare su questo progetto (per Claude)
- L'area di lavoro parte vuota e da lì GitHub non è raggiungibile. La versione vera
  è su GitHub: chiedere a Rodrigo lo ZIP (Code → Download ZIP) e scompattarlo in
  una cartella nuova.
- La copia di `index.html` nel Progetto Claude non è completa (mancano `js/`, `data/`, `vendor/`) e non va mai
  consegnata a Rodrigo. Si parte sempre dallo ZIP del repository.
- Nel Progetto Claude stanno solo `index.html`, README e questo file; `data/`,
  `tests/` e `vendor/` stanno solo su GitHub.

## Come si consegna il lavoro a Rodrigo
Rodrigo carica su GitHub dal sito (Add file → Upload files), non da terminale.
- Mandare solo ciò che è cambiato: **una zip per cartella** (es. `tests.zip`) più
  i file singoli della radice (`index.html`, `CLAUDE_pdmgenerator.md`, `README.md`).
- Si trascinano le **cartelle intere**, mai i file contenuti: i file singoli
  finirebbero nella radice e `index.html` non troverebbe più i suoi script.
- Prima del Commit, nell'elenco di GitHub i nomi devono avere il prefisso della
  cartella (es. `data/categorizzazione.js`). Se non c'è, non fare Commit.
- Cartelle `css` e `js` (con `generators/`, `renderers/`, `export/`, `history/`, `backup/`): il prefisso nell'elenco deve essere
  `js/generators/griglie.js` ecc., UNA sola volta `js/`. Le zip si fanno con il contenuto della cartella al
  livello più alto (non una cartella `js` dentro `js.zip`), così "Estrai tutto" dà `js/generators/...`.
  Se manca un file, l'app mostra la banda rossa. `index.html` si carica PER ULTIMO.
  Con la config Firebase ora in `js/firebase-config.js`, la copia nel Progetto Claude di `index.html` non la contiene
  più: non scrivere nel Progetto i file `js/`.
- Se compaiono nella radice i doppioni `categorizzazione.js` e
  `fascicolo.test.js` (restano da un invio precedente), vanno eliminati.
- Dopo ogni aggiornamento: attendere 1-2 minuti, Ctrl+Shift+R, generare
  un'attività, scaricare e aprire un PowerPoint e un Word.
- Alternativa se serve: VS Code (clone, copia, commit, push) o pull request su un
  ramo separato collegando il repository `LatonShriek/PdMgenerator`.

## Struttura attuale
```
index.html            app: interfaccia, stato, motori (Fascicolo, categorizzazione), collegamenti
CLAUDE_pdmgenerator.md  questo file
README.md             presentazione e indice
docs/                 documentazione per argomento (struttura, attivita, esportazione-e-backup, fascicolo,
                      banche-e-categorie, interfaccia, test, pubblicazione-e-refactoring)
SPIEGAZIONE_SEMPLICE.md spiegazione in parole semplici
data/                 criteri, icone, lessico di controllo (file .js)
vendor/               librerie esterne con versione fissata (+ README.md, licenses/)
js/generators/        un file per esercizio (passo 4 fatto)
js/renderers/         un file per esercizio (passo 4 fatto)
js/export/            esportazioni pptx/docx (passo 5 fatto)
js/history/           cronologia condivisa e storico (passo 5 fatto)
js/progression.js, js/backup/, js/firebase-config.js   (passo 5 fatto)
GUIDA_BUONE_PRATICHE.md  guida di buone pratiche (documento vivo)
tests/                load-engine.js, fascicolo.test.js, backup.test.js, snapshots.json, golden-browser.js/.json
```

## Struttura obiettivo
```
index.html, css/
vendor/               # già fatto
data/                 # già fatto per criteri, icone, lessico; poi le banche del motore
js/generators/        # un file per esercizio (da GENERATORS)
js/renderers/         # un file per esercizio (da RENDERERS)
js/export/            # pptx.js, docx.js
js/history/           # anti-ripetizione: localStorage + Firestore
js/progression.js     # mantieni/sali di livello
js/state.js
tests/                # già fatto per il Fascicolo; poi gli altri generatori
docs/                 # README spezzato per argomento
```

## Piano a passi
- [x] 1. Test con seme fisso + regole di qualità + anti-ripetizione (per ora
      solo Fascicolo e dati; gli altri generatori usano `Math.random()` e vanno
      resi testabili al passo 4).
- [x] 2. Librerie in `vendor/` (versioni fissate, scaricate da npm) e riferite in
      locale. Esportazione pptx/docx provata in locale.
- [x] 3. Dati in `data/`: criteri di categorizzazione, mappa icone, lessico di
      controllo (in `.js`, vedi regola 8). Le banche del motore restano dentro.
- [x] 4. Estratti `js/generators/` e `js/renderers/` lungo le mappe esistenti, provato
      con il controllo "prima e dopo" in browser (183 casi identici). Il generatore casuale
      resta `Math.random()`: il seme si fissa solo nel test, non si è toccato il codice.
- [x] 5. Estratti esportazioni, cronologia, progressione, copia di sicurezza e config Firebase in `js/`;
      provato con 62 test, 183 casi "prima e dopo" e 20 esportazioni identiche.
- [x] 6. CSS in `css/style.css` (16 stati identici) e README diviso per argomento in `docs/` (il README
      resta come indice). La guida `GUIDA_BUONE_PRATICHE.md` resta nella radice.
- [x] 8. Motore del Fascicolo, costruttore Word e motore di categorizzazione in file propri (vedi sopra).
- [x] 7. Pulsanti "Salva copia di sicurezza" / "Ripristina" (file JSON) per il
      backup dello stato locale. Il blocco `backup.js` passa in un file proprio
      al passo 5.

## Cose aperte
- I file `.pptx` che non si aprivano bene in LibreOffice (segnalato da Rodrigo
  con screenshot): non chiarito se il problema era sul sito ancora vecchio o in
  locale. Da riprendere.
- Cronologia condivisa Firebase: da qui non si raggiunge la rete, quindi non
  provabile (ora l'app stessa avvisa dei rifiuti: pulsante "Verifica il salvataggio online"). Nello screenshot di Rodrigo (6 ott 2026) Firestore mostrava solo le
  raccolte `accessoHistory` (documenti 23, 28, gruppo-23, gruppo-28) e
  `catHistory`: mancavano `fascicoloHistory`, `materialHistory`, `groupProgress`.
  Il codice ingoia in silenzio i rifiuti di scrittura e "Connesso" significa solo
  accesso anonimo riuscito. Rodrigo cerca i gruppi "IS" e "PB": non sappiamo ancora
  dove siano (chiesti screenshot di `catHistory` e della scheda Regole).
  Possibile miglioramento: far mostrare all'app quando una scrittura online fallisce.
- Regole Firestore: da verificare nella console Firebase (vedi sotto).
- La regola "≥6 parole frequenti, Zipf ≥ 3.0" richiede il lessico
  `wordfreq`/Hunspell, che non è nel repository: i test non la controllano.
- Il crucipuzzle può piazzare meno parole di quelle scelte (minimo 8 nel test).

## Sicurezza e privacy
- La config Firebase nel file è pubblica per progetto (`pdmgenerator`);
  la protezione sono le **regole Firestore**. Con auth anonima, regole troppo
  larghe rendono la cronologia dei gruppi leggibile da chiunque abbia il link.
  Verificarle.
- Nomi/numeri di gruppo non devono contenere dati identificativi di pazienti.
