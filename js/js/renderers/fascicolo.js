// Renderer (disegna il materiale a schermo) — Fascicolo esercizi a casa (comprende le funzioni di costruzione della pagina fEl, fGridTable, fWordList, fLegend, fPromptTable, fSection, highlightSetFromJS).
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function fEl(tag, attrs, children){
  const e = document.createElement(tag);
  Object.entries(attrs||{}).forEach(([k,v])=>{
    if(k==="class") e.className=v; else if(k==="html") e.innerHTML=v; else e.setAttribute(k,v);
  });
  (Array.isArray(children)?children:[children]).forEach(c=>{
    if(c==null) return;
    e.appendChild(typeof c==="string" ? document.createTextNode(c) : c);
  });
  return e;
}

// Costruisce l'insieme "riga,colonna" da evidenziare a partire da uno o più elenchi di
// occorrenze nella forma [[r,c],[r,c],...] — stessa logica del gemello in docbuilder.js,
// qui per l'anteprima a schermo (celle <td> colorate invece di celle di tabella Word).
function highlightSetFromJS(occurrenceLists){
  const set = new Set();
  occurrenceLists.forEach(cellsList=>{ cellsList.forEach(([r,c])=>set.add(r+","+c)); });
  return set;
}

function fGridTable(grid, cls, highlight){
  const table = fEl("table", {class:"fasc-grid " + (cls||"")});
  grid.forEach((row,r)=>{
    const tr = fEl("tr");
    row.forEach((sym,c)=>{
      const isHi = highlight && highlight.has(r+","+c);
      tr.appendChild(fEl("td",{class: isHi ? "fasc-cell-hi" : ""}, sym));
    });
    table.appendChild(tr);
  });
  return table;
}

function fWordList(words){
  // Se la stessa parola compare più volte in griglia (frequente per le corte, tipo "ORO"),
  // la si elenca una sola volta con il numero di occorrenze, invece di ripeterla identica.
  const counts = {};
  words.forEach(w=>{ counts[w] = (counts[w]||0)+1; });
  const wrap = fEl("div",{class:"fasc-wordlist"});
  Object.keys(counts).sort().forEach(w=>{
    const label = counts[w]>1 ? `${w} (×${counts[w]})` : w;
    wrap.appendChild(fEl("span",{class:"fasc-wordlist-item"}, label));
  });
  return wrap;
}

function fLegend(targets, counts, showSolutions){
  const wrap = fEl("div",{class:"fasc-legend-grid"});
  targets.forEach((t,i)=>{
    wrap.appendChild(fEl("div",{class:"fasc-legend-item"},[
      fEl("span",{class:"fasc-legend-seq"}, t.join(" ")),
      showSolutions ? fEl("span",{class:"fasc-legend-count"}, ` → ${counts[i]}`) : null
    ]));
  });
  return wrap;
}

function fPromptTable(prompts, solutions, showSolutions){
  const table = fEl("table",{class:"fasc-prompt"});
  prompts.forEach((p,i)=>{
    const tr = fEl("tr");
    tr.appendChild(fEl("td",{class:"fasc-prompt-cell"}, String(p)));
    tr.appendChild(fEl("td",{class:"fasc-answer-cell"}, showSolutions && solutions ? String(solutions[i] ?? "") : ""));
    table.appendChild(tr);
  });
  return table;
}

function fSection(title, sub, content, regenKey){
  const wrap = fEl("div",{class:"fasc-block"});
  const titleRow = fEl("div",{class:"fasc-title-row"});
  titleRow.appendChild(fEl("h3",{},title));
  if(regenKey){
    // Rigenera SOLO questa parte del fascicolo, al livello (settimana) scelto qui accanto
    // — non necessariamente quello della settimana globale — stessa identica logica di
    // generazione (incluse le liste anti-ripetizione) senza toccare il resto del fascicolo.
    const controls = fEl("div",{class:"fasc-regen-controls"});
    const select = fEl("select",{class:"fasc-week-select", title:"Livello (settimana) da usare per questa parte"});
    for(let w=1; w<=12; w++){
      const opt = fEl("option",{value:String(w)}, `Sett. ${w}`);
      if(w === (state.fascicoloPartWeek[regenKey] ?? state.fascicoloWeek)) opt.setAttribute("selected","selected");
      select.appendChild(opt);
    }
    select.onchange = ()=>{ state.fascicoloPartWeek[regenKey] = Number(select.value); };
    const btn = fEl("button",{class:"fasc-regen-btn", type:"button", title:"Rigenera solo questa parte, al livello scelto a sinistra"}, "↻ Rigenera");
    btn.onclick = ()=>regenerateFascicoloPart(regenKey, btn, Number(select.value));
    controls.appendChild(select);
    controls.appendChild(btn);
    titleRow.appendChild(controls);
  }
  wrap.appendChild(titleRow);
  if(sub) wrap.appendChild(fEl("div",{class:"fasc-sub"}, sub));
  wrap.appendChild(content);
  return wrap;
}

function renderFascicolo(deck){
  const root = fEl("div",{class:"fasc-root"});
  const p = deck.params;
  const showSolutions = state.reveal;
  const E = window.Engine;

  root.appendChild(fEl("h2",{}, `Fascicolo ${deck.week} — ${deck.week}°settimana`));
  if(deck.notices && deck.notices.length){
    const warn = fEl("div",{class:"fasc-warn"});
    warn.style.cssText = "border:2px solid #C77700;background:#FFF4E0;color:#5A3A00;border-radius:8px;padding:8px 12px;margin:8px 0;font-size:0.9em;";
    warn.innerHTML = "<b>Materiale nuovo esaurito per questo gruppo</b> — nessuna parola è stata ripetuta, ma alcune pagine ne contengono meno del solito:<br>" + deck.notices.map(n=>"• "+n).join("<br>") + "<br><i>Per ricominciare da zero usa il pulsante «Azzera il materiale già proposto» del gruppo.</i>";
    root.appendChild(warn);
  }

  deck.grids.forEach((g,i)=>{
    root.appendChild(fSection(
      `Cerchiare e contare tutte le sequenze ${g.target.join("")} (orizzontale e verticale)`,
      showSolutions ? `Occorrenze presenti nella griglia: ${g.count} — evidenziate in griglia.` : null,
      fGridTable(g.grid, null, showSolutions ? highlightSetFromJS(g.occurrences) : null),
      `grid${i}`
    ));
  });

  const multiWrap = fEl("div");
  multiWrap.appendChild(fGridTable(deck.multi.grid, null, showSolutions ? highlightSetFromJS(deck.multi.positions.flat()) : null));
  multiWrap.appendChild(fLegend(deck.multi.targets, deck.multi.counts, showSolutions));
  root.appendChild(fSection("Cerchiare tutte le sequenze indicate", null, multiWrap, "multi"));

  // Crucipuzzle italiano a ricerca libera: nessun elenco bersaglio nel fascicolo bianco —
  // il paziente cerca da solo parole di senso compiuto. Nelle soluzioni si evidenziano
  // TUTTE le parole realmente presenti in griglia (piazzate di proposito o comparse per
  // caso nel rumore di fondo), con l'elenco sotto.
  const cruciWrap = fEl("div");
  cruciWrap.appendChild(fGridTable(deck.crucipuzzle.grid, "fasc-cruci", showSolutions ? highlightSetFromJS(deck.crucipuzzle.foundWords.map(f=>f.cells)) : null));
  if(showSolutions) cruciWrap.appendChild(fWordList(deck.crucipuzzle.foundWords.map(f=>f.word)));
  root.appendChild(fSection(
    "Cerca nella griglia tutte le parole italiane di senso compiuto che riesci a trovare",
    `(almeno ${deck.crucipuzzle.minWordsToFind} — orizzontale, verticale e obliquo, in avanti e all'indietro)`,
    cruciWrap, "crucipuzzle"
  ));

  const seqTitle = E.sequencingInstructionText(deck.sequencing.mode);
  const seqDiv = fEl("div",{class:"fasc-svg-wrap", html: E.renderSequencingSVG(deck.sequencing)});
  root.appendChild(fSection(seqTitle, showSolutions ? `Ordine corretto: ${deck.sequencing.order.join(" → ")}` : null, seqDiv, "sequencing"));

  const mazeDiv = fEl("div",{class:"fasc-svg-wrap", html: E.renderMazeSVG(deck.maze, 18, showSolutions)});
  root.appendChild(fSection("Risolvere il labirinto", null, mazeDiv, "maze"));

  root.appendChild(fSection(deck.lexicalBlock.label, null, fPromptTable(deck.lexicalBlock.prompts, null, false), "lexicalBlock"));

  root.appendChild(fSection(`Scrivere parole che appartengano alle categorie (almeno ${deck.categoriesMinWords ?? p.categoryMinWords})`, null, fPromptTable(deck.categories, null, false), "categories"));

  root.appendChild(fSection("Risolvere i seguenti anagrammi", null,
    fPromptTable(deck.anagrams.map(a=>a.scrambled), deck.anagrams.map(a=>a.solution), showSolutions), "anagrams"));

  root.appendChild(fSection("Calcolare il risultato", null,
    fPromptTable(deck.calc.map(c=>c.expression), deck.calc.map(c=>c.result), showSolutions), "calc"));

  return root;
}
