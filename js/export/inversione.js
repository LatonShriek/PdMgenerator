// Esportazione PowerPoint — Inversione e riordino.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

function exportInversione(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  const title = p.addSlide();
  title.background={color:"FFFFFF"};
  title.addText(`Inversione e riordino — Livello ${level}`, {x:0.5,y:2.8,w:12.3,h:1.2,align:"center",fontSize:32,bold:true,color:"1E2A26",isTextBox:true});
  title.addNotes(
    `Tutte le regole disponibili (si applicano secondo il tipo di blocco, vedi sotto ogni stimolo):\n`+
    SEQUENCE_RULES.map(r=>`- ${r.label} (${r.kinds.join(", ")})`).join("\n")+
    `\n\nOgni stimolo ha 1-2 caratteri colorati (rosso, dal livello 13 anche verde): la consegna clinica `+
    `esatta legata a questi caratteri non è confermata nel materiale originale — verificare con Rodrigo.`
  );
  // Dimensione del font proporzionata alla lunghezza dello stimolo, non più fissa a 110pt
  // (troppo piccola: su una slide 13.33×7.5in restava confinata in un angolo). Calcolata per
  // sfruttare la slide il più possibile restando SEMPRE entro i margini: il vincolo di
  // larghezza usa una stima larga (0.75em a carattere, prudente anche per le lettere più
  // larghe come "M") e quello di altezza lascia margine sopra/sotto — si prende il più
  // piccolo dei due, quindi non sforma mai, nemmeno nei casi più estremi testati (stringhe
  // di sole "M" ripetute, le più larghe possibili nell'alfabeto usato).
  function inversioneFontSize(text){
    const n = Math.max(1, [...text].length);
    const maxWidthPt = 13.33*72*0.82;
    const maxHeightPt = 7.5*72*0.60;
    const byWidth = maxWidthPt / (n*0.75);
    const byHeight = maxHeightPt / 1.15;
    return Math.max(150, Math.min(380, Math.floor(Math.min(byWidth, byHeight))));
  }
  deck.blocks.forEach(b=>{
    const applicable = SEQUENCE_RULES.filter(r=>r.kinds.includes(b.kind));
    b.items.forEach((item, idx)=>{
      const blank = p.addSlide();
      blank.background={color:"FFFFFF"};
      if(idx===0) blank.addNotes(`Blocco: ${b.label}`);
      const stim = p.addSlide();
      stim.background={color:"FFFFFF"};
      const markMap = {};
      item.marks.forEach(m=>markMap[m.index]=m.color);
      const fontSize = inversioneFontSize(item.text);
      const runs=[]; let cur=null;
      [...item.text].forEach((ch,i)=>{
        const col = markMap[i] ? hexNoHash(markMap[i]) : "1E2A26";
        if(cur && cur.options.color===col){ cur.text+=ch; }
        else { cur = {text:ch, options:{fontSize,bold:true,color:col}}; runs.push(cur); }
      });
      stim.addText(runs, {x:0,y:0,w:13.33,h:7.5,align:"center",valign:"middle",isTextBox:true});
      // Niente soluzioni nel commento: si vedono solo nell'app con "Mostra risposta",
      // mai nel file esportato (vale per tutti gli esercizi, non solo questo).
    });
  });
  return p.writeFile({fileName:exportFileName("inversione", level, "pptx")});
}
