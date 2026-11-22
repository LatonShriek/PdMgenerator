// Inversione PdM: scala di complessità del materiale (22 nov 2026): colori 1→2→3 (uguali e diversi), maiuscole e grande/piccolo dall'8, sottolineati dal 12.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const c = vm.createContext({ console, Math, window: {}, document: {}, MAX_LEVEL: 32 });
const files = ['data/inv-real-block.js', 'data/base.js', 'js/util.js', 'js/state.js', 'js/generators/inversione.js'];
vm.runInContext(files.filter(f => fs.existsSync(path.join(root, f))).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') +
  '\nthis.__x = { genInversione, state };', c, { filename: 'inv' });
const { genInversione, state } = c.__x;
state.materialOverride = state.materialOverride || {};

const HEX = { '#D64545': 'red', '#3E9B4F': 'green', '#2F6FD0': 'blue' };
function stats(level, runs = 30) {
  const o = { colors: new Set(), same: 0, diff: 0, n3: 0, sizes: 0, under: 0, mixedCase: 0, items: 0, maxMarks: 0 };
  for (let r = 0; r < runs; r++) genInversione(level, []).blocks.forEach(b => b.items.forEach(it => {
    o.items++;
    it.marks.forEach(m => o.colors.add(HEX[m.color]));
    o.maxMarks = Math.max(o.maxMarks, it.marks.length);
    if (it.marks.length >= 2) { const k = new Set(it.marks.map(m => m.color)).size; if (k === 1) o.same++; else o.diff++; }
    if (it.marks.length === 3) o.n3++;
    if (it.sizes) o.sizes++;
    if (it.under) { o.under++; assert.ok(it.under.length < [...it.text].length); }
    if (/[a-z]/.test(it.text) && /[A-Z]/.test(it.text)) o.mixedCase++;
  }));
  return o;
}

test('colori: solo rosso fino al 3, verde dal 4, blu dal 12', () => {
  [1, 2, 3].forEach(l => { const s = stats(l); assert.deepStrictEqual([...s.colors], ['red'], 'livello ' + l); assert.strictEqual(s.maxMarks, 1); });
  const s4 = stats(4, 60); assert.ok(s4.colors.has('green'), 'verde al 4'); assert.ok(!s4.colors.has('blue'));
  [8, 11].forEach(l => assert.ok(!stats(l).colors.has('blue'), 'niente blu al ' + l));
  assert.ok(stats(12, 60).colors.has('blue'), 'blu dal 12');
});

test('più caratteri colorati: sia dello stesso colore sia di colori diversi', () => {
  const s = stats(10, 60);
  assert.ok(s.same > 5 && s.diff > 5, 'uguali ' + s.same + ' / diversi ' + s.diff);
  const s2 = stats(20, 60); assert.ok(s2.n3 > 0 && s2.same > 5 && s2.diff > 5, 'fino a 3 contrassegni dal 12');
});

test('grande/piccolo e maiuscole miste dall\'8, sottolineati dal 12', () => {
  const lo = stats(7, 60); assert.strictEqual(lo.sizes + lo.mixedCase + lo.under, 0, 'niente prima dell\'8');
  const l8 = stats(11, 60); assert.ok(l8.sizes > 0 && l8.mixedCase > 0 && l8.under === 0, 'dall\'8 sì, sottolineati ancora no');
  assert.ok(stats(14, 60).under > 0, 'sottolineati dal 12');
});
