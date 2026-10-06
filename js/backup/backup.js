// Copia di sicurezza — logica pura (salva / ripristina), senza pagina e senza localStorage.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

/* =========================================================
   copia di sicurezza (backup.js) — Esporta / Importa tutto (passo 7).
   Logica pura: niente DOM, niente accesso diretto a localStorage (le funzioni ricevono le letture
   e restituiscono cosa scrivere), così si può provare con i test (tests/backup.test.js).
   Cosa entra nella copia: nome e numero gruppo, memoria del materiale già proposto (pdm_hist::),
   progressione e livelli (pdm_progress::), storico generazioni. Nient'altro viene letto o scritto.
   Il file importato è trattato come dato non fidato: solo chiavi note, contenuti controllati,
   nessuna esecuzione. Ripristinare AGGIUNGE e unisce: non cancella mai niente di ciò che c'è già.
   ========================================================= */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PdmBackup = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const FORMAT = "pdm-cdcd-backup";
  const VERSION = 1;
  const MAX_ENTRIES = 5000;
  const MAX_ITEMS = 5000;
  const MAX_TEXT = 20 * 1024 * 1024;
  const STORICO_CAP = 200;
  const KEY_STORICO = "pdm_generatore_storico";
  const KEY_NAME = "pdm_group_name";
  const KEY_NUMBER = "pdm_group_number";
  const P_HIST = "pdm_hist::";
  const P_PROG = "pdm_progress::";
  const WORD = /^[A-Za-z][A-Za-z0-9]*$/;

  function isPlainObject(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
  function safeParse(text) { try { return JSON.parse(text); } catch (e) { return undefined; } }

  // Riconosce le sole chiavi che la copia può contenere; tutto il resto è ignorato.
  function classify(key) {
    if (typeof key !== "string" || key.length === 0 || key.length > 400) return null;
    if (key === KEY_STORICO) return { type: "storico" };
    if (key === KEY_NAME) return { type: "groupName" };
    if (key === KEY_NUMBER) return { type: "groupNumber" };
    if (key.startsWith(P_HIST)) {
      const parts = key.slice(P_HIST.length).split("::");
      if (parts.length < 3) return null;
      const field = parts.pop(), collection = parts.pop(), group = parts.join("::");
      if (!group || !WORD.test(field) || !WORD.test(collection)) return null;
      return { type: "hist", group: group, collection: collection, field: field };
    }
    if (key.startsWith(P_PROG)) {
      const group = key.slice(P_PROG.length);
      return group ? { type: "progress", group: group } : null;
    }
    return null;
  }

  // Controlla il contenuto di una voce e lo restituisce in forma pulita (testo JSON), o null se non valido.
  function normalize(c, value) {
    if (typeof value !== "string" || value.length > MAX_TEXT) return null;
    if (c.type === "groupName" || c.type === "groupNumber") {
      const t = value.trim();
      return t.length <= 200 ? t : null;
    }
    const v = safeParse(value);
    if (v === undefined) return null;
    if (c.type === "hist") {
      const ok = Array.isArray(v) && v.length <= MAX_ITEMS && v.every(function (x) { return typeof x === "string" || typeof x === "number"; });
      return ok ? JSON.stringify(v) : null;
    }
    if (c.type === "progress") return isPlainObject(v) && isPlainObject(v.ex) ? JSON.stringify(v) : null;
    if (c.type === "storico") {
      if (!Array.isArray(v)) return null;
      return JSON.stringify(v.filter(function (e) { return isPlainObject(e) && typeof e.when === "number"; }).slice(0, STORICO_CAP * 2));
    }
    return null;
  }

  // keys: tutte le chiavi del browser; getItem(k): il loro valore. Prende solo quelle note.
  function buildBackup(keys, getItem, nowIso) {
    const entries = {};
    Array.from(keys).filter(function (k) { return classify(k); }).sort().forEach(function (k) {
      const v = getItem(k);
      if (typeof v !== "string") return;
      const c = classify(k);
      if ((c.type === "groupName" || c.type === "groupNumber") && !v.trim()) return;
      entries[k] = v;
    });
    return { format: FORMAT, version: VERSION, exportedAt: nowIso, entries: entries };
  }

  function validate(obj) {
    if (!isPlainObject(obj) || obj.format !== FORMAT) return { ok: false, error: "Questo file non è una copia di sicurezza di PdM CDCD." };
    if (typeof obj.version !== "number" || obj.version < 1) return { ok: false, error: "La copia è danneggiata (versione mancante)." };
    if (obj.version > VERSION) return { ok: false, error: "Questa copia è stata creata da una versione più recente dell'app: aggiorna l'app prima di ripristinarla." };
    if (!isPlainObject(obj.entries)) return { ok: false, error: "La copia è danneggiata (mancano i dati)." };
    const keys = Object.keys(obj.entries);
    if (keys.length > MAX_ENTRIES) return { ok: false, error: "La copia contiene troppe voci: non sembra un file valido." };
    const entries = [], skipped = [], groups = new Set();
    keys.forEach(function (k) {
      const c = classify(k);
      if (!c) { skipped.push({ key: k, reason: "voce non riconosciuta" }); return; }
      const value = normalize(c, obj.entries[k]);
      if (value === null) { skipped.push({ key: k, reason: "contenuto non valido" }); return; }
      if (c.group) groups.add(c.group);
      entries.push({ key: k, c: c, value: value });
    });
    return {
      ok: true,
      exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : null,
      entries: entries,
      skipped: skipped,
      groups: Array.from(groups).sort()
    };
  }

  function parseText(text) {
    if (typeof text !== "string" || text.length > MAX_TEXT) return { ok: false, error: "Il file è troppo grande o non è un file di testo." };
    const obj = safeParse(text.replace(/^﻿/, ""));
    if (obj === undefined) return { ok: false, error: "Il file non si può leggere: non è una copia di sicurezza valida." };
    return validate(obj);
  }

  function parseArray(s) { const v = typeof s === "string" ? safeParse(s) : undefined; return Array.isArray(v) ? v : []; }
  function parseProgress(s) { const v = typeof s === "string" ? safeParse(s) : undefined; return isPlainObject(v) && isPlainObject(v.ex) ? v : null; }

  // validated: risultato di validate(). getLocal(k): valore attuale (stringa o null).
  // opts.mergeProgress(locale, importato): unione di due progressioni (quella dell'app).
  // Restituisce le scritture da fare: mai cancellazioni.
  function planImport(validated, getLocal, opts) {
    const mergeProgress = opts && opts.mergeProgress;
    const writes = [];
    let unchanged = 0;
    validated.entries.forEach(function (e) {
      const local = getLocal(e.key);
      const c = e.c;
      let next = null;
      if (c.type === "groupName" || c.type === "groupNumber") {
        if (e.value && !(typeof local === "string" ? local : "").trim()) next = e.value;
      } else if (c.type === "hist") {
        const loc = parseArray(local);
        const have = new Set(loc);
        const added = JSON.parse(e.value).filter(function (x) { return !have.has(x); });
        if (added.length) next = JSON.stringify(added.concat(loc).slice(-MAX_ITEMS));
      } else if (c.type === "progress") {
        const loc = parseProgress(local);
        if (!loc) next = e.value;
        else if (typeof mergeProgress === "function") {
          const merged = JSON.stringify(mergeProgress(loc, JSON.parse(e.value)));
          const baseline = JSON.stringify(mergeProgress(loc, loc));
          if (merged !== baseline) next = merged;
        }
      } else if (c.type === "storico") {
        const loc = parseArray(local);
        const seen = new Set(loc.map(function (x) { return JSON.stringify(x); }));
        const add = JSON.parse(e.value).filter(function (x) { return !seen.has(JSON.stringify(x)); });
        if (add.length) {
          next = JSON.stringify(loc.concat(add).sort(function (a, b) { return (b.when || 0) - (a.when || 0); }).slice(0, STORICO_CAP));
        }
      }
      if (next === null) unchanged++;
      else writes.push({ key: e.key, value: next, c: c });
    });
    return { writes: writes, unchanged: unchanged };
  }

  function fileName(date) {
    const p = function (n) { return String(n).padStart(2, "0"); };
    return "PdM-copia-di-sicurezza-" + date.getFullYear() + "-" + p(date.getMonth() + 1) + "-" + p(date.getDate()) + ".json";
  }

  return { FORMAT: FORMAT, VERSION: VERSION, classify: classify, buildBackup: buildBackup, validate: validate, parseText: parseText, planImport: planImport, fileName: fileName };
});
