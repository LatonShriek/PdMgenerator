// Progressione del gruppo (mantieni / sali di livello), in locale e online.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

/* =========================================================
   PROGRESSIONE DEL GRUPPO — interruttore "mantieni livello / sali"
   Lo sperimentatore registra l'andamento del gruppo (% di riuscita) dopo ogni sessione; l'app suggerisce
   se mantenere il livello o salire (soglia e numero di sessioni consecutive regolabili) e lo sperimentatore
   può confermare o invertire il suggerimento con l'interruttore. Dati per gruppo e per esercizio, salvati
   in questo browser e — se la cronologia condivisa è attiva — condivisi tra i colleghi.
   ========================================================= */
const PROGRESS_PREFIX = "pdm_progress::";

function progressBlank(){ return { u:0, settings:{thr:80, consec:1}, ex:{}, levels:{}, fascicoloParts:{} }; }

function progressLoad(group){
  try{
    const d = JSON.parse(localStorage.getItem(PROGRESS_PREFIX + group) || "null");
    if(d && d.ex){ d.settings = Object.assign({thr:80, consec:1}, d.settings || {}); d.levels = d.levels || {}; d.fascicoloParts = d.fascicoloParts || {}; return d; }
  } catch(e){}
  return progressBlank();
}

function progressStore(group, data){
  data.u = Date.now();
  try{ localStorage.setItem(PROGRESS_PREFIX + group, JSON.stringify(data)); } catch(e){}
  progressPushRemote(group, data);
}

async function progressPushRemote(group, data){
  if(!sharedHistoryReady) return;
  try{ await firestoreDb.collection("groupProgress").doc(group).set({ data: JSON.stringify(data), updatedAt: Date.now() }, {merge:true}); remoteWriteOk("groupProgress"); }
  catch(e){ remoteWriteFailed("groupProgress", e); /* rete o permessi: si resta in locale, ma si avvisa */ }
}

// Unione di due copie (locale + remota): registrazioni unite per timestamp, meno quelle annullate (`del`);
// impostazioni e scelta manuale dalla copia più recente.
function progressMerge(a, b){
  const out = progressBlank();
  const newer = (a.u||0) >= (b.u||0) ? a : b;
  out.u = Math.max(a.u||0, b.u||0);
  out.settings = Object.assign({thr:80, consec:1}, newer.settings || {});
  out.levels = Object.assign({}, newer.levels || {});
  out.fascicoloParts = Object.assign({}, newer.fascicoloParts || {});
  const ids = new Set([...Object.keys(a.ex||{}), ...Object.keys(b.ex||{})]);
  ids.forEach(id=>{
    const ea = (a.ex||{})[id] || {}, eb = (b.ex||{})[id] || {};
    const del = new Set([...(ea.del||[]), ...(eb.del||[])]);
    const byT = new Map();
    [...(ea.log||[]), ...(eb.log||[])].forEach(r=>{ if(!del.has(r.t)) byT.set(r.t, r); });
    out.ex[id] = {
      log: [...byT.values()].sort((x,y)=>x.t-y.t).slice(-40),
      del: [...del].slice(-100),
      decision: ((newer.ex||{})[id] || {}).decision || null
    };
  });
  return out;
}

let _progressSyncing = false;

async function progressSyncRemote(){
  const group = currentGroupKey();
  if(!group || !sharedHistoryReady || _progressSyncing) return;
  _progressSyncing = true;
  try{
    const doc = await firestoreDb.collection("groupProgress").doc(group).get();
    remoteWriteOk("groupProgress");
    if(doc.exists){
      const remote = JSON.parse(doc.data().data || "{}");
      const merged = progressMerge(progressLoad(group), remote);
      localStorage.setItem(PROGRESS_PREFIX + group, JSON.stringify(merged));
      progressPushRemote(group, merged);
    }
  } catch(e){ remoteWriteFailed("groupProgress", e); /* si resta con i dati locali, ma si avvisa */ }
  _progressSyncing = false;
  renderProgressPanel();
}

// Stato decisionale di un esercizio: livello di riferimento (quello dell'ultima sessione registrata),
// suggerimento (sali / mantieni) e scelta effettiva (suggerimento oppure scelta manuale, valida solo
// finché non c'è una nuova registrazione).
function progressState(exData, stateLevel, s){
  const log = (exData && exData.log) || [];
  const last = log.length ? log[log.length-1] : null;
  const ref = last ? last.level : stateLevel;
  let run = 0;
  for(let i=log.length-1; i>=0; i--){ if(log[i].level===ref && log[i].pct>=s.thr) run++; else break; }
  const atMax = ref >= MAX_LEVEL;
  const suggest = (last && !atMax && run >= s.consec) ? "sali" : "mantieni";
  const dec = (exData && exData.decision && last && exData.decision.after===last.t) ? exData.decision.v : null;
  let decision = last ? (dec || suggest) : null;
  if(atMax && decision==="sali") decision = "mantieni";
  return { last, ref, run, atMax, suggest, decision, manual: !!dec && dec!==suggest };
}

// Ultimo livello generato per esercizio (e settimana per il fascicolo), per gruppo: così
// riaprendo l'app o passando a un altro gruppo/paziente il generatore riparte da dove era
// rimasto quel gruppo, esercizio per esercizio — non serve una sessione registrata come per
// l'interruttore mantieni/sali qui sopra, basta aver generato materiale almeno una volta.
function rememberGroupLevel(){
  const group = currentGroupKey();
  if(!group) return;
  const key = state.exercise === "fascicolo" ? "fascicolo" : state.exercise;
  const lvl = state.exercise === "fascicolo" ? state.fascicoloWeek : state.level;
  const d = progressLoad(group);
  d.levels = d.levels || {};
  let dirty = false;
  if(d.levels[key] !== lvl){ d.levels[key] = lvl; dirty = true; }
  if(state.exercise === "fascicolo"){
    const partsJSON = JSON.stringify(state.fascicoloPartWeek || {});
    if(JSON.stringify(d.fascicoloParts || {}) !== partsJSON){
      d.fascicoloParts = Object.assign({}, state.fascicoloPartWeek);
      dirty = true;
    }
  }
  if(!dirty) return; // nessuna novità, non riscrivere ad ogni render
  progressStore(group, d);
}

// Richiamata quando si (ri)inserisce il nome o il numero del gruppo: applica in silenzio i
// livelli ricordati a tutti gli esercizi (e la settimana al fascicolo), poi rigenera solo se
// quello attivo in questo momento è effettivamente cambiato.
function recallGroupLevel(){
  const group = currentGroupKey();
  if(!group) return;
  const stored = progressLoad(group);
  const levels = stored.levels || {};
  const parts = stored.fascicoloParts || {};
  // Si riparte sempre dai valori di base (1, nessuna parte scostata) e si sovrascrive solo
  // con quanto effettivamente registrato per QUESTO gruppo: così un gruppo mai usato prima
  // non eredita per errore il livello (o le parti del fascicolo) lasciati a video da un
  // altro gruppo appena lasciato.
  let changed = false;
  Object.keys(state.levels).forEach(exId=>{
    const lvl = levels[exId] != null ? levels[exId] : 1;
    if(lvl !== state.levels[exId]){
      state.levels[exId] = lvl;
      if(exId === state.exercise) changed = true;
    }
  });
  const week = levels.fascicolo != null ? levels.fascicolo : 1;
  if(week !== state.fascicoloWeek){
    state.fascicoloWeek = week;
    if(state.exercise === "fascicolo") changed = true;
  }
  if(JSON.stringify(parts) !== JSON.stringify(state.fascicoloPartWeek || {})){
    state.fascicoloPartWeek = Object.assign({}, parts);
    if(state.exercise === "fascicolo") changed = true;
  }
  if(state.exercise !== "fascicolo" && state.level !== state.levels[state.exercise]){
    state.level = state.levels[state.exercise];
    changed = true;
  }
  if(changed) generate();
}

function progEsc(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]); }

function renderProgressPanel(){
  const host = document.getElementById("progressPanel");
  if(!host) return;
  const exId = state.exercise;
  if(exId==="fascicolo"){ host.style.display = "none"; host.innerHTML = ""; return; }
  const group = currentGroupKey();
  host.style.display = "block";
  if(!group){
    host.innerHTML = `<h3>Progressione del gruppo</h3><div class="level-note" style="margin-top:4px;">Inserisci il nome (o il numero) del gruppo qui sopra: il generatore riparte in automatico dall'ultimo livello usato con questo gruppo per ogni esercizio (fascicolo compreso, con le sue singole parti fatte avanzare separatamente), e qui potrai registrare l'andamento di ogni sessione: l'interruttore ti dirà se mantenere il livello o salire.</div>`;
    return;
  }
  const oldPct = host.querySelector("#progPct") ? host.querySelector("#progPct").value : "";
  const data = progressLoad(group);
  const exData = data.ex[exId] || {log:[], del:[], decision:null};
  const s = data.settings;
  const st = progressState(exData, state.level, s);
  const exName = EXERCISES.find(e=>e.id===exId).name;
  const has = !!st.last;
  const nextLevel = Math.min(MAX_LEVEL, st.ref+1);
  const target = st.decision==="sali" ? nextLevel : st.ref;
  let msg;
  if(!has) msg = "Nessuna sessione registrata per questo esercizio. Dopo la prima sessione registra qui l'andamento: l'interruttore ti suggerirà se mantenere o salire.";
  else if(st.atMax) msg = "Livello massimo raggiunto: si può solo mantenere.";
  else if(st.suggest==="sali") msg = `Suggerito: <b>SALIRE</b> — ${st.run} sessione/i ≥ ${s.thr}% al livello ${st.ref} (ultima: ${st.last.pct}%).`;
  else if(st.last.pct < s.thr) msg = `Suggerito: <b>MANTENERE</b> — ultima sessione ${st.last.pct}% (soglia ${s.thr}%).`;
  else msg = `Suggerito: <b>MANTENERE</b> — servono ${s.consec} sessioni di fila ≥ ${s.thr}% allo stesso livello (finora ${st.run}).`;
  if(has && st.manual) msg += ` <i>Scelta manuale: ${st.decision==="sali" ? "salire" : "mantenere"}.</i>`;
  const recent = (exData.log||[]).slice(-5).reverse().map(r=>{
    const d = new Date(r.t);
    return `<li>livello ${r.level} · ${r.pct}% · ${d.toLocaleDateString("it-IT")}</li>`;
  }).join("");
  host.innerHTML = `
    <h3>Progressione del gruppo</h3>
    <div class="level-note" style="margin-top:0;">${progEsc(group)} · ${progEsc(exName)}${has ? ` · ultimo livello svolto: <b>${st.ref}</b>` : ""}</div>
    <label for="progPct" style="margin-top:10px;">Andamento dell'ultima sessione (compilato dallo sperimentatore)</label>
    <div class="prog-row">
      <input type="number" id="progPct" min="0" max="100" step="1" placeholder="%" value="${progEsc(oldPct)}">
      <span>% di riuscita al livello ${state.level}</span>
      <button class="chip" id="progRecord">Registra</button>
    </div>
    <div class="prog-row">
      Sale se ≥ <input type="number" id="progThr" min="1" max="100" value="${s.thr}"> % per
      <select id="progConsec">${[1,2,3].map(n=>`<option value="${n}"${n===s.consec?" selected":""}>${n}</option>`).join("")}</select>
      sessione/i di fila
    </div>
    <div class="prog-switch" role="group" aria-label="Decisione per la prossima sessione">
      <button id="progKeep" class="${st.decision==="mantieni"?"on":""}" ${has?"":"disabled"}>Mantieni ${has ? st.ref : ""}</button>
      <button id="progUp" class="${st.decision==="sali"?"on":""}" ${(has && !st.atMax)?"":"disabled"}>Sali a ${has ? nextLevel : ""}</button>
    </div>
    <div class="prog-suggest">${msg}</div>
    ${has ? `<button class="action ghost" id="progApply" style="margin-top:10px;">Applica: livello ${target} e genera</button>` : ""}
    ${has ? `<ul class="prog-log">${recent}</ul><button class="prog-undo" id="progUndo">Annulla l'ultima registrazione</button>` : ""}
  `;
  const persist = fn => {
    const d = progressLoad(group);
    d.ex[exId] = d.ex[exId] || {log:[], del:[], decision:null};
    fn(d, d.ex[exId]);
    progressStore(group, d);
    renderProgressPanel();
  };
  host.querySelector("#progRecord").onclick = ()=>{
    const inp = host.querySelector("#progPct");
    const v = Number(inp.value);
    if(inp.value==="" || !isFinite(v) || v<0 || v>100){ alert("Inserisci una percentuale tra 0 e 100."); return; }
    inp.value = "";
    persist((d,e)=>{ e.log.push({ t:Date.now(), level:state.level, pct:Math.round(v) }); e.log = e.log.slice(-40); e.decision = null; });
  };
  host.querySelector("#progThr").onchange = ev=>{
    const v = Math.max(1, Math.min(100, Number(ev.target.value) || 80));
    persist(d=>{ d.settings.thr = v; });
  };
  host.querySelector("#progConsec").onchange = ev=>{
    const v = Number(ev.target.value) || 1;
    persist(d=>{ d.settings.consec = v; });
  };
  const choose = v => persist((d,e)=>{ e.decision = (v===st.suggest) ? null : { v, after: st.last.t }; });
  if(has){
    host.querySelector("#progKeep").onclick = ()=>choose("mantieni");
    host.querySelector("#progUp").onclick = ()=>{ if(!st.atMax) choose("sali"); };
    host.querySelector("#progApply").onclick = ()=>{
      state.level = target;
      state.levels[exId] = target;
      state.reveal = false;
      generate();
    };
    host.querySelector("#progUndo").onclick = ()=>{
      persist((d,e)=>{ const r = e.log.pop(); if(r){ e.del = (e.del||[]).concat([r.t]).slice(-100); } e.decision = null; });
    };
  }
}
