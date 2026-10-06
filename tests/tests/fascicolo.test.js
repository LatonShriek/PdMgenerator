// Passo 1 — test con seme fisso sul motore del Fascicolo (engine.js, incorporato in index.html).
// Esecuzione: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { loadEngine } = require('./load-engine');

const E = loadEngine();
const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);
const SEEDS = [1, 42, 20240607];
const hash = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');

// ---------- 1. Determinismo ----------
test('stesso seme + stessa settimana => materiale identico', () => {
  for (const w of WEEKS) for (const s of SEEDS)
    assert.equal(hash(E.buildFascicolo(w, s, {})), hash(E.buildFascicolo(w, s, {})), `sett. ${w} seme ${s}`);
});

test('semi diversi => materiale diverso', () => {
  for (const w of WEEKS)
    assert.notEqual(hash(E.buildFascicolo(w, 1, {})), hash(E.buildFascicolo(w, 2, {})), `sett. ${w}`);
});

// ---------- 2. Snapshot (rete di sicurezza per il refactoring) ----------
// Al primo avvio crea tests/snapshots.json; ai successivi confronta. Per rigenerare
// volontariamente: UPDATE_SNAPSHOTS=1 node --test tests/
test('snapshot: hash del fascicolo per settimane 1-12 e semi fissi', () => {
  const file = path.join(__dirname, 'snapshots.json');
  const now = {};
  for (const w of WEEKS) for (const s of SEEDS) now[`w${w}-s${s}`] = hash(E.buildFascicolo(w, s, {}));
  if (!fs.existsSync(file) || process.env.UPDATE_SNAPSHOTS) {
    fs.writeFileSync(file, JSON.stringify(now, null, 1) + '\n');
    return;
  }
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  const diff = Object.keys(now).filter((k) => saved[k] !== now[k]);
  assert.deepEqual(diff, [], 'Output cambiato per: ' + diff.join(', '));
});

// ---------- 3. Invarianti strutturali / regole di qualità ----------
for (const w of WEEKS) for (const s of SEEDS) {
  test(`struttura corretta — settimana ${w}, seme ${s}`, () => {
    const d = E.buildFascicolo(w, s, {});
    const p = E.weekParams(w);

    assert.equal(d.grids.length, 3, '3 griglie a sequenza');
    for (const g of d.grids) {
      assert.equal(g.grid.length, 25, 'righe');
      for (const r of g.grid) assert.equal(r.length, 12, 'colonne');
      assert.equal(g.countH, 8, 'sequenze orizzontali');
      assert.equal(g.countV, 8, 'sequenze verticali');
      assert.equal(g.count, 16);
    }

    // multi-target: 12 bersagli distinti
    assert.equal(d.multi.targets.length, p.multiTargetCount);
    assert.equal(new Set(d.multi.targets.map((t) => t.join('|'))).size, p.multiTargetCount, 'bersagli distinti');

    // crucipuzzle: le parole piantate sono davvero nella griglia (foundWords) e il conteggio è coerente.
    // Nota: il motore può piazzarne meno di quelle scelte (piazzamento greedy); è comportamento attuale,
    // qui lo si fotografa (minimo 8) senza modificarlo.
    const cp = d.crucipuzzle;
    assert.equal(cp.minWordsToFind, cp.plantedWords.length);
    assert.ok(cp.plantedWords.length >= 8, 'parole piantate: ' + cp.plantedWords.length);
    assert.equal(cp.shortfall || 0, 0, 'nessun difetto di parole scelte');
    const found = new Set(cp.foundWords.map((f) => f.word));
    for (const wd of cp.plantedWords) assert.ok(found.has(wd), 'parola piantata non trovabile: ' + wd);
    assert.equal(new Set(cp.plantedWords).size, cp.plantedWords.length, 'parole piantate duplicate');
    assert.equal(d.crucipuzzle.grid.length, 16);

    // anagrammi: 10, la soluzione è un anagramma esatto e la parola mescolata ≠ soluzione se possibile
    assert.equal(d.anagrams.length, 10);
    for (const a of d.anagrams) {
      assert.equal(a.solution.length, p.anagramLen);
      assert.equal([...a.solution].sort().join(''), [...a.scrambled].sort().join(''), 'stesse lettere');
    }
    assert.equal(new Set(d.anagrams.map((a) => a.solution)).size, 10, 'anagrammi senza doppioni');

    // calcoli: 10 righe, risultato corretto, mai negativo
    assert.equal(d.calc.length, 10);
    for (const c of d.calc) {
      const val = Function(`"use strict"; return (${c.expression});`)();
      assert.equal(val, c.result, c.expression);
      assert.ok(c.result >= 0, 'risultato non negativo: ' + c.expression);
    }

    // categorie: 6, distinte
    assert.equal(d.categories.length, p.categoryCount);
    assert.equal(new Set(d.categories).size, d.categories.length);

    // labirinto e sequenza
    assert.equal(d.maze.cols, p.mazeCols);
    assert.equal(d.maze.rows, p.mazeRows);
    assert.equal(d.sequencing.order.length, p.sequencing.count);

    // blocco lessicale: 8-10 consegne, chiavi di storico allineate
    const lb = d.lexicalBlock;
    assert.ok(lb.prompts.length >= 8 && lb.prompts.length <= 10, 'numero consegne: ' + lb.prompts.length);
    assert.equal(lb.historyKeys.length, lb.prompts.length);
    assert.equal(new Set(lb.prompts).size, lb.prompts.length, 'consegne senza doppioni');
  });
}

// ---------- 4. Anti-ripetizione ----------
test('esclusioni anagrammi: nessuna parola già usata riappare', () => {
  for (const w of WEEKS) {
    const first = E.buildFascicolo(w, 7, {});
    const used = first.anagrams.map((a) => a.solution);
    const second = E.buildFascicolo(w, 7, { anagramWords: used });
    for (const a of second.anagrams) assert.ok(!used.includes(a.solution), `sett. ${w}: ${a.solution}`);
  }
});

test('esclusioni categorie: nessuna categoria già usata riappare (o c\'è un avviso)', () => {
  for (const w of WEEKS) {
    const first = E.buildFascicolo(w, 7, {});
    const second = E.buildFascicolo(w, 7, { categories: first.categories });
    const repeated = second.categories.filter((c) => first.categories.includes(c));
    if (repeated.length) assert.ok(second.notices.length > 0, `sett. ${w}: ripetute senza avviso`);
  }
});

test('esclusioni lessicali: nessuna chiave già usata riappare (o c\'è un avviso)', () => {
  for (const w of WEEKS) {
    const first = E.buildFascicolo(w, 7, {});
    const second = E.buildFascicolo(w, 7, { lexicalKeys: first.lexicalBlock.historyKeys });
    const repeated = second.lexicalBlock.historyKeys.filter((k) => first.lexicalBlock.historyKeys.includes(k));
    if (repeated.length) assert.ok(second.notices.length > 0, `sett. ${w}: ${repeated.join(',')} senza avviso`);
  }
});

test('esclusioni crucipuzzle: parole già usate non vengono ripiantate', () => {
  for (const w of WEEKS) {
    const first = E.buildFascicolo(w, 7, {});
    const used = first.crucipuzzle.plantedWords;
    const second = E.buildFascicolo(w, 7, { crucipuzzleWords: used });
    const again = second.crucipuzzle.plantedWords.filter((x) => used.includes(x));
    assert.deepEqual(again, [], `sett. ${w}`);
  }
});

test('anagrammi e crucipuzzle della stessa settimana non condividono parole', () => {
  for (const w of WEEKS) for (const s of SEEDS) {
    const d = E.buildFascicolo(w, s, {});
    const an = new Set(d.anagrams.map((a) => a.solution));
    for (const x of d.crucipuzzle.plantedWords) assert.ok(!an.has(x), `sett. ${w}: ${x}`);
  }
});

test('esaurimento: con esclusioni enormi non si ripesca in silenzio (avviso o nessuna ripetizione)', () => {
  const all = Object.values(E.WORD_BANK_SCORED).flat().map((x) => x[0]);
  const d = E.buildFascicolo(6, 3, { anagramWords: all, categories: E.CATEGORY_POOL ? Object.values(E.CATEGORY_POOL).flat() : [] });
  const clash = d.anagrams.filter((a) => all.includes(a.solution));
  if (clash.length) assert.ok(d.notices.length > 0, 'ripetizioni senza avviso');
});

// ---------- 5. Banche dati (struttura; il controllo Zipf/Hunspell richiede il lessico esterno) ----------
test('CATEGORY_LETTER_BANK: coppie [lettera, categoria] ben formate', () => {
  for (const [kind, pairs] of Object.entries(E.CATEGORY_LETTER_BANK)) {
    assert.ok(pairs.length > 0, kind);
    for (const [l, c] of pairs) {
      assert.match(l, /^[A-Z]$/, `${kind} lettera ${l}`);
      assert.ok(E.BROAD_CATEGORIES.includes(c), `${kind}: categoria sconosciuta «${c}»`);
    }
    assert.equal(new Set(pairs.map((p) => p.join('|'))).size, pairs.length, `${kind}: coppie duplicate`);
  }
});

test('INITIAL_LETTERS_BY_LENGTH: lettere maiuscole senza duplicati', () => {
  for (const [len, letters] of Object.entries(E.INITIAL_LETTERS_BY_LENGTH)) {
    assert.match(letters, /^[A-Z]+$/, `lunghezza ${len}`);
    assert.equal(new Set(letters).size, letters.length, `lunghezza ${len}`);
  }
});

test('WORD_BANK_SCORED: parole maiuscole della lunghezza dichiarata, con punteggio numerico', () => {
  for (const [len, list] of Object.entries(E.WORD_BANK_SCORED)) {
    for (const [word, score] of list) {
      assert.match(word, /^[A-ZÀ-Ü]+$/, word);
      assert.equal(word.length, Number(len), `${word} (lunghezza ${len})`);
      assert.equal(typeof score, 'number', word);
    }
    assert.equal(new Set(list.map((x) => x[0])).size, list.length, `lunghezza ${len}: doppioni`);
  }
});

test('CATEGORY_POOL: 12 livelli, nessuna categoria duplicata nello stesso livello', () => {
  assert.equal(Object.keys(E.CATEGORY_POOL).length, 12);
  for (const [tier, list] of Object.entries(E.CATEGORY_POOL)) {
    assert.ok(list.length >= 6, `livello ${tier}`);
    assert.equal(new Set(list).size, list.length, `livello ${tier}`);
  }
});

// ---------- 6. Dati esterni (passo 3) ----------
test('data/categorizzazione.js: 16 livelli, 190 criteri, ogni criterio ben formato', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'data', 'categorizzazione.js'), 'utf8');
  const lib = Function(src + '; return CATEGORIZZAZIONE_LIBRARY;')();
  assert.equal(Object.keys(lib).length, 16);
  assert.equal(Object.values(lib).reduce((s, v) => s + v.length, 0), 190);
  for (const [lvl, list] of Object.entries(lib)) for (const c of list) {
    assert.ok(c.label, `livello ${lvl}: criterio senza etichetta`);
    for (const side of ['a', 'b']) {
      assert.ok(Array.isArray(c[side]) && c[side].length > 0, `${c.label}: lato ${side} vuoto`);
      for (const w of c[side]) assert.ok(w.it, `${c.label}: voce senza testo italiano`);
    }
  }
});

test('index.html carica data/categorizzazione.js e non contiene più la libreria inline', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('<script src="data/categorizzazione.js"></script>'));
  assert.ok(!html.includes('const CATEGORIZZAZIONE_LIBRARY = {'));
});

test('data/openmoji-map.js e data/inv-real-block.js: contenuto valido e caricati da index.html', () => {
  const dir = path.join(__dirname, '..');
  const om = Function(fs.readFileSync(path.join(dir, 'data', 'openmoji-map.js'), 'utf8') + '; return OPENMOJI_ICON_MAP;')();
  assert.ok(Object.keys(om).length >= 500, 'mappa icone troppo piccola');
  for (const [en, icon] of Object.entries(om)) assert.match(icon, /^[a-z0-9-]+$/, `${en} -> ${icon}`);
  const inv = Function(fs.readFileSync(path.join(dir, 'data', 'inv-real-block.js'), 'utf8') + '; return INV_REAL_BLOCK;')();
  assert.ok(inv instanceof Set && inv.size > 3000, 'lessico di controllo troppo piccolo: ' + inv.size);
  for (const w of inv) assert.match(w, /^[A-Z]{3,5}$/, w);
  const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  for (const f of ['openmoji-map', 'inv-real-block']) assert.ok(html.includes(`<script src="data/${f}.js"></script>`), f);
  assert.ok(!html.includes('const OPENMOJI_ICON_MAP = {') && !html.includes('const INV_REAL_BLOCK = new Set'));
});
