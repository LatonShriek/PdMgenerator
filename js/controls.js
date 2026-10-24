// Controlli della sidebar specifici di ogni esercizio.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
const MATERIAL_OPTIONS = {
  griglie: [
    {id:"auto", label:"Automatico (da livello)"},
    {id:"digits", label:"Cifre", kind:"char", pool:["1","2","3","4","6","7"]},
    {id:"letters", label:"Lettere", kind:"char", pool:["A","B","D","E","N","U"]},
    {id:"mixed", label:"Alfanumerico misto", kind:"char", pool:["1","4","D","A","7","N"]},
    {id:"shapes", label:"Forme geometriche", kind:"shape", pool:["●","▲","■"]},
    {id:"arrows", label:"Frecce", kind:"arrow", pool:["↑","↓","←","→"]},
    {id:"cyrillic", label:"Cirillico", kind:"unicode", base:0x0410, count:5},
    {id:"cjk", label:"Ideogrammi cinesi", kind:"unicode", base:0x53E3, count:4},
    {id:"geez", label:"Ge'ez (etiope)", kind:"unicode", base:0x1200, count:5}
  ],
  intruso: [
    {id:"auto", label:"Automatico (da livello, 9 schermate miste)"},
    {id:"digit", label:"Solo cifre"},
    {id:"letter", label:"Solo lettere"},
    {id:"suits", label:"Solo semi delle carte"},
    {id:"music", label:"Solo note musicali"},
    {id:"punct", label:"Solo punteggiatura"},
    {id:"zodiac", label:"Solo simboli zodiacali"},
    {id:"cyrillic", label:"Solo cirillico"},
    {id:"geez", label:"Solo Ge'ez (etiope)"},
    {id:"dice", label:"Solo dadi"},
    {id:"cjk", label:"Solo ideogrammi cinesi"},
    {id:"lower", label:"Solo lettere minuscole"},
    {id:"mixedcase", label:"Solo lettere a/A mescolate"},
    {id:"circles", label:"Solo cerchi parziali"},
    {id:"quadrants", label:"Solo quadranti"},
    {id:"greek", label:"Solo alfabeto greco"},
    {id:"box", label:"Solo tratti da tabella"},
    {id:"sets", label:"Solo simboli insiemistici"},
    {id:"braille", label:"Solo Braille"},
    {id:"katakana", label:"Solo katakana"},
    {id:"hiragana", label:"Solo hiragana"},
    {id:"hebrew", label:"Solo ebraico"},
    {id:"devanagari", label:"Solo devanagari"}
  ],
  inversione: [
    {id:"auto", label:"Automatico (da livello)"},
    {id:"letters", label:"Solo lettere"},
    {id:"digits", label:"Solo numeri"},
    {id:"mixed", label:"Solo alfanumerico misto"}
  ]
};

function materialSelector(exId){
  const wrap = document.createElement("div");
  const label = document.createElement("label");
  label.textContent = "Tipo di materiale";
  wrap.appendChild(label);
  const group = document.createElement("div");
  group.className = "btn-group";
  MATERIAL_OPTIONS[exId].forEach(o=>{
    const chip = document.createElement("button");
    chip.className = "chip" + (state.materialOverride[exId]===o.id ? " active":"");
    chip.textContent = o.label;
    chip.onclick = ()=>{ state.materialOverride[exId] = o.id; renderExControls(); generate(); };
    group.appendChild(chip);
  });
  wrap.appendChild(group);
  return wrap;
}

function numerosityControl(labelText, stateKey, min, max, autoValue){
  const wrap = document.createElement("div");
  const countLabel = document.createElement("label");
  countLabel.style.marginTop = "14px";
  countLabel.textContent = labelText;
  wrap.appendChild(countLabel);
  const countRow = document.createElement("div");
  countRow.className = "level-row";
  const isAuto = state[stateKey]==null;
  const countInput = document.createElement("input");
  countInput.type = "range"; countInput.min = String(min); countInput.max = String(max);
  countInput.value = state[stateKey] || autoValue;
  const countBadge = document.createElement("div");
  countBadge.className = "level-badge";
  countBadge.textContent = isAuto ? "auto" : countInput.value;
  countInput.addEventListener("input", e=>{
    state[stateKey] = Number(e.target.value);
    countBadge.textContent = state[stateKey];
    generate();
  });
  countRow.appendChild(countInput); countRow.appendChild(countBadge);
  wrap.appendChild(countRow);
  const resetBtn = document.createElement("button");
  resetBtn.className = "chip" + (isAuto ? " active":"");
  resetBtn.style.marginTop = "8px";
  resetBtn.textContent = "Automatico (da livello)";
  resetBtn.onclick = ()=>{ state[stateKey]=null; renderExControls(); generate(); };
  wrap.appendChild(resetBtn);
  return wrap;
}

const EX_CONTROLS = {
  griglie: ()=>{
    const wrap = document.createElement("div");
    wrap.appendChild(materialSelector("griglie"));
    const btn = document.createElement("button");
    btn.className = "action ghost";
    btn.style.marginTop = "10px";
    btn.textContent = "Prossima regola su questa griglia →";
    btn.onclick = ()=>{
      state.deck.slides.forEach(s=>{ s.ruleIndex = (s.ruleIndex+1) % s.rules.length; });
      render();
    };
    wrap.appendChild(btn);
    return wrap;
  },
  classificazioni: ()=>{
    const wrap = document.createElement("div");
    const note = document.createElement("div");
    note.className = "level-note";
    note.textContent = "Dati tre termini, nominare la categoria. Livelli 1-8: scelta fra 4 opzioni; poi risposta libera. Banca di categorie in validazione (voci «proposta»): le risposte accettate compaiono con «Mostra risposta».";
    wrap.appendChild(note);
    wrap.appendChild(numerosityControl("Numero di quesiti per sessione", "classificazioniItemsOverride", 4, 16, 8));
    return wrap;
  },
  intrusoconc: ()=>{
    const wrap = document.createElement("div");
    const note = document.createElement("div");
    note.className = "level-note";
    note.textContent = "Quattro parole: tre della stessa categoria, una no. Fino al livello 8 l'intruso viene da un campo molto lontano; dal 9 sempre più spesso dallo stesso campo (più difficile). Banca di categorie in validazione.";
    wrap.appendChild(note);
    wrap.appendChild(numerosityControl("Numero di quesiti per sessione", "intrusoconcItemsOverride", 4, 16, 8));
    return wrap;
  },
  analogie: ()=>{
    const wrap = document.createElement("div");
    const note = document.createElement("div");
    note.className = "level-note";
    note.textContent = "A : B = C : ?  Fino al livello 12 la risposta si sceglie fra 4 opzioni; dal 17 anche quesiti invertiti (A : B = ? : D). Banca di coppie in validazione (voci «proposta»).";
    wrap.appendChild(note);
    wrap.appendChild(numerosityControl("Numero di quesiti per sessione", "analogieItemsOverride", 4, 16, 8));
    return wrap;
  },
  serie: ()=>{
    const wrap = document.createElement("div");
    const note = document.createElement("div");
    note.className = "level-note";
    note.textContent = `32 livelli (i primi 24 sono l'elenco originale, i livelli 25-32 sono una proposta da validare). Ogni livello ha una sola consegna.`;
    wrap.appendChild(note);
    const nextRow = document.createElement("label");
    nextRow.style.cssText = "display:flex; align-items:center; gap:8px; margin-top:14px; font-weight:600;";
    const nextCheck = document.createElement("input");
    nextCheck.type = "checkbox";
    nextCheck.checked = state.serieShowNextCriterion;
    nextCheck.addEventListener("change", e=>{ state.serieShowNextCriterion = e.target.checked; render(); });
    nextRow.appendChild(nextCheck);
    nextRow.appendChild(document.createTextNode("Aggiungi anche la consegna del livello successivo (per gruppi più abili)"));
    wrap.appendChild(nextRow);
    const nextNote = document.createElement("div");
    nextNote.className = "level-note";
    nextNote.textContent = "Controlla solo il pannello a schermo qui in sidebar (utile mentre generi il materiale). Nel file PowerPoint esportato, regola in vigore e regola successiva vanno sempre entrambe nelle note del relatore — mai come testo sulla slide, quindi mai visibili al paziente durante la proiezione o la stampa normale.";
    wrap.appendChild(nextNote);
    wrap.appendChild(numerosityControl("Numero di stimoli nella serie", "serieItemsOverride", 20, 300, 154));
    return wrap;
  },
  intruso: ()=>{
    const wrap = document.createElement("div");
    wrap.appendChild(materialSelector("intruso"));
    wrap.appendChild(numerosityControl("Numero di schermate per sessione", "intrusoScreensOverride", 4, 16, 9));
    return wrap;
  },
  inversione: ()=>{
    const wrap = document.createElement("div");
    wrap.appendChild(materialSelector("inversione"));
    const label = document.createElement("label");
    label.style.marginTop = "12px";
    label.textContent = "Regole disponibili";
    wrap.appendChild(label);
    const list = document.createElement("div");
    list.className = "level-note";
    list.innerHTML = SEQUENCE_RULES.map(r=>`<b>${r.label}</b> (${r.kinds.join(", ")})`).join("<br>");
    wrap.appendChild(list);
    const howNote = document.createElement("div");
    howNote.className = "level-note";
    howNote.style.marginTop = "8px";
    howNote.textContent = "Con \"Mostra risposta / regola\" attivo, sotto ogni stimolo compaiono TUTTE le trasformazioni valide per quel tipo di blocco insieme, non una sola da scegliere — puoi usarle liberamente durante la seduta.";
    wrap.appendChild(howNote);
    wrap.appendChild(numerosityControl("Numero di stimoli per blocco", "inversioneItemsOverride", 2, 10, defaultItemsPerInversione(state.level)));

    const alnumRow = document.createElement("label");
    alnumRow.style.cssText = "display:flex; align-items:center; gap:8px; margin-top:14px; font-weight:600;";
    const alnumCheck = document.createElement("input");
    alnumCheck.type = "checkbox";
    alnumCheck.checked = state.inversioneForceAlnum;
    alnumCheck.addEventListener("change", e=>{ state.inversioneForceAlnum = e.target.checked; generate(); });
    alnumRow.appendChild(alnumCheck);
    alnumRow.appendChild(document.createTextNode("Aggiungi blocco alfanumerico anche a questo livello"));
    wrap.appendChild(alnumRow);
    const alnumNote = document.createElement("div");
    alnumNote.className = "level-note";
    alnumNote.textContent = `Normalmente il blocco alfanumerico misto compare solo dal livello ${INV_ALNUM_FROM}. Con la spunta attiva compare da subito, ma lunghezza e maiuscole/minuscole restano comunque calibrate sul livello selezionato — non si semplifica solo perché arriva prima.`;
    wrap.appendChild(alnumNote);
    return wrap;
  },
  categorizzazione: ()=>{
    const wrap = document.createElement("div");
    const p = document.createElement("div");
    p.className = "level-note";
    p.textContent = "Compito: dividere le 6 immagini in due gruppi da 3, in base a un criterio comune (142 criteri reali, verificati da Rodrigo). Ogni volta che generi materiale, l'app pesca un criterio a caso tra quelli disponibili per il livello e sceglie 3+3 oggetti da pool più ampi dei 3 mostrati negli originali — così la combinazione non è mai identica anche restando sullo stesso livello. Le immagini sono pittogrammi OpenMoji (disegni, non foto); circa 4 termini su 10 non hanno un'icona affidabile in libreria — in quel caso il riquadro mostra il nome dell'oggetto invece del disegno, non è un errore.";
    wrap.appendChild(p);
    wrap.appendChild(numerosityControl("Numero di prove per sessione", "categorizzazioneTrialsOverride", 4, 16, 9));
    return wrap;
  },
  accesso: ()=>{
    const wrap = document.createElement("div");
    wrap.appendChild(numerosityControl("Numero di parole per sessione", "accessoWordsOverride", 1, 10, 1));
    return wrap;
  },
  fascicolo: ()=>{
    const wrap = document.createElement("div");
    const label = document.createElement("label");
    label.setAttribute("for","weekRange");
    label.textContent = "Settimana";
    wrap.appendChild(label);
    const row = document.createElement("div");
    row.className = "level-row";
    const input = document.createElement("input");
    input.type = "range"; input.id = "weekRange"; input.min = "1"; input.max = "12"; input.value = state.fascicoloWeek;
    const badge = document.createElement("div");
    badge.className = "level-badge"; badge.id = "weekBadge"; badge.textContent = state.fascicoloWeek;
    input.addEventListener("input", e=>{
      state.fascicoloWeek = Number(e.target.value);
      badge.textContent = state.fascicoloWeek;
      generate();
    });
    row.appendChild(input); row.appendChild(badge);
    wrap.appendChild(row);
    const note = document.createElement("div");
    note.className = "level-note";
    note.textContent = "Il fascicolo dura 12 settimane in tutto. Ogni settimana fa avanzare in modo coordinato tutti i blocchi (materiale delle griglie, lunghezza dei bersagli, sequenziamento, labirinto, calcolo). Con \"↻ Rigenera\" su una singola parte la puoi far avanzare (o tenere indietro) per conto suo: da quel momento resta alla settimana scelta anche dopo aver rigenerato tutto il fascicolo, ed è ricordata per questo gruppo. \"Mostra risposta / regola\" mostra qui le soluzioni di ogni blocco (il download separato \"Fascicolo con soluzioni\" le include anche nel file .docx).";
    wrap.appendChild(note);

    return wrap;
  }
};

function renderExControls(){
  const host = document.getElementById("exControls");
  host.innerHTML = "";
  const fn = EX_CONTROLS[state.exercise];
  if(fn) host.appendChild(fn());
}
