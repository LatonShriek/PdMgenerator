// Collegamento dell'interfaccia: elenco esercizi, generazione, disegno, pulsanti e avvio.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   UI WIRING
   ========================================================= */
function buildExList(){
  const ul = document.getElementById("exList");
  ul.innerHTML = "";
  EXERCISES.forEach(ex=>{
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = ex.id===state.exercise ? "active":"";
    btn.innerHTML = `<span class="ex-name">${ex.name}</span><span class="ex-desc">${ex.desc}</span>`;
    btn.onclick = ()=>{
      state.exercise = ex.id;
      state.level = state.levels[ex.id] ?? 1; // ripristina il livello proprio di questo esercizio
      state.slideIndex = 0;
      state.reveal = false;
      buildExList();
      renderExControls();
      generate();
    };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

async function generate(){
  state.slideIndex = 0;
  // Tutti gli esercizi a livelli vanno da 1 a MAX_LEVEL (32): si limita comunque PRIMA di generare,
  // per non chiamare mai un generatore con un livello fuori dai suoi limiti.
  const maxLevelNow = MAX_LEVEL;
  if(state.level > maxLevelNow) state.level = maxLevelNow;
  state.levels[state.exercise] = state.level;
  const gen = ++state._generationToken; // scarta risposte di storico arrivate in ritardo se nel frattempo si è generato di nuovo

  if(state.exercise==="categorizzazione"){
    const excludeLabels = await fetchRecentUsed("catHistory", "usedLabels");
    if(gen !== state._generationToken) return;
    state.deck = genCategorizzazioneV2(state.level, state.categorizzazioneTrialsOverride || 9, excludeLabels);
    appendUsed("catHistory", "usedLabels", state.deck.slides.map(s=>s.rawLabel), 60);
  } else if(state.exercise==="accesso"){
    const excludeWords = await fetchRecentUsed("accessoHistory", "usedWords");
    if(gen !== state._generationToken) return;
    state.deck = genAccesso(state.level, excludeWords);
    appendUsed("accessoHistory", "usedWords", state.deck.words, 80);
  } else if(state.exercise==="fascicolo"){
    // Stessa logica anti-ripetizione già usata per Categorizzazione e Accesso lessicale,
    // estesa alle parti del fascicolo con un pool finito: anagrammi, categorie
    // semantiche, blocco lessicale (unificato, qualunque sia lo schema di quella
    // settimana). Le altre parti (griglie, labirinto, calcolo, sequenziamento) restano
    // procedurali e non ne hanno bisogno.
    const exclusions = await fascicoloExclusions();
    if(gen !== state._generationToken) return;
    state.deck = window.Engine.buildFascicolo(state.fascicoloWeek, Math.floor(Math.random()*1e9), exclusions);
    state.deck.categoriesMinWords = state.deck.params.categoryMinWords;
    fascicoloRecordUsed(state.deck, null);
    // Le parti portate avanti (o indietro) singolarmente restano alla propria settimana anche
    // dopo questa rigenerazione completa: si riapplicano qui, una per una, sopra il fascicolo
    // appena ricostruito alla settimana globale — vedi applyFascicoloPartAt più sotto.
    for(const [partKey, partWeek] of Object.entries(state.fascicoloPartWeek)){
      try{ await applyFascicoloPartAt(partKey, partWeek); } catch(e){ console.error(e); }
    }
  } else if(MATERIAL_HISTORY[state.exercise]){
    // Stessa logica anti-ripetizione di Categorizzazione e Accesso lessicale, estesa a
    // Griglie-Conteggio, Intruso percettivo e Inversione e riordino: il materiale già proposto
    // a questo gruppo (a qualunque livello) non viene riproposto finché ne resta di nuovo.
    const cfg = MATERIAL_HISTORY[state.exercise];
    const used = await fetchRecentUsed("materialHistory", cfg.field);
    if(gen !== state._generationToken) return;
    state.deck = GENERATORS[state.exercise](state.level, used);
    appendUsed("materialHistory", cfg.field, state.deck.historyKeys || [], cfg.cap);
  } else {
    state.deck = GENERATORS[state.exercise](state.level);
  }

  document.getElementById("ruleBox").style.display = "none";
  const ex = EXERCISES.find(e=>e.id===state.exercise);
  const historyLevel = state.exercise==="fascicolo" ? state.fascicoloWeek : state.level;
  saveHistoryEntry({
    when: Date.now(),
    exId: state.exercise,
    exName: ex.name,
    level: historyLevel,
    summary: summarizeDeck(state.exercise, historyLevel, state.deck)
  });
  render();
  rememberGroupLevel();
}

function render(){
  const ex = EXERCISES.find(e=>e.id===state.exercise);
  const isFascicolo = state.exercise==="fascicolo";
  const maxLevel = MAX_LEVEL;
  document.getElementById("exTitle").textContent = ex.name;
  document.getElementById("levelField").style.display = isFascicolo ? "none" : "block";
  document.getElementById("btnExport").textContent = isFascicolo ? "Esporta in Word (fascicolo + soluzioni)" : "Esporta in PowerPoint";
  if(isFascicolo){
    document.getElementById("exMeta").textContent = `Settimana ${state.fascicoloWeek}`;
  } else {
    const levelRangeEl = document.getElementById("levelRange");
    levelRangeEl.max = String(maxLevel);
    if(state.level > maxLevel){ state.level = maxLevel; }
    state.levels[state.exercise] = state.level;
    levelRangeEl.value = state.level; // riflette sempre il livello dell'esercizio attivo, anche dopo un cambio esercizio
    document.getElementById("exMeta").textContent = `Livello ${state.level} di ${maxLevel}`;
    document.getElementById("levelBadge").textContent = state.level;
    document.getElementById("levelNote").textContent = levelNote(state.exercise, state.level);
  }

  const stage = document.getElementById("stage");
  stage.classList.toggle("stage-fascicolo", isFascicolo);
  stage.innerHTML = "";
  stage.appendChild(RENDERERS[state.exercise](state.deck));

  const ruleBox = document.getElementById("ruleBox");
  if(state.exercise==="griglie"){
    ruleBox.style.display = "block";
    ruleBox.innerHTML = `<b>${state.deck.slides[0].rules.length} regole disponibili su questa griglia</b> — quella evidenziata sotto è quella attiva; clicca su una qualsiasi della lista per selezionarla.`;
  } else if(state.exercise==="intruso"){
    ruleBox.style.display = "block";
    ruleBox.innerHTML = `<b>${state.deck.slides.length} schermate in questa sessione</b> — la famiglia e la regola di ciascuna sono indicate sopra la schermata stessa.`;
  } else if(state.exercise==="categorizzazione"){
    ruleBox.style.display = "block";
    ruleBox.innerHTML = `<b>${state.deck.slides.length} prove in questa sessione</b> — il criterio di ciascuna è indicato sopra la griglia di immagini.`;
  } else if(state.exercise==="serie"){
    ruleBox.style.display = "block";
    ruleBox.innerHTML = `<b>Regola (livello ${state.level}/${SERIE_MAX_LEVEL}):</b> ${state.deck.rule}` +
      (state.serieShowNextCriterion
        ? (state.deck.nextRule ? `<br><span class="level-note" style="margin-top:6px;"><b>Al livello successivo:</b> ${state.deck.nextRule}</span>` : `<br><span class="level-note" style="margin-top:6px;">Ultimo livello disponibile.</span>`)
        : "");
  } else if(state.deck.rule){
    ruleBox.style.display = "block";
    ruleBox.innerHTML = `<b>Regola:</b> ${state.deck.rule}` + (state.reveal && state.deck.answer ? `<br><b>Risposta:</b> ${state.deck.answer}` : "");
  } else {
    ruleBox.style.display = "none";
  }

  renderProgressPanel();

  const foot = document.getElementById("stageFoot");
  if(state.exercise==="serie"){
    foot.style.display = "flex";
    document.getElementById("slideCounter").textContent = `${state.slideIndex+1} / ${state.deck.slides.length}`;
  } else {
    foot.style.display = "none";
  }
}

document.getElementById("levelRange").addEventListener("input", e=>{
  state.level = Number(e.target.value);
  generate();
});
document.getElementById("btnGenerate").addEventListener("click", generate);
document.getElementById("btnReveal").addEventListener("click", ()=>{
  state.reveal = !state.reveal;
  render();
});
document.getElementById("btnPrint").addEventListener("click", ()=>window.print());
document.getElementById("btnExport").addEventListener("click", exportCurrent);
document.getElementById("btnHistory").addEventListener("click", ()=>{
  renderHistoryList();
  document.getElementById("historyPanel").style.display = "flex";
});
document.getElementById("btnCloseHistory").addEventListener("click", ()=>{
  document.getElementById("historyPanel").style.display = "none";
});
document.getElementById("btnClearHistory").addEventListener("click", ()=>{
  if(confirm("Cancellare tutto lo storico delle generazioni su questo dispositivo?")){
    localStorage.removeItem(HISTORY_KEY);
    renderHistoryList();
  }
});
document.getElementById("prevSlide").addEventListener("click", ()=>{
  if(state.slideIndex>0){ state.slideIndex--; render(); }
});
document.getElementById("nextSlide").addEventListener("click", ()=>{
  if(state.slideIndex < state.deck.slides.length-1){ state.slideIndex++; render(); }
});

const groupInput = document.getElementById("groupNameInput");
groupInput.value = currentGroupName();
groupInput.addEventListener("change", ()=>{
  localStorage.setItem("pdm_group_name", groupInput.value.trim());
  updateHistoryStatus();
  recallGroupLevel();
});
initSharedHistory();
updateHistoryStatus();

const groupNumberInput = document.getElementById("groupNumberInput");
groupNumberInput.value = localStorage.getItem("pdm_group_number") || "";
state.groupNumber = groupNumberInput.value.trim();
groupNumberInput.addEventListener("change", ()=>{
  state.groupNumber = groupNumberInput.value.trim();
  localStorage.setItem("pdm_group_number", state.groupNumber);
  updateHistoryStatus();
  recallGroupLevel();
});
document.getElementById("btnClearGroupHistory").addEventListener("click", async ()=>{
  const key = currentGroupKey();
  if(key && confirm(`Azzerare la memoria del materiale già proposto al gruppo "${key}"? Da quel momento tutto il materiale potrà uscire di nuovo.`)){
    await clearHistoryForGroup();
    alert("Fatto: la memoria di questo gruppo è stata azzerata.");
  }
});

document.getElementById("btnBackupExport").addEventListener("click", ()=>{
  const now = new Date();
  const bk = PdmBackup.buildBackup(Object.keys(localStorage), k=>localStorage.getItem(k), now.toISOString());
  const n = Object.keys(bk.entries).length;
  if(!n){
    alert("Non c'è ancora niente da salvare: la memoria di questo browser è vuota.");
    return;
  }
  const groups = Array.from(new Set(Object.keys(bk.entries).map(k=>{ const c = PdmBackup.classify(k); return c && c.group; }).filter(Boolean))).sort();
  const blob = new Blob([JSON.stringify(bk, null, 1)], {type:"application/json"});
  try{
    saveAs(blob, PdmBackup.fileName(now));
  } catch(e){
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = PdmBackup.fileName(now);
    document.body.appendChild(a); a.click(); a.remove();
  }
  try{ localStorage.setItem(BACKUP_LAST_KEY, bk.exportedAt); }catch(e){}
  backupSetStatus(`Copia salvata: ${n} voci. Gruppi trovati: ${backupGroupsText(groups)}. Il file è nella cartella Download.`);
});

document.getElementById("btnBackupImport").addEventListener("click", ()=>{
  const input = document.getElementById("backupFileInput");
  input.value = "";
  input.click();
});

document.getElementById("backupFileInput").addEventListener("change", async (ev)=>{
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  let text;
  try{ text = await file.text(); }
  catch(e){ alert("Non riesco a leggere il file."); return; }
  const v = PdmBackup.parseText(text);
  if(!v.ok){ alert(v.error); return; }
  if(!v.entries.length){ alert("La copia non contiene dati da ripristinare."); return; }
  const msg = `Copia del ${backupFmtDate(v.exportedAt)}: ${v.entries.length} voci. Gruppi: ${backupGroupsText(v.groups)}.` +
    (v.skipped.length ? `\n${v.skipped.length} voci non valide verranno ignorate.` : "") +
    "\n\nIl ripristino AGGIUNGE ciò che manca e non cancella niente di ciò che c'è già in questo browser. Procedere?";
  if(!confirm(msg)) return;

  const plan = PdmBackup.planImport(v, k=>localStorage.getItem(k), {mergeProgress: progressMerge});
  let writeFailed = 0;
  const done = [];
  for(const w of plan.writes){
    try{ localStorage.setItem(w.key, w.value); done.push(w); }
    catch(e){ writeFailed++; }
  }

  groupInput.value = currentGroupName();
  groupNumberInput.value = localStorage.getItem("pdm_group_number") || "";
  state.groupNumber = groupNumberInput.value.trim();
  updateHistoryStatus();
  recallGroupLevel();
  renderProgressPanel();

  const remote = await backupPushRemote(done);
  let line = `Ripristino fatto: ${done.length} voci aggiornate, ${plan.unchanged} già presenti.`;
  if(writeFailed) line += ` ${writeFailed} non si sono potute salvare (memoria del browser piena?).`;
  if(remote){
    line += remote.fail
      ? ` Online: ${remote.ok} copiate, ${remote.fail} NO (errore: ${remote.error}). Controlla le regole di Firebase.`
      : (remote.ok ? ` Copiate anche online (${remote.ok}).` : "");
  }
  backupSetStatus(line);
  alert(line);
});
backupRefreshStatus();

buildExList();
renderExControls();
generate();
recallGroupLevel();
