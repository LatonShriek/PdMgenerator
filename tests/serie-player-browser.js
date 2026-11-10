// Prova nel browser: il lettore autonomo della Serie parte da solo, si ferma con un tocco e riprende.
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const pg = await b.newPage();
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const html = await pg.evaluate(() => serieBuildPlayerHtml({ seq: [{char:'A',color:'black'},{char:'B',color:'red'},{char:'C',color:'black'},{char:'D',color:'red'}] }, 3, 0.5));
  const pl = await b.newPage();
  await pl.setContent(html);
  const txt = () => pl.evaluate(() => document.getElementById('s').textContent);
  await pl.waitForTimeout(3300);          // dopo il conto alla rovescia compare il primo stimolo
  const first = await txt();
  await pl.waitForTimeout(600);
  const second = await txt();
  await pl.click('body');                  // pausa
  const frozen = await txt();
  await pl.waitForTimeout(1200);
  const stillFrozen = await txt();
  await pl.click('body');                  // riprende
  await pl.waitForTimeout(700);
  const moved = await txt();
  await b.close();
  const ok = first === 'A' && second === 'B' && frozen === stillFrozen && moved !== stillFrozen;
  console.log(ok ? 'OK: la serie parte da sola, si ferma e riprende' : 'ERRORE ' + JSON.stringify({first, second, frozen, stillFrozen, moved}));
  process.exit(ok ? 0 : 1);
})();
