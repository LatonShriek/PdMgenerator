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


// Lettore autonomo (pagina HTML): le serie partono da sole, un tocco ferma e un altro fa ripartire.
// Non dipende da PowerPoint né da Google Presentazioni: si apre in qualunque browser (anche su tablet) e funziona senza rete.
function serieBuildPlayerHtml(deck, level, seconds){
  const seq = deck.seq.map(st => [st.char, st.color === "black" ? "#000" : "#e00000"]);
  const data = JSON.stringify(seq).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Serie attentive alternate — livello ${level}</title>
<style>
html,body{margin:0;height:100%;background:#fff;overflow:hidden;font-family:sans-serif;user-select:none;-webkit-user-select:none;touch-action:manipulation}
#s{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(46vw,60vh);font-weight:bold;line-height:1}
#m{position:fixed;left:0;right:0;bottom:3vh;text-align:center;font-size:max(14px,2vh);color:#8a948f}
#b{position:fixed;right:1.5vh;top:1.5vh;display:flex;gap:1vh;z-index:5}
#b button{font-size:max(18px,3vh);padding:.8vh 1.6vh;border:1px solid #c9d1cd;background:#f4f6f5;color:#5c6b65;border-radius:8px;opacity:.55;cursor:pointer}
#b button:hover{opacity:1}
#t{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:5vh;color:#5c6b65;text-align:center;padding:0 5vw}
</style></head><body>
<div id="s"></div><div id="t"></div><div id="m"></div>
<div id="b"><button id="bp" type="button" title="Pausa / riprendi">⏯</button><button id="bf" type="button" title="Schermo intero">⛶ Schermo intero</button></div>
<script>
var SEQ=${data}, MS=${Math.round(seconds*1000)}, i=-1, timer=null, paused=false, started=false;
var s=document.getElementById("s"), m=document.getElementById("m"), t=document.getElementById("t");
function show(){ if(i>=SEQ.length){ s.textContent=""; t.textContent="Fine della serie — tocca per ricominciare"; clearTimeout(timer); return; } t.textContent=""; s.textContent=SEQ[i][0]; s.style.color=SEQ[i][1]; }
var GAP=Math.min(250,Math.round(MS*0.25));
function tick(){ i++; if(i>=SEQ.length){ show(); timer=null; return; }
  s.textContent=""; timer=setTimeout(function(){ show(); timer=setTimeout(tick,MS-GAP); },GAP); }  // breve schermo vuoto: anche lo stesso stimolo ripetuto si vede cambiare
function setPause(p){ paused=p; m.textContent=p?"in pausa — tocca per riprendere":""; }
function toggle(){
  if(!started) return;
  if(i>=SEQ.length){ i=-1; setPause(false); tick(); return; }
  if(!paused){ clearTimeout(timer); timer=null; setPause(true); }
  else { setPause(false); timer=setTimeout(tick,GAP); }   // riprende dallo stimolo successivo
}
function fs(){ var d=document, e=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else { var r=e.requestFullscreen||e.webkitRequestFullscreen; if(r){ try{ var p=r.call(e); if(p&&p.catch){ p.catch(function(){}); } }catch(x){} } } }
document.getElementById("bf").addEventListener("click",function(ev){ ev.stopPropagation(); fs(); });
document.getElementById("bp").addEventListener("click",function(ev){ ev.stopPropagation(); toggle(); });
document.addEventListener("click",function(){ if(!wl) keepAwake(); toggle(); });
document.addEventListener("keydown",function(e){ if(e.key==="f"||e.key==="F"){fs();} else if(e.key===" "||e.key==="Enter"){e.preventDefault();toggle();} });

var wl=null, nv=null;
function keepAwake(){
  try{ if(navigator.wakeLock){ navigator.wakeLock.request("screen").then(function(l){ wl=l; l.addEventListener("release",function(){ wl=null; }); }).catch(function(){}); } }catch(x){}
  if(!nv){ try{ nv=document.createElement("video"); nv.setAttribute("playsinline",""); nv.muted=true; nv.loop=true; nv.style.cssText="position:fixed;width:1px;height:1px;opacity:.01;pointer-events:none";
    var src=nv.canPlayType("video/webm")?"data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHiEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEeTbuMU6uEHFO7a1OsggHM7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiECPQAAAAAAAFlSua8GuAQAAAAAAADjXgQFzxYjQAO6RZ/bWmpyBACK1nIN1bmSIgQCGhVZfVlA4g4EBI+ODhDuaygDgibCBELqBEJqBAhJUw2f8c3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2MC4xNi4xMDBzc9ZjwItjxYjQAO6RZ/bWmmfIoUWjh0VOQ09ERVJEh5RMYXZjNjAuMzEuMTAyIGxpYnZweGfIoUWjiERVUkFUSU9ORIeTMDA6MDA6MDEuMDAwMDAwMDAwAB9DtnWo54EAo6OBAACAEAIAnQEqEAAQAABHCIWFiJmEiAICAAwNYAD+/6tQgBxTu2uRu4+zgQC3iveBAfGCAZ/wgQM=":"data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMTbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAA+gAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAj10cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+gAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPoAAAAAAABAAAAAAG1bWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAAAQABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABYG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAASBzdGJsAAAAvHN0c2QAAAAAAAAAAQAAAKxhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAAEABIAAAASAAAAAAAAAABFUxhdmM2MC4zMS4xMDIgbGlieDI2NAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAF2dkAAqs2V7ARAAAAwAEAAADAAg8SJZYAQAEaO+Py/34+AAAAAAQcGFzcAAAAAEAAAABAAAAFGJ0cnQAAAAAAAAWIAAAFiAAAAAYc3R0cwAAAAAAAAABAAAAAQAAQAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACxAAAAAEAAAAUc3RjbwAAAAAAAAABAAADQwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNjAuMTYuMTAwAAAACGZyZWUAAALMbWRhdAAAAqoGBf//ptxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNjQgcjMxMDggMzFlMTlmOSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMjMgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0xIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgzIG1lPWhleCBzdWJtZT0yIHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTAgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0wIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PTAgdGhyZWFkcz0xIGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0xIGtleWludD0yNTAga2V5aW50X21pbj0xIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9MTAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAEmWIhAAV/+r/wlU/vbN0XEX/8Q=="; nv.src=src; document.body.appendChild(nv); }catch(x){} }
  try{ if(nv){ var p=nv.play(); if(p&&p.catch){ p.catch(function(){}); } } }catch(x){}
}
document.addEventListener("visibilitychange",function(){ if(document.visibilityState==="visible"&&started){ keepAwake(); } });
var n=3; t.textContent="La serie parte tra "+n+"…";
var c=setInterval(function(){ n--; if(n>0){ t.textContent="La serie parte tra "+n+"…"; } else { clearInterval(c); started=true; keepAwake(); tick(); } },1000);
</script></body></html>`;
}

function serieOpenPlayer(){
  if(!state.deck || !state.deck.seq) return;
  const html = serieBuildPlayerHtml(state.deck, state.level, serieAutoSecondsValue());
  const url = URL.createObjectURL(new Blob([html], {type:"text/html"}));
  window.open(url, "_blank");
}

function serieDownloadPlayer(){
  if(!state.deck || !state.deck.seq) return;
  const seconds = serieAutoSecondsValue();
  const html = serieBuildPlayerHtml(state.deck, state.level, seconds);
  saveAs(new Blob([html], {type:"text/html;charset=utf-8"}), exportFileName("serie", state.level, "html").replace(/\.html$/, ` pagina ${seconds}s.html`));
}
