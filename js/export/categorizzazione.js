// Esportazione PowerPoint — Categorizzazione.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

async function exportCategorizzazione(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  for(let si=0; si<deck.slides.length; si++){
    const s0 = deck.slides[si];
    const s = s0._imagesResolved ? s0 : await resolveTrialImages(s0);
    Object.assign(s0, s); s0._imagesResolved = true; // riusa la cache anche per l'anteprima a schermo
    const slide = p.addSlide();
    slide.background={color:"FFFFFF"};
    // Niente gruppi/soluzione nel commento: solo il criterio (l'istruzione), mai quali
    // 3+3 immagini formano la risposta — quello resta visibile solo nell'app.
    slide.addNotes(`Livello ${level}. Schermata ${si+1}/${deck.slides.length}. Criterio: ${s.label}.`);
    const cols=3, rows=2, cellW=12.6/cols, cellH=6.6/rows;
    const fitFontSize = Math.floor(Math.min(cellW, cellH) * 30);
    s.items.forEach((it,i)=>{
      const r = Math.floor(i/cols), c = i%cols;
      const x=0.35+c*cellW, y=0.5+r*cellH, pad=0.15;
      if(it.image && it.image.src){
        slide.addImage({path:it.image.src, x:x+pad, y:y+pad, w:cellW-pad*2, h:cellH-pad*2, sizing:{type:"contain", w:cellW-pad*2, h:cellH-pad*2}});
      } else {
        // foto non disponibile (rete assente o CORS): etichetta testuale come fallback, mai una cella vuota
        slide.addText(it.it,{x,y,w:cellW,h:cellH,align:"center",valign:"middle",fontSize:fitFontSize,isTextBox:true});
      }
    });
    slide.addText(s.label,{x:0.35,y:7.15,w:12.6,h:0.3,fontSize:11,color:"4B5A55",isTextBox:true});
  }
  return p.writeFile({fileName:exportFileName("categorizzazione", level, "pptx")});
}
