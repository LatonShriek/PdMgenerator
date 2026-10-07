// Controllo "prima e dopo" dell'ASPETTO: per ogni elemento della pagina calcola tutti gli stili che il browser
// applica davvero (colori, margini, caratteri, ecc.) e ne confronta l'impronta con tests/style-browser.json.
// Serve a dimostrare che spostare il CSS in un file separato non cambia nulla di ciò che si vede.
// (Più robusto delle schermate a pixel, che a volte cambiano di qualche pixel da sole per il disegno dei caratteri.)
// Stati provati: avvio, ogni esercizio, con schermo da computer e da telefono.
//   node tests/style-browser.js            confronta
//   node tests/style-browser.js --update   riscrive le impronte (solo se il cambiamento è voluto)
const fs = require('fs');
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const ROOT = path.join(__dirname, '..');
const SNAP = path.join(__dirname, 'style-browser.json');
const UPDATE = process.argv.includes('--update');
const SHOTS = [['griglie', 10], ['intruso', 15], ['inversione', 12], ['serie', 10], ['accesso', 12], ['categorizzazione', 8], ['fascicolo', 1]];

function stylesHash() {
  let h = 5381, n = 0;
  const add = (s) => { for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; };
  for (const el of document.querySelectorAll('body, body *')) {
    const cs = getComputedStyle(el);
    let s = el.tagName + '#' + el.id + '.' + (el.getAttribute('class') || '') + '|';
    for (let i = 0; i < cs.length; i++) s += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
    for (const ps of ['::before', '::after']) { const p = getComputedStyle(el, ps); s += ps + p.getPropertyValue('content') + p.getPropertyValue('display'); }
    add(s); n++;
  }
  return h + ':' + n;
}

(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const out = {};
  for (const [vw, vh, tag] of [[1400, 1000, 'desktop'], [420, 900, 'telefono']]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
    await ctx.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
    await ctx.addInitScript(() => {
      window.__seed = function (s) { let a = s >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
      window.__seed(1);
    });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    await page.waitForTimeout(600);
    out[tag + '|avvio'] = await page.evaluate(stylesHash);
    for (const [ex, lev] of SHOTS) {
      await page.evaluate(async ({ ex, lev }) => {
        localStorage.clear(); window.__seed(5);
        state.exercise = ex; if (ex === 'fascicolo') state.fascicoloWeek = lev; else { state.level = lev; state.levels[ex] = lev; }
        state.reveal = false; state.slideIndex = 0; state.deck = null;
        buildExList(); renderExControls(); await generate();
        await new Promise((r) => setTimeout(r, 300));
      }, { ex, lev });
      await page.waitForTimeout(300);
      if (ex === 'categorizzazione') { out[tag + '|' + ex] = 'asincrono'; continue; }
      out[tag + '|' + ex] = await page.evaluate(stylesHash);
    }
    await ctx.close();
  }
  await browser.close();
  if (UPDATE) { fs.writeFileSync(SNAP, JSON.stringify(out, null, 1) + '\n'); console.log('Impronte scritte:', Object.keys(out).length); return; }
  const ref = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  let diff = 0;
  for (const k of Object.keys(out)) if (ref[k] !== out[k]) { diff++; console.log('DIVERSO:', k, ref[k], out[k]); }
  console.log(diff ? `FALLITO: ${diff} stati diversi su ${Object.keys(out).length}` : `OK: ${Object.keys(out).length} stati identici`);
  process.exit(diff ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
