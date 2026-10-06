// Esportazione Word — Fascicolo esercizi a casa (rasterizza i disegni, attende la libreria docx).
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

async function rasterizeSVGBrowser(svgString){
  const m = svgString.match(/width="(\d+)"\s+height="(\d+)"/);
  const w = m ? parseInt(m[1],10) : 800, h = m ? parseInt(m[2],10) : 600;
  const scale = 2;
  return new Promise((resolve, reject)=>{
    const blob = new Blob([svgString], {type:"image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w*scale; canvas.height = h*scale;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(async (b)=>resolve(new Uint8Array(await b.arrayBuffer())), "image/png");
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function waitForDocxLibrary(timeoutMs){
  const start = Date.now();
  while(typeof window.docx === "undefined"){
    if(Date.now() - start > timeoutMs) return false;
    await new Promise(r=>setTimeout(r, 150));
  }
  return true;
}

async function exportFascicolo(deck){
  // La libreria "docx" arriva da CDN: se la rete è lenta potrebbe non essere ancora
  // pronta al primo clic. Aspetta fino a 5s invece di fallire subito, e se anche dopo
  // non c'è, spiega cosa fare invece di mostrare un errore tecnico incomprensibile.
  const ready = await waitForDocxLibrary(5000);
  if(!ready){
    alert("La libreria per generare il file Word non si è ancora caricata. Controlla la connessione e riprova tra qualche secondo — se il problema persiste, ricarica la pagina.");
    return;
  }
  const group = state.groupNumber ? `(${state.groupNumber})` : "";
  // Fascicolo gemello: il file bianco per il paziente e quello con le soluzioni per il
  // terapista vengono generati ed esportati insieme, accoppiati, a ogni esportazione —
  // non due passaggi separati da ricordarsi di fare entrambi.
  const blankDoc = await window.DocBuilder.buildFascicoloDocument(window.docx, deck, rasterizeSVGBrowser, window.Engine, false);
  const blankBlob = await window.docx.Packer.toBlob(blankDoc);
  saveAs(blankBlob, `Fascicolo.${deck.week}${group}.docx`);
  const solutionsDoc = await window.DocBuilder.buildFascicoloDocument(window.docx, deck, rasterizeSVGBrowser, window.Engine, true);
  const solutionsBlob = await window.docx.Packer.toBlob(solutionsDoc);
  saveAs(solutionsBlob, `Fascicolo.${deck.week}${group} - soluzioni.docx`);
}
