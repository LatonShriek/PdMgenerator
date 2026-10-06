// Generatore — Serie attentive alternate.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale prima e dopo identico).

// ---------- SERIE ATTENTIVE ALTERNATE ----------
function genSerie(level){
  const length = state.serieItemsOverride || 154; // come negli originali (stessa lunghezza in tutte le sessioni), regolabile
  const pool = ["A","B","1","2"];
  const colors = ["black","red"];
  const MAX_RUN = 3;
  // Le prime 4 stimolazioni sono sempre fisse, come richiesto: A (nero), B (rosso),
  // 1 (rosso), 2 (nero) — un'apertura di riscaldamento uguale ad ogni generazione.
  // Dalla 5ª in poi simbolo e colore restano indipendenti e liberi (per non
  // vanificare le regole dal livello 17 in poi, che richiedono lettere E numeri
  // in entrambi i colori), col solo vincolo di non ripetere lo stesso simbolo né
  // lo stesso colore per più di 3 volte di fila.
  const seq = [
    { char: "A", color: "black" },
    { char: "B", color: "red" },
    { char: "1", color: "red" },
    { char: "2", color: "black" },
  ];
  const runsUpTo = (arr, key, value, n) => arr.length >= n && arr.slice(-n).every(s => s[key] === value);
  for(let i=seq.length;i<length;i++){
    let char, tries = 0;
    do { char = pick(pool); tries++; } while (tries < 30 && runsUpTo(seq, 'char', char, MAX_RUN));
    let color, tries2 = 0;
    do { color = pick(colors); tries2++; } while (tries2 < 30 && runsUpTo(seq, 'color', color, MAX_RUN));
    seq.push({char, color});
  }
  const rule = SERIE_RULES[level-1];
  const nextRule = level < SERIE_MAX_LEVEL ? SERIE_RULES[level] : null;
  return {
    type:"serie",
    seq,
    rule, nextRule,
    slides: seq.map((s,i)=>({...s, index:i}))
  };
}
