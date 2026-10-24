# Test e controlli "prima e dopo"

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## Test

I test verificano che l'app produca **sempre lo stesso materiale a parità di seme**, così dopo ogni passo di riordino si può dimostrare che nulla è cambiato.

```
node --test tests/*.test.js
```

Serve solo Node (versione 20 o successiva); non c'è niente da installare. Il risultato atteso è `fail 0` (94 test alla data di questo aggiornamento).

Cosa controllano:
- **Determinismo**: stesso seme e settimana → fascicolo identico; semi diversi → fascicoli diversi.
- **Impronte (snapshot)**: gli hash del fascicolo per le settimane 1–12 e 3 semi sono in `tests/snapshots.json`. Se un'impronta cambia, il test fallisce e indica quale settimana. Se la modifica è voluta, si rigenerano con `UPDATE_SNAPSHOTS=1 node --test tests/*.test.js`.
- **Struttura e regole di qualità** per ogni settimana: 3 griglie 25×12 con 8 sequenze orizzontali e 8 verticali, 12 bersagli distinti, anagrammi corretti e senza doppioni, 10 calcoli esatti e mai negativi, categorie distinte, consegne lessicali senza doppioni.
- **Anti-ripetizione**: parole, categorie e chiavi lessicali già usate non riappaiono; se il materiale finisce l'app lo segnala in `notices`, non ripesca in silenzio.
- **Banche e dati**: struttura delle banche di parole e categorie, validità e conteggi dei file in `data/`.
- **Moduli di ragionamento verbale** (`classificazioni.test.js`, `intruso-concettuale.test.js`, `analogie.test.js`): risposta ricalcolata in modo indipendente dal generatore (albero completo / banca), cancelli di livello, scelta multipla, anti-ripetizione, determinismo, integrità delle banche.
- **Copia di sicurezza** (`tests/backup.test.js`): andata e ritorno (salva, svuota, ripristina = stessi dati), unione senza doppioni e senza cancellare, ripristino ripetuto che non cambia più nulla, unione reale delle progressioni (usa il vero `progressMerge` estratto da `index.html`), nome gruppo non sovrascritto, file sbagliato o ostile rifiutato o ignorato.

**Controllo "prima e dopo" in browser** (`tests/golden-browser.js`): apre `index.html` in Chromium senza rete, fissa il generatore casuale con un seme, genera ogni esercizio a 11 livelli e 2 semi (più le opzioni dei controlli e le 12 settimane del fascicolo, 271 casi) e confronta le impronte del materiale e di ciò che l'app disegna con `tests/golden-browser.json`. Serve a dimostrare che spostare il codice non cambia l'output. Richiede Playwright con Chromium (lo lancia Claude; non serve per usare l'app): `node tests/golden-browser.js` confronta, con `--update` riscrive le impronte (solo se il cambiamento è voluto). Nella categorizzazione le immagini arrivano in ritardo, quindi si confronta solo ciò che viene disegnato.

**Controllo dell'aspetto** (`tests/style-browser.js`): per ogni elemento della pagina calcola gli stili che il browser applica davvero e confronta l'impronta con `tests/style-browser.json` (avvio e 7 esercizi, schermo da computer e da telefono). Si è scelto questo invece delle schermate a pixel perché queste ultime cambiano a caso di qualche pixel per il disegno dei caratteri. Non copre le regole di stampa.

**Avviso sul salvataggio online** (`tests/online-browser.js`): con un Firestore finto che rifiuta una raccolta, verifica che il pulsante "Verifica il salvataggio online" e l'avviso rosso lo dicano, e che spariscano quando le regole sono a posto.

**Controllo delle esportazioni** (`tests/export-browser.js`): per 6 esercizi a 3 livelli e per 2 settimane del fascicolo preme il pulsante di esportazione, intercetta i file scaricati (PowerPoint e Word) e confronta l'impronta di ogni parte interna con `tests/export-browser.json` (escluse le date di creazione). Stesso modo d'uso di `golden-browser.js` (`--update` per riscrivere le impronte).

Limiti noti (da dichiarare con onestà):
- I test Node coprono il Fascicolo, i dati e la copia di sicurezza. Gli altri esercizi sono coperti dal controllo "prima e dopo" in browser (`tests/golden-browser.js`, vedi sotto): confronta le impronte, non verifica le regole cliniche di ciascuno.
- La regola "12 parole valide, ≥ 6 frequenti (Zipf ≥ 3.0)" richiede il lessico `wordfreq`/Hunspell, che non è nel repository: non è verificata dai test.
- Il crucipuzzle può piazzare meno parole di quelle scelte (piazzamento greedy); il test fissa il comportamento attuale (minimo 8) senza modificarlo.
