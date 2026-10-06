// Renderer (disegna il materiale a schermo) — Categorizzazione.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici).

function renderCatTileContent(tile, it){
  tile.innerHTML = "";
  if(it.image && it.image.src){
    const img = document.createElement("img");
    img.src = it.image.src;
    img.alt = it.it;
    img.className = "cat-tile-img";
    img.onerror = () => { renderCatTileFallback(tile, it); };
    tile.appendChild(img);
  } else {
    renderCatTileFallback(tile, it);
  }
}

function renderCatTileFallback(tile, it){
  tile.innerHTML = "";
  const label = document.createElement("div");
  label.className = "cat-tile-label";
  label.textContent = it.it;
  tile.appendChild(label);
}

function renderOneCatSlide(deck, s, idx){
  const block = document.createElement("div");
  block.className = "multi-block";
  const h = document.createElement("div");
  h.className = "multi-block-head";
  h.innerHTML = `<b>Prova ${idx+1}/${deck.slides.length}</b> — Criterio: ${s.label}`;
  block.appendChild(h);
  const wrap = document.createElement("div");
  wrap.className = "cat-grid";
  const tiles = s.items.map(it=>{
    const tile = document.createElement("div");
    tile.className = "cat-tile";
    if(state.reveal){
      tile.style.outline = "3px solid " + (it.group==="A" ? "#2F6F63" : "#A6503A");
      tile.style.background = it.group==="A" ? "#E7F1EE" : "#F6E9E4";
    }
    renderCatTileContent(tile, it);
    wrap.appendChild(tile);
    return tile;
  });
  block.appendChild(wrap);
  // Risolve i pittogrammi OpenMoji in background (una sola volta per prova):
  // la griglia si aggiorna man mano che arrivano, senza bloccare la schermata.
  // Se una richiesta fallisce (rete assente, CORS, rate limit) resta l'etichetta
  // testuale — non è mai un errore visibile.
  if(!s._imagesResolved){
    s._imagesResolved = true;
    s.items.forEach(async (it, i)=>{
      const img = await fetchCategorizationImage(it.en);
      it.image = img;
      if(state.exercise==="categorizzazione" && state.deck===deck){
        renderCatTileContent(tiles[i], it);
        if(state.reveal){
          tiles[i].style.outline = "3px solid " + (it.group==="A" ? "#2F6F63" : "#A6503A");
          tiles[i].style.background = it.group==="A" ? "#E7F1EE" : "#F6E9E4";
        }
      }
    });
  }
  return block;
}

function renderCategorizzazione(deck){
  const wrap = document.createElement("div");
  deck.slides.forEach((s,i)=> wrap.appendChild(renderOneCatSlide(deck, s, i)));
  return wrap;
}
