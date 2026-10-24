// Test di "Parentele": regole di qualità, correttezza indipendente, anti-ripetizione, dati.
// La correttezza si verifica con un calcolo INDIPENDENTE dal generatore: qui la relazione fra A e B si
// ricava dall'albero completo (antenato comune più vicino), mentre il generatore la ricava solo dalle
// premesse scritte. Se i due metodi concordano, le premesse bastano davvero a rispondere.
const test = require('node:test');
const assert = require('node:assert');
const P = require('../js/generators/parentele.js');
const NOMI = require('../data/parentele.js');
const VRT = require('../data/vrt-esclusi.js');

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

// ---- relazione dall'albero, metodo indipendente: b è ___ di a ----
function ancestors(tree, id){ // id -> distanza (0 = sé stesso)
  const out = new Map([[id,0]]); let frontier=[id], d=0;
  while(frontier.length){ d++; const next=[];
    for(const x of frontier){ const n=tree[x]; for(const p of [n.father,n.mother]) if(p && !out.has(p)){ out.set(p,d); next.push(p); } }
    frontier=next; }
  return out;
}
function blood(tree, a, b){ // [su, giù] via antenato comune più vicino, o null
  const A=ancestors(tree,a), B=ancestors(tree,b); let best=null;
  for(const [x,da] of A) if(B.has(x)){ const s=da+B.get(x); if(!best||s<best.s) best={s,up:da,down:B.get(x)}; }
  return best?[best.up,best.down]:null;
}
function bloodName(ud){
  const k=ud.join(','); return {'1,0':'genitore','0,1':'figlio','1,1':'fratello','2,0':'nonno','0,2':'nipote_n','3,0':'bisnonno','0,3':'pronipote','2,1':'zio','1,2':'nipote_z','2,2':'cugino'}[k]||null;
}
function relFromTree(tree, a, b){
  const d=blood(tree,a,b); if(d){ return bloodName(d); }
  const sp=x=>tree[x].spouse;
  if(sp(a)===b) return 'coniuge';
  if(sp(a)){ const d2=blood(tree,sp(a),b); if(d2){ const n=bloodName(d2); if(n==='genitore') return 'suocero'; if(n==='fratello') return 'cognato'; } }
  if(sp(b)){ const d3=blood(tree,a,sp(b)); if(d3){ const n=bloodName(d3); if(n==='figlio') return 'genero_nuora'; if(n==='fratello') return 'cognato'; } }
  return null;
}

const NIVELLI = [1,4,8,9,12,16,17,20,24,28,32];

test('banche nomi: ≥60 per genere, senza doppioni, senza nomi del VRT', () => {
  assert.ok(NOMI.M.length>=60 && NOMI.F.length>=60);
  const all=[...NOMI.M,...NOMI.F];
  assert.strictEqual(new Set(all).size, all.length, 'nomi doppi o in comune fra i generi');
  assert.deepStrictEqual(all.filter(n=>VRT.nomi.includes(n)), []);
});

test('ogni quesito: risposta coincidente con il calcolo indipendente dall\'albero', () => {
  for(const lv of NIVELLI) for(const seed of [1,2,3]){
    const deck=P.buildParentele(lv,{rng:mulberry32(seed*1000+lv),count:8});
    assert.strictEqual(deck.items.length,8);
    for(const it of deck.items){
      const tree={}; it.tree.forEach(n=>tree[n.id]=n);
      assert.strictEqual(relFromTree(tree,it.a,it.b), it.answerRelation, `liv ${lv} seed ${seed}: ${it.premises.join(' ')} -> ${it.answer}`);
    }
  }
});

test('i nomi nei quesiti sono unici dentro il quesito e mai quelli del VRT', () => {
  for(const lv of NIVELLI){
    const deck=P.buildParentele(lv,{rng:mulberry32(77+lv),count:8});
    for(const it of deck.items){
      const names=it.tree.map(n=>n.name);
      assert.strictEqual(new Set(names).size,names.length);
      assert.deepStrictEqual(names.filter(n=>VRT.nomi.includes(n)),[]);
    }
  }
});

test('difficoltà: premesse e punteggio non scendono mai col livello', () => {
  const mean=(lv)=>{ let s=0,n=0; for(const seed of [1,2,3,4]){ const d=P.buildParentele(lv,{rng:mulberry32(seed*31+lv),count:8}); d.items.forEach(i=>{s+=i.difficulty;n++;}); } return s/n; };
  let prev=-1; for(const lv of [1,5,9,13,17,21,25,29,32]){ const m=mean(lv); assert.ok(m>=prev-0.15,`livello ${lv}: ${m} < ${prev}`); prev=m; }
  assert.ok(mean(32) > mean(1)+3);
  for(const lv of [1,8]) P.buildParentele(lv,{rng:mulberry32(5),count:8}).items.forEach(i=>assert.strictEqual(i.facts.length,2));
});

test('cancelli di livello: risposte avanzate solo dal livello previsto', () => {
  for(const seed of [1,2,3,4,5]){
    P.buildParentele(8,{rng:mulberry32(seed),count:8}).items.forEach(i=>assert.ok(!['suocero','genero_nuora','cognato','cugino','bisnonno','pronipote','coniuge'].includes(i.answerRelation),'livello 8: '+i.answerRelation));
    P.buildParentele(16,{rng:mulberry32(seed),count:8}).items.forEach(i=>assert.ok(!['cognato','cugino','bisnonno','pronipote'].includes(i.answerRelation),'livello 16: '+i.answerRelation));
  }
});

test('scelta multipla ai livelli bassi, risposta libera dopo', () => {
  P.buildParentele(3,{rng:mulberry32(9),count:8}).items.forEach(i=>{
    assert.ok(Array.isArray(i.options)&&i.options.length===4);
    assert.strictEqual(new Set(i.options).size,4);
    assert.ok(i.options.includes(i.answerLabel));
  });
  P.buildParentele(20,{rng:mulberry32(9),count:8}).items.forEach(i=>assert.ok(!i.options));
});

test('anti-ripetizione: chiavi nuove finché ce ne sono; nessun doppione nella sessione', () => {
  const a=P.buildParentele(10,{rng:mulberry32(1),count:8});
  const keys=a.historyKeys; assert.strictEqual(new Set(keys).size,keys.length);
  const b=P.buildParentele(10,{rng:mulberry32(2),count:8,used:keys});
  assert.strictEqual(b.historyKeys.filter(k=>keys.includes(k)).length,0,'riproposte chiavi già usate con pool ancora disponibile');
});

test('stesse premesse (stesso seme) -> stesso materiale', () => {
  const x=P.buildParentele(14,{rng:mulberry32(42),count:8}), y=P.buildParentele(14,{rng:mulberry32(42),count:8});
  assert.deepStrictEqual(x.items.map(i=>i.premises),y.items.map(i=>i.premises));
});

test('il testo delle premesse contiene i nomi della catena e la domanda i due estremi', () => {
  const d=P.buildParentele(12,{rng:mulberry32(3),count:8});
  d.items.forEach(i=>{
    const names=Object.fromEntries(i.tree.map(n=>[n.id,n.name]));
    assert.ok(i.question.includes(names[i.a]) && i.question.includes(names[i.b]));
    assert.ok(i.answer.includes(names[i.a]) && i.answer.includes(names[i.b]));
    i.premises.forEach(p=>assert.ok(/\.$/.test(p)));
  });
});
