// Renderer (disegna il materiale a schermo) — Serie attentive alternate.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function renderSerie(deck){
  const s = deck.slides[state.slideIndex];
  const div = document.createElement("div");
  div.className = "single-item";
  div.style.color = s.color==="red" ? "#B23A2C" : "#1E2A26";
  div.textContent = s.char;
  const label = document.createElement("div");
  label.className = "sub-label";
  label.textContent = `Stimolo ${s.index+1} / ${deck.slides.length}`;
  const holder = document.createElement("div");
  holder.style.position="relative";
  holder.style.width="100%";
  holder.style.height="100%";
  holder.style.display="flex";
  holder.style.alignItems="center";
  holder.style.justifyContent="center";
  holder.appendChild(label);
  holder.appendChild(div);
  return holder;
}
