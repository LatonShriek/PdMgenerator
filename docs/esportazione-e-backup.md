# Esportazione e copia di sicurezza

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## Esportazione

- **Tutti gli esercizi a schermo** → **PowerPoint** (`pptxgenjs`, generato lato client, nessun server): riproduce fedelmente ciò che è a video, con nome file basato sul numero fisso dell'esercizio, livello e numero gruppo (es. `3 - Griglie-Conteggio.1(5).pptx`).
- **Fascicolo esercizi a casa** → **Word (.docx)** (libreria `docx`; se per qualche motivo non si carica da `vendor/`, un piccolo script di sicurezza in `index.html` prova a scaricarla da unpkg.com), fedele al formato originale dei fascicoli cartacei usati finora. Il documento viene generato sia in versione "esercizi" che in versione "con soluzioni".
- Esportazione interamente client-side, senza inviare dati a un server.

## Copia di sicurezza (salva e ripristina i dati)

In fondo alla barra laterale ci sono due pulsanti: **Salva copia di sicurezza** e **Ripristina da una copia di sicurezza**.

- **Cosa salva**: in un solo file `PdM-copia-di-sicurezza-AAAA-MM-GG.json` (cartella Download) mette la memoria del materiale già proposto a ogni gruppo, la progressione e i livelli di ogni gruppo, lo storico delle generazioni, nome e numero gruppo. Non legge nient'altro del browser. Dopo il salvataggio l'app elenca i **gruppi trovati**: è anche un modo per vedere quali gruppi esistono davvero su quel browser.
- **Cosa fa il ripristino**: prima mostra un riepilogo (data della copia, numero di voci, gruppi) e chiede conferma. Poi **aggiunge ciò che manca e non cancella niente**: le parole e i criteri già proposti si uniscono senza doppioni, le sedute registrate si uniscono con la stessa regola della sincronizzazione (`progressMerge`), lo storico generazioni si unisce (massimo 200, dal più recente). Nome e numero gruppo si riempiono solo se sono vuoti. Ripristinare due volte la stessa copia non cambia più nulla.
- **Se Firebase è connesso**, il ripristino prova anche a copiare i dati online e dice quante scritture sono riuscite e quante no (con il codice di errore): così un rifiuto delle regole non resta silenzioso.
- **Sicurezza del file importato**: è trattato come dato non fidato. Si accettano solo le chiavi note, ogni contenuto viene controllato, nessuna parte del file viene eseguita; file di un'altra app, danneggiati o creati da una versione più recente vengono rifiutati con un messaggio chiaro.
- **Privacy**: il file contiene i nomi dei gruppi. Va tenuto al sicuro e nei nomi non vanno mai dati che identificano i pazienti.
- **Dove sta il codice**: logica pura in `js/backup/backup.js` (provata da `tests/backup.test.js`), collegamento alla pagina in `js/backup/backup-ui.js`, pulsanti e loro eventi nello script principale di `index.html`.
