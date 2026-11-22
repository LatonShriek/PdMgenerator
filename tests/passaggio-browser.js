// Prova nel browser del pannello «Passaggio livelli con Traccia-N»: il codice riflette i livelli del gruppo e l'applicazione di un codice li imposta e li ricorda.
//   node tests/passaggio-browser.js
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
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('pdm_group_name', 'PROVA'); recallGroupLevel(); state.levels.intruso = 12; state.levels.griglie = 8; state.levels.inversione = 15; renderProgressPanel(); });
  const code = await page.inputValue('#passCode');
  ok(/^PDM-I12-G8-V15-\d\d$/.test(code), 'il codice riflette i livelli del gruppo: ' + code);
  // codice da Traccia-N
  const trn = await page.evaluate(() => passaggioBuild('TRN', { intruso: 18, griglie: 11, inversione: 22 }));
  await page.fill('#passIn', trn); await page.click('#passApply'); await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ lv: [state.levels.intruso, state.levels.griglie, state.levels.inversione], stored: progressLoad('PROVA').levels }));
  ok(JSON.stringify(after.lv) === '[18,11,22]', 'livelli applicati allo stato: ' + after.lv);
  ok(after.stored.intruso === 18 && after.stored.griglie === 11 && after.stored.inversione === 22, 'ricordati per il gruppo');
  const msg = await page.textContent('#passMsg');
  ok(/Impostati per il gruppo/.test(msg), 'messaggio di conferma: ' + msg);
  // codice sbagliato
  await page.fill('#passIn', trn.replace('I18', 'I19')); await page.click('#passApply');
  const bad = await page.textContent('#passMsg');
  ok(/non torna/.test(bad), 'errore di battitura segnalato');
  // senza gruppo
  await page.evaluate(() => { localStorage.removeItem('pdm_group_name'); });
  ok(errs.length === 0, 'nessun errore di pagina ' + errs.join('|'));
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
