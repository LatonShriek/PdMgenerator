# Generatore attività — PdM CDCD

Web app per generare materiale di stimolazione cognitiva per gruppi MCI/DNMi/DCL (Percorso Diagnostico-terapeutico-assistenziale per il Deterioramento Cognitivo). Sostituisce la creazione manuale di varianti "fresche" dello stesso esercizio: stessa struttura e stesso livello di difficoltà della sessione originale, contenuto sempre nuovo, per ripetere la stimolazione senza effetto apprendimento/memorizzazione da parte del gruppo.

Non c'è backend: l'app gira interamente nel browser (JavaScript vanilla, nessun framework, nessuna build). Le librerie per le esportazioni e per la cronologia condivisa opzionale sono **incluse nel repository** (`vendor/`), quindi l'app non dipende da CDN esterni (resta solo una rete di sicurezza per la libreria `docx`, vedi [docs/esportazione-e-backup.md](docs/esportazione-e-backup.md)).

> **Per chi mantiene il progetto:** leggere la documentazione in `docs/` (almeno `struttura.md`, `attivita.md` e `banche-e-categorie.md`) prima di toccare i generatori, le banche di parole o le regole di qualità. Le regole di lavoro e lo stato dei passi di refactoring sono in `REGOLE_DI_LAVORO.md`.

## Dove trovare cosa

La documentazione è divisa per argomento nella cartella `docs/`:

| Se vuoi sapere… | Leggi |
|---|---|
| Com'è fatto il codice, cosa sta in quale cartella e perché | [docs/struttura.md](docs/struttura.md) |
| I 7 tipi di attività, i livelli, l'anti-ripetizione, la progressione di gruppo | [docs/attivita.md](docs/attivita.md) |
| Come funzionano le esportazioni PowerPoint/Word e la copia di sicurezza | [docs/esportazione-e-backup.md](docs/esportazione-e-backup.md) |
| Il Fascicolo esercizi a casa | [docs/fascicolo.md](docs/fascicolo.md) |
| Le banche di parole, le categorie semantiche, la libreria dei criteri | [docs/banche-e-categorie.md](docs/banche-e-categorie.md) |
| L'interfaccia | [docs/interfaccia.md](docs/interfaccia.md) |
| I test e i controlli "prima e dopo" | [docs/test.md](docs/test.md) |
| Come si pubblica, come si modificano dati e librerie, a che punto è il riordino, sicurezza e privacy | [docs/pubblicazione-e-refactoring.md](docs/pubblicazione-e-refactoring.md) |
| Le buone pratiche per costruire un'app web, emerse da questo progetto | [GUIDA_BUONE_PRATICHE.md](GUIDA_BUONE_PRATICHE.md) |
| In parole semplici: perché è fatta così | [SPIEGAZIONE_SEMPLICE.md](SPIEGAZIONE_SEMPLICE.md) |
| Le regole di lavoro e lo stato dei passi | [REGOLE_DI_LAVORO.md](REGOLE_DI_LAVORO.md) |

## Scopo

Chi conduce gruppi di stimolazione cognitiva deve ripetere esercizi equivalenti nel tempo senza riproporre lo stesso materiale: se il paziente riconosce la scheda, allena la memoria di quella scheda e non la funzione che si vuole stimolare. Preparare a mano molte varianti equivalenti è lungo e soggetto a errori di difficoltà.

L'app genera al volo materiale **nuovo ma di difficoltà controllata**, tiene traccia di ciò che ogni gruppo ha già visto per non riproporlo, suggerisce quando salire di livello, ed esporta in formati direttamente usabili in seduta (PowerPoint) o a casa (Word stampabile).

## Cosa fa, in sintesi

1. Il terapista sceglie un esercizio dalla lista in sidebar e un livello di difficoltà (1–32, scala comune a tutti gli esercizi tranne il Fascicolo).
2. L'app genera materiale procedurale a quel livello — mai identico a una generazione precedente — e lo mostra a schermo, pronto per la seduta (in presenza o in videochiamata).
3. Il terapista può rigenerare all'infinito, mostrare risposta/regola, esportare in PowerPoint (o in Word per il Fascicolo), stampare, e tenere uno storico per gruppo/paziente così lo stesso materiale non viene mai riproposto.
4. Un pannello di "progressione del gruppo" registra l'esito di ogni seduta e suggerisce se mantenere il livello o salire.

## Come lavora Rodrigo su questo progetto

- Valida logica e struttura di ogni nuovo esercizio/modulo tramite cicli di feedback iterativi, condividendo esempi reali (fascicoli, pptx di categorizzazione) da cui derivare template e regole.
- Approccio di sviluppo: prima si valida modello dati e logica in conversazione, poi si passa all'implementazione.
- Correzioni tecnicamente precise: identifica problemi strutturali/metodologici, non solo di superficie.
