// Esportazione PowerPoint — Accesso lessicale.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

function exportAccesso(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  // fontSize adattato alla lunghezza della parola (prima era fisso a 80pt: enorme spreco
  // per parole corte, rischio di uscire dal riquadro per quelle lunghe).
  deck.slides.forEach(sl=>{
    const s = p.addSlide();
    s.background={color:"FFFFFF"};
    const len = sl.word.length;
    const fontSize = Math.round(Math.max(70, Math.min(260, 816/(len*0.55))));
    s.addText(sl.word,{x:0,y:0,w:13.33,h:7.5,align:"center",valign:"middle",fontSize,bold:true,color:"1E2A26",isTextBox:true});
    s.addNotes(deck.rule);
  });
  return p.writeFile({fileName:exportFileName("accesso", level, "pptx")});
}
