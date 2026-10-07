// Avvisi sul salvataggio online (Firestore): rendono visibile ciò che prima restava in silenzio.
// Aggiunto dopo il passo 5. Prima, se le regole di Firebase rifiutavano una scrittura, l'app non diceva nulla
// e la scritta "Connesso" voleva dire soltanto che l'accesso anonimo era riuscito.
//  - remoteWriteFailed / remoteWriteOk: chiamate da chi legge o scrive online, tengono il conto dei problemi.
//  - checkOnlineSaving: il pulsante "Verifica il salvataggio online" prova a scrivere, rileggere e cancellare
//    un documento di prova in ognuna delle raccolte e dice quali funzionano.

const remoteWriteProblems = {}; // raccolta -> codice dell'errore dell'ultimo tentativo fallito

const REMOTE_COLLECTIONS = ["catHistory", "accessoHistory", "fascicoloHistory", "materialHistory", "groupProgress"];

function remoteErrorCode(e){ return e && e.code ? e.code : String(e); }

function remoteWriteFailed(collection, e){
  remoteWriteProblems[collection] = remoteErrorCode(e);
  renderOnlineProblems();
}

function remoteWriteOk(collection){
  if(collection in remoteWriteProblems){ delete remoteWriteProblems[collection]; renderOnlineProblems(); }
}

function renderOnlineProblems(){
  const el = document.getElementById("onlineProblems");
  if(!el) return;
  const cols = Object.keys(remoteWriteProblems);
  if(!cols.length){ el.style.display = "none"; el.textContent = ""; return; }
  const denied = cols.some(c=>/permission-denied|PERMISSION_DENIED/.test(remoteWriteProblems[c]));
  el.textContent = "Attenzione: il salvataggio online non è riuscito per: " +
    cols.map(c=>`${c} (${remoteWriteProblems[c]})`).join(", ") +
    ". I dati restano salvati su questo browser." +
    (denied ? " Probabile causa: le regole di Firestore non permettono questa raccolta. Premi \"Verifica il salvataggio online\"." : "");
  el.style.display = "block";
}

async function checkOnlineSaving(){
  const out = document.getElementById("onlineCheckResult");
  const show = (t)=>{ if(out){ out.textContent = t; out.style.display = "block"; } };
  if(!firebaseConfig.apiKey){ show("Cronologia condivisa non configurata: la memoria resta solo su questo browser."); return; }
  if(!sharedHistoryReady){
    show("Non connesso a Firebase" + (lastSharedHistoryError ? ` (errore: ${lastSharedHistoryError})` : "") + ". Controlla la rete e che in Authentication → Sign-in method il metodo \"Anonimo\" sia abilitato.");
    return;
  }
  show("Verifica in corso…");
  const lines = [];
  let bad = 0;
  for(const c of REMOTE_COLLECTIONS){
    const ref = firestoreDb.collection(c).doc("_prova");
    try{
      await ref.set({ prova: Date.now() });
      const d = await ref.get();
      if(!d.exists) throw { code: "scrittura-non-letta" };
      remoteWriteOk(c);
      try{ await ref.delete(); lines.push(`✔ ${c}: scrittura, lettura e cancellazione riuscite`); }
      catch(e){ lines.push(`✔ ${c}: scrittura e lettura riuscite (la cancellazione del documento di prova è rifiutata: ${remoteErrorCode(e)})`); }
    } catch(e){
      bad++;
      remoteWriteFailed(c, e);
      lines.push(`✖ ${c}: RIFIUTATA (${remoteErrorCode(e)})`);
    }
  }
  const n = REMOTE_COLLECTIONS.length;
  lines.push(bad
    ? `\n${bad === 1 ? "1 raccolta su " + n + " non salva" : bad + " raccolte su " + n + " non salvano"} online. Le regole di Firestore (console Firebase → Firestore Database → Regole) devono permettere lettura e scrittura su tutte e ${n}, poi premere Pubblica.`
    : `\nTutto a posto: tutte e ${n} le raccolte salvano online.`);
  show(lines.join("\n"));
}

(function(){
  const b = document.getElementById("btnCheckOnline");
  if(b) b.addEventListener("click", ()=>{ checkOnlineSaving(); });
})();
