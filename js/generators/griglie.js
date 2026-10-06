// Generatore — Griglie-Conteggio.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale prima e dopo identico).

// ---------- GRIGLIE-CONTEGGIO ----------
// Dimensione FISSA a ogni livello: 5 righe × 7 colonne (35 celle), come negli originali.
// La difficoltà non passa mai dalla dimensione/numerosità della griglia — solo dal tipo di
// simbolo (asse 1) e dalla complessità/varietà delle regole disponibili (asse 2).
// Dimensione della griglia in funzione del livello (numerosità di stimoli, righe e colonne
// crescenti — segnalato da Rodrigo): 5×7 (livelli 1-11, invariato) → 6×8 (12-22, -12,5% di area
// per cerchio) → 6×9 (23-32, -22%). Crescita più contenuta della prima versione (fino a 8×10,
// -34%): l'area della slide/pagina è fissa, quindi più celle vuol dire per forza cerchi più
// piccoli — qui non si va mai oltre un quarto in meno rispetto all'originale (segnalato di nuovo
// da Rodrigo: leggibilità).
function gridRowsForLevel(level){ return level<=11 ? 5 : 6; }
function gridColsForLevel(level){ return level<=11 ? 7 : level<=22 ? 8 : 9; }

// Categoria di simboli per fascia di livello (4 livelli per categoria, 1-32): 1-4 forme, 5-8 frecce,
// 9-12 numeri, 13-16 lettere, 17-20 misto numeri/lettere, 21-24 cirillico, 25-28 ideogrammi, 29-32 ge'ez.
// Dentro ogni categoria i 4 sotto-livelli salgono di difficoltà per complessità delle regole (vedi
// tierQuotaForLevel). Ogni categoria ha piu' varianti di pool: la generazione ne pesca una a caso ogni
// volta, cosi due cicli consecutivi allo stesso livello non espongono mai lo stesso materiale identico.
const GRID_CATEGORIES = ["shapes","arrows","digits","letters","mixed","cyrillic","cjk","geez"];
const GRID_CATEGORY_BY_LEVEL = [null].concat(Array.from({length:MAX_LEVEL}, (_,i)=> GRID_CATEGORIES[Math.min(GRID_CATEGORIES.length-1, Math.floor(i/4))]));
const GRID_CATEGORY_LABELS = { shapes:"Forme geometriche", arrows:"Frecce", digits:"Cifre", letters:"Lettere", mixed:"Alfanumerico misto", cyrillic:"Cirillico", cjk:"Ideogrammi cinesi", geez:"Ge'ez" };
// Ogni categoria ha molte varianti di pool (prima 4): a ogni generazione si sceglie una variante
// MAI proposta a quel gruppo (o, esaurite le nuove, la meno recente), così né due cicli allo stesso
// livello né livelli diversi della stessa categoria espongono lo stesso materiale.
const GRID_CATEGORY_POOLS = {
  shapes:   { kind:"shape", variants:[["●","▲","■"], ["●","▲","■","◆"], ["○","△","□","◇"], ["★","☆","●","■"],
                                       ["●","■","◆","★"], ["○","□","◇","☆"], ["▲","▼","■","◆"], ["△","▽","□","◇"],
                                       ["●","○","■","□"], ["▲","△","◆","◇"], ["●","○","▲","△"], ["■","□","★","☆"]] },
  arrows:   { kind:"arrow", variants:[["↑","↓","←","→"], ["↑","↓","←","→","↗"], ["↖","↗","↘","↙"], ["↑","→","↙","↖"],
                                       ["↑","↓","↗","↙"], ["←","→","↖","↘"], ["↑","↗","→","↘"], ["↓","↙","←","↖"],
                                       ["↑","↓","←","→","↗","↙"], ["←","→","↑","↖","↘"]] },
  digits:   { kind:"char",  variants:[["1","2","3","4"], ["3","4","6","7"], ["2","5","8","9"], ["0","1","7","9"],
                                       ["1","3","6","8"], ["2","4","7","9"], ["0","3","4","8"], ["1","5","6","7"],
                                       ["2","3","6","9"], ["0","4","5","9"], ["1","4","7","8"], ["3","6","8","9"]] },
  letters:  { kind:"char",  variants:[["A","B","D","E"], ["A","U","N","L"], ["M","P","R","S"], ["C","E","I","O"],
                                       ["A","C","M","T"], ["E","B","L","R"], ["I","D","N","P"], ["O","F","S","V"],
                                       ["U","G","H","Z"], ["A","N","S","V"],
                                       ["A","e","B","d"], ["a","E","b","D"], ["R","a","T","n"], ["g","E","N","r"]] },
  mixed:    { kind:"char",  variants:[["1","4","D","A"], ["2","B","7","E"], ["3","A","9","L"], ["5","M","0","R"],
                                       ["6","T","2","N"], ["8","C","4","P"], ["7","S","3","U"], ["5","F","9","O"],
                                       ["2","H","6","E"], ["4","Z","8","A"],
                                       ["6","g","2","N"], ["8","r","4","D"], ["3","a","7","T"], ["9","e","5","B"]] },
  cyrillic: { kind:"unicode", variants:[{base:0x0410,count:5}, {base:0x0416,count:5}, {base:0x0420,count:4}, {base:0x042A,count:5},
                                       {base:0x041B,count:5}, {base:0x0424,count:5}] },
  cjk:      { kind:"unicode", variants:[{base:0x53E3,count:4}, {base:0x4E00,count:4}, {base:0x6708,count:4}, {base:0x706B,count:4},
                                       {pool:["土","士","干","于"]}, {pool:["日","曰","目","自"]}, {pool:["末","未","木","本"]}, {pool:["己","已","巳","巴"]},
                                       {pool:["大","太","犬","天"]}, {pool:["田","由","甲","申"]}, {pool:["刀","力","刁","乃"]}, {pool:["人","入","八","又"]}] },
  geez:     { kind:"unicode", variants:[{base:0x1200,count:5}, {base:0x1218,count:5}, {base:0x1228,count:5}, {base:0x1230,count:5},
                                       {base:0x1208,count:5}, {base:0x1240,count:5}, {base:0x1260,count:5}, {base:0x1270,count:5},
                                       {base:0x1290,count:5}, {base:0x12A8,count:5}, {base:0x12E8,count:5}, {base:0x12F0,count:5}, {base:0x1308,count:5}] }
};
function gridVariantId(v){
  if(Array.isArray(v)) return v.join("");
  if(v.pool) return v.pool.join("");
  return v.base + ":" + v.count;
}
function familyForLevel(level, ctx){
  const cat = GRID_CATEGORY_BY_LEVEL[level] || "shapes";
  const def = GRID_CATEGORY_POOLS[cat];
  const keyOf = v => "V:" + cat + "|" + gridVariantId(v);
  const variant = ctx ? lruOrder(def.variants, keyOf, ctx)[0] : pick(def.variants);
  const variantKey = keyOf(variant);
  if(def.kind === "unicode" && variant.pool) return { kind:"char", pool:variant.pool, category:cat, variantKey };
  return def.kind === "unicode"
    ? { kind:"unicode", base:variant.base, count:variant.count, category:cat, variantKey }
    : { kind:def.kind, pool:variant, category:cat, variantKey };
}

// Tre assi di colore indipendenti — sfondo, bordo, e colore del simbolo stesso.
// REGOLA: in una stessa griglia non compaiono mai lo stesso colore in versione chiara e scura
// (azzurro+blu, verde chiaro+verde scuro, rosa+rosso, arancio+marrone): troppo facili da
// confondere. Ogni colore ha una famiglia di tinta (`hue`) e una griglia usa famiglie di tinta
// DIVERSE per gli sfondi e per gli inchiostri (bordo e simbolo).
// SFONDI: cinque tinte chiare, distanza cromatica minima ΔE≈41 (CIELAB) tra loro; l'inchiostro
// scuro resta leggibile su tutti (contrasto ≥ 4.5:1 con tutti gli inchiostri).
// INCHIOSTRI (bordo e colore del simbolo): sei tinte scure. Coppie troppo vicine (rosso/marrone
// ΔE≈36, blu/viola ΔE≈40) non compaiono mai insieme nella stessa griglia.
const FILL_POOL = [
  { name:"giallo", css:"#FFE45C", hue:"giallo" },
  { name:"azzurro", css:"#8FD3FF", hue:"blu" },
  { name:"verde chiaro", css:"#A6E8A0", hue:"verde" },
  { name:"rosa", css:"#FFB3D1", hue:"rosso" },
  { name:"arancio chiaro", css:"#FFB685", hue:"arancio" }
];
const INK_POOL = [
  { name:"rosso", css:"#A80018", hue:"rosso" },
  { name:"blu", css:"#0B3D91", hue:"blu" },
  { name:"verde scuro", css:"#0A5A24", hue:"verde" },
  { name:"nero", css:"#000000", hue:"nero" },
  { name:"marrone", css:"#7A3E0C", hue:"arancio" },
  { name:"viola", css:"#6A1FAE", hue:"viola" }
];
const INK_CONFLICTS = [["rosso","marrone"], ["blu","viola"], ["marrone","nero"]];
// Sfondi troppo simili tra loro anche se di famiglie di tinta diverse (segnalato da Rodrigo:
// "giallino" e "arancione chiaro" si confondono) — stessa logica di INK_CONFLICTS, ma per gli sfondi.
const FILL_CONFLICTS = [["giallo","arancio chiaro"]];
const COLORS = [...FILL_POOL, ...INK_POOL];
function colorCombos(arr, k){
  if(k===0) return [[]];
  const out = [];
  arr.forEach((x,i)=> colorCombos(arr.slice(i+1), k-1).forEach(rest=> out.push([x, ...rest])));
  return out;
}
// Sceglie la palette di UNA griglia: 3 inchiostri (usati sia per il bordo sia per il colore del
// simbolo) senza coppie in conflitto, e 3 sfondi di famiglie di tinta diverse da quelle degli
// inchiostri scelti.
function pickGridPalette(){
  const hasConflict = t => INK_CONFLICTS.some(([a,b]) => t.some(c=>c.name===a) && t.some(c=>c.name===b));
  const hasFillConflict = t => FILL_CONFLICTS.some(([a,b]) => t.some(c=>c.name===a) && t.some(c=>c.name===b));
  const inkTriples = shuffle(colorCombos(INK_POOL, 3).filter(t=>!hasConflict(t)));
  for(const inks of inkTriples){
    const hues = new Set(inks.map(c=>c.hue));
    const fillTriples = colorCombos(FILL_POOL.filter(f=>!hues.has(f.hue)), 3).filter(t=>!hasFillConflict(t));
    if(fillTriples.length) return { inks, fills: pick(fillTriples) };
  }
  return { inks: pickN(INK_POOL, 3), fills: pickN(FILL_POOL, 3) }; // non raggiungibile con queste tavolozze
}
function randInt(lo,hi){ return lo + rnd(hi-lo+1); }

// Scompone `total` in `k` parti tra lo e hi con pesi casuali: le dimensioni dei gruppi NON
// sono più bilanciate (prima 35 celle / 4 simboli = sempre 9-9-9-8, e quindi tutte le
// ricerche davano lo stesso conteggio, tipo 9 e 4 — troppo prevedibile). Richiede almeno
// `minDistinct` valori diversi tra le parti.
function balancedParts(total, k){
  const base = Math.floor(total/k), rem = total%k;
  return Array.from({length:k}, (_,i)=> base + (i<rem?1:0));
}
function weightedComposition(total, k, lo, hi, minDistinct){
  if(k*lo > total || k*hi < total) return balancedParts(total, k);
  for(let tries=0; tries<400; tries++){
    const w = Array.from({length:k}, ()=> 0.3 + Math.random()*1.7);
    const parts = Array(k).fill(lo);
    let left = total - lo*k, guard = 0;
    while(left>0 && guard<20000){
      guard++;
      const room = parts.map((p,i)=> p<hi ? w[i] : 0);
      const sum = room.reduce((a,b)=>a+b,0);
      if(sum<=0) break;
      let r = Math.random()*sum, i = 0;
      while(i<k-1 && r>=room[i]){ r -= room[i]; i++; }
      if(parts[i]<hi){ parts[i]++; left--; }
    }
    if(left===0 && new Set(parts).size >= Math.min(k, minDistinct)) return parts;
  }
  return balancedParts(total, k);
}

// Assegna un attributo di colore (sfondo/bordo/colore-simbolo) a tutte le celle: sceglie `n`
// colori dalla tavolozza data e li distribuisce in gruppi di dimensione VARIABILE (7-16
// celle ciascuno su 35), non più sempre bilanciati.
function assignAttribute(cells, allIdx, pool, propName, n){
  const chosen = pickN(pool, Math.min(n, pool.length));
  const idx = shuffle(allIdx);
  const sizes = weightedComposition(idx.length, chosen.length, 7, 16, 2);
  let cursor = 0;
  chosen.forEach((color,ci)=>{
    idx.slice(cursor, cursor+sizes[ci]).forEach(i=>{ cells[i][propName] = color.name; });
    cursor += sizes[ci];
  });
  return chosen;
}
// Sfondo assegnato come sopra, ma riservando un gruppo di celle "vuote" (nessun colore, il cerchio
// mostra solo il contorno). Prima "pieno/vuoto" esisteva SOLO per la famiglia forme, cambiando il
// GLIFO stesso (● vs ○): non generalizzabile alle altre famiglie (cifre, lettere, cirillico...).
// Qui "vuoto" diventa un valore dello SFONDO, indipendente dal simbolo mostrato — vale quindi per
// QUALUNQUE famiglia (richiesta di Rodrigo). export/exportGriglie non cambia: una cella con
// fill=null è già disegnata senza sfondo colorato.
function assignFillWithVoid(cells, allIdx, pool, n){
  const chosen = pickN(pool, Math.min(n, pool.length));
  const idx = shuffle(allIdx);
  const voidCount = 8 + rnd(9); // 8-16 celle su 35 restano vuote (nessuno sfondo)
  const voidIdx = idx.slice(0, voidCount), rest = idx.slice(voidCount);
  voidIdx.forEach(i=> cells[i].fill = null);
  const sizes = weightedComposition(rest.length, chosen.length, 3, 16, Math.min(2, chosen.length));
  let cursor = 0;
  chosen.forEach((color,ci)=>{
    rest.slice(cursor, cursor+sizes[ci]).forEach(i=>{ cells[i].fill = color.name; });
    cursor += sizes[ci];
  });
  return chosen;
}

// Proprietà "interne" della famiglia di simboli USATA (pari/dispari solo per le cifre,
// vocale/consonante solo per le lettere, direzione solo per le frecce, pieno/vuoto solo
// per le figure): `plain` è il testo della regola da sola, `np` la forma da combinare con
// altri criteri ("Conta le vocali con sfondo giallo").
function familyPredicates(symbols){
  const out = [];
  const mk = (np, f) => ({ plain:`Conta ${np}.`, np, f });
  const isAllDigits = symbols.every(s => /^[0-9]$/.test(s));
  const isAllLetters = symbols.every(s => /^[A-Za-z]$/.test(s));
  const isDigitOrLetter = symbols.every(s => /^[0-9A-Za-z]$/.test(s));
  const VOWELS = ["A","E","I","O","U"];
  const ITAL = "ABCDEFGHILMNOPQRSTUVZ"; // alfabeto italiano: A–L = prima metà (10), M–Z = seconda (11)
  const ARROWS = ["↑","↓","←","→","↖","↗","↘","↙"];
  const isAllArrows = symbols.every(s => ARROWS.includes(s));
  const both = (set) => symbols.some(s=>set.includes(s)) && symbols.some(s=>!set.includes(s));
  if (isAllDigits) {
    out.push(
      { plain:"Conta tutti gli elementi con cifra pari.", np:"le cifre pari", f:c=>Number(c.sym)%2===0 },
      { plain:"Conta tutti gli elementi con cifra dispari.", np:"le cifre dispari", f:c=>Number(c.sym)%2===1 });
    if (symbols.some(s=>Number(s)>5) && symbols.some(s=>Number(s)<5)) out.push(
      mk("le cifre maggiori di 5", c=>Number(c.sym)>5),
      mk("le cifre minori di 5", c=>Number(c.sym)<5));
    // (solo se non c'è lo 0, che è multiplo di 3 ma spesso non viene contato come tale)
    if (!symbols.includes("0") && both(["3","6","9"])) out.push(
      mk("le cifre multiple di 3", c=>["3","6","9"].includes(c.sym)));
  }
  if (isAllLetters && symbols.some(s=>VOWELS.includes(s.toUpperCase())) && symbols.some(s=>!VOWELS.includes(s.toUpperCase()))) out.push(
    { plain:"Conta tutte le vocali.", np:"le vocali", f:c=>VOWELS.includes(c.sym.toUpperCase()) },
    { plain:"Conta tutte le consonanti.", np:"le consonanti", f:c=>!VOWELS.includes(c.sym.toUpperCase()) });
  if (isAllLetters && symbols.some(s=>s===s.toUpperCase()) && symbols.some(s=>s===s.toLowerCase())) out.push(
    mk("le lettere maiuscole", c=>c.sym===c.sym.toUpperCase()),
    mk("le lettere minuscole", c=>c.sym===c.sym.toLowerCase()));
  if (isAllLetters && symbols.some(s=>ITAL.indexOf(s.toUpperCase())<10) && symbols.some(s=>ITAL.indexOf(s.toUpperCase())>=10)) out.push(
    mk("le lettere della prima metà dell'alfabeto (A–L)", c=>ITAL.indexOf(c.sym.toUpperCase())<10),
    mk("le lettere della seconda metà dell'alfabeto (M–Z)", c=>ITAL.indexOf(c.sym.toUpperCase())>=10));
  if (isDigitOrLetter && !isAllDigits && !isAllLetters) out.push(
    mk("le lettere", c=>/[A-Za-z]/.test(c.sym)),
    mk("le cifre", c=>/[0-9]/.test(c.sym)));
  if (isAllArrows) {
    const upSet = ["↑","↖","↗"], downSet = ["↓","↙","↘"];
    out.push(
      { plain:"Conta le frecce che puntano verso l'alto (↑ ↖ ↗).", np:"le frecce verso l'alto", f:c=>upSet.includes(c.sym) },
      { plain:"Conta le frecce che puntano verso il basso (↓ ↙ ↘).", np:"le frecce verso il basso", f:c=>downSet.includes(c.sym) });
    const horiz = ["←","→"], vert = ["↑","↓"], diag = ["↖","↗","↘","↙"], right = ["→","↗","↘"], left = ["←","↖","↙"];
    if (both(horiz)) out.push(mk("le frecce orizzontali (← →)", c=>horiz.includes(c.sym)));
    if (both(vert)) out.push(mk("le frecce verticali (↑ ↓)", c=>vert.includes(c.sym)));
    if (both(diag)) out.push(mk("le frecce oblique (↖ ↗ ↘ ↙)", c=>diag.includes(c.sym)));
    if (both(right) && both(left)) out.push(
      mk("le frecce che puntano verso destra (→ ↗ ↘)", c=>right.includes(c.sym)),
      mk("le frecce che puntano verso sinistra (← ↖ ↙)", c=>left.includes(c.sym)));
  }
  const FULL = ["●","■","▲","▼","◆","★"], EMPTY = ["○","□","△","▽","◇","☆"];
  if (symbols.every(s=>FULL.includes(s)||EMPTY.includes(s)) && both(FULL)) out.push(
    mk("le forme piene", c=>FULL.includes(c.sym)),
    mk("le forme vuote (solo contorno)", c=>EMPTY.includes(c.sym)));
  return out;
}
// Base "neutra" per i criteri relazionali (adiacenza, uguale al vicino): vale per QUALUNQUE materiale,
// quindi è l'unico caso in cui una regola non parte da un simbolo o da una proprietà della famiglia.
const ANY_PRED = { plain:"Conta tutti gli elementi.", np:"gli elementi", f:()=>true, any:true };

// Criteri di posizione. La numerazione è quella "umana" (prima riga = riga 1 = dispari):
// prima erano usati gli indici da 0 e "pari/dispari" risultava invertito.
// Ogni opzione ha un peso di difficoltà `w`: 1 = un solo criterio di riga/colonna/bordo; 2 = criterio
// composto (intersezione riga∩colonna, blocchi, scacchiera, righe/colonne non contigue). Le opzioni
// con w=2 compaiono solo dal livello 9 (vedi GRID_POS_W2_FROM).
const GRID_POS_W2_FROM = 10;
// Testi e filtri di posizione si ricalcolano sulle dimensioni EFFETTIVE della griglia di questa
// sessione (righe/colonne crescono col livello, vedi gridRowsForLevel/gridColsForLevel): prima
// erano scritti per una 5×7 fissa (es. "colonne 1, 4 e 7"), ora restano corretti a ogni dimensione.
function buildPosOptions(rows, cols){
  const isFrame = c => c.row===0 || c.row===rows-1 || c.col===0 || c.col===cols-1;
  const rMid = Math.floor((rows-3)/2), cMid = Math.floor((cols-3)/2);       // per le fasce "centrali"
  const rowSpan = Math.ceil((rows+1)/2), colSpan = Math.ceil((cols+1)/2);   // per i blocchi (si sovrappongono di una riga/colonna in mezzo, come nell'originale 5×7)
  const colMid = Math.ceil((cols+1)/2);                                    // colonna centrale per "colonne 1, mid e ultima"
  return [
    { w:1, text:"nelle righe pari", f:c=>(c.row+1)%2===0 },
    { w:1, text:"nelle righe dispari", f:c=>(c.row+1)%2===1 },
    { w:1, text:"nelle colonne pari", f:c=>(c.col+1)%2===0 },
    { w:1, text:"nelle colonne dispari", f:c=>(c.col+1)%2===1 },
    { w:1, text:"nelle prime 3 righe", f:c=>c.row<3 },
    { w:1, text:"nelle ultime 3 righe", f:c=>c.row>=rows-3 },
    { w:1, text:"nelle prime 2 righe", f:c=>c.row<2 },
    { w:1, text:"nelle ultime 2 righe", f:c=>c.row>=rows-2 },
    { w:1, text:"nelle prime 4 colonne", f:c=>c.col<4 },
    { w:1, text:"nelle ultime 4 colonne", f:c=>c.col>=cols-4 },
    { w:1, text:"nelle prime 3 colonne", f:c=>c.col<3 },
    { w:1, text:"nelle ultime 3 colonne", f:c=>c.col>=cols-3 },
    { w:1, text:`nelle righe centrali (${rMid+1}–${rMid+3})`, f:c=>c.row>=rMid && c.row<=rMid+2 },
    { w:1, text:`nelle colonne centrali (${cMid+1}–${cMid+3})`, f:c=>c.col>=cMid && c.col<=cMid+2 },
    { w:1, text:"sulla cornice della griglia (righe e colonne esterne)", f:c=>isFrame(c) },
    { w:1, text:"nelle celle interne (non sulla cornice)", f:c=>!isFrame(c) },
    { w:2, text:"nelle celle in riga dispari e colonna dispari", f:c=>(c.row+1)%2===1 && (c.col+1)%2===1 },
    { w:2, text:"nelle celle in riga dispari e colonna pari", f:c=>(c.row+1)%2===1 && (c.col+1)%2===0 },
    { w:2, text:"nelle celle in riga pari e colonna dispari", f:c=>(c.row+1)%2===0 && (c.col+1)%2===1 },
    { w:2, text:"nelle celle in riga pari e colonna pari", f:c=>(c.row+1)%2===0 && (c.col+1)%2===0 },
    { w:2, text:`nel blocco in alto a sinistra (righe 1–${rowSpan}, colonne 1–${colSpan})`, f:c=>c.row<rowSpan && c.col<colSpan },
    { w:2, text:`nel blocco in alto a destra (righe 1–${rowSpan}, colonne ${cols-colSpan+1}–${cols})`, f:c=>c.row<rowSpan && c.col>=cols-colSpan },
    { w:2, text:`nel blocco in basso a sinistra (righe ${rows-rowSpan+1}–${rows}, colonne 1–${colSpan})`, f:c=>c.row>=rows-rowSpan && c.col<colSpan },
    { w:2, text:`nel blocco in basso a destra (righe ${rows-rowSpan+1}–${rows}, colonne ${cols-colSpan+1}–${cols})`, f:c=>c.row>=rows-rowSpan && c.col>=cols-colSpan },
    { w:2, text:`nella prima e nell'ultima riga (righe 1 e ${rows})`, f:c=>c.row===0 || c.row===rows-1 },
    { w:2, text:`nelle colonne 1, ${colMid} e ${cols}`, f:c=>c.col===0 || c.col===colMid-1 || c.col===cols-1 },
    { w:2, text:"nelle celle a scacchiera dello stesso tipo dell'angolo in alto a sinistra", f:c=>(c.row+c.col)%2===0 },
    { w:2, text:"nelle celle a scacchiera opposte all'angolo in alto a sinistra", f:c=>(c.row+c.col)%2===1 },
    { w:1, text:"nella metà sinistra della griglia", f:c=>c.col < Math.floor(cols/2) },
    { w:1, text:"nella metà destra della griglia", f:c=>c.col >= Math.ceil(cols/2) },
    { w:1, text:"nella metà superiore della griglia", f:c=>c.row < Math.floor(rows/2) },
    { w:1, text:"nella metà inferiore della griglia", f:c=>c.row >= Math.ceil(rows/2) },
    { w:2, text:"nella prima e nell'ultima colonna", f:c=>c.col===0 || c.col===cols-1 },
    { w:2, text:"nella seconda e nella penultima riga", f:c=>c.row===1 || c.row===rows-2 },
    { w:2, text:"né sulla prima riga né sulla prima colonna", f:c=>c.row>0 && c.col>0 },
    { w:2, text:"nelle prime 2 righe oppure nelle ultime 2 colonne", f:c=>c.row<2 || c.col>=cols-2 }
  ];
}

// ---------- PUNTEGGIO DI DIFFICOLTÀ DELLE CONSEGNE (Griglie-Conteggio) ----------
// Ogni consegna ha un punteggio unico = S (difficoltà dello stimolo) + M (molteplicità delle condizioni) +
// A (astrazione). In ogni griglia le 10 consegne seguono una RAMPA di punteggio centrata su una media che sale
// in modo lineare col livello; l'astrazione massima ammessa, la quota di consegne con colori e le ripetizioni
// dello stesso criterio sono regolate qui sotto.
const GRID_SCORE_W = { symAlt:1, pred:0.5, fill:1, border:1, ink:1.5, size:1.5, bstyle:2, fillState:1, alt:0.5, cond:1, adj:2.5, neg:2 };
const GRID_VAR_ABSTRACTION = { skip:1.5, either:1.5, rows:2, exclude:2, whichrow:3, double:3, sameNb:3.5, compare:3.5, dirRel:4 };
const GRID_SCORE_MU = [1.0, 6.0];       // punteggio medio per consegna: livello 1 → 32 (lineare)
const GRID_SCORE_SPREAD = [1.0, 2.4];   // semi-ampiezza della rampa dentro la griglia (prima consegna = media − spread, ultima = media + spread)
const GRID_COLOR_SHARE = [0.5, 0.7];    // quota minima di consegne che usano sfondo/bordo/colore del simbolo
const GRID_ABSTRACTION_MAX = [1, 4.2];  // astrazione massima ammessa a livello 1 → 32
function gridTierFromScore(sc){ return sc<1.5 ? 1 : sc<3.5 ? 2 : sc<5.5 ? 3 : 4; }
function gridScoreTargets(effLevel){
  const t = levelT(effLevel);
  const mu = GRID_SCORE_MU[0] + (GRID_SCORE_MU[1]-GRID_SCORE_MU[0])*t;
  const w = GRID_SCORE_SPREAD[0] + (GRID_SCORE_SPREAD[1]-GRID_SCORE_SPREAD[0])*t;
  return Array.from({length:10}, (_,i)=> Math.max(0, mu + w*(i-4.5)/4.5));
}
function gridAbstractionMax(effLevel){ const t = levelT(effLevel); return GRID_ABSTRACTION_MAX[0] + (GRID_ABSTRACTION_MAX[1]-GRID_ABSTRACTION_MAX[0])*Math.pow(t,0.9); }
function gridColorMin(effLevel){ const t = levelT(effLevel); return Math.round(10*(GRID_COLOR_SHARE[0] + (GRID_COLOR_SHARE[1]-GRID_COLOR_SHARE[0])*t)); }

// Un criterio è descritto da una "specifica": gruppo di simboli (uno, due in alternativa
// "«A» o «B»", oppure una proprietà della famiglia) + vincoli su sfondo / bordo (colore e stile:
// continuo, tratteggiato, puntinato) / colore del simbolo / dimensione del simbolo, posizione,
// adiacenza a una cella con un certo sfondo o bordo, identità con il simbolo subito a destra o
// sotto, ed eventualmente UNA negazione ("ma non con bordo blu"). Testo, funzione di conteggio e
// gradino di complessità derivano tutti dalla stessa specifica.
function specToRule(sp){
  const inList = (list, v) => list.includes(v);
  const matches = c => {
    if(sp.pred ? !sp.pred.f(c) : !sp.syms.includes(c.sym)) return false;
    if(sp.fill && !inList(sp.fill, c.fill)) return false;
    if(sp.fillState==="vuoto" && c.fill) return false;
    if(sp.fillState==="pieno" && !c.fill) return false;
    if(sp.border && !inList(sp.border, c.border)) return false;
    if(sp.ink && !inList(sp.ink, c.symColor)) return false;
    if(sp.bstyle && !inList(sp.bstyle, c.bStyle)) return false;
    if(sp.size && !inList(sp.size, c.size)) return false;
    if(sp.pos && !sp.pos.f(c)) return false;
    if(sp.adj && !c.nb.some(n => (sp.adj.kind==="fill" ? n.fill : n.border) === sp.adj.name)) return false;
    if(sp.notFill && inList(sp.notFill, c.fill)) return false;
    if(sp.notBorder && inList(sp.notBorder, c.border)) return false;
    if(sp.notInk && inList(sp.notInk, c.symColor)) return false;
    return true;
  };
  const or = list => list.join(" o ");
  const clauses = (sp.fill?1:0) + (sp.fillState?1:0) + (sp.border?1:0) + (sp.ink?1:0) + (sp.bstyle?1:0) + (sp.size?1:0) + (sp.pos?1:0)
                + (sp.adj?1:0) + (sp.notFill||sp.notBorder||sp.notInk ? 1 : 0);
  let text;
  if(clauses===0 && sp.pred) text = sp.pred.plain;
  else {
    text = "Conta " + (sp.pred ? sp.pred.np : "gli elementi " + sp.syms.map(s=>`«${s}»`).join(" o "));
    if(sp.ink) text += ` di colore ${or(sp.ink)}`;
    const withs = [];
    if(sp.fill) withs.push(`sfondo ${or(sp.fill)}`);
    else if(sp.fillState) withs.push(sp.fillState==="vuoto" ? "sfondo vuoto (nessun colore)" : "sfondo pieno (un colore qualsiasi)");
    if(sp.border || sp.bstyle) withs.push("bordo " + [sp.border ? or(sp.border) : null, sp.bstyle ? or(sp.bstyle) : null].filter(Boolean).join(" "));
    if(sp.size) withs.push(`simbolo ${or(sp.size)}`);
    if(withs.length) text += " con " + (withs.length===1 ? withs[0] : withs.slice(0,-1).join(", ") + " e " + withs[withs.length-1]);
    if(sp.pos) text += `, ${sp.pos.text}`;
    if(sp.adj) text += `, adiacenti a una cella con ${sp.adj.kind==="fill" ? "sfondo" : "bordo"} ${sp.adj.name}`;
    const negs = [];
    if(sp.notFill) negs.push(`non con sfondo ${or(sp.notFill)}`);
    if(sp.notBorder) negs.push(`non con bordo ${or(sp.notBorder)}`);
    if(sp.notInk) negs.push(`non di colore ${or(sp.notInk)}`);
    if(negs.length) text += `, ma ${negs.join(" e ")}`;
    text += ".";
  }
  // PUNTEGGIO UNICO di difficoltà = STIMOLO + MOLTEPLICITÀ + ASTRAZIONE (Rodrigo):
  //  S = quanto costa percettivamente riconoscere ciò che va contato (secondo simbolo in alternativa, proprietà
  //      della famiglia, sfondo/bordo = 1, colore del simbolo/dimensione = 1,5, stile del bordo = 2, +0,5 se un
  //      vincolo ammette due valori);
  //  M = molteplicità: quante condizioni vanno tenute insieme (1 per ogni condizione oltre la prima);
  //  A = astrazione della consegna: posizione semplice 1 / composta 2, negazione 2, adiacenza 2,5.
  const W = GRID_SCORE_W;
  const lists = { fill:sp.fill, border:sp.border, ink:sp.ink, bstyle:sp.bstyle, size:sp.size };
  const axes = [], ck = [];
  let S = (sp.syms && sp.syms.length>1 ? W.symAlt : 0) + (sp.pred && !sp.pred.any ? W.pred : 0);
  for(const k in lists){
    const l = lists[k]; if(!l) continue;
    S += W[k] + (l.length>1 ? W.alt : 0); axes.push(k);
    if(k==="fill" || k==="border" || k==="ink") l.forEach(n=>ck.push(k+":"+n));
  }
  if(sp.fillState){ S += W.fillState; axes.push("fillState"); }
  const hasNeg = !!(sp.notFill || sp.notBorder || sp.notInk);
  if(hasNeg){
    axes.push("neg");
    (sp.notFill||[]).forEach(n=>ck.push("fill:"+n)); (sp.notBorder||[]).forEach(n=>ck.push("border:"+n)); (sp.notInk||[]).forEach(n=>ck.push("ink:"+n));
  }
  if(sp.pos) axes.push("pos");
  if(sp.adj){ axes.push("adj"); ck.push((sp.adj.kind==="fill"?"fill:":"border:")+sp.adj.name); }
  const nCond = (sp.pred && sp.pred.any ? 0 : 1) + axes.length;
  const M = Math.max(0, nCond-1) * W.cond;
  const A = (sp.pos ? (sp.pos.w||1) : 0) + (sp.adj ? W.adj : 0) + (hasNeg ? W.neg : 0);
  const score = S + M + A;
  // Tipo di regola: 'pos' = usa un criterio di POSIZIONE; 'rel' = relazione con le celle vicine; 'stim' = solo stimoli.
  const kind = sp.pos ? "pos" : (sp.adj ? "rel" : "stim");
  const base = sp.pred ? (sp.pred.any ? "any" : "p:"+sp.pred.np) : "s:"+[...sp.syms].sort().join("|");
  return { text, matches, tier: gridTierFromScore(score), kind, score, parts:{S, M, A}, base, axes, ck };
}

// Estrae a caso una specifica. Il filtro sui conteggi (4-14) è a valle. `feat` elenca gli
// attributi extra attivi in questa griglia (stile del bordo, dimensione: dipendono dal livello).
function sampleSpec(symbols, famPreds, F, B, I, feat){
  const sp = { syms:null, pred:null, fill:null, fillState:null, border:null, ink:null, bstyle:null, size:null, pos:null, adj:null, rel:null, notFill:null, notBorder:null, notInk:null };
  const r = Math.random();
  // Criterio "intermedio": simbolo (o proprietà della famiglia) + UNA sola caratteristica, a
  // valore singolo. Richiesti in numero maggiore da Rodrigo (prima i criteri con 3+ caratteristiche
  // erano la maggioranza): qui si generano apposta, in quota fissa tra i candidati.
  const simple = Math.random() < 0.40;
  if(simple){
    if(famPreds.length && r<0.25) sp.pred = pick(famPreds);
    else sp.syms = [pick(symbols)];
  }
  else if(r<0.10) sp.pred = ANY_PRED;
  else if(famPreds.length && r<0.30) sp.pred = pick(famPreds);
  else if(r<0.60 && symbols.length>=2) sp.syms = pickN(symbols, 2);
  else sp.syms = [pick(symbols)];
  // Vincoli estratti in modo indipendente, con più peso su SFONDO e BORDO (i colori che il
  // paziente vede meglio e che finora erano sfruttati poco), meno sul colore del simbolo,
  // sulla posizione e sulla negazione.
  const feats = [];
  if(simple){
    // Criterio con UNA sola caratteristica: metà delle volte di POSIZIONE (righe, colonne, cornice…), metà
    // sugli STIMOLI (sfondo, bordo, colore/dimensione del simbolo, stile del bordo) — richiesta di Rodrigo:
    // mescolare in modo uniforme regole sugli stimoli e regole sulla posizione.
    if(Math.random()<0.5) feats.push("pos");
    else {
      // sfondo e bordo pesano più del colore del simbolo (segnalato di nuovo da Rodrigo:
      // "non usi ancora abbastanza i colori degli sfondi e dei bordi") — sono i colori che il
      // paziente vede meglio, a differenza del colore del tratto sottile del simbolo stesso.
      const opts = ["fill","fill","fill","border","border","border","ink"];
      if(feat.sizes) opts.push("size","size");                       // dimensione del simbolo (dal livello 3)
      if(feat.bStyles) opts.push("bstyle");                          // stile del bordo (dal livello 5)
      if(feat.fillVoid) opts.push("fillstate","fillstate");          // sfondo vuoto, qualunque famiglia (dal livello 5)
      feats.push(pick(opts));
    }
  } else {
  // Sfondo: o un colore preciso, o (se sbloccato) "vuoto" — mai entrambi sulla stessa regola.
  const fillRoll = Math.random();
  if(feat.fillVoid && fillRoll<0.15) feats.push("fillstate");
  else if(fillRoll<0.65) feats.push("fill");
  if(Math.random()<0.60) feats.push("border");
  if(Math.random()<0.30) feats.push("ink");
  if(Math.random()<0.50) feats.push("pos");
  if(Math.random()<0.25) feats.push("neg");
  if(feat.bStyles && Math.random()<0.30) feats.push("bstyle");
  if(feat.sizes && Math.random()<0.35) feats.push("size");
  if(Math.random()<0.10) feats.push("adj");
  }
  const nOf = pool => pickN(pool, (!simple && Math.random()<0.35) ? 2 : 1).map(c=>c.name);
  if(feats.includes("fill")) sp.fill = nOf(F);
  // "vuoto" è l'unico stato utile come criterio da solo: "pieno" (qualunque colore) copre quasi
  // tutte le altre celle e non passa quasi mai il filtro sui conteggi (4-14) — coerente con come
  // già si comportano dimensione e stile del bordo.
  if(feats.includes("fillstate")) sp.fillState = "vuoto";
  if(feats.includes("border")) sp.border = nOf(B);
  if(feats.includes("ink")) sp.ink = nOf(I);
  if(feats.includes("pos")) sp.pos = pick(feat.posOptions || POS_OPTIONS);
  if(feats.includes("bstyle")) sp.bstyle = !simple && feat.bStyles.length>=3 && Math.random()<0.3 ? pickN(feat.bStyles, 2) : [pick(feat.bStyles)];
  if(feats.includes("size")) sp.size = [pick(feat.sizes)];
  if(feats.includes("adj")){
    const useFill = Math.random()<0.5;
    sp.adj = { kind: useFill ? "fill" : "border", name: pick(useFill ? F : B).name };
  }
  if(sp.pred===ANY_PRED && !sp.adj){
    const useFill = Math.random()<0.5;
    sp.adj = { kind: useFill ? "fill" : "border", name: pick(useFill ? F : B).name };
  }
  // (adiacenza e negazione nella stessa regola non si combinano: troppo pesante da applicare)
  if(feats.includes("neg") && !sp.adj){
    // la negazione riguarda un asse su cui non c'è già un vincolo positivo
    const axes = [["notFill",F,sp.fill],["notBorder",B,sp.border],["notInk",I,sp.ink]].filter(a=>!a[2]);
    if(axes.length){ const [key,pool] = pick(axes); sp[key] = [pick(pool).name]; }
  }
  return sp;
}

// Attributi extra a due valori (stile bordo a livelli bassi, dimensione): gruppi di dimensione
// variabile (12-23 celle su 35), non sempre metà e metà.
function assignBinary(cells, allIdx, names, propName){
  const idx = shuffle(allIdx);
  const cut = 12 + rnd(12);
  idx.forEach((i,j)=>{ cells[i][propName] = j<cut ? names[0] : names[1]; });
}
const BORDER_STYLE_POOL = [{name:"continuo"}, {name:"tratteggiato"}, {name:"puntinato"}];


// ---------- VARIETÀ DI REGOLE (Griglie-Conteggio) ----------
// Oltre alle specifiche "simbolo + vincoli" (specToRule), la griglia offre regole di FORMA diversa,
// per allenare operazioni mentali diverse dal semplice conteggio filtrato (richiesta di Rodrigo):
//  - esclusione   "gli elementi X, esclusi quelli Y"
//  - alternativa  "gli elementi X oppure quelli Y" (chi soddisfa entrambe si conta una volta sola)
//  - doppio conteggio parallelo "quanti X e quanti Y" (due numeri)
//  - confronto    "sono più numerosi X o Y?"
//  - soglia/sequenza "gli X saltando i primi k" (ordine di lettura)
//  - per riga/colonna "in quante righe compare almeno un X?" e "quale riga contiene più X?"
//  - relazionali direzionali "gli X che hanno subito a destra/sinistra/sopra/sotto un Y" e
//    "identici alla cella a destra/sotto".
// Ogni regola porta `answer` (testo mostrato con "Mostra risposta") e `count` = celle evidenziate
// (sempre 4-14, come le altre). kind 'var' (o 'rel' per le relazionali): vedi selectRules.
const GRID_VAR_MIN_LEVEL = { skip:8, rows:10, either:12, exclude:14, whichrow:16, double:18, sameNb:20, compare:22, dirRel:24 };
function gridVarRules(cells, rows, cols, symbols, F, B, I, feat, effLevel){
  const attr = () => {
    const opts = [
      () => { const x = pick(symbols); return { axis:"sym", key:"s"+x, np:`«${x}»`, f:c=>c.sym===x }; },
      () => { const x = pick(F).name; return { axis:"fill", key:"f"+x, np:`con sfondo ${x}`, f:c=>c.fill===x }; },
      () => { const x = pick(B).name; return { axis:"border", key:"b"+x, np:`con bordo ${x}`, f:c=>c.border===x }; },
      () => { const x = pick(I).name; return { axis:"ink", key:"i"+x, np:`di colore ${x}`, f:c=>c.symColor===x }; }
    ];
    if(feat.sizes) opts.push(() => { const x = pick(feat.sizes); return { axis:"size", key:"z"+x, np:`con simbolo ${x}`, f:c=>c.size===x }; });
    if(feat.fillVoid) opts.push(() => ({ axis:"fill", key:"fvoid", np:"con sfondo vuoto (nessun colore)", f:c=>!c.fill }));
    return pick(opts)();
  };
  const noun = a => a.axis==="sym" ? `gli elementi ${a.np}` : `gli elementi ${a.np}`;
  const those = a => a.axis==="sym" ? `i ${a.np}` : `quelli ${a.np}`;
  const inRange = n => n>=4 && n<=14;
  const inLevel = k => effLevel >= GRID_VAR_MIN_LEVEL[k];
  const kinds = Object.keys(GRID_VAR_MIN_LEVEL).filter(inLevel);
  if(!kinds.length) return null;
  const vk = pick(kinds);
  const A = attr(), Bt = attr();
  if(vk!=="skip" && vk!=="rows" && vk!=="whichrow" && vk!=="sameNb" && (A.key===Bt.key || A.axis===Bt.axis)) return null;
  const cnt = f => cells.filter(f).length;
  const reading = cells; // già in ordine di lettura (riga per riga, da sinistra a destra)
  const attrS = a => ({ sym:0.5, fill:1, border:1, ink:1.5, size:1.5 }[a.axis] || 1);
  const ckOf = a => (a.axis==="fill"||a.axis==="border"||a.axis==="ink") && a.key!=="fvoid" ? [a.axis+":"+a.key.slice(1)] : [];
  const baseOf = a => a.axis==="sym" ? "s:"+a.key.slice(1) : "v:"+vk+":"+a.key;
  const mk = (o) => {
    const two = ["exclude","either","double","compare","dirRel"].includes(vk);
    const S = vk==="sameNb" ? ({ fill:1, border:1, sym:0.5 }[o.nbKey.split("-")[0]]) : attrS(A) + (two ? attrS(Bt) : 0);
    const M = two ? GRID_SCORE_W.cond : 0;
    const Ab = GRID_VAR_ABSTRACTION[vk];
    const score = S + M + Ab;
    let ck = ckOf(A).concat(two ? ckOf(Bt) : []), base = baseOf(A);
    if(vk==="sameNb"){ base = "nb:"+o.nbKey; ck = o.nbKey.startsWith("sym") ? [] : [o.nbKey.split("-")[0]+":*"]; }
    return Object.assign({ kind:"var", keepText:true, score, parts:{S, M, A:Ab}, base, axes:["var"], ck }, o, { tier: gridTierFromScore(score) });
  };
  if(vk==="exclude"){
    const f = c => A.f(c) && !Bt.f(c), n = cnt(f);
    if(!inRange(n) || cnt(A.f)===n) return null;
    return mk({ vk, text:`Conta ${noun(A)}, esclusi ${those(Bt)}.`, matches:f, count:n });
  }
  if(vk==="either"){
    const f = c => A.f(c) || Bt.f(c), n = cnt(f);
    if(!inRange(n)) return null;
    return mk({ vk, text:`Conta ${noun(A)} oppure ${those(Bt)} (chi rispetta entrambe le condizioni si conta una volta sola).`, matches:f, count:n });
  }
  if(vk==="double"){
    const a = cnt(A.f), b = cnt(Bt.f);
    if(!inRange(a) || !inRange(b)) return null;
    return mk({ vk, text:`Conta separatamente, tenendo due totali: quanti sono ${noun(A)} e quanti ${those(Bt)}.`,
      matches:c=>A.f(c)||Bt.f(c), count:Math.max(a,b), answer:`${a} e ${b}` });
  }
  if(vk==="compare"){
    const a = cnt(A.f), b = cnt(Bt.f);
    if(!inRange(a) || !inRange(b) || Math.abs(a-b)<2) return null;
    return mk({ vk, text:`Quali sono più numerosi: ${noun(A)} o ${those(Bt)}? Di quanti?`,
      matches:c=>A.f(c)||Bt.f(c), count:Math.max(a,b),
      answer:`${a>b ? A.np : Bt.np} (${Math.max(a,b)} contro ${Math.min(a,b)}, differenza ${Math.abs(a-b)})` });
  }
  if(vk==="skip"){
    const k = 1 + rnd(3), base = cells.filter(A.f);
    const n = base.length - k;
    if(!inRange(n)) return null;
    const keep = new Set(base.slice(k));
    return mk({ vk, text:`Conta ${noun(A)}, saltando ${k===1 ? "il primo che incontri" : "i primi "+k+" che incontri"} (si legge da sinistra a destra, riga per riga).`,
      matches:c=>keep.has(c), count:n });
  }
  if(vk==="rows"){
    const byRow = Math.random()<0.6, lines = byRow ? rows : cols;
    const set = new Set(cells.filter(A.f).map(c=>byRow ? c.row : c.col));
    const n = set.size, total = cnt(A.f);
    if(!inRange(total) || n<3 || n>=lines) return null;
    return mk({ vk, text:`In quante ${byRow?"righe":"colonne"} compare almeno un elemento ${A.axis==="sym"?A.np:A.np}?`,
      matches:A.f, count:total, answer:`${n} ${byRow?"righe":"colonne"} (${total} elementi in tutto)` });
  }
  if(vk==="whichrow"){
    const byRow = Math.random()<0.6, lines = byRow ? rows : cols, per = Array(lines).fill(0);
    cells.forEach(c=>{ if(A.f(c)) per[byRow ? c.row : c.col]++; });
    const mx = Math.max(...per), total = per.reduce((x,y)=>x+y,0);
    if(!inRange(total) || mx<2 || per.filter(v=>v===mx).length!==1) return null;
    const li = per.indexOf(mx);
    return mk({ vk, text:`Quale ${byRow?"riga":"colonna"} contiene più elementi ${A.np}? (contali ${byRow?"riga per riga":"colonna per colonna"}).`,
      matches:A.f, count:total, answer:`${byRow?"riga":"colonna"} ${li+1} (${mx} elementi)` });
  }
  if(vk==="sameNb"){
    const dir = Math.random()<0.5 ? "right" : "below", w = dir==="right" ? "a destra" : "sotto";
    const t = pick(["fill","border","sym"]);
    const eq = t==="sym" ? (c,n)=>c.sym===n.sym : (t==="fill" ? (c,n)=>c.fill && c.fill===n.fill : (c,n)=>c.border===n.border);
    const f = c => c[dir] && eq(c, c[dir]), n = cnt(f);
    if(!inRange(n)) return null;
    const what = t==="sym" ? "lo stesso simbolo" : (t==="fill" ? "lo stesso colore di sfondo" : "lo stesso colore di bordo");
    return mk({ vk, kind:"rel", nbKey:t+"-"+dir, text:`Conta gli elementi che hanno ${what} della cella subito ${w}.`, matches:f, count:n });
  }
  if(vk==="dirRel"){
    const dirs = [["right","subito a destra"],["left","subito a sinistra"],["below","subito sotto"],["above","subito sopra"]];
    const [dk, dw] = pick(dirs);
    const f = c => A.f(c) && c[dk] && Bt.f(c[dk]), n = cnt(f);
    if(!inRange(n)) return null;
    return mk({ vk, kind:"rel", text:`Conta ${noun(A)} che hanno ${dw} un elemento ${Bt.axis==="sym"?Bt.np:Bt.np}.`, matches:f, count:n });
  }
  return null;
}

// Costruisce UN tentativo di griglia e valuta un ampio ventaglio di regole candidate,
// tenendo solo quelle il cui conteggio cade tra 4 e 14. Ogni regola di colore resta
// SEMPRE agganciata a un simbolo (o a una proprietà della famiglia): mai "conta gli sfondi
// gialli" da solo, che non dipenderebbe dal materiale. Unica eccezione: i criteri relazionali
// (adiacenza, identico al vicino), che dipendono comunque dalla disposizione dei simboli.
function buildGridAttempt(symbols, level, effLevel, rows, cols){
  const n = rows*cols;
  const cells = Array.from({length:n}, (_,i)=>({ row:Math.floor(i/cols), col:i%cols }));
  const allIdx = cells.map((_,i)=>i);
  cells.forEach((c,i)=>{
    c.right = c.col < cols-1 ? cells[i+1] : null;
    c.below = c.row < rows-1 ? cells[i+cols] : null;
    c.left = c.col>0 ? cells[i-1] : null;
    c.above = c.row>0 ? cells[i-cols] : null;
    c.nb = [c.right, c.below, c.col>0 ? cells[i-1] : null, c.row>0 ? cells[i-cols] : null].filter(Boolean);
  });

  // 1) SIMBOLI — gruppi di dimensione variabile tra 4 e 14 (non più bilanciati).
  const shuffledIdx = shuffle(allIdx);
  const k = symbols.length;
  const symSizes = weightedComposition(n, k, 4, 14, 3);
  let cursor = 0;
  symbols.forEach((sym,si)=>{
    shuffledIdx.slice(cursor, cursor+symSizes[si]).forEach(i=>cells[i].sym = sym);
    cursor += symSizes[si];
  });

  // 2) COLORE — tre assi indipendenti, 3 colori a testa; palette senza gemelli chiaro/scuro (vedi pickGridPalette).
  // Lo sfondo può anche essere "vuoto" (nessun colore, solo contorno) dal livello 5 — stessa soglia
  // dello stile del bordo, perché è un altro vincolo semplice su un solo attributo visivo, ora
  // disponibile per QUALUNQUE famiglia di simboli e non solo per le forme piene/vuote (richiesta di
  // Rodrigo). Vedi assignFillWithVoid.
  const fillVoidOn = effLevel>=9;
  const palette = pickGridPalette();
  // Crescita graduale: ai primi livelli solo 2 colori per canale (sfondo, bordo, colore del simbolo), poi 3.
  const nCol = 3;   // 3 colori per canale fin dal livello 1: con 2 ogni colore copre ~17 celle su 35 e le consegne di solo colore (4-14 celle) non sarebbero valide
  const fillChosen = fillVoidOn
    ? assignFillWithVoid(cells, allIdx, palette.fills, nCol)
    : assignAttribute(cells, allIdx, palette.fills, "fill", nCol);
  const borderChosen = assignAttribute(cells, allIdx, palette.inks, "border", nCol);
  const symColorChosen = assignAttribute(cells, allIdx, palette.inks, "symColor", nCol);

  // 2b) ATTRIBUTI EXTRA, in funzione del livello (32 livelli): dimensione del simbolo (grande/piccolo)
  //     dal livello 3; stile del bordo dal livello 5 (continuo/tratteggiato; dal 17 anche puntinato);
  //     sfondo vuoto dal livello 5 (vedi sopra).
  //     Criteri di posizione composti (blocchi, intersezioni, scacchiera) dal livello GRID_POS_W2_FROM.
  // Attributi extra e opzioni di posizione: gradiscono in base al livello EFFETTIVO (vedi
  // tierEffectiveLevel), non al livello a video — stesso motivo delle quote di gradino più sotto.
  const feat = { bStyles:null, sizes:null, fillVoid:fillVoidOn, posOptions: buildPosOptions(rows, cols).filter(o => o.w===1 || effLevel>=GRID_POS_W2_FROM) };
  if(effLevel>=6){
    assignBinary(cells, allIdx, ["grande","piccolo"], "size");
    feat.sizes = ["grande","piccolo"];
  }
  if(effLevel>=17){
    assignAttribute(cells, allIdx, BORDER_STYLE_POOL, "bStyle", 3);
    feat.bStyles = BORDER_STYLE_POOL.map(x=>x.name);
  } else if(effLevel>=12){
    assignBinary(cells, allIdx, ["continuo","tratteggiato"], "bStyle");
    feat.bStyles = ["continuo","tratteggiato"];
  }

  // 3) CANDIDATI — gradino 1 deterministico (ogni simbolo da solo + proprietà della
  //    famiglia), poi ~1600 specifiche casuali che coprono i gradini 2-5.
  const famPreds = familyPredicates(symbols);
  const seen = new Set();
  const evaluated = [];
  const push = rule => {
    if(seen.has(rule.text)) return;
    seen.add(rule.text);
    if(rule.count==null) rule.count = cells.filter(rule.matches).length;
    evaluated.push(rule);
  };
  symbols.forEach(sym=> push(specToRule({ syms:[sym] })));
  famPreds.forEach(p=> push(specToRule({ pred:p })));
  // consegne di SOLO colore (sfondo / bordo / colore del simbolo), valide per qualunque materiale: sono il modo più
  // semplice di usare i colori fin dai primi livelli
  fillChosen.forEach(f=> push(specToRule({ pred:ANY_PRED, fill:[f.name] })));
  borderChosen.forEach(f=> push(specToRule({ pred:ANY_PRED, border:[f.name] })));
  symColorChosen.forEach(f=> push(specToRule({ pred:ANY_PRED, ink:[f.name] })));
  for(let i=0; i<1600; i++) push(specToRule(sampleSpec(symbols, famPreds, fillChosen, borderChosen, symColorChosen, feat)));
  // regole di forma diversa (esclusione, alternativa, doppio conteggio, confronto, soglia, per riga/colonna, relazionali)
  for(let i=0; i<900; i++){
    const vr = gridVarRules(cells, rows, cols, symbols, fillChosen, borderChosen, symColorChosen, feat, effLevel);
    if(vr) push(vr);
  }
  return { cells, evaluated };
}

// Categorie di lettura: il livello EFFETTIVO corregge quello a video in base a quanto è leggibile la categoria
// di simboli per un lettore italiano (frecce e forme più facili; cirillico, cjk, ge'ez più difficili).
const GRID_READABILITY_DELTA = { shapes:1, arrows:1, digits:2, letters:2, mixed:1, cyrillic:-3, cjk:-5, geez:-5 };
function tierEffectiveLevel(level, category){
  const delta = GRID_READABILITY_DELTA[category] || 0;
  return Math.max(1, Math.min(MAX_LEVEL, level + delta));
}
// Due consegne sono "quasi uguali" se riguardano lo stesso bersaglio (stesso simbolo / stessa proprietà) e i
// vincoli dell'una sono contenuti in quelli dell'altra ("frecce a sinistra" / "frecce a sinistra nelle prime 3 colonne").
function gridRulesConflict(a, b){
  if(a.base !== b.base) return false;
  const sub = (x,y) => x.every(k=>y.includes(k));
  return sub(a.axes, b.axes) || sub(b.axes, a.axes);
}
// Sceglie le 10 consegne di UNA griglia seguendo la rampa di punteggio del livello (gridScoreTargets): per ogni
// posto della rampa prende la consegna il cui punteggio è più vicino, con penalità per conteggi già usciti,
// stesso bersaglio o stesso colore già usato, sbilanciamento stimolo/posizione; quota minima di consegne con
// colori; astrazione massima e numero di consegne astratte limitati dal livello. Ritorna { chosen, cost }.
function selectRulesByScore(evaluated, effLevel){
  const N = 10, t = levelT(effLevel);
  const amax = gridAbstractionMax(effLevel), cmin = gridColorMin(effLevel), targets = gridScoreTargets(effLevel);
  const capA2 = Math.floor(1 + 5*t), capA3 = Math.floor(1 + 3*t), capRel = t<0.7 ? 1 : 2;
  const pool = evaluated.filter(r => r.count>=4 && r.count<=14 && r.parts.A <= amax+1e-9);
  let best = null;
  for(let rep=0; rep<4; rep++){
    const chosen = [], usedCount = {}, baseUse = {}, ckUse = {}, vks = new Set();
    let nPos = 0, nStim = 0, nColor = 0, nA2 = 0, nA3 = 0, nRel = 0, cost = 0;
    for(let i=0; i<N; i++){
      const need = cmin - nColor, mustColor = need >= N - i;
      let bi = null, bc = Infinity;
      for(const r of pool){
        if(chosen.includes(r)) continue;
        const colored = r.ck.length>0;
        if(mustColor && !colored) continue;
        if(r.vk && vks.has(r.vk)) continue;
        if(r.parts.A>=2 && nA2>=capA2) continue;
        if(r.parts.A>=3 && nA3>=capA3) continue;
        if(r.kind==="rel" && nRel>=capRel) continue;
        if(chosen.some(x=>gridRulesConflict(r,x))) continue;
        let c = Math.abs(r.score - targets[i]) + Math.random()*0.35
              + 0.7*(usedCount[r.count]||0) + (r.base==='any' ? 0 : 3*(baseUse[r.base]||0))
              + 0.8*r.ck.reduce((a,k)=>a+(ckUse[k]||0),0);
        if(r.kind==="pos") c += 0.8*Math.max(0, nPos-nStim);
        else if(r.kind==="stim") c += 0.8*Math.max(0, nStim-nPos);
        if(colored && need>0) c -= 0.6;
        if(c < bc){ bc = c; bi = r; }
      }
      if(!bi) break;
      chosen.push(bi); cost += bc;
      usedCount[bi.count] = (usedCount[bi.count]||0)+1;
      baseUse[bi.base] = (baseUse[bi.base]||0)+1;
      bi.ck.forEach(k=>{ ckUse[k] = (ckUse[k]||0)+1; });
      if(bi.vk) vks.add(bi.vk);
      if(bi.kind==="pos") nPos++; else if(bi.kind==="stim") nStim++; else if(bi.kind==="rel") nRel++;
      if(bi.ck.length) nColor++;
      if(bi.parts.A>=2) nA2++; if(bi.parts.A>=3) nA3++;
    }
    cost += (N - chosen.length)*50 + Math.max(0, cmin - nColor)*5;
    if(!best || cost < best.cost) best = { chosen, cost };
  }
  if(!best) return { chosen:[], cost:1e9 };
  best.chosen.sort((a,b)=>a.score-b.score);
  return best;
}

function genOneGrid(symbols, level, category, rows, cols){
  // Più tentativi di griglia, tenendo il migliore (costo minore = consegne più vicine alla rampa di punteggio,
  // conteggi diversi tra loro, nessun bersaglio ripetuto, colori usati). La combinatoria segue il livello
  // EFFETTIVO (leggibilità della categoria, vedi tierEffectiveLevel); la dimensione della griglia segue il livello vero.
  const effLevel = tierEffectiveLevel(level, category);
  let best = null;
  for(let attempt=0; attempt<25; attempt++){
    const { cells, evaluated } = buildGridAttempt(symbols, level, effLevel, rows, cols);
    const sel = selectRulesByScore(evaluated, effLevel);
    if(!best || sel.cost < best.cost) best = { cells, rules: sel.chosen, cost: sel.cost };
    if(sel.chosen.length===10 && sel.cost < 7) break;
  }
  return best;
}

function genGriglie(level, excludeKeys){
  const ctx = makeAvoidCtx(excludeKeys);
  let fam = familyForLevel(level, ctx);
  const ov = state.materialOverride.griglie;
  if(ov && ov!=="auto"){
    const opt = MATERIAL_OPTIONS.griglie.find(o=>o.id===ov);
    fam = {...fam, kind:opt.kind, pool:opt.pool, base:opt.base, count:opt.count, variantKey:null};
  }
  if(fam.variantKey) ctx.use(fam.variantKey);
  let symbols;
  if(fam.kind==="unicode"){
    symbols = Array.from({length:fam.count},(_,i)=>String.fromCodePoint(fam.base+i));
  } else {
    symbols = fam.pool;
  }
  const rows = gridRowsForLevel(level), cols = gridColsForLevel(level);

  // Una sola griglia per sessione, con tutte le regole valide (fino a 10) selezionabili
  // una alla volta — come nei materiali originali: non più griglie diverse, ma varianti
  // di regola sulla stessa griglia.
  const N_GRIDS = 1;
  const slides = Array.from({length:N_GRIDS}, ()=>{
    const {cells, rules} = genOneGrid(symbols, level, fam.category, rows, cols);
    return { cells, rows, cols, rules, ruleIndex:0 };
  });

  return {
    type:"griglie",
    rows, cols,
    slides,
    historyKeys: ctx.newKeys
  };
}
