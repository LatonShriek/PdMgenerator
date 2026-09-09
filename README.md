# PdM CDCD — Generatore attività di stimolazione cognitiva

Questo repository contiene un'unica pagina web autonoma (`index.html`) che genera varianti isodifficili dei 6 esercizi del percorso "Online" (16 sessioni), da usare in seduta per ripetere le stimolazioni senza effetto apprendimento.

Non richiede installazione: basta aprire `index.html` nel browser, oppure pubblicarlo su GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).

---

## Come si usa

- **Sidebar sinistra**: scegli l'esercizio, poi il livello (1-16) con lo slider — richiama i parametri strutturali di quella sessione (dimensione griglia, tipo di stimolo, lunghezza stringa, lessicalità, regola...).
- **Tipo di materiale** (Griglie, Intruso, Inversione): override manuale rispetto alla scelta automatica legata al livello — lettere, numeri, misto, alfabeti diversi, forme, frecce.
- **Genera nuovo materiale**: crea una nuova istanza casuale, stessa difficoltà, contenuto sempre diverso.
- **Prossima regola su questa griglia →** (solo Griglie-Conteggio): la stessa griglia visiva supporta più richieste diverse, di complessità crescente — utile per differenziare sottogruppi senza rigenerare il materiale.
- **Mostra risposta/regola**: rivela la regola e la risposta attesa (nascosto di default, per non "spoilerare" durante la proiezione).
- **Esporta in PowerPoint**: scarica un file `.pptx` con il materiale attualmente a schermo, nello stesso formato dei file di sessione originali (incluse le note per il relatore con la regola).
- **Storico generazioni**: elenco di ciò che è stato generato su questo dispositivo (esercizio, livello, orario). Salvato solo in locale nel browser (`localStorage`), non condiviso tra dispositivi o colleghi.
- **Stampa**: per portare a stampa la schermata corrente.

**Limite noto:** per Categorizzazione il prototipo usa icone/emoji al posto delle foto reali (una pagina statica offline non ha accesso alla libreria immagini usata nei materiali originali). Il codice di esportazione è già predisposto per adattare le foto reali alla dimensione della slide mantenendo le proporzioni (`sizing: contain`), quando la libreria immagini verrà collegata.

---

## Correzioni di fedeltà rispetto agli originali (rispetto alla prima versione)

Una prima versione del generatore si basava solo sull'estrazione testuale dei file PowerPoint originali. Renderizzando visivamente le slide (non solo il testo) sono emersi meccanismi diversi da quelli inizialmente ricostruiti, corretti in questa versione:

- **Griglie-Conteggio**: ogni carattere è dentro un **cerchio** con riempimento giallo/bianco e bordo rosso/nero — solo queste 4 combinazioni, colori pieni e nitidi (non la tavolozza pastello a 7 colori della prima versione). Il generatore ora costruisce ogni griglia in modo che le celle "colorate" siano una sovrapposizione deliberatamente rada (mai una spartizione a metà griglia, che su griglie grandi farebbe esplodere il conteggio oltre ogni range utile), e offre più richieste per la stessa griglia, ciascuna con un conteggio-risposta garantito tra 5 e 12 istanze. Il tipo di materiale è selezionabile con pulsanti (non un menu a tendina).
- **Categorizzazione**: il meccanismo reale non è "trova l'intruso in un dominio omogeneo" né una semplice coppia tassonomica tipo frutta/verdura, ma **dividere 6 immagini in due gruppi da 3**, con criteri di raggruppamento che diventano via via più astratti: ai livelli bassi categorie tassonomiche ovvie (animali vs utensili); dal livello 9 raggruppamenti **funzionali/concettuali** entro un dominio condiviso (es. modi di salire con sforzo fisico — scala, arrampicata, scalinata — vs modi di salire meccanici — scala mobile, seggiovia, ascensore; oppure oggetti che producono/amplificano il suono vs oggetti che lo bloccano/attenuano); dal livello 13 vere e proprie **qualità di processo astratte**, non più il tipo di oggetto in sé (es. attività che richiedono precisione fine — freccette, orologiaio, bisturi — vs attività che richiedono forza grossolana — lotta, manubri, accetta). Tutti questi esempi sono tratti direttamente dalle slide originali.
- **Intruso percettivo**: il meccanismo reale è uno **spaiamento**, non "un elemento visivamente diverso in una fila corta". Nella griglia originale ogni elemento ha un "gemello" identico (stesso valore, o stessa permutazione di caratteri) tranne uno, che compare da solo — il paziente deve scandagliare l'intera griglia per trovarlo, non basta un colpo d'occhio. Il generatore ora costruisce ogni istanza con k coppie identiche + 1 singolo, invece di un'unica stringa "diversa" affiancata a distrattori tutti uguali fra loro.
- **Inversione e riordino**: le non-parole dei livelli iniziali sono ora generate con pattern consonante-vocale (onset+vocale ripetuti), quindi pronunciabili anche se prive di significato — non più sequenze di lettere del tutto casuali. La pronunciabilità decresce gradualmente nei livelli più alti, in linea con la logica generale "riduzione del supporto fonologico".
- **Serie attentive alternate**: l'anteprima a schermo ora genera 154 stimoli come negli originali (prima erano 40, disallineata rispetto all'esportazione PowerPoint che già usava 154).

---

## I 6 esercizi: cosa allenano, come sono costruiti, come sale la difficoltà

### 1. Griglie-Conteggio
**Allena:** ricerca visiva selettiva e attenzione sostenuta/focalizzata, con conteggio.
**Struttura:** griglia di 35-107 cerchi colorati (giallo/bianco di sfondo, rosso/nero di bordo) con 4-6 simboli ripetuti in posizione casuale; il paziente cerca/conta gli elementi che soddisfano una regola data a voce. Più richieste possibili sulla stessa griglia, ciascuna con risposta tra 5 e 12 istanze.
**Gradiente (due assi indipendenti):**
- *Natura dello stimolo*: cifre/lettere familiari → forme geometriche pure → alfanumerico misto → script non familiari (cirillico, cinese, poi Ge'ez con differenze diacritiche minime) → frecce orientate.
- *Complessità della regola*: da un solo attributo ("tutti gli 1") a regole congiuntive (identità + colore sfondo + colore bordo) fino a regole posizionali ("sfondo giallo nelle righe dispari").

### 2. Intruso percettivo
**Allena:** discriminazione visiva fine e attenzione selettiva, tramite spaiamento (ogni elemento ha un "gemello" tranne uno).
**Struttura:** griglia di 13-19 elementi; ogni valore/permutazione compare 2 (talvolta 3) volte, tranne uno che compare una sola volta — quello da trovare.
**Gradiente:**
- *Lunghezza dello stimolo*: da 1 carattere a 4 caratteri — aggiunge elaborazione sequenziale/posizionale.
- *Tipo di manipolazione*: valore diverso (fasi iniziali) → stesso insieme di caratteri in ordine diverso (dalla sessione 9).
- *Familiarità dello stimolo*: cifre/lettere → simboli familiari non verbalizzabili (dadi, domino) → script sconosciuti a somiglianza crescente (fino a Ge'ez, un solo tratto diacritico di differenza).

### 3. Inversione e riordino
**Allena:** span attentivo/mnestico a breve termine e manipolazione mentale della sequenza.
**Struttura:** stringhe (lettere o cifre) presentate una alla volta; il paziente le ripete secondo una consegna data.
**Gradiente:**
- *Lessicalità*: parole italiane reali (S1-4) → non-parole pronunciabili (S5-9, pattern consonante-vocale) → non-parole via via meno vincolate ai livelli più alti.
- *Lunghezza*: 3 → 4 → 5 caratteri, introdotta progressivamente.
- *Tipo di simboli*: solo lettere → solo cifre → alfanumerico misto (dalla S11).
- *Case*: uniforme → maiuscolo/minuscolo alternato nella stessa stringa (dalla S11).
- *Compiti sul blocco numerico*: ripetizione diretta → ripetizione inversa → riordino crescente → somma delle cifre → selezione delle sole cifre pari/dispari alternate.
- **Colore per-carattere**: uno o due caratteri per stringa sono colorati (un rosso nelle sessioni iniziali/intermedie, un rosso e un verde dalla sessione 13). **Aperto:** la consegna clinica esatta legata a questi caratteri non è ricostruibile dal file sorgente — da confermare con Rodrigo.

### 4. Serie attentive alternate
**Allena:** attenzione alternata/divisa, velocità di elaborazione, controllo inibitorio, e (al livello più alto) aggiornamento in memoria di lavoro.
**Struttura:** sequenza di stimoli (A, B, 1, 2), uno alla volta, colore che alterna rigorosamente nero/rosso indipendentemente dallo stimolo.
**Gradiente:** vive interamente nella regola (dalle note-relatore), non nel contenuto:

| Livello | Regola | Costrutto aggiunto |
|---|---|---|
| 1 | Mano dx se nero, sx se rosso | scelta a 2 vie su una dimensione |
| 2 | Categorizzazione lettera/numero + raggruppamento arbitrario incrociato | categorizzazione |
| 3-5 | Risposta motoria+verbale sui 4 stimoli singoli, con No-Go | mappatura a 4 vie, doppia modalità, inibizione |
| 6-10 | Come sopra, con regola invertita a metà compito | costo di *switch* |
| 11-12 | Regola congiunta colore×categoria + No-Go + inversione | due dimensioni combinate |
| 13-15 | Regola congiuntiva con OR cross-dimensionale | attraversa i confini categoriali |
| 16 | Risposta basata sullo stimolo **precedente** | n-1 back |

### 5. Accesso lessicale online
**Allena:** recupero lessicale (denominazione), con gerarchia di facilitazione fissa: sovraordinate → subordinate/esempi → somiglianze e parentele → usi → caratteristiche tipiche.
**Struttura:** una sola parola-target per sessione.
**Gradiente:** concretezza/immaginabilità e frequenza d'uso, da nomi concreti ad alta frequenza (Pomodoro, Cane) a concetti astratti a bassa frequenza (Pacciamatura, Fato).

### 6. Categorizzazione
**Allena:** categorizzazione semantica genuina — non riconoscimento percettivo, ma conoscenza concettuale delle categorie, sempre più astratta.
**Struttura:** 6 immagini che formano due gruppi da 3, in base a un criterio comune.
**Gradiente:** tassonomico e ovvio (animali vs utensili) → tassonomico ma vicino (frutta vs verdura) → funzionale/concettuale entro un dominio condiviso (ascesa con sforzo vs meccanica; suono prodotto vs bloccato) → qualità di processo astratta, indipendente dal tipo di oggetto (precisione fine vs forza grossolana).

---

## Sintesi per l'evoluzione dell'app

I 6 esercizi si dividono in due famiglie, dal punto di vista dell'ingegneria della difficoltà:

- **Esercizi a "materiale variabile"** (Intruso percettivo, Inversione e riordino, Accesso lessicale, Categorizzazione): la difficoltà è nel contenuto stesso.
- **Esercizi a "regola variabile"** (Griglie-Conteggio, Serie attentive alternate): la difficoltà vive nella consegna applicata a un materiale che può restare fisso.

## Punti aperti da verificare con Rodrigo

1. **Inversione e riordino** — significato clinico dei caratteri colorati (rosso/verde) dentro le stringhe.
2. **Serie attentive alternate** — conferma che il salto tra livello 12 e livello 16 (n-back) non necessiti di un gradino intermedio per un gruppo con decadimento lieve.
3. **Numerazione dei file originali** — alcune incoerenze (es. Categorizzazione sessione 5/6 con suffissi disallineati) da chiarire.
4. **Categorizzazione** — i set di categorie usati nel generatore (icone) sono una libreria iniziale limitata; da espandere se servono più varianti per evitare ripetizioni ravvicinate.
