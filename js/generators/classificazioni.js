// Generatore — Classificazioni (ispirato al subtest omonimo del VRT, Basagni et al. 2017):
// dati tre termini, nominare la categoria. Banca in data/classificazioni.js (voci «proposta»: da validare).
// Difficoltà = fascia di astrazione della categoria + atipicità dei termini scelti + risposta libera.
// Doppio uso: script classico nel browser (funzione globale genClassificazioni) e modulo in Node (test).
(function(root){
  var BANK = (typeof module!=="undefined" && module.exports) ? require("../../data/classificazioni.js") : root.CLASSIFICAZIONI;

  // ---- costanti di taratura (esposte) ----
  var CLASSIFICAZIONI_MAX_LEVEL = 32;
  var CLASSIFICAZIONI_W = { fascia:1.0, atipicita:3.0, rispostaLibera:1.0 };
  var MC_MAX_LEVEL = 8;       // fino a questo livello la risposta si sceglie fra 4 opzioni
  var ITEMS_DEFAULT = 8;
  function tNorm(level){ return (level-1)/(CLASSIFICAZIONI_MAX_LEVEL-1); }
  // fasce 1-5 sbloccate: fascia 2 dal livello 8, 3 dal 14, 4 dal 20, 5 dal 27
  function maxTier(level){ return 1 + Math.floor((level-1)*5/32); }
  function minTier(level){ return Math.max(1, maxTier(level)-1); }
  // quota massima di termini "atipici" (posizione nell'elenco della categoria): 0.5 al livello 1 → 1.0 al 32
  function atypMax(level){ return 0.5 + 0.5*tNorm(level); }
  function CLASSIFICAZIONI_TARGET_D(level){ return 1.4 + tNorm(level)*7.4; }

  function norm(s){ return s.toLowerCase(); }
  function shuffle(arr, rng){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function containing(terms){ return BANK.filter(function(c){ var w=c.w.map(norm); return terms.every(function(t){ return w.indexOf(norm(t))>=0; }); }); }

  function candidate(level, rng){
    var lo=minTier(level), hi=maxTier(level);
    var pool=BANK.filter(function(c){ return c.t>=lo && c.t<=hi; });
    var cat=pool[Math.floor(rng()*pool.length)];
    var window=Math.min(cat.w.length, Math.max(3, Math.ceil(atypMax(level)*cat.w.length)));
    var idx=shuffle(Array.from({length:window},function(_,i){return i;}),rng).slice(0,3).sort(function(a,b){return a-b;});
    var terms=idx.map(function(i){return cat.w[i];});
    var maxTermIndex=idx[2];
    var atyp=(idx[0]+idx[1]+idx[2])/3/Math.max(1,cat.w.length-1);
    var D=cat.t*CLASSIFICAZIONI_W.fascia + atyp*CLASSIFICAZIONI_W.atipicita + (level>MC_MAX_LEVEL?CLASSIFICAZIONI_W.rispostaLibera:0);
    // risposte accettate: nome, sinonimi, categorie più ampie, e ogni altra categoria della banca che contiene i tre termini
    var acc=[cat.n].concat(cat.s, cat.p);
    containing(terms).forEach(function(c){ [c.n].concat(c.s).forEach(function(a){ if(acc.indexOf(a)<0) acc.push(a); }); });
    var item={ category:cat.n, tier:cat.t, terms:terms, accepted:acc, maxTermIndex:maxTermIndex, difficulty:D,
      key:"cat:"+cat.n, setKey:"set:"+cat.n+":"+terms.map(norm).sort().join(",") };
    if(level<=MC_MAX_LEVEL){
      var others=BANK.filter(function(c){ return c.n!==cat.n && acc.indexOf(c.n)<0 && c.s.every(function(s){return acc.indexOf(s)<0;}) && Math.abs(c.t-cat.t)<=1; });
      item.options=shuffle([cat.n].concat(shuffle(others,rng).slice(0,3).map(function(c){return c.n;})),rng);
    }
    return item;
  }

  function buildClassificazioni(level, opts){
    opts=opts||{};
    var rng=opts.rng||Math.random, count=Math.max(1,Math.min(16,opts.count||ITEMS_DEFAULT));
    var lastIdx=new Map(); (opts.used||[]).forEach(function(k,i){ lastIdx.set(k,i); });
    var target=CLASSIFICAZIONI_TARGET_D(level), chosen=[], sessionCats=new Set(), keys=[];
    for(var n=0;n<count;n++){
      var cands=[];
      for(var t=0;t<600 && cands.length<40;t++){ var c=candidate(level,rng); if(c && !sessionCats.has(c.key)) cands.push(c); }
      if(!cands.length) break;
      // categoria mai proposta > categoria proposta meno di recente; a parità, stessa terna mai vista; poi vicinanza al punteggio-obiettivo
      cands.sort(function(a,b){
        // prima di tutto: mai riproporre la stessa terna identica finché ne esiste una nuova (garanzia «4 cicli senza ripetizioni»)
        var ia=lastIdx.has(a.setKey)?1:0, ib=lastIdx.has(b.setKey)?1:0;
        if(ia!==ib) return ia-ib;
        var la=lastIdx.has(a.key)?lastIdx.get(a.key):-1, lb=lastIdx.has(b.key)?lastIdx.get(b.key):-1;
        if((la<0)!==(lb<0)) return la<0?-1:1;
        if(la>=0 && lb>=0 && la!==lb) return la-lb;
        var sa=lastIdx.has(a.setKey)?1:0, sb=lastIdx.has(b.setKey)?1:0;
        if(sa!==sb) return sa-sb;
        return Math.abs(a.difficulty-target)-Math.abs(b.difficulty-target);
      });
      var best=cands[0];
      best.id="q"+(n+1); chosen.push(best); sessionCats.add(best.key); keys.push(best.key, best.setKey);
    }
    return { type:"classificazioni", level:level, items:chosen, historyKeys:keys,
      rule:"Dire a quale categoria appartengono i tre termini." + (level<=MC_MAX_LEVEL?" Ai primi livelli la risposta si sceglie fra 4 opzioni.":""),
      slides:chosen.map(function(it){return {item:it};}) };
  }

  function genClassificazioni(level, used){
    var count=(typeof state!=="undefined" && state.classificazioniItemsOverride) || ITEMS_DEFAULT;
    return buildClassificazioni(level, {used:used, count:count});
  }

  var api={ buildClassificazioni:buildClassificazioni, maxTier:maxTier, CLASSIFICAZIONI_TARGET_D:CLASSIFICAZIONI_TARGET_D, CLASSIFICAZIONI_W:CLASSIFICAZIONI_W };
  if(typeof module!=="undefined" && module.exports){ module.exports=api; }
  else { root.genClassificazioni=genClassificazioni; root.buildClassificazioni=buildClassificazioni; }
})(typeof window!=="undefined"?window:globalThis);
