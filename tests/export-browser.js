// Controllo "prima e dopo" delle ESPORTAZIONI (PowerPoint e Word): apre l'app in Chromium senza rete,
// fissa il generatore casuale, genera ogni esercizio, preme l'esportazione (exportCurrent) e confronta
// le impronte del contenuto di ogni file prodotto (nome del file + ogni parte interna dello zip).
// Si lascia fuori docProps/core.xml e app.xml, che contengono la data di creazione.
//
//   node tests/export-browser.js            confronta con tests/export-browser.json
//   node tests/export-browser.js --update   riscrive le impronte (solo se il cambiamento è voluto)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(__dirname, 'export-browser.json');
const UPDATE = process.argv.includes('--update');
const sha = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 16);

const CASES = [];
['griglie', 'intruso', 'inversione', 'serie', 'accesso', 'categorizzazione'].forEach((ex) => [3, 12, 24].forEach((l) => CASES.push([`${ex}|L${l}`, ex, l, {}])));
[1, 7].forEach((w) => CASES.push([`fascicolo|W${w}`, 'fascicolo', w, { fascicoloWeek: w }]));

async function run() {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
  await ctx.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
  await ctx.addInitScript(() => {
    window.__seed = function (s) {
      let a = s >>> 0;
      Math.random = function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    };
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('dialog', (d) => { problems.push('dialog: ' + d.message()); d.dismiss(); });
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(500);
  const out = {};
  for (const [name, ex, level, opts] of CASES) {
    const downloads = [];
    const onDl = (d) => downloads.push(d);
    page.on('download', onDl);
    await page.evaluate(async ({ ex, level, opts }) => {
      localStorage.clear();
      window.__seed(7);
      Object.assign(state, { materialOverride: { griglie: 'auto', intruso: 'auto', inversione: 'auto' }, fascicoloWeek: 1, fascicoloPartWeek: {}, reveal: false, slideIndex: 0 }, opts);
      state.exercise = ex;
      if (ex !== 'fascicolo') { state.level = level; state.levels[ex] = level; }
      state.deck = null;
      await generate();
      await new Promise((r) => setTimeout(r, 200));
      await exportCurrent();
      await new Promise((r) => setTimeout(r, 400));
    }, { ex, level, opts });
    page.off('download', onDl);
    const files = [];
    for (const d of downloads) {
      const b64 = fs.readFileSync(await d.path()).toString('base64');
      const parts = await page.evaluate(async (b64) => {
        const zip = await JSZip.loadAsync(b64, { base64: true });
        const parts = {};
        for (const n of Object.keys(zip.files).sort()) {
          if (zip.files[n].dir || /docProps\/(core|app)\.xml$/.test(n)) continue;
          const u8 = await zip.files[n].async('uint8array');
          let h = 5381; for (let i = 0; i < u8.length; i++) h = ((h * 33) ^ u8[i]) >>> 0;
          parts[n] = h + ':' + u8.length;
        }
        return JSON.stringify(parts);
      }, b64);
      files.push({ fname: d.suggestedFilename(), parts });
    }
    files.sort((x, y) => x.fname.localeCompare(y.fname));
    out[name] = files.map((f) => ({ fname: f.fname, hash: sha(f.parts), parti: Object.keys(JSON.parse(f.parts)).length }));
    if (!files.length) problems.push('nessun file prodotto: ' + name);
  }
  await browser.close();
  if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
  if (UPDATE) { fs.writeFileSync(SNAP, JSON.stringify(out, null, 1) + '\n'); console.log(`Impronte scritte: ${Object.keys(out).length} casi`); return; }
  const ref = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  let diff = 0;
  for (const k of new Set([...Object.keys(ref), ...Object.keys(out)])) {
    if (JSON.stringify(ref[k]) !== JSON.stringify(out[k])) { diff++; console.log('DIVERSO:', k, JSON.stringify(ref[k]), JSON.stringify(out[k])); }
  }
  console.log(diff ? `FALLITO: ${diff} casi diversi su ${Object.keys(out).length}` : `OK: ${Object.keys(out).length} esportazioni identiche`);
  if (diff) process.exitCode = 1;
}
run().catch((e) => { console.error(e); process.exit(1); });
