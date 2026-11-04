// Stato dell'app, elenco degli esercizi e numerazione fissa.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   STATO
   ========================================================= */
const state = {
  exercise:"griglie",
  level:1,
  // Livello indipendente per ciascun esercizio a "livelli" (non il fascicolo, che ha la
  // sua settimana a parte): passare da un esercizio all'altro non fa più perdere il
  // progresso raggiunto in quello lasciato. state.level resta comunque lo specchio del
  // livello dell'esercizio attivo (state.levels[state.exercise]) — letto/scritto ovunque
  // come prima, ma sincronizzato con la mappa a ogni cambio di esercizio o di slider.
  levels: { categorizzazione:1, intruso:1, griglie:1, serie:1, inversione:1, accesso:1, classificazioni:1, intrusoconc:1, analogie:1 },
  digitRule:"inverti",
  catMode:"raggruppa",
  materialOverride:{griglie:"auto", intruso:"auto", inversione:"auto"},
  inversioneItemsOverride:null,
  inversioneForceAlnum:false,
  intrusoScreensOverride:null,
  serieItemsOverride:null,
  classificazioniItemsOverride:null,
  intrusoconcItemsOverride:null,
  analogieItemsOverride:null,
  serieShowNextCriterion:false,
  groupNumber:"",
  categorizzazioneTrialsOverride:null,
  accessoWordsOverride:null,
  fascicoloWeek:1,
  // Livello (settimana) scelto per la rigenerazione di UNA singola parte del fascicolo,
  // quando diverso dalla settimana globale — es. {grid0: 5} rigenera solo la prima griglia
  // al livello della settimana 5, lasciando la settimana globale invariata. Una parte non
  // presente qui segue semplicemente la settimana globale.
  fascicoloPartWeek:{},
  deck:null,
  slideIndex:0,
  reveal:false,
  _generationToken:0
};

const EXERCISES = [
  {id:"categorizzazione", name:"Categorizzazione", desc:"Dividi 6 immagini in 2 gruppi da 3 (prototipo con icone)"},
  {id:"intruso", name:"Intruso percettivo", desc:"Trova l'unico elemento senza il suo pari"},
  {id:"griglie", name:"Griglie-Conteggio", desc:"Ricerca visiva e conteggio in griglia"},
  {id:"serie", name:"Serie attentive alternate", desc:"Attenzione alternata, task-switching, n-back"},
  {id:"inversione", name:"Inversione e riordino", desc:"Span e manipolazione di sequenze"},
  {id:"accesso", name:"Accesso lessicale online", desc:"Denominazione con cueing graduato"},
  {id:"classificazioni", name:"Classificazioni", desc:"Ragionamento verbale: dati tre termini, nominare la categoria"},
  {id:"intrusoconc", name:"Intruso concettuale", desc:"Ragionamento verbale: quattro parole, trovare quella che non c'entra"},
  {id:"analogie", name:"Analogie", desc:"Ragionamento verbale: A sta a B come C sta a ?"},
  {id:"fascicolo", name:"Fascicolo esercizi a casa", desc:"Fascicolo stampabile per gli esercizi a domicilio, progressione settimanale"}
];
// Numero di sessione fisso per esercizio (usato nel nome del file esportato), fedele
// all'ordine dei tuoi materiali originali — non l'ordine alfabetico o di comparsa
// nell'elenco, che potrebbe cambiare in futuro senza dover rinumerare i file.
const EXERCISE_NUMBER = {
  categorizzazione: 1, intruso: 2, griglie: 3, serie: 4, inversione: 5, accesso: 6, classificazioni: 7, intrusoconc: 8, analogie: 9,
};

/* =========================================================
   GENERATORI — uno per esercizio, dipendenti dal livello
   ========================================================= */
