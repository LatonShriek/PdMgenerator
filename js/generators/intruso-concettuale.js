// Generatore — Intruso concettuale (ispirato al subtest Intruso del VRT, Basagni et al. 2017):
// quattro parole, tre della stessa categoria e una no; trovare quella che non c'entra.
// Usa la banca di Classificazioni (voci «proposta»: da validare) e i domini in data/intruso-concettuale.js.
// Difficoltà = fascia della categoria + atipicità delle parole + vicinanza dell'intruso (stesso dominio = più difficile).
// Doppio uso: script classico nel browser (genIntrusoConcettuale) e modulo in Node (test).
(function(root){
  var isNode = (typeof module!=="undefined" && module.exports);
  var BANK = isNode ? require("../../data/classificazioni.js") : root.CLASSIFICAZIONI;
  var DOM  = isNode ? require("../../data/intruso-concettuale.js") : root.INTRUSO_DOMINI;

  // ---- costanti di taratura (esposte) ----
  var INTRUSO_CONC_MAX_LEVEL = 32;
  var INTRUSO_CONC_W = { fascia:1.0, atipicita:2.0, stessoDominio:3.0 };
  var SAME_DOMAIN_FROM = 9;      // l'intruso può stare nello stesso dominio solo da questo livello
  var ITEMS_DEFAULT = 8;
  function tNorm(level){ return (level-1)/(INTRUSO_CONC_MAX_LEVEL-1); }
  function maxTier(level){ return 1 + Math.floor((level-1)*5/32); }
  function minTier(level){ return Math.max(1, maxTier(level)-1); }
  function atypMax(level){ return 0.5 + 0.5*tNorm(level); }
  // quota di intrusi dello stesso dominio: 0 fino al livello 8, poi cresce linearmente fino a 0.9 al 32
  function sameDomainProb(level){ return level<SAME_DOMAIN_FROM ? 0 : 0.9*(level-SAME_DOMAIN_FROM+1)/(INTRUSO_CONC_MAX_LEVEL-SAME_DOMAIN_FROM+1); }
  function TARGET_D(level){ return 1.2 + tNorm(level)*7.8; }

  function norm(s){ return s.toLowerCase(); }
  function shuffle(arr, rng){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function inCat(c,w){ return c.w.some(function(x){return norm(x)===norm(w);}); }

  function candidate(level, rng){
    var lo=minTier(level), hi=maxTier(level);
    var pool=BANK.filter(function(c){ return c.t>=lo && c.t<=hi && c.w.length>=4; });
    var X=pool[Math.floor(rng()*pool.length)];
    var same = rng() < sameDomainProb(level);
    var others=BANK.filter(function(c){ return c!==X && ((DOM[c.n]===DOM[X.n]) === same); });
    if(!others.length) return null;
    var Y=others[Math.floor(rng()*others.length)];
    var window=Math.min(X.w.length, Math.max(3, Math.ceil(atypMax(level)*X.w.length)));
    var idx=shuffle(Array.from({length:window},function(_,i){return i;}),rng).slice(0,3).sort(function(a,b){return a-b;});
    var three=idx.map(function(i){return X.w[i];});
    var yw=Y.w.slice(0, Math.max(3, Math.ceil(atypMax(level)*Y.w.length)));
    var odd=yw[Math.floor(rng()*yw.length)];
    // unicità: nessuna categoria che contenga l'intruso può contenere anche due delle tre parole;
    // l'intruso non può stare nella categoria delle altre tre; nessuna categoria contiene tutte e quattro
    if(inCat(X,odd)) return null;
    if(three.some(function(w){return norm(w)===norm(odd);})) return null;
    var bad=BANK.some(function(c){ return inCat(c,odd) && three.filter(function(w){return inCat(c,w);}).length>=2; });
    if(bad) return null;
    var atyp=(idx[0]+idx[1]+idx[2])/3/Math.max(1,X.w.length-1);
    var D=X.t*INTRUSO_CONC_W.fascia + atyp*INTRUSO_CONC_W.atipicita + (same?INTRUSO_CONC_W.stessoDominio:0);
    var words=shuffle(three.concat([odd]),rng), oddIndex=words.indexOf(odd);
    return { words:words, oddIndex:oddIndex, category:X.n, intruderCategory:Y.n, tier:X.t, difficulty:D,
      answer:"L'intruso è «"+odd+"» ("+Y.n+"): le altre tre sono «"+X.n+"»",
      key:"pair:"+X.n+"|"+Y.n };
  }

  function buildIntrusoConcettuale(level, opts){
    opts=opts||{};
    var rng=opts.rng||Math.random, count=Math.max(1,Math.min(16,opts.count||ITEMS_DEFAULT));
    var lastIdx=new Map(); (opts.used||[]).forEach(function(k,i){ lastIdx.set(k,i); });
    var target=TARGET_D(level), chosen=[], sessionCats=new Set(), keys=[];
    for(var n=0;n<count;n++){
      var cands=[];
      for(var t=0;t<600 && cands.length<30;t++){ var c=candidate(level,rng); if(c && !sessionCats.has(c.category)) cands.push(c); }
      if(!cands.length) break;
      cands.sort(function(a,b){
        var la=lastIdx.has(a.key)?lastIdx.get(a.key):-1, lb=lastIdx.has(b.key)?lastIdx.get(b.key):-1;
        if((la<0)!==(lb<0)) return la<0?-1:1;
        if(la>=0 && lb>=0 && la!==lb) return la-lb;
        return Math.abs(a.difficulty-target)-Math.abs(b.difficulty-target);
      });
      var best=cands[0]; best.id="q"+(n+1);
      chosen.push(best); sessionCats.add(best.category); keys.push(best.key);
    }
    return { type:"intrusoconc", level:level, items:chosen, historyKeys:keys,
      rule:"Quattro parole: tre appartengono alla stessa categoria, una no. Trovare l'intruso.",
      slides:chosen.map(function(it){return {item:it};}) };
  }

  function genIntrusoConcettuale(level, used){
    var count=(typeof state!=="undefined" && state.intrusoconcItemsOverride) || ITEMS_DEFAULT;
    return buildIntrusoConcettuale(level, {used:used, count:count});
  }
  var api={ buildIntrusoConcettuale:buildIntrusoConcettuale, maxTier:maxTier, INTRUSO_CONC_W:INTRUSO_CONC_W, sameDomainProb:sameDomainProb };
  if(isNode){ module.exports=api; }
  else { root.genIntrusoConcettuale=genIntrusoConcettuale; root.buildIntrusoConcettuale=buildIntrusoConcettuale; }
})(typeof window!=="undefined"?window:globalThis);
