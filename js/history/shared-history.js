// Cronologia condivisa: anti-ripetizione per gruppo, in locale (localStorage) e online (Firestore).
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

let sharedHistoryReady = false;

let firestoreDb = null;

let lastSharedHistoryError = null;

function initSharedHistory(){
  if(!firebaseConfig.apiKey) return; // non configurato: nessun errore, si resta in locale
  try{
    firebase.initializeApp(firebaseConfig);
    firestoreDb = firebase.firestore();
    firebase.auth().signInAnonymously()
      .then(()=>{ sharedHistoryReady = true; lastSharedHistoryError = null; updateHistoryStatus(); })
      .catch((e)=>{
        sharedHistoryReady = false;
        lastSharedHistoryError = e && e.code ? e.code : String(e);
        console.error("Cronologia condivisa — accesso anonimo fallito:", e);
        updateHistoryStatus();
      });
  } catch(e){
    sharedHistoryReady = false;
    lastSharedHistoryError = e && e.code ? e.code : String(e);
    console.error("Cronologia condivisa — inizializzazione fallita:", e);
  }
}

function currentGroupName(){
  return (localStorage.getItem("pdm_group_name") || "").trim();
}

// Chiave del gruppo per la cronologia: il nome gruppo se c'è, altrimenti "gruppo-N" dal numero
// gruppo (così la memoria del materiale già proposto funziona anche con il solo numero).
function currentGroupKey(){
  const name = currentGroupName();
  if(name) return name;
  const num = (localStorage.getItem("pdm_group_number") || "").trim();
  return num ? "gruppo-" + num : "";
}

// Memoria locale (sempre attiva, per gruppo, su questo browser): lo stesso schema della
// cronologia condivisa, così il materiale già proposto a un gruppo non viene riproposto anche
// senza Firebase. Con Firebase configurato le due memorie vengono unite.
const LOCAL_HIST_PREFIX = "pdm_hist::";

function localHistKey(group, collection, field){ return LOCAL_HIST_PREFIX + group + "::" + collection + "::" + field; }

function localHistGet(group, collection, field){
  try{ return JSON.parse(localStorage.getItem(localHistKey(group, collection, field)) || "[]"); }
  catch(e){ return []; }
}

function localHistAppend(group, collection, field, newItems, cap){
  try{
    const merged = [...localHistGet(group, collection, field), ...newItems].slice(-cap);
    localStorage.setItem(localHistKey(group, collection, field), JSON.stringify(merged));
  } catch(e){}
}

function clearLocalHistoryForGroup(group){
  const prefix = LOCAL_HIST_PREFIX + group + "::";
  Object.keys(localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>localStorage.removeItem(k));
}

async function fetchRecentUsed(collection, field){
  const group = currentGroupKey();
  if(!group) return [];
  const local = localHistGet(group, collection, field);
  let remote = [];
  if(sharedHistoryReady){
    try{
      const doc = await firestoreDb.collection(collection).doc(group).get();
      if(doc.exists) remote = doc.data()[field] || [];
    } catch(e){
      remote = []; // rete assente o permessi non pronti: si procede con la sola memoria locale
    }
  }
  // Unione in ordine cronologico: prima ciò che c'è solo in remoto (più vecchio), poi il locale.
  const localSet = new Set(local);
  return [...remote.filter(x=>!localSet.has(x)), ...local];
}

async function appendUsed(collection, field, newItems, cap){
  const group = currentGroupKey();
  if(!group || !newItems || !newItems.length) return;
  localHistAppend(group, collection, field, newItems, cap); // sincrono: la generazione successiva lo vede subito
  if(!sharedHistoryReady) return;
  try{
    const ref = firestoreDb.collection(collection).doc(group);
    const doc = await ref.get();
    const prev = doc.exists ? (doc.data()[field] || []) : [];
    const merged = [...prev, ...newItems].slice(-cap);
    await ref.set({ [field]: merged, updatedAt: Date.now() }, {merge:true});
  } catch(e){
    // mai bloccare la generazione per un errore di rete/permessi qui
  }
}

const HISTORY_COLLECTIONS = ["catHistory","accessoHistory","fascicoloHistory","materialHistory"];

async function clearHistoryForGroup(){
  const group = currentGroupKey();
  if(!group) return;
  clearLocalHistoryForGroup(group);
  if(sharedHistoryReady){
    for(const c of HISTORY_COLLECTIONS){
      try{ await firestoreDb.collection(c).doc(group).delete(); } catch(e){}
    }
  }
}

function updateHistoryStatus(){
  if(typeof renderProgressPanel === "function"){ renderProgressPanel(); if(typeof progressSyncRemote === "function") progressSyncRemote(); }
  const el = document.getElementById("historyStatus");
  if(!el) return;
  const key = currentGroupKey();
  const btn = document.getElementById("btnClearGroupHistory");
  if(btn) btn.style.display = key ? "block" : "none";
  if(!key){
    el.textContent = "Inserisci un nome gruppo (oppure il numero gruppo qui sotto) per evitare che lo stesso materiale venga riproposto allo stesso gruppo, anche a livelli diversi." +
      (firebaseConfig.apiKey ? "" : " Cronologia condivisa tra dispositivi non configurata: la memoria resta su questo browser.");
    return;
  }
  if(!firebaseConfig.apiKey){
    el.textContent = `Memoria attiva per "${key}" su questo browser: il materiale già proposto a questo gruppo non viene riproposto, nemmeno a livelli diversi. (Cronologia condivisa tra dispositivi non configurata.)`;
  } else if(sharedHistoryReady){
    el.textContent = `Connesso — cronologia condivisa attiva per "${key}": il materiale già proposto a questo gruppo non viene riproposto, nemmeno a livelli diversi.`;
  } else {
    el.textContent = `Memoria attiva per "${key}" su questo browser. Cronologia condivisa configurata ma non connessa` + (lastSharedHistoryError ? ` — errore: ${lastSharedHistoryError}` : " (controlla la rete o la config)") + ". Controlla che in Authentication → Sign-in method il metodo \"Anonimo\" sia abilitato.";
  }
}
