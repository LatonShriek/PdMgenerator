// Esportazione PowerPoint — Griglie-Conteggio.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

function exportGriglie(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_4x3"; // 10x7.5in — come gli originali, non widescreen (causa della distorsione)
  const SLIDE_W=10, SLIDE_H=7.5;
  deck.slides.forEach((s)=>{
    // Una sola slide, una sola griglia — le regole valide (fino a una decina) vanno
    // tutte nel commento, in forma essenziale, esattamente come nei file originali.
    const slide = p.addSlide();
    slide.background = {color:"FFFFFF"};
    // Regole raggruppate 3 per riga invece di una per riga: da fino a 10 righe
    // a non più di 4, per essere leggibili a colpo d'occhio durante la seduta
    // invece che come un lungo elenco verticale (richiesta di Rodrigo).
    const items = s.rules.map((x,i)=>`${i+1}) ${gridRuleLabel(x).replace(/\.$/,"")}`);
    const perLine = 2;
    const groupedLines = [];
    for(let i=0;i<items.length;i+=perLine) groupedLines.push(items.slice(i,i+perLine).join("   |   "));
    slide.addNotes(`Regole valide su questa griglia (semplice → complessa):\n${groupedLines.join("\n")}`);

    // Cerchi (non rettangoli) dimensionati per riempire la slide 10x7.5" quasi per intero:
    // il passo è il massimo che entra su entrambi gli assi (dimensione EFFETTIVA di questa
    // griglia, s.rows×s.cols — cresce col livello, vedi gridRowsForLevel/gridColsForLevel),
    // il diametro è il 96% del passo (margine minimo, cerchi quasi a contatto).
    const cols = s.cols, rows = s.rows;
    const PITCH = Math.min(SLIDE_W/cols, SLIDE_H/rows);
    const CIRCLE = PITCH*0.96;
    const gridW = (cols-1)*PITCH + CIRCLE, gridH = (rows-1)*PITCH + CIRCLE;
    const marginX = (SLIDE_W - gridW)/2, marginY = (SLIDE_H - gridH)/2;
    const fontSize = Math.round(CIRCLE*46);
    const lineWidth = Math.max(4, Math.round(CIRCLE*5.45));
    s.cells.forEach(c=>{
      const bgHex = c.fill ? hexNoHash(colorHex(c.fill)) : "FFFFFF";
      const borderHex = c.border ? hexNoHash(colorHex(c.border)) : "000000";
      const symHex = c.symColor ? hexNoHash(colorHex(c.symColor)) : "101010";
      slide.addText(c.sym, {
        shape: "ellipse",
        x: marginX + c.col*PITCH, y: marginY + c.row*PITCH, w:CIRCLE, h:CIRCLE,
        align:"center", valign:"middle", fontSize: c.size==="piccolo" ? Math.round(fontSize*0.42) : fontSize, bold:true, // grande = misura piena, piccolo = 0,42× (era 0,6×: differenza poco evidente)
        color:symHex,
        fill:{color:bgHex}, line:{color:borderHex, width:lineWidth, dashType:({tratteggiato:"dash", puntinato:"sysDot"})[c.bStyle] || "solid"},
        isTextBox:true
      });
    });
  });
  return p.writeFile({fileName:exportFileName("griglie", level, "pptx")});
}
