// Renderer — Intruso concettuale: quattro parole in grande, con «Mostra risposta» si evidenzia l'intruso.
function renderIntrusoConcettuale(deck){
  const wrap = document.createElement("div");
  deck.items.forEach((it,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    const h = document.createElement("div");
    h.className = "multi-block-head";
    h.innerHTML = `<b>Quesito ${i+1}/${deck.items.length}</b> — Quale parola non c'entra con le altre?`;
    block.appendChild(h);
    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:12px 36px;font-size:38px;font-weight:600;padding:10px 4px;";
    it.words.forEach((w,k)=>{
      const s = document.createElement("span");
      s.textContent = w;
      if(state.reveal && k===it.oddIndex) s.className = "answer-inline";
      row.appendChild(s);
    });
    block.appendChild(row);
    if(state.reveal){
      const a = document.createElement("div");
      a.className = "level-note";
      a.style.margin = "4px";
      a.textContent = it.answer;
      block.appendChild(a);
    }
    wrap.appendChild(block);
  });
  return wrap;
}
