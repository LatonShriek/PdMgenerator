// Test della banca «ad alta difficoltà» (data/verbale-alto.js): struttura, punteggio D = somma delle coordinate,
// rampa lineare per livello, tre varianti per livello, coerenza delle risposte, ripetizione dei termini.
const test = require('node:test');
const assert = require('node:assert');
const V = require('../data/verbale-alto.js');

const MODULI = ['classificazioni', 'intrusoconc', 'analogie'];
const RANGE = {
  classificazioni: { A: [1, 3], C: [0, 3], E: [0, 3], L: [0, 3] },
  intrusoconc: { A: [1, 3], V: [0, 3], S: [0, 3], M: [0, 3], L: [0, 3] },
  analogie: { R: [1, 3], Dm: [0, 3], Lu: [0, 3], L: [0, 3], Q: [0, 1] },
};
const norm = s => s.toLowerCase();

test('144 voci per modulo: livelli 17-32, nove varianti A-I ciascuno, id unici', () => {
  for (const m of MODULI) {
    const bank = V[m];
    assert.strictEqual(bank.length, 144, m);
    assert.strictEqual(new Set(bank.map(x => x.id)).size, 144, 'id doppi in ' + m);
    for (let liv = 17; liv <= 32; liv++) {
      const vs = bank.filter(x => x.liv === liv).map(x => x.v).sort().join('');
      assert.strictEqual(vs, 'ABCDEFGHI', m + ' livello ' + liv);
    }
    bank.forEach(x => assert.strictEqual(x.stato, 'proposta'));
  }
});

test('coordinate nei limiti e D = somma delle coordinate (+2 se i termini dati sono 2)', () => {
  for (const m of MODULI) {
    for (const x of V[m]) {
      let somma = 0;
      for (const [k, [lo, hi]] of Object.entries(RANGE[m])) {
        assert.ok(x.coord[k] >= lo && x.coord[k] <= hi, x.id + ' coordinata ' + k);
        somma += x.coord[k];
      }
      assert.deepStrictEqual(Object.keys(x.coord).sort(), Object.keys(RANGE[m]).sort(), x.id);
      if (m === 'classificazioni') somma += x.due ? 2 : 0;
      assert.strictEqual(x.D, somma, x.id);
    }
  }
});

test('le nove varianti di un livello hanno lo stesso D, uguale alla rampa-obiettivo', () => {
  for (const m of MODULI) {
    for (let liv = 17; liv <= 32; liv++) {
      V[m].filter(x => x.liv === liv).forEach(x => assert.strictEqual(x.D, V.TARGET_D[m][liv], x.id + ' D=' + x.D));
    }
    // rampa non decrescente
    for (let liv = 18; liv <= 32; liv++) assert.ok(V.TARGET_D[m][liv] >= V.TARGET_D[m][liv - 1], m + ' rampa ' + liv);
  }
});

test('Classificazioni: termini 3 (2 dal livello 29 in alcune varianti), risposta attesa presente, nessun termine nelle risposte', () => {
  for (const x of V.classificazioni) {
    assert.strictEqual(x.termini.length, x.due ? 2 : 3, x.id);
    assert.ok(x.due ? x.liv >= 29 : true, x.id + ' due prima del 29');
    assert.strictEqual(new Set(x.termini.map(norm)).size, x.termini.length, x.id);
    assert.ok(x.accettate.length >= 1 && x.accettate.every(a => a.length > 0), x.id);
    x.termini.forEach(t => assert.ok(!x.accettate.map(norm).includes(norm(t)), x.id + ' termine = risposta'));
  }
});

test('Intruso concettuale: quattro parole distinte, l\'intruso è fra le parole e oddIndex è corretto', () => {
  for (const x of V.intrusoconc) {
    assert.strictEqual(x.parole.length, 4, x.id);
    assert.strictEqual(new Set(x.parole.map(norm)).size, 4, x.id);
    assert.ok(x.oddIndex >= 0 && norm(x.parole[x.oddIndex]) === norm(x.intruso), x.id);
    assert.ok(x.categoria && x.categoria.length > 0, x.id);
  }
});

test('Analogie: quattro termini, risposta = C (invertita) o D, Q coerente, lure diverso dalla risposta', () => {
  for (const x of V.analogie) {
    const w = [x.a, x.b, x.c, x.d];
    assert.ok(w.every(s => s && s.length > 0), x.id);
    assert.strictEqual(new Set(w.map(norm)).size, 4, x.id + ' termini ripetuti');
    assert.strictEqual(x.risposta, x.invertita ? x.c : x.d, x.id);
    assert.strictEqual(x.coord.Q, x.invertita ? 1 : 0, x.id + ' Q');
    assert.ok(x.quesito.includes('?'), x.id);
    assert.ok(x.accettate[0] === x.risposta, x.id);
    assert.ok(!x.accettate.map(norm).includes(norm(x.lure)), x.id + ' lure fra le accettate');
    // dal livello 17 il quesito invertito è già ammesso; in ogni livello almeno una variante è diretta (il punto ? non sta sempre allo stesso posto)
  }
  for (let liv = 17; liv <= 32; liv++) {
    const inv = V.analogie.filter(x => x.liv === liv && x.invertita).length;
    // al livello 32 D=13 si raggiunge solo con la forma invertita (R3+Dm3+Lu3+L3 = 12), quindi lì tutte lo sono per costruzione
    if (liv < 32) assert.ok(inv <= 8, 'livello ' + liv + ': invertite ' + inv + ' su 9');
  }
});

test('esposizione dei termini: nessun termine compare più di 3 volte nello stesso modulo', () => {
  const conteggio = (bank, f) => {
    const c = new Map();
    bank.forEach(x => f(x).forEach(t => c.set(norm(t), (c.get(norm(t)) || 0) + 1)));
    return c;
  };
  const prove = {
    classificazioni: conteggio(V.classificazioni, x => x.termini),
    intrusoconc: conteggio(V.intrusoconc, x => x.parole),
    analogie: conteggio(V.analogie, x => [x.a, x.b, x.c, x.d]),
  };
  for (const [m, c] of Object.entries(prove)) {
    for (const [t, n] of c) assert.ok(n <= 3, m + ': «' + t + '» compare ' + n + ' volte');
  }
});

test('lessico raro: al massimo 20 voci con L = 3 nell\'intera banca (oggi sono 20)', () => {
  const n = MODULI.reduce((s, m) => s + V[m].filter(x => x.coord.L === 3).length, 0);
  assert.ok(n <= 20, 'voci con L=3: ' + n);
});
