// Esportazione PowerPoint — Griglie-Conteggio.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

function exportGriglie(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_4x3"; // 10x7.5in — come gli originali, non widescreen (causa della distorsione)
  const SLIDE_W=10, SLIDE_H=7.5;
  // Modalità «una slide per regola»: per ogni regola, istruzione da sola → griglia completa (senza istruzione, il paziente deve ricordarla)
  // → soluzione (celle corrette lasciate in evidenza, le altre sbiadite, risposta numerica in basso). Di norma spenta: si attiva dalla barra laterale.
  const perRule = state.griglieSlidePerRegola === true;
  const BAND = 1.0; // fascia in basso riservata alla risposta (sempre lasciata libera in questa modalità, così le due griglie sono identiche)
  deck.slides.forEach((s)=>{
    if(perRule){ exportGriglieRules(p, s, SLIDE_W, SLIDE_H, BAND); return; }
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

// Disegna la griglia di una slide. `solution` = regola di cui evidenziare le celle corrette (le altre vengono sbiadite), oppure null.
function drawGriglieGrid(p, slide, s, SLIDE_W, areaH, solution){
  const cols = s.cols, rows = s.rows;
  const PITCH = Math.min(SLIDE_W/cols, areaH/rows);
  const CIRCLE = PITCH*0.96;
  const gridW = (cols-1)*PITCH + CIRCLE, gridH = (rows-1)*PITCH + CIRCLE;
  const marginX = (SLIDE_W - gridW)/2, marginY = (areaH - gridH)/2;
  const fontSize = Math.round(CIRCLE*46);
  const lineWidth = Math.max(4, Math.round(CIRCLE*5.45));
  s.cells.forEach(c=>{
    const bgHex = c.fill ? hexNoHash(colorHex(c.fill)) : "FFFFFF";
    const borderHex = c.border ? hexNoHash(colorHex(c.border)) : "000000";
    const symHex = c.symColor ? hexNoHash(colorHex(c.symColor)) : "101010";
    const dash = ({tratteggiato:"dash", puntinato:"sysDot"})[c.bStyle] || "solid";
    const cx = marginX + c.col*PITCH + CIRCLE/2, cy = marginY + c.row*PITCH + CIRCLE/2;
    const shapeDef = GRID_SHAPES[c.sym];
    if(shapeDef){
      slide.addShape(p.ShapeType.ellipse, { x:cx-CIRCLE/2, y:cy-CIRCLE/2, w:CIRCLE, h:CIRCLE, fill:{color:bgHex}, line:{color:borderHex, width:lineWidth, dashType:dash} });
      const B = CIRCLE * 0.66 * (c.size==="piccolo" ? 0.42 : 1);
      const strokePt = Math.max(2, Math.round(B*72*0.15));
      const g = { circle:{w:B*0.86,h:B*0.86}, square:{w:B*0.8,h:B*0.8}, triUp:{w:B*0.9,h:B*0.8}, triDown:{w:B*0.9,h:B*0.8},
                  rhombus:{w:B*0.62,h:B*0.9}, star:{w:B*1.0,h:B*1.0} }[shapeDef.geo];
      const type = { circle:p.ShapeType.ellipse, square:p.ShapeType.rect, triUp:p.ShapeType.triangle, triDown:p.ShapeType.triangle,
                     rhombus:p.ShapeType.diamond, star:p.ShapeType.star5 }[shapeDef.geo];
      const opts = { x:cx-g.w/2, y:cy-g.h/2 + (shapeDef.geo==="star" ? B*0.03 : 0), w:g.w, h:g.h, line:{color:symHex, width: shapeDef.filled ? 1 : strokePt} };
      if(shapeDef.filled) opts.fill = {color:symHex};
      if(shapeDef.geo==="triDown") opts.rotate = 180;
      slide.addShape(type, opts);
    } else {
      slide.addText(c.sym, {
        shape:"ellipse", x:cx-CIRCLE/2, y:cy-CIRCLE/2, w:CIRCLE, h:CIRCLE, align:"center", valign:"middle",
        fontSize: c.size==="piccolo" ? Math.round(fontSize*0.42) : fontSize, bold:true, color:symHex,
        fill:{color:bgHex}, line:{color:borderHex, width:lineWidth, dashType:dash}, isTextBox:true
      });
    }
    // Soluzione: nessun anello (le griglie hanno già bordi colorati, anche rossi, che si confonderebbero): le celle corrette restano
    // esattamente com'erano, tutte le altre sono coperte da un velo bianco quasi opaco e si intravedono appena (si capisce dove stavano).
    if(solution && !solution.matches(c)){
      slide.addShape(p.ShapeType.ellipse, { x:cx-CIRCLE/2-0.04, y:cy-CIRCLE/2-0.04, w:CIRCLE+0.08, h:CIRCLE+0.08, fill:{color:"FFFFFF", transparency:6}, line:{color:"FFFFFF", width:2} });
    }
  });
}

function exportGriglieRules(p, s, SLIDE_W, SLIDE_H, BAND){
  const areaH = SLIDE_H - BAND;
  s.rules.forEach((r,i)=>{
    const tot = s.rules.length;
    // 1) istruzione da sola
    const a = p.addSlide(); a.background = {color:"FFFFFF"};
    a.addNotes(`Regola ${i+1}/${tot} (istruzione). Poi: griglia completa, poi soluzione.`);
    a.addText(r.text, { x:0.6, y:1.2, w:SLIDE_W-1.2, h:SLIDE_H-2.4, align:"center", valign:"middle", fontSize:40, bold:true, color:"101010" });
    a.addText(`${i+1} / ${tot}`, { x:SLIDE_W-1.8, y:SLIDE_H-0.8, w:1.5, h:0.5, align:"right", fontSize:16, color:"888888" });
    // 2) griglia completa, senza istruzione né indicazioni
    const b = p.addSlide(); b.background = {color:"FFFFFF"};
    b.addNotes(`Regola ${i+1}/${tot}: ${r.text}\n(il paziente deve ricordare l'istruzione: non è sulla slide)`);
    drawGriglieGrid(p, b, s, SLIDE_W, areaH, null);
    // 3) soluzione: celle corrette lasciate in evidenza + risposta numerica
    const c = p.addSlide(); c.background = {color:"FFFFFF"};
    const ans = r.answer || (r.count + " elementi");
    c.addNotes(`Regola ${i+1}/${tot}: ${r.text}\nRisposta: ${ans}`);
    drawGriglieGrid(p, c, s, SLIDE_W, areaH, r);
    c.addText(`Risposta: ${ans}`, { x:0.3, y:SLIDE_H-BAND, w:SLIDE_W-0.6, h:BAND-0.1, align:"center", valign:"middle", fontSize:32, bold:true, color:"B01212" });
  });
}