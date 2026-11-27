// Base comune dei lettori a tocco (pagine HTML autonome per l'uso individuale su tablet).
// Qui sta ciò che è uguale per tutti: schermata di avvio, schermo intero, schermo sempre acceso, riepilogo finale,
// ridisegno quando lo schermo cambia, apertura e download del file. Come si disegna l'esercizio, cosa si tocca,
// quando la risposta è giusta e quale aiuto compare stanno nel file di ogni esercizio (intruso-player.js, griglie-player.js).
// Ogni file prodotto è completo: si apre anche senza rete e nessun dato esce dal dispositivo.

// Codice che finisce DENTRO la pagina prodotta, prima di quello del singolo esercizio.
const TOUCH_PLAYER_BASE_JS = `var started=false, wl=null;
var msg=document.getElementById("msg"), prog=document.getElementById("prog");
function fs(){ var d=document,e=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else { var r=e.requestFullscreen||e.webkitRequestFullscreen; if(r){ try{ var p=r.call(e); if(p&&p.catch){p.catch(function(){});} }catch(x){} } } }
document.getElementById("bf").addEventListener("click",function(ev){ ev.stopPropagation(); fs(); });
document.addEventListener("keydown",function(e){ if(e.key==="f"||e.key==="F") fs(); });
function keepAwake(){ try{ if(navigator.wakeLock){ navigator.wakeLock.request("screen").then(function(l){ wl=l; l.addEventListener("release",function(){ wl=null; }); }).catch(function(){}); } }catch(x){} }
document.addEventListener("visibilitychange",function(){ if(document.visibilityState==="visible"&&started&&!wl) keepAwake(); });
function onStart(begin){ document.getElementById("go").addEventListener("click",function(){ started=true; keepAwake(); msg.classList.remove("on"); begin(); }); }
// ridisegno dopo rotazione o ridimensionamento (non durante la schermata di avvio o il riepilogo)
function onRedraw(redraw){ var t=null; window.addEventListener("resize",function(){ clearTimeout(t); t=setTimeout(function(){ if(started&&!msg.classList.contains("on")) redraw(); },150); }); }
function clock(ms){ var s=Math.round(ms/1000); return Math.floor(s/60)+":"+("0"+(s%60)).slice(-2); }
// riepilogo finale: righe [etichetta, valore] e pulsante «Ricomincia»
function showEnd(rows, note, restart){
  prog.textContent="Fine";
  msg.innerHTML='<div><b>Fatto!</b></div><table>'+rows.map(function(r){ return '<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>'; }).join('')+'</table>'+
    '<small>'+note+'</small><button class="big" id="go2" type="button">Ricomincia</button>';
  msg.classList.add("on");
  document.getElementById("go2").addEventListener("click",function(){ msg.classList.remove("on"); restart(); });
}
`;

// Compone la pagina: title (titolo), intro (istruzione di avvio, HTML), css, body (HTML dell'esercizio), script.
function touchPlayerPage({ title, intro, css, body, script }){
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${title}</title>
<style>
html,body{margin:0;height:100%;background:#fff;overflow:hidden;font-family:${PPTX_FONT_STACK};color:#1e2a26;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#top{position:fixed;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;font-size:16px;color:#5c6b65;z-index:5}
#top button{font:inherit;font-size:16px;min-height:36px;padding:0 12px;border:1px solid #c9d1cd;background:#f4f6f5;color:#5c6b65;border-radius:8px;cursor:pointer;opacity:.7}
#top button:hover{opacity:1}
${css}
#msg{position:fixed;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:0 6vw;background:#fff;z-index:8;font-size:max(22px,3.4vh);line-height:1.35}
#msg.on{display:flex}
#msg button.big{font:inherit;font-size:max(20px,3vh);padding:14px 34px;border:0;border-radius:12px;background:#4f7a68;color:#fff;cursor:pointer}
#msg table{border-collapse:collapse;font-size:max(18px,2.7vh)}
#msg td{padding:6px 18px;text-align:left}
#msg td+td{text-align:right;font-weight:700}
#msg small{font-size:max(14px,2vh);color:#8a948f}
</style></head><body>
<div id="top"><span id="prog"></span><span><button id="bf" type="button" title="Schermo intero">⛶ Schermo intero</button></span></div>
${body}
<div id="msg" class="on"><div>${title}</div><div style="font-size:.8em;color:#5c6b65">${intro}</div><button class="big" id="go" type="button">Inizia</button></div>
<script>
${TOUCH_PLAYER_BASE_JS}
${script}
</script></body></html>`;
}

function touchPlayerOpen(html){
  window.open(URL.createObjectURL(new Blob([html], {type:"text/html"})), "_blank");
}
function touchPlayerDownload(html, exId, level){
  saveAs(new Blob([html], {type:"text/html;charset=utf-8"}), exportFileName(exId, level, "html").replace(/\.html$/, " a tocco.html"));
}
