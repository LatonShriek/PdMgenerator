# Generatore attività — PdM CDCD

Web app (single-file HTML) per generare materiale di stimolazione cognitiva per gruppi MCI/DNMi/DCL (Percorso Diagnostico-terapeutico-assistenziale per il Deterioramento Cognitivo). Sostituisce la creazione manuale di varianti "fresche" dello stesso esercizio: stessa struttura e stesso livello di difficoltà della sessione originale, contenuto sempre nuovo, per ripetere la stimolazione senza effetto apprendimento/memorizzazione da parte del gruppo.

Non c'è backend: è un unico file `index.html` che gira interamente nel browser (JS vanilla), con qualche libreria caricata da CDN solo per le esportazioni e per la cronologia condivisa opzionale.

## Cosa fa, in sintesi

1. Il terapista sceglie un esercizio dalla lista in sidebar e un livello di difficoltà (1–32, scala comune a tutti gli esercizi tranne il Fascicolo).
2. L'app genera materiale procedurale a quel livello — mai identico a una generazione precedente — e lo mostra a schermo, pronto per la seduta (in presenza o in videochiamata).
3. Il terapista può rigenerare all'infinito, mostrare risposta/regola, esportare in PowerPoint (o in Word per il Fascicolo), stampare, e tenere uno storico per gruppo/paziente così lo stesso materiale non viene mai riproposto.
4. Un pannello di "progressione del gruppo" registra l'esito di ogni seduta e suggerisce se mantenere il livello o salire.

## I 7 tipi di attività

| id | Nome | Cosa allena |
|---|---|---|
| `categorizzazione` | Categorizzazione | Dividere 6 immagini (pittogrammi) in 2 gruppi da 3, secondo un criterio semantico — 142 criteri reali raccolti dai materiali originali di Rodrigo, con pool ampliati per non ripetere sempre la stessa coppia |
| `intruso` | Intruso percettivo | Trovare l'unico elemento che compare una sola volta (tutti gli altri ≥2) in una schermata di simboli. **Punteggio unico di difficoltà** (`INTRUSO_SCORE_W`): lunghezza dell'elemento (1 simbolo fino al livello 8, 2 dal 9, 3 dal 21, uguale in tutte le schermate della sessione) + famiglia di stimoli (sblocco tardivo, riconoscibilità del glifo) + somiglianza dei tipi (quota crescente di tipi «quasi uguali») + numerosità. L'obiettivo di punteggio è **lineare** nel livello (`INTRUSO_TARGET_D`); la numerosità è la variabile che si risolve, per cui a ogni cambio di lunghezza il numero di elementi ricade (dente di sega) e nella stessa schermata le famiglie più ostiche hanno meno elementi. Numerosità solo su valori che danno griglia piena (15, 16, 18, 20, 21, 24, 25, 27, 28, 30). Gli elementi di 2–3 glifi di famiglie a simboli (zodiaco, semi, dadi, forme…) sono racchiusi in una cornice sottile, in anteprima e nel PPTX |
| `griglie` | Griglie-Conteggio | Ricerca visiva e conteggio in una griglia, con 10 consegne selezionabili sulla stessa griglia. **Punteggio unico per consegna** = stimolo (simbolo, sfondo, bordo, colore del simbolo, dimensione, stile del bordo) + molteplicità (numero di condizioni insieme) + astrazione (posizione, negazione, adiacenza, regole di forma: esclusione, alternativa, doppio conteggio, confronto, «saltando i primi k», per riga/colonna, «come il vicino»). Le 10 consegne seguono una rampa di punteggio centrata su una media lineare nel livello (`GRID_SCORE_MU`); almeno metà usano i colori (sfondo, bordo, colore del simbolo) fin dal livello 1, fino al 70%; l'astrazione massima ammessa cresce col livello; niente consegne quasi duplicate (stesso bersaglio con vincoli contenuti l'uno nell'altro). 3 colori per canale, dimensione, sfondo vuoto e stile del bordo entrano un po' alla volta; «Mostra risposta» mostra il risultato specifico |
| `serie` | Serie attentive alternate | Attenzione alternata / task-switching / go–no-go, con 32 regole di risposta crescenti (mano dx/sx, sì/no, doppia caratteristica, inibizione incrociata) |
| `inversione` | Inversione e riordino | Span e manipolazione di sequenze: anagrammi/sillabe di parole italiane reali, con pool di parole validate per frequenza d'uso |
| `accesso` | Accesso lessicale online | Denominazione con cueing graduato (facilitazioni progressive) |
| `fascicolo` | Fascicolo esercizi a casa | Fascicolo stampabile in Word per gli esercizi a domicilio, con progressione settimanale automatica (vedi sotto) |

## Logica di generazione e difficoltà

- Scala unica **1–32** (`MAX_LEVEL`) per tutti gli esercizi eccetto il Fascicolo, che invece usa una **settimana** (1–12, `FASCICOLO_MAX_WEEK`) come proxy di difficoltà crescente.
- Ogni esercizio ha un generatore dedicato (mappa `GENERATORS`) e un renderer dedicato (mappa `RENDERERS`); i parametri di difficoltà si sbloccano gradualmente col livello. Intruso e Griglie usano un **punteggio unico di difficoltà** con costanti di taratura esposte in testa alle rispettive sezioni.
- Il livello selezionato è **ricordato per esercizio** (`state.levels[exId]`), non condiviso: passando da un esercizio all'altro si ritorna al livello a cui si era arrivati con quello specifico.
- Regola guida del progetto (dai principi di design): materiale nuovo, stessa struttura — non varianti quasi identiche del materiale originale; l'input del paziente precede sempre lo scaffolding del terapista; tutto il testo generato deve restare modificabile a mano durante la seduta; formattazione essenziale, non elaborata.

## Anti-ripetizione (storico per gruppo/paziente)

Perché lo stesso criterio/parola/griglia non venga riproposto allo stesso gruppo, nemmeno a distanza di mesi o a un livello diverso:

- Si inserisce un **nome gruppo** (o, in alternativa, un **numero gruppo**) nella sidebar: questo è la chiave della cronologia.
- Ogni generazione registra cosa è stato usato (parole, criteri, griglie, ecc.) e lo esclude dalle generazioni successive per quel gruppo, con un tetto (`cap`) diverso per tipo di materiale.
- Funziona **sempre in locale** (localStorage del browser) anche senza alcuna configurazione.
- Se configurato **Firebase/Firestore** (vedi sotto), la cronologia è anche **condivisa tra colleghi e dispositivi diversi**: le due copie (locale + remota) vengono unite automaticamente.
- Il pulsante "Azzera il materiale già proposto a questo gruppo" svuota la cronologia (locale e, se attiva, remota) per il gruppo corrente.

### Configurazione Firebase (opzionale, una tantum)

Per abilitare la cronologia condivisa tra dispositivi/colleghi:
1. Creare un progetto Firebase (o riusarne uno esistente) su console.firebase.google.com.
2. Abilitare Firestore Database e Authentication → metodo "Anonimo".
3. Incollare la config del progetto nell'oggetto `firebaseConfig` in cima alla sezione "Cronologia condivisa" del file.
4. Impostare le regole Firestore per consentire lettura/scrittura solo a utenti autenticati (anche anonimi), sulle collezioni `catHistory`, `accessoHistory`, `fascicoloHistory`, `materialHistory`, `groupProgress`.

Finché `firebaseConfig` resta vuoto, questa parte non fa nulla e l'app funziona come sempre, solo senza memoria tra dispositivi diversi.

## Progressione del gruppo (mantieni / sali di livello)

Pannello dedicato (per ogni esercizio a livelli, non per il Fascicolo):
- Dopo la seduta, il terapista registra la **% di riuscita** del gruppo al livello appena svolto.
- L'app calcola se il gruppo ha raggiunto una soglia (default 80%) per un certo numero di sedute consecutive (default 1, regolabile 1–3) e **suggerisce** "sali" o "mantieni".
- Il terapista può confermare o forzare la scelta opposta con l'interruttore; la decisione vale finché non arriva una nuova registrazione.
- I dati (log delle sedute, soglie, livello corrente per esercizio e per gruppo) sono salvati per gruppo, in locale, e sincronizzati su Firestore se la cronologia condivisa è attiva.
- L'app ricorda anche, per ogni gruppo, l'ultimo livello generato per ciascun esercizio (e l'ultima settimana per il Fascicolo, comprese le singole parti se fatte avanzare separatamente): riaprendo l'app con lo stesso nome gruppo si riparte da dove si era arrivati.

## Esportazione

- **Tutti gli esercizi a schermo** → **PowerPoint** (`pptxgenjs`, generato lato client, nessun server): riproduce fedelmente ciò che è a video, con nome file basato sul numero fisso dell'esercizio, livello e numero gruppo (es. `3 - Griglie-Conteggio.1(5).pptx`).
- **Fascicolo esercizi a casa** → **Word (.docx)** (libreria `docx`, con fallback automatico da CDN alternativo se il primo non si carica), fedele al formato originale dei fascicoli cartacei usati finora. Il documento viene generato sia in versione "esercizi" che in versione "con soluzioni".
- Esportazione interamente client-side, senza inviare dati a un server.

## Il modulo "Fascicolo esercizi a casa"

Modulo più recente e più strutturato del generatore, pensato per produrre il fascicolo stampabile che il paziente svolge autonomamente a casa tra una seduta e l'altra.

- Basato su 15 fascicoli originali di Rodrigo (due serie parallele, verosimilmente due pazienti), usati per ricostruire template e logica di progressione.
- Ogni fascicolo settimanale contiene più blocchi, tutti generati algoritmicamente (nessun segnaposto):
  - due esercizi di ricerca/conteggio di sequenze in griglia di simboli (uno a target singolo per riga, uno multi-target con 12 sequenze su più direzioni);
  - un crucipuzzle di parole italiane reali nascoste in una griglia di lettere;
  - un esercizio di sequenziamento (unire in ordine numeri e/o lettere, con istruzioni che variano per settimana);
  - un **labirinto generato algoritmicamente** (non un'immagine fissa), disegnato come SVG e risolto via BFS per produrre la versione con soluzione; dimensione crescente con la settimana;
  - un blocco lessicale (iniziali, penultima lettera, lettere unite/disgiunte...) che varia schema a seconda della settimana;
  - categorie semantiche da completare;
  - anagrammi di parole italiane reali, con difficoltà di scrambling crescente (lettere → sillabe → scramble completo);
  - una catena di calcoli aritmetici.
- La difficoltà di ciascun blocco (dimensione griglia, alfabeto di simboli, lunghezza sequenze, dimensione labirinto, ecc.) è determinata da `weekParams(week)` in funzione della settimana.
- Oltre la settimana 8 la progressione resta generica e riutilizzabile all'infinito: non viene salvato uno stato di avanzamento specifico per singolo paziente oltre quel punto.
- Ogni blocco (griglie, crucipuzzle, labirinto, ecc.) può essere **rigenerato singolarmente** e "fatto avanzare" a una settimana diversa dal resto del fascicolo, restando disallineato dal fascicolo complessivo finché non viene rigenerato tutto insieme.
- **Mai lo stesso materiale due volte allo stesso gruppo** (né in pagine diverse né in fascicoli diversi): la cronologia (`fascicoloHistory`) registra le parole degli anagrammi (`usedAnagramWords`) e del crucipuzzle (`usedCrucipuzzleWords`), le categorie (`usedCategories`, comprese le categorie larghe delle consegne lettera+categoria) e le consegne dell'accesso lessicale (`usedLexicalKeys`). Il motore le esclude tutte e le parole degli anagrammi non tornano nel crucipuzzle dello stesso fascicolo. **Nessun ripescaggio**: se il materiale nuovo finisce, la pagina ha meno elementi e un avviso arancione in cima al fascicolo lo segnala (`deck.notices`); si riparte con "Azzera il materiale già proposto". Le banche sono state ampliate (~650 parole comuni aggiunte a `WORD_BANK_SCORED` via `WORD_BANK_EXTRA`; 9–14 categorie per fascia settimanale) per reggere circa due cicli completi di 12 settimane. Senza nome/numero gruppo resta attivo solo il controllo dentro lo stesso fascicolo. Il crucipuzzle ha 10 parole target alla settimana 1, fino a 18 alla 12. Nel Word ogni esercizio sta nella propria pagina, anche nella versione con soluzioni (griglie e immagine del sequenziamento ridotte per fare posto al testo di soluzione; blocco lessicale con carattere più piccolo per stare in una pagina); verificato con LibreOffice su tutte le 12 settimane. Limite noto: nella soluzione del crucipuzzle possono comparire parole nate per caso dalle lettere di riempimento, non controllate.
- Le parti procedurali (griglie, labirinto, calcolo) non hanno bisogno di storico perché sono sempre generate da zero.

## Categorizzazione — libreria criteri

- 142 criteri reali estratti e corretti da 16 file "Categorizzazione.pptx" originali di Rodrigo, ciascuno con un pool ampliato di item (5+ per lato) così ogni generazione pesca una combinazione diversa senza inventare nuovi criteri.
- Le immagini sono pittogrammi **OpenMoji** (CC BY-SA 4.0), recuperati via fetch con **fallback testuale** se l'immagine non è disponibile.

## Interfaccia

- Sidebar: elenco esercizi, controllo livello (o settimana per il Fascicolo), controlli specifici dell'esercizio attivo, azioni (genera, mostra risposta/regola, esporta, storico generazioni, stampa), campo nome/numero gruppo, pannello di progressione.
- Area principale ("stage"): titolo e metadati dell'esercizio, eventuale box regola/istruzioni, area di rendering del materiale, navigazione tra schermate multiple (usata da "Serie attentive alternate").
- Storico generazioni: elenco locale (per questo browser) di ogni generazione fatta, con esercizio, livello e riepilogo — separato dallo storico anti-ripetizione usato per escludere materiale già proposto.
- Stile grafico volutamente sobrio/clinico (palette verde salvia, tipografia serif per i titoli), pensato per essere leggibile sia a schermo che in stampa/PowerPoint.

## Stack tecnico

- HTML + CSS + JavaScript vanilla in un unico file, nessuna build, nessun framework.
- Librerie da CDN: `pptxgenjs` (export PowerPoint), `docx` + `FileSaver.js` (export Word del Fascicolo, con fallback CDN), Firebase (`app`, `auth`, `firestore` — solo se configurato).
- Persistenza: `localStorage` per stato/storico/progressione locali; Firestore opzionale per la condivisione tra dispositivi/colleghi (progetto Firebase dedicato "pdmgenerator", separato da altri progetti personali di Rodrigo).
- Nessun account/login per l'utente finale: l'autenticazione Firebase, quando attiva, è anonima e serve solo a autorizzare le scritture su Firestore.

## Come lavora Rodrigo su questo progetto

- Valida logica e struttura di ogni nuovo esercizio/modulo tramite cicli di feedback iterativi, condividendo esempi reali (fascicoli, pptx di categorizzazione) da cui derivare template e regole.
- Approccio di sviluppo: prima si valida modello dati e logica in conversazione, poi si passa all'implementazione.
- Correzioni tecnicamente precise: identifica problemi strutturali/metodologici, non solo di superficie.
