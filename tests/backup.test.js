// Test della copia di sicurezza (passo 7): node --test tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { loadBackup } = require('./load-engine');

const B = loadBackup();

// progressMerge reale dell'app, estratta da js/progression.js (non una copia): così si prova l'unione vera.
const html = fs.readFileSync(path.join(__dirname, '..', 'js', 'progression.js'), 'utf8');
const a = html.indexOf('function progressBlank()');
const b = html.indexOf('let _progressSyncing');
assert.ok(a > 0 && b > a, 'progressMerge non trovato in js/progression.js');
const progressMerge = new Function(html.slice(a, b) + '; return progressMerge;')();

// Memoria finta (come localStorage).
function store(obj) {
  const m = Object.assign({}, obj);
  return { keys: () => Object.keys(m), get: (k) => (k in m ? m[k] : null), set: (k, v) => { m[k] = v; }, all: () => m };
}
function applyPlan(st, plan) { plan.writes.forEach((w) => st.set(w.key, w.value)); }

const HIST = 'pdm_hist::IS::accessoHistory::usedWords';
const PROG = 'pdm_progress::IS';
const progOf = (log) => JSON.stringify({ u: 5, settings: { thr: 80, consec: 1 }, ex: { griglie: { log, del: [] } }, levels: { griglie: 3 }, fascicoloParts: {} });

test('classify: riconosce solo le chiavi dell\'app', () => {
  assert.deepStrictEqual(B.classify(HIST), { type: 'hist', group: 'IS', collection: 'accessoHistory', field: 'usedWords' });
  assert.deepStrictEqual(B.classify('pdm_hist::Gruppo::con::due::catHistory::usedLabels').group, 'Gruppo::con::due');
  assert.strictEqual(B.classify(PROG).type, 'progress');
  assert.strictEqual(B.classify('pdm_generatore_storico').type, 'storico');
  assert.strictEqual(B.classify('pdm_group_name').type, 'groupName');
  assert.strictEqual(B.classify('pdm_group_number').type, 'groupNumber');
  ['pdm_last_backup', 'firebase:authUser:x', '__proto__', 'constructor', 'pdm_hist::solo', 'pdm_hist::g::col', 'pdm_hist::g::co l::f', 'pdm_progress::', '', null, 42].forEach((k) => {
    assert.strictEqual(B.classify(k), null, String(k));
  });
});

test('buildBackup: prende solo le chiavi note e salta nome/numero vuoti', () => {
  const st = store({
    [HIST]: '["Tazza","Tenda"]', [PROG]: progOf([]), pdm_group_name: 'IS', pdm_group_number: '  ',
    pdm_last_backup: 'x', altro: 'y', 'firebase:authUser': 'z'
  });
  const bk = B.buildBackup(st.keys(), st.get, '2026-10-06T20:00:00.000Z');
  assert.strictEqual(bk.format, 'pdm-cdcd-backup');
  assert.strictEqual(bk.version, 1);
  assert.deepStrictEqual(Object.keys(bk.entries), [HIST, 'pdm_group_name', PROG].sort());
});

test('andata e ritorno: esporta, svuota, ripristina = stessi dati', () => {
  const st = store({
    [HIST]: '["Tazza","Tenda","Forchetta"]',
    [PROG]: progOf([{ t: 1, level: 3, pct: 90 }]),
    pdm_generatore_storico: JSON.stringify([{ when: 20, exId: 'accesso', exName: 'Accesso', level: 2, summary: 'a' }]),
    pdm_group_name: 'IS', pdm_group_number: '3'
  });
  const text = JSON.stringify(B.buildBackup(st.keys(), st.get, '2026-10-06T20:00:00.000Z'));
  const v = B.parseText(text);
  assert.ok(v.ok, v.error);
  assert.deepStrictEqual(v.groups, ['IS']);
  const empty = store({});
  const plan = B.planImport(v, empty.get, { mergeProgress: progressMerge });
  applyPlan(empty, plan);
  // Confronto del contenuto, ignorando solo la formattazione del JSON (nome e numero sono testo semplice).
  const canon = (s) => { try { return JSON.stringify(JSON.parse(s)); } catch (e) { return s; } };
  assert.deepStrictEqual(Object.keys(empty.all()).sort(), Object.keys(st.all()).sort());
  Object.keys(st.all()).forEach((k) => assert.strictEqual(canon(empty.get(k)), canon(st.get(k)), k));
  assert.strictEqual(empty.get('pdm_group_name'), 'IS');
});

test('ripristino non cancella: la memoria già proposta si unisce, senza doppioni', () => {
  const local = store({ [HIST]: '["Tenda","Scopa"]' });
  const v = B.validate({ format: 'pdm-cdcd-backup', version: 1, entries: { [HIST]: '["Tazza","Tenda"]' } });
  const plan = B.planImport(v, local.get, { mergeProgress: progressMerge });
  applyPlan(local, plan);
  assert.deepStrictEqual(JSON.parse(local.get(HIST)), ['Tazza', 'Tenda', 'Scopa']);
});

test('ripristino ripetuto due volte non cambia più niente (idempotente)', () => {
  const bk = B.validate({
    format: 'pdm-cdcd-backup', version: 1,
    entries: {
      [HIST]: '["Tazza"]', [PROG]: progOf([{ t: 1, level: 3, pct: 90 }, { t: 2, level: 3, pct: 85 }]),
      pdm_generatore_storico: JSON.stringify([{ when: 9, exId: 'x' }])
    }
  });
  const st = store({});
  applyPlan(st, B.planImport(bk, st.get, { mergeProgress: progressMerge }));
  const before = JSON.stringify(st.all());
  const again = B.planImport(bk, st.get, { mergeProgress: progressMerge });
  assert.strictEqual(again.writes.length, 0);
  assert.strictEqual(again.unchanged, 3);
  assert.strictEqual(JSON.stringify(st.all()), before);
});

test('progressione: le sedute registrate si uniscono (progressMerge reale), nessuna va persa', () => {
  const local = store({ [PROG]: progOf([{ t: 1, level: 3, pct: 90 }]) });
  const v = B.validate({ format: 'pdm-cdcd-backup', version: 1, entries: { [PROG]: progOf([{ t: 2, level: 3, pct: 70 }]) } });
  applyPlan(local, B.planImport(v, local.get, { mergeProgress: progressMerge }));
  const merged = JSON.parse(local.get(PROG));
  assert.deepStrictEqual(merged.ex.griglie.log.map((r) => r.t), [1, 2]);
});

test('storico generazioni: unione senza doppioni, dal più recente, massimo 200', () => {
  const mk = (n) => ({ when: n, exId: 'e', exName: 'E', level: 1, summary: 's' + n });
  const local = store({ pdm_generatore_storico: JSON.stringify([mk(5), mk(3)]) });
  const v = B.validate({ format: 'pdm-cdcd-backup', version: 1, entries: { pdm_generatore_storico: JSON.stringify([mk(3), mk(4)]) } });
  applyPlan(local, B.planImport(v, local.get, {}));
  assert.deepStrictEqual(JSON.parse(local.get('pdm_generatore_storico')).map((e) => e.when), [5, 4, 3]);
  const big = Array.from({ length: 300 }, (_, i) => mk(i + 100));
  const v2 = B.validate({ format: 'pdm-cdcd-backup', version: 1, entries: { pdm_generatore_storico: JSON.stringify(big) } });
  const st = store({});
  applyPlan(st, B.planImport(v2, st.get, {}));
  assert.strictEqual(JSON.parse(st.get('pdm_generatore_storico')).length, 200);
});

test('nome e numero gruppo: non sovrascrivono quelli già scritti, riempiono se vuoti', () => {
  const v = B.validate({ format: 'pdm-cdcd-backup', version: 1, entries: { pdm_group_name: 'IS', pdm_group_number: '7' } });
  const st = store({ pdm_group_name: 'PB' });
  applyPlan(st, B.planImport(v, st.get, {}));
  assert.strictEqual(st.get('pdm_group_name'), 'PB');
  assert.strictEqual(st.get('pdm_group_number'), '7');
});

test('file non valido o ostile: rifiutato o ignorato, mai eseguito', () => {
  assert.strictEqual(B.parseText('non è json').ok, false);
  assert.strictEqual(B.parseText('[1,2,3]').ok, false);
  assert.strictEqual(B.parseText(JSON.stringify({ format: 'altro', version: 1, entries: {} })).ok, false);
  assert.strictEqual(B.parseText(JSON.stringify({ format: 'pdm-cdcd-backup', version: 99, entries: {} })).ok, false);
  assert.strictEqual(B.parseText(JSON.stringify({ format: 'pdm-cdcd-backup', version: 1, entries: [] })).ok, false);
  const many = {}; for (let i = 0; i < 5001; i++) many['pdm_progress::g' + i] = '{}';
  assert.strictEqual(B.validate({ format: 'pdm-cdcd-backup', version: 1, entries: many }).ok, false);

  const hostile = '{"format":"pdm-cdcd-backup","version":1,"entries":{"__proto__":"{\\"x\\":1}","constructor":"x","pdm_hist::g::catHistory::usedLabels":"[{\\"a\\":1}]","pdm_hist::g2::catHistory::usedLabels":"non json","pdm_progress::g3":"{\\"ex\\":5}","localStorage":"x","pdm_group_name":' + JSON.stringify('x'.repeat(300)) + '}}';
  const v = B.parseText(hostile);
  assert.ok(v.ok);
  assert.strictEqual(v.entries.length, 0);
  assert.strictEqual(v.skipped.length, 7);
  assert.strictEqual(({}).x, undefined);
});

test('BOM all\'inizio del file e nome file con la data', () => {
  assert.ok(B.parseText('﻿' + JSON.stringify({ format: 'pdm-cdcd-backup', version: 1, entries: {} })).ok);
  assert.strictEqual(B.fileName(new Date(2026, 9, 6)), 'PdM-copia-di-sicurezza-2026-10-06.json');
});
