// Renderer (disegna il materiale a schermo) — Griglie-Conteggio.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function gridRuleLabel(r){ return r.keepText ? r.text : r.text.replace(/^Conta (tutti )?(gli )?/,""); }

function renderOneGrid(s){
  const rule = s.rules[s.ruleIndex];
  const grid = document.createElement("div");
  grid.className = "grid-wrap";
  grid.style.gridTemplateColumns = `repeat(${s.cols}, minmax(0,1fr))`;
  s.cells.forEach(c=>{
    const div = document.createElement("div");
    const isAns = state.reveal && rule.matches(c);
    div.className = "cell circle-cell" + (isAns ? " answer":"");
    const fillHex = colorHex(c.fill) || "#FFFFFF";
    const borderHex = colorHex(c.border) || "#000000";
    const symHex = colorHex(c.symColor) || "#101010";
    div.style.background = fillHex;
    div.style.borderWidth = "3px";
    div.style.borderStyle = ({continuo:"solid", tratteggiato:"dashed", puntinato:"dotted"})[c.bStyle] || "solid";
    div.style.borderRadius = "50%";
    div.style.borderColor = isAns ? "#2F6F63" : borderHex;
    div.style.color = symHex;
    div.style.fontWeight = "800";
    // Differenza grande/piccolo resa ben evidente (rapporto ~2,4:1; prima 0,6 → ~1,7:1, segnalato
    // da Rodrigo). Le celle senza attributo dimensione (c.size assente) restano alla misura normale.
    if(c.size==="piccolo"){
      const sm = document.createElement("span");
      sm.style.fontSize = "0.5em";
      sm.textContent = c.sym;
      div.appendChild(sm);
    } else if(c.size==="grande"){
      const bg = document.createElement("span");
      bg.style.fontSize = "1.2em";
      bg.textContent = c.sym;
      div.appendChild(bg);
    } else {
      div.textContent = c.sym;
    }
    grid.appendChild(div);
  });
  return grid;
}

function renderGriglie(deck){
  const wrap = document.createElement("div");
  deck.slides.forEach((s,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    if(deck.slides.length > 1){
      const h = document.createElement("div");
      h.className = "multi-block-head";
      h.innerHTML = `<b>Griglia ${i+1}/${deck.slides.length}</b>`;
      block.appendChild(h);
    }
    block.appendChild(renderOneGrid(s));
    // Tutte le regole valide per QUESTA griglia (fino a 10), visibili insieme — non serve
    // più cliccare "prossima regola" per vederle una alla volta: quella attiva (evidenziata
    // sulla griglia sopra) è segnata, le altre restano lì come alternative pronte all'uso.
    const list = document.createElement("ol");
    list.className = "rule-list";
    s.rules.forEach((r,ri)=>{
      const li = document.createElement("li");
      li.className = ri===s.ruleIndex ? "rule-active" : "";
      li.innerHTML = gridRuleLabel(r) + (state.reveal ? ` <span class="answer-inline">(${r.answer || (r.count+" elementi")})</span>` : "");
      li.style.cursor = "pointer";
      li.onclick = ()=>{ s.ruleIndex = ri; render(); };
      list.appendChild(li);
    });
    block.appendChild(list);
    wrap.appendChild(block);
  });
  return wrap;
}
