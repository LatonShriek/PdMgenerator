// Test di «Intruso concettuale»: unicità dell'intruso (ricalcolata in modo indipendente), distanza per livello,
// anti-ripetizione, determinismo.
const test = require('node:test');
const assert = require('node:assert');
const G = require('../js/generators/intruso-concettuale.js');
const BANK = require('../data/classificazioni.js');
const DOM = require('../data/intruso-concettuale.js');

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const LIVELLI = [1,4,8,9,12,16,17,20,24,28,32];
const norm = s => s.toLowerCase();
const inCat = (c, w) => c.w.map(norm).includes(norm(w));

test('ogni categoria della banca ha un dominio', () => {
  BANK.forEach(c => assert.ok(DOM[c.n], 'manca il dominio di ' + c.n));
  Object.keys(DOM).forEach(n => assert.ok(BANK.some(c => c.n === n), 'dominio per categoria inesistente: ' + n));
});

test('4 parole distinte; 3 della categoria, l\'intruso no; risposta coerente', () => {
  for (const lv of LIVELLI) for (const seed of [1,2,3]) {
    const d = G.buildIntrusoConcettuale(lv, {rng: mulberry32(seed*50+lv), count: 8});
    assert.strictEqual(d.items.length, 8);
    for (const it of d.items) {
      assert.strictEqual(it.words.length, 4);
      assert.strictEqual(new Set(it.words.map(norm)).size, 4);
      const X = BANK.find(c => c.n === it.category), Y = BANK.find(c => c.n === it.intruderCategory);
      const odd = it.words[it.oddIndex];
      assert.ok(inCat(Y, odd) && !inCat(X, odd));
      it.words.filter((_, i) => i !== it.oddIndex).forEach(w => assert.ok(inCat(X, w), `${w} non in ${X.n}`));
      assert.ok(it.answer.includes(odd) && it.answer.includes(X.n));
    }
  }
});

test('unicità: nessun\'altra categoria contiene l\'intruso con due delle tre parole', () => {
  for (const lv of LIVELLI) {
    const d = G.buildIntrusoConcettuale(lv, {rng: mulberry32(7+lv), count: 8});
    for (const it of d.items) {
      const odd = it.words[it.oddIndex], rest = it.words.filter((_, i) => i !== it.oddIndex);
      BANK.forEach(c => { if (inCat(c, odd)) assert.ok(rest.filter(w => inCat(c, w)).length <= 1, `${c.n} rende ambiguo: ${it.words.join(', ')}`); });
      // nessuna categoria contiene tutte e quattro le parole
      assert.ok(!BANK.some(c => it.words.every(w => inCat(c, w))));
    }
  }
});

test('distanza: stesso dominio solo dal livello 9; sempre più frequente salendo', () => {
  for (const lv of [1,4,8]) for (const seed of [1,2,3]) G.buildIntrusoConcettuale(lv,{rng:mulberry32(seed),count:8}).items.forEach(i => assert.notStrictEqual(DOM[i.category], DOM[i.intruderCategory]));
  const quota = lv => { let s=0,n=0; for (const seed of [1,2,3,4,5,6]) G.buildIntrusoConcettuale(lv,{rng:mulberry32(seed*13+lv),count:8}).items.forEach(i=>{ n++; if (DOM[i.category]===DOM[i.intruderCategory]) s++; }); return s/n; };
  assert.ok(quota(32) > quota(12), 'quota stesso dominio non cresce');
  assert.ok(quota(32) >= 0.7);
});

test('fascia di astrazione entro il limite e difficoltà crescente', () => {
  for (const lv of LIVELLI) G.buildIntrusoConcettuale(lv,{rng:mulberry32(lv),count:8}).items.forEach(i => assert.ok(i.tier <= G.maxTier(lv)));
  const mean = lv => { let s=0,n=0; for (const seed of [1,2,3,4]) G.buildIntrusoConcettuale(lv,{rng:mulberry32(seed*7+lv),count:8}).items.forEach(i=>{s+=i.difficulty;n++;}); return s/n; };
  let prev = -1; for (const lv of [1,6,11,16,21,26,32]) { const m = mean(lv); assert.ok(m >= prev - 0.25, 'livello ' + lv); prev = m; }
  assert.ok(mean(32) > mean(1) + 3);
});

test('anti-ripetizione: coppie categoria/intruso nuove finché ce ne sono', () => {
  const a = G.buildIntrusoConcettuale(5, {rng: mulberry32(1), count: 8});
  const b = G.buildIntrusoConcettuale(5, {rng: mulberry32(2), count: 8, used: a.historyKeys});
  assert.strictEqual(b.historyKeys.filter(k => a.historyKeys.includes(k)).length, 0);
  assert.strictEqual(new Set(a.items.map(i => i.category)).size, 8);
});

test('posizione dell\'intruso variabile e stesso seme -> stesso materiale', () => {
  const x = G.buildIntrusoConcettuale(10,{rng:mulberry32(42),count:8}), y = G.buildIntrusoConcettuale(10,{rng:mulberry32(42),count:8});
  assert.deepStrictEqual(x.items.map(i=>i.words), y.items.map(i=>i.words));
  const pos = new Set(); for (let s=1;s<=6;s++) G.buildIntrusoConcettuale(10,{rng:mulberry32(s),count:8}).items.forEach(i=>pos.add(i.oddIndex));
  assert.strictEqual(pos.size, 4);
});
