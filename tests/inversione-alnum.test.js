// Inversione: la spunta «aggiungi blocco alfanumerico» deve produrre il blocco anche ai livelli 1-3 (stringhe da 3 caratteri).
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const c = vm.createContext({ console, Math, window: {}, document: {}, MAX_LEVEL: 32 });
const files = ['data/inv-real-block.js', 'data/base.js', 'js/util.js', 'js/state.js', 'js/generators/inversione.js'];
const src = files.filter(f => fs.existsSync(path.join(root, f))).map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
vm.runInContext(src + '\nthis.__x = { genInversione, state };', c, { filename: 'inv' });
const { genInversione, state } = c.__x;

test('livello 3 con la spunta: compare il blocco alfanumerico', () => {
  state.inversioneForceAlnum = true;
  const r = genInversione(3, []);
  assert.ok(r.blocks.some(b => b.kind === 'alnum'), 'nessun blocco alfanumerico');
});
test('livello 3 senza la spunta: nessun blocco alfanumerico', () => {
  state.inversioneForceAlnum = false;
  const r = genInversione(3, []);
  assert.ok(!r.blocks.some(b => b.kind === 'alnum'));
});
