// Motore del Fascicolo (engine.js): logica pura senza DOM, dal passo 8 in un file proprio.
// Spostato da index.html al passo 8 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   FASCICOLO ESERCIZI A CASA — motore di generazione (engine.js)
   ========================================================= */
// ============================================================================
// FASCICOLO ESERCIZI A CASA — motore di generazione
// Logica pura (nessun DOM), testabile in Node prima di essere integrata
// nella pagina HTML con rendering e export .docx.
// ============================================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {

// ---------------------------------------------------------------------------
// 1. FAMIGLIE DI SIMBOLI per le griglie "cerchiare e contare"
//    Ordinate per "rarità/opacità lessicale" crescente: cifre e lettere latine
//    sono le più automatizzate (massimo supporto lessicale residuo), a seguire
//    alfabeti sempre meno familiari, fino a scritture del tutto prive di
//    supporto semantico per un parlante italiano.
// ---------------------------------------------------------------------------
const SYMBOL_FAMILIES = {
  digits:      { label: 'cifre',              tier: 1, chars: '0123456789'.split('') },
  latin:       { label: 'lettere latine',      tier: 1, chars: 'ABCDEFGHIL'.split('') },
  cyrillic:    { label: 'lettere cirilliche',   tier: 2, chars: ['Б','Г','Д','Ж','З','И','Л','П','Ц','Щ'] },
  shapes:      { label: 'forme geometriche',   tier: 2, chars: ['○','□','●','■','╳','┃'] },
  linesMixed:  { label: 'segmenti/direzioni',  tier: 3, chars: ['╾','╱','╲','╇','■','╳'] },
  arrows:      { label: 'frecce',              tier: 3, chars: ['↗','↔','↖','↙','↓','↕','↘','→','↑','←'] },
  mathSymbols: { label: 'simboli matematici',  tier: 4, chars: ['⋁','⋃','⊃','⋂','⊂','⋀','<','>'] },
  runes:       { label: 'rune (Futhark)',      tier: 5, chars: ['ᚠ','ᚢ','ᚩ','ᚴ','ᚹ','ᚱ','ᚲ','ᚷ','ᚺ','ᚾ'] },
  syllabics:   { label: 'sillabario Inuktitut', tier: 6, chars: ['ᐳ','ᐸ','ᑎ','ᑐ','ᑕ','ᓇ','ᓂ','ᓄ','ᓀ','ᕙ','ᕚ','ᕜ','ᕝ','ᕛ','ᓃ','ᓁ','ᓅ'] },
};

// Combinazione "mista" (eterogenea) usata dalla 3a griglia dalla settimana 3
// in poi, e via via anche dalle altre: toglie il supporto del "colpo d'occhio"
// di una famiglia omogenea, perché il bersaglio unisce simboli di famiglie
// visivamente diverse.
function mixedAlphabet(...familyKeys) {
  return familyKeys.flatMap(k => SYMBOL_FAMILIES[k].chars);
}

// Ordine dei "profili" settimanali per le griglie di ricerca-sequenza.
// Ogni voce descrive, per quella settimana, le famiglie usate nei 2-3 slot
// di conteggio singolo. Dalla settimana 6 gli slot passano da 3 a 2 (gli
// alfabeti sono più radi/opachi e compensano la riduzione del numero di griglie).
const GRID_WEEK_PROFILES = [
  null, // indice 0 non usato (settimane 1-based)
  { slots: ['digits', 'latin', 'cyrillic'] },
  { slots: ['shapes', 'latin', 'cyrillic'] },
  { slots: ['linesMixed', 'arrows', 'mathSymbols'] },
  { slots: ['shapes', 'arrows', 'mathSymbols'] },
  { slots: [mixKey('latinDigitMix', 'latin', 'digits'), 'arrows', mixKey('cyrMathMix', 'cyrillic', 'mathSymbols')] },
  { slots: ['runes', 'syllabics'] },
  { slots: [mixKey('lineCyrMix', 'linesMixed', 'cyrillic'), mixKey('shapeLatinMix', 'shapes', 'latin')] },
  { slots: ['syllabics', mixKey('shapeLineMix', 'shapes', 'linesMixed')] },
];

// Registro dinamico delle famiglie "miste" create al volo da mixKey(), così
// GRID_WEEK_PROFILES può referenziarle come fossero famiglie vere e proprie.
function mixKey(name, ...familyKeys) {
  if (!SYMBOL_FAMILIES[name]) {
    const tier = Math.max(...familyKeys.map(k => SYMBOL_FAMILIES[k].tier)) + 1;
    SYMBOL_FAMILIES[name] = { label: `misto (${familyKeys.map(k => SYMBOL_FAMILIES[k].label).join(' + ')})`, tier, chars: mixedAlphabet(...familyKeys) };
  }
  return name;
}

// Oltre la settimana 8: continuiamo a variare procedendo per combinazioni
// sempre più eterogenee di 2-3 famiglie tra quelle di tier più alto, senza
// mai ripetere l'identica combinazione della settimana precedente.
// Famiglie "atomiche" (non già miste) di tier alto, da cui pescare le
// combinazioni per le settimane oltre l'8ª — evita nidificazioni tipo
// "misto (misto (misto (...)))" che diventerebbero illeggibili in stampa.
const BASE_HARD_FAMILY_KEYS = ['linesMixed', 'arrows', 'mathSymbols', 'runes', 'syllabics', 'shapes', 'cyrillic'];

function gridProfileForWeek(week) {
  if (week < GRID_WEEK_PROFILES.length) return GRID_WEEK_PROFILES[week];
  const rnd = mulberry32(week * 7919);
  const nSlots = 2;
  const slots = [];
  const usedPairs = new Set();
  for (let i = 0; i < nSlots; i++) {
    let a, b, pairKey;
    do {
      a = pick(rnd, BASE_HARD_FAMILY_KEYS);
      b = pick(rnd, BASE_HARD_FAMILY_KEYS);
      pairKey = [a, b].sort().join('+');
    } while (a === b || usedPairs.has(pairKey));
    usedPairs.add(pairKey);
    slots.push(mixKey(`w${week}mix${i}_${a}_${b}`, a, b));
  }
  return { slots };
}

// ---------------------------------------------------------------------------
// RNG seedabile (per riproducibilità nei test; nell'app si userà un seed
// casuale ogni volta che si preme "Genera nuovo fascicolo").
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
function pickN(rnd, arr, n) {
  const pool = arr.slice();
  const out = [];
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. GRIGLIA "cerchiare e contare tutte le sequenze [X]" — bersaglio singolo
// ---------------------------------------------------------------------------
function plantOnce(grid, rows, cols, seqLen, target, rnd) {
  const horizontal = rnd() < 0.5;
  if (horizontal) {
    const r = Math.floor(rnd() * rows);
    const c = Math.floor(rnd() * (cols - seqLen + 1));
    for (let i = 0; i < seqLen; i++) grid[r][c + i] = target[i];
  } else {
    const c = Math.floor(rnd() * cols);
    const r = Math.floor(rnd() * (rows - seqLen + 1));
    for (let i = 0; i < seqLen; i++) grid[r + i][c] = target[i];
  }
}

function countDirectionalOccurrences(grid, target) {
  const rows = grid.length, cols = grid[0].length, len = target.length;
  let h = 0, v = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - len; c++) {
      if (matchSeq(grid[r], c, target)) h++;
    }
  }
  for (let c = 0; c < cols; c++) {
    const col = grid.map(row => row[c]);
    for (let r = 0; r <= rows - len; r++) {
      if (matchSeq(col, r, target)) v++;
    }
  }
  return { h, v };
}

// Trova TUTTE le posizioni in cui `target` compare in `grid`, lungo le direzioni date —
// usata per far vedere al foglio delle soluzioni ESATTAMENTE dove sono le occorrenze
// (non solo quante sono). Ogni direzione è un vettore [dr, dc]; per avere anche il verso
// invertito basta includere il vettore opposto nell'elenco (es. [0,1] e [0,-1]).
function findSequencePositions(grid, target, directions) {
  const rows = grid.length, cols = grid[0].length, len = target.length;
  const matches = [];
  for (const [dr, dc] of directions) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const rEnd = r + dr * (len - 1), cEnd = c + dc * (len - 1);
        if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;
        let ok = true;
        for (let k = 0; k < len; k++) {
          if (grid[r + dr * k][c + dc * k] !== target[k]) { ok = false; break; }
        }
        if (ok) matches.push(Array.from({ length: len }, (_, k) => [r + dr * k, c + dc * k]));
      }
    }
  }
  return matches;
}
// Stessi assi usati dai rispettivi contatori: le prime 3 griglie sono solo orizzontale
// (sinistra→destra) e verticale (alto→basso), la griglia mista aggiunge le due diagonali
// discendenti — nessuna delle due include il verso invertito (vedi countDirectionalOccurrences
// e countAllDirections qui sopra/sotto).
const DIR_HV = [[0, 1], [1, 0]];
const DIR_HV_DIAG = [[0, 1], [1, 0], [1, 1], [1, -1]];

// Genera una griglia in cui il bersaglio compare ESATTAMENTE 8 volte in
// orizzontale e 8 in verticale (16 in totale) — non "almeno", un numero
// fisso e verificato, così la difficoltà è la stessa ad ogni generazione e
// ad ogni settimana. Si pianta direttamente nelle direzioni giuste (non a
// caso) e, se il rumore di fondo introduce occorrenze accidentali in più o
// in meno, si rigenera l'intera griglia da capo (fino a 60 tentativi) invece
// di accontentarsi di un conteggio approssimato.
function generateSequenceGrid(rows, cols, alphabet, rnd, opts = {}) {
  const seqLen = opts.seqLen || 4;
  const target = opts.target || pickN(rnd, alphabet, seqLen);
  const hTarget = opts.hTarget || 8;
  const vTarget = opts.vTarget || 8;
  const distractorCount = opts.distractorCount || 0;

  function nearMissVariant() {
    const variant = target.slice();
    const pos = Math.floor(rnd() * variant.length);
    let ch;
    do { ch = pick(rnd, alphabet); } while (ch === variant[pos]);
    variant[pos] = ch;
    return variant;
  }

  // Piazzamento GREEDY senza sovrapposizioni (non più "a caso e poi riconta e
  // rigenera se non torna"): con sequenze lunghe (5-6 caratteri) su una griglia
  // stretta (12 colonne) il piazzamento casuale collideva così spesso che anche
  // 400 tentativi non bastavano a raggiungere per caso 8+8 esatti — bug trovato
  // testando seqLen 5-6, non presente con la lunghezza 4 originale. Ora si
  // scelgono posizioni libere una alla volta, marcando le celle occupate, così
  // il conteggio finale è sempre esatto al primo colpo.
  function place(rows, cols, seqLen, horizontal, need, occupied, chars, rnd) {
    const candidates = [];
    if (horizontal) for (let r = 0; r < rows; r++) for (let c = 0; c <= cols - seqLen; c++) candidates.push([r, c]);
    else for (let c = 0; c < cols; c++) for (let r = 0; r <= rows - seqLen; r++) candidates.push([r, c]);
    shuffleInPlaceArr(rnd, candidates);
    let placed = 0;
    for (const [r, c] of candidates) {
      if (placed >= need) break;
      const cells = [];
      let free = true;
      for (let k = 0; k < seqLen; k++) {
        const rr = horizontal ? r : r + k, cc = horizontal ? c + k : c;
        const key = rr + ',' + cc;
        if (occupied.has(key)) { free = false; break; }
        cells.push([rr, cc, key]);
      }
      if (!free) continue;
      cells.forEach(([rr, cc, key], k) => { grid[rr][cc] = chars(k); occupied.add(key); });
      placed++;
    }
    return placed;
  }

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => pick(rnd, alphabet)));
  const occupied = new Set();
  const placedH = place(rows, cols, seqLen, true, hTarget, occupied, k => target[k], rnd);
  const placedV = place(rows, cols, seqLen, false, vTarget, occupied, k => target[k], rnd);
  for (let i = 0; i < distractorCount; i++) {
    const variant = nearMissVariant();
    place(rows, cols, seqLen, i % 2 === 0, 1, occupied, k => variant[k], rnd);
  }

  // Il rumore di fondo (celle non occupate da bersaglio/distrattori) è casuale:
  // in rarissimi casi può ricreare per puro caso un'occorrenza extra del
  // bersaglio. Se succede, si rimescola SOLO il rumore di fondo (le celle
  // intenzionali restano ferme) finché il conteggio non torna esattamente
  // quello voluto — molto più economico che rigenerare l'intera griglia.
  let counts = countDirectionalOccurrences(grid, target);
  let guard = 0;
  while ((counts.h !== placedH || counts.v !== placedV) && guard < 30) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!occupied.has(r + ',' + c)) grid[r][c] = pick(rnd, alphabet);
    }
    counts = countDirectionalOccurrences(grid, target);
    guard++;
  }

  return { grid, target, count: counts.h + counts.v, countH: counts.h, countV: counts.v, seqLen, distractorCount, placedH, placedV, occurrences: findSequencePositions(grid, target, DIR_HV) };
}

function shuffleInPlaceArr(rnd, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function countSequenceOccurrences(grid, target) {
  const { h, v } = countDirectionalOccurrences(grid, target);
  return h + v;
}
function matchSeq(arr, start, target) {
  for (let i = 0; i < target.length; i++) if (arr[start + i] !== target[i]) return false;
  return true;
}

// ---------------------------------------------------------------------------
// 3. GRIGLIA "cerchiare tutte le sequenze indicate" — bersagli multipli
// ---------------------------------------------------------------------------
// Conta le occorrenze di una sequenza in TUTTE le direzioni previste per questa
// griglia: orizzontale, verticale e le due diagonali (discendente a destra e a
// sinistra) — usata solo qui, perché le prime 3 griglie restano orizzontale/
// verticale come da richiesta originale.
function countAllDirections(grid, target) {
  const rows = grid.length, cols = grid[0].length, len = target.length;
  let count = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c <= cols - len; c++)
      if (matchSeq(grid[r], c, target)) count++;
  for (let c = 0; c < cols; c++) {
    const col = grid.map(row => row[c]);
    for (let r = 0; r <= rows - len; r++)
      if (matchSeq(col, r, target)) count++;
  }
  for (let r = 0; r <= rows - len; r++)
    for (let c = 0; c <= cols - len; c++)
      if ([...Array(len)].every((_, k) => grid[r + k][c + k] === target[k])) count++;
  for (let r = 0; r <= rows - len; r++)
    for (let c = len - 1; c < cols; c++)
      if ([...Array(len)].every((_, k) => grid[r + k][c - k] === target[k])) count++;
  return count;
}

// Griglia "mista": 12 bersagli distinti, distribuiti 4 orizzontali + 4
// verticali + 4 in obliquo (2 discendenti a destra, 2 a sinistra), ciascuno
// garantito presente ALMENO una volta. (Prima tentava di garantire
// ESATTAMENTE una volta rigenerando l'intera griglia da capo ad ogni
// tentativo: con 12 vincoli congiunti su una griglia di ~190 celle il rumore
// di fondo crea quasi sempre un'occorrenza accidentale in più da qualche
// parte, e il tentativo falliva l'81% delle volte nei test — bug trovato
// durante la verifica in browser. Un'occorrenza in più non è comunque un
// problema per l'esercizio: il paziente cerchia tutte le occorrenze di ogni
// sequenza indicata, una in più si cerchia e basta.)
// Griglia "mista": 12 bersagli distinti, distribuiti 4 orizzontali + 4
// verticali + 4 in obliquo (2 discendenti a destra, 2 a sinistra). Piazzamento
// GREEDY senza sovrapposizioni (stesso principio di generateSequenceGrid):
// il vecchio "pianta a caso e ripara se manca" falliva spesso con sequenze da
// 6 caratteri su una griglia piccola (16×12) — un bersaglio finiva
// sistematicamente sovrascritto da un altro. Trovato testando tutte le 12
// settimane, non visibile con la lunghezza 4 originale.
function generateMultiTargetGrid(rows, cols, alphabet, rnd, nTargets, seqLen = 4) {
  nTargets = nTargets || 12;
  const perDir = { H: 4, V: 4, DR: 2, DL: 2 };

  const targets = [];
  const seen = new Set();
  while (targets.length < nTargets) {
    const t = pickN(rnd, alphabet, seqLen);
    const key = t.join('');
    if (!seen.has(key)) { seen.add(key); targets.push(t); }
  }
  const dirs = [];
  for (let i = 0; i < perDir.H; i++) dirs.push('H');
  for (let i = 0; i < perDir.V; i++) dirs.push('V');
  for (let i = 0; i < perDir.DR; i++) dirs.push('DR');
  for (let i = 0; i < perDir.DL; i++) dirs.push('DL');
  shuffleInPlaceArr(rnd, dirs);

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => pick(rnd, alphabet)));
  const occupied = new Set();

  function candidatesFor(dir) {
    const out = [];
    if (dir === 'H') for (let r = 0; r < rows; r++) for (let c = 0; c <= cols - seqLen; c++) out.push([r, c]);
    else if (dir === 'V') for (let c = 0; c < cols; c++) for (let r = 0; r <= rows - seqLen; r++) out.push([r, c]);
    else if (dir === 'DR') for (let r = 0; r <= rows - seqLen; r++) for (let c = 0; c <= cols - seqLen; c++) out.push([r, c]);
    else for (let r = 0; r <= rows - seqLen; r++) for (let c = seqLen - 1; c < cols; c++) out.push([r, c]);
    shuffleInPlaceArr(rnd, out);
    return out;
  }
  function cellsFor(dir, r, c) {
    const out = [];
    for (let k = 0; k < seqLen; k++) {
      if (dir === 'H') out.push([r, c + k]);
      else if (dir === 'V') out.push([r + k, c]);
      else if (dir === 'DR') out.push([r + k, c + k]);
      else out.push([r + k, c - k]);
    }
    return out;
  }

  const placedOk = targets.map((target, i) => {
    const tryDirs = [dirs[i], ...['H', 'V', 'DR', 'DL'].filter(d => d !== dirs[i])];
    for (const dir of tryDirs) {
      for (const [r, c] of candidatesFor(dir)) {
        const cells = cellsFor(dir, r, c);
        if (cells.some(([rr, cc]) => occupied.has(rr + ',' + cc))) continue;
        cells.forEach(([rr, cc], k) => { grid[rr][cc] = target[k]; occupied.add(rr + ',' + cc); });
        return true;
      }
    }
    return false; // nessuna cella libera in nessuna direzione (grid troppo piccola/affollata)
  });

  // Il rumore di fondo (celle non occupate) potrebbe per puro caso ricreare
  // un'occorrenza extra: non è un problema (il paziente cerchia comunque
  // tutte le occorrenze), quindi qui non serve alcuna correzione — a
  // differenza delle prime 3 griglie, qui non serve un conteggio ESATTO.
  const counts = targets.map(t => countAllDirections(grid, t));
  const positions = targets.map(t => findSequencePositions(grid, t, DIR_HV_DIAG));

  return { grid, targets, counts, positions };
}

// Banca di parole: dal passo 10 sta in data/fascicolo-parole.js (WORD_BANK_SCORED = [parola, frequenza] per lunghezza; WORD_BANK = solo parole).
const { WORD_BANK_SCORED, WORD_BANK } = (typeof module === 'object' && module.exports) ? require('../../data/fascicolo-parole.js') : FascicoloParole;

// ---------------------------------------------------------------------------
// 5. ANAGRAMMI — parole reali, frequenza decrescente E scramble via via più
//    scomposto man mano che la settimana avanza (non più uno scramble sempre
//    completo su parole senza dato di frequenza).
// ---------------------------------------------------------------------------

// Sillabazione euristica dell'italiano: non perfetta (le regole complete
// dell'italiano hanno eccezioni), ma sufficiente per lo scopo — dare uno
// scramble "a blocchi" riconoscibile invece che lettera per lettera.
const ITA_VOWELS = new Set('AEIOU');
const ITA_KEEP_TOGETHER = new Set(['BR','CR','DR','FR','GR','PR','TR','VR','BL','CL','FL','GL','PL','GN','SC','CH','GH','QU']);
function syllabifyItalian(word) {
  const letters = word.split('');
  const vpos = [];
  letters.forEach((c, i) => { if (ITA_VOWELS.has(c)) vpos.push(i); });
  if (vpos.length <= 1) return [word];
  const syll = [];
  let start = 0;
  for (let k = 0; k < vpos.length - 1; k++) {
    const v1 = vpos[k], v2 = vpos[k + 1];
    const cons = word.slice(v1 + 1, v2);
    let cut;
    if (cons.length === 0) cut = v1 + 1;
    else if (cons.length === 1) cut = v1 + 1;
    else if (ITA_KEEP_TOGETHER.has(cons.slice(0, 2)) || ITA_KEEP_TOGETHER.has(cons)) cut = v1 + 1;
    else cut = v1 + 1 + Math.floor(cons.length / 2);
    syll.push(word.slice(start, cut));
    start = cut;
  }
  syll.push(word.slice(start));
  return syll;
}

function shuffleLettersWithin(s, rnd) {
  if (s.length <= 1) return s;
  const arr = s.split('');
  let out;
  let attempts = 0;
  do { out = shuffleInPlaceArr(rnd, arr.slice()).join(''); attempts++; } while (out === s && attempts < 6);
  return out;
}

function fullScramble(word, rnd) {
  const letters = word.split('');
  let scrambled;
  let attempts = 0;
  do { scrambled = shuffleInPlaceArr(rnd, letters.slice()).join(''); attempts++; } while (scrambled === word && attempts < 10);
  return scrambled;
}

// Tre gradi di scomposizione, dal più semplice al più difficile — vedi
// richiesta di Rodrigo: "sillabe in parte lasciate integre e rimescolate" per
// i primi livelli, via via meno riconoscibile.
// grado 1 (settimane 1-4): si mescola solo l'ORDINE delle sillabe, ciascuna
//          resta intatta al suo interno (es. CANE -> NECA, non lettere sparse).
// grado 2 (settimane 5-8): sillabe mescolate di ordine E internamente.
// grado 3 (settimane 9-12): scramble completo lettera per lettera, come prima.
function scrambleGraded(word, week, rnd) {
  const syll = syllabifyItalian(word);
  if (syll.length <= 1) return fullScramble(word, rnd); // parola troppo corta per avere sillabe multiple
  if (week <= 4) {
    let out, attempts = 0;
    do { out = shuffleInPlaceArr(rnd, syll.slice()).join(''); attempts++; } while (out === word && attempts < 6);
    return out;
  }
  if (week <= 8) {
    const scrambledSyll = syll.map(s => shuffleLettersWithin(s, rnd));
    let out, attempts = 0;
    do { out = shuffleInPlaceArr(rnd, scrambledSyll.slice()).join(''); attempts++; } while (out === word && attempts < 6);
    return out;
  }
  return fullScramble(word, rnd);
}

// Finestra di frequenza: le settimane iniziali pescano SOLO dalle parole più
// comuni di quella lunghezza (Zipf più alto), le settimane avanzate includono
// anche la coda meno frequente — sempre parole reali, mai a caso.
function anagramWordPool(wordLen, week) {
  const bank = WORD_BANK_SCORED[wordLen] || WORD_BANK_SCORED[Math.max(...Object.keys(WORD_BANK_SCORED).map(Number))];
  const n = bank.length;
  const windowSize = Math.max(6, Math.ceil(n * 0.4));
  const pct = (Math.max(1, Math.min(12, week)) - 1) / 11;
  const maxStart = Math.max(0, n - windowSize);
  const start = Math.round(pct * maxStart);
  return bank.slice(start, start + windowSize).map(([w]) => w);
}

// Sceglie fino a `count` parole MAI usate (`excl`): prima quelle della finestra di frequenza della
// settimana; se non bastano, le più vicine alla finestra fuori da essa (la difficoltà si sposta di
// poco); se non bastano ancora, ne restituisce di meno — mai duplicati né ripescaggi.
function pickFreshWords(entries, windowWords, count, excl, rnd) {
  const isFresh = w => !excl || !excl.has(w);
  const inWin = windowWords.filter(isFresh);
  let picked = pickN(rnd, inWin, Math.min(count, inWin.length));
  if (picked.length < count) {
    const winSet = new Set(windowWords);
    const idx = windowWords.map(w => entries.findIndex(e => e[0] === w)).filter(i => i >= 0);
    const centre = idx.length ? (Math.min(...idx) + Math.max(...idx)) / 2 : 0;
    const taken = new Set(picked);
    const outside = entries.map((e, i) => ({ w: e[0], d: Math.abs(i - centre) }))
      .filter(o => !winSet.has(o.w) && isFresh(o.w) && !taken.has(o.w))
      .sort((x, y) => x.d - y.d);
    picked = picked.concat(outside.slice(0, count - picked.length).map(o => o.w));
  }
  return picked;
}

function generateAnagrams(count, wordLen, rnd, excludeWords, week) {
  week = week || 1;
  const entries = WORD_BANK_SCORED[wordLen] || WORD_BANK_SCORED[Math.max(...Object.keys(WORD_BANK_SCORED).map(Number))];
  const excl = excludeWords ? new Set(excludeWords) : null;
  const words = pickFreshWords(entries, anagramWordPool(wordLen, week), count, excl, rnd);
  const res = words.map(w => ({ solution: w, scrambled: scrambleGraded(w, week, rnd) }));
  res.shortfall = count - res.length;
  return res;
}

// ---------------------------------------------------------------------------
// 6. CALCOLO — catena di addizioni/sottrazioni. I numeri hanno una lunghezza
//    in cifre precisa (non un tetto massimo generico), secondo il piano
//    settimanale — vedi WEEK_PLAN.calc.
// ---------------------------------------------------------------------------
function randNumWithDigits(len, rnd) {
  if (len <= 1) return 1 + Math.floor(rnd() * 9);
  const min = Math.pow(10, len - 1), max = Math.pow(10, len) - 1;
  return min + Math.floor(rnd() * (max - min + 1));
}

function generateCalcChain(count, nTerms, digitLens, rnd) {
  // Quando il piano settimanale ammette anche numeri a una cifra (settimane 1-2,
  // digitLens = [1, 2]) ogni riga ne contiene AL MASSIMO UNO, tutti gli altri termini
  // sono a 2 cifre: con più numeri a una cifra nella stessa riga il calcolo diventa
  // troppo semplice (richiesta di Rodrigo). Il numero a una cifra, quando c'è, cade in
  // una posizione casuale della catena; circa 1 riga su 4 non ne ha nessuno.
  const hasSingle = digitLens.includes(1);
  const multi = digitLens.filter(l => l > 1);
  const rows = [];
  for (let i = 0; i < count; i++) {
    let lens;
    if (hasSingle && multi.length) {
      lens = Array.from({ length: nTerms }, () => pick(rnd, multi));
      if (rnd() < 0.75) lens[Math.floor(rnd() * nTerms)] = 1;
    } else {
      lens = Array.from({ length: nTerms }, () => pick(rnd, digitLens));
    }
    const used = new Set();
    let result = randNumWithDigits(lens[0], rnd);
    used.add(result);
    let expr = String(result);
    for (let t = 1; t < nTerms; t++) {
      let op = rnd() < 0.5 ? '+' : '-';
      let val = null;
      if (op === '-') {
        // sottrazione solo se resta un totale positivo e il numero non è già usato;
        // altrimenti (es. minuendo a una cifra, sottraendo a 2 cifre) si ripiega su '+'
        for (let g = 0; g < 60; g++) {
          const v = randNumWithDigits(lens[t], rnd);
          if (!used.has(v) && v < result) { val = v; break; }
        }
        if (val === null) op = '+';
      }
      if (op === '+') {
        let g = 0;
        do { val = randNumWithDigits(lens[t], rnd); g++; } while (used.has(val) && g < 500);
      }
      used.add(val);
      result = op === '+' ? result + val : result - val;
      expr += ` ${op} ${val}`;
    }
    rows.push({ expression: expr, result });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 7. CRUCIPUZZLE — stessa logica delle griglie di ricerca-sequenza (famiglia di
//    simboli/materiale che si fa via via meno comune, lunghezza bersaglio che
//    cresce 4→5→6), ma con piazzamento in tutte e 8 le direzioni (orizzontale,
//    verticale, diagonale, e i relativi versi invertiti) invece delle sole
//    orizzontale/verticale/diagonale della griglia mista — è questo, non la
//    ricerca di parole italiane reali, a crescere in complessità settimana per
//    settimana. Il controllo manuale "lunghezza parole" non serve più: la
//    lunghezza è decisa dalla settimana, non impostabile a mano.
// ---------------------------------------------------------------------------
const DIRECTIONS = [
  [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1],
];

function generateSymbolCrucipuzzle(rows, cols, alphabet, rnd, nTargets, seqLen) {
  nTargets = nTargets || 12;
  const targets = [];
  const seen = new Set();
  while (targets.length < nTargets) {
    const t = pickN(rnd, alphabet, seqLen);
    const key = t.join('');
    if (!seen.has(key)) { seen.add(key); targets.push(t); }
  }
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => pick(rnd, alphabet)));
  const occupied = new Set();

  // Piazzamento greedy senza sovrapposizioni, come per la griglia mista —
  // stesso bug (bersagli che si sovrascrivevano a vicenda con seqLen alto)
  // trovato e corretto qui allo stesso modo.
  function candidatesFor(dir) {
    const [dr, dc] = dir;
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const rEnd = r + dr * (seqLen - 1), cEnd = c + dc * (seqLen - 1);
      if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;
      out.push([r, c]);
    }
    shuffleInPlaceArr(rnd, out);
    return out;
  }

  const dirs = targets.map(() => pick(rnd, DIRECTIONS));
  targets.forEach((target, i) => {
    const tryDirs = [dirs[i], ...DIRECTIONS.filter(d => d !== dirs[i])];
    for (const dir of tryDirs) {
      const [dr, dc] = dir;
      let done = false;
      for (const [r, c] of candidatesFor(dir)) {
        const cells = Array.from({ length: seqLen }, (_, k) => [r + dr * k, c + dc * k]);
        if (cells.some(([rr, cc]) => occupied.has(rr + ',' + cc))) continue;
        cells.forEach(([rr, cc], k) => { grid[rr][cc] = target[k]; occupied.add(rr + ',' + cc); });
        done = true;
        break;
      }
      if (done) break;
    }
  });

  function countAllDirectionsSym(grid, target) {
    let count = 0;
    for (const [dr, dc] of DIRECTIONS) {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const rEnd = r + dr * (seqLen - 1), cEnd = c + dc * (seqLen - 1);
        if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;
        let ok = true;
        for (let i = 0; i < seqLen; i++) if (grid[r + dr * i][c + dc * i] !== target[i]) { ok = false; break; }
        if (ok) count++;
      }
    }
    return count;
  }

  const counts = targets.map(t => countAllDirectionsSym(grid, t));
  return { grid, targets, counts, seqLen };
}

// ---------------------------------------------------------------------------
// 7b. CRUCIPUZZLE ITALIANO A RICERCA LIBERA — sostituisce, come seconda griglia
//     con legenda, il crucipuzzle a simboli qui sopra (che resta definito ma non
//     più usato in buildFascicolo): qui le parole nascoste sono italiane reali,
//     di senso compiuto, e NON viene fornito alcun elenco bersaglio — il
//     paziente le cerca da solo, in tutte le direzioni (compreso il verso
//     invertito). La difficoltà cresce con la settimana su tre assi: quante
//     parole sono garantite in griglia, quanto sono lunghe, e quanto sono
//     frequenti/comuni (finestra di frequenza come per gli anagrammi — vedi
//     anagramWordPool). Il foglio delle soluzioni evidenzia TUTTE le parole
//     realmente presenti nella griglia finale, non solo quelle piazzate di
//     proposito: il rumore di fondo può averne creata qualcuna in più per
//     puro caso, ed è comunque una parola valida da trovare.
// ---------------------------------------------------------------------------
const ITALIAN_FILLER_LETTERS = "ABCDEFGHILMNOPQRSTUVZ".split("");

function italianWordPool(minLen, maxLen, week) {
  let combined = [];
  for (let len = minLen; len <= maxLen; len++) {
    const bank = WORD_BANK_SCORED[len];
    if (bank) combined = combined.concat(bank);
  }
  combined = combined.slice().sort((a, b) => b[1] - a[1]); // frequenza decrescente
  const n = combined.length;
  const windowSize = Math.max(8, Math.ceil(n * 0.4));
  const pct = (Math.max(1, Math.min(12, week)) - 1) / 11;
  const maxStart = Math.max(0, n - windowSize);
  const start = Math.round(pct * maxStart);
  return combined.slice(start, start + windowSize).map(([w]) => w);
}

// Scansiona l'INTERA griglia contro tutto il vocabolario disponibile (ogni lunghezza
// 3-10), in tutte e 8 le direzioni: trova ogni parola reale davvero presente, piazzata
// di proposito o comparsa per caso nel rumore di fondo.
function findAllDictionaryWords(grid) {
  const rows = grid.length, cols = grid[0].length;
  const results = [];
  const seen = new Set();
  Object.keys(WORD_BANK_SCORED).map(Number).forEach(len => {
    const bank = WORD_BANK_SCORED[len];
    bank.forEach(([word]) => {
      const letters = word.split("");
      DIRECTIONS.forEach(([dr, dc]) => {
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const rEnd = r + dr * (len - 1), cEnd = c + dc * (len - 1);
          if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;
          let ok = true;
          for (let k = 0; k < len; k++) if (grid[r + dr * k][c + dc * k] !== letters[k]) { ok = false; break; }
          if (!ok) continue;
          const cells = Array.from({ length: len }, (_, k) => [r + dr * k, c + dc * k]);
          const key = word + "@" + cells.map(p => p.join(",")).join("|");
          if (seen.has(key)) continue;
          seen.add(key);
          results.push({ word, cells });
        }
      });
    });
  });
  return results;
}

function generateItalianCrucipuzzle(rows, cols, rnd, week, excludeWords) {
  week = week || 1;
  const w = Math.max(1, Math.min(12, week));
  // Quante parole garantire in griglia: 10 alla settimana 1, 18 alla settimana 12 (prima 6-12: pochi
  // bersagli per una ricerca libera, richiesta di Rodrigo di averne di più).
  const nWords = Math.round(10 + (w - 1) / 11 * 8);
  // Lunghezza delle parole: cresce ogni 3 settimane (4-5 all'inizio, fino a 7-9 in fondo).
  const minLen = Math.min(8, 4 + Math.floor((w - 1) / 3));
  const maxLen = Math.min(9, minLen + 2);
  const pool = italianWordPool(minLen, maxLen, w);
  let entries = [];
  for (let len = minLen; len <= maxLen; len++) if (WORD_BANK_SCORED[len]) entries = entries.concat(WORD_BANK_SCORED[len]);
  entries.sort((a, b) => b[1] - a[1]);
  const chosen = pickFreshWords(entries, pool, nWords, excludeWords ? new Set(excludeWords) : null, rnd);

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => pick(rnd, ITALIAN_FILLER_LETTERS)));
  const occupied = new Set();

  function candidatesFor(dir, len) {
    const [dr, dc] = dir;
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const rEnd = r + dr * (len - 1), cEnd = c + dc * (len - 1);
      if (rEnd < 0 || rEnd >= rows || cEnd < 0 || cEnd >= cols) continue;
      out.push([r, c]);
    }
    shuffleInPlaceArr(rnd, out);
    return out;
  }

  // Piazzamento greedy in una delle 8 direzioni: a differenza delle altre griglie qui la
  // sovrapposizione tra parole è ammessa quando le lettere coincidono (come in un vero
  // cruciverba), il che aumenta di molto quante parole entrano davvero sulla griglia.
  const placedWords = [];
  chosen.forEach(word => {
    const letters = word.split("");
    const len = letters.length;
    const dirsShuffled = shuffleInPlaceArr(rnd, DIRECTIONS.slice());
    for (const dir of dirsShuffled) {
      const [dr, dc] = dir;
      let done = false;
      for (const [r, c] of candidatesFor(dir, len)) {
        const cells = Array.from({ length: len }, (_, k) => [r + dr * k, c + dc * k]);
        const compatible = cells.every(([rr, cc], k) => {
          const key = rr + "," + cc;
          return !occupied.has(key) || grid[rr][cc] === letters[k];
        });
        if (!compatible) continue;
        cells.forEach(([rr, cc], k) => { grid[rr][cc] = letters[k]; occupied.add(rr + "," + cc); });
        done = true;
        break;
      }
      if (done) { placedWords.push(word); break; }
    }
  });

  const foundWords = findAllDictionaryWords(grid);

  return {
    grid, rows, cols,
    minWordsToFind: placedWords.length,
    plantedWords: placedWords,
    shortfall: nWords - chosen.length,
    foundWords, // [{word, cells}] — TUTTE le parole realmente presenti, per il foglio soluzioni
  };
}

// ---------------------------------------------------------------------------
// 8. SEQUENZIAMENTO — "unire in ordine" — numeri, lettere o misto a seconda
//    della settimana (vedi WEEK_PLAN). Sostituisce le vecchie funzioni separate
//    generateNumericSequencing/generateAlphabeticSequencing: ora un'unica
//    funzione copre tutte e 3 le modalità richieste, comprese le sequenze
//    miste numero+lettera delle settimane 11-12.
// ---------------------------------------------------------------------------
function scatterPositions(n, rnd, width = 700, height = 950, minDist = 70) {
  const pts = [];
  let tries = 0;
  while (pts.length < n && tries < n * 200) {
    tries++;
    const x = 40 + rnd() * (width - 80);
    const y = 40 + rnd() * (height - 80);
    if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= minDist)) pts.push({ x, y });
  }
  let relax = minDist;
  while (pts.length < n && relax > 20) {
    relax -= 10;
    let guard = 0;
    while (pts.length < n && guard < n * 100) {
      guard++;
      const x = 40 + rnd() * (width - 80);
      const y = 40 + rnd() * (height - 80);
      if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= relax)) pts.push({ x, y });
    }
  }
  while (pts.length < n) pts.push({ x: 40 + rnd() * (width - 80), y: 40 + rnd() * (height - 80) });
  return pts;
}

const SEQ_LETTERS = 'ABCDEFGHILMNOPRSTUVZ'.split(''); // esclude lettere facilmente confondibili (es. niente Q, K, J, X, Y, W)

function randNoRepeatDigits(len, rnd) {
  // Un numero di `len` cifre senza cifre ripetute al suo interno (mai "11", "232"...).
  const digits = '0123456789'.split('');
  let n;
  let guard = 0;
  do {
    const chosen = pickN(rnd, digits, len);
    if (chosen[0] === '0' && len > 1) { guard++; continue; }
    n = Number(chosen.join(''));
    guard++;
  } while (guard < 60 && String(n).length !== len);
  return n;
}

function randLetterCode(len, rnd) {
  const letters = pickN(rnd, SEQ_LETTERS, Math.min(len, SEQ_LETTERS.length));
  while (letters.length < len) letters.push(pick(rnd, SEQ_LETTERS));
  return letters.slice(0, len).join('');
}

// spec.mode: 'digits' | 'letters' | 'mixed'
// spec.digitLens: es. [1,2] — lunghezza (in cifre) di ciascun numero, pescata a caso ad ogni elemento
// spec.letterLen: 2 o 3 — lunghezza fissa dei codici-lettera
// spec.count: numero di elementi totali nella sequenza
function generateSequencingV2(spec, rnd) {
  const count = spec.count;
  const positions = scatterPositions(count, rnd);

  if (spec.mode === 'digits') {
    const values = new Set();
    let guard = 0;
    while (values.size < count && guard < count * 300) {
      guard++;
      values.add(randNoRepeatDigits(pick(rnd, spec.digitLens), rnd));
    }
    while (values.size < count) values.add(randNoRepeatDigits(pick(rnd, spec.digitLens), rnd));
    const sorted = [...values].sort((a, b) => a - b);
    const shuffled = pickN(rnd, sorted.map((v, i) => ({ value: String(v), ...positions[i] })), count);
    return { order: sorted.map(String), points: shuffled, mode: 'digits' };
  }

  if (spec.mode === 'letters') {
    const codes = new Set();
    while (codes.size < count) codes.add(randLetterCode(spec.letterLen, rnd));
    const sorted = [...codes].sort();
    const shuffled = pickN(rnd, sorted.map((v, i) => ({ value: v, ...positions[i] })), count);
    return { order: sorted, points: shuffled, mode: 'letters' };
  }

  // mode === 'mixed': metà numeri (2-3 cifre) metà codici-lettera (2-3 lettere), poi
  // fusi alternati (1° numero, 1° lettera, 2° numero, 2° lettera...) — stesso principio
  // del Trail Making Test parte B: l'ordine da seguire alterna i due insiemi invece di
  // trattarli come un'unica sequenza ordinabile insieme (numeri e lettere non sono
  // confrontabili tra loro in un unico ordine naturale).
  const nNums = Math.ceil(count / 2), nLetters = count - nNums;
  const numSet = new Set();
  while (numSet.size < nNums) numSet.add(randNoRepeatDigits(2 + Math.floor(rnd() * 2), rnd));
  const letterSet = new Set();
  while (letterSet.size < nLetters) letterSet.add(randLetterCode(2 + Math.floor(rnd() * 2), rnd));
  const numsSorted = [...numSet].sort((a, b) => a - b).map(String);
  const lettersSorted = [...letterSet].sort();
  const merged = [];
  for (let i = 0; i < Math.max(numsSorted.length, lettersSorted.length); i++) {
    if (i < numsSorted.length) merged.push(numsSorted[i]);
    if (i < lettersSorted.length) merged.push(lettersSorted[i]);
  }
  const shuffled = pickN(rnd, merged.map((v, i) => ({ value: v, ...positions[i] })), count);
  return { order: merged, points: shuffled, mode: 'mixed' };
}

function sequencingInstructionText(mode) {
  if (mode === 'letters') return "Unire le lettere in ordine alfabetico";
  if (mode === 'mixed') return "Unire numeri e lettere alternati, seguendo l'ordine numerico e alfabetico di ciascun insieme (1° numero, 1° codice, 2° numero, 2° codice...)";
  return "Unire i numeri in ordine crescente";
}

// ---------------------------------------------------------------------------
// 9. LABIRINTO — recursive backtracker su griglia rettangolare
// ---------------------------------------------------------------------------
function generateMaze(cols, rows, rnd) {
  // ogni cella ha 4 pareti: N,E,S,W (true = muro presente)
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ N: true, E: true, S: true, W: true, visited: false })));

  const stack = [[0, 0]];
  cells[0][0].visited = true;
  const DIRS = [
    { dx: 0, dy: -1, from: 'N', to: 'S' },
    { dx: 1, dy: 0, from: 'E', to: 'W' },
    { dx: 0, dy: 1, from: 'S', to: 'N' },
    { dx: -1, dy: 0, from: 'W', to: 'E' },
  ];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const neighbors = DIRS
      .map(d => ({ ...d, nx: x + d.dx, ny: y + d.dy }))
      .filter(d => d.nx >= 0 && d.nx < cols && d.ny >= 0 && d.ny < rows && !cells[d.ny][d.nx].visited);
    if (!neighbors.length) { stack.pop(); continue; }
    const d = pick(rnd, neighbors);
    cells[y][x][d.from] = false;
    cells[d.ny][d.nx][d.to] = false;
    cells[d.ny][d.nx].visited = true;
    stack.push([d.nx, d.ny]);
  }
  return { cells, cols, rows, start: [0, 0], end: [cols - 1, rows - 1] };
}

// Risolve il labirinto con una ricerca in ampiezza (BFS) — usata SOLO per mostrare il
// percorso nell'anteprima dell'app quando si attiva "Mostra risposta"; non entra mai
// nell'esportazione (né PowerPoint né Word).
function solveMaze(maze) {
  const { cells, cols, rows, start, end } = maze;
  const key = (x, y) => y * cols + x;
  const visited = new Set([key(start[0], start[1])]);
  const prev = new Map();
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === end[0] && y === end[1]) break;
    const c = cells[y][x];
    const neighbors = [];
    if (!c.N) neighbors.push([x, y - 1]);
    if (!c.S) neighbors.push([x, y + 1]);
    if (!c.E) neighbors.push([x + 1, y]);
    if (!c.W) neighbors.push([x - 1, y]);
    for (const [nx, ny] of neighbors) {
      const k = key(nx, ny);
      if (!visited.has(k)) { visited.add(k); prev.set(k, [x, y]); queue.push([nx, ny]); }
    }
  }
  const path = [end];
  let cur = end;
  while (cur[0] !== start[0] || cur[1] !== start[1]) {
    cur = prev.get(key(cur[0], cur[1]));
    path.push(cur);
  }
  return path.reverse();
}

// ---------------------------------------------------------------------------
// 10. CATEGORIE e LETTERE per gli esercizi di accesso lessicale (a risposta
//     aperta: qui servono solo i PROMPT, non una banca di parole-risposta)
// ---------------------------------------------------------------------------
const CATEGORY_POOL = {
  // 12 fasce (una per settimana), stesse 89 categorie di prima ma redistribuite
  // in gradini più fini invece di 3 blocchi larghi — dalla più comune/concreta
  // alla più stretta/insolita.
  1: ['Alimenti', 'Animali', 'Colori', 'Mobili', 'Indumenti', 'Mezzi di trasporto', 'Giochi', 'Frutta', 'Animali domestici', 'Animali della fattoria', 'Oggetti del bagno', 'Oggetti della camera da letto', 'Cose che si mettono in tavola', 'Cose da mangiare a colazione', 'Oggetti del salotto', 'Cose che si trovano in giardino', 'Cose da mangiare a cena', 'Cose da bere', 'Cibi dolci', 'Cibi salati', 'Animali selvatici', 'Cose che si trovano in città', 'Cose che si trovano in campagna', 'Cose che si trovano in montagna', 'Cose che si trovano al parco', 'Cose che si comprano al supermercato', 'Cose che si portano addosso', 'Cose per dormire', 'Cose che si trovano in un bar', 'Cose per lavarsi', 'Cose da mangiare a merenda', 'Cose che si trovano in un negozio di abbigliamento', 'Cose che si trovano in frigorifero', 'Cose che si trovano in dispensa', 'Cose che si trovano in un armadio', 'Cose che si trovano in una borsa', 'Cose che si trovano sul tavolo', 'Cose da leggere', 'Cose da guardare', 'Cose da ascoltare', 'Cose che si comprano in pasticceria'],
  2: ['Verdura', 'Bevande', 'Utensili', 'Edifici', 'Parti del corpo', 'Strumenti musicali', 'Sport', 'Dolci', 'Mestieri', 'Cose che si trovano in cucina', 'Cose che si trovano al mare', 'Membri della famiglia', 'Cose che si comprano in farmacia', 'Cose che si comprano dal fornaio', 'Cose che si trovano in ufficio', 'Cose che si comprano in cartoleria', 'Cose che si comprano dal macellaio', 'Cose che si comprano dal fruttivendolo', 'Cose che si comprano in ferramenta', 'Cose che si trovano in una stazione', 'Cose che si trovano in un aeroporto', 'Cose che si trovano in un ristorante', 'Cose che si trovano in una biblioteca', 'Cose che si trovano in chiesa', 'Giocattoli', 'Frutta estiva', 'Verdure a foglia', 'Tipi di carne', 'Bevande calde', 'Cose che si comprano in edicola', 'Cose che si comprano in profumeria', 'Cose che si comprano dal pescivendolo', 'Cose che si comprano in gastronomia', 'Cose che si trovano in un parco giochi', 'Cose che si trovano in uno zoo', 'Cose che si trovano in un circo', 'Cose che si trovano in una fattoria', 'Cose che si trovano in un museo', 'Cose che si trovano in un teatro', 'Cose che si trovano in un mercato', 'Cose che si trovano in un hotel'],
  3: ['Fiori', 'Alberi', 'Uccelli', 'Insetti', 'Elettrodomestici', 'Metalli', 'Pianeti', 'Scarpe', 'Cereali e legumi', 'Erbe aromatiche', 'Spezie', 'Animali marini', 'Animali del bosco', 'Corsi d’acqua', 'Legumi', 'Mammiferi', 'Rettili', 'Animali da cortile', 'Piante da appartamento', 'Strumenti a percussione', 'Sport con la palla', 'Sport invernali', 'Sport acquatici', 'Giochi di carte', 'Bevande alcoliche', 'Tagli di carne', 'Condimenti', 'Parti della casa', 'Mezzi a due ruote', 'Animali notturni', 'Animali a quattro zampe', 'Animali che depongono le uova', 'Alberi da frutto', 'Fiori da giardino', 'Fiori primaverili', 'Posate e stoviglie', 'Pentole e contenitori da cucina', 'Dolci al cucchiaio', 'Ingredienti della pizza', 'Ingredienti di un’insalata', 'Tipi di zuppe'],
  4: ['Frutti di mare', 'Frutti tropicali', 'Ortaggi a radice', 'Formaggi', 'Salumi', 'Gioielli', 'Giochi da tavolo', 'Festività', 'Tipi di pasta', 'Tipi di pane', 'Salse e condimenti', 'Dolci natalizi', 'Mezzi di trasporto pubblico', 'Fiori di campo', 'Pesci d’acqua dolce', 'Tipi di biscotti', 'Tipi di torte', 'Tipi di caffè', 'Verdure invernali', 'Frutta invernale', 'Forme geometriche', 'Unità di misura', 'Documenti personali', 'Parti del viso', 'Capi di abbigliamento invernali', 'Capi di abbigliamento estivi', 'Piante officinali', 'Sport di squadra', 'Sport individuali', 'Mobili da giardino', 'Prodotti per l’igiene personale', 'Prodotti per la pulizia della casa', 'Cibi da forno', 'Cibi in scatola', 'Cibi surgelati', 'Cibi fritti', 'Cibi piccanti', 'Cibi a base di latte', 'Cibi a base di farina', 'Cibi che si mangiano con le mani', 'Tipi di frittura'],
  5: ['Pesci', 'Frutta secca', 'Combustibili', 'Contenitori per liquidi', 'Edifici pubblici', 'Organi', 'Animali esotici', 'Strumenti da scrivania', 'Cappelli e copricapo', 'Tipi di abitazione', 'Tessuti', 'Vini e liquori', 'Uccelli rapaci', 'Ossa del corpo', 'Attrezzi da palestra', 'Articoli da campeggio', 'Generi musicali', 'Generi di film', 'Danze', 'Piatti tipici italiani', 'Tipi di pizza', 'Gusti di gelato', 'Tipi di legname', 'Rocce e minerali', 'Fenomeni meteorologici', 'Parti di una pianta', 'Parti di un libro', 'Tipi di barca', 'Mestieri artistici', 'Tipi di energia', 'Fonti di luce', 'Fonti di calore', 'Mezzi per spostarsi in città', 'Mezzi che volano', 'Dolci tipici italiani', 'Strumenti per la cura dei capelli', 'Articoli per il neonato', 'Vini italiani', 'Materiali da imballaggio', 'Articoli per animali domestici'],
  6: ['Province italiane', 'Strumenti da cucina', 'Materiali tessili', 'Capitali europee', 'Fiumi italiani', 'Razze di cani', 'Pietre preziose', 'Dispositivi elettronici', 'Isole italiane', 'Laghi italiani', 'Montagne famose', 'Città d’arte italiane', 'Regioni italiane', 'Mari e oceani', 'Stati europei', 'Capitali del mondo', 'Fiumi del mondo', 'Città europee', 'Lingue del mondo', 'Monete del mondo', 'Strumenti dell’orchestra', 'Segni zodiacali', 'Monti e vulcani italiani', 'Sport olimpici', 'Piatti della cucina internazionale', 'Isole del mondo', 'Nazionalità', 'Scrittori italiani', 'Città dell’Emilia-Romagna', 'Piatti tipici emiliano-romagnoli', 'Pittori famosi', 'Cantanti italiani', 'Personaggi storici', 'Elementi chimici', 'Stati africani', 'Stati asiatici', 'Stati americani', 'Compositori', 'Poeti italiani', 'Attori italiani'],
  7: ['Professioni sanitarie', 'Strumenti da giardinaggio', 'Mezzi di soccorso', 'Strumenti da disegno', 'Parti dell\u2019auto', 'Negozi', 'Attrezzi in officina', 'Parti della bicicletta', 'Strumenti del medico', 'Strumenti del muratore', 'Strumenti del sarto', 'Negozi di alimentari', 'Mestieri del cantiere', 'Specialità mediche', 'Strumenti del pittore', 'Parti esterne della casa', 'Parti di una città', 'Articoli di cartoleria', 'Articoli di ferramenta', 'Articoli di merceria', 'Macchine agricole', 'Attrezzi sportivi', 'Uffici pubblici', 'Luoghi di cura', 'Luoghi di culto', 'Luoghi di svago', 'Negozi di abbigliamento', 'Attrezzi da pesca', 'Strumenti dell’elettricista', 'Strumenti del fotografo', 'Strumenti dell’idraulico', 'Contenitori per alimenti', 'Reparti di un ospedale', 'Reparti di un supermercato', 'Ruoli scolastici', 'Gradi militari', 'Cariche dello Stato', 'Negozi per la casa', 'Articoli da bagno'],
  8: ['Stanze della casa', 'Materiali tessili industriali', 'Strumenti da falegname', 'Monumenti famosi', 'Insegne stradali', 'Attrezzi in campagna', 'Materiale da costruzione', 'Parti del computer', 'Parti di una nave', 'Parti di un aereo', 'Parti di una chiesa', 'Attrezzi del calzolaio', 'Oggetti del barbiere', 'Parti di un mobile', 'Parti di una finestra', 'Parti di una scarpa', 'Parti di un orologio', 'Parti di un uccello', 'Parti di un fiore', 'Mezzi di comunicazione', 'Mezzi di pagamento', 'Tipi di strade', 'Periodi storici', 'Correnti artistiche', 'Luoghi di lavoro', 'Parti di una giacca', 'Parti di una moto', 'Parti di un treno', 'Parti di un tetto', 'Parti di un giardino', 'Parti di un castello', 'Parti di una cucina', 'Parti di uno stadio', 'Parti di un teatro', 'Parti di un albergo', 'Parti di una lettera', 'Tipi di documenti'],
  9: ['Oggetti che richiedono precisione nell\u2019uso', 'Cose che si trovano in cucina ma non si mangiano', 'Strumenti che tagliano', 'Mestieri artigianali', 'Oggetti che producono luce', 'Strumenti di misura', 'Oggetti che servono a scrivere', 'Cose che si trovano in ospedale', 'Cose che si trovano a scuola', 'Strumenti che servono a fissare', 'Oggetti che servono a chiudere', 'Cose che si usano per viaggiare', 'Oggetti che servono a scaldare', 'Oggetti che servono a raffreddare', 'Oggetti che servono a proteggere', 'Oggetti che servono a trasportare', 'Oggetti che servono a legare', 'Oggetti che servono a comunicare', 'Oggetti che servono a ricordare', 'Oggetti che servono a coprire', 'Oggetti che servono a sostenere', 'Oggetti che servono a bere', 'Oggetti che servono per mangiare', 'Cose che si usano per fare il bucato', 'Oggetti che servono a tenere in ordine', 'Oggetti che servono a registrare', 'Oggetti che servono a indicare', 'Oggetti che servono a incollare', 'Oggetti che servono ad asciugare', 'Oggetti che servono a sedersi', 'Oggetti che servono a misurare il tempo', 'Oggetti che servono a vedere meglio', 'Oggetti che servono ad aprire', 'Oggetti che servono a lavare', 'Oggetti che servono a mescolare'],
  10: ['Cose che si trovano in un ufficio ma non su una scrivania', 'Oggetti che emettono un suono', 'Strumenti usati in giardinaggio', 'Oggetti che si trovano in una valigia da viaggio', 'Cose che si indossano solo in inverno', 'Mestieri che richiedono una divisa', 'Cose che si portano in spiaggia', 'Oggetti che si trovano in una farmacia', 'Cose che si usano per dipingere', 'Cose che si indossano solo in estate', 'Oggetti che si usano per cucire', 'Oggetti che servono a pesare o misurare', 'Cose che si trovano in una cassetta del pronto soccorso', 'Cose che si trovano in un kit da cucito', 'Cose che si portano in montagna', 'Cose che servono per fare una torta', 'Cose che servono per dipingere una parete', 'Cose che servono per andare a pescare', 'Cose che servono per una festa di compleanno', 'Cose di Natale', 'Cose che si vedono nel cielo', 'Cose che si trovano in una cantina', 'Cose che si trovano in un garage', 'Cose che si trovano in un orto', 'Cose che servono per fare il caffè', 'Cose che servono per scrivere una lettera', 'Cose che servono per andare in bicicletta', 'Cose che servono per fare una gita', 'Cose che servono per fare una grigliata', 'Cose che servono per apparecchiare la tavola', 'Cose che si trovano sul balcone', 'Cose che si trovano in un bosco', 'Cose che si trovano in un prato', 'Cose che si trovano nello spazio', 'Cose che si trovano in una camera d’albergo', 'Cose che si trovano sott’acqua'],
  11: ['Oggetti che contengono un liquido', 'Strumenti musicali a corda', 'Attrezzi da disegno tecnico', 'Oggetti che si usano per pulire', 'Cose che si trovano in una cassetta degli attrezzi', 'Animali che vivono in tana', 'Oggetti che contengono altri oggetti', 'Oggetti di vetro', 'Oggetti di legno', 'Oggetti di metallo', 'Oggetti che si accendono', 'Oggetti che si aprono e si chiudono', 'Oggetti di plastica', 'Oggetti di carta', 'Oggetti di stoffa', 'Oggetti di ceramica', 'Oggetti di gomma', 'Oggetti che funzionano a batteria', 'Oggetti che si tengono in tasca', 'Oggetti che si indossano ai piedi', 'Oggetti che si appendono', 'Oggetti con le ruote', 'Oggetti con il manico', 'Oggetti con i denti', 'Oggetti con i bottoni', 'Oggetti di lana', 'Oggetti di cotone', 'Oggetti di pelle', 'Oggetti d’argento', 'Oggetti d’oro', 'Oggetti di porcellana', 'Oggetti di terracotta', 'Oggetti di pietra', 'Oggetti di cartone', 'Oggetti di alluminio', 'Oggetti di ferro', 'Oggetti che si aprono con una chiave', 'Oggetti che si ricaricano'],
  12: ['Oggetti che fanno rumore quando cadono', 'Cose fredde', 'Strumenti a fiato', 'Animali a sangue freddo', 'Oggetti rotondi', 'Mestieri che si svolgono all\u2019aperto', 'Cose a righe', 'Mestieri notturni', 'Cose che volano', 'Cose che galleggiano', 'Cose che pungono', 'Cose calde', 'Cose che si piegano', 'Animali che vivono in gruppo', 'Cose che brillano', 'Cose che si sciolgono', 'Cose che si rompono facilmente', 'Cose che profumano', 'Cose morbide', 'Cose dure', 'Cose appiccicose', 'Cose trasparenti', 'Cose lunghe', 'Cose rosse', 'Cose gialle', 'Cose verdi', 'Cose che girano', 'Cose che si gonfiano', 'Cose che si raccolgono', 'Cose blu', 'Cose bianche', 'Cose nere', 'Cose arancioni', 'Cose che scottano', 'Cose che si tagliano', 'Cose che si lavano', 'Cose che si riempiono', 'Cose croccanti', 'Cose dolci', 'Cose fragili', 'Cose pesanti', 'Cose leggere'],
};
const LETTER_POOL_RARE = ['Z']; // lettera iniziale meno comune: usata solo quando quelle di LETTER_POOL sono già state tutte proposte al gruppo. La «H» è stata tolta: con 5-9 lettere ha meno di 12 parole italiane d'uso (verificato).
// Lettere iniziali VERIFICATE per lunghezza della parola (n = 5..9): per ciascuna almeno 12 parole italiane
// reali (dizionario Hunspell it_IT + frequenze d'uso), di cui almeno 6 frequenti (Zipf >= 3.0).
// Esito: tutte le lettere di LETTER_POOL passano a ogni lunghezza; la «Z» solo con 5, 7 e 8 lettere.
const INITIAL_LETTERS_BY_LENGTH = { 4: 'ABCDEFGILMNOPRSTUV', 5: 'ABCDEFGILMNOPRSTUVZ', 6: 'ABCDEFGILMNOPRSTUV', 7: 'ABCDEFGILMNOPRSTUVZ', 8: 'ABCDEFGILMNOPRSTUVZ', 9: 'ABCDEFGILMNOPRSTUV' };
const LETTER_POOL = 'A B C D E F G I L M N O P R S T U V'.split(' '); // usata per l'iniziale libera: già esclude lettere rare come inizio (H,Q,X,Y,W,J,K,Z)

// ---------------------------------------------------------------------------
// ACCESSO LESSICALE FONEMICO — 12 schemi fissi, uno per settimana (non più un
// ciclo di 7 schemi ogni 2 settimane). Ordine concordato con Rodrigo:
// 1 iniziale, 2 iniziale+penultima, 3 seconda+penultima, 4 terza+penultima,
// 5 congiunte, 6 disgiunte, 7 iniziale+categoria, 8 seconda+categoria,
// 9 terza+categoria, 10 iniziale+lunghezza, 11 seconda+lunghezza,
// 12 terza+lunghezza.
// Ogni banca posizionale (tranne le 3 "+categoria", vedi nota sotto) è
// verificata contro un dizionario italiano reale di ~60.000 forme di parola:
// tenuta solo se la combinazione ha almeno 15 parole realmente esistenti.
const PHONEMIC_DB = {
  firstPenultimate: [{l1:'S',l2:'T'}, {l1:'A',l2:'T'}, {l1:'R',l2:'T'}, {l1:'S',l2:'N'}, {l1:'C',l2:'T'}, {l1:'P',l2:'T'}, {l1:'D',l2:'T'}, {l1:'I',l2:'T'}, {l1:'S',l2:'V'}, {l1:'S',l2:'M'}, {l1:'A',l2:'R'}, {l1:'A',l2:'N'}, {l1:'S',l2:'R'}, {l1:'A',l2:'V'}, {l1:'C',l2:'R'}, {l1:'C',l2:'N'}, {l1:'S',l2:'A'}, {l1:'R',l2:'N'}, {l1:'S',l2:'E'}, {l1:'P',l2:'N'}, {l1:'R',l2:'V'}, {l1:'A',l2:'M'}, {l1:'D',l2:'R'}, {l1:'E',l2:'T'}, {l1:'V',l2:'T'}, {l1:'D',l2:'N'}, {l1:'T',l2:'N'}, {l1:'S',l2:'I'}, {l1:'I',l2:'R'}, {l1:'M',l2:'T'}, {l1:'F',l2:'T'}, {l1:'C',l2:'V'}, {l1:'S',l2:'D'}, {l1:'A',l2:'S'}, {l1:'I',l2:'N'}, {l1:'S',l2:'L'}, {l1:'P',l2:'V'}, {l1:'R',l2:'M'}, {l1:'D',l2:'V'}, {l1:'P',l2:'R'}, {l1:'R',l2:'S'}, {l1:'B',l2:'T'}, {l1:'O',l2:'T'}, {l1:'G',l2:'T'}, {l1:'P',l2:'S'}, {l1:'C',l2:'M'}, {l1:'I',l2:'V'}, {l1:'P',l2:'M'}, {l1:'C',l2:'S'}, {l1:'D',l2:'M'}, {l1:'T',l2:'V'}, {l1:'S',l2:'C'}, {l1:'L',l2:'T'}, {l1:'D',l2:'S'}, {l1:'T',l2:'R'}, {l1:'T',l2:'M'}, {l1:'M',l2:'N'}, {l1:'R',l2:'E'}, {l1:'R',l2:'A'}, {l1:'I',l2:'S'}],
  secondPenultimate: [{l1:'I',l2:'T'}, {l1:'O',l2:'T'}, {l1:'E',l2:'T'}, {l1:'A',l2:'T'}, {l1:'R',l2:'T'}, {l1:'N',l2:'T'}, {l1:'A',l2:'N'}, {l1:'I',l2:'N'}, {l1:'O',l2:'N'}, {l1:'E',l2:'N'}, {l1:'U',l2:'T'}, {l1:'I',l2:'R'}, {l1:'E',l2:'R'}, {l1:'C',l2:'T'}, {l1:'O',l2:'R'}, {l1:'I',l2:'V'}, {l1:'R',l2:'N'}, {l1:'A',l2:'R'}, {l1:'P',l2:'T'}, {l1:'O',l2:'V'}, {l1:'I',l2:'M'}, {l1:'I',l2:'S'}, {l1:'A',l2:'M'}, {l1:'R',l2:'V'}, {l1:'E',l2:'M'}, {l1:'M',l2:'T'}, {l1:'O',l2:'S'}, {l1:'E',l2:'V'}, {l1:'O',l2:'M'}, {l1:'S',l2:'T'}, {l1:'A',l2:'V'}, {l1:'E',l2:'S'}, {l1:'R',l2:'M'}, {l1:'U',l2:'N'}, {l1:'A',l2:'S'}, {l1:'B',l2:'T'}, {l1:'A',l2:'L'}, {l1:'F',l2:'T'}, {l1:'N',l2:'R'}, {l1:'L',l2:'T'}, {l1:'I',l2:'A'}, {l1:'R',l2:'S'}, {l1:'I',l2:'D'}, {l1:'E',l2:'L'}, {l1:'I',l2:'L'}, {l1:'U',l2:'R'}, {l1:'V',l2:'T'}, {l1:'N',l2:'V'}, {l1:'U',l2:'M'}, {l1:'O',l2:'L'}, {l1:'R',l2:'A'}, {l1:'D',l2:'T'}, {l1:'O',l2:'A'}, {l1:'I',l2:'E'}, {l1:'C',l2:'N'}, {l1:'P',l2:'N'}, {l1:'O',l2:'D'}, {l1:'A',l2:'I'}, {l1:'C',l2:'V'}, {l1:'U',l2:'V'}],
  thirdPenultimate: [{l1:'R',l2:'T'}, {l1:'A',l2:'T'}, {l1:'S',l2:'T'}, {l1:'N',l2:'T'}, {l1:'O',l2:'T'}, {l1:'C',l2:'T'}, {l1:'L',l2:'T'}, {l1:'E',l2:'T'}, {l1:'I',l2:'T'}, {l1:'P',l2:'T'}, {l1:'R',l2:'N'}, {l1:'M',l2:'T'}, {l1:'A',l2:'N'}, {l1:'G',l2:'T'}, {l1:'N',l2:'R'}, {l1:'S',l2:'N'}, {l1:'U',l2:'T'}, {l1:'A',l2:'V'}, {l1:'S',l2:'R'}, {l1:'L',l2:'N'}, {l1:'R',l2:'V'}, {l1:'O',l2:'N'}, {l1:'R',l2:'M'}, {l1:'A',l2:'M'}, {l1:'C',l2:'N'}, {l1:'F',l2:'T'}, {l1:'A',l2:'R'}, {l1:'S',l2:'V'}, {l1:'C',l2:'R'}, {l1:'T',l2:'N'}, {l1:'D',l2:'T'}, {l1:'V',l2:'T'}, {l1:'O',l2:'V'}, {l1:'R',l2:'S'}, {l1:'N',l2:'V'}, {l1:'I',l2:'N'}, {l1:'C',l2:'V'}, {l1:'E',l2:'N'}, {l1:'L',l2:'R'}, {l1:'B',l2:'T'}, {l1:'N',l2:'M'}, {l1:'O',l2:'M'}, {l1:'S',l2:'M'}, {l1:'T',l2:'R'}, {l1:'O',l2:'R'}, {l1:'M',l2:'N'}, {l1:'G',l2:'N'}, {l1:'L',l2:'M'}, {l1:'P',l2:'N'}, {l1:'L',l2:'V'}, {l1:'P',l2:'R'}, {l1:'I',l2:'M'}, {l1:'A',l2:'S'}, {l1:'N',l2:'S'}, {l1:'M',l2:'R'}, {l1:'E',l2:'M'}, {l1:'E',l2:'R'}, {l1:'P',l2:'V'}, {l1:'O',l2:'S'}, {l1:'E',l2:'V'}],
  joined: [{l1:'E',l2:'R'}, {l1:'R',l2:'E'}, {l1:'A',l2:'T'}, {l1:'T',l2:'E'}, {l1:'R',l2:'A'}, {l1:'T',l2:'A'}, {l1:'T',l2:'I'}, {l1:'S',l2:'T'}, {l1:'R',l2:'I'}, {l1:'A',l2:'N'}, {l1:'A',l2:'V'}, {l1:'A',l2:'S'}, {l1:'I',l2:'N'}, {l1:'I',l2:'A'}, {l1:'N',l2:'O'}, {l1:'V',l2:'A'}, {l1:'M',l2:'O'}, {l1:'O',l2:'N'}, {l1:'A',l2:'R'}, {l1:'C',l2:'O'}, {l1:'A',l2:'M'}, {l1:'R',l2:'O'}, {l1:'C',l2:'A'}, {l1:'T',l2:'O'}, {l1:'E',l2:'N'}, {l1:'D',l2:'I'}, {l1:'O',l2:'R'}, {l1:'S',l2:'E'}, {l1:'S',l2:'I'}, {l1:'L',l2:'A'}, {l1:'L',l2:'I'}, {l1:'E',l2:'S'}, {l1:'N',l2:'A'}, {l1:'N',l2:'T'}, {l1:'S',l2:'C'}, {l1:'A',l2:'L'}, {l1:'V',l2:'I'}, {l1:'D',l2:'E'}, {l1:'I',l2:'S'}, {l1:'O',l2:'L'}, {l1:'T',l2:'R'}, {l1:'N',l2:'D'}, {l1:'C',l2:'I'}, {l1:'I',l2:'T'}, {l1:'A',l2:'I'}, {l1:'L',l2:'E'}, {l1:'E',l2:'T'}, {l1:'S',l2:'A'}, {l1:'I',l2:'C'}, {l1:'P',l2:'R'}, {l1:'D',l2:'O'}, {l1:'P',l2:'E'}, {l1:'M',l2:'A'}, {l1:'N',l2:'I'}, {l1:'P',l2:'A'}, {l1:'V',l2:'O'}, {l1:'I',l2:'M'}, {l1:'S',l2:'P'}, {l1:'N',l2:'E'}, {l1:'O',l2:'S'}],
  disjoint: [{l1:'R',l2:'T'}, {l1:'S',l2:'T'}, {l1:'R',l2:'S'}, {l1:'N',l2:'R'}, {l1:'N',l2:'T'}, {l1:'N',l2:'S'}, {l1:'C',l2:'R'}, {l1:'P',l2:'R'}, {l1:'C',l2:'S'}, {l1:'M',l2:'R'}, {l1:'C',l2:'T'}, {l1:'D',l2:'R'}, {l1:'R',l2:'V'}, {l1:'C',l2:'N'}, {l1:'P',l2:'S'}, {l1:'L',l2:'T'}, {l1:'L',l2:'R'}, {l1:'D',l2:'N'}, {l1:'M',l2:'T'}, {l1:'L',l2:'S'}, {l1:'P',l2:'T'}, {l1:'T',l2:'V'}, {l1:'G',l2:'R'}, {l1:'S',l2:'V'}, {l1:'M',l2:'S'}, {l1:'M',l2:'N'}, {l1:'D',l2:'T'}, {l1:'N',l2:'V'}, {l1:'D',l2:'S'}, {l1:'L',l2:'N'}, {l1:'G',l2:'N'}, {l1:'C',l2:'L'}, {l1:'N',l2:'P'}, {l1:'G',l2:'S'}, {l1:'C',l2:'M'}, {l1:'B',l2:'R'}, {l1:'G',l2:'T'}, {l1:'L',l2:'V'}, {l1:'F',l2:'R'}, {l1:'L',l2:'M'}, {l1:'C',l2:'P'}, {l1:'M',l2:'P'}, {l1:'C',l2:'V'}, {l1:'G',l2:'L'}, {l1:'C',l2:'D'}, {l1:'L',l2:'P'}, {l1:'B',l2:'T'}, {l1:'F',l2:'T'}, {l1:'M',l2:'V'}, {l1:'D',l2:'M'}, {l1:'B',l2:'S'}, {l1:'D',l2:'V'}, {l1:'F',l2:'N'}, {l1:'F',l2:'S'}, {l1:'D',l2:'L'}, {l1:'P',l2:'V'}, {l1:'G',l2:'V'}, {l1:'D',l2:'P'}, {l1:'B',l2:'L'}, {l1:'B',l2:'N'}],
};
const LETTER_LENGTH_BANK = [{l:'A',n:4}, {l:'A',n:5}, {l:'A',n:6}, {l:'A',n:7}, {l:'B',n:4}, {l:'B',n:5}, {l:'B',n:6}, {l:'B',n:7}, {l:'C',n:4}, {l:'C',n:5}, {l:'C',n:6}, {l:'C',n:7}, {l:'D',n:4}, {l:'D',n:5}, {l:'D',n:6}, {l:'D',n:7}, {l:'E',n:4}, {l:'E',n:5}, {l:'E',n:6}, {l:'E',n:7}, {l:'F',n:4}, {l:'F',n:5}, {l:'F',n:6}, {l:'F',n:7}, {l:'G',n:4}, {l:'G',n:5}, {l:'G',n:6}, {l:'G',n:7}, {l:'I',n:5}, {l:'I',n:6}, {l:'I',n:7}, {l:'L',n:4}, {l:'L',n:5}, {l:'L',n:6}, {l:'L',n:7}, {l:'M',n:4}, {l:'M',n:5}, {l:'M',n:6}, {l:'M',n:7}, {l:'N',n:4}, {l:'N',n:5}, {l:'N',n:6}, {l:'N',n:7}, {l:'O',n:4}, {l:'O',n:5}, {l:'O',n:6}, {l:'O',n:7}, {l:'P',n:4}, {l:'P',n:5}, {l:'P',n:6}, {l:'P',n:7}, {l:'R',n:4}, {l:'R',n:5}, {l:'R',n:6}, {l:'R',n:7}, {l:'S',n:4}, {l:'S',n:5}, {l:'S',n:6}, {l:'S',n:7}, {l:'T',n:4}, {l:'T',n:5}, {l:'T',n:6}, {l:'T',n:7}, {l:'U',n:4}, {l:'U',n:5}, {l:'U',n:6}, {l:'U',n:7}, {l:'V',n:4}, {l:'V',n:5}, {l:'V',n:6}, {l:'V',n:7}];
const SECOND_LENGTH_BANK = [{l:'A',n:7}, {l:'I',n:7}, {l:'O',n:7}, {l:'E',n:7}, {l:'R',n:7}, {l:'A',n:6}, {l:'E',n:6}, {l:'U',n:7}, {l:'I',n:6}, {l:'O',n:6}, {l:'A',n:5}, {l:'R',n:6}, {l:'E',n:5}, {l:'O',n:5}, {l:'N',n:7}, {l:'U',n:6}, {l:'I',n:5}, {l:'C',n:7}, {l:'P',n:7}, {l:'T',n:7}, {l:'U',n:5}, {l:'S',n:7}, {l:'R',n:5}, {l:'L',n:7}, {l:'T',n:6}, {l:'M',n:7}, {l:'A',n:4}, {l:'C',n:6}, {l:'P',n:6}, {l:'N',n:6}, {l:'B',n:7}, {l:'E',n:4}, {l:'L',n:6}, {l:'O',n:4}, {l:'F',n:7}, {l:'V',n:7}, {l:'D',n:7}, {l:'M',n:6}, {l:'S',n:6}, {l:'I',n:4}, {l:'U',n:4}, {l:'G',n:7}, {l:'V',n:6}, {l:'D',n:6}, {l:'P',n:5}, {l:'C',n:5}, {l:'T',n:5}, {l:'B',n:6}, {l:'F',n:6}, {l:'S',n:5}, {l:'M',n:5}, {l:'R',n:4}, {l:'G',n:6}, {l:'L',n:5}, {l:'N',n:5}, {l:'V',n:5}, {l:'B',n:5}, {l:'D',n:5}, {l:'F',n:5}, {l:'N',n:4}];
const THIRD_LENGTH_BANK = [{l:'R',n:7}, {l:'S',n:7}, {l:'N',n:7}, {l:'L',n:7}, {l:'A',n:7}, {l:'T',n:7}, {l:'O',n:7}, {l:'I',n:7}, {l:'E',n:7}, {l:'R',n:6}, {l:'C',n:7}, {l:'A',n:6}, {l:'G',n:7}, {l:'L',n:6}, {l:'E',n:6}, {l:'R',n:5}, {l:'P',n:7}, {l:'M',n:7}, {l:'U',n:7}, {l:'N',n:6}, {l:'I',n:6}, {l:'T',n:6}, {l:'O',n:6}, {l:'C',n:6}, {l:'N',n:5}, {l:'G',n:6}, {l:'D',n:7}, {l:'L',n:5}, {l:'S',n:6}, {l:'D',n:6}, {l:'A',n:5}, {l:'S',n:5}, {l:'V',n:7}, {l:'M',n:6}, {l:'I',n:5}, {l:'V',n:6}, {l:'O',n:5}, {l:'E',n:5}, {l:'P',n:6}, {l:'U',n:6}, {l:'T',n:5}, {l:'F',n:7}, {l:'B',n:7}, {l:'Z',n:7}, {l:'R',n:4}, {l:'G',n:5}, {l:'U',n:5}, {l:'S',n:4}, {l:'B',n:6}, {l:'L',n:4}, {l:'T',n:4}, {l:'N',n:4}, {l:'C',n:5}, {l:'P',n:5}, {l:'F',n:6}, {l:'M',n:5}, {l:'Z',n:5}, {l:'D',n:4}, {l:'D',n:5}, {l:'M',n:4}];
// Categorie larghe per gli schemi 7-9 (lettera + categoria). Ogni coppia (lettera, categoria) qui sotto è stata
// VERIFICATA con un lessico di parole italiane reali (Hunspell it_IT + frequenze d'uso) raggruppate per categoria:
// tenuta solo se ha almeno 12 parole utilizzabili, di cui almeno 6 frequenti (Zipf >= 3.0; le altre sono d'uso meno comune
// ma reali). Il conteggio è un MINIMO (il lessico per categoria è curato a mano e non esaustivo). Le lettere che non
// raggiungono la soglia con una categoria semplicemente non compaiono (es. «seconda lettera Z + Frutta»: nessuna parola).
const CATEGORY_LETTER_BANK = {
  initialCategory: [['A','Alimenti'], ['B','Alimenti'], ['C','Alimenti'], ['F','Alimenti'], ['G','Alimenti'], ['L','Alimenti'], ['M','Alimenti'], ['P','Alimenti'], ['R','Alimenti'], ['S','Alimenti'], ['T','Alimenti'], ['B','Animali'], ['C','Animali'], ['G','Animali'], ['L','Animali'], ['M','Animali'], ['P','Animali'], ['R','Animali'], ['S','Animali'], ['T','Animali'], ['A','Oggetti di casa'], ['B','Oggetti di casa'], ['C','Oggetti di casa'], ['F','Oggetti di casa'], ['L','Oggetti di casa'], ['M','Oggetti di casa'], ['P','Oggetti di casa'], ['S','Oggetti di casa'], ['T','Oggetti di casa'], ['B','Indumenti'], ['C','Indumenti'], ['P','Indumenti'], ['S','Indumenti'], ['C','Mezzi di trasporto'], ['M','Mezzi di trasporto'], ['A','Edifici'], ['C','Edifici'], ['M','Edifici'], ['P','Edifici'], ['A','Mestieri'], ['C','Mestieri'], ['M','Mestieri'], ['P','Mestieri'], ['C','Parti del corpo'], ['P','Parti del corpo'], ['C','Frutta e verdura'], ['P','Frutta e verdura'], ['C','Piante e fiori'], ['P','Piante e fiori'], ['P','Sport e giochi']],
  secondCategory: [['A','Alimenti'], ['E','Alimenti'], ['I','Alimenti'], ['O','Alimenti'], ['R','Alimenti'], ['U','Alimenti'], ['A','Animali'], ['E','Animali'], ['I','Animali'], ['O','Animali'], ['R','Animali'], ['U','Animali'], ['A','Oggetti di casa'], ['E','Oggetti di casa'], ['I','Oggetti di casa'], ['O','Oggetti di casa'], ['R','Oggetti di casa'], ['U','Oggetti di casa'], ['A','Indumenti'], ['I','Indumenti'], ['O','Indumenti'], ['A','Mezzi di trasporto'], ['E','Mezzi di trasporto'], ['I','Mezzi di trasporto'], ['O','Mezzi di trasporto'], ['U','Mezzi di trasporto'], ['A','Strumenti e attrezzi'], ['E','Strumenti e attrezzi'], ['I','Strumenti e attrezzi'], ['O','Strumenti e attrezzi'], ['A','Edifici'], ['I','Edifici'], ['O','Edifici'], ['A','Mestieri'], ['E','Mestieri'], ['I','Mestieri'], ['O','Mestieri'], ['A','Parti del corpo'], ['E','Parti del corpo'], ['I','Parti del corpo'], ['O','Parti del corpo'], ['A','Frutta e verdura'], ['E','Frutta e verdura'], ['I','Frutta e verdura'], ['A','Piante e fiori'], ['E','Piante e fiori'], ['I','Piante e fiori'], ['R','Piante e fiori'], ['A','Sport e giochi'], ['O','Sport e giochi']],
  thirdCategory: [['A','Alimenti'], ['C','Alimenti'], ['E','Alimenti'], ['G','Alimenti'], ['I','Alimenti'], ['L','Alimenti'], ['M','Alimenti'], ['N','Alimenti'], ['O','Alimenti'], ['P','Alimenti'], ['R','Alimenti'], ['S','Alimenti'], ['T','Alimenti'], ['A','Animali'], ['C','Animali'], ['I','Animali'], ['L','Animali'], ['N','Animali'], ['P','Animali'], ['R','Animali'], ['S','Animali'], ['A','Oggetti di casa'], ['C','Oggetti di casa'], ['L','Oggetti di casa'], ['M','Oggetti di casa'], ['N','Oggetti di casa'], ['P','Oggetti di casa'], ['R','Oggetti di casa'], ['S','Oggetti di casa'], ['T','Oggetti di casa'], ['V','Oggetti di casa'], ['L','Indumenti'], ['N','Indumenti'], ['R','Mezzi di trasporto'], ['T','Mezzi di trasporto'], ['N','Strumenti e attrezzi'], ['N','Edifici'], ['R','Edifici'], ['S','Edifici'], ['R','Mestieri'], ['S','Mestieri'], ['T','Mestieri'], ['A','Parti del corpo'], ['C','Parti del corpo'], ['L','Parti del corpo'], ['N','Parti del corpo'], ['R','Parti del corpo'], ['L','Piante e fiori'], ['R','Piante e fiori'], ['S','Piante e fiori'], ['L','Sport e giochi']],
};
const BROAD_CATEGORIES = ['Alimenti', 'Animali', 'Edifici', 'Frutta e verdura', 'Indumenti', 'Mestieri', 'Mezzi di trasporto', 'Oggetti di casa', 'Parti del corpo', 'Piante e fiori', 'Sport e giochi', 'Strumenti e attrezzi'];

// I 12 schemi, uno per settimana (non più un ciclo di 7 ogni 2 settimane).
const LEXICAL_SCHEME_BY_WEEK = [null,
  'initial', 'firstPenultimate', 'secondPenultimate', 'thirdPenultimate',
  'joined', 'disjoint',
  'initialCategory', 'secondCategory', 'thirdCategory',
  'initialLength', 'secondLength', 'thirdLength',
];

const LEXICAL_LABELS = {
  initial: n => `Scrivere parole di ${n} lettere con l'iniziale indicata (almeno 3 per riga)`,
  firstPenultimate: () => `Scrivere parole che abbiano come iniziale e penultima lettera quelle indicate (almeno 3 per riga)`,
  secondPenultimate: () => `Scrivere parole che abbiano come seconda e penultima lettera quelle indicate (almeno 3 per riga)`,
  thirdPenultimate: () => `Scrivere parole che abbiano come terza e penultima lettera quelle indicate (almeno 3 per riga)`,
  joined: () => `Scrivere parole che abbiano le seguenti lettere congiunte (almeno 4 per riga)`,
  disjoint: () => `Scrivere parole che abbiano le seguenti lettere disgiunte (almeno 4 per riga)`,
  initialCategory: () => `Scrivere parole che rispettino lettera iniziale e categoria indicate (almeno 3 per riga)`,
  secondCategory: () => `Scrivere parole che rispettino la seconda lettera e la categoria indicate (almeno 3 per riga)`,
  thirdCategory: () => `Scrivere parole che rispettino la terza lettera e la categoria indicate (almeno 3 per riga)`,
  initialLength: () => `Scrivere parole che rispettino lettera iniziale e numero di lettere indicati (almeno 3 per riga)`,
  secondLength: () => `Scrivere parole che rispettino la seconda lettera e il numero di lettere indicati (almeno 3 per riga)`,
  thirdLength: () => `Scrivere parole che rispettino la terza lettera e il numero di lettere indicati (almeno 3 per riga)`,
};

// Prompt "posizione+penultima" (schemi 2-4): stessa idea di prima ma con
// un'etichetta esplicita della posizione, così i tre schemi restano
// distinguibili invece di condividere lo stesso formato ambiguo "-X...Y-".
function buildPositionalPrompts(kind, rnd, count = 10, excludeKeys) {
  const bank = PHONEMIC_DB[kind];
  const excl = excludeKeys ? new Set(excludeKeys) : null;
  // Solo coppie MAI proposte a questo gruppo: niente ripescaggi né duplicati. Se ne restano meno di
  // `count`, se ne restituiscono meno (`shortfall` lo segnala all'app).
  const fresh = excl && excl.size ? bank.filter(e => !excl.has(e.l1 + e.l2)) : bank;
  const chosen = shuffleArr(rnd, fresh).slice(0, count);
  const posLabel = { firstPenultimate: 'iniziale', secondPenultimate: 'seconda lettera', thirdPenultimate: 'terza lettera' };
  const out = chosen.map(({l1,l2}) => {
    if (kind === 'joined') return `..${l1}${l2}..`;
    if (kind === 'disjoint') return `${l1} ; ${l2}`;
    return `${posLabel[kind]} «${l1}», penultima «${l2}»`;
  });
  out.shortfall = count - out.length;
  return out;
}

function buildCombinedPrompts(kind, rnd, count = 10, excludeKeys, excludeCategories) {
  const excl = excludeKeys ? new Set(excludeKeys) : null;
  const catExclSet = excludeCategories && excludeCategories.length ? new Set(excludeCategories) : null;
  const rows = [];
  const catLabel = { initialCategory: 'Lettera iniziale', secondCategory: 'Seconda lettera', thirdCategory: 'Terza lettera' };
  const lenBank = { initialLength: LETTER_LENGTH_BANK, secondLength: SECOND_LENGTH_BANK, thirdLength: THIRD_LENGTH_BANK };
  const lenLabel = { initialLength: 'Lettera iniziale', secondLength: 'Seconda lettera', thirdLength: 'Terza lettera' };
  if (kind === 'initialCategory' || kind === 'secondCategory' || kind === 'thirdCategory') {
    // Si pesca SOLO tra le coppie (lettera, categoria) verificate in CATEGORY_LETTER_BANK (>= 12 parole reali,
    // non tutte rare), mai tra combinazioni casuali. Solo coppie MAI proposte a questo gruppo; tra queste si
    // preferiscono quelle la cui categoria non è già comparsa nella pagina "categorie" dello stesso fascicolo/gruppo.
    const fresh = CATEGORY_LETTER_BANK[kind].filter(([l, c]) => !(excl && excl.has(l + '|' + c)));
    const preferred = shuffleArr(rnd, catExclSet ? fresh.filter(([, c]) => !catExclSet.has(c)) : fresh);
    const others = shuffleArr(rnd, catExclSet ? fresh.filter(([, c]) => catExclSet.has(c)) : []);
    const usedLetters = new Map(); // evita di riempire la pagina con la stessa lettera/categoria più di 2 volte
    const usedCats = new Map();
    const order = preferred.concat(others);
    const pickRows = (limit) => {
      for (const [l, c] of order) {
        if (rows.length >= count) break;
        const key = l + '|' + c;
        if (rows.some(r => r.key === key)) continue;
        if ((usedLetters.get(l) || 0) >= limit || (usedCats.get(c) || 0) >= limit) continue;
        usedLetters.set(l, (usedLetters.get(l) || 0) + 1);
        usedCats.set(c, (usedCats.get(c) || 0) + 1);
        rows.push({ key, text: `${catLabel[kind]} «${l}», categoria: ${c}` });
      }
    };
    pickRows(2);            // prima varietà (max 2 per lettera e per categoria)
    if (rows.length < count) pickRows(3);
    if (rows.length < count) pickRows(count); // se la banca fresca è quasi esaurita, si allenta il tetto
    const out = rows.map(r => r.text);
    out.shortfall = count - out.length;
    return out;
  }
  // initialLength / secondLength / thirdLength: banche già verificate (>= 12 parole per combinazione)
  const used = new Set();
  let guard = 0;
  while (rows.length < count && guard < 500) {
    guard++;
    const { l: letter, n: len } = pick(rnd, lenBank[kind]);
    const key = letter + '|' + len;
    if (used.has(key)) continue;
    if (excl && excl.has(key)) continue;
    used.add(key);
    rows.push(`${lenLabel[kind]} «${letter}», ${len} lettere`);
  }
  // Niente più riempimento con righe duplicate: se le combinazioni nuove finiscono, se ne restituiscono meno.
  rows.shortfall = count - rows.length;
  return rows;
}
function combinedKeyFromPrompt(kind, promptStr) {
  const m = promptStr.match(/«(.+?)»/);
  const numMatch = promptStr.match(/(\d+) lettere/);
  const catMatch = promptStr.match(/categoria: (.+?)$/i);
  if (kind === 'initialCategory' || kind === 'secondCategory' || kind === 'thirdCategory') return (m ? m[1] : '') + '|' + (catMatch ? catMatch[1] : '');
  if (kind === 'initialLength' || kind === 'secondLength' || kind === 'thirdLength') return (m ? m[1] : '') + '|' + (numMatch ? numMatch[1] : '');
  return promptStr;
}
function shuffleArr(rnd, arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){ const j = Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

// ---------------------------------------------------------------------------
// 11. PARAMETRI DI SETTIMANA — assembla tutti i blocchi secondo il gradiente
//     osservato nei 15 fascicoli originali, ed estende la stessa logica oltre
//     la settimana 8.
// ---------------------------------------------------------------------------
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ---------------------------------------------------------------------------
// PIANO SETTIMANALE FISSO (settimane 1-12) — sostituisce le vecchie formule
// aperte (che continuavano oltre la settimana 16-20): il fascicolo ora ha una
// durata totale fissata a 12 settimane, con una progressione precisa
// settimana per settimana concordata con Rodrigo, non più estrapolata.
// ---------------------------------------------------------------------------
const FASCICOLO_MAX_WEEK = 12;

// Griglie di ricerca-sequenza: SEMPRE 3 (non scendono più a 2), materiale che
// diventa via via meno comune. Le famiglie sono quelle già definite in
// SYMBOL_FAMILIES; dalla settimana 9 si usano combinazioni miste (mixKey) per
// restare comunque diverse settimana per settimana anche esaurite le famiglie
// "pure".
const WEEK_GRID_FAMILIES = [
  null,
  ['digits', 'latin', 'shapes'],
  ['latin', 'shapes', 'cyrillic'],
  ['shapes', 'cyrillic', 'arrows'],
  ['cyrillic', 'arrows', 'mathSymbols'],
  ['arrows', 'mathSymbols', 'linesMixed'],
  ['mathSymbols', 'linesMixed', 'runes'],
  ['linesMixed', 'runes', 'syllabics'],
  ['runes', 'syllabics', mixKeyLazy('w8mix', 'mathSymbols', 'linesMixed')],
  ['syllabics', mixKeyLazy('w9mixA', 'runes', 'cyrillic'), mixKeyLazy('w9mixB', 'shapes', 'arrows')],
  [mixKeyLazy('w10mixA', 'runes', 'syllabics'), mixKeyLazy('w10mixB', 'linesMixed', 'mathSymbols'), mixKeyLazy('w10mixC', 'cyrillic', 'arrows')],
  [mixKeyLazy('w11mixA', 'syllabics', 'runes'), mixKeyLazy('w11mixB', 'mathSymbols', 'cyrillic'), mixKeyLazy('w11mixC', 'shapes', 'linesMixed')],
  [mixKeyLazy('w12mixA', 'runes', 'mathSymbols'), mixKeyLazy('w12mixB', 'syllabics', 'linesMixed'), mixKeyLazy('w12mixC', 'cyrillic', 'arrows')],
];
// mixKey() viene chiamata a runtime (non in fase di definizione dell'array,
// che gira prima che mixKey sia utilizzabile su alcune combinazioni) tramite
// questo wrapper pigro.
function mixKeyLazy(name, a, b) { return () => mixKey(name, a, b); }
function resolveWeekFamilies(week) {
  return WEEK_GRID_FAMILIES[week].map(k => (typeof k === 'function' ? k() : k));
}

// Lunghezza del bersaglio nelle 3 griglie principali, nella griglia mista e nel
// crucipuzzle: 4 caratteri fino alla settimana 3, 5 dalla 4ª, 6 dall'8ª.
function gridSeqLenForWeek(w) { return w >= 8 ? 6 : (w >= 4 ? 5 : 4); }

// Distrattori (sequenze simili ma non identiche al bersaglio, per aumentare la
// discriminazione richiesta): assenti nelle prime 2 settimane, poi crescono
// gradualmente. Numero scelto come proposta di default — modificabile.
function distractorCountForWeek(w) {
  if (w <= 2) return 0;
  if (w <= 4) return 1;
  if (w <= 6) return 2;
  if (w <= 8) return 3;
  if (w <= 10) return 4;
  return 5;
}

// Labirinto: stessa crescita di prima (2 celle per lato a settimana) ma tarata
// per fermarsi esattamente alla settimana 12 invece di continuare oltre.
function mazeSizeForWeek(w) {
  return { cols: 18 + 2 * Math.min(w, FASCICOLO_MAX_WEEK), rows: 22 + 2 * Math.min(w, FASCICOLO_MAX_WEEK) };
}

// Sequenziamento ("unire in ordine"): 21 elementi alla settimana 1, +2 a
// settimana fino all'8ª (35), poi stabile. Tipo di elemento secondo la
// settimana — vedi sequencingInstructionText() per il testo dell'istruzione.
function sequencingSpecForWeek(w) {
  const count = 21 + 2 * (Math.min(w, 8) - 1);
  if (w <= 2) return { mode: 'digits', digitLens: [1, 2], count };
  if (w <= 4) return { mode: 'digits', digitLens: [2], count };
  if (w <= 6) return { mode: 'digits', digitLens: [2, 3], count };
  if (w <= 8) return { mode: 'letters', letterLen: 2, count };
  if (w <= 10) return { mode: 'letters', letterLen: 3, count };
  return { mode: 'mixed', count };
}

// Calcolo: sempre addizioni/sottrazioni, mai un numero ripetuto nella stessa
// riga, mai un totale negativo. Lunghezza della catena NON cresce in modo
// lineare: si allunga fino a 6 termini poi si accorcia di nuovo quando i
// numeri diventano a 3 cifre (altrimenti sarebbe irragionevolmente difficile).
function calcSpecForWeek(w) {
  if (w <= 2) return { terms: 4, digitLens: [1, 2] };
  if (w <= 4) return { terms: 4, digitLens: [2] };
  if (w <= 6) return { terms: 5, digitLens: [2] };
  if (w <= 8) return { terms: 6, digitLens: [2] };
  if (w <= 10) return { terms: 5, digitLens: [2, 3] };
  return { terms: 4, digitLens: [3] };
}

function weekParams(week) {
  const w = Math.max(1, Math.min(FASCICOLO_MAX_WEEK, week));
  const familyKeys = resolveWeekFamilies(w);
  const seqLen = gridSeqLenForWeek(w);
  const distractorCount = distractorCountForWeek(w);
  const maze = mazeSizeForWeek(w);
  const sequencing = sequencingSpecForWeek(w);
  const calc = calcSpecForWeek(w);

  // Accesso lessicale: ora 12 schemi fissi, uno per settimana (vedi
  // LEXICAL_SCHEME_BY_WEEK), non più un ciclo di 7 ogni 2 settimane.
  const lexicalKind = LEXICAL_SCHEME_BY_WEEK[w];
  const lexicalInitialLength = clamp(5 + Math.floor((w - 1) / 8), 5, 9);
  // Categoria semantica: 12 fasce fisse, una per settimana (non più 3 fasce larghe).
  const categoryTier = w;
  const categoryMinWords = clamp(5 + Math.floor(w / 4), 5, 8);
  const categoryCount = 6;
  const anagramLen = clamp(5 + Math.floor((w - 1) / 3), 5, 9);

  return {
    week: w,
    grids: familyKeys.map(key => ({ familyKey: key, family: SYMBOL_FAMILIES[key] })),
    seqLen, distractorCount,
    multiTargetCount: 12,
    crucipuzzleTargetCount: 12,
    sequencing,
    mazeCols: maze.cols, mazeRows: maze.rows,
    calc,
    lexicalKind, lexicalInitialLength,
    categoryTier, categoryMinWords, categoryCount,
    anagramLen,
  };
}

// ---------------------------------------------------------------------------
// 12. RENDER SVG — usate sia per l'anteprima a schermo sia (rasterizzate in
//     PNG) per l'inserimento nel .docx. Stessa funzione in Node e browser.
// ---------------------------------------------------------------------------
function escapeXml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function renderMazeSVG(maze, cellSize = 24, showSolution = false) {
  const { cols, rows, cells } = maze;
  const pad = 40;
  const w = cols * cellSize + pad * 2;
  const h = rows * cellSize + pad * 2 + 20;
  let lines = '';
  const stroke = (x1, y1, x2, y2) => { lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="3" stroke-linecap="square"/>`; };
  const [sx, sy] = maze.start, [ex, ey] = maze.end;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = cells[y][x];
      const x0 = pad + x * cellSize, y0 = pad + 20 + y * cellSize;
      const x1 = x0 + cellSize, y1 = y0 + cellSize;
      // Apertura reale nel perimetro: un varco tagliato nel muro esterno in
      // corrispondenza della cella di partenza (lato sinistro) e di quella di
      // arrivo (lato destro) — prima qui si chiudeva SEMPRE il bordo esterno,
      // e "INIZIO/FINE" erano solo etichette di testo sovrapposte al muro.
      const isStartWall = (x === 0 && y === sy);
      const isEndWall = (x === cols - 1 && y === ey);
      if (c.N) stroke(x0, y0, x1, y0);
      if (c.W && !isStartWall) stroke(x0, y0, x0, y1);
      if ((c.E || x === cols - 1) && !isEndWall) stroke(x1, y0, x1, y1);
      if (c.S || y === rows - 1) stroke(x0, y1, x1, y1);
    }
  }
  const startX = pad, startY = pad + 20 + (sy + 0.5) * cellSize;
  const endX = pad + cols * cellSize, endY = pad + 20 + (ey + 0.5) * cellSize;
  // Percorso soluzione: SOLO quando esplicitamente richiesto (mai nell'esportazione,
  // solo nell'anteprima app con "Mostra risposta") — una linea colorata che passa per
  // il centro di ogni cella del percorso più breve trovato con la BFS.
  let solutionPath = '';
  if (showSolution) {
    const path = solveMaze(maze);
    const pts = path.map(([x, y]) => `${pad + (x + 0.5) * cellSize},${pad + 20 + (y + 0.5) * cellSize}`).join(' ');
    solutionPath = `<polyline points="${pts}" fill="none" stroke="#2F6F63" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
  }
  // Niente titolo dentro l'SVG: sia l'app (section/fSection) sia il documento
  // esportato (heading() in docbuilder) aggiungono già il proprio titolo fuori
  // dall'immagine — prima comparivano entrambi, uno duplicato dell'altro.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="white"/>
    ${lines}
    ${solutionPath}
    <text x="${pad-6}" y="${startY-10}" font-size="14" font-weight="bold" text-anchor="start" font-family="Arial">INIZIO</text>
    <text x="${endX-6}" y="${endY+24}" font-size="14" font-weight="bold" text-anchor="end" font-family="Arial">FINE</text>
  </svg>`;
}

function renderSequencingSVG(seq, width = 700, height = 950) {
  let circles = '';
  seq.points.forEach(p => {
    circles += `<circle cx="${p.x}" cy="${p.y}" r="26" fill="white" stroke="black" stroke-width="2"/>`;
    circles += `<text x="${p.x}" y="${p.y+7}" font-size="20" text-anchor="middle" font-family="Arial">${escapeXml(p.value)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="white"/>
    ${circles}
  </svg>`;
}

// ---------------------------------------------------------------------------
// 13. ORCHESTRATORE — genera il contenuto completo di un fascicolo per una
//     data settimana. Usato sia dall'anteprima HTML sia dall'export .docx,
//     così le due viste sono sempre coerenti tra loro.
// ---------------------------------------------------------------------------
function buildFascicolo(week, seed, exclusions) {
  const rnd = mulberry32(seed >>> 0);
  const p = weekParams(week);
  const excl = exclusions || {};

  // Le prime 3 griglie occupano l'intera pagina (25 righe): sempre 3, mai 2,
  // con lunghezza del bersaglio e distrattori secondo la settimana.
  const grids = p.grids.map(g => generateSequenceGrid(25, 12, g.family.chars, rnd, {
    seqLen: p.seqLen, distractorCount: p.distractorCount,
  }));
  // Griglia mista (4ª, volutamente più piccola): stessa lunghezza bersaglio
  // delle prime 3, sempre 12 bersagli su orizzontale/verticale/obliquo.
  const multi = generateMultiTargetGrid(16, 12, p.grids[0].family.chars, rnd, p.multiTargetCount, p.seqLen);
  // Crucipuzzle (5°): stessa famiglia/lunghezza della settimana, ma piazzato
  // in tutte e 8 le direzioni (non solo H/V/obliqua) — è questo a crescere in
  // complessità, non più solo la ricerca di parole italiane reali.
  // Crucipuzzle (5°): a differenza delle altre griglie, qui NON c'è materiale a simboli
  // né un elenco bersaglio — parole italiane reali, ricerca libera (vedi
  // generateItalianCrucipuzzle qui sopra in engine.js).
  // Materiale MAI ripetuto: parole (anagrammi + crucipuzzle) e categorie già proposte a questo gruppo
  // (`exclusions`, dalla cronologia) vengono escluse; dentro lo stesso fascicolo le parole degli
  // anagrammi non tornano nel crucipuzzle. Se il materiale nuovo non basta, la pagina ne contiene
  // di meno e `notices` lo segnala (mai ripescaggi silenziosi).
  const notices = [];
  const usedWords = new Set([...(excl.anagramWords || []), ...(excl.crucipuzzleWords || [])]);
  const anagrams = generateAnagrams(10, p.anagramLen, rnd, [...usedWords], p.week);
  if (anagrams.shortfall > 0) notices.push(`Anagrammi: solo ${anagrams.length} parole mai proposte a questo gruppo (ne servivano 10).`);
  anagrams.forEach(a => usedWords.add(a.solution));
  const crucipuzzle = generateItalianCrucipuzzle(16, 12, rnd, week, [...usedWords]);
  if (crucipuzzle.shortfall > 0) notices.push(`Crucipuzzle: solo ${crucipuzzle.plantedWords.length} parole nuove piazzate (ne servivano di più).`);
  const sequencing = generateSequencingV2(p.sequencing, rnd);
  const maze = generateMaze(p.mazeCols, p.mazeRows, rnd);
  const calc = generateCalcChain(10, p.calc.terms, p.calc.digitLens, rnd);

  const catPool = CATEGORY_POOL[p.categoryTier];
  const catExcl = exclusions && exclusions.categories ? new Set(exclusions.categories) : null;
  const catFresh = catExcl && catExcl.size ? catPool.filter(c => !catExcl.has(c)) : catPool;
  const categories = pickN(rnd, catFresh, Math.min(p.categoryCount, catFresh.length));
  if (categories.length < p.categoryCount) notices.push(`Categorie: solo ${categories.length} categorie mai proposte a questo gruppo a questo livello (ne servivano ${p.categoryCount}).`);

  let lexicalPrompts, lexicalHistoryKeys;
  let initialLen = p.lexicalInitialLength;
  if (p.lexicalKind === 'initial') {
    // Chiavi di cronologia "initial:LETTERA:LUNGHEZZA" (le vecchie "initial:LETTERA" valgono per le parole di 5 lettere).
    // La pagina ha UNA lunghezza: si tiene quella prevista dalla settimana finché restano abbastanza lettere nuove,
    // altrimenti si passa a una lunghezza vicina (4, 5, 6, 7) — così la settimana 1 regge più cicli senza ripetere.
    const usedInitial = new Set((excl.lexicalKeys || []).filter(k => k.startsWith('initial:')).map(k => { const q = k.split(':'); return q[1] + ':' + (q[2] || '5'); }));
    // prima le lettere "comode" (LETTER_POOL), poi, solo se servono, le altre lettere italiane; sempre e solo
    // lettere VERIFICATE per la lunghezza richiesta (INITIAL_LETTERS_BY_LENGTH: >= 12 parole reali)
    const freshFor = (len, pool) => pool.filter(l => (INITIAL_LETTERS_BY_LENGTH[len] || '').includes(l) && !usedInitial.has(l + ':' + len));
    const lens = [p.lexicalInitialLength].concat([5, 6, 4, 7].filter(n => n !== p.lexicalInitialLength));
    let bestLen = lens[0], bestN = -1;
    for (const n of lens) {
      const c = freshFor(n, LETTER_POOL).length + freshFor(n, LETTER_POOL_RARE).length;
      if (c >= 8) { bestLen = n; bestN = c; break; }
      if (c > bestN) { bestN = c; bestLen = n; }
    }
    initialLen = bestLen;
    const freshMain = freshFor(initialLen, LETTER_POOL);
    const freshRare = freshFor(initialLen, LETTER_POOL_RARE);
    const main = pickN(rnd, freshMain, Math.min(8, freshMain.length));
    lexicalPrompts = main.concat(pickN(rnd, freshRare, Math.max(0, 8 - main.length)));
    lexicalHistoryKeys = lexicalPrompts.map(l => `initial:${l}:${initialLen}`);
    lexicalPrompts.shortfall = 8 - lexicalPrompts.length;
  } else if (p.lexicalKind === 'firstPenultimate' || p.lexicalKind === 'secondPenultimate' || p.lexicalKind === 'thirdPenultimate' || p.lexicalKind === 'joined' || p.lexicalKind === 'disjoint') {
    const excludeKeys = excl.lexicalKeys ? excl.lexicalKeys.filter(k=>k.startsWith(p.lexicalKind+':')).map(k=>k.split(':')[1]) : [];
    lexicalPrompts = buildPositionalPrompts(p.lexicalKind, rnd, 10, excludeKeys);
    lexicalHistoryKeys = lexicalPrompts.map(pr => `${p.lexicalKind}:${phonemicKeyFromPrompt(p.lexicalKind, pr)}`);
  } else {
    const excludeKeys = excl.lexicalKeys ? excl.lexicalKeys.filter(k=>k.startsWith(p.lexicalKind+':')).map(k=>k.split(':').slice(1).join(':')) : [];
    lexicalPrompts = buildCombinedPrompts(p.lexicalKind, rnd, 10, excludeKeys, excl.categories);
    lexicalHistoryKeys = lexicalPrompts.map(pr => `${p.lexicalKind}:${combinedKeyFromPrompt(p.lexicalKind, pr)}`);
  }
  if (lexicalPrompts.shortfall > 0) notices.push(`Accesso lessicale: solo ${lexicalPrompts.length} consegne mai proposte a questo gruppo per questo schema (ne servivano ${lexicalPrompts.length + lexicalPrompts.shortfall}).`);
  const lexicalBlock = {
    kind: p.lexicalKind,
    label: p.lexicalKind === 'initial' ? LEXICAL_LABELS.initial(initialLen) : LEXICAL_LABELS[p.lexicalKind](),
    prompts: lexicalPrompts,
    historyKeys: lexicalHistoryKeys,
    // categorie larghe usate dalle consegne "lettera + categoria": entrano nella cronologia delle categorie
    usedCategories: [...new Set(lexicalHistoryKeys.filter(k => /Category:/.test(k)).map(k => k.split('|')[1]))],
  };

  return { week, params: p, grids, multi, crucipuzzle, sequencing, maze, anagrams, calc, categories, lexicalBlock, notices };
}

// Estrae la coppia di lettere (l1,l2) da un prompt fonemico già formattato, per poter
// registrare nello storico condiviso QUALE coppia è stata usata (buildPositionalPrompts
// restituisce solo la stringa visualizzata, non la coppia grezza).
function phonemicKeyFromPrompt(kind, promptStr) {
  if (kind === 'joined') return promptStr[2] + promptStr[3];          // "..XY.."
  if (kind === 'disjoint') return promptStr[0] + promptStr[4];        // "X ; Y"
  // firstPenultimate / secondPenultimate / thirdPenultimate: "<label> «X», penultima «Y»"
  const m = [...promptStr.matchAll(/«(.)»/g)];
  if (m.length >= 2) return m[0][1] + m[1][1];
  return promptStr;
}

return {
  buildFascicolo,
  SYMBOL_FAMILIES, gridProfileForWeek, weekParams, mulberry32,
  generateSequenceGrid, generateMultiTargetGrid, countSequenceOccurrences,
  generateAnagrams, generateCalcChain, generateSymbolCrucipuzzle, generateItalianCrucipuzzle,
  generateSequencingV2, sequencingInstructionText, generateMaze,
  CATEGORY_POOL, LETTER_POOL, WORD_BANK, WORD_BANK_SCORED, buildPositionalPrompts, phonemicKeyFromPrompt,
  buildCombinedPrompts, combinedKeyFromPrompt, BROAD_CATEGORIES, CATEGORY_LETTER_BANK, INITIAL_LETTERS_BY_LENGTH,
  renderMazeSVG, renderSequencingSVG,
};
});


