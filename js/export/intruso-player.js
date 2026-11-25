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
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>Intruso percettivo — livello ${level}</title>
<style>
html,body{margin:0;height:100%;background:#fff;overflow:hidden;font-family:${PPTX_FONT_STACK};color:#1e2a26;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#top{position:fixed;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:16px;color:#5c6b65;z-index:5}
#top button{font:inherit;font-size:16px;min-height:36px;padding:0 12px;border:1px solid #c9d1cd;background:#f4f6f5;color:#5c6b65;border-radius:8px;cursor:pointer;opacity:.7}
#top button:hover{opacity:1}
#grid{position:fixed;left:10px;right:10px;top:48px;bottom:10px;display:grid;gap:8px}
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
#msg{position:fixed;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 6vw;background:#fff;z-index:8;font-size:max(22px,3.4vh);line-height:1.35}
#msg.on{display:flex}
#msg button.big{font:inherit;font-size:max(20px,3vh);padding:14px 34px;border:0;border-radius:12px;background:#4f7a68;color:#fff;cursor:pointer}
#msg table{border-collapse:collapse;font-size:max(18px,2.7vh)}
#msg td{padding:6px 18px;text-align:left}
#msg td+td{text-align:right;font-weight:700}
#msg small{font-size:max(14px,2vh);color:#8a948f}
</style></head><body>
<div id="top"><span id="prog"></span><span><button id="bf" type="button" title="Schermo intero">⛶ Schermo intero</button></span></div>
<div id="grid"></div>
<div id="msg" class="on"><div>Intruso percettivo — livello ${level}</div><div style="font-size:.8em;color:#5c6b65">Tocca l’unico elemento che compare <b>una sola volta</b>.</div><button class="big" id="go" type="button">Inizia</button></div>
<script>
var SL=${data}, HINT=${Math.max(1, Math.min(5, Math.round(hintAfter)))}, FONT=${JSON.stringify(PPTX_FONT_STACK)}, FILL=0.84;
var i=0, err=0, hinted=false, locked=false, t0=0, tS=0, res=[], started=false, wl=null;
var grid=document.getElementById("grid"), msg=document.getElementById("msg"), prog=document.getElementById("prog");

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
  // misura l'ingombro reale del contenuto: se una cella è troppo piena, il corpo si riduce per tutte (stessa misura ovunque)
  var sc=1;
  [].forEach.call(grid.children,function(d){
    var a=d.getBoundingClientRect(), ch=d.firstElementChild, cwid, chei;
    if(ch){ var r=ch.getBoundingClientRect(); cwid=r.width; chei=r.height; }
    else { var rg=document.createRange(); rg.selectNodeContents(d); var q=rg.getBoundingClientRect(); cwid=q.width; chei=q.height; }
    if(cwid>0) sc=Math.min(sc,(a.width-8)/cwid);
    if(chei>0) sc=Math.min(sc,(a.height-8)/chei);
  });
  if(sc<1){ var px2=Math.max(10,Math.floor(px*sc)); [].forEach.call(grid.children,function(d){ d.style.fontSize=px2+"px"; }); }
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
  var sec=Math.round((Date.now()-tS)/1000), mm=Math.floor(sec/60), ss=("0"+(sec%60)).slice(-2);
  var pct=Math.round(100*first/SL.length);
  grid.innerHTML=""; prog.textContent="Fine";
  msg.innerHTML='<div><b>Fatto!</b></div><table>'+
    '<tr><td>Giuste al primo tocco</td><td>'+first+' / '+SL.length+' ('+pct+'%)</td></tr>'+
    '<tr><td>Giuste dopo 1 errore</td><td>'+afterErr+'</td></tr>'+
    '<tr><td>Giuste con l’aiuto (riga)</td><td>'+withHint+'</td></tr>'+
    '<tr><td>Errori in tutto</td><td>'+tot+'</td></tr>'+
    '<tr><td>Tempo</td><td>'+mm+':'+ss+'</td></tr></table>'+
    '<small>Livello ${level}. Il riepilogo resta solo su questo schermo.</small><button class="big" id="go2" type="button">Ricomincia</button>';
  msg.classList.add("on"); document.getElementById("go2").addEventListener("click",begin);
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
document.getElementById("go").addEventListener("click",function(){ keepAwake(); begin(); });
function fs(){ var d=document,e=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else { var r=e.requestFullscreen||e.webkitRequestFullscreen; if(r){ try{ var p=r.call(e); if(p&&p.catch){p.catch(function(){});} }catch(x){} } } }
document.getElementById("bf").addEventListener("click",function(ev){ ev.stopPropagation(); fs(); });
document.addEventListener("keydown",function(e){ if(e.key==="f"||e.key==="F") fs(); });
function keepAwake(){ try{ if(navigator.wakeLock){ navigator.wakeLock.request("screen").then(function(l){ wl=l; l.addEventListener("release",function(){ wl=null; }); }).catch(function(){}); } }catch(x){} }
document.addEventListener("visibilitychange",function(){ if(document.visibilityState==="visible"&&started&&!wl) keepAwake(); });
var rt=null;
window.addEventListener("resize",function(){ clearTimeout(rt); rt=setTimeout(function(){ if(started&&i<SL.length&&!msg.classList.contains("on")) build(); },150); });
</script></body></html>`;
}

function intrusoOpenPlayer(){
  if(!state.deck || !state.deck.slides) return;
  const html = intrusoBuildPlayerHtml(state.deck, state.level, intrusoHintAfterValue());
  const url = URL.createObjectURL(new Blob([html], {type:"text/html"}));
  window.open(url, "_blank");
}

function intrusoDownloadPlayer(){
  if(!state.deck || !state.deck.slides) return;
  const html = intrusoBuildPlayerHtml(state.deck, state.level, intrusoHintAfterValue());
  saveAs(new Blob([html], {type:"text/html;charset=utf-8"}), exportFileName("intruso", state.level, "html").replace(/\.html$/, " a tocco.html"));
}
