// Griglie-Conteggio: colori leggibili e forme disegnate davvero (rombo vero, forme vuote ben visibili).
// I due file del generatore e del renderer sono script classici (variabili globali, niente export): si caricano
// in un "contesto" isolato con le poche variabili globali che servono al caricamento.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ctx = (() => {
  const c = vm.createContext({ MAX_LEVEL: 32, state: {}, console, Math });
  const src = ['js/generators/griglie.js', 'js/renderers/griglie.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
  vm.runInContext(src + '\nthis.__x = { INK_POOL, FILL_POOL, INK_CONFLICTS, GRID_SHAPES, gridSymLabel, gridShapeSvg };', c, { filename: 'griglie' });
  return c.__x;
})();

// ---- colori: CIELAB e contrasto (WCAG) ----
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
function lab(h) {
  const [r, g, b] = rgb(h).map(lin);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const lum = h => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrasto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('inchiostri: nessuno si confonde col nero (il verde scuro di prima sì)', () => {
  const nero = ctx.INK_POOL.find(c => c.name === 'nero').css;
  for (const c of ctx.INK_POOL) if (c.name !== 'nero') assert.ok(dE(c.css, nero) >= 70, `${c.name} troppo vicino al nero: ΔE ${dE(c.css, nero).toFixed(0)}`);
  assert.ok(!ctx.INK_POOL.some(c => /scuro|marrone/.test(c.name)), 'niente più verde scuro né marrone');
});

test('inchiostri: coppie diverse tra loro, salvo quelle dichiarate in conflitto', () => {
  const conflitti = ctx.INK_CONFLICTS.map(([a, b]) => [a, b].sort().join('+'));
  for (let i = 0; i < ctx.INK_POOL.length; i++) for (let j = i + 1; j < ctx.INK_POOL.length; j++) {
    const a = ctx.INK_POOL[i], b = ctx.INK_POOL[j];
    if (conflitti.includes([a.name, b.name].sort().join('+'))) continue;
    assert.ok(dE(a.css, b.css) >= 60, `${a.name}/${b.name} ΔE ${dE(a.css, b.css).toFixed(0)}: aggiungere il conflitto o cambiare colore`);
  }
  // ogni conflitto dichiarato deve riguardare colori davvero presenti
  for (const [a, b] of ctx.INK_CONFLICTS) for (const n of [a, b]) assert.ok(ctx.INK_POOL.some(c => c.name === n), `conflitto con colore inesistente: ${n}`);
});

test('inchiostri: restano leggibili su tutti gli sfondi (contrasto ≥ 2,5:1 per simboli grandi in grassetto) e sul bianco', () => {
  for (const c of ctx.INK_POOL) {
    for (const f of ctx.FILL_POOL) assert.ok(contrasto(c.css, f.css) >= 2.5, `${c.name} su ${f.name}: ${contrasto(c.css, f.css).toFixed(2)}`);
    assert.ok(contrasto(c.css, '#FFFFFF') >= 3, `${c.name} sul bianco`);
  }
});

// ---- forme ----
function punti(svg) {
  const m = svg.match(/<polygon points="([^"]+)"/);
  assert.ok(m, 'poligono atteso');
  return m[1].split(' ').map(p => p.split(',').map(Number));
}

test('il rombo è un rombo vero (più alto che largo), non un quadrato ruotato', () => {
  for (const sym of ['◆', '◇']) {
    const pts = punti(ctx.gridShapeSvg(sym, '#000000'));
    assert.strictEqual(pts.length, 4);
    const w = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0]));
    const h = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
    assert.ok(w / h < 0.75 && w / h > 0.5, `rapporto larghezza/altezza ${(w / h).toFixed(2)}`);
  }
});

test('forme vuote: contorno spesso del colore del simbolo, nessun riempimento; forme piene: riempite', () => {
  for (const [sym, d] of Object.entries(ctx.GRID_SHAPES)) {
    const svg = ctx.gridShapeSvg(sym, '#00823A');
    assert.ok(svg.includes('#00823A'), `${sym}: colore del simbolo`);
    if (d.filled) assert.ok(/fill="#00823A"/.test(svg), `${sym} piena`);
    else {
      assert.ok(/fill="none"/.test(svg), `${sym} vuota senza riempimento`);
      const sw = +svg.match(/stroke-width="(\d+)"/)[1];
      assert.ok(sw >= 12, `${sym} vuota: contorno ${sw}/100 troppo sottile`);
    }
  }
});

test('le consegne nominano le forme a parole: il carattere ◆ non compare più nel testo', () => {
  assert.strictEqual(ctx.gridSymLabel('◆'), 'rombo pieno');
  assert.strictEqual(ctx.gridSymLabel('◇'), 'rombo vuoto');
  assert.strictEqual(ctx.gridSymLabel('A'), 'A');
  for (const sym of Object.keys(ctx.GRID_SHAPES)) assert.ok(ctx.gridSymLabel(sym) !== sym, `${sym} senza nome`);
});
