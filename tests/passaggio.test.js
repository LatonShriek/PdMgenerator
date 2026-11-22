// Codice di passaggio dei livelli PdM <-> Traccia-N: costruzione, lettura, errori di battitura.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'passaggio.js'), 'utf8');
const cut = src.indexOf('// ---- Interfaccia');
const { passaggioBuild, passaggioParse } = new Function(src.slice(0, cut) + '; return { passaggioBuild, passaggioParse };')();

test('costruzione e lettura: i livelli tornano identici, anche parziali', () => {
  const c = passaggioBuild('PDM', { intruso: 12, griglie: 8, inversione: 15 });
  assert.match(c, /^PDM-I12-G8-V15-\d\d$/);
  assert.deepStrictEqual(passaggioParse(c), { ok: true, origin: 'PDM', levels: { intruso: 12, griglie: 8, inversione: 15 } });
  assert.deepStrictEqual(passaggioParse(passaggioBuild('TRN', { griglie: 4 })).levels, { griglie: 4 });
  assert.strictEqual(passaggioBuild('PDM', {}), null);
});
test('tollerante su spazi, maiuscole e trattini lunghi; livelli decimali tagliati, limiti 1-32', () => {
  const c = passaggioBuild('PDM', { intruso: 12.9, griglie: 0, inversione: 99 });
  assert.deepStrictEqual(passaggioParse(c).levels, { intruso: 12, griglie: 1, inversione: 32 });
  const good = passaggioBuild('TRN', { intruso: 7, inversione: 20 });
  assert.ok(passaggioParse(' ' + good.toLowerCase().replace(/-/g, ' – ').replace(/ – /g, '-') + '\n').ok);
});
test('errori di battitura e codici non validi sono respinti', () => {
  const c = passaggioBuild('PDM', { intruso: 12, griglie: 8, inversione: 15 });
  const bad = c.replace('I12', 'I13');
  assert.strictEqual(passaggioParse(bad).ok, false);
  assert.strictEqual(passaggioParse('').ok, false);
  assert.strictEqual(passaggioParse('PDM-I12').ok, false);
  assert.strictEqual(passaggioParse('ABC-I12-G8-00').ok, false);
  // livello fuori scala (con controllo valido) respinto
  const body = 'PDM-I40'; let s = 0; for (let i = 0; i < body.length; i++) s += body.charCodeAt(i) * (i + 1);
  assert.strictEqual(passaggioParse(body + '-' + String(s % 97).padStart(2, '0')).ok, false);
});
