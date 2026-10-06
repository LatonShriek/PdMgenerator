// Renderer (disegna il materiale a schermo) — Intruso percettivo (comprende le funzioni di impaginazione bestGridCols, bestGridScore, intrusoGridFriendly, niceIntrusoCount, intrusoFramed, usate anche dal generatore e dall'esportazione).
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function bestGridCols(n, areaW, areaH){
  // Stessa logica di dimensionamento usata nell'export PowerPoint: cerca, tra i SOLI numeri
  // di colonne che dividono n esattamente, quello che rende le celle più vicine possibile al
  // quadrato — così a schermo e nel file esportato l'ultima riga è sempre piena quanto le
  // altre (mai righe a metà, segnalato da Rodrigo), non solo "il più vicino al quadrato"
  // anche a costo di una riga incompleta come prima.
  let cols = 1, bestMinSide = -1;
  for(let c=1; c<=n; c++){
    if(n % c !== 0) continue;
    const r = n / c;
    const minSide = Math.min(areaW/c, areaH/r);
    if(minSide > bestMinSide){ bestMinSide = minSide; cols = c; }
  }
  return cols;
}

// Qualità (lato minimo della cella) della migliore disposizione a griglia PIENA per n elementi
// nell'area indicata — usata solo per scegliere, in fase di generazione, un n vicino a quello
// ideale del livello ma che si presti bene a una griglia piena (vedi niceIntrusoCount).
function bestGridScore(n, areaW, areaH){
  const cols = bestGridCols(n, areaW, areaH);
  const rows = n / cols;
  return Math.min(areaW/cols, areaH/rows);
}

// Il numero di elementi "ideale" per livello (targetNForLevelIntruso) a volte cade su un valore
// scomodo da disporre in griglia piena (es. un numero primo, o quasi): una sola colonna o una
// sola riga lunghissima. Si cerca invece, entro poche unità di distanza, il numero più vicino
// che permette una griglia piena ragionevolmente quadrata — la difficoltà del livello non
// cambia per una differenza di 1-2 elementi, ma l'impaginazione sì.
// Numeri "comodi": disponibili in griglia PIENA con 3-6 righe e 3-10 colonne (15, 16, 18, 20, 21, 24, 25, 27, 28, 30).
function intrusoGridFriendly(c){
  for(let r=3; r<=6; r++) if(c % r === 0 && c/r >= 3 && c/r <= 10) return true;
  return false;
}

function niceIntrusoCount(n, areaW, areaH, maxN){
  maxN = maxN==null ? Infinity : maxN;
  // il più vicino (entro 2) tra i numeri comodi: cambia di poco la difficoltà ma lascia sempre una griglia piena e regolare
  let best = null, bestD = Infinity;
  for(let d=0; d<=2; d++){
    for(const cand of (d===0 ? [n] : [n-d, n+d])){
      if(cand < 4 || cand > maxN || !intrusoGridFriendly(cand)) continue;
      if(d < bestD){ best = cand; bestD = d; }
    }
    if(best!=null) break;
  }
  if(best!=null) return best;
  let fb = Math.min(n, maxN), bestScore = -1;
  for(let d=0; d<=4; d++){
    for(const cand of (d===0 ? [n] : [n-d, n+d])){
      if(cand < 4 || cand > maxN) continue;
      const score = bestGridScore(cand, areaW, areaH);
      if(score > bestScore){ bestScore = score; fb = cand; }
    }
  }
  return fb;
}

// Elementi di 2-3 glifi di una famiglia a simboli (zodiaco, semi, dadi, forme…): ogni elemento è racchiuso in una
// cornice sottile, così si legge come UNITÀ anche quando i glifi sono larghi e lo spazio dentro l'elemento e quello tra
// un elemento e l'altro sembrano uguali (segnalato da Rodrigo sullo zodiaco: «non si capisce che sono coppie»).
// Le famiglie testuali (cifre, lettere…) restano senza cornice: lì la sequenza è già una parola.
function intrusoFramed(familyId, itemLen){
  return itemLen>=2 && INTRUSO_ATOMIC_FAMILIES.some(f=>f.id===familyId);
}

function renderIntruso(deck){
  const wrap = document.createElement("div");
  deck.slides.forEach((s,i)=>{
    const block = document.createElement("div");
    block.className = "multi-block";
    const h = document.createElement("div");
    h.className = "multi-block-head";
    h.innerHTML = `<b>Schermata ${i+1}/${deck.slides.length}</b> (${s.familyLabel}) — ${s.rule}` + (state.reveal ? ` <span class="answer-inline">${s.answer}</span>` : "");
    block.appendChild(h);
    const strip = document.createElement("div");
    strip.className = "strip";
    const cols = bestGridCols(s.items.length, 1333, 500); // stesso rapporto larghezza/altezza dell'export
    strip.style.gridTemplateColumns = `repeat(${cols}, minmax(0,1fr))`;
    const useInkFit = INTRUSO_INK_FIT.has(s.familyId);
    if(useInkFit){
      // come nella slide: area con lo stesso rapporto e righe di pari altezza, così la cella è grande
      strip.style.aspectRatio = "1333 / 500";
      strip.style.gridTemplateRows = `repeat(${Math.ceil(s.items.length/cols)}, minmax(0,1fr))`;
    }
    s.items.forEach((it,ci)=>{
      const div = document.createElement("div");
      div.className = "cell" + (state.reveal && ci===s.oddIndex ? " answer":"");
      div.style.borderColor = "#D9DFD9";
      div.style.background = "#fff";
      if(intrusoFramed(s.familyId, [...String(it)].length)){
        const fr = document.createElement("span");
        fr.textContent = it;
        fr.style.cssText = "display:inline-block;border:1.5px solid #8A948E;border-radius:.3em;padding:.04em .28em;line-height:1.25";
        div.appendChild(fr);
      } else div.textContent = it;
      strip.appendChild(div);
    });
    block.appendChild(strip);
    wrap.appendChild(block);
    if(useInkFit){
      // dopo l'impaginazione: corpo del carattere calcolato sull'ingombro reale del glifo
      setTimeout(()=>{
        const first = strip.firstElementChild;
        if(!first) return;
        const rect = first.getBoundingClientRect();
        const fam = getComputedStyle(first).fontFamily;
        const gl = Math.max(1, ...s.items.map(it=>[...String(it)].length));
        const cw = INTRUSO_GROUP_CHAR_WIDTH[s.familyId] || INTRUSO_FAMILY_CHAR_WIDTH[s.familyId] || INTRUSO_DEFAULT_ATOMIC_CHAR_WIDTH;
        // coppie/terne: occupano solo il 62% / 74% della cella, per lasciare uno spazio chiaro tra un elemento e l'altro
        const px = gl===1 ? fitInkFontSize(s.items, rect.width - 8, rect.height - 8, fam, INTRUSO_FILL)
                          : Math.min(rect.width*(gl>=3 ? 0.74 : 0.62)/gl/cw, (rect.height-8)*0.7);
        if(px) [...strip.children].forEach(cell=>{ cell.style.fontSize = Math.floor(px) + "px"; cell.style.padding = "0"; });
      }, 0);
    }
  });
  return wrap;
}
