// Esportazione PowerPoint — Serie attentive alternate.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

// PptxGenJS non sa impostare le transizioni tra slide: si aggiunge a mano nel file già generato.
// Su ogni slide-stimolo (non sul titolo) c'è un "Push": la slide nuova spinge via la precedente da destra,
// così il cambio si vede anche quando due stimoli di fila sono identici. Parte al clic/freccia come le altre slide.
const SERIE_TRANSITION_XML = '<p:transition spd="fast"><p:push dir="l"/></p:transition>';

// Presentazione automatica (opzione): ogni stimolo resta a schermo per un numero di secondi scelto, poi scorre da solo.
// Le transizioni di PowerPoint hanno due attributi per questo: advTm = millisecondi prima del passaggio automatico,
// advClick="0" = il clic/tocco NON fa avanzare. La pausa con un tocco si ottiene con una scorciatoia (vedi exportSerie):
// sopra ogni stimolo c'è un'immagine trasparente a schermo intero che al tocco porta a una copia "in pausa" dello stesso
// stimolo (senza timer); toccandola di nuovo si riparte dallo stimolo successivo.
function serieAutoRunTransition(seconds){
  const ms = Math.round(seconds*1000);
  return `<p:transition spd="fast" advClick="0" advTm="${ms}"><p:push dir="l"/></p:transition>`;
}
const SERIE_NO_CLICK_TRANSITION_XML = '<p:transition advClick="0"/>';   // nessun effetto, il clic non fa avanzare

// plan: elenco di { n: numero della slide (1 = la prima), xml: transizione da inserire }. Il numero è quello di
// ppt/slides/slideN.xml, che PptxGenJS assegna nell'ordine in cui le slide sono create.
async function addSerieTransitions(arrayBuffer, plan){
  const zip = await JSZip.loadAsync(arrayBuffer);
  for(const { n, xml: transitionXml } of plan){
    const name = `ppt/slides/slide${n}.xml`;
    const f = zip.file(name);
    if(!f) throw new Error("slide mancante nel file: " + name);
    const xml = await f.async("string");
    if(xml.includes("<p:transition")) continue;
    // l'ordine nello schema è: cSld, clrMapOvr, transition, timing, extLst
    const at = xml.search(/<p:timing[\s>]|<p:extLst[\s>]|<\/p:sld>/);
    if(at < 0) throw new Error("struttura inattesa in " + name);
    zip.file(name, xml.slice(0, at) + transitionXml + xml.slice(at));
  }
  return zip.generateAsync({ type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}

// Immagine trasparente 1×1: si stira a tutta la slide come area "da toccare" (un'immagine con collegamento è sempre
// cliccabile in PowerPoint; una forma senza riempimento no).
function serieClickPad(){
  const c = document.createElement("canvas"); c.width = 1; c.height = 1;
  return c.toDataURL("image/png");
}

function serieAutoSecondsValue(){
  const v = Number(state.serieAutoSeconds);
  return Math.max(0.5, Math.min(30, isFinite(v) && v>0 ? v : 2));
}

async function exportSerie(deck, level){
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE";
  // Per Google Presentazioni: Google ignora i timer del PowerPoint e il blocco del clic, quindi il file è «normale»
  // (clic/frecce funzionano) e lo scorrimento automatico si imposta da «Pubblica sul web» con lo stesso intervallo.
  const google = !!state.serieAutoPlay && !!state.serieGoogle;
  const auto = !!state.serieAutoPlay && !google;
  const seconds = serieAutoSecondsValue();
  // La regola in vigore e quella del livello successivo vanno SOLO nelle note
  // del relatore (visibili in PowerPoint solo a chi presenta, in Visualizzazione
  // relatore o stampando le pagine note) — mai come testo sulla slide, che
  // sarebbe visibile anche al paziente se il file viene proiettato o stampato
  // normalmente. Le note sono ripetute su ogni slide (non solo sul titolo), così
  // restano a portata mentre si avanza stimolo per stimolo durante la seduta.
  const nextText = deck.nextRule ? `Al livello successivo: ${deck.nextRule}` : "Ultimo livello disponibile.";
  const notesText = `Regola (livello ${level}): ${deck.rule}\n${nextText}` +
    (google ? `\nGoogle Presentazioni: File › Condividi › Pubblica sul web › Presentazione automatica, intervallo ${seconds} s (le scelte di Google sono 1, 2, 3, 5, 10, 15, 30 s). In presentazione normale si avanza con la freccia.` : "") +
    (auto ? `\nPresentazione automatica: un nuovo stimolo ogni ${seconds} s. Un tocco sullo schermo ferma, un altro tocco riprende dallo stimolo successivo.` : "");

  const addStimulus = (st, pauseCue) => {
    const s = p.addSlide();
    s.background={color:"FFFFFF"};
    s.addText(st.char,{x:0,y:0,w:13.33,h:7.5,align:"center",valign:"middle",fontSize:220,bold:true,
      color: st.color==="black" ? "000000":"FF0000", isTextBox:true});
    if(pauseCue) s.addText("in pausa — tocca per riprendere",{x:0,y:6.9,w:13.33,h:0.4,align:"center",valign:"middle",fontSize:14,color:"B5BDB9",isTextBox:true});
    s.addNotes(notesText);
    return s;
  };

  const title = p.addSlide();
  title.background={color:"FFFFFF"};
  title.addText(`Serie attentive alternate — Livello ${level}`, {x:0.5,y:2.5,w:12.3,h:1.2,align:"center",fontSize:32,bold:true,color:"1E2A26",isTextBox:true});
  if(auto) title.addText(`Si avvia con un clic, poi scorre da sola ogni ${seconds} s. Un tocco ferma, un altro riprende.`, {x:0.5,y:3.8,w:12.3,h:0.6,align:"center",fontSize:18,color:"5C6B65",isTextBox:true});
  title.addNotes(notesText);

  if(google) title.addText(`Per Google Presentazioni: Condividi › Pubblica sul web › avanza ogni ${seconds} s.`, {x:0.5,y:3.8,w:12.3,h:0.6,align:"center",fontSize:18,color:"5C6B65",isTextBox:true});

  const N = deck.seq.length;
  const plan = [];
  // Ordine delle slide (numerate da 1): 1 titolo · 2..N+1 stimoli · N+2 fine · N+3..2N+2 stimoli "in pausa".
  // Nella modalità normale ci sono solo il titolo e gli stimoli (nessuna slide di fine né di pausa).
  const pad = auto ? serieClickPad() : null;
  deck.seq.forEach((st,i)=>{
    const s = addStimulus(st, false);
    if(auto){
      s.addImage({ data:pad, x:0, y:0, w:13.33, h:7.5, hyperlink:{ slide: N+3+i, tooltip:"Pausa" } });
      plan.push({ n:i+2, xml: serieAutoRunTransition(seconds) });
    } else {
      plan.push({ n:i+2, xml: SERIE_TRANSITION_XML });
    }
  });
  if(auto){
    const end = p.addSlide();
    end.background={color:"FFFFFF"};
    end.addText("Fine della serie", {x:0.5,y:3,w:12.3,h:1.2,align:"center",fontSize:32,bold:true,color:"1E2A26",isTextBox:true});
    end.addNotes(notesText);
    plan.push({ n:N+2, xml: SERIE_NO_CLICK_TRANSITION_XML });
    deck.seq.forEach((st,i)=>{
      const s = addStimulus(st, true);
      // tocco = si riparte dallo stimolo successivo (o dalla slide di fine, dopo l'ultimo)
      s.addImage({ data:pad, x:0, y:0, w:13.33, h:7.5, hyperlink:{ slide: i+3, tooltip:"Riprendi" } });
      plan.push({ n:N+3+i, xml: SERIE_NO_CLICK_TRANSITION_XML });
    });
  }

  let fileName = exportFileName("serie", level, "pptx");
  if(auto) fileName = fileName.replace(/\.pptx$/, ` automatica ${seconds}s.pptx`);
  if(google) fileName = fileName.replace(/\.pptx$/, ` per Google ${seconds}s.pptx`);
  const buf = await p.write({ outputType:"arraybuffer" });
  let blob;
  try{ blob = await addSerieTransitions(buf, plan); }
  catch(e){
    // Se per qualunque motivo la transizione non si può aggiungere, si scarica comunque il file senza.
    console.error("Serie: transizione non aggiunta:", e);
    return p.writeFile({ fileName });
  }
  saveAs(blob, fileName);
}
