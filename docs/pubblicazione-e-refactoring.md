# Pubblicazione, modifiche, stato del refactoring, sicurezza

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## Pubblicazione e aggiornamento

L'app è pubblicata con **GitHub Pages** dal ramo `main`: ogni modifica caricata viene ripubblicata automaticamente in 1–2 minuti (lo stato "pending/in progress" accanto al commit è la pubblicazione in corso). Dopo ogni aggiornamento: ricaricare il sito con Ctrl+Shift+R, generare un'attività e scaricare un PowerPoint e un Word, aprirli.

Quando si carica su GitHub vanno caricate **le cartelle intere** (`css`, `data`, `js`, `tests`, `vendor`; dentro `js` ci sono le sottocartelle `engine`, `generators`, `renderers`, `export`, `history`, `backup`), non i file che contengono: i file singoli finirebbero nella cartella principale e `index.html` non troverebbe più i suoi script.

## Come modificare i dati e le librerie

- **Criteri di categorizzazione** → `data/categorizzazione.js`. Si modifica senza toccare il codice; mantenere la struttura (`label`, lati `a` e `b` con `it` ed `en`). Dopo la modifica lanciare i test.
- **Icone** → `data/openmoji-map.js`: aggiungere la coppia `"termine inglese": "nome-icona-openmoji"`.
- **Banche di parole e categorie del Fascicolo** → per ora dentro il motore in `js/engine/engine.js` (`WORD_BANK_EXTRA`, `CATEGORY_LETTER_BANK`, `PHONEMIC_DB`, `CATEGORY_POOL`…). Non alterare le regole di qualità senza una richiesta esplicita; dopo ogni modifica lanciare i test.
- **Librerie** → vedi `vendor/README.md`: per aggiornarne una si scarica la nuova versione in `vendor/`, si cambia il nome del file e la riga `<script>` in `index.html`, poi si prova esportazione in PowerPoint e Word e la cronologia.

## Stato del refactoring

Obiettivo: rendere il codice leggibile, correggibile e professionale **senza cambiare ciò che l'app produce**. Si procede a passi piccoli, ognuno con test e app funzionante alla fine (dettagli e regole di lavoro in `REGOLE_DI_LAVORO.md`).

| Passo | Cosa | Stato |
|---|---|---|
| 1 | Test con seme fisso sul Fascicolo e sulle regole di qualità | fatto (Fascicolo; gli altri generatori al passo 4) |
| 2 | Librerie in `vendor/` con versioni fissate | fatto |
| 3 | Dati in `data/` | fatto per criteri, icone e lessico di controllo; le banche del motore restano dentro l'engine per ora |
| 4 | Un file per generatore e per renderer (`js/generators/`, `js/renderers/`) | fatto (provato con il controllo "prima e dopo": 183 casi identici; i generatori sono ancora a `Math.random()`, il seme si fissa solo nel test) |
| 5 | Esportazioni, cronologia, progressione e copia di sicurezza in file propri | fatto (`js/export/`, `js/history/`, `js/progression.js`, `js/backup/`, `js/firebase-config.js`; provato con 62 test, 183 casi "prima e dopo" e 20 esportazioni identiche) |
| 6 | CSS in file separato; README spezzato per argomento in `docs/` | fatto (`css/style.css`, 16 stati identici; README diviso in `docs/`, la guida resta nella radice) |
| 7 | Pulsante "Esporta/Importa tutto" per il backup dello stato locale | fatto (Salva / Ripristina copia di sicurezza, con test; la logica sta in `js/backup/backup.js` dal passo 5) |
| 8 | Motore del Fascicolo, costruttore Word e motore di categorizzazione fuori da `index.html` | fatto (`js/engine/engine.js`, `js/export/docbuilder.js`, `js/generators/categorizzazione.js`; spostamento identico, 79 test + 227 casi + 26 esportazioni + 20 stati; `index.html` da 3247 a 1345 righe) |
| 9 | Ultimi script inline di `index.html` in file propri | fatto (`data/base.js`, `js/util.js`, `js/state.js`, `js/level-notes.js`, `js/history/fascicolo-history.js`, `js/registry.js`, `js/controls.js`, `js/app.js`; spostamento identico: 85 test, 249 casi, 29 esportazioni, 22 stati; `index.html` da ~1359 a ~190 righe) |
| 10 | Banca di parole del Fascicolo in `data/` | fatto (`data/fascicolo-parole.js`; 85 test, 249 casi, 29 esportazioni, 22 stati identici; le altre banche del motore restano da spostare) |

## Sicurezza, privacy e licenze

- **Nessun dato clinico lascia il browser**, salvo la cronologia opzionale su Firestore. Nomi e numeri di gruppo **non devono contenere dati identificativi di pazienti**: il nome gruppo diventa l'identificativo del documento online e finisce anche nel file della copia di sicurezza.
- La configurazione Firebase nel file è **pubblica per natura** (progetto `pdmgenerator`): non è una password. La protezione sono le **regole Firestore**: con autenticazione anonima, regole troppo larghe rendono la cronologia dei gruppi leggibile da chiunque abbia l'indirizzo. Da verificare nella console Firebase.
- **Licenze**: i pittogrammi **OpenMoji** sono CC BY-SA 4.0 e vanno citati una sola volta nel fascicolo/deck esportato, non su ogni slide. Le librerie in `vendor/` hanno licenza MIT (`pptxgenjs`, `docx`, `FileSaver`) e Apache-2.0 (Firebase); i testi sono in `vendor/licenses/` e la tabella versioni in `vendor/README.md`.
