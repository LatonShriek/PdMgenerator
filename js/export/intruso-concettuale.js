// Esportazione PowerPoint — Intruso concettuale: una diapositiva per quesito; risposta nelle note del relatore.
function exportIntrusoConcettuale(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  deck.items.forEach((it,i)=>{
    const s = p.addSlide();
    s.background = {color:"FFFFFF"};
    s.addText(`Quesito ${i+1}/${deck.items.length} — Quale parola non c'entra con le altre?`, {x:0.5,y:0.25,w:12.3,h:0.5,fontSize:18,color:"6B7A74",isTextBox:true});
    s.addText(it.words.join("      "), {x:0.5,y:1.8,w:12.3,h:3.2,fontSize:50,bold:true,align:"center",valign:"middle",color:"1E2A26",isTextBox:true});
    s.addNotes(it.answer);
  });
  return p.writeFile({fileName:exportFileName("intrusoconc", level, "pptx")});
}
