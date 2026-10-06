// Generatore — Inversione e riordino (comprende le funzioni di supporto shuffleInPlace, markChars, withMarks, non-parole).
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale prima e dopo identico).

// ---------- INVERSIONE E RIORDINO ----------
// Contrassegni: livelli 1-4: 1 solo rosso; 5-15: 1 rosso oppure 2 rossi, con quota di "2" in salita
// (+1/12 a livello); 16-32: rosso e verde insieme.
function markChars(text, level){
  const positions = [...text].map((_,i)=>i);
  let n, colors;
  if(level>=16){ n=2; colors=["#D64545","#3E9B4F"]; }
  else { n = (level>=5 && Math.random() < Math.min(1,(level-4)/12)) ? 2 : 1; colors=["#D64545","#D64545"]; }
  n = Math.min(n, text.length);
  const chosen=[];
  while(chosen.length<n){ const i=pick(positions); if(!chosen.includes(i)) chosen.push(i); }
  chosen.sort((a,b)=>a-b);
  return chosen.map((idx,k)=>({index:idx, color:colors[k]}));
}
function withMarks(text, level){
  return {text, marks: markChars(text, level)};
}

// Non-parole pronunciabili: sillabe aperte italiane (consonante+vocale, oppure gruppo
// consonantico+vocale come BR, TR, SP, GN), mai due vocali di fila e mai finali in consonante.
// Prima si concatenavano onset+vocale e si tagliava alla lunghezza voluta, con esiti a volte
// impronunciabili e non-parole che coincidevano per caso con parole vere (PANE, LUNA...): ora la
// struttura è esatta per ogni lunghezza e le parole vere sono escluse con INV_REAL_BLOCK.
const IT_ONSETS_SIMPLE = ["B","C","D","F","G","L","M","N","P","R","S","T","V","Z"];
const IT_ONSETS_CLUSTER = ["BR","CR","DR","FR","GR","PR","TR","VR","BL","CL","FL","GL","PL","ST","SP","SC","GN"];
const IT_VOWELS = ["A","E","I","O","U"];
function _cv(){ return pick(IT_ONSETS_SIMPLE) + pick(IT_VOWELS); }
function _ccv(){ return pick(IT_ONSETS_CLUSTER) + pick(IT_VOWELS); }
function pronounceableNonword(len){
  const patterns = {
    3: [()=>_ccv(), ()=>_ccv(), ()=>pick(IT_VOWELS)+_cv(), ()=>_cv()+pick(["L","M","N","R","S","T"])],
    4: [()=>_cv()+_cv(), ()=>_cv()+_cv(), ()=>pick(IT_VOWELS)+_ccv()],
    5: [()=>_cv()+_ccv(), ()=>_ccv()+_cv(), ()=>pick(IT_VOWELS)+_cv()+_cv()]
  };
  const list = patterns[len];
  if(!list){ let t = ""; while(t.length < len) t += _cv(); return t.slice(0, len); }
  return pick(list)();
}
function nonwordFor(len, level){
  // livelli bassi (non-parole "iniziali"): sempre pronunciabile.
  // livelli alti: introduce gradualmente combinazioni meno pronunciabili (in linea col
  // gradiente generale "riduzione del supporto fonologico"), ma mai al livello 1.
  // In ogni caso: mai una lettera ripetuta nella stessa stringa e mai una parola vera.
  const isReal = w => INV_REAL_BLOCK.has(w.toUpperCase());
  const pronounceProb = invPronounceProb(level);
  if(Math.random()<pronounceProb){
    for(let tries=0; tries<80; tries++){
      const w = pronounceableNonword(len);
      if(!hasDuplicateChars(w) && !isReal(w)) return w;
    }
  }
  for(let tries=0; tries<40; tries++){
    const w = randLetters(len);
    if(!isReal(w)) return w;
  }
  return randLetters(len);
}

// Numero totale di elementi nell'intera sessione (somma di tutti i blocchi/consegne), non
// più un numero fisso di elementi per blocco: 20 nei livelli 1-8, 30 dal livello 9 in poi,
// distribuiti in modo il più possibile uniforme tra le consegne effettivamente presenti in
// quella sessione (auto o override che sia).
// Totale elementi di sessione: 20 fino al livello 14, 30 dal 15.
function inversioneSessionTotal(level){
  return level>=15 ? 30 : 20;
}
// Lunghezze dei blocchi (32 livelli, finestra scorrevole per non moltiplicare i blocchi):
// 1-3: solo 3 caratteri; 4-14: 3-4; 15-22: 3-5; 23-28: 4-5; 29-32: 4-6.
function inversioneLens(level){
  if(level<=3) return [3];
  if(level<=14) return [3,4];
  if(level<=22) return [3,4,5];
  if(level<=28) return [4,5];
  return [4,5,6];
}
const INV_ALNUM_FROM = 11, INV_LEXICAL_UNTIL = 8;
// Quota di non-parole PRONUNCIABILI (il resto sono sequenze di lettere casuali): 100% fino al livello 9,
// poi scende in modo lineare fino al 20% del livello 32.
function invPronounceProb(level){ return level<=9 ? 1 : Math.max(0.2, 1 - 0.8*(level-9)/23); }
// Quota di stringhe a maiuscole/minuscole MISTE: nessuna fino al livello 14, poi sale fino al 100% del 26.
function invMixedCaseProb(level){ return level<=14 ? 0 : Math.min(1, (level-14)/12); }
// Numero medio di blocchi in modalità automatica a un dato livello, usato solo per mostrare
// un valore di default sensato nello slider "Numero di stimoli per blocco" (il conteggio
// reale per blocco viene poi ricalcolato in genInversione in base alle consegne presenti).
function inversioneAutoBlockCount(level){
  const lens = inversioneLens(level);
  let n = lens.length*2; // lettere + numeri
  if(level>=INV_ALNUM_FROM) n += lens.filter(l=>l>=4).length;
  return n || 1;
}
function defaultItemsPerInversione(level){
  return Math.round(inversioneSessionTotal(level) / inversioneAutoBlockCount(level));
}

function genInversione(level, excludeKeys){
  // excludeKeys: cronologia del gruppo (elementi già proposti, anche a livelli diversi).
  const ctx = makeAvoidCtx(excludeKeys);
  const lexical = level<=INV_LEXICAL_UNTIL;
  const pCase = invMixedCaseProb(level);
  const alnum = level>=INV_ALNUM_FROM || state.inversioneForceAlnum; // la spunta anticipa il blocco alfanumerico, la complessità (lunghezza, maiuscole) resta comunque legata al livello vero
  const lens = inversioneLens(level);
  const ov = state.materialOverride.inversione;
  const alnumLens = ov==="mixed" ? lens : lens.filter(l=>l>=4);

  // Prima si stabilisce l'elenco delle consegne (blocchi) che verranno effettivamente
  // generate, poi si distribuisce il totale di sessione in modo uniforme tra queste — così
  // la somma resta 20 (livelli 1-8) o 30 (dal 9° in poi) qualunque sia il materiale attivo.
  const blockSpecs = [];
  if(!ov || ov==="auto" || ov==="letters"){
    lens.forEach(len=> blockSpecs.push({kind:"letters", len}));
  }
  if(!ov || ov==="auto" || ov==="digits"){
    lens.forEach(len=> blockSpecs.push({kind:"digits", len}));
  }
  if(ov==="mixed" || (alnum && (!ov || ov==="auto"))){
    alnumLens.forEach(len=> blockSpecs.push({kind:"alnum", len}));
  }

  const nBlocks = blockSpecs.length || 1;
  let itemsForBlock;
  if(state.inversioneItemsOverride){
    // Controllo manuale "Numero di stimoli per blocco": resta un valore fisso per blocco,
    // scelto in seduta dal terapista — non entra nella distribuzione automatica del totale.
    itemsForBlock = new Array(nBlocks).fill(state.inversioneItemsOverride);
  } else {
    const total = inversioneSessionTotal(level);
    const base = Math.floor(total/nBlocks), rem = total%nBlocks;
    itemsForBlock = new Array(nBlocks).fill(base);
    shuffle(blockSpecs.map((_,i)=>i)).slice(0,rem).forEach(i=>{ itemsForBlock[i]++; });
  }

  const notTrivial = str => !isTrivialOrder(str);
  const blocks = [];
  blockSpecs.forEach((spec,i)=>{
    const itemsPer = itemsForBlock[i];
    const len = spec.len;
    if(spec.kind==="letters"){
      let raw;
      if(lexical && REAL_WORDS[len]){
        // Mai una lettera ripetuta nella stessa parola (già garantito dal pool), mai una
        // parola già proposta a questo gruppo finché ne restano di nuove.
        // Si escludono le parole già in ordine alfabetico (o al contrario), che renderebbero banale
        // il riordino — ma solo se il pool resta ampio: le parole da 3 lettere sono poche e le
        // teniamo tutte, piuttosto che ripetere spesso le stesse.
        const allWords = REAL_WORDS[len].filter(w=>!hasDuplicateChars(w));
        const nonTrivial = allWords.filter(w=>!isTrivialOrder(w));
        const pool = nonTrivial.length>=60 ? nonTrivial : allWords;
        raw = pickFreshFromPool(pool, Math.min(itemsPer, pool.length), w=>invKey("L", w), ctx);
      } else {
        // In uno stesso blocco, iniziali tutte diverse finché possibile (niente serie tipo FRE FRI FRO).
        const firsts = new Set();
        raw = Array.from({length:itemsPer}, ()=>{
          const w = genFresh(
            ()=>{ const t = nonwordFor(len, level); return Math.random()<pCase ? randCase(t) : t; },
            t=>invKey("L", t), ctx, t=>notTrivial(t) && !firsts.has(t[0].toUpperCase()));
          firsts.add(w[0].toUpperCase());
          return w;
        });
      }
      const items = raw.map(t=>withMarks(t, level));
      blocks.push({label:`Lettere — ${len} caratteri`, items, kind:"letters"});
    } else if(spec.kind==="digits"){
      const firstDigits = new Set(); // prime cifre tutte diverse nello stesso blocco, finché possibile
      const items = Array.from({length:itemsPer}, ()=>{
        const d = genFresh(()=>randDigits(len), x=>invKey("D", x), ctx, x=>notTrivial(x) && !firstDigits.has(x[0]));
        firstDigits.add(d[0]);
        return withMarks(d, level);
      });
      blocks.push({label:`Numeri — ${len} cifre`, items, kind:"digits"});
    } else if(spec.kind==="alnum"){
      const items = Array.from({length:itemsPer}, ()=> withMarks(
        genFresh(()=>randAlnum(len), a=>invKey("A", a), ctx, notTrivial), level));
      blocks.push({label:`Alfanumerico misto — ${len} caratteri`, items, kind:"alnum"});
    }
  });
  return {type:"inversione", blocks, slides:[{blocks}], historyKeys: ctx.newKeys};
}
