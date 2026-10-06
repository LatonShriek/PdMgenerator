// Esportazione: tabella degli esportatori e funzione che sceglie quello giusto.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

const EXPORTERS = {
  griglie: exportGriglie,
  intruso: exportIntruso,
  inversione: exportInversione,
  serie: exportSerie,
  accesso: exportAccesso,
  categorizzazione: exportCategorizzazione,
  fascicolo: (deck)=>exportFascicolo(deck)
};

async function exportCurrent(){
  const btn = document.getElementById("btnExport");
  const original = btn.textContent;
  btn.disabled = true;
  if(state.exercise==="fascicolo") btn.textContent = "Generazione in corso…";
  try{
    await EXPORTERS[state.exercise](state.deck, state.level);
  } catch(e){
    console.error(e);
    alert("Errore nella generazione del documento: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}
