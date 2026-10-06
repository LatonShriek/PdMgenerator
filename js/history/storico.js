// Storico delle generazioni (elenco "Storico" nella barra laterale).
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

/* =========================================================
   STORICO (localStorage, solo su questo dispositivo)
   ========================================================= */
const HISTORY_KEY = "pdm_generatore_storico";

function loadHistory(){
  try{ return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch(e){ return []; }
}

function saveHistoryEntry(entry){
  const h = loadHistory();
  h.unshift(entry);
  while(h.length>200) h.pop();
  try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }catch(e){}
}

function summarizeDeck(exId, level, deck){
  switch(exId){
    case "griglie": return `Griglia ${deck.slides[0].rows}×${deck.slides[0].cols}, ${deck.slides[0].rules.length} regole disponibili`;
    case "intruso": return `${deck.slides.length} schermate (famiglie: ${deck.slides.map(s=>s.familyLabel).join(", ")})`;
    case "inversione": return `${deck.blocks.length} blocchi (${deck.blocks.map(b=>b.items.length).reduce((a,b)=>a+b,0)} item totali)`;
    case "serie": return `Sequenza di ${deck.seq.length} stimoli`;
    case "accesso": return deck.words.length>1 ? `${deck.words.length} parole: ${deck.words.join(", ")}` : `Parola: ${deck.word}`;
    case "categorizzazione": return `${deck.slides.length} schermate (es. ${deck.slides[0].label})`;
    case "fascicolo": return `Fascicolo ${deck.week} — ${deck.week}°settimana`;
    default: return "";
  }
}

function renderHistoryList(){
  const host = document.getElementById("historyList");
  const h = loadHistory();
  if(h.length===0){ host.innerHTML = "<div class='level-note'>Ancora nessuna generazione registrata.</div>"; return; }
  host.innerHTML = "";
  h.forEach(e=>{
    const row = document.createElement("div");
    row.className = "hist-row";
    const d = new Date(e.when);
    const levelLabel = e.exId==="fascicolo" ? `sett. ${e.level}` : `liv. ${e.level}`;
    row.innerHTML = `<div><span class="hist-ex">${e.exName}</span> — ${levelLabel}<br><span style="color:var(--ink-soft)">${e.summary}</span></div><div class="hist-when">${d.toLocaleDateString("it-IT")} ${d.toLocaleTimeString("it-IT",{hour:'2-digit',minute:'2-digit'})}</div>`;
    host.appendChild(row);
  });
}
