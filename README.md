# PdM CDCD — Generatore attività di stimolazione cognitiva

Questo repository contiene un'unica pagina web autonoma (`index.html`) che genera varianti isodifficili dei 6 esercizi del percorso "Online" (16 sessioni), da usare in seduta per ripetere le stimolazioni senza effetto apprendimento.

Non richiede installazione: basta aprire `index.html` nel browser, oppure pubblicarlo su GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

---

## Come si usa

- **Sidebar sinistra**: scegli l'esercizio, poi il livello (1-16) con lo slider — richiama i parametri strutturali di quella sessione (dimensione griglia, tipo di stimolo, lunghezza stringa, lessicalità, regola...).
- **Genera nuovo materiale**: crea una nuova istanza casuale, stessa difficoltà, contenuto sempre diverso.
- **Mostra risposta/regola**: rivela la regola e la risposta attesa (nascosto di default, per non "spoilerare" durante la proiezione).
- **Esporta in PowerPoint**: scarica un file `.pptx` con il materiale attualmente a schermo, nello stesso formato dei file di sessione originali (incluse le note per il relatore con la regola).
- **Storico generazioni**: elenco di ciò che è stato generato su questo dispositivo (esercizio, livello, orario) — utile per non riproporre per sbaglio lo stesso materiale a distanza ravvicinata. Salvato solo in locale nel browser (`localStorage`), non condiviso tra dispositivi o colleghi.
- **Stampa**: per portare a stampa la schermata corrente (utile per Griglie-Conteggio o Categorizzazione come foglio cartaceo).

**Limite noto:** per Categorizzazione il prototipo usa icone/emoji al posto delle foto reali (una pagina statica offline non ha accesso alla libreria immagini usata nei materiali originali).

---

## I 6 esercizi: cosa allenano, come sono costruiti, come sale la difficoltà

### 1. Griglie-Conteggio
**Allena:** ricerca visiva selettiva e attenzione sostenuta/focalizzata, con conteggio.
**Struttura:** griglia di 35-107 celle con 4-6 stimoli ripetuti in posizione casuale; il paziente cerca/conta gli elementi che soddisfano una regola data a voce.
**Gradiente (due assi indipendenti):**
- *Natura dello stimolo*: cifre/lettere familiari → forme geometriche pure → alfanumerico misto → script non familiari (cirillico, cinese, poi Ge'ez con differenze diacritiche minime) → frecce orientate.
- *Complessità della regola* (dalle note-relatore): da un solo attributo ("tutti gli 1") a regole congiuntive su più attributi (identità + colore sfondo + colore bordo) fino a regole posizionali ("i dispari su sfondo giallo nelle colonne dispari"). Ogni griglia porta con sé 10-14 varianti di regola già pronte, ordinate per difficoltà crescente.

La stessa griglia visiva può quindi coprire un ampio range di difficoltà semplicemente cambiando la consegna orale — utile per differenziare sottogruppi nello stesso incontro.

### 2. Intruso percettivo
**Allena:** discriminazione visiva fine e attenzione selettiva (oddity task).
**Struttura:** 8-11 schermate a sessione, ciascuna una fila di 15-18 item quasi identici tra cui uno solo è diverso.
**Gradiente:**
- *Lunghezza dello stimolo*: da 1 carattere a 4 caratteri — aggiunge elaborazione sequenziale/posizionale.
- *Tipo di manipolazione*: simbolo diverso (fasi iniziali) → stesso insieme di caratteri in ordine diverso (dalla sessione 9) — richiede confronto posizione-per-posizione, non solo riconoscimento di forma.
- *Familiarità dello stimolo*: cifre/lettere → simboli familiari non verbalizzabili (dadi, domino) → script sconosciuti a somiglianza crescente (fino a Ge'ez, dove la differenza è un solo tratto diacritico).

Non ha note-relatore: la consegna ("trova quello diverso") è sempre la stessa e implicita — bassa richiesta di comprensione, adatto anche a gruppi con difficoltà di linguaggio.

### 3. Inversione e riordino
**Allena:** span attentivo/mnestico a breve termine e manipolazione mentale della sequenza.
**Struttura:** stringhe (lettere o cifre) presentate una alla volta; il paziente le ripete secondo una consegna data.
**Gradiente:**
- *Lessicalità*: parole italiane reali (S1-4) → non-parole (S5-9), che tolgono il supporto semantico/fonologico.
- *Lunghezza*: 3 → 4 → 5 caratteri, introdotta progressivamente (il 5 compare dalla S10).
- *Tipo di simboli*: solo lettere → solo cifre → alfanumerico misto (dalla S11).
- *Case*: uniforme → maiuscolo/minuscolo alternato nella stessa stringa (dalla S11).
- *Compiti sul blocco numerico* (dalle note): ripetizione diretta → ripetizione inversa → riordino crescente → somma delle cifre → selezione delle sole cifre pari/dispari alternate.
- **Colore per-carattere** (scoperta dall'ispezione dell'XML originale, non evidente a un primo sguardo): dentro ogni stringa, uno o due caratteri sono colorati — un carattere rosso nelle sessioni iniziali/intermedie, un rosso **e** un verde dalla sessione 13 in poi, in posizione casuale. Il tool lo riproduce fedelmente. **Aperto:** la consegna clinica esatta legata a questi caratteri colorati non è ricostruibile dal file sorgente (nessuna nota la spiega) — da confermare con Rodrigo prima di darle un significato funzionale nel generatore.

### 4. Serie attentive alternate
**Allena:** attenzione alternata/divisa, velocità di elaborazione, controllo inibitorio, e (al livello più alto) aggiornamento in memoria di lavoro.
**Struttura:** sequenza fissa di 154 stimoli (A, B, 1, 2), uno alla volta, colore che alterna rigorosamente nero/rosso indipendentemente dallo stimolo.
**Gradiente:** vive interamente nelle note-relatore (il contenuto delle slide è identico a ogni livello):

| Livello | Regola | Costrutto aggiunto |
|---|---|---|
| 1 | Mano dx se nero, sx se rosso | scelta a 2 vie su una dimensione |
| 2 | Categorizzazione lettera/numero + raggruppamento arbitrario incrociato | categorizzazione |
| 3-5 | Risposta motoria+verbale sui 4 stimoli singoli, con No-Go | mappatura a 4 vie, doppia modalità, inibizione |
| 6-10 | Come sopra, con regola invertita a metà compito | stessa complessità + costo di *switch* |
| 11-12 | Regola congiunta colore×categoria + No-Go + inversione | due dimensioni combinate |
| 13-15 | Regola congiuntiva con OR cross-dimensionale | attraversa i confini categoriali |
| 16 | Risposta basata sullo stimolo **precedente** | n-1 back: aggiornamento in memoria di lavoro |

Essendo il contenuto fisso, è l'esercizio più semplice da rigenerare senza effetto apprendimento: basta una nuova sequenza casuale, la regola resta quella del livello.

### 5. Accesso lessicale online
**Allena:** recupero lessicale (denominazione), con gerarchia di facilitazione fissa in tutte le sessioni: sovraordinate → subordinate/esempi → somiglianze e parentele → usi → caratteristiche tipiche (il classico *cueing hierarchy* per l'anomia).
**Struttura:** una sola parola-target per sessione.
**Gradiente:** concretezza/immaginabilità e frequenza d'uso, da nomi concreti ad alta frequenza (Pomodoro, Cane) a concetti astratti a bassa frequenza (Pacciamatura, Fato).

### 6. Categorizzazione
**Allena:** presumibilmente categorizzazione semantica/ricerca dell'intruso su base semantica — **la regola esatta non è nel file**, andrebbe confermata.
**Struttura:** 60 immagini per sessione (10 schermate × 6 immagini), dominio semantico che cambia sessione per sessione, stile grafico via via meno omogeneo (mix foto+illustrazione nelle sessioni avanzate).

---

## Sintesi per l'evoluzione dell'app

I 6 esercizi si dividono in due famiglie, dal punto di vista dell'ingegneria della difficoltà:

- **Esercizi a "materiale variabile"** (Intruso percettivo, Inversione e riordino, Accesso lessicale, Categorizzazione): la difficoltà è nel contenuto stesso — serve materiale nuovo generato secondo gli stessi parametri strutturali.
- **Esercizi a "regola variabile"** (Griglie-Conteggio, Serie attentive alternate): la difficoltà vive nella consegna applicata a un materiale che può restare fisso — qui basta variare la regola.

## Punti aperti da verificare con Rodrigo

1. **Inversione e riordino** — significato clinico dei caratteri colorati (rosso/verde) dentro le stringhe.
2. **Categorizzazione** — regola esatta di raggruppamento/intruso (non è nel file).
3. **Serie attentive alternate** — conferma che il salto tra livello 12 (congiunzione+inversione) e livello 16 (n-back) non necessiti di un gradino intermedio per un gruppo con decadimento lieve.
4. **Numerazione dei file originali** — alcune incoerenze (es. Categorizzazione sessione 5/6 con suffissi disallineati) da chiarire se sono refusi o riflettono un riordino reale.
