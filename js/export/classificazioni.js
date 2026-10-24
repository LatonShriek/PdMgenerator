// Esportazione PowerPoint — Classificazioni: una diapositiva per quesito (tre termini grandi);
// la categoria e le risposte accettate stanno nelle note del relatore.
function exportClassificazioni(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  deck.items.forEach((it,i)=>{
    const s = p.addSlide();
    s.background = {color:"FFFFFF"};
    s.addText(`Quesito ${i+1}/${deck.items.length} — A quale categoria appartengono questi tre termini?`, {x:0.5,y:0.25,w:12.3,h:0.5,fontSize:18,color:"6B7A74",isTextBox:true});
    s.addText(it.terms.join("   ·   "), {x:0.5,y:1.6,w:12.3,h:2.6,fontSize:54,bold:true,align:"center",valign:"middle",color:"1E2A26",isTextBox:true});
    if(it.options){
      s.addText(it.options.map((o,k)=>`${"ABCD"[k]}) ${o}`).join("      "), {x:0.5,y:5.0,w:12.3,h:1.2,fontSize:30,align:"center",valign:"middle",color:"1E2A26",isTextBox:true});
    }
    const alt = it.accepted.filter(x=>x!==it.category);
    s.addNotes("Risposta: " + it.category + (alt.length ? " — accettate anche: " + alt.join(", ") : ""));
  });
  return p.writeFile({fileName:exportFileName("classificazioni", level, "pptx")});
}
