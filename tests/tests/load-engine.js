// Carica il motore (engine.js) direttamente da index.html, senza modificarlo.
// Il blocco è il primo <script> che contiene "motore di generazione (engine.js)".
const fs = require('fs');
const path = require('path');
const Module = require('module');

// Carica da index.html il primo <script> che contiene il testo `marker`, come modulo Node.
function loadBlock(marker, name, htmlPath = path.join(__dirname, '..', 'index.html')) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1].includes(marker)) {
      const mod = new Module(name);
      mod.paths = [];
      mod._compile(m[1], name);
      return mod.exports;
    }
  }
  throw new Error('Blocco ' + name + ' non trovato in index.html');
}

function loadEngine(htmlPath) {
  return loadBlock('motore di generazione (engine.js)', 'engine.js', htmlPath);
}

// Copia di sicurezza (passo 7): logica pura Esporta / Importa.
function loadBackup(htmlPath) {
  return loadBlock('copia di sicurezza (backup.js)', 'backup.js', htmlPath);
}
module.exports = { loadEngine, loadBackup, loadBlock };
