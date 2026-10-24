// Generatore — Parentele (ispirato alle «Relazioni di familiarità» del VRT, Basagni et al. 2017).
// Ogni quesito nasce da un albero genealogico con nomi propri: si sceglie un percorso di 2-5 premesse
// fra due persone e si chiede la relazione di parentela fra gli estremi. La risposta si ricava SOLO
// dalle premesse scritte (deriveRelation), così il quesito è sempre risolvibile; i test la
// ricalcolano in modo indipendente dall'albero completo.
// Doppio uso: script classico nel browser (funzione globale genParentele) e modulo in Node (test).
(function(root){
  var NOMI = (typeof module!=="undefined" && module.exports) ? require("../../data/parentele.js") : root.PARENTELE_NOMI;
  var VRT  = (typeof module!=="undefined" && module.exports) ? require("../../data/vrt-esclusi.js") : root.VRT_ESCLUSI;

  // ---- costanti di taratura (esposte) ----
  var PARENTELE_MAX_LEVEL = 32;
  // peso di difficoltà della relazione chiesta: più lontana / acquisita = più difficile
  var PARENTELE_ANSWER_W = { fratello:0.5, nonno:1, nipote_n:1, zio:2, nipote_z:2, suocero:2.5, genero_nuora:2.5, bisnonno:2, pronipote:2, cognato:3, cugino:3 };
  // relazioni ammesse come risposta, sbloccate per livello
  var PARENTELE_ANSWER_FROM = { fratello:1, nonno:1, nipote_n:1, zio:1, nipote_z:1, suocero:9, genero_nuora:9, cognato:17, cugino:17, bisnonno:21, pronipote:21 };
  var PARENTELE_SCORE_W = { premessa:1, invertita:0.4, coniugale:0.5, distrattore:0.5, rimescolata:0.7 };
  function PARENTELE_TARGET_D(level){ return 2.5 + (level-1)/(PARENTELE_MAX_LEVEL-1)*10.5; }
  // premesse massime: 2 (liv. 1-8), 3 (9-16), 4 (17-24), 5 (25-32)
  function maxPremise(level){ return 2 + Math.floor((level-1)/8); }
  var ITEMS_DEFAULT = 8;

  var LABEL = {
    genitore:["padre","madre"], figlio:["figlio","figlia"], coniuge:["marito","moglie"], fratello:["fratello","sorella"],
    nonno:["nonno","nonna"], nipote_n:["nipote","nipote"], nipote_z:["nipote","nipote"], bisnonno:["bisnonno","bisnonna"],
    pronipote:["pronipote","pronipote"], zio:["zio","zia"], cugino:["cugino","cugina"], suocero:["suocero","suocera"],
    genero_nuora:["genero","nuora"], cognato:["cognato","cognata"]
  };
  function relLabel(rel, g){ return LABEL[rel][g==="M"?0:1]; }
  function article(label, g){ return label==="zio" ? "lo" : (g==="M" ? "il" : "la"); }

  // ---- albero ----
  function buildTree(rng, gen3, takeName){
    var persons=[];
    function mk(g, father, mother){ var p={id:"p"+(persons.length+1), name:takeName(g), gender:g, father:father||null, mother:mother||null, spouse:null}; persons.push(p); return p; }
    function marry(p){ var s=mk(p.gender==="M"?"F":"M"); p.spouse=s.id; s.spouse=p.id; return s; }
    function gender(){ return rng()<0.5?"M":"F"; }
    var f=mk("M"), m=mk("F"); f.spouse=m.id; m.spouse=f.id;
    var k = 2 + (rng()<0.5?1:0), kids=[];
    for(var i=0;i<k;i++) kids.push(mk(gender(), f.id, m.id));
    var gen2=[];
    kids.forEach(function(c,i){
      if(i<2 || rng()<0.7){
        var s=marry(c), n = 1 + (rng()<0.5?1:0);
        for(var j=0;j<n;j++){ var fa = c.gender==="M"?c:s, mo = c.gender==="M"?s:c; gen2.push(mk(gender(), fa.id, mo.id)); }
      }
    });
    if(gen3) gen2.forEach(function(c){
      if(rng()<0.6){ var s=marry(c); var fa = c.gender==="M"?c:s, mo = c.gender==="M"?s:c; mk(gender(), fa.id, mo.id); }
    });
    return persons;
  }
  function treeEdges(persons){
    var E=[], byId={}; persons.forEach(function(p){byId[p.id]=p;});
    persons.forEach(function(p){
      if(p.father) E.push({t:"parent",p:p.father,c:p.id});
      if(p.mother) E.push({t:"parent",p:p.mother,c:p.id});
      if(p.spouse && p.id<p.spouse && Number(p.id.slice(1))<Number(p.spouse.slice(1))) E.push({t:"spouse",a:p.id,b:p.spouse});
    });
    for(var i=0;i<persons.length;i++) for(var j=i+1;j<persons.length;j++){
      var x=persons[i], y=persons[j];
      if(x.father && x.father===y.father && x.mother===y.mother) E.push({t:"sibling",a:x.id,b:y.id});
    }
    return E;
  }
  function edgeNodes(e){ return e.t==="parent"?[e.p,e.c]:[e.a,e.b]; }

  // ---- relazione ricavata dalle sole premesse: b è ___ di a ----
  function deriveRelation(facts, a, b){
    var par={}, sp={}, sibX={};
    function S(o,k){ return o[k]||(o[k]=new Set()); }
    facts.forEach(function(f){
      if(f.t==="parent") S(par,f.c).add(f.p);
      else if(f.t==="spouse"){ sp[f.a]=f.b; sp[f.b]=f.a; }
      else { S(sibX,f.a).add(f.b); S(sibX,f.b).add(f.a); }
    });
    var changed=true;
    while(changed){ changed=false;
      Object.keys(sibX).forEach(function(x){ sibX[x].forEach(function(y){
        S(par,y).forEach(function(p){ if(!S(par,x).has(p)){ par[x].add(p); changed=true; } });
        S(par,x).forEach(function(p){ if(!S(par,y).has(p)){ par[y].add(p); changed=true; } });
      }); });
    }
    var ids={}; facts.forEach(function(f){ edgeNodes(f).forEach(function(n){ids[n]=1;}); });
    var all=Object.keys(ids);
    function P(x){ return Array.from(S(par,x)); }
    function C(x){ return all.filter(function(y){ return S(par,y).has(x); }); }
    function SB(x){ var out=new Set(S(sibX,x)); all.forEach(function(y){ if(y!==x){ var s=S(par,y), ok=false; S(par,x).forEach(function(p){ if(s.has(p)) ok=true; }); if(ok) out.add(y); } }); return Array.from(out); }
    function flat(arr, fn){ var o=[]; arr.forEach(function(x){ fn(x).forEach(function(y){ if(o.indexOf(y)<0) o.push(y); }); }); return o; }
    var found=[];
    function add(rel, list){ if(list.indexOf(b)>=0 && found.indexOf(rel)<0) found.push(rel); }
    add("genitore", P(a)); add("figlio", C(a)); add("coniuge", sp[a]?[sp[a]]:[]); add("fratello", SB(a));
    add("nonno", flat(P(a),P)); add("nipote_n", flat(C(a),C)); add("bisnonno", flat(flat(P(a),P),P)); add("pronipote", flat(flat(C(a),C),C));
    add("zio", flat(P(a),SB)); add("nipote_z", flat(SB(a),C)); add("cugino", flat(flat(P(a),SB),C));
    if(sp[a]) { add("suocero", P(sp[a])); add("cognato", SB(sp[a])); }
    add("genero_nuora", C(a).filter(function(c){return sp[c];}).map(function(c){return sp[c];}));
    add("cognato", SB(a).filter(function(s){return sp[s];}).map(function(s){return sp[s];}));
    return found.length===1 ? found[0] : null;
  }

  // ---- testo delle premesse ----
  function sentence(f, byId, rng, inverted){
    var N=function(id){return byId[id].name;}, G=function(id){return byId[id].gender;};
    if(f.t==="parent"){
      if(!inverted) return N(f.p)+" è "+(G(f.p)==="M"?"il padre":"la madre")+" di "+N(f.c)+".";
      return N(f.c)+" è "+(G(f.c)==="M"?"il figlio":"la figlia")+" di "+N(f.p)+".";
    }
    if(f.t==="spouse"){
      var a=inverted?f.b:f.a, b=inverted?f.a:f.b;
      if(rng()<0.5) return N(a)+" è "+(G(a)==="M"?"il marito":"la moglie")+" di "+N(b)+".";
      return N(a)+" è "+(G(a)==="M"?"sposato":"sposata")+" con "+N(b)+".";
    }
    var x=inverted?f.b:f.a, y=inverted?f.a:f.b;
    if(rng()<0.35){
      var gs=G(x)+G(y);
      return N(x)+" e "+N(y)+" sono "+(gs==="MM"?"fratelli":gs==="FF"?"sorelle":"fratello e sorella")+".";
    }
    return N(x)+" è "+(G(x)==="M"?"il fratello":"la sorella")+" di "+N(y)+".";
  }

  function shuffle(arr, rng){ var a=arr.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(rng()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  // ---- un candidato di quesito ----
  function candidate(level, rng){
    var gen3 = level>=21;
    var pools={M:shuffle(NOMI.M.filter(function(n){return VRT.nomi.indexOf(n)<0;}),rng), F:shuffle(NOMI.F.filter(function(n){return VRT.nomi.indexOf(n)<0;}),rng)};
    var persons=buildTree(rng, gen3, function(g){ return pools[g].pop(); });
    var byId={}; persons.forEach(function(p){byId[p.id]=p;});
    var edges=treeEdges(persons);
    var allowSpouse = level>=9;
    var usable = edges.filter(function(e){ return allowSpouse || e.t!=="spouse"; });
    var maxP=maxPremise(level), nPrem = maxP>2 && rng()<0.5 ? maxP-1 : maxP;
    // percorso casuale senza ripassare dalla stessa persona
    var nodes=persons.map(function(p){return p.id;}), start=nodes[Math.floor(rng()*nodes.length)];
    function walk(cur, seen, path){
      if(path.length===nPrem) return path;
      var opts=shuffle(usable.filter(function(e){ return edgeNodes(e).indexOf(cur)>=0 && edgeNodes(e).filter(function(n){return n!==cur;}).every(function(n){return !seen[n];}); }), rng);
      for(var i=0;i<opts.length;i++){
        var e=opts[i], nxt=edgeNodes(e).filter(function(n){return n!==cur;})[0];
        var s2=Object.assign({},seen); s2[nxt]=1;
        var r=walk(nxt,s2,path.concat([{e:e,from:cur,to:nxt}])); if(r) return r;
      }
      return null;
    }
    var seen={}; seen[start]=1;
    var path=walk(start,seen,[]); if(!path) return null;
    var a=start, b=path[path.length-1].to;
    var chain=path.map(function(s){return s.e;});
    var rel=deriveRelation(chain,a,b);
    if(!rel || !(PARENTELE_ANSWER_FROM[rel]<=level)) return null;
    // distrattori: fatti veri ma non necessari, accettati solo se la risposta non cambia
    var nDis = level<13 ? 0 : Math.min(3, 1+Math.floor((level-13)/9));
    var facts=chain.slice(), dis=0;
    for(var t=0;t<30 && dis<nDis;t++){
      var e=usable[Math.floor(rng()*usable.length)];
      if(facts.some(function(f){return JSON.stringify(f)===JSON.stringify(e);})) continue;
      if(deriveRelation(facts.concat([e]),a,b)!==rel) continue;
      facts.push(e); dis++;
    }
    // presentazione: direzione di alcune premesse e ordine
    var invP = level<5 ? 0 : Math.min(0.6,(level-4)/40);
    var inverted = facts.map(function(){ return rng()<invP; });
    var shuffled = level>=17 && rng()<0.5;
    var order = facts.map(function(_,i){return i;}); if(shuffled) order=shuffle(order,rng);
    var shown = order.map(function(i){return facts[i];});
    var premises = order.map(function(i){ return sentence(facts[i], byId, rng, inverted[i]); });
    var spouseEdges = chain.filter(function(e){return e.t==="spouse";}).length;
    var nInv = order.filter(function(i){return inverted[i];}).length;
    var D = nPrem*PARENTELE_SCORE_W.premessa + nInv*PARENTELE_SCORE_W.invertita + spouseEdges*PARENTELE_SCORE_W.coniugale +
      dis*PARENTELE_SCORE_W.distrattore + (shuffled?PARENTELE_SCORE_W.rimescolata:0) + PARENTELE_ANSWER_W[rel];
    var sig = path.map(function(s){
      var e=s.e; return e.t==="parent" ? (s.from===e.p?"d":"u") : e.t==="spouse" ? "s" : "f";
    }).join("") + "|" + [a].concat(path.map(function(s){return s.to;})).map(function(id){return byId[id].gender;}).join("") + "|" + rel + "|d" + dis + (shuffled?"|x":"");
    var gb=byId[b].gender, la=relLabel(rel,gb);
    var revRel=deriveRelation(facts,b,a);
    var Nn=function(id){return byId[id].name;};
    var item = {
      a:a, b:b, premises:premises, facts:shown,
      question:"Che relazione di parentela c'è tra "+Nn(a)+" e "+Nn(b)+"?",
      answerRelation:rel, answerLabel:la,
      answer:Nn(b)+" è "+article(la,gb)+" "+la+" di "+Nn(a),
      reverse: revRel ? Nn(a)+" è "+article(relLabel(revRel,byId[a].gender),byId[a].gender)+" "+relLabel(revRel,byId[a].gender)+" di "+Nn(b) : null,
      tree:persons.map(function(p){return {id:p.id,name:p.name,gender:p.gender,father:p.father,mother:p.mother,spouse:p.spouse};}),
      key:sig, difficulty:D
    };
    if(level<=8){
      var base=Object.keys(PARENTELE_ANSWER_FROM).filter(function(r){return PARENTELE_ANSWER_FROM[r]<=1;});
      var extra=["genitore","figlio","cugino","cognato"];
      var labs=[]; base.concat(extra).forEach(function(r){ var l=relLabel(r,gb); if(l!==la && labs.indexOf(l)<0) labs.push(l); });
      item.options=shuffle([la].concat(shuffle(labs,rng).slice(0,3)),rng);
    }
    return item;
  }

  // ---- generatore di sessione ----
  function buildParentele(level, opts){
    opts=opts||{};
    var rng=opts.rng||Math.random, count=Math.max(1,Math.min(16,opts.count||ITEMS_DEFAULT));
    var lastIdx=new Map(); (opts.used||[]).forEach(function(k,i){ lastIdx.set(k,i); });
    var target=PARENTELE_TARGET_D(level), chosen=[], session=new Set(), keys=[];
    for(var n=0;n<count;n++){
      var cands=[];
      for(var t=0;t<500 && cands.length<40;t++){
        var c=candidate(level,rng); if(c && !session.has(c.key)) cands.push(c);
      }
      if(!cands.length) break;
      var fresh=cands.filter(function(c){return !lastIdx.has(c.key);});
      var pool = fresh.length ? fresh : cands.slice().sort(function(x,y){return lastIdx.get(x.key)-lastIdx.get(y.key);}).slice(0,Math.max(3,Math.ceil(cands.length/4)));
      pool.sort(function(x,y){return Math.abs(x.difficulty-target)-Math.abs(y.difficulty-target);});
      var best=pool[0];
      best.id="q"+(n+1); chosen.push(best); session.add(best.key); keys.push(best.key);
    }
    return {
      type:"parentele", level:level, items:chosen, historyKeys:keys,
      rule:"Dalle premesse ricavare la relazione di parentela fra le due persone nominate nella domanda." + (level<=8?" Ai primi livelli la risposta si sceglie fra 4 opzioni.":""),
      slides:chosen.map(function(it){return {item:it};})
    };
  }

  function genParentele(level, used){
    var count = (typeof state!=="undefined" && state.parenteleItemsOverride) || ITEMS_DEFAULT;
    return buildParentele(level, {used:used, count:count});
  }

  var api={ buildParentele:buildParentele, deriveRelation:deriveRelation, PARENTELE_ANSWER_W:PARENTELE_ANSWER_W, PARENTELE_SCORE_W:PARENTELE_SCORE_W, PARENTELE_TARGET_D:PARENTELE_TARGET_D };
  if(typeof module!=="undefined" && module.exports){ module.exports=api; }
  else { root.genParentele=genParentele; root.buildParentele=buildParentele; root.PARENTELE_TARGET_D=PARENTELE_TARGET_D; }
})(typeof window!=="undefined"?window:globalThis);
