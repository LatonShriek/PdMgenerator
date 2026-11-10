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
      const shapeDef = GRID_SHAPES[c.sym];
      if(shapeDef){
        // Forme geometriche: cerchio della cella (senza testo) + forma vera disegnata sopra, non un carattere.
        // Il rombo è un rombo vero (largo 0,62 dell'altezza), non un quadrato ruotato; le forme vuote hanno il
        // contorno spesso, così il loro colore si vede bene. Misure: stessa logica del testo (piccolo = 0,42×).
        const cx = marginX + c.col*PITCH + CIRCLE/2, cy = marginY + c.row*PITCH + CIRCLE/2;
        slide.addShape(p.ShapeType.ellipse, {
          x: cx - CIRCLE/2, y: cy - CIRCLE/2, w:CIRCLE, h:CIRCLE,
          fill:{color:bgHex}, line:{color:borderHex, width:lineWidth, dashType:({tratteggiato:"dash", puntinato:"sysDot"})[c.bStyle] || "solid"}
        });
        const B = CIRCLE * 0.66 * (c.size==="piccolo" ? 0.42 : 1);   // lato della scatola che contiene la forma
        const strokePt = Math.max(2, Math.round(B*72*0.15));
        const g = { circle:{w:B*0.86,h:B*0.86}, square:{w:B*0.8,h:B*0.8}, triUp:{w:B*0.9,h:B*0.8}, triDown:{w:B*0.9,h:B*0.8},
                    rhombus:{w:B*0.62,h:B*0.9}, star:{w:B*1.0,h:B*1.0} }[shapeDef.geo];
        const type = { circle:p.ShapeType.ellipse, square:p.ShapeType.rect, triUp:p.ShapeType.triangle, triDown:p.ShapeType.triangle,
                       rhombus:p.ShapeType.diamond, star:p.ShapeType.star5 }[shapeDef.geo];
        const opts = { x: cx - g.w/2, y: cy - g.h/2 + (shapeDef.geo==="star" ? B*0.03 : 0), w:g.w, h:g.h,
                       line:{color:symHex, width: shapeDef.filled ? 1 : strokePt} };
        if(shapeDef.filled) opts.fill = {color:symHex};
        if(shapeDef.geo==="triDown") opts.rotate = 180;
        slide.addShape(type, opts);
        return;
      }
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
