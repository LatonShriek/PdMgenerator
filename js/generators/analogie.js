// Generatore — Analogie (ispirato al subtest Relazioni del VRT, Basagni et al. 2017): A : B = C : ?
// Banca per tipo di relazione in data/analogie.js (voci «proposta»: da validare).
// Difficoltà = fascia della relazione + atipicità delle coppie + quesito invertito (? : D) + risposta libera + distrattori plausibili.
// Doppio uso: script classico nel browser (genAnalogie) e modulo in Node (test).
(function(root){
  var isNode = (typeof module!=="undefined" && module.exports);
  var BANK = isNode ? require("../../data/analogie.js") : root.ANALOGIE;

  // ---- costanti di taratura (esposte) ----
  var ANALOGIE_MAX_LEVEL = 32;
  var ANALOGIE_W = { fascia:1.0, atipicita:2.0, invertita:1.2, rispostaLibera:1.5, distrattoreDifficile:0.4 };
  var MC_MAX_LEVEL = 12;       // fino a questo livello la risposta si sceglie fra 4 opzioni
  var REVERSED_FROM = 17;      // quesiti «A : B = ? : D» dal livello 17
  var ITEMS_DEFAULT = 8;
  function tNorm(level){ return (level-1)/(ANALOGIE_MAX_LEVEL-1); }
  function maxTier(level){ return 1 + Math.floor((level-1)*5/32); }
  function minTier(level){ return Math.max(1, maxTier(level)-1); }
  function atypMax(level){ return 0.6 + 0.4*tNorm(level); }
  function nHard(level){ return level<=4 ? 0 : level<=8 ? 1 : 2; }   // distrattori «plausibili» (stessa relazione, altra coppia)
  function TARGET_D(level){ return 1.2 + tNorm(level)*7.8; }

  function norm(s){ return s.toLowerCase(); }
  function shuffle(arr, rng){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function pk(rel, p){ return "p:"+rel.id+":"+p.a+">"+p.b; }

  function candidate(level, rng, sessionPairs){
    var lo=minTier(level), hi=maxTier(level);
    var rels=BANK.filter(function(r){ return r.t>=lo && r.t<=hi; });
    var rel=rels[Math.floor(rng()*rels.length)];
    var window=Math.min(rel.coppie.length, Math.max(4, Math.ceil(atypMax(level)*rel.coppie.length)));
    var idx=shuffle(Array.from({length:window},function(_,i){return i;}),rng).slice(0,2);
    var p1=rel.coppie[idx[0]], p2=rel.coppie[idx[1]];
    var words=[p1.a,p1.b,p2.a,p2.b].map(norm);
    if(new Set(words).size<4) return null;
    if(sessionPairs.has(pk(rel,p1)) || sessionPairs.has(pk(rel,p2))) return null;
    var reversed = level>=REVERSED_FROM && rng()<0.5;
    var answer = reversed ? p2.a : p2.b;
    var accepted = reversed ? [p2.a] : [p2.b].concat(p2.ok);
    var prompt = reversed ? (p1.a+" : "+p1.b+" = ? : "+p2.b) : (p1.a+" : "+p1.b+" = "+p2.a+" : ?");
    var mc = level<=MC_MAX_LEVEL, hard=mc?nHard(level):0;
    var atyp=(idx[0]+idx[1])/2/Math.max(1,rel.coppie.length-1);
    var D=rel.t*ANALOGIE_W.fascia + atyp*ANALOGIE_W.atipicita + (reversed?ANALOGIE_W.invertita:0) + (mc?0:ANALOGIE_W.rispostaLibera) + hard*ANALOGIE_W.distrattoreDifficile;
    var item={ relation:rel.id, relationName:rel.nome, relationText:rel.testo, tier:rel.t, pair1:{a:p1.a,b:p1.b}, pair2:{a:p2.a,b:p2.b},
      reversed:reversed, prompt:prompt, answerWord:answer, accepted:accepted, difficulty:D,
      answer:(reversed?p2.a:p2.b)+" ("+p1.a+" "+rel.testo+" "+p1.b+(reversed?"":"")+")",
      key:"rel:"+rel.id, pairKeys:[pk(rel,p1),pk(rel,p2)] };
    if(mc){
      var banned=new Set([p1.a,p1.b,p2.a,p2.b].concat(accepted).map(norm)); var pick=reversed?"a":"b";
      var same=rel.coppie.filter(function(p){return p!==p1&&p!==p2;}).map(function(p){return p[pick];}).filter(function(w){return !banned.has(norm(w));});
      var other=[]; BANK.forEach(function(r){ if(r!==rel) r.coppie.forEach(function(p){ if(!banned.has(norm(p[pick]))) other.push(p[pick]); }); });
      var opts=[], seen=new Set();
      function add(w){ if(!seen.has(norm(w)) && !banned.has(norm(w))){ seen.add(norm(w)); opts.push(w); } }
      shuffle(same,rng).slice(0,hard).forEach(add);
      shuffle(other,rng).forEach(function(w){ if(opts.length<3) add(w); });
      if(opts.length<3) return null;
      item.options=shuffle([answer].concat(opts.slice(0,3)),rng);
    }
    return item;
  }

  function buildAnalogie(level, opts){
    opts=opts||{};
    var rng=opts.rng||Math.random, count=Math.max(1,Math.min(16,opts.count||ITEMS_DEFAULT));
    var lastIdx=new Map(); (opts.used||[]).forEach(function(k,i){ lastIdx.set(k,i); });
    var target=TARGET_D(level), chosen=[], sessionPairs=new Set(), keys=[];
    for(var n=0;n<count;n++){
      var cands=[];
      for(var t=0;t<600 && cands.length<30;t++){ var c=candidate(level,rng,sessionPairs); if(c) cands.push(c); }
      if(!cands.length) break;
      // coppie mai proposte prima; poi la meno recente; poi vicinanza al punteggio-obiettivo
      function stale(c){ return Math.max.apply(null, c.pairKeys.map(function(k){ return lastIdx.has(k)?lastIdx.get(k):-1; })); }
      cands.sort(function(a,b){ var sa=stale(a), sb=stale(b); if((sa<0)!==(sb<0)) return sa<0?-1:1; if(sa>=0&&sb>=0&&sa!==sb) return sa-sb; return Math.abs(a.difficulty-target)-Math.abs(b.difficulty-target); });
      var best=cands[0]; best.id="q"+(n+1); chosen.push(best);
      best.pairKeys.forEach(function(k){ sessionPairs.add(k); keys.push(k); });
    }
    return { type:"analogie", level:level, items:chosen, historyKeys:keys,
      rule:"Completare l'analogia: la seconda coppia ha la stessa relazione della prima." + (level<=MC_MAX_LEVEL?" Fino al livello "+MC_MAX_LEVEL+" la risposta si sceglie fra 4 opzioni.":""),
      slides:chosen.map(function(it){return {item:it};}) };
  }

  function genAnalogie(level, used){
    var count=(typeof state!=="undefined" && state.analogieItemsOverride) || ITEMS_DEFAULT;
    return buildAnalogie(level, {used:used, count:count});
  }
  var api={ buildAnalogie:buildAnalogie, maxTier:maxTier, ANALOGIE_W:ANALOGIE_W };
  if(isNode){ module.exports=api; }
  else { root.genAnalogie=genAnalogie; root.buildAnalogie=buildAnalogie; }
})(typeof window!=="undefined"?window:globalThis);
