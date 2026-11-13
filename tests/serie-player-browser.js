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
  // i pulsanti a schermo non devono far partire/fermare la serie per errore, e il pulsante pausa deve funzionare
  await pl.click('#bp'); const afterBtn = await txt(); await pl.waitForTimeout(1200); const frozenBtn = (await txt()) === afterBtn;
  const hasFs = await pl.evaluate(() => !!document.getElementById('bf'));
  // stesso stimolo ripetuto: tra i due deve comparire uno schermo vuoto, e deve esserci il blocco spegnimento schermo
  const html2 = await pg.evaluate(() => serieBuildPlayerHtml({ seq: [{char:'A',color:'black'},{char:'A',color:'black'},{char:'A',color:'black'}] }, 3, 0.8));
  const p2 = await b.newPage(); await p2.setContent(html2);
  await p2.waitForTimeout(3100);
  const seen = [];
  for (let k = 0; k < 40; k++) { seen.push(await p2.evaluate(() => document.getElementById('s').textContent)); await p2.waitForTimeout(40); }
  const blanks = seen.filter(x => x === '').length;
  const hasAwake = html2.includes('wakeLock') && html2.includes('<video') === false && html2.includes('createElement("video")');
  await b.close();
  if (blanks < 2 || !hasAwake) { console.log('ERRORE ripetizione/schermo acceso ' + JSON.stringify({blanks, hasAwake})); process.exit(1); }
  const ok = frozenBtn && hasFs && first === 'A' && second === 'B' && frozen === stillFrozen && moved !== stillFrozen;
  console.log(ok ? 'OK: la serie parte da sola, si ferma e riprende' : 'ERRORE ' + JSON.stringify({first, second, frozen, stillFrozen, moved}));
  process.exit(ok ? 0 : 1);
})();
