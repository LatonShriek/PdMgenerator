// Carica il motore (engine.js) direttamente da index.html, senza modificarlo.
// Il blocco è il primo <script> che contiene "motore di generazione (engine.js)".
const fs = require('fs');
const path = require('path');
const Module = require('module');

function loadEngine(htmlPath = path.join(__dirname, '..', 'index.html')) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1].includes('motore di generazione (engine.js)')) {
      const mod = new Module('engine.js');
      mod.paths = [];
      mod._compile(m[1], 'engine.js');
      return mod.exports;
    }
  }
  throw new Error('Blocco engine.js non trovato in index.html');
}
module.exports = { loadEngine };
