# Il modulo "Fascicolo esercizi a casa"

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

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
