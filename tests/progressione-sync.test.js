// Prova la sincronizzazione dei livelli del gruppo tra dispositivi (js/progression.js, codice vero, non una copia).
// Caso reale: si apre l'app su un secondo computer, si scrive il nome del gruppo, e i livelli salvati online
// devono comparire e NON essere sovrascritti con il livello 1 dello schermo ancora "vergine".
// Si lancia con: node --test tests/

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'js', 'progression.js'), 'utf8');

// Ambiente finto: browser (localStorage, document), Firestore e le variabili globali dell'app.
function makeEnv({ remoteDocs = {}, ready = true, configured = true, signInError = null } = {}) {
  const store = new Map();
  const remote = Object.assign({}, remoteDocs); // nome gruppo -> { data, updatedAt }
  const ctx = {
    console,
    JSON, Date, Math, Object, Array, Set, Map, Number, String, Promise,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, String(v)); },
      removeItem: (k) => { store.delete(k); },
    },
    document: { getElementById: () => null },
    firebaseConfig: configured ? { apiKey: 'x' } : {},
    sharedHistoryReady: ready,
    lastSharedHistoryError: signInError,
    firestoreDb: {
      collection: (name) => {
        assert.strictEqual(name, 'groupProgress');
        return {
          doc: (id) => ({
            get: async () => ({ exists: id in remote, data: () => remote[id] }),
            set: async (obj) => { remote[id] = Object.assign({}, remote[id] || {}, obj); },
          }),
        };
      },
    },
    remoteWriteOk() {}, remoteWriteFailed() {},
    MAX_LEVEL: 32,
    EXERCISES: [{ id: 'griglie', name: 'Griglie' }],
    state: {
      exercise: 'griglie', level: 1,
      levels: { griglie: 1, serie: 1 },
      fascicoloWeek: 1, fascicoloPartWeek: {},
    },
    groupName: '',
  };
  ctx.currentGroupKey = () => ctx.groupName;
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  // Come nell'app vera, generate() finisce sempre con rememberGroupLevel().
  vm.runInContext('function generate(){ rememberGroupLevel(); }', ctx);
  return { ctx, store, remote, run: (code) => vm.runInContext(code, ctx) };
}

function remoteDoc(levels, u = 1000) {
  return { data: JSON.stringify({ u, settings: { thr: 80, consec: 1 }, ex: {}, levels, fascicoloParts: {} }), updatedAt: u };
}
function remoteLevels(env, group) {
  return JSON.parse(env.remote[group].data).levels;
}

test('secondo computer: i livelli salvati online vengono applicati e non sovrascritti (generando prima della sincronizzazione)', async () => {
  const env = makeEnv({ remoteDocs: { IS: remoteDoc({ griglie: 5, serie: 3 }) } });
  env.ctx.groupName = 'IS';
  env.run('recallGroupLevel()');   // si scrive il nome: la copia online non è ancora arrivata
  env.run('generate()');           // si genera subito, con lo schermo ancora a livello 1
  await env.run('progressSyncRemote()');
  assert.strictEqual(env.ctx.state.levels.griglie, 5, 'il livello di Griglie deve diventare 5');
  assert.strictEqual(env.ctx.state.levels.serie, 3);
  assert.strictEqual(env.ctx.state.level, 5, 'anche il livello a schermo (esercizio attivo)');
  assert.deepStrictEqual(remoteLevels(env, 'IS'), { griglie: 5, serie: 3 }, 'online non deve essere sovrascritto');
});

test('secondo computer: sincronizzazione già finita, poi si genera: il livello resta quello online', async () => {
  const env = makeEnv({ remoteDocs: { IS: remoteDoc({ griglie: 5 }) } });
  env.ctx.groupName = 'IS';
  env.run('recallGroupLevel()');
  await env.run('progressSyncRemote()');
  env.run('generate()');
  assert.strictEqual(env.ctx.state.level, 5);
  assert.strictEqual(remoteLevels(env, 'IS').griglie, 5);
});

test('gruppo nuovo (nessun documento online): il livello scelto prima della sincronizzazione non si perde', async () => {
  const env = makeEnv();
  env.ctx.groupName = 'NUOVO';
  env.ctx.state.level = 3; env.ctx.state.levels.griglie = 3;
  env.run('generate()');
  await env.run('progressSyncRemote()');
  assert.strictEqual(env.ctx.state.level, 3, 'lo schermo non deve tornare a 1');
  assert.strictEqual(remoteLevels(env, 'NUOVO').griglie, 3, 'il livello deve arrivare online');
});

test('stesso computer che ha già lavorato: i livelli locali più recenti restano e vanno online', async () => {
  const env = makeEnv({ remoteDocs: { IS: remoteDoc({ griglie: 2 }, 1000) } });
  env.ctx.groupName = 'IS';
  env.ctx.localStorage.setItem('pdm_progress::IS', JSON.stringify({ u: 5000, settings: { thr: 80, consec: 1 }, ex: {}, levels: { griglie: 7 }, fascicoloParts: {} }));
  env.run('recallGroupLevel()');
  await env.run('progressSyncRemote()');
  assert.strictEqual(env.ctx.state.level, 7);
  assert.strictEqual(remoteLevels(env, 'IS').griglie, 7);
});

test('senza Firebase o con accesso fallito: il livello si salva subito in locale, come prima', () => {
  for (const opts of [{ configured: false, ready: false }, { configured: true, ready: false, signInError: 'auth/network-request-failed' }]) {
    const env = makeEnv(opts);
    env.ctx.groupName = 'G';
    env.ctx.state.level = 4; env.ctx.state.levels.griglie = 4;
    env.run('generate()');
    const saved = JSON.parse(env.store.get('pdm_progress::G'));
    assert.strictEqual(saved.levels.griglie, 4);
  }
});

test('in attesa dell\'accesso a Firebase (configurato, non ancora connesso) non si scrivono livelli di default', () => {
  const env = makeEnv({ configured: true, ready: false });
  env.ctx.groupName = 'IS';
  env.run('generate()');
  assert.strictEqual(env.store.has('pdm_progress::IS'), false);
});
