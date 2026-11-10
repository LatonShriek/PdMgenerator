# Esportazione e copia di sicurezza

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## Esportazione

- **Tutti gli esercizi a schermo** → **PowerPoint** (`pptxgenjs`, generato lato client, nessun server): riproduce fedelmente ciò che è a video, con nome file basato sul numero fisso dell'esercizio, livello e numero gruppo (es. `3 - Griglie-Conteggio.1(5).pptx`).
- **Fascicolo esercizi a casa** → **Word (.docx)** (libreria `docx`; se per qualche motivo non si carica da `vendor/`, un piccolo script di sicurezza in `index.html` prova a scaricarla da unpkg.com), fedele al formato originale dei fascicoli cartacei usati finora. Il documento viene generato sia in versione "esercizi" che in versione "con soluzioni".
- **Serie attentive alternate**: ogni slide-stimolo ha una transizione "Push" (la slide nuova spinge via la precedente), così in proiezione si vede il cambio anche quando due stimoli di fila sono identici. PptxGenJS non gestisce le transizioni: `js/export/serie.js` le aggiunge nel file già generato (con JSZip, già incluso nella libreria). Se l'aggiunta fallisce, si scarica comunque il file senza transizioni.
  - **Presentazione automatica (opzione, solo nel PowerPoint)**: con la casella attiva (e un intervallo scelto, 0,5–30 s) le slide avanzano da sole all'intervallo scelto. Un tocco sullo schermo mette in pausa (salta a una copia «in pausa» della slide) e un altro tocco riparte dallo stimolo successivo; il file si chiama «… automatica Xs.pptx». Il comportamento del tocco non è provato su PowerPoint reale in sviluppo (verificato su XML e LibreOffice): provarlo prima della seduta. In PowerPoint il tasto S ferma/riavvia le temporizzazioni. **Google Presentazioni** ignora i timer e il blocco del clic: spuntando «Per Google Presentazioni» il file è senza timer e pausa (si scorre con la freccia) e si chiama «… per Google Xs.pptx»; l'avanzamento automatico si imposta in Google con Condividi › Pubblica sul web (scelte 1, 2, 3, 5, 10, 15, 30 s). Non ancora provato su Google reale.
- **Numerosità manuale**: in ogni esercizio il numero di elementi si può scrivere a mano (limiti: 4–40, Serie 20–600, Inversione 2–20, Accesso 1–30); con i livelli bassi i banchi di parole possono dare meno elementi del richiesto (c'è una nota nei controlli).
- Esportazione interamente client-side, senza inviare dati a un server.

## Copia di sicurezza (salva e ripristina i dati)

In fondo alla barra laterale ci sono due pulsanti: **Salva copia di sicurezza** e **Ripristina da una copia di sicurezza**.

- **Cosa salva**: in un solo file `PdM-copia-di-sicurezza-AAAA-MM-GG.json` (cartella Download) mette la memoria del materiale già proposto a ogni gruppo, la progressione e i livelli di ogni gruppo, lo storico delle generazioni, nome e numero gruppo. Non legge nient'altro del browser. Dopo il salvataggio l'app elenca i **gruppi trovati**: è anche un modo per vedere quali gruppi esistono davvero su quel browser.
- **Cosa fa il ripristino**: prima mostra un riepilogo (data della copia, numero di voci, gruppi) e chiede conferma. Poi **aggiunge ciò che manca e non cancella niente**: le parole e i criteri già proposti si uniscono senza doppioni, le sedute registrate si uniscono con la stessa regola della sincronizzazione (`progressMerge`), lo storico generazioni si unisce (massimo 200, dal più recente). Nome e numero gruppo si riempiono solo se sono vuoti. Ripristinare due volte la stessa copia non cambia più nulla.
- **Se Firebase è connesso**, il ripristino prova anche a copiare i dati online e dice quante scritture sono riuscite e quante no (con il codice di errore): così un rifiuto delle regole non resta silenzioso.
- **Sicurezza del file importato**: è trattato come dato non fidato. Si accettano solo le chiavi note, ogni contenuto viene controllato, nessuna parte del file viene eseguita; file di un'altra app, danneggiati o creati da una versione più recente vengono rifiutati con un messaggio chiaro.
- **Privacy**: il file contiene i nomi dei gruppi. Va tenuto al sicuro e nei nomi non vanno mai dati che identificano i pazienti.
- **Dove sta il codice**: logica pura in `js/backup/backup.js` (provata da `tests/backup.test.js`), collegamento alla pagina in `js/backup/backup-ui.js`, pulsanti e loro eventi nello script principale di `index.html`.
