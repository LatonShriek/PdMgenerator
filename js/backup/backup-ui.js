// Copia di sicurezza: collegamento fra la logica (backup.js) e la pagina (messaggi, scrittura in localStorage e Firestore).
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

/* =========================================================
   COPIA DI SICUREZZA — pulsanti "Salva" e "Ripristina" (la logica pura è in PdmBackup, sopra).
   ========================================================= */
const BACKUP_LAST_KEY = "pdm_last_backup";

function backupFmtDate(iso){
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d) ? d.toLocaleDateString("it-IT", {day:"numeric", month:"long", year:"numeric"}) : "data sconosciuta";
}

function backupGroupsText(groups){
  if(!groups.length) return "nessun gruppo";
  return groups.slice(0, 12).join(", ") + (groups.length > 12 ? ` … (+${groups.length - 12})` : "");
}

function backupSetStatus(text){
  const el = document.getElementById("backupStatus");
  if(el) el.textContent = text;
}

function backupRefreshStatus(){
  let last = null;
  try{ last = localStorage.getItem(BACKUP_LAST_KEY); }catch(e){}
  backupSetStatus(last ? `Ultima copia di sicurezza: ${backupFmtDate(last)}.` : "Nessuna copia di sicurezza fatta finora su questo browser.");
}

// Copia online (solo se la cronologia condivisa è connessa): stesso schema di appendUsed e progressPushRemote,
// ma riporta quante scritture sono riuscite, così un rifiuto delle regole Firebase non resta silenzioso.
async function backupPushRemote(writes){
  if(!firebaseConfig.apiKey || !sharedHistoryReady) return null;
  let ok = 0, fail = 0, error = null;
  for(const w of writes){
    try{
      if(w.c.type === "hist"){
        const ref = firestoreDb.collection(w.c.collection).doc(w.c.group);
        const doc = await ref.get();
        const prev = doc.exists ? (doc.data()[w.c.field] || []) : [];
        const have = new Set(prev);
        const merged = prev.concat(JSON.parse(w.value).filter(x=>!have.has(x))).slice(-5000);
        await ref.set({ [w.c.field]: merged, updatedAt: Date.now() }, {merge:true});
      } else if(w.c.type === "progress"){
        const ref = firestoreDb.collection("groupProgress").doc(w.c.group);
        const doc = await ref.get();
        let data = JSON.parse(w.value);
        if(doc.exists){ try{ data = progressMerge(data, JSON.parse(doc.data().data || "{}")); }catch(e){} }
        await ref.set({ data: JSON.stringify(data), updatedAt: Date.now() }, {merge:true});
      } else { continue; }
      ok++;
    } catch(e){
      fail++;
      error = e && e.code ? e.code : String(e);
    }
  }
  return { ok, fail, error };
}
