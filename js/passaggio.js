// Passaggio dei livelli tra PdM generator (in presenza) e Traccia-N (da remoto) tramite un breve CODICE da copiare e incollare.
// Il codice contiene SOLO livelli del generatore (1-32) per Intruso (I), Griglie (G) e Inversione (V): nessun nome, nessun dato clinico.
// Formato: PDM-I12-G8-V15-47  (da PdM)  oppure  TRN-I12-G8-V15-47  (da Traccia-N); le ultime due cifre sono un controllo contro gli errori di battitura.
// Scritto identico in Traccia-N (js/core/passaggio.js): se si cambia qui, cambiare anche là. Script classico (stesse variabili globali di sempre).

const PASSAGGIO_LETTER = { intruso:"I", griglie:"G", inversione:"V" };
const PASSAGGIO_EX_NAME = { intruso:"Intruso percettivo", griglie:"Griglie", inversione:"Inversione e riordino" };

function passaggioChecksum(body){
  let s = 0;
  for(let i=0;i<body.length;i++) s += body.charCodeAt(i) * (i+1);
  return String(s % 97).padStart(2,"0");
}
// origin: "PDM" o "TRN"; levels: {intruso, griglie, inversione} (livelli del generatore 1-32, anche parziale)
function passaggioBuild(origin, levels){
  const parts = Object.keys(PASSAGGIO_LETTER)
    .filter(k=>levels && Number.isFinite(levels[k]))
    .map(k=>PASSAGGIO_LETTER[k] + Math.max(1, Math.min(32, Math.floor(levels[k]))));
  if(!parts.length) return null;
  const body = origin + "-" + parts.join("-");
  return body + "-" + passaggioChecksum(body);
}
// Restituisce {ok:true, origin, levels} oppure {ok:false, error}
function passaggioParse(text){
  const t = String(text||"").toUpperCase().replace(/\s+/g,"").replace(/[–—]/g,"-");
  const m = t.match(/^(PDM|TRN)((?:-[IGV]\d{1,2})+)-(\d{2})$/);
  if(!m) return {ok:false, error:"Codice non riconosciuto: controlla di averlo copiato per intero (es. TRN-I12-G8-V15-47)."};
  const body = m[1] + m[2];
  if(passaggioChecksum(body) !== m[3]) return {ok:false, error:"Il codice non torna (controllo finale diverso): probabile errore di battitura, ricopialo."};
  const levels = {};
  const inv = {I:"intruso", G:"griglie", V:"inversione"};
  for(const part of m[2].split("-").filter(Boolean)){
    const lv = Number(part.slice(1));
    if(lv<1 || lv>32) return {ok:false, error:"Livello fuori scala (1-32) nel codice."};
    levels[inv[part[0]]] = lv;
  }
  return {ok:true, origin:m[1], levels};
}

// ---- Interfaccia (solo nel browser) ----
function passaggioCurrentLevels(){
  const o = {};
  Object.keys(PASSAGGIO_LETTER).forEach(k=>{ if(state.levels && Number.isFinite(state.levels[k])) o[k] = state.levels[k]; });
  return o;
}
// Applica i livelli arrivati da Traccia-N al gruppo in uso: si parte dal livello intero più basso (prudente) e si salva come se fosse stato raggiunto qui.
function passaggioApply(levels){
  const group = currentGroupKey();
  if(!group) return {ok:false, error:"Inserisci prima il nome (o il numero) del gruppo."};
  if(progressWaitingForSync(group)) return {ok:false, error:"Sto ancora leggendo i dati online del gruppo: riprova tra un attimo."};
  const d = progressLoad(group);
  d.levels = d.levels || {};
  Object.keys(levels).forEach(k=>{ d.levels[k] = levels[k]; state.levels[k] = levels[k]; });
  progressStore(group, d);
  if(levels[state.exercise] != null) state.level = levels[state.exercise];
  renderExControls();
  generate();
  return {ok:true};
}
function renderPassaggioPanel(){
  const host = document.getElementById("passaggioPanel");
  if(!host) return;
  const group = currentGroupKey();
  const code = passaggioBuild("PDM", passaggioCurrentLevels());
  const oldIn = host.querySelector("#passIn") ? host.querySelector("#passIn").value : "";   // il pannello si ridisegna spesso: non perdere quanto scritto
  const oldMsg = host.querySelector("#passMsg") ? host.querySelector("#passMsg").textContent : "";
  host.style.display = "block";
  host.innerHTML = `<h3>Passaggio livelli con Traccia-N</h3>
    <div class="level-note" style="margin-top:4px;">${group ? "" : "Inserisci prima il gruppo: i livelli sono quelli del gruppo. "}Codice con i livelli attuali di questo gruppo, da incollare in Traccia-N (Setup → «Passaggio livelli con PdM»):</div>
    <div style="display:flex; gap:6px; margin-top:6px; align-items:center;">
      <input id="passCode" readonly style="flex:1; font-family:monospace;" value="${code||""}">
      <button id="passCopy" class="action ghost" type="button">Copia</button>
    </div>
    <div class="level-note" style="margin-top:10px;">Dopo il lavoro da remoto: incolla qui il codice generato da Traccia-N (parte dal livello più basso del tratto corrispondente).</div>
    <div style="display:flex; gap:6px; margin-top:6px;">
      <input id="passIn" placeholder="TRN-I12-G8-V15-47" style="flex:1; font-family:monospace;">
      <button id="passApply" class="action" type="button">Applica</button>
    </div>
    <div id="passMsg" class="level-note" style="margin-top:6px;"></div>`;
  const msg = host.querySelector("#passMsg");
  host.querySelector("#passIn").value = oldIn; msg.textContent = oldMsg;
  host.querySelector("#passCopy").onclick = ()=>{ const v = host.querySelector("#passCode").value; if(!v) return; try{ navigator.clipboard.writeText(v); msg.textContent = "Copiato."; }catch(e){ host.querySelector("#passCode").select(); msg.textContent = "Selezionato: copia con Ctrl+C."; } };
  host.querySelector("#passApply").onclick = ()=>{
    const r = passaggioParse(host.querySelector("#passIn").value);
    if(!r.ok){ msg.textContent = r.error; return; }
    const res = passaggioApply(r.levels);
    msg.textContent = res.ok ? "Impostati per il gruppo: " + Object.keys(r.levels).map(k=>PASSAGGIO_EX_NAME[k]+" livello "+r.levels[k]).join(" · ") + "." : res.error;
  };
}
