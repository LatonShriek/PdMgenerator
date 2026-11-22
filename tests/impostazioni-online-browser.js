// Prova: le opzioni del gruppo (spunte e numeri) vanno nel documento online del gruppo e tornano su un altro dispositivo (Firestore finto).
//   node tests/impostazioni-online-browser.js
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const ROOT = path.join(__dirname, '..');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'KO   ') + m); if (!c) fails++; };
(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  await ctx.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(500);
  const setup = () => page.evaluate(() => {
    window.__store = window.__store || {};
    const store = window.__store;
    firebaseConfig.apiKey = firebaseConfig.apiKey || 'finta';
    firestoreDb = { collection: (c) => ({ doc: (id) => ({
      get: async () => ({ exists: (c + '/' + id) in store, data: () => store[c + '/' + id] }),
      set: async (d) => { store[c + '/' + id] = Object.assign({}, store[c + '/' + id], d); },
      delete: async () => { delete store[c + '/' + id]; }
    }) }) };
    sharedHistoryReady = true; lastSharedHistoryError = null;
  });
  // dispositivo A: sceglie il gruppo, imposta le opzioni
  await setup();
  await page.evaluate(async () => {
    localStorage.setItem('pdm_group_name', 'PROVA'); recallGroupLevel(); await progressSyncRemote();
    state.intrusoSolutionSlides = false; state.griglieSlidePerRegola = true; state.griglieRowsOverride = 5;
    await generate();
  });
  const saved = await page.evaluate(() => { const d = window.__store['groupProgress/PROVA']; return d ? JSON.parse(d.data).groupSettings : null; });
  ok(saved && saved.griglieSlidePerRegola === true && saved.intrusoSolutionSlides === false && saved.griglieRowsOverride === 5, 'le opzioni sono nel documento online del gruppo');
  // dispositivo B: browser vuoto, stesso gruppo
  await page.evaluate(() => { const keep = window.__store; localStorage.clear(); window.__store = keep; state.intrusoSolutionSlides = true; state.griglieSlidePerRegola = false; state.griglieRowsOverride = null; });
  await page.evaluate(async () => { localStorage.setItem('pdm_group_name', 'PROVA'); _progressSynced.clear(); recallGroupLevel(); await progressSyncRemote(); });
  const back = await page.evaluate(() => ({ a: state.intrusoSolutionSlides, b: state.griglieSlidePerRegola, c: state.griglieRowsOverride }));
  ok(back.a === false && back.b === true && back.c === 5, 'su un altro dispositivo le opzioni tornano da sole: ' + JSON.stringify(back));
  ok(errs.length === 0, 'nessun errore di pagina ' + errs.join('|'));
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
