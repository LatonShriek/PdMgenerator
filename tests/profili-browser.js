// Prova nel browser: le impostazioni (es. numero di quesiti) valgono solo per il gruppo in cui sono state fatte.
const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
  const pg = await b.newPage();
  await pg.goto('file://' + path.join(__dirname, '..', 'index.html'));
  const setGroup = async n => { await pg.fill('#groupNameInput', n); await pg.dispatchEvent('#groupNameInput', 'change'); await pg.waitForTimeout(300); };
  await setGroup('Gruppo A');
  await pg.evaluate(() => { state.analogieItemsOverride = 12; state.serieAutoPlay = true; generate(); });
  await setGroup('Gruppo B');
  const bv = await pg.evaluate(() => [state.analogieItemsOverride, state.serieAutoPlay]);
  await pg.evaluate(() => { state.analogieItemsOverride = 6; generate(); });
  await setGroup('Gruppo A');
  const av = await pg.evaluate(() => [state.analogieItemsOverride, state.serieAutoPlay]);
  await setGroup('Gruppo B');
  const bv2 = await pg.evaluate(() => state.analogieItemsOverride);
  await b.close();
  const ok = bv[0] === null && bv[1] === false && av[0] === 12 && av[1] === true && bv2 === 6;
  console.log(ok ? 'OK: impostazioni separate per gruppo' : 'ERRORE ' + JSON.stringify({bv, av, bv2}));
  process.exit(ok ? 0 : 1);
})();
