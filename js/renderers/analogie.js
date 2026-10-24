// Renderer — Analogie: «A : B = C : ?» in grande, eventuali opzioni; risposta con «Mostra risposta».
function renderAnalogie(deck){
  const wrap = document.createElement("div");
  deck.items.forEach((it,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    const h = document.createElement("div");
    h.className = "multi-block-head";
    h.innerHTML = `<b>Quesito ${i+1}/${deck.items.length}</b> — Completare l'analogia`;
    block.appendChild(h);
    const q = document.createElement("div");
    q.style.cssText = "font-size:40px;font-weight:600;padding:10px 4px;";
    q.textContent = it.prompt;
    block.appendChild(q);
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
      a.textContent = it.answer + (it.accepted.length>1 ? " — accettate anche: " + it.accepted.slice(1).join(", ") : "");
      block.appendChild(a);
    }
    wrap.appendChild(block);
  });
  return wrap;
}
