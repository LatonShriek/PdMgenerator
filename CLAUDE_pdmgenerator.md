# CLAUDE.md — Generatore attività PdM CDCD

Leggi questo file all'inizio di ogni sessione. Aggiornalo quando cambia qualcosa
(spunta i passi fatti, aggiorna "Stato attuale").

## Cos'è
Web app (JS vanilla, nessun backend) che genera materiale di stimolazione
cognitiva per gruppi MCI/DNMi/DCL: 7 tipi di attività (categorizzazione,
intruso, griglie, serie attentive, inversione, accesso lessicale, fascicolo a
casa), 32 livelli, anti-ripetizione per gruppo, progressione di gruppo,
esportazione PowerPoint (pptxgenjs) e Word (docx). Cronologia in
`localStorage`, condivisione opzionale via Firebase/Firestore.
Il README.md documenta in dettaglio logica, banche di parole e regole di
qualità: **va letto prima di toccare i generatori e non va perso.**

## Stato attuale (da rifattorizzare)
- `index.html` ~540 KB, ~15.400 righe, 13 blocchi `<script>`.
- Righe lunghissime (fino a ~28.000 caratteri): sono dati incorporati
  (criteri, categorie, lessico).
- Punti di giunzione già esistenti: mappe `GENERATORS` e `RENDERERS`,
  `weekParams(week)`, sezioni commentate.
- Librerie da CDN esterni: pptxgenjs 3.12.0, docx 8.5.0, FileSaver 2.0.5,
  Firebase 10.14.1 (compat).
- Pittogrammi OpenMoji (CC BY-SA 4.0) con fallback testuale.

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
5. Spiega le scelte in italiano, in modo breve e verificabile.
6. Nessun build tool pesante: moduli ES nativi, ospitabile su GitHub Pages.
7. Materiale nuovo, stessa struttura: mai varianti quasi identiche degli
   originali (principio di design del progetto).

## Struttura obiettivo
```
index.html, css/
vendor/               # librerie scaricate con versione fissata (no CDN a runtime)
data/                 # criteri, categorie, lessico, pittogrammi in JSON
js/generators/        # un file per esercizio (da GENERATORS)
js/renderers/         # un file per esercizio (da RENDERERS)
js/export/            # pptx.js, docx.js
js/history/           # anti-ripetizione: localStorage + Firestore
js/progression.js     # mantieni/sali di livello
js/state.js
tests/                # generatori con seme fisso, regole di qualità
docs/                 # README spezzato per argomento
```

## Piano a passi
- [x] 1. Test con seme fisso sui generatori + test sulle regole di qualità.
      Fatto per il **Fascicolo** (`tests/`, `node --test tests/*.test.js`). Restano da coprire
      gli altri generatori (usano `Math.random()` e `state`/DOM): serve iniettare l'RNG, da fare
      all'inizio del passo 4. Il controllo Zipf≥3.0 / parole valide richiede il lessico esterno.
- [x] 2. Scaricare le librerie in `vendor/` (versioni fissate) e riferirle in locale.
      Fatto da npm (vedi `vendor/README.md`). Esportazione pptx/docx provata in locale.
- [ ] 3. Spostare i dati (criteri, categorie, lessico) in `data/`.
      Fatto: `CATEGORIZZAZIONE_LIBRARY` (190 criteri), `OPENMOJI_ICON_MAP` e `INV_REAL_BLOCK` in
      `data/*.js`, caricati con `<script src>` prima degli script che li usano (scelta: .js e non
      .json, così il doppio clic su index.html continua a funzionare).
      Restano nell'engine (volutamente, per tenerlo autonomo e testabile in Node): `WORD_BANK_EXTRA`,
      `CATEGORY_LETTER_BANK`, `PHONEMIC_DB` e le altre banche. Da spostare solo insieme al passo 4,
      quando l'engine diventa un modulo.
- [ ] 4. Estrarre `js/generators/` e `js/renderers/` lungo le mappe esistenti.
- [ ] 5. Estrarre esportazioni, cronologia, progressione.
- [ ] 6. CSS in file separato; spezzare il README in `docs/`.
- [ ] 7. Pulsante "Esporta/Importa tutto in JSON" per il backup dello stato locale.

## Sicurezza e privacy
- La config Firebase nel file è pubblica per progetto (`pdmgenerator`);
  la protezione sono le **regole Firestore**. Con auth anonima, regole troppo
  larghe rendono la cronologia dei gruppi leggibile da chiunque abbia il link.
  Verificarle.
- Nomi/numeri di gruppo non devono contenere dati identificativi di pazienti.
