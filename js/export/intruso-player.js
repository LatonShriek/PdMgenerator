// Lettore autonomo (pagina HTML) — Intruso percettivo a tocco, per l'uso individuale su tablet.
// Il paziente tocca l'unico elemento che compare una sola volta: se è quello giusto si passa alla schermata
// successiva; se è sbagliato l'elemento si attenua (segnalato come errore, non si può più toccare) e la schermata
// resta. Dopo `hintAfter` errori (predefinito 2) restano attive solo le celle della riga che contiene l'intruso
// (aiuto graduato: la ricerca passa da tutta la griglia a una riga, senza svelare la risposta).
// A fine serie compare un riepilogo: giuste al primo tocco, giuste dopo errori, giuste con aiuto, tempo.
// Come il lettore della Serie, è un solo file: si apre in qualunque browser, anche su tablet, e funziona senza rete.
// Nessun dato esce dal dispositivo.

const INTRUSO_HINT_AFTER_DEFAULT = 2;

function intrusoHintAfterValue(){
  const v = Math.round(Number(state.intrusoHintAfter));
  return Math.max(1, Math.min(5, isFinite(v) && v>0 ? v : INTRUSO_HINT_AFTER_DEFAULT));
}

// Dati di ogni schermata per il lettore: gli elementi e la posizione dell'intruso, più ciò che serve a dimensionare il
// corpo del carattere (stesse tabelle usate dall'esportazione PowerPoint: larghezza per carattere, cornice, rotazione).
function intrusoPlayerSlides(deck){
  return deck.slides.map(s=>{
    const itemLen = Math.max(1, ...s.items.map(it=>[...String(it)].length));
    const isAtomic = itemLen === 1 && INTRUSO_ATOMIC_FAMILIES.some(f=>f.id===s.familyId);
    const charWidth = INTRUSO_FAMILY_CHAR_WIDTH[s.familyId] ?? (isAtomic ? INTRUSO_DEFAULT_ATOMIC_CHAR_WIDTH : INTRUSO_DEFAULT_TEXT_CHAR_WIDTH);
    const cw = (itemLen>=2 && INTRUSO_GROUP_CHAR_WIDTH[s.familyId]) || charWidth;
    const framed = intrusoFramed(s.familyId, itemLen);
    const rotAngles = (s.orient>1 && s.angles) ? [...new Set(s.angles)] : null;
    const rbox = rotAngles ? intrusoRotBox(itemLen, cw, rotAngles, framed) : null;
    return {
      items: s.items.map(String),
      odd: s.oddIndex,
      angles: (s.orient>1 && s.angles) ? s.angles : null,
      len: itemLen,
      cw,
      framed,
      ink: INTRUSO_INK_FIT.has(s.familyId) && itemLen===1,
      rbox: rbox ? { W:rbox.W, H:rbox.H } : null
    };
  });
}

function intrusoBuildPlayerHtml(deck, level, hintAfter){
  const slides = intrusoPlayerSlides(deck);
  const data = JSON.stringify(slides).replace(/</g, "\\u003c");
  return touchPlayerPage({
    title: `Intruso percettivo — livello ${level}`,
    intro: "Tocca l’unico elemento che compare <b>una sola volta</b>.",
    css: `#grid{position:fixed;left:10px;right:10px;top:48px;bottom:10px;display:grid;gap:8px}
.c{display:flex;align-items:center;justify-content:center;border:2px solid #d9dfd9;border-radius:10px;background:#fff;font-weight:700;line-height:1;white-space:nowrap;overflow:hidden;cursor:pointer;transition:opacity .25s,background .25s}
.c.err{opacity:.28;background:#eceeed;border:2px dashed #9aa5a0;cursor:default}
.c.off{opacity:.12;cursor:default;pointer-events:none}
.c.ok{border-color:#2e9e5b;background:#e8f6ee}
.c .fr{display:inline-block;border:1.5px solid #8a948e;border-radius:.3em;padding:.04em .28em;line-height:1.25}
.c .bx{display:inline-block;position:relative;line-height:1}
.c .bx.fr2{border:1.5px solid #8a948e;border-radius:.3em;box-sizing:border-box}
.c .rt{position:absolute;left:50%;top:50%;white-space:nowrap}
@keyframes sh{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.c.shake{animation:sh .25s}
`,
    body: `<div id="grid"></div>`,
    script: `var SL=${data}, HINT=${Math.max(1, Math.min(5, Math.round(hintAfter)))}, FONT=${JSON.stringify(PPTX_FONT_STACK)}, FILL=0.84;
var i=0, err=0, hinted=false, locked=false, t0=0, tS=0, res=[];
var grid=document.getElementById("grid");

// stesse regole di impaginazione dell'app: solo divisori esatti, così l'ultima riga è piena quanto le altre
function bestCols(n,w,h){ var best=1,m=-1; for(var c=1;c<=n;c++){ if(n%c) continue; var r=n/c, s=Math.min(w/c,h/r); if(s>m){m=s;best=c;} } return best; }
var cv=null;
function inkRatio(items){
  try{ cv=cv||document.createElement("canvas"); var x=cv.getContext("2d"), Z=200; x.font=Z+"px "+FONT; var rw=0, rh=0;
    items.filter(function(v,k,a){return a.indexOf(v)===k;}).forEach(function(it){
      var m=x.measureText(it), hw=Math.max(m.width/2+m.actualBoundingBoxLeft, m.actualBoundingBoxRight-m.width/2), hh;
      if(m.fontBoundingBoxAscent!=null&&m.fontBoundingBoxDescent!=null){ var cb=(m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2; hh=Math.max(m.actualBoundingBoxAscent-cb, m.actualBoundingBoxDescent+cb); }
      else hh=(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)/2;
      rw=Math.max(rw,2*hw/Z); rh=Math.max(rh,2*hh/Z); });
    return (rw>0&&rh>0)?{rw:rw,rh:rh}:null; }catch(e){ return null; }
}

function fontPx(s,cw_,ch_){
  var gf = s.len>=3?0.86:(s.len===2?0.78:0.85);
  var px = Math.min(ch_*0.55, cw_*gf/s.len/s.cw);
  if(s.ink){ var r=inkRatio(s.items); if(r) px=Math.min(cw_*FILL/r.rw, ch_*FILL/r.rh); }
  if(s.rbox) px=Math.min(px, cw_*0.92/s.rbox.W, ch_*0.92/s.rbox.H);
  return Math.max(10, Math.floor(px));
}

function build(){
  var s=SL[i]; grid.innerHTML="";
  var W=grid.clientWidth, H=grid.clientHeight, gap=8;
  var cols=bestCols(s.items.length,W,H), rows=s.items.length/cols;
  grid.style.gridTemplateColumns="repeat("+cols+",minmax(0,1fr))"; grid.style.gridTemplateRows="repeat("+rows+",minmax(0,1fr))";
  var cw_=(W-gap*(cols-1))/cols-4, ch_=(H-gap*(rows-1))/rows-4, px=fontPx(s,cw_,ch_);
  var oddRow=Math.floor(s.odd/cols);
  s.items.forEach(function(it,k){
    var d=document.createElement("div"); d.className="c"; d.style.fontSize=px+"px"; d.setAttribute("data-k",k); d.setAttribute("data-row",Math.floor(k/cols));
    if(s.rbox){
      var b=document.createElement("span"); b.className="bx"+(s.framed?" fr2":""); b.style.width=s.rbox.W+"em"; b.style.height=s.rbox.H+"em";
      var r=document.createElement("span"); r.className="rt"; r.textContent=it; r.style.transform="translate(-50%,-50%) rotate("+((s.angles&&s.angles[k])||0)+"deg)";
      b.appendChild(r); d.appendChild(b);
    } else if(s.framed){ var f=document.createElement("span"); f.className="fr"; f.textContent=it; d.appendChild(f); }
    else d.textContent=it;
    grid.appendChild(d);
  });
  // misura l'ingombro reale e adatta il corpo allo spazio della cella: il contenuto più ingombrante occupa al più l'88% della cella
  // (si rimpicciolisce se esce, si ingrandisce se c'è molto spazio, fino a 1,8 volte); la misura è la stessa per tutte le celle
  var sc=Infinity;
  [].forEach.call(grid.children,function(d){
    var a=d.getBoundingClientRect(), ch=d.firstElementChild, cwid, chei;
    if(ch){ var r=ch.getBoundingClientRect(); cwid=r.width; chei=r.height; }
    else { var rg=document.createRange(); rg.selectNodeContents(d); var q=rg.getBoundingClientRect(); cwid=q.width; chei=q.height; }
    if(cwid>0) sc=Math.min(sc,(a.width-4)*0.88/cwid);
    if(chei>0) sc=Math.min(sc,(a.height-4)*0.88/chei);
  });
  if(isFinite(sc)){ sc=Math.min(sc,1.8); var px2=Math.max(10,Math.floor(px*sc)); if(px2!==px) [].forEach.call(grid.children,function(d){ d.style.fontSize=px2+"px"; }); }
  prog.textContent="Schermata "+(i+1)+" di "+SL.length;
  s._oddRow=oddRow;
  applyState();
}
// riapplica errori già fatti e aiuto (serve dopo un ridimensionamento / rotazione dello schermo)
var wrong=[];
function applyState(){
  var s=SL[i];
  [].forEach.call(grid.children,function(d){
    var k=+d.getAttribute("data-k"), row=+d.getAttribute("data-row");
    d.classList.toggle("err", wrong.indexOf(k)>=0);
    d.classList.toggle("off", hinted && row!==s._oddRow && wrong.indexOf(k)<0);
  });
}
function begin(){
  i=0; res=[]; started=true; msg.classList.remove("on"); tS=Date.now(); newScreen();
}
function newScreen(){ err=0; hinted=false; locked=false; wrong=[]; t0=Date.now(); build(); }
function nextScreen(){
  res.push({err:err, hint:hinted, ms:Date.now()-t0}); i++;
  if(i>=SL.length) return finish(); newScreen();
}
function finish(){
  var first=0, afterErr=0, withHint=0, tot=0;
  res.forEach(function(r){ tot+=r.err; if(r.hint) withHint++; else if(r.err>0) afterErr++; else first++; });
  var pct=Math.round(100*first/SL.length);
  grid.innerHTML="";
  showEnd([
    ["Giuste al primo tocco", first+" / "+SL.length+" ("+pct+"%)"],
    ["Giuste dopo 1 errore", afterErr],
    ["Giuste con l’aiuto (riga)", withHint],
    ["Errori in tutto", tot],
    ["Tempo", clock(Date.now()-tS)]
  ], "Livello ${level}. Il riepilogo resta solo su questo schermo.", begin);
}
grid.addEventListener("click",function(ev){
  if(!started||locked) return;
  var d=ev.target.closest&&ev.target.closest(".c"); if(!d||d.classList.contains("err")||d.classList.contains("off")) return;
  var k=+d.getAttribute("data-k"), s=SL[i];
  if(k===s.odd){ locked=true; d.classList.add("ok"); setTimeout(nextScreen,380); return; }
  err++; wrong.push(k); d.classList.add("shake"); setTimeout(function(){ d.classList.remove("shake"); },260);
  if(err>=HINT) hinted=true;
  applyState();
});
onStart(begin);
onRedraw(function(){ if(i<SL.length) build(); });`
  });
}

function intrusoOpenPlayer(){
  if(!state.deck || !state.deck.slides) return;
  const html = intrusoBuildPlayerHtml(state.deck, state.level, intrusoHintAfterValue());
  touchPlayerOpen(html);
}

function intrusoDownloadPlayer(){
  if(!state.deck || !state.deck.slides) return;
  const html = intrusoBuildPlayerHtml(state.deck, state.level, intrusoHintAfterValue());
  touchPlayerDownload(html, "intruso", state.level);
}
