// Prova nel browser: il lettore a tocco dell'Intruso percettivo.
//   - tocco giusto = si passa alla schermata dopo; tocco sbagliato = errore, l'elemento si attenua e la schermata resta
//   - dopo N errori restano attive solo le celle della riga che contiene l'intruso (le altre non reagiscono e non contano)
//   - un elemento già segnalato non si conta due volte
//   - riepilogo finale (primo tocco / dopo errori / con aiuto) e «Ricomincia»
//   - funziona con le schermate vere del generatore, a tutti i livelli (anche rotazioni e cornici), senza uscire dalle celle
//   CHROMIUM_PATH=/usr/bin/google-chrome node tests/intruso-player-browser.js
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const pg = await b.newPage();
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const errs = [];
  const check = (name, cond, extra) => { if (!cond) errs.push(name + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); };

  // 1) comportamento su 3 schermate costruite a mano (20 elementi: 5 colonne × 4 righe su una pagina larga)
  const mk = (odd) => ({ items: Array.from({ length: 20 }, (_, k) => (k === odd ? 'X' : (k % 2 ? 'A' : 'B'))), oddIndex: odd, familyId: 'letter', familyLabel: 'Lettere', orient: 1, angles: null });
  const html = await pg.evaluate((s) => intrusoBuildPlayerHtml({ slides: s }, 4, 2), [mk(7), mk(12), mk(3)]);
  const pl = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await pl.setContent(html);
  const cells = () => pl.evaluate(() => [...document.querySelectorAll('#grid .c')].map(d => ({ k: +d.dataset.k, row: +d.dataset.row, err: d.classList.contains('err'), off: d.classList.contains('off') })));
  const tap = (k) => pl.click(`#grid .c[data-k="${k}"]`, { force: true });
  const prog = () => pl.evaluate(() => document.getElementById('prog').textContent);

  check('prima di iniziare niente griglia', (await cells()).length === 0);
  await pl.click('#go');
  check('schermata 1', (await prog()) === 'Schermata 1 di 3', await prog());
  let c = await cells();
  check('20 celle', c.length === 20, c.length);
  const rows = new Set(c.map(x => x.row)).size;
  check('righe piene (divisore esatto)', 20 % (20 / rows) === 0 && rows >= 2, rows);

  // schermata 1: intruso in posizione 7. Un errore: segnalato, resta lì, nessun aiuto ancora
  await tap(0);
  c = await cells();
  check('errore segnalato', c[0].err === true);
  check('nessun aiuto dopo 1 errore', c.every(x => !x.off));
  check('resta sulla stessa schermata', (await prog()) === 'Schermata 1 di 3');
  await tap(0);                                   // lo stesso elemento di nuovo: ignorato, non conta come secondo errore
  c = await cells();
  check('ripetere lo stesso tocco non attiva l\'aiuto', c.every(x => !x.off));
  // secondo errore (elemento diverso): scatta l'aiuto, restano attive solo le celle della riga dell'intruso
  await tap(1);
  c = await cells();
  const oddRow = c[7].row;
  check('aiuto: solo la riga giusta', c.every(x => (x.row === oddRow) === !x.off || x.err), c.map(x => [x.k, x.row, x.off, x.err]));
  check('aiuto: la riga giusta è attiva', c.filter(x => x.row === oddRow).every(x => !x.off));
  // un tocco su una cella spenta non fa niente e non conta
  const outside = c.find(x => x.off);
  if (outside) await pl.evaluate((k) => document.querySelector(`#grid .c[data-k="${k}"]`).click(), outside.k);
  check('cella spenta ignorata', (await prog()) === 'Schermata 1 di 3');
  await tap(7);                                   // giusto (con aiuto)
  await pl.waitForTimeout(600);
  check('avanti dopo il tocco giusto', (await prog()) === 'Schermata 2 di 3', await prog());
  c = await cells();
  check('la schermata nuova riparte pulita', c.every(x => !x.off && !x.err));

  // schermata 2: un errore poi giusto (dopo errore, senza aiuto)
  await tap(0); await tap(12); await pl.waitForTimeout(600);
  check('schermata 3', (await prog()) === 'Schermata 3 di 3', await prog());
  // schermata 3: giusta al primo tocco
  await tap(3); await pl.waitForTimeout(600);
  const fin = await pl.evaluate(() => document.getElementById('msg').innerText.replace(/\s+/g, ' '));
  check('riepilogo: primo tocco 1/3', /primo tocco\s*1 \/ 3 \(33%\)/.test(fin), fin);
  check('riepilogo: dopo 1 errore 1', /dopo 1 errore\s*1/.test(fin), fin);
  check('riepilogo: con aiuto 1', /con l’aiuto \(riga\)\s*1/.test(fin), fin);
  check('riepilogo: errori in tutto 3', /Errori in tutto\s*3/.test(fin), fin);
  await pl.click('#go2');
  check('Ricomincia', (await prog()) === 'Schermata 1 di 3' && (await cells()).every(x => !x.err && !x.off));

  // soglia diversa (1 errore): l'aiuto scatta subito
  const html1 = await pg.evaluate((s) => intrusoBuildPlayerHtml({ slides: s }, 4, 1), [mk(7)]);
  const p1 = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p1.setContent(html1); await p1.click('#go'); await p1.click('#grid .c[data-k="0"]', { force: true });
  check('soglia 1', (await p1.evaluate(() => document.querySelectorAll('#grid .c.off').length)) > 0);

  // 2) schermate vere del generatore a più livelli: tutte le celle dentro la griglia e dentro lo schermo, intruso unico
  const livelli = [1, 6, 9, 14, 20, 26, 30, 32];
  for (const vp of [{ width: 1280, height: 800 }, { width: 800, height: 1180 }]) {
    const page = await b.newPage({ viewport: vp });
    for (const lv of livelli) {
      const h = await pg.evaluate((l) => { state.level = l; state.deck = genIntruso(l, []); return intrusoBuildPlayerHtml(state.deck, l, 2); }, lv);
      await page.setContent(h); await page.click('#go');
      const n = await pg.evaluate(() => state.deck.slides.length);
      for (let si = 0; si < n; si++) {
        const info = await page.evaluate(() => {
          const g = document.getElementById('grid').getBoundingClientRect();
          const cs = [...document.querySelectorAll('#grid .c')];
          const bad = cs.filter(d => { const r = d.getBoundingClientRect(); return r.left < g.left - 1 || r.right > g.right + 1 || r.top < g.top - 1 || r.bottom > g.bottom + 1; }).length;
          // il contenuto non deve uscire dalla cella (testo/cornice più larghi della cella)
          const over = cs.filter(d => { const ch = d.firstElementChild; if (!ch) return d.scrollWidth > d.clientWidth + 1; const a = d.getBoundingClientRect(), r = ch.getBoundingClientRect(); return r.width > a.width + 1 || r.height > a.height + 1; }).length;
          return { n: cs.length, bad, over, scroll: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1 };
        });
        const odd = await pg.evaluate((i) => state.deck.slides[i].oddIndex, si);
        check(`liv ${lv} sch ${si + 1} ${vp.width}x${vp.height}: celle dentro lo schermo`, info.bad === 0 && !info.scroll, info);
        check(`liv ${lv} sch ${si + 1} ${vp.width}x${vp.height}: contenuto dentro la cella`, info.over === 0, info);
        await page.click(`#grid .c[data-k="${odd}"]`, { force: true });
        await page.waitForTimeout(430);
      }
      const done = await page.evaluate(() => document.getElementById('msg').classList.contains('on'));
      check(`liv ${lv}: riepilogo a fine serie`, done);
    }
    await page.close();
  }

  // 3) l'app: pulsanti presenti e nome del file
  const ui = await pg.evaluate(() => { state.exercise = 'intruso'; const c = EX_CONTROLS.intruso ? EX_CONTROLS.intruso() : null; return c ? c.textContent : ''; }).catch(() => '');
  check('pulsanti nella barra laterale', /Avvia il lettore a tocco/.test(ui) && /Scarica come pagina/.test(ui), ui.slice(0, 80));
  const hasNoServer = html.includes('fetch(') === false && html.includes('XMLHttpRequest') === false && html.includes('firebase') === false;
  check('nessun invio di dati', hasNoServer);

  await b.close();
  if (errs.length) { console.log('ERRORE\n- ' + errs.join('\n- ')); process.exit(1); }
  console.log('OK: il lettore a tocco dell\'Intruso segnala gli errori, isola la riga dopo N errori e fa il riepilogo');
})();
