// Renderer (disegna il materiale a schermo) — Classificazioni.
// Un blocco per quesito: i tre termini in grande, eventuali opzioni; la risposta con «Mostra risposta».
function renderClassificazioni(deck){
  const wrap = document.createElement("div");
  deck.items.forEach((it,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    const h = document.createElement("div");
    h.className = "multi-block-head";
    h.innerHTML = `<b>Quesito ${i+1}/${deck.items.length}</b> — A quale categoria appartengono questi tre termini?`;
    block.appendChild(h);
    const body = document.createElement("div");
    body.style.cssText = "font-size:40px;line-height:1.4;padding:8px 4px;font-weight:600;";
    body.textContent = it.terms.join("  ·  ");
    block.appendChild(body);
    if(it.options){
      const o = document.createElement("div");
      o.style.cssText = "font-size:26px;display:flex;gap:28px;flex-wrap:wrap;padding:4px;";
      it.options.forEach((opt,k)=>{
        const s = document.createElement("span");
        s.textContent = `${"ABCD"[k]}) ${opt}`;
        o.appendChild(s);
      });
      block.appendChild(o);
    }
    if(state.reveal){
      const a = document.createElement("div");
      a.className = "answer-inline";
      a.style.cssText = "margin:8px 4px;display:inline-block;";
      const alt = it.accepted.filter(x=>x!==it.category);
      a.textContent = it.category + (alt.length ? " (anche: " + alt.join(", ") + ")" : "");
      block.appendChild(a);
    }
    wrap.appendChild(block);
  });
  return wrap;
}
