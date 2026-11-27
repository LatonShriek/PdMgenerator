// Prova nel browser: il lettore a tocco delle Griglie.
//   - nessun riscontro prima di «Conferma»; un secondo tocco toglie la cella
//   - primo errore: sbagliate segnalate e tolte (non si ritoccano), «Ne manca qualcuna» solo se ne mancano
//   - secondo errore: soluzione (trovate / dimenticate / sbagliate), poi «Avanti»
//   - doppio conteggio in due passaggi; consegne non adatte al tocco sostituite, numero di consegne invariato
//   - riepilogo con omissioni e falsi positivi per tentativo
//   - dall'app, con tocchi veri su tablet: scarica il file, lo apre senza rete e completa la serie a tutti i livelli provati
//   CHROMIUM_PATH=/usr/bin/google-chrome node tests/griglie-player-browser.js
const path = require('path'); const fs = require('fs'); const os = require('os');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const errs = [];
const check = (name, cond, extra) => { if (!cond) errs.push(name + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); };
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const pg = await b.newPage();
  const appErr = []; pg.on('pageerror', e => appErr.push(e.message));
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));

  // 1) comportamento su una griglia costruita a mano
  const html = await pg.evaluate(() => {
    const cells = Array.from({ length: 35 }, (_, i) => ({ row: Math.floor(i / 7), col: i % 7, sym: i < 5 ? '●' : '■', fill: null, border: 'nero', symColor: 'rosso' }));
    const mk = (text, f) => ({ text, matches: f, score: 1 });
    const dbl = { vk: 'double', text: 'Conta separatamente…', matches: c => c.col === 0, score: 3 };
    Object.defineProperty(dbl, 'groups', { value: [{ label: 'A', f: c => c.col === 0 && c.row < 2 }, { label: 'B', f: c => c.col === 0 && c.row > 2 }] });
    return griglieBuildPlayerHtml({ type: 'griglie', slides: [{ rows: 5, cols: 7, cells, rules: [mk('Conta i cerchi.', c => c.sym === '●'), mk('Conta la prima riga.', c => c.row === 0), dbl] }] }, 1);
  });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
  const pErr = []; p.on('pageerror', e => pErr.push(e.message));
  await p.setContent(html); await p.click('#go');
  const cls = () => p.evaluate(() => [...document.querySelectorAll('#grid .s')].map(d => d.className));
  const count = async c => (await cls()).filter(x => x.split(' ').includes(c)).length;
  const tap = async (...ks) => { for (const k of ks) await p.click(`#grid .s[data-k="${k}"]`, { force: true }); };
  const ok = async () => { await p.click('#ok', { force: true }); await p.waitForTimeout(500); };
  const txt = id => p.evaluate(i => document.getElementById(i).textContent, id);
  check('testo con «Tocca»', (await txt('task')) === 'Tocca i cerchi.', await txt('task'));
  check('Conferma spento senza selezione', await p.isDisabled('#ok'));
  await tap(0, 1, 2, 10); await tap(2);
  check('secondo tocco toglie', (await count('sel')) === 3);
  check('nessun riscontro prima di Conferma', (await txt('fb')) === '' && (await count('err')) === 0 && (await count('found')) === 0);
  await ok();   // 2 giuste, 1 sbagliata, 3 mancanti
  check('sbagliata segnalata', (await count('err')) === 1);
  check('le giuste restano selezionate', (await count('sel')) === 2);
  check('Ne manca qualcuna', /Ne manca qualcuna/.test(await txt('fb')));
  await tap(10);
  check('la segnalata non si ritocca', (await count('sel')) === 2 && (await count('err')) === 1);
  await tap(2, 20); await ok();   // secondo errore: trovate 0,1,2; dimenticate 3,4; sbagliate 20 e la 10 del primo tentativo
  check('soluzione', (await count('found')) === 3 && (await count('missed')) === 2 && (await count('wrong')) === 2, await cls());
  check('Avanti', (await txt('ok')) === 'Avanti');
  await tap(3);
  check('soluzione non modificabile', (await count('missed')) === 2);
  await ok();
  // consegna 2: solo omissioni al primo tentativo, poi giusta
  await tap(0, 1); await ok();
  check('solo omissioni: nessuna ✕', (await count('err')) === 0 && !/✕/.test(await txt('fb')) && /Ne manca/.test(await txt('fb')));
  await tap(2, 3, 4, 5, 6); await ok();
  check('giusta al secondo', (await txt('fb')) === 'Giusto!');
  await ok();
  // consegna 3: due passaggi
  check('passaggio 1', /Passaggio 1 di 2: tocca A/.test(await txt('task')));
  await tap(0, 7); await ok(); await ok();
  check('passaggio 2, stessa consegna', /Passaggio 2 di 2: tocca B/.test(await txt('task')) && /Consegna 3 di 3/.test(await txt('prog')));
  await tap(21, 28); await ok(); await ok();
  const fin = (await p.evaluate(() => document.getElementById('msg').innerText)).replace(/\s+/g, ' ');
  for (const [n, re] of [['primo', /primo tentativo 1 \/ 3 \(33%\)/], ['secondo', /secondo tentativo 1 /], ['non risolte', /Non risolte 1 /],
    ['om1', /1° tentativo: omissioni 8 /], ['fp1', /1° tentativo: falsi positivi 1 /], ['om2', /2° tentativo: omissioni 2 /], ['fp2', /2° tentativo: falsi positivi 1 /]]) check('riepilogo ' + n, re.test(fin), fin);
  await p.click('#go2');
  check('Ricomincia', /Consegna 1 di 3/.test(await txt('prog')) && (await count('sel')) === 0);
  check('nessun errore nella pagina', !pErr.length, pErr);

  // 2) generatore vero, tutti i livelli: sostituzioni, insiemi non vuoti, doppio conteggio, materiale invariato
  const gen = await pg.evaluate(() => {
    const bad = []; let sost = 0, doppi = 0;
    for (let lv = 1; lv <= 32; lv++) for (let rip = 0; rip < 3; rip++) {
      state.level = lv; const deck = genGriglie(lv, []); const s = deck.slides[0];
      const snap = () => JSON.stringify([s.cells.map(c => [c.sym, c.fill, c.border, c.symColor, c.size, c.bStyle]), s.rules.map(r => [r.text, r.count, r.answer])]); const before = snap();
      const rules = griglieTouchRules(s, lv); const data = griglieTouchData(deck, lv)[0];
      if (snap() !== before) bad.push([lv, 'materiale modificato']);
      if (rules.length !== s.rules.length) bad.push([lv, 'numero consegne', rules.length, s.rules.length]);
      if (rules.some(r => GRID_TOUCH_EXCLUDED.includes(r.vk))) bad.push([lv, 'consegna esclusa presente']);
      if (new Set(rules.map(r => r.text)).size !== rules.length) bad.push([lv, 'doppione']);
      if (griglieTouchRules(s, lv) !== rules) bad.push([lv, 'scelta non stabile']);
      sost += s.rules.filter(r => GRID_TOUCH_EXCLUDED.includes(r.vk)).length;
      data.tasks.forEach((t, i) => {
        const r = rules[i]; if (r.vk === 'double') doppi++;
        t.steps.forEach(st => { if (st.set.length < 4 || st.set.length > 14 || /^Conta/.test(st.text)) bad.push([lv, st.text, st.set.length]); });
        const exp = s.cells.map((c, k) => r.matches(c) ? k : -1).filter(k => k >= 0);
        const got = [...new Set(t.steps.flatMap(x => x.set))].sort((a, z) => a - z);
        if (JSON.stringify(got) !== JSON.stringify(exp)) bad.push([lv, 'celle diverse dalla regola', r.text]);
      });
    }
    return { bad: bad.slice(0, 10), n: bad.length, sost, doppi };
  });
  check('96 griglie vere coerenti', gen.n === 0, gen);
  console.log(`  96 griglie: ${gen.sost} consegne sostituite, ${gen.doppi} doppi conteggi in due passaggi`);
  await pg.close();

  // 3) dall'app, tocchi veri su tablet orizzontale e verticale
  for (const vp of [{ width: 1180, height: 820 }, { width: 820, height: 1180 }]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: true, acceptDownloads: true });
    const app = await ctx.newPage(); const aErr = []; app.on('pageerror', e => aErr.push(e.message));
    await app.goto('file://' + path.join(__dirname, '..', 'index.html'));
    for (const lv of [1, 14, 24, 32]) {
      const [dl] = await Promise.all([app.waitForEvent('download'), app.evaluate(l => {
        state.exercise = 'griglie'; state.level = l; state.deck = genGriglie(l, []);
        const c = EX_CONTROLS.griglie(); [...c.querySelectorAll('button')].find(x => x.textContent === 'Scarica come pagina').click();
      }, lv)]);
      check('nome file', / a tocco\.html$/.test(dl.suggestedFilename()), dl.suggestedFilename());
      const f = path.join(os.tmpdir(), `griglie-tocco-${lv}.html`); await dl.saveAs(f);
      check('nessun invio di dati', !/fetch\(|XMLHttpRequest|firebase|https?:\/\/(?!www\.w3\.org)/.test(fs.readFileSync(f, 'utf8')));
      const c2 = await b.newContext({ viewport: vp, hasTouch: true, offline: true });
      const pl = await c2.newPage(); const e2 = []; pl.on('pageerror', e => e2.push(e.message));
      await pl.goto('file://' + f);
      const touch = async sel => { const bx = await pl.locator(sel).boundingBox(); await pl.touchscreen.tap(bx.x + bx.width / 2, bx.y + bx.height / 2); };
      await touch('#go'); let guard = 0;
      while (guard++ < 60 && !(await pl.evaluate(() => document.getElementById('msg').classList.contains('on')))) {
        const info = await pl.evaluate(() => {
          const a = document.getElementById('area').getBoundingClientRect(), g = document.getElementById('grid').getBoundingClientRect(), btn = document.getElementById('ok').getBoundingClientRect();
          return { set: step().set, fits: g.left >= a.left - 1 && g.right <= a.right + 1 && g.top >= a.top - 1 && g.bottom <= a.bottom + 1, btn: btn.bottom <= innerHeight, side: document.querySelector('#grid .s').getBoundingClientRect().width };
        });
        check(`liv ${lv} ${vp.width}: griglia e pulsante nello schermo`, info.fits && info.btn, info);
        check(`liv ${lv} ${vp.width}: celle toccabili (>=44px)`, info.side >= 44, info.side);
        for (const k of info.set) await touch(`#grid .s[data-k="${k}"]`);
        await touch('#ok'); await pl.waitForTimeout(480);
        check(`liv ${lv}: giusta`, (await pl.evaluate(() => document.getElementById('fb').textContent)) === 'Giusto!');
        await touch('#ok'); await pl.waitForTimeout(480);
      }
      const t = await pl.evaluate(() => document.getElementById('msg').innerText.replace(/\s+/g, ' '));
      check(`liv ${lv} ${vp.width}: tutte al primo tentativo`, /primo tentativo (\d+) \/ \1 \(100%\)/.test(t), t);
      check('nessun errore nel file', !e2.length, e2);
      await c2.close();
    }
    check('nessun errore nell\'app', !aErr.length, aErr);
    await ctx.close();
  }
  check('nessun errore nell\'app', !appErr.length, appErr);
  await b.close();
  if (errs.length) { console.log('ERRORE\n- ' + errs.slice(0, 25).join('\n- ')); process.exit(1); }
  console.log('OK: il lettore a tocco delle Griglie conferma, concede un secondo tentativo, mostra la soluzione e fa il riepilogo');
})();
