// Prova dell'avviso sul salvataggio online (Firestore finto, nessuna rete): quando le regole rifiutano
// una raccolta l'app deve dirlo, e quando tutto funziona deve dire "tutto a posto".
//   node tests/online-browser.js        (richiede Playwright con Chromium, come golden-browser.js)
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

  // Firestore finto: set/get/delete su raccolta -> documento; le raccolte in `deny` rifiutano la scrittura
  await page.evaluate(() => {
    localStorage.setItem('pdm_group_name', 'PROVA');
    window.__deny = new Set(['materialHistory']);
    const store = {};
    firebaseConfig.apiKey = firebaseConfig.apiKey || 'finta';
    firestoreDb = { collection: (c) => ({ doc: (id) => ({
      get: async () => ({ exists: (c + '/' + id) in store, data: () => store[c + '/' + id] }),
      set: async (d, o) => { if (window.__deny.has(c)) throw { code: 'permission-denied' }; store[c + '/' + id] = Object.assign({}, o && o.merge ? store[c + '/' + id] : {}, d); },
      delete: async () => { delete store[c + '/' + id]; }
    }) }) };
    sharedHistoryReady = true;
  });

  await page.click('#btnCheckOnline');
  await page.waitForFunction(() => /Tutto a posto|non salv/.test(document.getElementById('onlineCheckResult').textContent));
  let r = await page.textContent('#onlineCheckResult');
  ok(/✖ materialHistory: RIFIUTATA \(permission-denied\)/.test(r), 'la verifica indica materialHistory come rifiutata');
  ok(/✔ catHistory/.test(r) && /✔ groupProgress/.test(r), 'le altre raccolte risultano a posto');
  ok(/1 raccolta su 5 non salva online/.test(r), 'frase finale al singolare corretta');
  ok(await page.isVisible('#onlineProblems'), "compare l'avviso rosso");
  ok(/materialHistory \(permission-denied\)/.test(await page.textContent('#onlineProblems')), "l'avviso nomina la raccolta e il codice");

  // un salvataggio vero (appendUsed) su una raccolta rifiutata aggiorna l'avviso
  await page.evaluate(async () => { document.getElementById('onlineProblems').style.display = 'none'; Object.keys(remoteWriteProblems).forEach((k) => delete remoteWriteProblems[k]); await appendUsed('materialHistory', 'x', ['a'], 50); });
  ok(await page.isVisible('#onlineProblems'), 'una scrittura rifiutata durante il lavoro fa comparire l\'avviso');
  ok(await page.evaluate(() => localHistGet('PROVA', 'materialHistory', 'x').join() === 'a'), 'i dati restano comunque salvati in locale');

  // dopo la correzione delle regole
  await page.evaluate(() => { window.__deny.clear(); });
  await page.click('#btnCheckOnline');
  await page.waitForFunction(() => /Tutto a posto/.test(document.getElementById('onlineCheckResult').textContent));
  ok(!(await page.isVisible('#onlineProblems')), "l'avviso sparisce quando le regole sono a posto");

  // non connesso
  await page.evaluate(() => { sharedHistoryReady = false; });
  await page.click('#btnCheckOnline');
  ok(/Non connesso a Firebase/.test(await page.textContent('#onlineCheckResult')), 'se non è connesso lo dice');

  ok(errs.length === 0, 'nessun errore nella pagina ' + errs.join('|'));
  await browser.close();
  console.log(fails ? `FALLITO: ${fails}` : 'TUTTO OK');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
