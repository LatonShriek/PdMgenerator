// Lettore autonomo (pagina HTML) — Griglie-Conteggio a tocco, per l'uso individuale su tablet.
// Invece di dire un numero, il paziente tocca le celle richieste dalla consegna (un secondo tocco le toglie) e preme
// «Conferma»: prima della conferma non ha nessun riscontro. La risposta è giusta solo con tutte le celle corrette e
// nessuna in più. Al primo errore: le celle sbagliate vengono segnalate e tolte dalla selezione (non si ritoccano); se ne
// mancano compare «Ne manca qualcuna», senza dire quante o quali. Al secondo errore si mostra la soluzione, distinguendo
// trovate, dimenticate e sbagliate. Si va avanti solo con «Avanti».
// La cornice (avvio, schermo intero, riepilogo, download) è in player-base.js. Il generatore e il PowerPoint non cambiano.

// Consegne a cui non si risponde toccando le celle: confronto fra due gruppi, «in quante righe/colonne» e
// «quale riga/colonna». Nel lettore vengono sostituite con altre consegne sulla STESSA griglia.
const GRID_TOUCH_EXCLUDED = ["compare","rows","whichrow"];

// Candidate sulla stessa griglia, ricostruite dalle celle (simboli, colori e attributi presenti).
function griglieTouchCandidates(s, level){
  const uniq = k => [...new Set(s.cells.map(c=>c[k]).filter(Boolean))];
  const colors = names => names.map(n=>COLORS.find(x=>x.name===n)).filter(Boolean);
  const symbols = uniq("sym"), F = colors(uniq("fill")), B = colors(uniq("border")), I = colors(uniq("symColor"));
  const effLevel = tierEffectiveLevel(level, GRID_CATEGORY_BY_LEVEL[level] || "shapes");
  const sizes = uniq("size"), bStyles = uniq("bStyle");
  const feat = {
    sizes: sizes.length ? sizes : null,
    bStyles: bStyles.length ? bStyles : null,
    fillVoid: s.cells.some(c=>!c.fill),
    posOptions: buildPosOptions(s.rows, s.cols).filter(o => o.w===1 || effLevel>=GRID_POS_W2_FROM)
  };
  const famPreds = familyPredicates(symbols);
  const seen = new Set(), out = [];
  const push = r => {
    if(!r || seen.has(r.text) || GRID_TOUCH_EXCLUDED.includes(r.vk)) return;
    seen.add(r.text);
    const n = s.cells.filter(r.matches).length;
    if(r.vk!=="double") r.count = n;
    if(r.count>=4 && r.count<=14) out.push(r);
  };
  symbols.forEach(sym=> push(specToRule({ syms:[sym] })));
  famPreds.forEach(p=> push(specToRule({ pred:p })));
  for(let i=0; i<1600; i++) push(specToRule(sampleSpec(symbols, famPreds, F, B, I, feat)));
  for(let i=0; i<900; i++) push(gridVarRules(s.cells, s.rows, s.cols, symbols, F, B, I, feat, effLevel));
  return { list: out, amax: gridAbstractionMax(effLevel) };
}

// Le consegne usate dal lettore: quelle della griglia, con le non adatte al tocco sostituite da consegne di punteggio il
// più possibile vicino (entro l'astrazione ammessa dal livello, senza quasi-doppioni): il numero di consegne resta lo stesso.
// La scelta si ricorda, così «Avvia» e «Scarica» producono le stesse consegne.
const griglieTouchCache = new WeakMap();
function griglieTouchRules(s, level){
  const hit = griglieTouchCache.get(s);
  if(hit && hit.level===level) return hit.rules;
  const kept = s.rules.filter(r=>!GRID_TOUCH_EXCLUDED.includes(r.vk));
  const dropped = s.rules.filter(r=>GRID_TOUCH_EXCLUDED.includes(r.vk));
  if(dropped.length){
    const { list, amax } = griglieTouchCandidates(s, level);
    dropped.forEach(old=>{
      let best = null, bc = Infinity;
      // primo giro: tutti i vincoli; se non resta niente si allentano, per non perdere consegne
      for(const strict of [true,false]){
        for(const r of list){
          if(kept.some(x=>x.text===r.text)) continue;
          if(strict && (r.parts.A>amax+1e-9 || kept.some(x=>gridRulesConflict(r,x)))) continue;
          const c = Math.abs(r.score-old.score) + (r.vk && kept.some(x=>x.vk===r.vk) ? 2 : 0)
                  + 0.3*kept.filter(x=>x.count===r.count).length + 0.4*kept.filter(x=>x.base===r.base).length + Math.random()*0.2;
          if(c<bc){ bc=c; best=r; }
        }
        if(best) break;
      }
      if(best) kept.push(best);
    });
  }
  kept.sort((a,b)=>a.score-b.score);
  griglieTouchCache.set(s, { level, rules: kept });
  return kept;
}

function griglieTouchText(t){
  return t.replace(/^Conta /, "Tocca ").replace("si conta una volta sola", "si tocca una volta sola");
}
// Una consegna → uno o due passaggi, ciascuno con il proprio insieme di celle giuste.
function griglieTouchTask(r, cells){
  const indices = f => cells.map((c,i)=>f(c)?i:-1).filter(i=>i>=0);
  if(r.vk==="double"){
    return { steps: r.groups.map((g,n)=>({ text:`Passaggio ${n+1} di 2: tocca ${g.label}.`, set:indices(g.f) })) };
  }
  return { steps: [{ text: griglieTouchText(r.text), set: indices(r.matches) }] };
}

// Dati per il lettore: le celle disegnate come a schermo (stesse forme e colori) e le consegne.
function griglieTouchData(deck, level){
  const esc = t => String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");
  return deck.slides.map(s=>({
    rows: s.rows, cols: s.cols,
    cells: s.cells.map(c=>{
      const ink = colorHex(c.symColor) || "#101010";
      const svg = gridShapeSvg(c.sym, ink);
      return {
        h: svg || esc(c.sym), svg: !!svg,
        bg: colorHex(c.fill) || "#FFFFFF", bd: colorHex(c.border) || "#000000",
        bs: ({continuo:"solid", tratteggiato:"dashed", puntinato:"dotted"})[c.bStyle] || "solid",
        ink, k: c.size==="piccolo" ? 0.42 : 1
      };
    }),
    tasks: griglieTouchRules(s, level).map(r=>griglieTouchTask(r, s.cells))
  }));
}

function griglieBuildPlayerHtml(deck, level){
  const data = JSON.stringify(griglieTouchData(deck, level)).replace(/</g, "\\u003c");
  return touchPlayerPage({
    title: `Griglie — livello ${level}`,
    intro: "Tocca <b>tutte</b> le celle richieste, poi premi <b>Conferma</b>.<br>Se tocchi di nuovo una cella la togli.",
    css: `#play{position:fixed;left:8px;right:8px;top:44px;bottom:8px;display:flex;flex-direction:column;gap:8px}
#task{flex:none;text-align:center;font-size:clamp(18px,3.2vh,30px);font-weight:700;line-height:1.25;padding:2px 6px}
#area{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
#grid{display:grid}
.s{position:relative;display:flex;align-items:center;justify-content:center;border:3px solid transparent;border-radius:10px;box-sizing:border-box;cursor:pointer}
.o{display:flex;align-items:center;justify-content:center;border-radius:50%;box-sizing:border-box;font-weight:800;line-height:1}
.o svg{width:1.5em;height:1.5em}
.b{position:absolute;right:-2px;top:-2px;display:none;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:700;line-height:1;z-index:2}
.s.sel{border-color:#1e2a26;background:#cfd8d4}
.s.sel .b,.s.err .b,.s.found .b,.s.missed .b,.s.wrong .b{display:flex}
.s.sel .b{background:#1e2a26}
.s.err{border:3px dashed #7d8782;background:#eceeed;cursor:default}
.s.err .o{opacity:.4}
.s.err .b{background:#6b746f}
.s.found{border-color:#1d7a45;background:#bfe8cd}
.s.found .b{background:#1d7a45}
.s.missed{border:3px dashed #b35c00;background:#ffe2bd}
.s.missed .b{background:#b35c00}
.s.wrong{border-color:#a3001c;background:#f6c9d0}
.s.wrong .b{background:#a3001c}
.s.dim .o{opacity:.3}
.done .s{cursor:default}
#bar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px}
#fb{flex:1;font-size:clamp(16px,2.6vh,24px);line-height:1.3}
#ok{flex:none;font:inherit;font-size:clamp(20px,3vh,28px);min-width:180px;min-height:60px;padding:8px 24px;border:0;border-radius:12px;background:#4f7a68;color:#fff;cursor:pointer}
#ok:disabled{background:#c9d1cd;cursor:default}`,
    body: `<div id="play"><div id="task"></div><div id="area"><div id="grid"></div></div><div id="bar"><div id="fb" aria-live="polite"></div><button id="ok" type="button">Conferma</button></div></div>`,
    script: `var SL=${data};
var TASKS=[]; SL.forEach(function(s,g){ s.tasks.forEach(function(t){ TASKS.push({g:g, steps:t.steps}); }); });
var grid=document.getElementById("grid"), area=document.getElementById("area"), taskEl=document.getElementById("task"), fb=document.getElementById("fb"), okBtn=document.getElementById("ok"), play=document.getElementById("play");
var ti=0, si=0, attempt=1, sel=[], flagged=[], phase="answer", tS=0, res=[], stepRes=[], stats=null, locked=false;
function step(){ return TASKS[ti].steps[si]; }
function has(a,k){ return a.indexOf(k)>=0; }

// celle quadrate, della misura più grande che sta nello spazio disponibile
function build(){
  var s=SL[TASKS[ti].g];
  taskEl.textContent=step().text;
  grid.innerHTML="";
  var gap=4, W=area.clientWidth, H=area.clientHeight;
  var T=Math.floor(Math.min((W-gap*(s.cols-1))/s.cols, (H-gap*(s.rows-1))/s.rows));
  var D=Math.max(16, T-12);
  grid.style.gap=gap+"px";
  grid.style.gridTemplateColumns="repeat("+s.cols+","+T+"px)";
  grid.style.gridAutoRows=T+"px";
  s.cells.forEach(function(c,k){
    var d=document.createElement("div"); d.className="s"; d.setAttribute("data-k",k);
    var o=document.createElement("div"); o.className="o";
    o.style.cssText="width:"+D+"px;height:"+D+"px;background:"+c.bg+";color:"+c.ink+";border:"+Math.max(3,Math.round(D*0.07))+"px "+c.bs+" "+c.bd;
    var g=document.createElement("span"); g.style.display="block"; g.style.fontSize=Math.round(D*(c.svg?0.42:0.56)*c.k)+"px"; g.innerHTML=c.h;
    o.appendChild(g); d.appendChild(o);
    var b=document.createElement("span"); b.className="b"; var bz=Math.max(14,Math.round(T*0.28)); b.style.cssText="width:"+bz+"px;height:"+bz+"px;font-size:"+Math.round(bz*0.72)+"px";
    d.appendChild(b); grid.appendChild(d);
  });
  paint();
}
function paint(){
  var set=step().set, over=phase==="solved"||phase==="shown";
  play.classList.toggle("done", over);
  [].forEach.call(grid.children,function(d){
    var k=+d.getAttribute("data-k"), cls="s", mark="";
    if(over){
      if(has(set,k)&&has(sel,k)){ cls+=" found"; mark="✓"; }
      else if(has(set,k)){ cls+=" missed"; mark="!"; }
      else if(has(sel,k)||has(flagged,k)){ cls+=" wrong"; mark="✕"; }
      else cls+=" dim";
    } else if(has(flagged,k)){ cls+=" err"; mark="✕"; }
    else if(has(sel,k)){ cls+=" sel"; mark="✓"; }
    d.className=cls; d.lastChild.textContent=mark;
    d.setAttribute("aria-pressed", has(sel,k)?"true":"false");
  });
  prog.textContent="Consegna "+(ti+1)+" di "+TASKS.length;
  okBtn.textContent = over ? "Avanti" : "Conferma";
  okBtn.disabled = !over && sel.length===0;
}
function newStep(){ attempt=1; sel=[]; flagged=[]; phase="answer"; fb.textContent=""; build(); }
function begin(){ ti=0; si=0; res=[]; stepRes=[]; stats=[{om:0,fp:0,n:0},{om:0,fp:0,n:0}]; tS=Date.now(); newStep(); }
function confirmAnswer(){
  var set=step().set;
  var extra=sel.filter(function(k){ return !has(set,k); });
  var miss=set.filter(function(k){ return !has(sel,k); });
  var st=stats[attempt-1]; st.n++; st.om+=miss.length; st.fp+=extra.length;
  if(!extra.length&&!miss.length){
    phase="solved"; stepRes.push(attempt); fb.textContent="Giusto!";
  } else if(attempt===1){
    attempt=2; flagged=extra; sel=sel.filter(function(k){ return has(set,k); });
    var m=[];
    if(extra.length) m.push("Quelle con ✕ non vanno bene.");
    if(miss.length) m.push("Ne manca qualcuna.");
    m.push("Riprova e premi Conferma.");
    fb.textContent=m.join(" ");
  } else {
    phase="shown"; stepRes.push(0);
    fb.textContent="Ecco la soluzione:  ✓ trovate"+(miss.length?"   ! dimenticate":"")+((extra.length||flagged.length)?"   ✕ sbagliate":"");
  }
  paint();
}
function advance(){
  if(si+1<TASKS[ti].steps.length){ si++; return newStep(); }
  res.push(stepRes.indexOf(0)>=0 ? 0 : Math.max.apply(null,stepRes));
  stepRes=[]; si=0; ti++;
  if(ti>=TASKS.length) return finish();
  newStep();
}
function finish(){
  var n=function(v){ return res.filter(function(r){ return r===v; }).length; };
  var pct=Math.round(100*n(1)/TASKS.length);
  grid.innerHTML=""; taskEl.textContent=""; fb.textContent="";
  showEnd([
    ["Risolte al primo tentativo", n(1)+" / "+TASKS.length+" ("+pct+"%)"],
    ["Risolte al secondo tentativo", n(2)],
    ["Non risolte", n(0)],
    ["1° tentativo: omissioni", stats[0].om],
    ["1° tentativo: falsi positivi", stats[0].fp],
    ["2° tentativo: omissioni", stats[1].om],
    ["2° tentativo: falsi positivi", stats[1].fp],
    ["Tempo", clock(Date.now()-tS)]
  ], "Livello ${level}. Il riepilogo resta solo su questo schermo.", begin);
}
grid.addEventListener("click",function(ev){
  if(!started||phase!=="answer") return;
  var d=ev.target.closest&&ev.target.closest(".s"); if(!d) return;
  var k=+d.getAttribute("data-k"); if(has(flagged,k)) return;
  var p=sel.indexOf(k); if(p>=0) sel.splice(p,1); else sel.push(k);
  paint();
});
// breve pausa dopo ogni pressione: un doppio tocco sul pulsante non deve confermare e saltare avanti insieme
okBtn.addEventListener("click",function(){
  if(locked||okBtn.disabled) return;
  locked=true; setTimeout(function(){ locked=false; },450);
  if(phase==="answer") confirmAnswer(); else advance();
});
onStart(begin);
onRedraw(build);`
  });
}

function griglieOpenPlayer(){
  if(!state.deck || state.deck.type!=="griglie") return;
  touchPlayerOpen(griglieBuildPlayerHtml(state.deck, state.level));
}
function griglieDownloadPlayer(){
  if(!state.deck || state.deck.type!=="griglie") return;
  touchPlayerDownload(griglieBuildPlayerHtml(state.deck, state.level), "griglie", state.level);
}
