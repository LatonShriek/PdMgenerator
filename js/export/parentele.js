// Esportazione PowerPoint — Parentele: una diapositiva per quesito (testo grande, da proiettare);
// la risposta sta nelle note del relatore.
function exportParentele(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  deck.items.forEach((it,i)=>{
    const s = p.addSlide();
    s.background = {color:"FFFFFF"};
    s.addText(`Quesito ${i+1}/${deck.items.length}`, {x:0.5,y:0.25,w:12.3,h:0.5,fontSize:18,color:"6B7A74",isTextBox:true});
    s.addText(it.premises.join("\n"), {x:0.7,y:0.9,w:11.9,h:3.4,fontSize:34,color:"1E2A26",valign:"top",paraSpaceAfter:8,isTextBox:true});
    s.addText(it.question, {x:0.7,y:4.4,w:11.9,h:1.0,fontSize:34,bold:true,color:"1E2A26",valign:"middle",isTextBox:true});
    if(it.options){
      s.addText(it.options.map((o,k)=>`${"ABCD"[k]}) ${o}`).join("      "), {x:0.7,y:5.6,w:11.9,h:0.9,fontSize:30,color:"1E2A26",valign:"middle",isTextBox:true});
    }
    s.addNotes("Risposta: " + it.answer + (it.reverse ? " — " + it.reverse : ""));
  });
  return p.writeFile({fileName:exportFileName("parentele", level, "pptx")});
}
