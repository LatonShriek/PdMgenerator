// Test di «Analogie»: struttura A:B = C:?, correttezza dalla banca, graduazione, scelta multipla, anti-ripetizione.
const test = require('node:test');
const assert = require('node:assert');
const G = require('../js/generators/analogie.js');
const BANK = require('../data/analogie.js');

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const LIVELLI = [1,4,8,9,12,13,16,17,20,24,28,32];
const norm = s => s.toLowerCase();

test('banca: relazioni con ≥10 coppie, parole non duplicate, tutte le fasce', () => {
  assert.ok(BANK.length >= 12);
  BANK.forEach(r => {
    assert.ok(r.coppie.length >= 10, r.id);
    const as = r.coppie.map(p => norm(p.a));
    assert.strictEqual(new Set(as).size, as.length, 'A doppi in ' + r.id);
    r.coppie.forEach(p => { assert.ok(p.a && p.b); assert.notStrictEqual(norm(p.a), norm(p.b)); assert.ok(!p.ok.includes(p.b)); });
    assert.ok(['proposta','verificata'].includes(r.stato));
  });
  for (let t = 1; t <= 5; t++) assert.ok(BANK.filter(r => r.t === t).length >= 2, 'fascia ' + t);
});

test('ogni quesito: due coppie diverse della stessa relazione; risposta corretta dalla banca', () => {
  for (const lv of LIVELLI) for (const seed of [1,2,3]) {
    const d = G.buildAnalogie(lv, {rng: mulberry32(seed*40+lv), count: 8});
    assert.strictEqual(d.items.length, 8);
    for (const it of d.items) {
      const rel = BANK.find(r => r.id === it.relation);
      const p1 = rel.coppie.find(p => p.a === it.pair1.a && p.b === it.pair1.b), p2 = rel.coppie.find(p => p.a === it.pair2.a && p.b === it.pair2.b);
      assert.ok(p1 && p2 && p1 !== p2);
      const words = [p1.a, p1.b, p2.a, p2.b].map(norm);
      assert.strictEqual(new Set(words).size, 4, 'parole ripetute nel quesito');
      if (it.reversed) { assert.strictEqual(it.answerWord, p2.a); assert.ok(it.prompt.includes('?') && it.prompt.includes(p2.b)); assert.deepStrictEqual(it.accepted, [p2.a]); }
      else { assert.strictEqual(it.answerWord, p2.b); assert.ok(it.prompt.includes(p2.a)); assert.deepStrictEqual(it.accepted, [p2.b, ...p2.ok]); }
      assert.ok(it.prompt.includes(p1.a) && it.prompt.includes(p1.b));
    }
  }
});

test('nessuna coppia riusata nella sessione', () => {
  for (const lv of LIVELLI) {
    const d = G.buildAnalogie(lv, {rng: mulberry32(9+lv), count: 8});
    const keys = d.items.flatMap(i => [i.pair1.a + '>' + i.pair1.b, i.pair2.a + '>' + i.pair2.b]);
    assert.strictEqual(new Set(keys).size, keys.length, 'livello ' + lv);
  }
});

test('fasce di astrazione entro il limite del livello; difficoltà crescente', () => {
  for (const lv of LIVELLI) G.buildAnalogie(lv,{rng:mulberry32(lv),count:8}).items.forEach(i => assert.ok(i.tier <= G.maxTier(lv)));
  const mean = lv => { let s=0,n=0; for (const seed of [1,2,3,4]) G.buildAnalogie(lv,{rng:mulberry32(seed*11+lv),count:8}).items.forEach(i=>{s+=i.difficulty;n++;}); return s/n; };
  let prev = -1; for (const lv of [1,6,11,16,21,26,32]) { const m = mean(lv); assert.ok(m >= prev - 0.3, 'livello ' + lv); prev = m; }
  assert.ok(mean(32) > mean(1) + 3);
});

test('quesiti invertiti (?:D) solo dal livello 17', () => {
  for (const lv of [1,8,16]) G.buildAnalogie(lv,{rng:mulberry32(lv),count:8}).items.forEach(i => assert.ok(!i.reversed));
  let any = false; for (let s=1;s<=5;s++) G.buildAnalogie(28,{rng:mulberry32(s),count:8}).items.forEach(i => { if (i.reversed) any = true; });
  assert.ok(any);
});

test('scelta multipla fino al livello 12: 4 opzioni, una sola accettabile', () => {
  for (const lv of [1,5,9,12]) G.buildAnalogie(lv,{rng:mulberry32(lv),count:8}).items.forEach(it => {
    assert.strictEqual(it.options.length, 4);
    assert.strictEqual(new Set(it.options.map(norm)).size, 4);
    assert.ok(it.options.includes(it.answerWord));
    it.options.filter(o => o !== it.answerWord).forEach(o => assert.ok(!it.accepted.includes(o), 'opzione accettabile: ' + o));
    [it.pair1.a, it.pair1.b].forEach(w => assert.ok(!it.options.includes(w), 'opzione = parola del quesito'));
  });
  G.buildAnalogie(13,{rng:mulberry32(1),count:8}).items.forEach(it => assert.ok(!it.options));
});

test('anti-ripetizione: coppie nuove finché ce ne sono (livello 16)', () => {
  const a = G.buildAnalogie(16, {rng: mulberry32(1), count: 8});
  const b = G.buildAnalogie(16, {rng: mulberry32(2), count: 8, used: a.historyKeys});
  assert.strictEqual(b.historyKeys.filter(k => a.historyKeys.includes(k)).length, 0);
});

test('stesso seme -> stesso materiale', () => {
  const x = G.buildAnalogie(15,{rng:mulberry32(42),count:8}), y = G.buildAnalogie(15,{rng:mulberry32(42),count:8});
  assert.deepStrictEqual(x.items.map(i=>i.prompt), y.items.map(i=>i.prompt));
});
