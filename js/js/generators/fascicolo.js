// Generatore — Fascicolo esercizi a casa (chiama il motore Engine.buildFascicolo).
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

/* ---------- FASCICOLO ESERCIZI A CASA ---------- */
function genFascicolo(){
  return window.Engine.buildFascicolo(state.fascicoloWeek, Math.floor(Math.random()*1e9), {});
}
