# L'app PdM CDCD spiegata semplice

Questa pagina risponde a due domande: **perché abbiamo diviso l'app così**, e **cosa si può ancora fare per renderla più solida e professionale**. Non serve sapere di informatica.

---

## 1. Perché l'abbiamo separata così

### L'immagine da tenere in mente: una cucina

Prima l'app era **un solo foglio gigantesco** (`index.html`, 543 KB). Dentro c'era tutto insieme: le istruzioni, gli elenchi di parole, le liste di criteri, gli ingredienti comprati da altri. Come una cucina dove ricette, dispensa, attrezzi e conti della spesa sono scritti sullo stesso foglio, senza separazioni.

Funzionava, ma:
- per correggere una cosa piccola bisognava cercarla in mezzo a 15.000 righe;
- ogni correzione rischiava di rompere qualcosa d'altro;
- né tu né io potevamo capire a colpo d'occhio dov'era cosa.

Adesso la cucina ha **degli scaffali con l'etichetta**:

| Cartella o file | Cos'è, in cucina | A cosa serve |
|---|---|---|
| `index.html` | **La cucina vera**, dove si cucina | Le istruzioni dell'app: come si genera un esercizio, come si disegna, come si esporta |
| `js/` | **Le schede di lavoro, una per piatto** | Per ogni esercizio, un file che *prepara* il materiale (`generators/`) e uno che lo *impiatta* a schermo (`renderers/`). Prima stavano tutti nella cucina |
| `data/` | **Il ricettario e gli elenchi** | Le liste di criteri di categorizzazione, le icone, le parole di controllo. Sono cose che *tu* conosci da clinico: si possono rivedere senza leggere nessuna istruzione |
| `vendor/` | **La dispensa** | Gli "ingredienti" fatti da altri (le librerie che creano PowerPoint e Word, quella per la cronologia condivisa). Li teniamo in casa, con la versione segnata |
| `tests/` | **L'assaggio di controllo** | Prove automatiche: dopo ogni riordino verificano che il piatto esca identico a prima |
| `README.md` | **Il libretto di istruzioni** | Spiega a chiunque erediti l'app cosa fa e perché |
| `CLAUDE_pdmgenerator.md` | **Il quaderno delle regole di lavoro** | Ricorda a me, a ogni sessione, come lavoriamo insieme e a che punto siamo |

### Perché ogni scelta

**Perché `vendor/` (la dispensa).** Prima l'app, ogni volta che la aprivi, andava "a comprare" gli ingredienti su internet. Se quel negozio cambiava, chiudeva o era bloccato (per esempio dalla rete dell'AUSL), l'app smetteva di funzionare. Ora gli ingredienti sono in casa, con la versione fissata: non cambiano da soli e non dipendono da nessuno.

**Perché `data/` (gli elenchi).** I dati erano quasi la metà del file e stavano mescolati alle istruzioni. Separati, si possono controllare e correggere in pace, e l'app principale è passata da 543 a 362 KB.

**Perché i dati sono in file `.js` e non `.json`.** Un file `.json` è più "ordinato" ma il browser, se apri l'app con un doppio clic, si rifiuta di leggerlo per ragioni di sicurezza. Il file `.js` funziona sempre: con il doppio clic e su GitHub Pages. È più utile avere un'app che si apre ovunque.

**Perché `tests/` (l'assaggio).** Per riordinare la cucina senza rovinare i piatti, devi poter dire: "il piatto è identico a prima". I test usano un "seme" fisso, come lanciare dei dadi truccati sempre allo stesso modo: con lo stesso seme l'app deve produrre lo stesso fascicolo, parola per parola. Se dopo un riordino qualcosa cambia, il test lo dice subito. Per ora coprono il **Fascicolo a casa** e i file di dati; gli altri esercizi non si possono ancora testare allo stesso modo (vedi sotto).

**Perché a passi piccoli e non tutto insieme.** Smontare l'intera cucina in una notte significa non sapere più dove sta niente se qualcosa va storto. Un passo alla volta, con il controllo alla fine di ognuno, vuol dire che l'app funziona sempre.

**Perché le banche di parole del Fascicolo sono ancora dentro `index.html`.** Sono legate al motore che i test controllano. Se le spostiamo adesso, cambiamo qualcosa che non abbiamo ancora modo di verificare. Prima completiamo i controlli, poi le spostiamo.

**Perché si caricano le cartelle intere su GitHub.** Una cartella è come un cassetto con il suo contenuto. Se carichi solo le carte, finiscono sparse sul tavolo e l'app non sa più dove cercarle.

### A che punto siamo

I passi **1, 2, 3, 4 e 7 sono fatti** (test, librerie in casa, dati separati, una scheda per ogni esercizio, copia di sicurezza). Per il passo 4 ho fatto un "assaggio" più severo: 183 piatti assaggiati prima e dopo lo spostamento, tutti identici. Restano i passi 5 e 6: separare esportazioni e cronologia, separare l'aspetto grafico.

---

## 2. Cosa si può fare per renderla più solida e professionale

Li ho messi in ordine di importanza. Per ognuno dico **cosa cambia per te**.

### Da fare per primi

**1. La copia di sicurezza (passo 7). Fatta.**
Ora in fondo alla barra laterale ci sono due pulsanti: uno salva in un file tutta la memoria dei gruppi, l'altro la rimette a posto. Ripristinare non cancella mai niente: aggiunge solo ciò che manca. È come una **copia di sicurezza della rubrica**. Conviene farla ogni tanto e tenere il file al sicuro (contiene i nomi dei gruppi).

**2. Controllare le "serrature" della cronologia condivisa (Firebase).**
La chiave scritta nel file è pubblica per natura: non è una password, è come l'indirizzo di casa. A proteggere i dati sono le **regole** che si impostano nella console di Firebase. Se sono troppo larghe, chiunque conosca l'indirizzo potrebbe leggere la cronologia dei gruppi. Non l'ho potuto verificare da qui, quindi va guardato da te nella console. C'è anche un dettaglio da sapere: se le regole rifiutano un salvataggio, l'app non avvisa e la scritta "Connesso" vuol dire solo che l'accesso è riuscito. Per questo conviene guardare davvero in Firestore se ci sono i gruppi. In ogni caso, nei nomi dei gruppi non vanno mai scritti dati che identificano i pazienti: conviene aggiungere un avviso visibile accanto al campo del nome gruppo.

**3. Chiarire la cosa aperta dei file PowerPoint in LibreOffice.**
Mi avevi mandato degli screenshot di `.pptx` che non si aprivano bene. Non è stato chiarito se succedeva sul sito ancora vecchio o in locale. Finché non lo guardiamo, non possiamo dire che le esportazioni sono affidabili ovunque.

### Poi

**4. Rendere testabili anche gli altri esercizi.**
Fatto in gran parte: nel passo 4 ho costruito un assaggio che apre l'app in un browser vero, "trucca i dadi" e controlla tutti gli esercizi. Resta da trasformarlo in controlli che verifichino anche le regole cliniche di ciascun esercizio, non solo che il piatto sia identico a prima.

**5. Un controllore automatico a ogni caricamento.**
GitHub può far partire da solo i test ogni volta che carichi qualcosa e avvisarti con un segno rosso o verde. È come un **collega che assaggia il piatto prima che esca dalla cucina**. Se qualcosa si è rotto, lo sai prima che lo veda un collega di lavoro.

**6. Un numero di versione visibile nell'app.**
Per esempio "versione 1.3 — ottobre 2026" in basso. Così, se un collega ti dice "non funziona", sai subito quale versione sta usando. Si può accompagnare con un breve elenco "cosa è cambiato" (changelog).

**7. Un messaggio chiaro se qualcosa non si carica.**
Oggi, se un file della dispensa manca, l'app si ritrova con pulsanti che non fanno niente. Un avviso del tipo "manca un file, ricarica la pagina o avvisa Rodrigo" è molto più professionale di un silenzio.

**8. Provare le modifiche prima di pubblicarle.**
Invece di caricare direttamente sul sito che usano i colleghi, si lavora su una "copia di prova" (un ramo separato su GitHub) e la si pubblica solo quando hai controllato. Se qualcosa non va, la scarti e il sito vero non ha mai cambiato.

### Più avanti

**9. Un controllo sulla qualità delle parole che resti nel repository.**
La regola "almeno 12 parole, di cui almeno 6 frequenti" oggi si verifica con un vocabolario che non è nel repository, quindi i test non possono controllarla. Si potrebbe salvare un riepilogo del controllo (quante parole per ogni combinazione). Prima va controllata la questione delle licenze dei dizionari usati.

**10. Una licenza e i riconoscimenti.**
Un repository senza licenza, anche se pubblico, non dice agli altri cosa possono farne. Va scelta una licenza per il codice; le icone OpenMoji hanno già una loro licenza (CC BY-SA) che richiede di citarle. Sulla scelta ti consiglio di sentire un parere competente, perché dipende da cosa vuoi permettere ai colleghi.

**11. Possibilità di usarla senza internet.**
Con qualche accorgimento l'app può essere "installata" sul computer e funzionare anche senza connessione. Utile se in qualche sede la rete è instabile.

---

## In una riga

Prima era **un foglio solo**, ora è **una cucina con gli scaffali etichettati** e un assaggio di controllo. Per renderla davvero solida mancano soprattutto due cose: **le serrature di Firebase e il controllo delle esportazioni**. Il backup ora c'è. Il resto è ordine e comodità in più.
