// Esportazione PowerPoint — Analogie: una diapositiva per quesito; risposta e risposte accettate nelle note.
function exportAnalogie(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  deck.items.forEach((it,i)=>{
    const s = p.addSlide();
    s.background = {color:"FFFFFF"};
    s.addText(`Quesito ${i+1}/${deck.items.length} — Completare l'analogia`, {x:0.5,y:0.25,w:12.3,h:0.5,fontSize:18,color:"6B7A74",isTextBox:true});
    s.addText(it.prompt, {x:0.5,y:1.6,w:12.3,h:2.4,fontSize:54,bold:true,align:"center",valign:"middle",color:"1E2A26",isTextBox:true});
    if(it.options){
      s.addText(it.options.map((o,k)=>`${"ABCD"[k]}) ${o}`).join("      "), {x:0.5,y:4.8,w:12.3,h:1.2,fontSize:30,align:"center",valign:"middle",color:"1E2A26",isTextBox:true});
    }
    s.addNotes("Risposta: " + it.answer + (it.accepted.length>1 ? " — accettate anche: " + it.accepted.slice(1).join(", ") : ""));
  });
  return p.writeFile({fileName:exportFileName("analogie", level, "pptx")});
}
