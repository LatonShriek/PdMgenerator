// Motore di categorizzazione: campionamento dei criteri e recupero dei pittogrammi OpenMoji.
// Spostato da index.html al passo 8 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   CATEGORIZZAZIONE — motore di campionamento + fetch pittogrammi OpenMoji
   ========================================================= */
/* ============================================================================
   CATEGORIZZAZIONE v2 — pool di item per criterio (non più 1 coppia fissa per
   livello) + pittogrammi OpenMoji (CC BY-SA 4.0), con fallback testuale se il
   termine non ha un'icona affidabile o la rete non risponde, così la
   schermata non si rompe mai. Pixabay e Openverse sono stati tolti su
   richiesta di Rodrigo (foto reali non più adatte/disponibili).
   ============================================================================ */

// Sorgente immagini: OpenMoji (CC BY-SA 4.0) al posto di Pixabay/Openverse —
// pittogrammi disegnati invece di foto reali, sempre disponibili senza chiave
// API. OPENMOJI_ICON_MAP associa ogni termine inglese già usato nella libreria
// (campo "en" di ogni item) al nome-icona OpenMoji corrispondente, quando ne
// esiste uno affidabile: la mappa è stata verificata offline contro l'intero
// set OpenMoji (4579 pittogrammi), non generata a runtime per tentativi — un
// termine assente da questa mappa (~59% della libreria: molti termini sono
// troppo astratti o specifici per un pittogramma, es. "air compressor",
// "antique dresser") va dritto al fallback testuale invece di tentare un
// abbinamento indovinato che rischierebbe di mostrare l'icona sbagliata.
// Attribuzione richiesta dalla licenza CC BY-SA 4.0: va citata una sola volta
// nel fascicolo/deck esportato (vedi README), non su ogni slide.
// OPENMOJI_ICON_MAP: dati in data/openmoji-map.js (caricato prima di questo script).

// Cache in-memoria (per sessione) delle immagini già risolte, per non rifare la
// stessa richiesta due volte nella stessa sessione di lavoro.
const _imgCache = new Map();

async function fetchCategorizationImage(enQuery) {
  if (_imgCache.has(enQuery)) return _imgCache.get(enQuery);
  const iconName = OPENMOJI_ICON_MAP[enQuery];
  if (!iconName) { _imgCache.set(enQuery, null); return null; }
  try {
    const png = await svgToPngDataUrl(`https://api.iconify.design/openmoji/${iconName}.svg`);
    const info = { src: png, credit: "OpenMoji", source: "OpenMoji", foreignUrl: "https://openmoji.org" };
    _imgCache.set(enQuery, info);
    return info;
  } catch (e) {
    _imgCache.set(enQuery, null); // rete assente, CORS, icona non trovata: fallback testuale, mai un errore visibile
    return null;
  }
}

// Le icone OpenMoji sono servite come SVG dalla API pubblica Iconify (nessuna
// chiave richiesta). Le rasterizziamo in PNG via canvas, sia per la preview a
// schermo sia perché l'esportazione PowerPoint (pptxgenjs) richiede un
// raster, non un SVG grezzo, in addImage().
function svgToPngDataUrl(svgUrl, size = 256) {
  return fetch(svgUrl).then(res => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.text();
  }).then(svgText => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("icona non renderizzabile"));
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgText)));
  }));
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sampleN(arr, n) {
  return shuffleArr(arr).slice(0, n);
}

// Campiona una prova NUOVA (criterio + 3+3 item) dal pool del livello. Se il
// livello ha più criteri disponibili, ne sceglie uno a caso ogni volta — così
// anche a parità di livello il materiale non è mai lo stesso su generazioni
// successive, pur restando dentro alla stessa libreria di criteri verificati.
function sampleCategorizzazioneTrial(level) {
  const pool = CATEGORIZZAZIONE_LIBRARY[String(level)] || CATEGORIZZAZIONE_LIBRARY[level];
  const entry = pool[Math.floor(Math.random() * pool.length)];
  const chosenA = sampleN(entry.a, Math.min(3, entry.a.length));
  const chosenB = sampleN(entry.b, Math.min(3, entry.b.length));
  const tagged = shuffleArr([
    ...chosenA.map(it => ({ ...it, group: "A" })),
    ...chosenB.map(it => ({ ...it, group: "B" })),
  ]);
  const label = entry.proposal ? `${entry.label}  (proposta — da verificare)` : entry.label;
  return { label, items: tagged, proposal: !!entry.proposal };
}

// Genera N prove per una sessione (default 9, come negli originali). Pesca SENZA
// ripetizione dal pool del livello finche' non lo esaurisce (fondamentale: prima
// c'era solo un controllo "non uguale alla precedente", che lasciava passare lo
// stesso criterio piu' volte non consecutive nella stessa sessione — bug reale
// segnalato da Rodrigo). Solo se il pool e' piu' piccolo di nTrials si ricomincia
// un secondo giro, di nuovo mescolato.
function genCategorizzazioneV2(level, nTrials, excludeLabels) {
  nTrials = nTrials || 9;
  // La libreria di Rodrigo ha 16 fasce di difficoltà (142 criteri verificati). Con 32 livelli le fasce
  // vengono MESCOLATE gradualmente: il livello 1 usa solo la fascia 1, il 32 solo la 16, e ogni livello
  // intermedio pesca ciascuna prova dalla fascia sotto o sopra in proporzione alla sua posizione.
  const q = 1 + levelT(level)*15, lo = Math.floor(q), hi = Math.min(16, lo+1), frac = q - lo;
  const libFor = k => CATEGORIZZAZIONE_LIBRARY[String(k)] || [];
  const excl = excludeLabels ? new Set(excludeLabels) : new Set();
  const usedNow = new Set();
  const chosenEntries = [];
  for(let i=0; i<nTrials; i++){
    const primary = (Math.random() < frac) ? hi : lo;
    const secondary = primary === lo ? hi : lo;
    const P = libFor(primary), S = libFor(secondary);
    // preferenza: fascia scelta, criterio nuovo per il gruppo e non già in sessione → poi l'altra fascia
    // adiacente → poi criteri visti in passato ma non in questa sessione → infine anche ripetizioni
    const tiers = [
      P.filter(e=>!excl.has(e.label) && !usedNow.has(e.label)),
      S.filter(e=>!excl.has(e.label) && !usedNow.has(e.label)),
      P.filter(e=>!usedNow.has(e.label)),
      S.filter(e=>!usedNow.has(e.label)),
      P.length ? P : S
    ];
    const cand = tiers.find(t=>t.length) || [];
    if(!cand.length) break;
    const entry = cand[Math.floor(Math.random()*cand.length)];
    usedNow.add(entry.label);
    chosenEntries.push(entry);
  }
  const trials = chosenEntries.map(entry => {
    const chosenA = sampleN(entry.a, Math.min(3, entry.a.length));
    const chosenB = sampleN(entry.b, Math.min(3, entry.b.length));
    const tagged = shuffleArr([
      ...chosenA.map(it => ({ ...it, group: "A" })),
      ...chosenB.map(it => ({ ...it, group: "B" })),
    ]);
    const label = entry.proposal ? `${entry.label}  (proposta — da verificare)` : entry.label;
    return { label, rawLabel: entry.label, items: tagged, proposal: !!entry.proposal };
  });
  return { type: "categorizzazione", level, slides: trials, rule: "Dividi le 6 immagini in due gruppi da 3, in base a un criterio comune." };
}

// Risolve le immagini reali per una prova (chiamato al momento del rendering,
// non della generazione, così la UI può mostrare subito i segnaposto e
// aggiornarli non appena le foto arrivano).
async function resolveTrialImages(trial) {
  const resolved = await Promise.all(trial.items.map(async it => {
    const img = await fetchCategorizationImage(it.en);
    return { ...it, image: img };
  }));
  return { ...trial, items: resolved };
}

