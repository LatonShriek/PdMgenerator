# Le attività, la difficoltà, l'anti-ripetizione e la progressione

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## I 10 tipi di attività

| id | Nome | Cosa allena |
|---|---|---|
| `categorizzazione` | Categorizzazione | Dividere 6 immagini (pittogrammi) in 2 gruppi da 3, secondo un criterio semantico — 142 criteri reali raccolti dai materiali originali di Rodrigo (più 48 proposte, vedi sotto), con pool ampliati per non ripetere sempre la stessa coppia |
| `intruso` | Intruso percettivo | Trovare l'unico elemento che compare una sola volta (tutti gli altri ≥2) in una schermata di simboli. **Punteggio unico di difficoltà** (`INTRUSO_SCORE_W`): lunghezza dell'elemento (1 simbolo fino al livello 8, 2 dal 9, 3 dal 21, uguale in tutte le schermate della sessione) + famiglia di stimoli (sblocco tardivo, riconoscibilità del glifo) + somiglianza dei tipi (quota crescente di tipi «quasi uguali») + numerosità. L'obiettivo di punteggio è **lineare** nel livello (`INTRUSO_TARGET_D`); la numerosità è la variabile che si risolve, per cui a ogni cambio di lunghezza il numero di elementi ricade (dente di sega) e nella stessa schermata le famiglie più ostiche hanno meno elementi. Numerosità solo su valori che danno griglia piena (15, 16, 18, 20, 21, 24, 25, 27, 28, 30). Gli elementi di 2–3 glifi di famiglie a simboli (zodiaco, semi, dadi, forme…) sono racchiusi in una cornice sottile, in anteprima e nel PPTX |
| `griglie` | Griglie-Conteggio | Ricerca visiva e conteggio in una griglia, con 10 consegne selezionabili sulla stessa griglia. **Punteggio unico per consegna** = stimolo (simbolo, sfondo, bordo, colore del simbolo, dimensione, stile del bordo) + molteplicità (numero di condizioni insieme) + astrazione (posizione, negazione, adiacenza, regole di forma: esclusione, alternativa, doppio conteggio, confronto, «saltando i primi k», per riga/colonna, «come il vicino»). Le 10 consegne seguono una rampa di punteggio centrata su una media lineare nel livello (`GRID_SCORE_MU`); almeno metà usano i colori (sfondo, bordo, colore del simbolo) fin dal livello 1, fino al 70%; l'astrazione massima ammessa cresce col livello; niente consegne quasi duplicate (stesso bersaglio con vincoli contenuti l'uno nell'altro). 3 colori per canale, dimensione, sfondo vuoto e stile del bordo entrano un po' alla volta; «Mostra risposta» mostra il risultato specifico |
| `serie` | Serie attentive alternate | Attenzione alternata / task-switching / go–no-go, con 32 regole di risposta crescenti (mano dx/sx, sì/no, doppia caratteristica, inibizione incrociata) |
| `inversione` | Inversione e riordino | Span e manipolazione di sequenze: anagrammi/sillabe di parole italiane reali, con pool di parole validate per frequenza d'uso |
| `accesso` | Accesso lessicale online | Denominazione con cueing graduato (facilitazioni progressive) |
| `classificazioni` | Classificazioni (ragionamento verbale, ispirato al VRT) | Dati tre termini, nominare la categoria. Banca in `data/classificazioni.js`: 67 categorie in 5 fasce di astrazione (concreta → molto astratta), termini ordinati dal più tipico al meno tipico, sinonimi e categorie più ampie accettate. Voci marcate `proposta`: **da validare da Rodrigo**. Difficoltà = fascia + atipicità dei termini + risposta libera dal livello 9; scelta fra 4 opzioni nei livelli 1-8. Anti-ripetizione per categoria (poi per terna), campo `usedClassificazioni` |
| `intrusoconc` | Intruso concettuale (ragionamento verbale, ispirato al VRT) | Quattro parole, tre della stessa categoria e una no. Riusa le 67 categorie di Classificazioni (voci `proposta`) e i **domini** in `data/intruso-concettuale.js`. Fino al livello 8 l'intruso viene da un dominio lontano; dal 9 la quota di intrusi dello stesso dominio (più difficili) cresce fino al 90%. Controllo di unicità: nessuna altra categoria rende ambigua la risposta. Anti-ripetizione per coppia categoria/intruso (`usedIntrusoConc`) |
| `analogie` | Analogie (ragionamento verbale, ispirato al VRT) | A : B = C : ?  Banca di 148 coppie in 14 tipi di relazione (contrari, esempio-categoria, parte-tutto, strumento, professione, contenitore, materiale, sinonimi, causa-effetto, grado, trasformazione, autore-opera, simboli) in 5 fasce; voci `proposta` da validare. Scelta fra 4 opzioni fino al livello 12 (distrattori più plausibili salendo), risposta libera dopo; quesiti invertiti (? : D) dal 17. Anti-ripetizione per coppia (`usedAnalogie`) |
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
3. Incollare la config del progetto nell'oggetto `firebaseConfig` di `js/firebase-config.js`.
4. Impostare le regole Firestore per consentire lettura/scrittura solo a utenti autenticati (anche anonimi), sulle collezioni `catHistory`, `accessoHistory`, `fascicoloHistory`, `materialHistory`, `groupProgress`.

Finché `firebaseConfig` resta vuoto, questa parte non fa nulla e l'app funziona come sempre, solo senza memoria tra dispositivi diversi. (Per il progetto attuale la configurazione è già inserita.)

**Limite noto (da controllare nella console Firebase):** se le regole Firestore rifiutano una scrittura, l'app **non mostra nessun errore** e continua a salvare solo nel browser, e la scritta "Connesso" indica soltanto che l'accesso anonimo è riuscito, non che i dati arrivino online. Per sapere se la cronologia è davvero condivisa si guarda in Firestore Database → Dati: devono comparire le raccolte `catHistory`, `accessoHistory`, `fascicoloHistory`, `materialHistory` e `groupProgress`, con un documento per ogni nome gruppo (il nome è usato così com'è, maiuscole comprese). Il ripristino da copia di sicurezza, invece, segnala quante scritture online sono riuscite e quali errori ha dato.

## Progressione del gruppo (mantieni / sali di livello)

Pannello dedicato (per ogni esercizio a livelli, non per il Fascicolo):
- Dopo la seduta, il terapista registra la **% di riuscita** del gruppo al livello appena svolto.
- L'app calcola se il gruppo ha raggiunto una soglia (default 80%) per un certo numero di sedute consecutive (default 1, regolabile 1–3) e **suggerisce** "sali" o "mantieni".
- Il terapista può confermare o forzare la scelta opposta con l'interruttore; la decisione vale finché non arriva una nuova registrazione.
- I dati (log delle sedute, soglie, livello corrente per esercizio e per gruppo) sono salvati per gruppo, in locale, e sincronizzati su Firestore se la cronologia condivisa è attiva.
- L'app ricorda anche, per ogni gruppo, l'ultimo livello generato per ciascun esercizio (e l'ultima settimana per il Fascicolo, comprese le singole parti se fatte avanzare separatamente): riaprendo l'app con lo stesso nome gruppo si riparte da dove si era arrivati.
