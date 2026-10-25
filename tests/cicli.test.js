// Garanzia «almeno 4 cicli senza ripetizioni»: un gruppo che fa 4 cicli (32 livelli x 1 seduta di 8 quesiti) non rivede mai
// lo stesso quesito identico, con le cronologie che l'app tiene davvero (tetti di js/registry.js).
const test = require('node:test');
const assert = require('node:assert');
const { buildClassificazioni } = require('../js/generators/classificazioni.js');
const { buildAnalogie } = require('../js/generators/analogie.js');
const { buildIntrusoConcettuale } = require('../js/generators/intruso-concettuale.js');
const { loadEngine } = require('./load-engine.js');
const fs = require('fs'), path = require('path');

function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const CICLI = 4;
// i tetti veri, letti da registry.js (se qualcuno li abbassa, il test lo segnala)
const registry = fs.readFileSync(path.join(__dirname, '..', 'js', 'registry.js'), 'utf8');
const cap = field => { const m = registry.match(new RegExp(field + '",\\s*cap:(\\d+)')); assert.ok(m, 'tetto di ' + field); return +m[1]; };

const SIG = {
  classificazioni: it => it.category + '|' + it.terms.slice().sort().join(','),
  analogie: it => it.prompt,
  intrusoconc: it => it.words.slice().sort().join(',') + '|' + it.words[it.oddIndex],
};
function simula(build, sig, tetto, seed) {
  const rng = mulberry32(seed); let used = []; const visti = new Set(); let ripetuti = 0, incomplete = 0;
  for (let c = 0; c < CICLI; c++) for (let L = 1; L <= 32; L++) {
    const d = build(L, { rng, used: used.slice(-tetto), count: 8 });
    if (d.items.length < 8) incomplete++;
    used = used.concat(d.historyKeys);
    d.items.forEach(it => { const s = sig(it); if (visti.has(s)) ripetuti++; visti.add(s); });
  }
  return { ripetuti, incomplete, quesiti: visti.size };
}

[['classificazioni', buildClassificazioni, 'usedClassificazioni'],
 ['analogie', buildAnalogie, 'usedAnalogie'],
 ['intrusoconc', buildIntrusoConcettuale, 'usedIntrusoConc']].forEach(([nome, build, campo]) => {
  test(`${nome}: ${CICLI} cicli (32 livelli x 8 quesiti) senza quesiti identici, 3 semi`, () => {
    for (const seed of [1, 7, 99]) {
      const r = simula(build, SIG[nome], cap(campo), seed);
      assert.strictEqual(r.ripetuti, 0, `${nome} seme ${seed}: ${r.ripetuti} quesiti identici ripetuti`);
      assert.strictEqual(r.incomplete, 0, `${nome} seme ${seed}: sedute con meno di 8 quesiti`);
      assert.strictEqual(r.quesiti, CICLI * 32 * 8);
    }
  });
});

test('tetti delle cronologie: bastano per 4 cicli e restano nei limiti della copia di sicurezza (5000 voci)', () => {
  // voci per seduta: classificazioni 16 (categoria + terna), analogie 24 (2 coppie + quesito), concettuale 8 (coppia)
  assert.ok(cap('usedClassificazioni') >= CICLI * 32 * 16 && cap('usedClassificazioni') <= 5000);
  assert.ok(cap('usedAnalogie') >= CICLI * 32 * 8 * 3 && cap('usedAnalogie') <= 5000);
  assert.ok(cap('usedIntrusoConc') >= CICLI * 32 * 8);
});

test('Fascicolo settimana 1 (iniziale libera): 4 cicli senza consegne ripetute né carenze', () => {
  const E = loadEngine();
  const ex = { lexicalKeys: [], categories: [], anagramWords: [], crucipuzzleWords: [] };
  for (let c = 0; c < CICLI; c++) {
    const d = E.buildFascicolo(1, 500 + c, ex);
    assert.ok(!(d.lexicalBlock.prompts.shortfall > 0), 'ciclo ' + (c + 1) + ': consegne insufficienti');
    d.lexicalBlock.historyKeys.forEach(k => assert.ok(!ex.lexicalKeys.includes(k), 'ripetuta ' + k));
    ex.lexicalKeys = ex.lexicalKeys.concat(d.lexicalBlock.historyKeys);
  }
});
