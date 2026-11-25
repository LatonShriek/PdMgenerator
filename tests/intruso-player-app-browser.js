// Prova nel browser, dall'app, con tocchi veri (schermo a tocco simulato): tablet in verticale e in orizzontale e telefono.
//   - dalla barra laterale dell'Intruso: campo «errori prima dell'aiuto» (salvato nello stato), «Scarica come pagina»
//     (nome del file e contenuto) e «▶ Avvia il lettore a tocco» (si apre una nuova finestra)
//   - la serie intera a tocco: errore segnalato, aiuto alla soglia scelta (non prima), riga isolata, avanti, riepilogo
//   CHROMIUM_PATH=/usr/bin/google-chrome node tests/intruso-player-app-browser.js     (BROWSER=webkit per provare anche WebKit, se installato)
const path = require('path');
const fs = require('fs');
const os = require('os');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const errs = [];
const check = (name, cond, extra) => { if (!cond) errs.push(name + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); };

// su schermi stretti la barra laterale è un cassetto: si apre solo se è chiuso
async function openMenu(page) {
  await page.waitForTimeout(300);   // il click sintetizzato dal tocco e la chiusura del cassetto arrivano un attimo dopo
  if (await page.locator('#btnMenu').isVisible() && !(await page.evaluate(() => document.body.classList.contains('menu-open')))) {
    await tap(page, '#btnMenu');
    await page.waitForTimeout(500);   // il cassetto scorre: si tocca solo a movimento finito
  }
}

async function tap(page, sel) {
  // nel cassetto i pulsanti in fondo sono fuori dallo schermo finché non si scorre; l'elemento può essere ridisegnato: si riprova
  for (let a = 0; a < 5; a++) {
    try {
      const loc = page.locator(sel).first();
      await loc.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
      await page.waitForTimeout(80);
      const box = await loc.boundingBox();
      if (box) { await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); return; }
    } catch (e) { await page.waitForTimeout(200); }
  }
  throw new Error('niente da toccare: ' + sel);
}

// una serie intera a tocco su una pagina del lettore; thr = soglia dell'aiuto attesa
async function playSeries(page, thr, label) {
  await page.waitForSelector('#go', { state: 'visible' });
  await tap(page, '#go');
  const n = Number((await page.evaluate(() => document.getElementById('prog').textContent)).match(/di (\d+)/)[1]);
  check(label + ': ci sono schermate', n >= 5, n);
  for (let s = 0; s < n; s++) {
    const info = await page.evaluate(() => {
      const cs = [...document.querySelectorAll('#grid .c')];
      return { ks: cs.map(d => +d.dataset.k), rows: cs.map(d => +d.dataset.row), odd: window.SL[window.i].odd };
    });
    const oddRow = info.rows[info.ks.indexOf(info.odd)];
    if (s === 1) {
      // schermata di prova degli errori: (thr-1) errori su celle di un'altra riga → nessun aiuto; il thr-esimo → aiuto
      const wrongs = info.ks.filter(k => k !== info.odd);
      for (let e = 0; e < thr; e++) {
        await tap(page, `#grid .c[data-k="${wrongs[e]}"]`);
        const st = await page.evaluate(() => ({ err: document.querySelectorAll('#grid .c.err').length, off: document.querySelectorAll('#grid .c.off').length }));
        check(`${label}: dopo ${e + 1} errori segnalati`, st.err === e + 1, st);
        if (e + 1 < thr) check(`${label}: nessun aiuto prima della soglia (${e + 1}/${thr})`, st.off === 0, st);
        else check(`${label}: aiuto alla soglia (${thr})`, st.off > 0, st);
      }
      // tocco su una cella spenta: ignorato
      const off = await page.evaluate(() => { const d = document.querySelector('#grid .c.off'); return d ? +d.dataset.k : -1; });
      if (off >= 0) {
        await tap(page, `#grid .c[data-k="${off}"]`);
        const st2 = await page.evaluate(() => document.getElementById('prog').textContent);
        check(`${label}: tocco su cella spenta ignorato`, /Schermata 2 di/.test(st2), st2);
      }
      // le celle toccabili sono solo quelle della riga giusta (le già segnalate restano attenuate e non toccabili)
      const act = await page.evaluate(() => [...document.querySelectorAll('#grid .c')].filter(d => !d.classList.contains('off') && !d.classList.contains('err')).map(d => +d.dataset.row));
      check(`${label}: attive solo celle della riga dell'intruso`, act.every(r => r === oddRow), { act, oddRow });
    }
    await tap(page, `#grid .c[data-k="${info.odd}"]`);
    await page.waitForTimeout(450);
  }
  const msg = await page.evaluate(() => ({ on: document.getElementById('msg').classList.contains('on'), t: document.getElementById('msg').innerText.replace(/\s+/g, ' ') }));
  check(label + ': riepilogo', msg.on && /Giuste al primo tocco/.test(msg.t), msg.t.slice(0, 80));
  check(label + ': riepilogo conta 1 schermata con aiuto', /con l’aiuto \(riga\)\s*1/.test(msg.t), msg.t);
  check(label + ': errori in tutto = soglia', new RegExp(`Errori in tutto\\s*${thr}\\b`).test(msg.t), msg.t);
}

async function runDevice(browser, name, ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push(String(e)));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  // barra laterale: su schermi stretti sta nel cassetto
  await openMenu(page);
  await tap(page, '#exList button:has-text("Intruso percettivo")');
  check(name + ': esercizio scelto', (await page.evaluate(() => state.exercise)) === 'intruso');
  await openMenu(page);   // scegliere un esercizio chiude il cassetto
  const thr = 3;
  const hint = page.locator('input[aria-label="Errori prima dell\'aiuto nel lettore a tocco"]');
  check(name + ': campo soglia presente', (await hint.count()) === 1);
  await hint.fill(String(thr)); await hint.dispatchEvent('change');
  check(name + ': soglia nello stato', (await page.evaluate(() => state.intrusoHintAfter)) === thr);
  await hint.fill('9'); await hint.dispatchEvent('change');
  check(name + ': soglia limitata a 5', (await page.evaluate(() => state.intrusoHintAfter)) === 5);
  await hint.fill(String(thr)); await hint.dispatchEvent('change');
  await tap(page, '#btnGenerate');
  await page.waitForTimeout(300);
  await openMenu(page);   // Genera chiude il cassetto

  // Scarica come pagina
  const [dl] = await Promise.all([page.waitForEvent('download'), tap(page, 'button:has-text("Scarica come pagina")')]);
  const fname = dl.suggestedFilename();
  check(name + ': nome file', /Intruso percettivo\.\d+.* a tocco\.html$/.test(fname), fname);
  const tmp = path.join(os.tmpdir(), 'pdm-test-' + Date.now() + '.html');
  await dl.saveAs(tmp);
  const html = fs.readFileSync(tmp, 'utf8');
  check(name + ': file autonomo (senza rete)', !/<script[^>]+src=|<link[^>]+href=|https?:\/\//i.test(html.replace(/xmlns="[^"]*"/g, '')), (html.match(/https?:\/\/[^"'\s)]+/) || [])[0]);
  const p2 = await ctx.newPage(); p2.on('pageerror', e => consoleErrors.push(String(e)));
  await p2.goto('file://' + tmp);
  await playSeries(p2, thr, name + ' (file scaricato)');
  await p2.close();

  // Avvia il lettore a tocco (nuova finestra)
  await openMenu(page);
  const [popup] = await Promise.all([ctx.waitForEvent('page'), tap(page, 'button:has-text("Avvia il lettore a tocco")')]);
  popup.on('pageerror', e => consoleErrors.push(String(e)));
  await popup.waitForLoadState();
  await playSeries(popup, thr, name + ' (finestra)');
  check(name + ': nessun errore JavaScript', consoleErrors.length === 0, consoleErrors);
  fs.unlinkSync(tmp);
  await ctx.close();
}

(async () => {
  const kind = process.env.BROWSER === 'webkit' ? pw.webkit : pw.chromium;
  const browser = await kind.launch(kind === pw.chromium ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const touch = { hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
  await runDevice(browser, 'tablet verticale', { ...touch, viewport: { width: 810, height: 1080 } });
  await runDevice(browser, 'tablet orizzontale', { ...touch, viewport: { width: 1180, height: 820 } });
  await runDevice(browser, 'telefono', { ...touch, viewport: { width: 390, height: 844 } });
  await browser.close();
  if (errs.length) { console.log('ERRORE\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('OK: dall\'app, con tocchi veri su tablet e telefono: scarica, avvia, errori, aiuto alla soglia, riepilogo');
})();
