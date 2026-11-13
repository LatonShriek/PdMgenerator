// Generatore — Classificazioni (ispirato al subtest omonimo del VRT, Basagni et al. 2017):
// dati tre termini, nominare la categoria. Banca in data/classificazioni.js (voci «proposta»: da validare).
// Difficoltà = fascia di astrazione della categoria + atipicità dei termini scelti + risposta libera.
// Doppio uso: script classico nel browser (funzione globale genClassificazioni) e modulo in Node (test).
(function(root){
  var BANK = (typeof module!=="undefined" && module.exports) ? require("../../data/classificazioni.js") : root.CLASSIFICAZIONI;
  var DOM = (typeof module!=="undefined" && module.exports) ? require("../../data/intruso-concettuale.js") : (root.INTRUSO_DOMINI||{});

  // ---- costanti di taratura (esposte) ----
  var CLASSIFICAZIONI_MAX_LEVEL = 32;
  var CLASSIFICAZIONI_W = { fascia:1.0, atipicita:3.0, rispostaLibera:1.0 };
  // Risposta APERTA di default (uso in presenza). La scelta fra 4 opzioni si ottiene solo con opts.scelta=true e ha SEMPRE distrattori vicini.
  var ITEMS_DEFAULT = 8;
  function tNorm(level){ return (level-1)/(CLASSIFICAZIONI_MAX_LEVEL-1); }
  // fasce 1-5 sbloccate: fascia 2 dal livello 8, 3 dal 14, 4 dal 20, 5 dal 27
  function maxTier(level){ return 1 + Math.floor((level-1)*5/32); }
  function minTier(level){ return Math.max(1, maxTier(level)-1); }
  // quota massima di termini "atipici" (posizione nell'elenco della categoria): 0.5 al livello 1 → 1.0 al 32
  function atypMax(level){ return 0.5 + 0.5*tNorm(level); }
  function CLASSIFICAZIONI_TARGET_D(level){ return 1.4 + tNorm(level)*7.4; }

  // quante opzioni-trappola (categorie vicine che non reggono) nelle risposte a scelta: 1 fino al livello 4, poi 2
  function nTrap(level){ return level<=4 ? 1 : 2; }
  // quante delle 3 opzioni sbagliate vengono dallo STESSO campo della risposta (stesso dominio): tutte e 3, fin dal livello 1
  function nSame(level){ return 3; }
  function norm(s){ return s.toLowerCase(); }
  function shuffle(arr, rng){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function containing(terms){ return BANK.filter(function(c){ var w=c.w.map(norm); return terms.every(function(t){ return w.indexOf(norm(t))>=0; }); }); }

  function candidate(level, rng, scelta){
    var lo=minTier(level), hi=maxTier(level);
    var pool=BANK.filter(function(c){ return c.t>=lo && c.t<=hi; });
    var cat=pool[Math.floor(rng()*pool.length)];
    var window=Math.min(cat.w.length, Math.max(3, Math.ceil(atypMax(level)*cat.w.length)));
    var idx=shuffle(Array.from({length:window},function(_,i){return i;}),rng).slice(0,3).sort(function(a,b){return a-b;});
    var terms=idx.map(function(i){return cat.w[i];});
    var maxTermIndex=idx[2];
    var atyp=(idx[0]+idx[1]+idx[2])/3/Math.max(1,cat.w.length-1);
    var D=cat.t*CLASSIFICAZIONI_W.fascia + atyp*CLASSIFICAZIONI_W.atipicita + (scelta?0:CLASSIFICAZIONI_W.rispostaLibera);
    // risposte accettate: nome, sinonimi, categorie più ampie, e ogni altra categoria della banca che contiene i tre termini
    var acc=[cat.n].concat(cat.s, cat.p);
    containing(terms).forEach(function(c){ [c.n].concat(c.s).forEach(function(a){ if(acc.indexOf(a)<0) acc.push(a); }); });
    var item={ category:cat.n, tier:cat.t, terms:terms, accepted:acc, maxTermIndex:maxTermIndex, difficulty:D,
      key:"cat:"+cat.n, setKey:"set:"+cat.n+":"+terms.map(norm).sort().join(",") };
    // TRAPPOLE: categorie vicine e plausibili che però non reggono per tutti e tre i termini —
    // quelle dichiarate sulla categoria (d) e quelle della banca che contengono 1-2 dei tre termini.
    var accSet=new Set(acc.map(norm));
    var trap=[]; (cat.d||[]).forEach(function(n){ if(!accSet.has(norm(n)) && trap.indexOf(n)<0) trap.push(n); });
    BANK.forEach(function(c){
      if(c.n===cat.n || accSet.has(norm(c.n))) return;
      var w=c.w.map(norm), hit=terms.filter(function(t){return w.indexOf(norm(t))>=0;}).length;
      if(hit>=1 && hit<3 && trap.indexOf(c.n)<0) trap.push(c.n);
    });
    item.trappole=trap;
    if(scelta){
      var others=BANK.filter(function(c){ return c.n!==cat.n && acc.indexOf(c.n)<0 && c.s.every(function(s){return acc.indexOf(s)<0;}) && trap.indexOf(c.n)<0 && Math.abs(c.t-cat.t)<=1; });
      var nT=Math.min(trap.length, nTrap(level));
      var near=shuffle(trap,rng).slice(0,nT).filter(function(n){return n!==cat.n;});
      // poi categorie dello stesso dominio (campo vicino), infine categorie qualunque
      var dom=DOM[cat.n];
      var sameDom=others.filter(function(c){ return dom && DOM[c.n]===dom; }), farDom=others.filter(function(c){ return !(dom && DOM[c.n]===dom); });
      var picked=near.slice();
      shuffle(sameDom,rng).slice(0,Math.max(0,Math.min(nSame(level), 3-picked.length))).forEach(function(c){ picked.push(c.n); });
      shuffle(farDom.concat(sameDom),rng).forEach(function(c){ if(picked.length<3 && picked.indexOf(c.n)<0) picked.push(c.n); });
      item.options=shuffle([cat.n].concat(picked.slice(0,3)),rng);
    }
    return item;
  }

  function buildClassificazioni(level, opts){
    opts=opts||{};
    var rng=opts.rng||Math.random, count=Math.max(1,Math.min(40,opts.count||ITEMS_DEFAULT));
    var lastIdx=new Map(); (opts.used||[]).forEach(function(k,i){ lastIdx.set(k,i); });
    var target=CLASSIFICAZIONI_TARGET_D(level), chosen=[], sessionCats=new Set(), keys=[];
    for(var n=0;n<count;n++){
      var cands=[];
      for(var t=0;t<600 && cands.length<40;t++){ var c=candidate(level,rng,!!opts.scelta); if(c && !sessionCats.has(c.key)) cands.push(c); }
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
      rule:"Dire a quale categoria appartengono i tre termini." + (opts.scelta?" La risposta si sceglie fra 4 opzioni.":""),
      slides:chosen.map(function(it){return {item:it};}) };
  }

  function genClassificazioni(level, used){
    var count=(typeof state!=="undefined" && state.classificazioniItemsOverride) || ITEMS_DEFAULT;
    return buildClassificazioni(level, {used:used, count:count});
  }

  var api={ buildClassificazioni:buildClassificazioni, maxTier:maxTier, nTrap:nTrap, nSame:nSame, CLASSIFICAZIONI_TARGET_D:CLASSIFICAZIONI_TARGET_D, CLASSIFICAZIONI_W:CLASSIFICAZIONI_W };
  if(typeof module!=="undefined" && module.exports){ module.exports=api; }
  else { root.genClassificazioni=genClassificazioni; root.buildClassificazioni=buildClassificazioni; }
})(typeof window!=="undefined"?window:globalThis);
