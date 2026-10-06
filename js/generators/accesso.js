// Generatore — Accesso lessicale online.
// Spostato da index.html al passo 4 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html prima dello script principale e usa le stesse
// variabili globali (state, rnd, pick, ...), come quando stava dentro index.html.
// Provato con tests/golden-browser.js (materiale prima e dopo identico).

// ---------- ACCESSO LESSICALE ----------
function genAccesso(level, excludeWords){
  // 4 fasce lessicali (concreto frequente → concreto specifico → astratto → raro/tecnico), MESCOLATE
  // gradualmente: a livello 1 solo la prima, a livello 32 solo l'ultima, in mezzo ogni parola è
  // pescata dalla fascia più vicina alla posizione del livello (vedi blendedIndex).
  const excl = excludeWords ? new Set(excludeWords) : new Set();
  const count = Math.min(state.accessoWordsOverride || 1, 30);
  const words = [];
  for(let i=0; i<count; i++){
    const pool = LEXICAL_TIERS[blendedIndex(level, LEXICAL_TIERS.length)].words;
    let cand = pool.filter(w=>!excl.has(w) && !words.includes(w));   // mai proposte a questo gruppo, non già in sessione
    if(!cand.length) cand = pool.filter(w=>!words.includes(w));
    if(!cand.length) cand = pool;
    words.push(pick(cand));
  }
  return {
    type:"accesso",
    word: words[0],
    words,
    rule: "Gerarchia di facilitazione se il paziente non recupera la parola: sovraordinata → subordinata/esempi → somiglianze e parentele → usi → caratteristiche tipiche.",
    slides: words.map(w=>({word:w}))
  };
}
