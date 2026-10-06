// Generatore — Intruso percettivo.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale prima e dopo identico).

// ---------- INTRUSO PERCETTIVO ----------
// Rianalizzato sugli originali: ogni schermata (slide) è una lista di 15 o 18 elementi
// (mai altri valori), dove esattamente UN valore compare una sola volta (il target da
// trovare) e tutti gli altri compaiono almeno 2 volte — senza tetto massimo: con pool
// piccoli (es. dadi, 6 facce) i conteggi "normali" salgono naturalmente sopra 3 pur di
// riempire n. Ogni SESSIONE (livello) è un mazzo di 9 schermate, ciascuna con una
// famiglia di stimolo diversa — non una singola schermata isolata.
function codeRange(base, count, step){
  step = step||1;
  return Array.from({length:count},(_,i)=>String.fromCodePoint(base+i*step));
}
// Famiglie "testuali": l'elemento è una stringa di `len` caratteri presa dal pool,
// la lunghezza cresce col livello (asse 1 di difficoltà, come negli originali).
// unlockLevel = livello minimo (su 32) da cui questa famiglia può comparire in sessione. Gli sblocchi sono
// distribuiti in modo uniforme tra il livello 1 e il 28 (prima 1-15); i livelli 29-32 hanno già tutte le
// famiglie e salgono per numero di elementi, lunghezza e somiglianza dei tipi.
const INTRUSO_TEXT_FAMILIES = [
  {id:"digit", label:"cifre", pool:"0123456789".split(""), unlockLevel:1},
  {id:"letter", label:"lettere", pool:"ABCDEFGHILMNOPQRSTUVZ".split(""), unlockLevel:1},
  {id:"roman", label:"numeri romani", pool:["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ","Ⅷ","Ⅸ","Ⅹ"], unlockLevel:3},
  {id:"cyrillic", label:"cirillico", pool: codeRange(0x0410,32), unlockLevel:6},
  {id:"armenian", label:"armeno", pool: codeRange(0x0530,38), unlockLevel:11},
  {id:"thai", label:"thai", pool: codeRange(0x0E01,40), unlockLevel:13},
  {id:"geez", label:"ge'ez", pool: codeRange(0x1200,60), unlockLevel:17},
  {id:"cyrillic-arcaico", label:"cirillico arcaico", pool: codeRange(0x0460,16,2), unlockLevel:24},
  {id:"canadian", label:"sillabario canadese", pool: codeRange(0x1400,50), unlockLevel:26},
  // Nuove famiglie (livelli 1-14): lettere minuscole e a/A mescolate (livelli bassi), alfabeto greco,
  // poi scritture non latine via via meno familiari. Stessi criteri delle altre: un solo singolo,
  // tutti gli altri almeno 2 volte, pool ampio di caratteri simili tra loro.
  {id:"lower", label:"lettere minuscole", pool:"abdeghilmnopqrstuvz".split(""), unlockLevel:1},
  {id:"mixedcase", label:"lettere maiuscole e minuscole", pool:["a","A","b","B","d","D","e","E","g","G","n","N","r","R","t","T"], unlockLevel:1},
  {id:"greek", label:"alfabeto greco", pool: codeRange(0x0391,25).filter(ch=>ch.codePointAt(0)!==0x03A2), unlockLevel:5},
  {id:"katakana", label:"katakana", pool: codeRange(0x30A2,48), unlockLevel:16},
  {id:"hiragana", label:"hiragana", pool: codeRange(0x3042,48), unlockLevel:18},
  // (ebraico senza le lettere finali ך ם ן ף ץ, che a metà stringa risulterebbero scorrette)
  {id:"hebrew", label:"ebraico", pool: codeRange(0x05D0,27).filter(ch=>![0x05DA,0x05DD,0x05DF,0x05E3,0x05E5].includes(ch.codePointAt(0))), unlockLevel:20},
  {id:"devanagari", label:"devanagari", pool: codeRange(0x0915,25), unlockLevel:22}
];
// Famiglie "atomiche": l'elemento è un solo glifo (dadi, domino...), come negli
// originali — non concatenato in stringhe, la difficoltà sta nella somiglianza visiva.
// "carte" rimossa: i glifi Unicode delle carte da gioco sono troppo piccoli/poco
// leggibili anche ingranditi (segnalato da Rodrigo). unlockLevel come sopra: solo
// dal livello indicato la famiglia può comparire, così gli ideogrammi (i più
// difficili) non escono più al livello 1 come accadeva prima di questa correzione.
const INTRUSO_ATOMIC_FAMILIES = [
  {id:"arrow", label:"frecce", pool:["↑","↓","←","→","↖","↗","↘","↙","⇑","⇓","⇐","⇒"], unlockLevel:1},
  {id:"geometric", label:"forme", pool:["●","○","■","□","▲","△","▼","▽","◆","◇","★","☆"], unlockLevel:1},
  // Famiglie a pool ristretto (semi, note, dadi): con 4-6 opzioni l'unico singolo si trova a
  // colpo d'occhio, e ai livelli alti diventava troppo facile (segnalato da Rodrigo). Per
  // questo hanno `small:true`: dal livello `extraFrom` il pool si allarga con simboli
  // molto simili a quelli base (semi pieni + semi "vuoti", note + alterazioni), e dal
  // livello `pairsFrom` gli elementi diventano SEQUENZE di 2 simboli (dal `triplesFrom`
  // di 3) scelte tra varianti quasi identiche — cambia un solo simbolo o l'ordine — invece
  // di simboli scelti a caso. Vedi intrusoPoolFor / intrusoLenFor.
  // Semi e note: soglie anticipate (pool allargato e coppie già dal livello 2, triple dal 5)
  // perché i semi risultavano troppo facili già dal livello 2 (segnalato da Rodrigo); il
  // livello 1 resta con 4 simboli singoli come ingresso. Dadi, cerchi e quadranti: invariati.
  {id:"suits", label:"semi delle carte", pool:["♠","♥","♦","♣"], extra:["♤","♡","♢","♧"], small:true, extraFrom:6, pairsFrom:2, triplesFrom:9, unlockLevel:1},
  {id:"music", label:"note musicali", pool:["♩","♪","♫","♬"], extra:["♭","♮","♯"], small:true, extraFrom:7, pairsFrom:2, triplesFrom:9, unlockLevel:1},
  {id:"punct", label:"punteggiatura", pool:["!","?","#","%","&","@","§","*"], unlockLevel:1},
  {id:"zodiac", label:"simboli zodiacali", pool:["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"], unlockLevel:1},
  {id:"dice", label:"dadi", pool: codeRange(0x2680,6), extra:[], small:true, extraFrom:99, pairsFrom:3, triplesFrom:11, unlockLevel:1},
  {id:"domino", label:"domino", pool: codeRange(0x1F030,32), unlockLevel:8},
  {id:"mahjong", label:"mahjong", pool: codeRange(0x1F007,20), unlockLevel:14},
  {id:"cjk", label:"ideogrammi", pool: codeRange(0x53E3,40), unlockLevel:28},
  // Nuove famiglie a glifo singolo. Cerchi parziali e quadranti hanno pool ristretto (4): come semi e
  // note, si allargano con simboli molto simili e ai livelli alti diventano sequenze di 2-3 simboli.
  {id:"circles", label:"cerchi parzialmente pieni", pool:["◐","◑","◒","◓"], extra:["◔","◕","○","●"], small:true, extraFrom:8, pairsFrom:3, triplesFrom:13, unlockLevel:1},
  {id:"quadrants", label:"quadranti", pool:["◰","◱","◲","◳"], extra:["◧","◨","◩","◪"], small:true, extraFrom:10, pairsFrom:5, triplesFrom:15, unlockLevel:3},
  {id:"box", label:"tratti da tabella", pool:["┌","┐","└","┘","├","┤","┬","┴","┼"], unlockLevel:7},
  {id:"sets", label:"simboli insiemistici", pool:["∈","∉","∩","∪","⊂","⊃","⊆","⊇","∋","∌"], unlockLevel:9},
  {id:"braille", label:"Braille", pool: codeRange(0x2801,63), unlockLevel:14}
];
const INTRUSO_ALL_FAMILIES = [...INTRUSO_TEXT_FAMILIES, ...INTRUSO_ATOMIC_FAMILIES];

// Curva di difficoltà di Intruso percettivo, ricalibrata perché ai livelli bassi/medi (segnalato
// da Rodrigo: il livello 4 risultava molto facile) risultava troppo pianeggiante: quasi tutte le
// famiglie restavano a singolo simbolo, pochi elementi, tipi ben distinti per parecchi livelli
// prima che rodaggio/pool/quantità iniziassero a incidere. Con questa mappa concava (esponente <1)
// la stessa progressione raggiunge un dato grado di difficoltà un po' prima: i livelli bassi e medi
// diventano più sfidanti, mentre il livello 1 resta il più facile di tutti e il livello 32 resta il
// tetto massimo di prima (nessuna esagerazione in cima alla scala) — sposta il gradiente verso
// l'inizio senza cambiarne l'ampiezza complessiva. Usata SOLO per Intruso: non toglie nulla a
// levelT(), che resta la curva lineare condivisa dagli altri esercizi.
const INTRUSO_LEVEL_EASE = 1;   // curva LINEARE: prima era concava (0,6) e anticipava tutti i salti di lunghezza (livelli 4 e 18); ora la difficoltà segue il punteggio unico (vedi INTRUSO_SCORE_W)
function intrusoLevelT(level){ return Math.pow(levelT(level), INTRUSO_LEVEL_EASE); }
function intrusoEffLevel(level){ return 1 + intrusoLevelT(level) * (MAX_LEVEL - 1); }

function distinctIntrusoTypes(pool, len, k, avoid){
  if(len===1) return pickN(pool, Math.min(k,pool.length));
  const set = new Set();
  let tries=0;
  while(set.size<k && tries<800){
    const cand = Array.from({length:len},()=>pick(pool)).join("");
    tries++;
    // finché ci sono tentativi si scartano le combinazioni già proposte a questo gruppo
    if(avoid && tries<500 && avoid(cand)) continue;
    set.add(cand);
  }
  return [...set];
}
// Sequenze "quasi uguali": si parte da una sequenza casuale e ogni nuovo tipo si ottiene da
// uno già scelto cambiando UN solo simbolo oppure scambiando due simboli adiacenti (es. ♠♥ →
// ♥♠ o ♠♦). Così i tipi da confrontare differiscono per un dettaglio, non per l'intera
// stringa: è questo che rende difficile trovare l'unico singolo con pool ristretti.
function similarIntrusoTypes(pool, len, k){
  const first = Array.from({length:len},()=>pick(pool));
  const found = new Map([[first.join(""), first]]);
  let tries=0;
  while(found.size<k && tries<3000){
    tries++;
    const v = pick([...found.values()]).slice();
    if(len>=2 && Math.random()<0.35){
      const i = rnd(len-1);
      [v[i], v[i+1]] = [v[i+1], v[i]];
    } else {
      const i = rnd(len);
      let s, g=0;
      do { s = pick(pool); g++; } while(s===v[i] && g<20);
      v[i] = s;
    }
    found.set(v.join(""), v);
  }
  return [...found.keys()];
}
// Pool effettivo di una famiglia a un dato livello (allargato per le famiglie `small`).
function intrusoPoolFor(family, level){
  if(family.small && family.extra && intrusoEffLevel(level)>=family.extraFrom) return family.pool.concat(family.extra);
  return family.pool;
}
// Lunghezza dell'elemento: 1 per le famiglie atomiche normali; per quelle `small`, 2 e poi 3
// simboli dai livelli alti. Confrontato sul livello effettivo (vedi intrusoEffLevel): le soglie
// pairsFrom/triplesFrom restano le stesse dichiarate sulla famiglia, cambia solo quanto in fretta
// il livello selezionato le raggiunge.
function intrusoLenFor(family, level, textLen){
  if(!family.small) return textLen;
  const lvl = intrusoEffLevel(level);
  if(lvl>=family.triplesFrom) return 3;
  if(lvl>=family.pairsFrom) return 2;
  return 1;
}
function buildIntrusoScreen(family, len, targetN, level, ctx){
  const pool = intrusoPoolFor(family, level||1);
  const poolCap = len===1 ? pool.length : 99;
  const kMax = Math.min(9 + Math.max(0, Math.floor((targetN-18)/3)), poolCap);   // 9 tipi fino a N=20, poi +1 ogni 3 elementi in più: resta "quasi tutti a coppie"
  let k = kMax;
  while(k>=2 && (targetN-1) < 2*(k-1)) k--;
  if(k<2) return null;
  // Con cronologia (ctx): i tipi da mostrare sono quelli meno recenti per questo gruppo e il
  // singolo (l'intruso) è, tra questi, il meno recente come singolo — così cifre, lettere, forme...
  // ruotano invece di ripresentarsi uguali a ogni livello.
  const tKey = t => "T:" + family.id + "|" + t;
  const oKey = t => "O:" + family.id + "|" + t;
  let types;
  if(len===1) types = ctx ? lruOrder(pool, tKey, ctx).slice(0, k) : pickN(pool, Math.min(k, pool.length));
  else if(len>=2 && intrusoEffLevel(level)>=3 && Math.random() < (intrusoEffLevel(level)-2)/30) types = similarIntrusoTypes(pool, len, k);   // dal livello effettivo 3, quota crescente (+1/30) di tipi che differiscono per UN solo carattere (o per l'ordine): al 32 sempre
  else types = distinctIntrusoTypes(pool, len, k, ctx ? (c=>ctx.last.has(tKey(c))) : null);
  if(types.length<k) k = types.length;
  if(k<2) return null;
  const oddType = ctx ? lruOrder(types, oKey, ctx)[0] : pick(types);
  const oddIdx = types.indexOf(oddType);
  const remaining = targetN-1, groups = k-1;
  const base = Math.floor(remaining/groups), rem = remaining%groups;
  const extraIdx = new Set(shuffle(types.map((_,i)=>i).filter(i=>i!==oddIdx)).slice(0, rem));
  const counts = types.map((_,i)=> i===oddIdx ? 1 : base + (extraIdx.has(i) ? 1 : 0));
  let objs = [];
  types.forEach((t,i)=>{ for(let c=0;c<counts[i];c++) objs.push({value:t, isOdd:i===oddIdx}); });
  objs = shuffle(objs);
  const oddIndex = objs.findIndex(o=>o.isOdd);
  const items = objs.map(o=>o.value);
  if(ctx){
    ctx.use("F:" + family.id);
    types.forEach(t=> ctx.use(tKey(t)));
    ctx.use(oKey(oddType));
  }
  return {
    items, oddIndex, familyLabel: family.label, familyId: family.id,
    rule: `Trova l'unico elemento «${family.label}» che compare una sola volta (tutti gli altri sono ripetuti almeno 2 volte).`,
    answer: `Posizione ${oddIndex+1}: «${items[oddIndex]}»`
  };
}
// Le famiglie testuali NON sono tutte uguali (segnalato da Rodrigo): le cifre (10 simboli, molto
// familiari) reggono le coppie presto, un alfabeto enorme e poco familiare come il ge'ez (60
// simboli) ne ha bisogno molto più avanti. Quanto più il pool è ampio, tanto più a lungo la
// famiglia resta a SINGOLO simbolo prima di passare a coppie e poi terne.
function textFamilyWarmup(poolSize){
  if(poolSize<=12) return {pair:6, triple:22};    // cifre, numeri romani
  if(poolSize<=20) return {pair:8, triple:24};    // minuscole, maiuscole+minuscole, cirillico arcaico
  if(poolSize<=28) return {pair:9, triple:26};    // lettere, ebraico, greco, devanagari
  if(poolSize<=40) return {pair:11, triple:99};   // cirillico, armeno, thai: pool ampi, mai terne
  return {pair:13, triple:99};                    // katakana, hiragana, canadese, ge'ez: pool grandissimi, mai terne
}
// Lunghezza dell'elemento per UNA famiglia testuale, a un dato livello. Il conteggio dei livelli
// di "rodaggio" in singolo parte da QUANDO LA FAMIGLIA SI SBLOCCA (family.unlockLevel), non dal
// livello assoluto: così anche una famiglia sbloccata tardi (es. il thai al livello 13) ha comunque
// i propri livelli in singolo prima di passare a coppie, invece di uscire già in coppia alla prima
// comparsa solo perché il livello assoluto era già oltre la soglia generica.
// Tetto a 3: sequenze più lunghe non aggiungono discriminabilità utile, solo fatica di lettura.
function lenForFamily(family, level){
  const lvl = intrusoEffLevel(level);
  const w = textFamilyWarmup(family.pool.length);
  const pairFrom = family.unlockLevel + w.pair;
  const tripleFrom = family.unlockLevel + w.triple;
  return lvl < pairFrom ? 1 : (lvl < tripleFrom ? 2 : 3);
}
// ---------- PUNTEGGIO UNICO DI DIFFICOLTÀ (Intruso percettivo) ----------
// Ogni schermata ha un punteggio D (0-1) = somma pesata di:
//   lunghezza dell'elemento (1, 2 o 3 simboli: uguale per tutta la sessione),
//   famiglia di stimoli (quanto è ostica: sblocco tardivo, glifo poco riconoscibile — vedi INTRUSO_RECOGNIZABILITY),
//   somiglianza dei tipi (quota di tipi "quasi uguali", cresce col livello; solo per elementi di 2-3 simboli),
//   numerosità (quanti elementi tra cui cercare).
// D segue un obiettivo LINEARE del livello (INTRUSO_TARGET_D). Lunghezza e somiglianza sono decisi dal livello, la famiglia
// dalla famiglia: la NUMEROSITÀ è la variabile che si risolve per far tornare il punteggio. Conseguenze: a ogni
// cambio di lunghezza (livelli 9 e 21) il numero di elementi ricade un po' e poi risale (dente di sega), e nella
// stessa schermata una famiglia più ostica ha meno elementi di una facile — a parità di livello tutte le schermate
// pesano uguale.
const INTRUSO_SCORE_W = { len:0.25, fam:0.25, sim:0.20, n:0.30 };
const INTRUSO_TARGET_D = [0.05, 0.80];      // punteggio obiettivo al livello 1 → 32 (lineare)
const INTRUSO_N_RANGE = [15, 30];           // numerosità minima / massima (27 per le terne)
const INTRUSO_LEN_STEPS = [9, 21];          // livelli da cui gli elementi sono di 2 / di 3 simboli
function intrusoTargetD(level){ return INTRUSO_TARGET_D[0] + (INTRUSO_TARGET_D[1]-INTRUSO_TARGET_D[0])*levelT(level); }
function intrusoFamTerm(family){ return Math.min(1, 0.7*Math.min(1, family.unlockLevel/28) + (1 - intrusoRecognizability(family.id))); }
function intrusoSimTerm(level, len){ return len>=2 ? Math.max(0, Math.min(1, (intrusoEffLevel(level)-2)/30)) : 0; }
function targetNForLevelIntruso(level, family, len){
  const W = INTRUSO_SCORE_W;
  const rest = W.len*(len-1)/2 + W.fam*intrusoFamTerm(family) + W.sim*intrusoSimTerm(level, len);
  const nScore = Math.max(0, Math.min(1, (intrusoTargetD(level) - rest)/W.n));
  const cap = len>=3 ? 27 : INTRUSO_N_RANGE[1];
  return Math.min(cap, Math.round(INTRUSO_N_RANGE[0] + nScore*(INTRUSO_N_RANGE[1]-INTRUSO_N_RANGE[0])));
}
// Famiglie a "tessera" (mahjong, domino, semi delle carte): il glifo occupa solo una parte del
// riquadro del carattere, quindi a 18-30 elementi per schermata risultava molto piccolo. Prima
// avevano un tetto fisso (12, o 15 per i semi singoli) uguale a ogni livello: nella stessa sessione
// comparivano schermate con 12 elementi accanto ad altre con 25-30 (segnalato da Rodrigo:
// numerosità non coerente tra famiglie). Ora la numerosità segue lo stesso andamento per livello di
// tutte le altre famiglie, moltiplicata per un fattore di riconoscibilità fisso (0,8, scelto da
// Rodrigo): un po' meno elementi dove il glifo si legge peggio, senza un tetto assoluto.
// Il vincolo "un solo singolo, tutti gli altri almeno 2 volte" vale a qualsiasi numero.
// Per le famiglie a tessera: tra n-3 e n+3 (mai sopra maxN, almeno 6) sceglie il numero di elementi
// che, disposto in griglia piena sull'area utile della slide esportata (13,33×7,5 in con margine
// 0,3), permette il corpo più grande — stessa stima usata in exportIntruso (altezza e larghezza
// della cella, coppie/terne al 62%/74% della cella). A parità di corpo vince il numero più vicino
// a quello voluto. (niceIntrusoCount usa invece 1333×500, un rapporto più largo di quello della
// slide: per le coppie di simboli favoriva griglie a 7 colonne strette.)
function bestTileCount(n, len, famId, maxN){
  const areaW = 13.33-0.6, areaH = 7.5-0.6;
  const cw = (len>=2 && INTRUSO_GROUP_CHAR_WIDTH[famId]) || INTRUSO_FAMILY_CHAR_WIDTH[famId] || INTRUSO_DEFAULT_ATOMIC_CHAR_WIDTH;
  const frac = len>=3 ? 0.74 : (len===2 ? 0.62 : 0.85);
  let best = Math.min(n, maxN), bestScore = -1, bestDist = Infinity;
  for(let cand=Math.max(6,n-3); cand<=Math.min(maxN,n+3); cand++){
    const cols = bestGridCols(cand, areaW, areaH), rows = cand/cols;
    const cellW = areaW/cols, cellH = areaH/rows;
    const score = len===1 ? Math.min(cellW, cellH)*72 : Math.min(cellH*32, cellW*72*frac/len/cw);
    const dist = Math.abs(cand-n);
    if(score > bestScore + 1e-9 || (Math.abs(score-bestScore) <= 1e-9 && dist < bestDist)){ bestScore = score; best = cand; bestDist = dist; }
  }
  return best;
}
const INTRUSO_RECOGNIZABILITY = { mahjong:0.8, domino:0.8, suits:0.8 };
function intrusoRecognizability(famId){
  return INTRUSO_RECOGNIZABILITY[famId] ?? 1;
}
// Punteggio di difficoltà (0..1) di UNA famiglia a un dato livello, comparabile fra famiglie
// diverse. Prima le famiglie di una sessione erano scelte a rotazione fra tutte quelle sbloccate,
// senza guardare a che punto della propria scala INTERNA (singolo/coppia/terna, distrattori simili
// o no, pool più o meno familiare) si trovasse ciascuna: risultato, famiglie a pool piccolo (semi,
// note, dadi, cerchi parziali) passavano a coppie di simboli quasi identici già dal livello 2-3,
// mentre cifre e lettere restavano a singolo per molti livelli — nella stessa sessione comparivano
// fianco a fianco schermate obiettivamente molto più difficili di altre allo stesso livello
// (segnalato da Rodrigo: "crescita della difficoltà non omogenea, mescolate"). Pesi: la lunghezza
// dell'elemento (singolo/coppia/terna) conta di più perché cambia il tipo di confronto richiesto;
// la familiarità della famiglia (unlockLevel, già ordinato da Rodrigo dal più facile al più
// ostico) e la presenza di distrattori "quasi identici" pesano meno; il numero di elementi per
// schermata meno ancora (conta, ma resta un fattore di fatica, non di strategia).
// Lunghezza dell'elemento UNICA per tutta la sessione (richiesta di Rodrigo: non possono coesistere
// singoli semplici e coppie di simboli complessi). Dipende solo dal livello, non dalla famiglia:
// tutte le schermate di una sessione hanno elementi di 1, 2 o 3 simboli, mai misti.
function intrusoSessionLen(level){
  const e = intrusoEffLevel(level);
  return e < INTRUSO_LEN_STEPS[0] ? 1 : (e < INTRUSO_LEN_STEPS[1] ? 2 : 3);
}
// Lunghezza massima sostenibile da una famiglia (i pool enormi non arrivano alle terne; le tessere
// di domino e mahjong restano singole: occupano già molto spazio e devono restare grandi).
function intrusoMaxLen(family){
  if(INTRUSO_TEXT_FAMILIES.includes(family)) return textFamilyWarmup(family.pool.length).triple<99 ? 3 : 2;
  if(family.id==="domino" || family.id==="mahjong") return 1;
  return family.small ? 3 : 2;
}
// Famiglie ammesse in una sessione di lunghezza L: sbloccate, capaci di reggere L e, se L>1,
// "rodate" da qualche livello (non compaiono in coppia alla prima comparsa).
function intrusoEligibleFamilies(level, L){
  const base = INTRUSO_ALL_FAMILIES.filter(f=>f.unlockLevel<=level && intrusoMaxLen(f)>=L);
  if(L===1) return base;
  const settled = base.filter(f=>level >= f.unlockLevel+3);
  return settled.length>=4 ? settled : base;
}
// Lunghezza effettiva della sessione: quella del livello, ridotta solo se troppo poche famiglie la reggono.
function intrusoPlanLen(level){
  let L = intrusoSessionLen(level);
  while(L>1 && intrusoEligibleFamilies(level, L).length < 4) L--;
  return L;
}
// Punteggio di difficoltà (0..1) di UNA famiglia a lunghezza L: ora la lunghezza è la stessa per
// tutte, quindi differenziano solo la familiarità (unlockLevel), la somiglianza dei distrattori
// (uguale per tutte, dipende dal livello) e il numero di elementi.
function intrusoFamilyDifficulty(family){ return intrusoFamTerm(family); }
function levelFamiliesIntruso(level, count, ctx){
  // Tutte le schermate della sessione hanno la STESSA lunghezza dell'elemento (intrusoPlanLen).
  // Tra le famiglie ammesse, ordinate per difficoltà, si sceglie una finestra il cui punto di
  // partenza sale con il livello: livelli bassi = famiglie più familiari, livelli alti = più ostiche,
  // ma dentro una sessione la forbice resta stretta. Dentro la finestra, rotazione per cronologia.
  count = count || 9;
  const L = intrusoPlanLen(level);
  const eligible = intrusoEligibleFamilies(level, L).slice().sort((a,b)=>intrusoFamilyDifficulty(a, level, L)-intrusoFamilyDifficulty(b, level, L));
  const w = Math.min(eligible.length, Math.max(Math.min(count, eligible.length), Math.ceil(eligible.length*0.5)));
  const start = Math.round(intrusoLevelT(level) * (eligible.length - w));
  const pool = eligible.slice(start, start + w);
  const order = [];
  while(order.length<count) order.push(...(ctx ? lruOrder(pool, f=>"F:"+f.id, ctx) : shuffle(pool)));
  const chosen = order.slice(0, count);
  return chosen.sort((a,b)=> intrusoFamilyDifficulty(a, level, L) - intrusoFamilyDifficulty(b, level, L));
}

function genIntruso(level, excludeKeys){
  const ctx = makeAvoidCtx(excludeKeys);
  const count = state.intrusoScreensOverride || 9;
  const ov = state.materialOverride.intruso;
  let fams;
  if(ov && ov!=="auto"){
    // Variare il materiale non deve MAI distorcere la logica: stessa famiglia per tutte
    // le schermate, ma ciascuna generata in modo indipendente con la stessa identica
    // regola di conteggio (n=15/18, un solo singolo) usata in modalità automatica.
    const overrideFam = INTRUSO_ALL_FAMILIES.find(f=>f.id===ov) || INTRUSO_TEXT_FAMILIES[0];
    fams = Array.from({length:count}, ()=>overrideFam);
  } else {
    fams = levelFamiliesIntruso(level, count, ctx);
  }
  const slides = fams
    .map(fam=>{
      const famLen = Math.min(intrusoPlanLen(level), intrusoMaxLen(fam));   // stessa lunghezza per tutta la sessione
      // numerosità risolta dal punteggio unico (vedi INTRUSO_SCORE_W), che include già la riconoscibilità della
      // famiglia; per le famiglie a tessera si sceglie poi, entro qualche unità, il numero che dà i simboli più
      // grandi sull'area REALE della slide (mai sopra il tetto)
      const levelN = targetNForLevelIntruso(level, fam, famLen);
      const targetN = intrusoRecognizability(fam.id) < 1
        ? bestTileCount(levelN, famLen, fam.id, Math.min(famLen>=3 ? 27 : INTRUSO_N_RANGE[1], levelN+2))
        : niceIntrusoCount(levelN, 1333, 500);
      return buildIntrusoScreen(fam, famLen, targetN, level, ctx);
    })
    .filter(Boolean);

  return {
    type:"intruso",
    slides,
    rule: "Trova l'unico elemento che compare una sola volta (tutti gli altri sono ripetuti almeno 2 volte).",
    historyKeys: ctx.newKeys
  };
}
function shuffleInPlace(a){
  for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
