// Registrazione del materiale già usato dal Fascicolo e avvisi di esaurimento.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
// Rigenera UNA sola parte del fascicolo corrente: costruisce un fascicolo "usa e getta"
// completo con un seed nuovo (stessa identica funzione, stesse liste anti-ripetizione
// della settimana attiva) ma al livello (settimana) scelto per QUESTA parte — non
// necessariamente quello della settimana globale — e ne innesta nel fascicolo mostrato
// solo la parte richiesta, lasciando intatte tutte le altre. Evita di duplicare la logica
// di generazione di ogni singolo esercizio: quella resta unica, dentro buildFascicolo.
// Costruisce e applica UNA parte del fascicolo alla settimana indicata, dentro state.deck
// già esistente — stessa logica usata sia dal pulsante "↻ Rigenera" di una singola parte,
// sia (qui sotto, in generate()) per riportare automaticamente ogni parte fatta avanzare
// individualmente alla propria settimana dopo una rigenerazione completa del fascicolo.
// Materiale già proposto a questo gruppo nei fascicoli (qualunque settimana): parole degli anagrammi e
// del crucipuzzle, categorie (pagina "categorie" + categorie larghe delle consegne lettera+categoria),
// consegne dell'accesso lessicale. Il motore le esclude tutte: un gruppo non rivede mai lo stesso
// elemento, né in un'altra pagina né in un altro fascicolo.
const FASC_CAPS = { words: 800, categories: 300, lexical: 800 };
async function fascicoloExclusions(){
  const [anagramWords, crucipuzzleWords, categories, lexicalKeys] = await Promise.all([
    fetchRecentUsed("fascicoloHistory", "usedAnagramWords"),
    fetchRecentUsed("fascicoloHistory", "usedCrucipuzzleWords"),
    fetchRecentUsed("fascicoloHistory", "usedCategories"),
    fetchRecentUsed("fascicoloHistory", "usedLexicalKeys"),
  ]);
  return { anagramWords, crucipuzzleWords, categories, lexicalKeys };
}
// Registra nella cronologia le parti EFFETTIVAMENTE mostrate (parts: elenco di chiavi parte, o null = tutte).
function fascicoloRecordUsed(deck, parts){
  const has = k => !parts || parts.includes(k);
  if(has("anagrams")) appendUsed("fascicoloHistory", "usedAnagramWords", deck.anagrams.map(a=>a.solution), FASC_CAPS.words);
  if(has("crucipuzzle")) appendUsed("fascicoloHistory", "usedCrucipuzzleWords", deck.crucipuzzle.plantedWords || [], FASC_CAPS.words);
  if(has("categories")) appendUsed("fascicoloHistory", "usedCategories", deck.categories, FASC_CAPS.categories);
  if(has("lexicalBlock")){
    appendUsed("fascicoloHistory", "usedLexicalKeys", deck.lexicalBlock.historyKeys, FASC_CAPS.lexical);
  }
}
const FASC_NOTICE_PREFIX = { anagrams:"Anagrammi", crucipuzzle:"Crucipuzzle", categories:"Categorie", lexicalBlock:"Accesso lessicale" };
async function applyFascicoloPartAt(partKey, week){
  const fresh = window.Engine.buildFascicolo(week, Math.floor(Math.random()*1e9), await fascicoloExclusions());
  // avvisi di materiale esaurito: si aggiornano solo per la parte rigenerata
  if(FASC_NOTICE_PREFIX[partKey]){
    const pre = FASC_NOTICE_PREFIX[partKey];
    state.deck.notices = (state.deck.notices||[]).filter(n=>!n.startsWith(pre)).concat((fresh.notices||[]).filter(n=>n.startsWith(pre)));
  }
  const m = /^grid(\d)$/.exec(partKey);
  if (m) {
    state.deck.grids[Number(m[1])] = fresh.grids[Number(m[1])];
  } else if (partKey === "multi") {
    state.deck.multi = fresh.multi;
  } else if (partKey === "crucipuzzle") {
    state.deck.crucipuzzle = fresh.crucipuzzle;
    fascicoloRecordUsed(fresh, ["crucipuzzle"]);
  } else if (partKey === "sequencing") {
    state.deck.sequencing = fresh.sequencing;
  } else if (partKey === "maze") {
    state.deck.maze = fresh.maze;
  } else if (partKey === "lexicalBlock") {
    state.deck.lexicalBlock = fresh.lexicalBlock;
    fascicoloRecordUsed(fresh, ["lexicalBlock"]);
  } else if (partKey === "categories") {
    state.deck.categories = fresh.categories;
    // La consegna ("almeno N parole") dipende dal livello scelto per QUESTA rigenerazione,
    // non da quello globale del fascicolo: va tenuta assieme al contenuto rigenerato,
    // sia nell'anteprima sia nel fascicolo esportato (vedi buildFascicoloDocument).
    state.deck.categoriesMinWords = fresh.params.categoryMinWords;
    fascicoloRecordUsed(fresh, ["categories"]);
  } else if (partKey === "anagrams") {
    state.deck.anagrams = fresh.anagrams;
    fascicoloRecordUsed(fresh, ["anagrams"]);
  } else if (partKey === "calc") {
    state.deck.calc = fresh.calc;
  }
}
async function regenerateFascicoloPart(partKey, btn, weekOverride){
  if(!state.deck || state.exercise!=="fascicolo") return;
  const week = weekOverride || state.fascicoloPartWeek[partKey] || state.fascicoloWeek;
  const original = btn ? btn.textContent : null;
  if(btn){ btn.disabled = true; btn.textContent = "…"; }
  try {
    state.fascicoloPartWeek[partKey] = week;
    await applyFascicoloPartAt(partKey, week);
    render();
    rememberGroupLevel();
  } catch(e){
    console.error(e);
    alert("Non sono riuscito a rigenerare questa parte: " + e.message);
    if(btn){ btn.disabled = false; btn.textContent = original; }
  }
}
