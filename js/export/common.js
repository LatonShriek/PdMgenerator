// Esportazione: funzioni comuni (nome file, colori, font).
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

// Nome file coerente con la numerazione dei tuoi materiali originali:
// "{N} - {Nome esercizio}.{livello}({numero gruppo}).pptx" — il numero di gruppo
// arriva dal campo in sidebar; se non è stato compilato, si omette la parte tra
// parentesi invece di scrivere "()" vuoto.
function exportFileName(exId, level, ext){
  const ex = EXERCISES.find(e=>e.id===exId);
  const n = EXERCISE_NUMBER[exId];
  const prefix = n ? `${n} - ` : "";
  const group = state.groupNumber ? `(${state.groupNumber})` : "";
  return `${prefix}${ex.name}.${level}${group}.${ext}`;
}

/* =========================================================
   ESPORTAZIONE IN POWERPOINT (client-side, nessun server)
   ========================================================= */
function hexNoHash(h){ return h.replace("#",""); }

 // quota della cella occupata dal glifo: resta margine, niente sovrapposizioni
const PPTX_FONT_STACK = 'Calibri, Arial, "Segoe UI Symbol", "Apple Symbols", sans-serif';
