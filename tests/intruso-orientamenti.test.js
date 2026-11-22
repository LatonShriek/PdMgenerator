// Intruso: scala con orientamenti (22 nov 2026). Identico = stesso simbolo E stesso orientamento; l'unico deve essere unico anche per orientamento.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const c = vm.createContext({ console, Math, window: {}, document: {}, MAX_LEVEL: 32 });
const files = ['data/inv-real-block.js', 'data/base.js', 'js/util.js', 'js/state.js', 'js/export/intruso.js', 'js/renderers/intruso.js', 'js/generators/intruso.js'];
vm.runInContext(files.filter(f => fs.existsSync(path.join(root, f))).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') +
  '\nthis.__x = { genIntruso, state, intrusoOrientCount, intrusoAnglesFor, INTRUSO_ALL_FAMILIES };', c, { filename: 'intruso' });
const { genIntruso, state, intrusoOrientCount, intrusoAnglesFor, INTRUSO_ALL_FAMILIES } = c.__x;
state.materialOverride = state.materialOverride || {};

test('orientamenti per livello: nessuno / 4 / 8 secondo la scala', () => {
  const att = { 1:1, 3:1, 6:1, 7:4, 9:4, 10:8, 12:8, 13:1, 16:1, 17:4, 19:4, 20:8, 23:8, 24:1, 27:1, 28:4, 30:4, 31:8, 32:8 };
  Object.entries(att).forEach(([lv, n]) => assert.strictEqual(intrusoOrientCount(Number(lv)), n, 'livello ' + lv));
});
test('ruotano solo semi e note; le altre famiglie mai', () => {
  ['arrow', 'braille', 'letter', 'katakana', 'circles', 'quadrants', 'dice', 'geometric'].forEach(f => assert.strictEqual(JSON.stringify(intrusoAnglesFor(f, 10)), '[0]', f));
  assert.strictEqual(intrusoAnglesFor('suits', 7).length, 4);
  assert.strictEqual(intrusoAnglesFor('suits', 10).length, 8);
  assert.strictEqual(intrusoAnglesFor('music', 31).length, 8);
});
test('nei livelli con orientamenti compaiono solo semi e note, senza ♦ ♢ ♮ ♯', () => {
  [7, 10, 17, 20, 28, 31].forEach(lv => { for (let r = 0; r < 5; r++) genIntruso(lv, []).slides.forEach(s => {
    assert.ok(['suits', 'music'].includes(s.familyId), 'livello ' + lv + ': ' + s.familyId);
    assert.ok(![...s.items.join('')].some(ch => '♦♢♮♯'.includes(ch)), 'glifo simmetrico presente');
  }); });
});
test('le scritture non familiari compaiono già come singoli (livelli 4-6)', () => {
  const nonFam = ['greek', 'cyrillic', 'armenian', 'thai', 'katakana', 'hebrew', 'braille', 'geez'];
  const visti = new Set();
  for (let r = 0; r < 30; r++) genIntruso(6, []).slides.forEach(s => { if ([...s.items[0]].length === 1) visti.add(s.familyId); });
  assert.ok(nonFam.filter(f => visti.has(f)).length >= 4, 'almeno 4 scritture non familiari come singoli, viste: ' + [...visti].join(','));
});
test('unico anche per orientamento, a tutti i livelli', () => {
  for (let lv = 1; lv <= 32; lv++) for (let r = 0; r < 4; r++) genIntruso(lv, []).slides.forEach(s => {
    const cnt = {}; s.items.forEach((v, i) => { const k = v + '@' + s.angles[i]; cnt[k] = (cnt[k] || 0) + 1; });
    const singles = Object.keys(cnt).filter(k => cnt[k] === 1);
    assert.strictEqual(singles.length, 1, 'livello ' + lv + ': un solo elemento unico');
    assert.strictEqual(s.items[s.oddIndex] + '@' + s.angles[s.oddIndex], singles[0]);
    if (s.orient > 1) assert.ok(s.angles.some(a => a !== 0) && new Set(s.angles).size > 1, 'livello ' + lv + ': più orientamenti presenti');
  });
});
