// Renderer (disegna il materiale a schermo) — Griglie-Conteggio.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function gridRuleLabel(r){ return r.keepText ? r.text : r.text.replace(/^Conta (tutti )?(gli )?/,""); }

// Disegno vero delle forme geometriche (vedi GRID_SHAPES nel generatore): SVG in una scatola 100×100 che si ridimensiona con
// il testo (1,5em: le forme devono leggersi bene anche a distanza), così le misure "grande/piccolo" della cella restano valide. Il rombo è un vero rombo (largo 62, alto 88),
// non un quadrato ruotato; le forme vuote hanno il contorno spesso (14 su 100) perché il loro colore si veda bene.
function gridShapeSvg(sym, color){
  const d = GRID_SHAPES[sym];
  if(!d) return null;
  let body;
  if(d.geo==="circle") body = `<circle cx="50" cy="50" r="${d.filled?43:37}"/>`;
  else if(d.geo==="square") body = d.filled ? `<rect x="14" y="14" width="72" height="72"/>` : `<rect x="19" y="19" width="62" height="62"/>`;
  else if(d.geo==="triUp") body = d.filled ? `<polygon points="50,9 93,88 7,88"/>` : `<polygon points="50,15 86,82 14,82"/>`;
  else if(d.geo==="triDown") body = d.filled ? `<polygon points="50,91 93,12 7,12"/>` : `<polygon points="50,85 86,18 14,18"/>`;
  else if(d.geo==="rhombus") body = d.filled ? `<polygon points="50,6 81,50 50,94 19,50"/>` : `<polygon points="50,13 75,50 50,87 25,50"/>`;
  else {
    const R = d.filled ? 49 : 42, r = R*0.42, pts = [];
    for(let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, rad = i%2===0 ? R : r; pts.push((50+rad*Math.cos(a)).toFixed(1)+","+(54+rad*Math.sin(a)).toFixed(1)); }
    body = `<polygon points="${pts.join(" ")}"/>`;
  }
  const paint = d.filled ? `fill="${color}" stroke="${color}" stroke-width="3"` : `fill="none" stroke="${color}" stroke-width="14"`;
  return `<svg viewBox="0 0 100 100" width="1.5em" height="1.5em" style="display:block" aria-label="${d.name}"><g ${paint} stroke-linejoin="round">${body}</g></svg>`;
}
// Scrive il simbolo di una cella dentro `el`: disegno SVG per le forme, testo per tutto il resto.
function setGridSym(el, sym, color){
  const svg = gridShapeSvg(sym, color);
  if(svg) el.innerHTML = svg; else el.textContent = sym;
}

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
      setGridSym(sm, c.sym, symHex);
      div.appendChild(sm);
    } else if(c.size==="grande"){
      const bg = document.createElement("span");
      bg.style.fontSize = "1.2em";
      setGridSym(bg, c.sym, symHex);
      div.appendChild(bg);
    } else {
      setGridSym(div, c.sym, symHex);
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
