// Renderer (disegna il materiale a schermo) — Parentele.
// Un blocco per quesito: premesse, domanda, eventuali opzioni; la risposta compare con «Mostra risposta».
function renderParentele(deck){
  const wrap = document.createElement("div");
  deck.items.forEach((it,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    const h = document.createElement("div");
    h.className = "multi-block-head";
    h.innerHTML = `<b>Quesito ${i+1}/${deck.items.length}</b>`;
    block.appendChild(h);
    const body = document.createElement("div");
    body.style.cssText = "font-size:28px;line-height:1.5;padding:6px 4px;";
    it.premises.forEach(p=>{
      const d = document.createElement("div");
      d.textContent = p;
      body.appendChild(d);
    });
    const q = document.createElement("div");
    q.style.cssText = "margin-top:12px;font-weight:700;";
    q.textContent = it.question;
    body.appendChild(q);
    if(it.options){
      const o = document.createElement("div");
      o.style.cssText = "margin-top:8px;display:flex;gap:28px;flex-wrap:wrap;";
      it.options.forEach((opt,k)=>{
        const s = document.createElement("span");
        s.textContent = `${"ABCD"[k]}) ${opt}`;
        o.appendChild(s);
      });
      body.appendChild(o);
    }
    if(state.reveal){
      const a = document.createElement("div");
      a.className = "answer-inline";
      a.style.cssText = "margin-top:10px;display:inline-block;";
      a.textContent = it.answer + (it.reverse ? " — " + it.reverse : "");
      body.appendChild(a);
    }
    block.appendChild(body);
    wrap.appendChild(block);
  });
  return wrap;
}
