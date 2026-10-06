// Renderer (disegna il materiale a schermo) — Accesso lessicale online.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function renderAccesso(deck){
  if(deck.slides.length === 1){
    const s = deck.slides[0];
    const div = document.createElement("div");
    div.className = "single-word";
    div.textContent = s.word;
    // font adattato alla lunghezza della parola: corta -> grande, lunga -> più contenuta,
    // così riempie sempre bene lo spazio senza mai uscire dal riquadro.
    const len = s.word.length;
    const size = Math.max(48, Math.min(150, Math.round(1400/len)));
    div.style.fontSize = size + "px";
    return div;
  }
  // Più parole nella stessa sessione: elenco impilato, ciascuna comunque grande e
  // adattata alla propria lunghezza, invece di una sola parola gigante a schermo.
  const wrap = document.createElement("div");
  deck.slides.forEach((s,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    const h = document.createElement("div");
    h.className = "multi-block-head";
    h.innerHTML = `<b>Parola ${i+1}/${deck.slides.length}</b>`;
    block.appendChild(h);
    const div = document.createElement("div");
    div.className = "single-word";
    div.textContent = s.word;
    const len = s.word.length;
    div.style.fontSize = Math.max(36, Math.min(90, Math.round(900/len))) + "px";
    block.appendChild(div);
    wrap.appendChild(block);
  });
  return wrap;
}
