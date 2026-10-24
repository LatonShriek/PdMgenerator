// Utilità: numeri casuali, pesca senza ripetizioni (anti-ripetizione), livelli.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   UTILITY
   ========================================================= */
function rnd(n){return Math.floor(Math.random()*n);}
function pick(arr){return arr[rnd(arr.length)];}
function pickN(arr,n){
  const pool=[...arr]; const out=[];
  while(out.length<n && pool.length){ out.push(pool.splice(rnd(pool.length),1)[0]); }
  return out;
}
function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function pickBalanced(pool, n){
  // ripete il pool mescolato quante volte serve, cosi' su n prove ogni elemento del pool
  // ricorre un numero di volte il piu' possibile uniforme (mai lunghe serie ripetute).
  let out = [];
  while(out.length < n) out = out.concat(shuffle(pool));
  return out.slice(0, n);
}
function randCase(str){
  return str.split("").map(c=>Math.random()<0.5?c.toUpperCase():c.toLowerCase()).join("");
}
// Restituisce true se `s` contiene lo stesso carattere (case-insensitive) più di una volta.
function hasDuplicateChars(s){
  const seen = new Set();
  for(const ch of s.toUpperCase()){
    if(seen.has(ch)) return true;
    seen.add(ch);
  }
  return false;
}
function randDigits(len){
  // Cifre sempre tutte diverse tra loro (mai la stessa cifra ripetuta nello stesso numero):
  // si pesca senza reinserimento da una permutazione di 0-9 invece di estrarre ogni
  // posizione indipendentemente. Il primo carattere non è mai 0.
  const digits = shuffle([0,1,2,3,4,5,6,7,8,9]);
  if(digits[0]===0){
    const swapIdx = 1 + rnd(digits.length-1);
    [digits[0], digits[swapIdx]] = [digits[swapIdx], digits[0]];
  }
  return digits.slice(0, len).join("");
}
function randLetters(len,pool=ALPHABET){
  // Lettere sempre tutte diverse tra loro (mai la stessa lettera ripetuta nella stessa
  // stringa), stesso principio delle cifre: pescate senza reinserimento.
  return shuffle(pool).slice(0, len).join("");
}
function randAlnum(len){
  // Quando lettere e cifre convivono nella stessa stringa devono essercene sempre almeno 2
  // di entrambe (mai una sola cifra sperduta tra le lettere, o viceversa), e nessun
  // carattere — lettera o cifra — ripetuto all'interno della stessa stringa.
  const DIGIT_CHARS = ["0","1","2","3","4","5","6","7","8","9"];
  if(len<4){
    // Sotto i 4 caratteri non è possibile garantire almeno 2+2: resta comunque garantita
    // l'assenza di ripetizioni.
    const mixedPool = shuffle([...ALPHABET, ...DIGIT_CHARS]);
    return randCase(mixedPool.slice(0, len).join(""));
  }
  const minEach = 2;
  const extra = len - 2*minEach; // 0 per len=4, 1 per len=5
  const nLetters = minEach + (extra>0 && Math.random()<0.5 ? extra : 0);
  const nDigits = len - nLetters;
  const letters = shuffle(ALPHABET).slice(0, nLetters);
  const digits = shuffle(DIGIT_CHARS).slice(0, nDigits);
  return randCase(shuffle([...letters, ...digits]).join(""));
}
/* =========================================================
   ANTI-RIPETIZIONE — stesso materiale mai riproposto allo stesso gruppo, nemmeno a livelli
   diversi. `usedList` è la cronologia del gruppo (chiavi in ordine cronologico, le più recenti in
   fondo). Si preferisce sempre materiale MAI proposto; solo se il pool finisce si riparte da
   quello proposto meno di recente.
   ========================================================= */
function makeAvoidCtx(usedList){
  const last = new Map();
  (usedList||[]).forEach((k,i)=> last.set(k, i));
  return {
    last, session:new Set(), newKeys:[], counter:(usedList||[]).length,
    use(k){ this.session.add(k); this.newKeys.push(k); this.last.set(k, this.counter++); }
  };
}
// Ordina una lista dal materiale MAI usato (in ordine casuale) a quello usato meno di recente.
function lruOrder(list, keyFn, ctx){
  return shuffle(list)
    .map(x=>({x, l: ctx.last.has(keyFn(x)) ? ctx.last.get(keyFn(x)) : -1}))
    .sort((a,b)=>a.l-b.l)
    .map(o=>o.x);
}
// Pesca n elementi da un pool finito (senza doppioni nella stessa sessione).
function pickFreshFromPool(pool, n, keyFn, ctx){
  const cand = shuffle(pool).filter(x=>!ctx.session.has(keyFn(x)));
  const fresh = cand.filter(x=>!ctx.last.has(keyFn(x)));
  const stale = cand.filter(x=>ctx.last.has(keyFn(x))).sort((a,b)=>ctx.last.get(keyFn(a))-ctx.last.get(keyFn(b)));
  const out = fresh.concat(stale).slice(0, n);
  out.forEach(x=>ctx.use(keyFn(x)));
  return out;
}
// Genera un elemento con un generatore casuale, scartando i doppioni di sessione e ciò che il
// gruppo ha già visto; se dopo molti tentativi il generatore non produce nulla di nuovo
// (spazio esaurito) ripiega sull'elemento visto meno di recente.
function genFresh(genFn, keyFn, ctx, accept){
  let fallback = null;
  for(let t=0; t<300; t++){
    const v = genFn();
    if(accept && !accept(v)) continue;
    const k = keyFn(v);
    if(ctx.session.has(k)) continue;
    if(!ctx.last.has(k)){ ctx.use(k); return v; }
    if(fallback===null || ctx.last.get(k) < ctx.last.get(keyFn(fallback))) fallback = v;
  }
  if(fallback!==null){ ctx.use(keyFn(fallback)); return fallback; }
  const v = genFn(); ctx.use(keyFn(v)); return v;
}
// Una stringa già in ordine (crescente o decrescente) rende banale il compito di riordino/inversione.
function isTrivialOrder(str){
  const u = str.toUpperCase();
  const asc = u.split("").sort().join("");
  return u===asc || u===asc.split("").reverse().join("");
}
function invKey(kind, text){ return kind + ":" + text.toUpperCase(); }

// TUTTI gli esercizi a livelli hanno ora 32 livelli (prima 16, Serie attentive 24).
const MAX_LEVEL = 32;
// Posizione di difficoltà normalizzata: livello 1 → 0, livello 32 → 1.
function levelT(level){ return Math.max(0, Math.min(1, (level-1)/(MAX_LEVEL-1))); }
function tierFromLevel(level, nTiers){
  return Math.min(nTiers-1, Math.floor((level-1)/(MAX_LEVEL/nTiers)));
}
// Scelta "sfumata" di una fascia di difficoltà (0..n-1): a ogni livello si mescolano le due fasce
// adiacenti in proporzione alla posizione del livello, così la difficoltà sale in modo uniforme
// su 32 gradini invece che a scalini di 4 (o 8) livelli tutti uguali.
function blendedIndex(level, n){
  const pos = levelT(level)*(n-1), lo = Math.floor(pos), frac = pos-lo;
  return (lo < n-1 && Math.random() < frac) ? lo+1 : lo;
}
