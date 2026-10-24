// Test di "Classificazioni": integrità della banca, correttezza (ricalcolata in modo indipendente),
// graduazione per livello, scelta multipla, anti-ripetizione.
const test = require('node:test');
const assert = require('node:assert');
const G = require('../js/generators/classificazioni.js');
const BANK = require('../data/classificazioni.js');

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const LIVELLI = [1,4,8,9,12,16,20,24,28,32];
const norm = s => s.toLowerCase();
// categorie della banca che contengono tutti e tre i termini (calcolo indipendente)
const containing = terms => BANK.filter(c => terms.every(t => c.w.map(norm).includes(norm(t))));

test('banca: categorie uniche, termini unici e sufficienti, tutte le fasce presenti', () => {
  assert.ok(BANK.length >= 60);
  assert.strictEqual(new Set(BANK.map(c=>c.n)).size, BANK.length);
  BANK.forEach(c => {
    assert.ok(c.w.length >= 4, c.n);
    assert.strictEqual(new Set(c.w.map(norm)).size, c.w.length, 'termini doppi in ' + c.n);
    assert.ok(c.t >= 1 && c.t <= 5, c.n);
    assert.ok(['proposta','verificata'].includes(c.stato), c.n);
  });
  for (let t = 1; t <= 5; t++) assert.ok(BANK.filter(c=>c.t===t).length >= 6, 'fascia ' + t);
});

test('ogni quesito: 3 termini distinti della categoria; risposte accettate complete', () => {
  for (const lv of LIVELLI) for (const seed of [1,2,3]) {
    const d = G.buildClassificazioni(lv, {rng: mulberry32(seed*100+lv), count: 8});
    assert.strictEqual(d.items.length, 8);
    for (const it of d.items) {
      assert.strictEqual(it.terms.length, 3);
      assert.strictEqual(new Set(it.terms.map(norm)).size, 3);
      const cat = BANK.find(c => c.n === it.category);
      it.terms.forEach(t => assert.ok(cat.w.map(norm).includes(norm(t)), `${t} non in ${cat.n}`));
      assert.ok(it.accepted.includes(cat.n));
      cat.s.concat(cat.p).forEach(a => assert.ok(it.accepted.includes(a), a + ' manca fra le accettate'));
      containing(it.terms).forEach(c => { assert.ok(it.accepted.includes(c.n), `categoria ${c.n} contiene i tre termini ma non è accettata`); c.s.forEach(a=>assert.ok(it.accepted.includes(a))); });
    }
  }
});

test('categorie diverse dentro la sessione (finché il pool basta)', () => {
  for (const lv of LIVELLI) {
    const d = G.buildClassificazioni(lv, {rng: mulberry32(9+lv), count: 8});
    assert.strictEqual(new Set(d.items.map(i=>i.category)).size, 8, 'livello ' + lv);
  }
});

test('fascia di astrazione entro i limiti del livello e crescente', () => {
  for (const lv of LIVELLI) {
    const max = G.maxTier(lv);
    G.buildClassificazioni(lv, {rng: mulberry32(lv), count: 8}).items.forEach(i => assert.ok(i.tier <= max, `liv ${lv}: fascia ${i.tier} > ${max}`));
  }
  const mean = lv => { let s=0,n=0; for (const seed of [1,2,3,4]) G.buildClassificazioni(lv,{rng:mulberry32(seed*17+lv),count:8}).items.forEach(i=>{s+=i.difficulty;n++;}); return s/n; };
  let prev = -1; for (const lv of [1,6,11,16,21,26,32]) { const m = mean(lv); assert.ok(m >= prev - 0.2, `liv ${lv}`); prev = m; }
  assert.ok(mean(32) > mean(1) + 3);
});

test('termini più atipici solo ai livelli alti', () => {
  const maxIdx = lv => Math.max(...G.buildClassificazioni(lv,{rng:mulberry32(5),count:8}).items.map(i=>i.maxTermIndex/Math.max(1,BANK.find(c=>c.n===i.category).w.length-1)));
  assert.ok(maxIdx(1) <= 0.5 + 1e-9);
});

test('scelta multipla fino al livello 8: 4 opzioni, una sola giusta', () => {
  for (const lv of [1,5,8]) G.buildClassificazioni(lv,{rng:mulberry32(lv),count:8}).items.forEach(it => {
    assert.strictEqual(it.options.length, 4);
    assert.strictEqual(new Set(it.options).size, 4);
    assert.ok(it.options.includes(it.category));
    it.options.filter(o => o !== it.category).forEach(o => assert.ok(!it.accepted.includes(o), `opzione ${o} sarebbe accettabile`));
  });
  G.buildClassificazioni(9,{rng:mulberry32(1),count:8}).items.forEach(it => assert.ok(!it.options));
});

test('anti-ripetizione: categorie già usate non tornano finché ne restano di nuove', () => {
  const a = G.buildClassificazioni(3, {rng: mulberry32(1), count: 8});
  const b = G.buildClassificazioni(3, {rng: mulberry32(2), count: 8, used: a.historyKeys});
  const usedCats = new Set(a.items.map(i=>i.category));
  assert.strictEqual(b.items.filter(i => usedCats.has(i.category)).length, 0);
  assert.strictEqual(new Set(a.historyKeys).size, a.historyKeys.length);
});

test('stesso seme -> stesso materiale', () => {
  const x = G.buildClassificazioni(15,{rng:mulberry32(42),count:8}), y = G.buildClassificazioni(15,{rng:mulberry32(42),count:8});
  assert.deepStrictEqual(x.items.map(i=>i.terms), y.items.map(i=>i.terms));
});
