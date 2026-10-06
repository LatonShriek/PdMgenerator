# Generatore attività — PdM CDCD

Web app per generare materiale di stimolazione cognitiva per gruppi MCI/DNMi/DCL (Percorso Diagnostico-terapeutico-assistenziale per il Deterioramento Cognitivo). Sostituisce la creazione manuale di varianti "fresche" dello stesso esercizio: stessa struttura e stesso livello di difficoltà della sessione originale, contenuto sempre nuovo, per ripetere la stimolazione senza effetto apprendimento/memorizzazione da parte del gruppo.

Non c'è backend: l'app gira interamente nel browser (JavaScript vanilla, nessun framework, nessuna build). Le librerie per le esportazioni e per la cronologia condivisa opzionale sono **incluse nel repository** (`vendor/`), quindi l'app non dipende da CDN esterni (resta solo una rete di sicurezza per la libreria `docx`, vedi "Esportazione").

> **Per chi mantiene il progetto:** leggere questo file prima di toccare i generatori, le banche di parole o le regole di qualità. Le regole di lavoro e lo stato dei passi di refactoring sono in `CLAUDE_pdmgenerator.md`.

## Indice

1. [Scopo](#scopo)
2. [Come si usa (in sintesi)](#cosa-fa-in-sintesi)
3. [Struttura del repository e perché è fatta così](#struttura-del-repository-e-perché-è-fatta-così)
4. [Come funziona l'app dentro](#come-funziona-lapp-dentro)
5. [I 7 tipi di attività](#i-7-tipi-di-attività)
6. [Logica di generazione e difficoltà](#logica-di-generazione-e-difficoltà)
7. [Anti-ripetizione](#anti-ripetizione-storico-per-gruppopaziente)
8. [Progressione del gruppo](#progressione-del-gruppo-mantieni--sali-di-livello)
9. [Esportazione](#esportazione)
10. [Il modulo "Fascicolo esercizi a casa"](#il-modulo-fascicolo-esercizi-a-casa)
11. [Accesso lessicale e categorie semantiche — banche verificate](#accesso-lessicale-e-categorie-semantiche--banche-verificate)
12. [Categorizzazione — libreria criteri](#categorizzazione--libreria-criteri)
13. [Interfaccia](#interfaccia)
14. [Test](#test)
15. [Pubblicazione e aggiornamento](#pubblicazione-e-aggiornamento)
16. [Come modificare i dati e le librerie](#come-modificare-i-dati-e-le-librerie)
17. [Stato del refactoring](#stato-del-refactoring)
18. [Sicurezza, privacy e licenze](#sicurezza-privacy-e-licenze)
19. [Come lavora Rodrigo su questo progetto](#come-lavora-rodrigo-su-questo-progetto)

## Scopo

Chi conduce gruppi di stimolazione cognitiva deve ripetere esercizi equivalenti nel tempo senza riproporre lo stesso materiale: se il paziente riconosce la scheda, allena la memoria di quella scheda e non la funzione che si vuole stimolare. Preparare a mano molte varianti equivalenti è lungo e soggetto a errori di difficoltà.

L'app genera al volo materiale **nuovo ma di difficoltà controllata**, tiene traccia di ciò che ogni gruppo ha già visto per non riproporlo, suggerisce quando salire di livello, ed esporta in formati direttamente usabili in seduta (PowerPoint) o a casa (Word stampabile).

## Cosa fa, in sintesi

1. Il terapista sceglie un esercizio dalla lista in sidebar e un livello di difficoltà (1–32, scala comune a tutti gli esercizi tranne il Fascicolo).
2. L'app genera materiale procedurale a quel livello — mai identico a una generazione precedente — e lo mostra a schermo, pronto per la seduta (in presenza o in videochiamata).
3. Il terapista può rigenerare all'infinito, mostrare risposta/regola, esportare in PowerPoint (o in Word per il Fascicolo), stampare, e tenere uno storico per gruppo/paziente così lo stesso materiale non viene mai riproposto.
4. Un pannello di "progressione del gruppo" registra l'esito di ogni seduta e suggerisce se mantenere il livello o salire.

## Struttura del repository e perché è fatta così

```
index.html                  l'app (interfaccia, generatori, renderer, esportazioni, cronologia)
CLAUDE_pdmgenerator.md      regole di lavoro e stato dei passi di refactoring
README.md                   questo file
data/                       dati puri, separati dalla logica
  categorizzazione.js         libreria dei criteri di categorizzazione
  openmoji-map.js             mappa termine inglese -> icona OpenMoji
  inv-real-block.js           lessico di controllo per le non-parole dell'Intruso
vendor/                     librerie esterne, versione fissata, servite in locale
  README.md                   tabella versioni/licenze e come aggiornarle
  licenses/                   testi delle licenze
tests/                      test automatici (Node, nessuna dipendenza da installare)
  load-engine.js              carica il motore del Fascicolo direttamente da index.html
  fascicolo.test.js           test con seme fisso, regole di qualità, anti-ripetizione, dati
  snapshots.json              impronte di riferimento del fascicolo (settimane 1-12, 3 semi)
```

| Scelta | Perché |
|---|---|
| **App in un unico `index.html`** (per ora) | Si apre con doppio clic e si pubblica su GitHub Pages senza build. Il refactoring la spezza gradualmente (vedi "Stato del refactoring"), non d'un colpo, per non rompere nulla. |
| **`data/` separato** | I dati (liste di criteri, icone, lessico) erano quasi la metà del file ed erano mescolati alla logica. Separati si possono rivedere e correggere senza leggere codice, e non appesantiscono più `index.html` (da 543 KB a 362 KB). |
| **Dati in file `.js` e non `.json`** | Un `.json` va letto con una richiesta di rete che il browser blocca aprendo `index.html` con doppio clic. Un `.js` caricato con `<script src>` funziona ovunque: doppio clic e GitHub Pages. |
| **`vendor/` con versioni fissate** | L'app non dipende più da CDN esterni (salvo il fallback di sicurezza per `docx`, che scatta solo se il file locale non si carica): funziona anche se un CDN cambia o sparisce o se la rete (es. aziendale) lo blocca. Le versioni non cambiano da sole. |
| **`tests/` senza dipendenze** | Si usa il test runner incluso in Node (`node --test`), niente da installare. Servono a verificare che il riordino del codice non cambi ciò che l'app produce. |
| **Motore del Fascicolo autonomo** (`engine`) | È l'unica parte con generatore casuale seedabile (`mulberry32`) e senza DOM: per questo è testabile in Node. Le sue banche di parole restano nel motore volutamente, per non rompere i test. |
| **Cronologia in `localStorage` + Firebase opzionale** | Funziona sempre in locale; la condivisione tra colleghi è un di più che si attiva solo configurando Firebase. |

## Come funziona l'app dentro

`index.html` contiene, in quest'ordine, blocchi `<script>` con responsabilità distinte:

1. **Librerie** (`vendor/`): `pptxgenjs`, `docx`, `FileSaver`, Firebase (`app`, `auth`, `firestore`).
2. **Motore del Fascicolo** (`engine.js`, modulo UMD): logica pura senza DOM, funzione `buildFascicolo(settimana, seme, esclusioni)`. Dato lo stesso seme, la stessa settimana e le stesse esclusioni produce sempre lo stesso fascicolo.
3. **Costruttore Word** (`docbuilder`): trasforma il fascicolo in `.docx` (versione esercizi e versione con soluzioni).
4. **Dati** (`data/*.js`): criteri di categorizzazione, mappa icone, lessico di controllo, caricati prima degli script che li usano.
5. **Motore di categorizzazione**: campionamento dei criteri e recupero dei pittogrammi OpenMoji, con fallback testuale.
6. **Cronologia condivisa**: storico anti-ripetizione, locale e (se configurato) su Firestore.
7. **App principale**: stato, mappe `GENERATORS` (un generatore per esercizio) e `RENDERERS` (un renderer per esercizio), `weekParams(week)` per il Fascicolo, pannello di progressione, esportazioni, interfaccia.

Flusso di una generazione: l'utente sceglie esercizio e livello → `GENERATORS[esercizio]` costruisce il materiale (escludendo ciò che la cronologia del gruppo segnala già usato) → `RENDERERS[esercizio]` lo disegna → l'esportazione (PowerPoint/Word) riusa gli stessi dati.

## I 7 tipi di attività

| id | Nome | Cosa allena |
|---|---|---|
| `categorizzazione` | Categorizzazione | Dividere 6 immagini (pittogrammi) in 2 gruppi da 3, secondo un criterio semantico — 142 criteri reali raccolti dai materiali originali di Rodrigo (più 48 proposte, vedi sotto), con pool ampliati per non ripetere sempre la stessa coppia |
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
3. Incollare la config del progetto nell'oggetto `firebaseConfig` in cima alla sezione "Cronologia condivisa" di `index.html`.
4. Impostare le regole Firestore per consentire lettura/scrittura solo a utenti autenticati (anche anonimi), sulle collezioni `catHistory`, `accessoHistory`, `fascicoloHistory`, `materialHistory`, `groupProgress`.

Finché `firebaseConfig` resta vuoto, questa parte non fa nulla e l'app funziona come sempre, solo senza memoria tra dispositivi diversi. (Per il progetto attuale la configurazione è già inserita.)

## Progressione del gruppo (mantieni / sali di livello)

Pannello dedicato (per ogni esercizio a livelli, non per il Fascicolo):
- Dopo la seduta, il terapista registra la **% di riuscita** del gruppo al livello appena svolto.
- L'app calcola se il gruppo ha raggiunto una soglia (default 80%) per un certo numero di sedute consecutive (default 1, regolabile 1–3) e **suggerisce** "sali" o "mantieni".
- Il terapista può confermare o forzare la scelta opposta con l'interruttore; la decisione vale finché non arriva una nuova registrazione.
- I dati (log delle sedute, soglie, livello corrente per esercizio e per gruppo) sono salvati per gruppo, in locale, e sincronizzati su Firestore se la cronologia condivisa è attiva.
- L'app ricorda anche, per ogni gruppo, l'ultimo livello generato per ciascun esercizio (e l'ultima settimana per il Fascicolo, comprese le singole parti se fatte avanzare separatamente): riaprendo l'app con lo stesso nome gruppo si riparte da dove si era arrivati.

## Esportazione

- **Tutti gli esercizi a schermo** → **PowerPoint** (`pptxgenjs`, generato lato client, nessun server): riproduce fedelmente ciò che è a video, con nome file basato sul numero fisso dell'esercizio, livello e numero gruppo (es. `3 - Griglie-Conteggio.1(5).pptx`).
- **Fascicolo esercizi a casa** → **Word (.docx)** (libreria `docx`; se per qualche motivo non si carica da `vendor/`, un piccolo script di sicurezza in `index.html` prova a scaricarla da unpkg.com), fedele al formato originale dei fascicoli cartacei usati finora. Il documento viene generato sia in versione "esercizi" che in versione "con soluzioni".
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
- **Mai lo stesso materiale due volte allo stesso gruppo** (né in pagine diverse né in fascicoli diversi): la cronologia (`fascicoloHistory`) registra le parole degli anagrammi (`usedAnagramWords`) e del crucipuzzle (`usedCrucipuzzleWords`), le categorie (`usedCategories`, comprese le categorie larghe delle consegne lettera+categoria) e le consegne dell'accesso lessicale (`usedLexicalKeys`). Il motore le esclude tutte e le parole degli anagrammi non tornano nel crucipuzzle dello stesso fascicolo. **Nessun ripescaggio**: se il materiale nuovo finisce, la pagina ha meno elementi e un avviso arancione in cima al fascicolo lo segnala (`deck.notices`); si riparte con "Azzera il materiale già proposto". Le banche sono state ampliate (~650 parole comuni aggiunte a `WORD_BANK_SCORED` via `WORD_BANK_EXTRA`; 35–42 categorie per fascia settimanale, banche lettera+categoria verificate: vedi la sezione "Accesso lessicale e categorie semantiche" qui sotto) per reggere circa 5–6 cicli completi di 12 settimane. Senza nome/numero gruppo resta attivo solo il controllo dentro lo stesso fascicolo. Il crucipuzzle ha 10 parole target alla settimana 1, fino a 18 alla 12. Nel Word ogni esercizio sta nella propria pagina, anche nella versione con soluzioni (griglie e immagine del sequenziamento ridotte per fare posto al testo di soluzione; blocco lessicale con carattere più piccolo per stare in una pagina); verificato con LibreOffice su tutte le 12 settimane. Limite noto: nella soluzione del crucipuzzle possono comparire parole nate per caso dalle lettere di riempimento, non controllate.
- Le parti procedurali (griglie, labirinto, calcolo) non hanno bisogno di storico perché sono sempre generate da zero.
- Il Fascicolo è l'unica parte con **seme casuale fissabile**: `buildFascicolo(settimana, seme, esclusioni)` è riproducibile. Per questo è anche l'unica coperta dai test automatici.

## Accesso lessicale e categorie semantiche — banche verificate

Regola di qualità (settembre 2026): ogni consegna dell'accesso lessicale deve avere **almeno 12 parole italiane reali e utilizzabili**, **non tutte a bassa frequenza d'uso** (almeno 6 frequenti, Zipf ≥ 3.0, cioè più di una occorrenza per milione di parole; le altre possono essere d'uso meno comune ma reali).

- **Come si verifica**: lessico costruito incrociando le frequenze d'uso dell'italiano (`wordfreq`) con il dizionario Hunspell `it_IT` (solo parole esistenti, forme flesse comprese, niente nomi propri né prestiti), ~68.000 forme. Ogni combinazione è conteggiata su questo lessico. Il lessico **non è nel repository**: la regola Zipf ≥ 3.0 non si può quindi controllare con i test automatici, che verificano solo la struttura delle banche.
- **Schemi puramente fonemici** (2-6: iniziale+penultima, seconda+penultima, terza+penultima, lettere congiunte, lettere disgiunte) e **schemi lettera+lunghezza** (10-12): tutte le combinazioni in banca superano la soglia (minimo reale: 29 parole; le banche hanno 60-71 combinazioni ciascuna). "Disgiunte" = le due lettere ci sono ma mai adiacenti.
- **Iniziale libera** (settimana 1, parole di 5 lettere): le lettere sono validate per lunghezza (`INITIAL_LETTERS_BY_LENGTH`). La **«H» è stata eliminata** (al massimo 11 parole con 5-9 lettere); la «Z» resta solo come riserva e solo a 5, 7 e 8 lettere.
- **Schemi lettera+categoria** (7-9): prima le coppie erano casuali e *non verificate* (es. «seconda lettera U + Frutta» non ha soluzioni). Ora si pesca **solo** da `CATEGORY_LETTER_BANK`: coppie (lettera, categoria) con ≥ 12 parole reali in un lessico per categoria (12 categorie larghe: Alimenti, Animali, Edifici, Frutta e verdura, Indumenti, Mestieri, Mezzi di trasporto, Oggetti di casa, Parti del corpo, Piante e fiori, Sport e giochi, Strumenti e attrezzi). Banche: 50 iniziale, 50 seconda, 51 terza lettera. Le coppie che non raggiungono la soglia semplicemente non compaiono. Il conteggio è un **minimo** (i lessici per categoria sono curati a mano, non esaustivi); se si ampliano, altre coppie possono entrare in banca.
- Rinominate/accorpate rispetto a prima: «Mobili» → «Oggetti di casa»; «Elettrodomestici» e «Giochi» assorbite da «Oggetti di casa» e «Sport e giochi»; «Frutta» → «Frutta e verdura»; «Strumenti» → «Strumenti e attrezzi». Le vecchie chiavi nello storico condiviso non corrispondono più e semplicemente non escludono nulla.
- **Categorie semantiche** (pagina "categorie"): il pool passa da 163 a **471 categorie** (12 fasce settimanali da 35 a 42 categorie ciascuna, tutte distinte), sempre dalla più comune/concreta alla più stretta/insolita, ciascuna con abbastanza esemplari per il minimo richiesto (5-8 parole). Il fascicolo ne propone 6 a settimana, mai già date allo stesso gruppo.
- **Durata prima di esaurire il materiale nuovo per un gruppo** (simulazione a 12 cicli): circa 6 cicli completi del programma per quasi tutte le settimane, 5 per le settimane 7-9 (lettera+categoria). Limite noto: la **settimana 1** (iniziale libera, ~20 lettere, 8 per fascicolo) si esaurisce dopo 2 cicli; oltre, l'app lo segnala in `notices` invece di ripescare.
- Schemi e ordine per settimana: 1 iniziale, 2 iniziale+penultima, 3 seconda+penultima, 4 terza+penultima, 5 congiunte, 6 disgiunte, 7 iniziale+categoria, 8 seconda+categoria, 9 terza+categoria, 10 iniziale+lunghezza, 11 seconda+lunghezza, 12 terza+lunghezza.

## Categorizzazione — libreria criteri

- La libreria (`data/categorizzazione.js`, costante `CATEGORIZZAZIONE_LIBRARY`) contiene **190 voci in 16 fasce di difficoltà**: **142 criteri reali** estratti e corretti da 16 file "Categorizzazione.pptx" originali di Rodrigo e **48 proposte** (marcate `"proposal": true`). Ogni voce ha un'etichetta e due lati `a` e `b`, con un pool ampliato di item (5+ per lato, in italiano e inglese) così ogni generazione pesca una combinazione diversa senza inventare nuovi criteri.
- Le immagini sono pittogrammi **OpenMoji** (CC BY-SA 4.0), recuperati via fetch con **fallback testuale** se l'immagine non è disponibile. La mappa `OPENMOJI_ICON_MAP` (`data/openmoji-map.js`, 568 voci) associa il termine inglese al nome dell'icona: un termine assente dalla mappa va dritto al fallback testuale invece di tentare un abbinamento che potrebbe mostrare l'icona sbagliata.

## Interfaccia

- Sidebar: elenco esercizi, controllo livello (o settimana per il Fascicolo), controlli specifici dell'esercizio attivo, azioni (genera, mostra risposta/regola, esporta, storico generazioni, stampa), campo nome/numero gruppo, pannello di progressione.
- Area principale ("stage"): titolo e metadati dell'esercizio, eventuale box regola/istruzioni, area di rendering del materiale, navigazione tra schermate multiple (usata da "Serie attentive alternate").
- Storico generazioni: elenco locale (per questo browser) di ogni generazione fatta, con esercizio, livello e riepilogo — separato dallo storico anti-ripetizione usato per escludere materiale già proposto.
- Stile grafico volutamente sobrio/clinico (palette verde salvia, tipografia serif per i titoli), pensato per essere leggibile sia a schermo che in stampa/PowerPoint.

## Test

I test verificano che l'app produca **sempre lo stesso materiale a parità di seme**, così dopo ogni passo di riordino si può dimostrare che nulla è cambiato.

```
node --test tests/*.test.js
```

Serve solo Node (versione 20 o successiva); non c'è niente da installare. Il risultato atteso è `fail 0`.

Cosa controllano:
- **Determinismo**: stesso seme e settimana → fascicolo identico; semi diversi → fascicoli diversi.
- **Impronte (snapshot)**: gli hash del fascicolo per le settimane 1–12 e 3 semi sono in `tests/snapshots.json`. Se un'impronta cambia, il test fallisce e indica quale settimana. Se la modifica è voluta, si rigenerano con `UPDATE_SNAPSHOTS=1 node --test tests/*.test.js`.
- **Struttura e regole di qualità** per ogni settimana: 3 griglie 25×12 con 8 sequenze orizzontali e 8 verticali, 12 bersagli distinti, anagrammi corretti e senza doppioni, 10 calcoli esatti e mai negativi, categorie distinte, consegne lessicali senza doppioni.
- **Anti-ripetizione**: parole, categorie e chiavi lessicali già usate non riappaiono; se il materiale finisce l'app lo segnala in `notices`, non ripesca in silenzio.
- **Banche e dati**: struttura delle banche di parole e categorie, validità e conteggi dei file in `data/`.

Limiti noti (da dichiarare con onestà):
- Sono coperti solo il Fascicolo e i file di dati. Gli altri generatori usano `Math.random()` e dipendono da stato/DOM: per testarli serve prima poter fissare il loro generatore casuale (previsto al passo 4).
- La regola "12 parole valide, ≥ 6 frequenti (Zipf ≥ 3.0)" richiede il lessico `wordfreq`/Hunspell, che non è nel repository: non è verificata dai test.
- Il crucipuzzle può piazzare meno parole di quelle scelte (piazzamento greedy); il test fissa il comportamento attuale (minimo 8) senza modificarlo.

## Pubblicazione e aggiornamento

L'app è pubblicata con **GitHub Pages** dal ramo `main`: ogni modifica caricata viene ripubblicata automaticamente in 1–2 minuti (lo stato "pending/in progress" accanto al commit è la pubblicazione in corso). Dopo ogni aggiornamento: ricaricare il sito con Ctrl+Shift+R, generare un'attività e scaricare un PowerPoint e un Word, aprirli.

Quando si carica su GitHub vanno caricate **le cartelle intere** (`data`, `tests`, `vendor`), non i file che contengono: i file singoli finirebbero nella cartella principale e `index.html` non troverebbe più i suoi script.

## Come modificare i dati e le librerie

- **Criteri di categorizzazione** → `data/categorizzazione.js`. Si modifica senza toccare il codice; mantenere la struttura (`label`, lati `a` e `b` con `it` ed `en`). Dopo la modifica lanciare i test.
- **Icone** → `data/openmoji-map.js`: aggiungere la coppia `"termine inglese": "nome-icona-openmoji"`.
- **Banche di parole e categorie del Fascicolo** → per ora dentro il motore in `index.html` (`WORD_BANK_EXTRA`, `CATEGORY_LETTER_BANK`, `PHONEMIC_DB`, `CATEGORY_POOL`…). Non alterare le regole di qualità senza una richiesta esplicita; dopo ogni modifica lanciare i test.
- **Librerie** → vedi `vendor/README.md`: per aggiornarne una si scarica la nuova versione in `vendor/`, si cambia il nome del file e la riga `<script>` in `index.html`, poi si prova esportazione in PowerPoint e Word e la cronologia.

## Stato del refactoring

Obiettivo: rendere il codice leggibile, correggibile e professionale **senza cambiare ciò che l'app produce**. Si procede a passi piccoli, ognuno con test e app funzionante alla fine (dettagli e regole di lavoro in `CLAUDE_pdmgenerator.md`).

| Passo | Cosa | Stato |
|---|---|---|
| 1 | Test con seme fisso sul Fascicolo e sulle regole di qualità | fatto (Fascicolo; gli altri generatori al passo 4) |
| 2 | Librerie in `vendor/` con versioni fissate | fatto |
| 3 | Dati in `data/` | fatto per criteri, icone e lessico di controllo; le banche del motore restano dentro l'engine per ora |
| 4 | Un file per generatore e per renderer (`js/generators/`, `js/renderers/`) | da fare |
| 5 | Esportazioni, cronologia e progressione in file propri | da fare |
| 6 | CSS in file separato; README spezzato per argomento in `docs/` | da fare |
| 7 | Pulsante "Esporta/Importa tutto" per il backup dello stato locale | da fare |

## Sicurezza, privacy e licenze

- **Nessun dato clinico lascia il browser**, salvo la cronologia opzionale su Firestore. Nomi e numeri di gruppo **non devono contenere dati identificativi di pazienti**.
- La configurazione Firebase nel file è **pubblica per natura** (progetto `pdmgenerator`): non è una password. La protezione sono le **regole Firestore**: con autenticazione anonima, regole troppo larghe rendono la cronologia dei gruppi leggibile da chiunque abbia l'indirizzo. Da verificare nella console Firebase.
- **Licenze**: i pittogrammi **OpenMoji** sono CC BY-SA 4.0 e vanno citati una sola volta nel fascicolo/deck esportato, non su ogni slide. Le librerie in `vendor/` hanno licenza MIT (`pptxgenjs`, `docx`, `FileSaver`) e Apache-2.0 (Firebase); i testi sono in `vendor/licenses/` e la tabella versioni in `vendor/README.md`.

## Come lavora Rodrigo su questo progetto

- Valida logica e struttura di ogni nuovo esercizio/modulo tramite cicli di feedback iterativi, condividendo esempi reali (fascicoli, pptx di categorizzazione) da cui derivare template e regole.
- Approccio di sviluppo: prima si valida modello dati e logica in conversazione, poi si passa all'implementazione.
- Correzioni tecnicamente precise: identifica problemi strutturali/metodologici, non solo di superficie.
