// Renderer (disegna il materiale a schermo) — Inversione e riordino.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function renderMarkedText(item){
  // item = {text, marks:[{index,color}]}
  const frag = document.createElement("span");
  const markMap = {};
  item.marks.forEach(m=>markMap[m.index]=m.color);
  [...item.text].forEach((ch,i)=>{
    const c = document.createElement("span");
    c.textContent = ch;
    if(markMap[i]) c.style.color = markMap[i];
    frag.appendChild(c);
  });
  return frag;
}

function renderInversione(deck){
  const wrap = document.createElement("div");
  wrap.className = "word-list";
  deck.blocks.forEach(b=>{
    const block = document.createElement("div");
    block.className = "word-block";
    const h = document.createElement("h3");
    h.textContent = b.label;
    block.appendChild(h);
    const row = document.createElement("div");
    row.className = "word-items";
    b.items.forEach(it=>{
      const span = document.createElement("span");
      span.appendChild(renderMarkedText(it));
      if(state.reveal){
        // Tutte le regole applicabili a QUESTO tipo di blocco, mostrate insieme (non una
        // sola selezionata) — così ogni stimolo porta già pronte tutte le trasformazioni
        // valide, da usare liberamente durante la seduta.
        const applicable = SEQUENCE_RULES.filter(r=>r.kinds.includes(b.kind));
        applicable.forEach(rule=>{
          const small = document.createElement("small");
          small.textContent = `${rule.label}: ${rule.apply(it.text)}`;
          span.appendChild(small);
        });
      }
      row.appendChild(span);
    });
    block.appendChild(row);
    wrap.appendChild(block);
  });
  return wrap;

}
