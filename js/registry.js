// Mappe degli esercizi: renderer, generatori, cronologia del materiale.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
const RENDERERS = {
  griglie: renderGriglie,
  intruso: renderIntruso,
  inversione: renderInversione,
  serie: renderSerie,
  accesso: renderAccesso,
  classificazioni: renderClassificazioni,
  intrusoconc: renderIntrusoConcettuale,
  analogie: renderAnalogie,
  categorizzazione: renderCategorizzazione,
  fascicolo: renderFascicolo
};

const GENERATORS = {
  griglie: genGriglie,
  intruso: genIntruso,
  inversione: genInversione,
  serie: genSerie,
  accesso: genAccesso,
  classificazioni: genClassificazioni,
  intrusoconc: genIntrusoConcettuale,
  analogie: genAnalogie,
  categorizzazione: (level)=>genCategorizzazioneV2(level, 9),
  fascicolo: genFascicolo
};

// Campo di cronologia (per gruppo) e capienza massima, per gli esercizi con materiale ruotato.
const MATERIAL_HISTORY = {
  griglie:    { field:"usedGriglie",    cap:600 },
  intruso:    { field:"usedIntruso",    cap:4000 },
  inversione: { field:"usedInversione", cap:4000 },
  classificazioni: { field:"usedClassificazioni", cap:4000 },
  intrusoconc: { field:"usedIntrusoConc", cap:4000 },
  analogie:    { field:"usedAnalogie", cap:5000 }
};
