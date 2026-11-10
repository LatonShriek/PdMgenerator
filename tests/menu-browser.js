// Controllo del layout "tablet e telefono": il pulsante Menu compare solo sugli schermi stretti, la barra laterale
// si apre e si chiude come un cassetto, la pagina non scorre di lato, e su computer (e tablet in orizzontale) non cambia niente.
//   node tests/menu-browser.js
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
const ROOT = path.join(__dirname, '..');
let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FALLITO:', msg); } };

(async () => {
  const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
  for (const [vw, vh, tag, narrow] of [[1400, 1000, 'computer', false], [1024, 768, 'tablet orizzontale', false], [820, 1180, 'tablet verticale', true], [390, 844, 'telefono', true]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
    await ctx.route('**/*', (r) => { const u = r.request().url(); return u.startsWith('file://') && !/vendor\/firebase/.test(u) ? r.continue() : r.abort(); });
    const page = await ctx.newPage();
    await page.goto('file://' + path.join(ROOT, 'index.html'));
    await page.waitForTimeout(600);
    const info = () => page.evaluate(() => ({
      menuShown: getComputedStyle(document.getElementById('btnMenu')).display !== 'none' && getComputedStyle(document.getElementById('topbar')).display !== 'none',
      sidebarVisible: getComputedStyle(document.getElementById('sidebar')).visibility === 'visible' && document.getElementById('sidebar').getBoundingClientRect().right > 0,
      expanded: document.getElementById('btnMenu').getAttribute('aria-expanded'),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      title: document.getElementById('exTitle').textContent,
    }));
    let s = await info();
    check(s.menuShown === narrow, `${tag}: pulsante Menu ${narrow ? 'deve comparire' : 'non deve comparire'}`);
    check(s.sidebarVisible === !narrow, `${tag}: barra laterale ${narrow ? 'chiusa all\'avvio' : 'sempre visibile'}`);
    check(s.overflow <= 0, `${tag}: la pagina scorre di lato (${s.overflow}px)`);
    if (narrow) {
      await page.click('#btnMenu'); await page.waitForTimeout(400);
      s = await info();
      check(s.sidebarVisible && s.expanded === 'true', `${tag}: il Menu non si apre`);
      await page.click('#menuBackdrop', { position: { x: vw - 5, y: 300 } }); await page.waitForTimeout(400);
      s = await info();
      check(!s.sidebarVisible && s.expanded === 'false', `${tag}: toccando lo sfondo il Menu non si chiude`);
      await page.click('#btnMenu'); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      s = await info();
      check(!s.sidebarVisible, `${tag}: con Esc il Menu non si chiude`);
      await page.click('#btnMenu'); await page.waitForTimeout(400);
      await page.click('#exList li:nth-child(4) button'); await page.waitForTimeout(700);
      s = await info();
      check(!s.sidebarVisible && s.title === 'Serie attentive alternate', `${tag}: scegliendo un esercizio il Menu deve chiudersi e mostrare "${s.title}"`);
      for (const ex of ['griglie', 'intruso', 'inversione', 'serie', 'accesso', 'classificazioni', 'intrusoconc', 'analogie', 'fascicolo']) {
        await page.evaluate(async (ex) => { localStorage.clear(); state.exercise = ex; buildExList(); renderExControls(); await generate(); await new Promise((r) => setTimeout(r, 400)); }, ex);
        s = await info();
        check(s.overflow <= 0, `${tag}, ${ex}: la pagina scorre di lato (${s.overflow}px)`);
      }
    }
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? `FALLITO: ${fails} controlli` : 'OK: layout tablet/telefono corretto in 4 larghezze');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
