// Controllo "prima e dopo" per il refactoring (passo 4): registra cosa produce OGGI ogni esercizio
// e dopo ogni spostamento di codice verifica che sia identico.
//
// Come funziona: apre index.html in un browser vero (Chromium, senza rete), fissa il generatore
// casuale con un seme, genera ogni esercizio a più livelli, e salva le "impronte" (hash) del
// materiale generato (deck) e di ciò che l'app disegna a schermo (HTML dello stage e riquadro regole).
//
//   node tests/golden-browser.js            confronta con tests/golden-browser.json
//   node tests/golden-browser.js --update   riscrive le impronte (solo se il cambiamento è voluto)
//
// Richiede Playwright con Chromium (non incluso nel repository, niente da installare per usare l'app):
// lo lancia Claude durante i refactoring. Variabili utili: CHROMIUM_PATH, NODE_PATH.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let pw;
try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }

const ROOT = path.join(__dirname, '..');
const SNAP = path.join(__dirname, 'golden-browser.json');
const UPDATE = process.argv.includes('--update');
const sha = (s) => crypto.createHash('sha1').update(String(s)).digest('hex').slice(0, 16);

const LEVELS = [1, 2, 3, 5, 8, 12, 16, 20, 24, 28, 32];
const SEEDS = [11, 22];
const EX = ['griglie', 'intruso', 'inversione', 'serie', 'accesso', 'categorizzazione'];

// Casi: [nome, esercizio, livello/settimana, seme, impostazioni da applicare a state]
function buildCases() {
  const cases = [];
  EX.forEach((ex) => LEVELS.forEach((l) => SEEDS.forEach((s) => cases.push([`${ex}|L${l}|s${s}`, ex, l, s, {}]))));
  for (let w = 1; w <= 12; w++) cases.push([`fascicolo|W${w}|s11`, 'fascicolo', w, 11, { fascicoloWeek: w }]);
  // Opzioni dei controlli di ogni esercizio
  ['digits', 'letters', 'mixed', 'shapes', 'arrows', 'cyrillic', 'cjk', 'geez'].forEach((m) =>
    cases.push([`griglie|mat-${m}|L10`, 'griglie', 10, 5, { materialOverride: { griglie: m, intruso: 'auto', inversione: 'auto' } }]));
  ['digit', 'letter', 'suits', 'music', 'punct', 'zodiac', 'cyrillic', 'geez', 'dice', 'cjk', 'lower', 'mixedcase', 'circles', 'quadrants', 'greek', 'box', 'sets', 'braille', 'katakana', 'hiragana', 'hebrew', 'devanagari'].forEach((m) =>
    cases.push([`intruso|mat-${m}|L15`, 'intruso', 15, 5, { materialOverride: { griglie: 'auto', intruso: m, inversione: 'auto' } }]));
  ['digits', 'letters', 'mixed'].forEach((m) =>
    cases.push([`inversione|mat-${m}|L12`, 'inversione', 12, 5, { materialOverride: { griglie: 'auto', intruso: 'auto', inversione: m } }]));
  cases.push(['inversione|alnum|L20', 'inversione', 20, 5, { inversioneForceAlnum: true }]);
  cases.push(['inversione|items6|L8', 'inversione', 8, 5, { inversioneItemsOverride: 6 }]);
  cases.push(['intruso|screens3|L10', 'intruso', 10, 5, { intrusoScreensOverride: 3 }]);
  cases.push(['serie|items20|L10', 'serie', 10, 5, { serieItemsOverride: 20, serieShowNextCriterion: true }]);
  cases.push(['accesso|words5|L12', 'accesso', 12, 5, { accessoWordsOverride: 5 }]);
  cases.push(['categorizzazione|trials4|L12', 'categorizzazione', 12, 5, { categorizzazioneTrialsOverride: 4 }]);
  return cases;
}

async function run() {
  const exe = process.env.CHROMIUM_PATH || undefined;
  const browser = await pw.chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  await ctx.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
  await ctx.addInitScript(() => {
    window.__seed = function (s) {
      let a = s >>> 0;
      Math.random = function () {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(500);

  const out = {};
  const cases = buildCases();
  let done = 0;
  for (const [name, ex, level, seed, opts] of cases) {
    const t0 = Date.now();
    const rec = await page.evaluate(async ({ ex, level, seed, opts }) => {
      localStorage.clear();
      window.__seed(seed);
      Object.assign(state, {
        materialOverride: { griglie: 'auto', intruso: 'auto', inversione: 'auto' },
        inversioneItemsOverride: null, inversioneForceAlnum: false, intrusoScreensOverride: null,
        serieItemsOverride: null, serieShowNextCriterion: false, categorizzazioneTrialsOverride: null,
        accessoWordsOverride: null, fascicoloWeek: 1, fascicoloPartWeek: {}, reveal: false, slideIndex: 0
      }, opts);
      state.exercise = ex;
      if (ex !== 'fascicolo') { state.level = level; state.levels[ex] = level; }
      state.deck = null;
      await generate();
      await new Promise((r) => setTimeout(r, 30));
      // JSON che regge anche le strutture con collegamenti circolari (es. celle collegate al vicino):
      // un oggetto già visto diventa "[ref:N]", dove N è l'ordine di prima visita (sempre uguale).
      const safe = (o) => { const seen = new Map(); let n = 0; return JSON.stringify(o, function (k, v) {
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[ref:' + seen.get(v) + ']';
          seen.set(v, n++);
        }
        return v; }); };
      return {
        deck: safe(state.deck),
        stage: document.getElementById('stage').innerHTML,
        rule: document.getElementById('ruleBox').innerHTML + '|' + document.getElementById('levelNote').textContent
      };
    }, { ex, level, seed, opts });
    if (Date.now() - t0 > 3000) console.error(`lento (${Date.now() - t0} ms): ${name}`);
    if (++done % 25 === 0) console.error(`... ${done}/${cases.length}`);
    // Categorizzazione: il deck viene completato in ritardo dal recupero delle immagini (nel test la rete è
    // spenta e i tempi variano), quindi non è stabile; ciò che l'app disegna (stage) lo è e basta a controllare.
    const deckHash = ex === 'categorizzazione' ? 'asincrono' : sha(rec.deck);
    out[name] = { deck: deckHash, stage: sha(rec.stage), rule: sha(rec.rule), n: ex === 'categorizzazione' ? 0 : rec.deck.length, h: rec.stage.length };
  }
  await browser.close();

  if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
  if (UPDATE) {
    fs.writeFileSync(SNAP, JSON.stringify(out, null, 1) + '\n');
    console.log(`Impronte scritte: ${Object.keys(out).length} casi in tests/golden-browser.json`);
    return;
  }
  const ref = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  let diff = 0;
  for (const k of new Set([...Object.keys(ref), ...Object.keys(out)])) {
    if (JSON.stringify(ref[k]) !== JSON.stringify(out[k])) {
      diff++;
      if (diff <= 25) console.log('DIVERSO:', k, 'atteso', JSON.stringify(ref[k]), 'ottenuto', JSON.stringify(out[k]));
    }
  }
  console.log(diff ? `FALLITO: ${diff} casi diversi su ${Object.keys(out).length}` : `OK: ${Object.keys(out).length} casi identici`);
  if (diff) process.exitCode = 1;
}
run().catch((e) => { console.error(e); process.exit(1); });
