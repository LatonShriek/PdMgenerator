// Esportazione PowerPoint — Serie attentive alternate.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

function exportSerie(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  // La regola in vigore e quella del livello successivo vanno SOLO nelle note
  // del relatore (visibili in PowerPoint solo a chi presenta, in Visualizzazione
  // relatore o stampando le pagine note) — mai come testo sulla slide, che
  // sarebbe visibile anche al paziente se il file viene proiettato o stampato
  // normalmente. Le note sono ripetute su ogni slide (non solo sul titolo), così
  // restano a portata mentre si avanza stimolo per stimolo durante la seduta.
  const nextText = deck.nextRule ? `Al livello successivo: ${deck.nextRule}` : "Ultimo livello disponibile.";
  const notesText = `Regola (livello ${level}): ${deck.rule}\n${nextText}`;

  const title = p.addSlide();
  title.background={color:"FFFFFF"};
  title.addText(`Serie attentive alternate — Livello ${level}`, {x:0.5,y:2.5,w:12.3,h:1.2,align:"center",fontSize:32,bold:true,color:"1E2A26",isTextBox:true});
  title.addNotes(notesText);
  deck.seq.forEach(st=>{
    const s = p.addSlide();
    s.background={color:"FFFFFF"};
    s.addText(st.char,{x:0,y:0,w:13.33,h:7.5,align:"center",valign:"middle",fontSize:220,bold:true,
      color: st.color==="black" ? "000000":"FF0000", isTextBox:true});
    s.addNotes(notesText);
  });
  return p.writeFile({fileName:exportFileName("serie", level, "pptx")});
}
