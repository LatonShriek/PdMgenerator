// Note di livello (testo mostrato in sidebar) e colori.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
// ---------- CATEGORIZZAZIONE ----------
// (genCategorizzazione ridefinita sopra con la logica "due gruppi da 3")

/* =========================================================
   RENDER
   ========================================================= */
const LEVEL_NOTES_BASE = {   // note originali a 16 fasce: base per le note dei 32 livelli (vedi levelNote)
  griglie:[
    "Forme geometriche. Poche richieste semplici, il resto combinazioni di sfondo, bordo e colore.",
    "Forme geometriche, come sopra con altre varianti.",
    "Frecce. Meno richieste singole, più combinazioni.",
    "Frecce, altre varianti.",
    "Cifre. Combinazioni di sfondo/bordo/colore, alternative e posizione.",
    "Cifre, altre varianti.",
    "Lettere. Più combinazioni complesse, anche con negazione.",
    "Lettere, altre varianti.",
    "Alfanumerico misto. Prevalgono le combinazioni complesse.",
    "Alfanumerico misto, altre varianti.",
    "Alfabeto cirillico (script non familiare). Quasi solo combinazioni complesse.",
    "Cirillico, altre varianti.",
    "Ideogrammi cinesi visivamente simili.",
    "Ideogrammi, altre serie di caratteri simili.",
    "Sillabario Ge'ez, differenze diacritiche minime.",
    "Sillabario Ge'ez, altre serie."
  ],
  intruso:[
    "Cifre, lettere maiuscole e minuscole, frecce, forme, semi, note, punteggiatura, zodiaco, dadi, cerchi parziali (1 carattere).",
    "+ lettere a/A mescolate.",
    "+ numeri romani, + quadranti.",
    "Come sopra, ora coppie di caratteri nelle famiglie testuali.",
    "+ cirillico, + alfabeto greco.",
    "+ domino, + tratti da tabella.",
    "+ simboli insiemistici; ora terne di caratteri.",
    "+ armeno.",
    "Come sopra, stessa composizione.",
    "+ thai, + mahjong, + Braille.",
    "+ katakana.",
    "+ ge'ez, + hiragana.",
    "+ ideogrammi cinesi, + ebraico.",
    "+ cirillico arcaico, + devanagari.",
    "+ sillabario canadese.",
    "Come sopra — massima varietà di script e discriminazione fine."
  ],
  inversione:[
    "Parole reali, 3-4 lettere; numeri 3-4 cifre.","Parole reali.","Parole reali.","Parole reali.",
    "Non-parole maiuscole uniformi.","Non-parole.","Non-parole.","Non-parole.","Non-parole.",
    "Introduzione di lunghezza 5 (lettere e cifre).",
    "Case misto nella stessa stringa; primi item alfanumerici.",
    "Case misto; alfanumerico.",
    "Alfanumerico misto esteso.","Alfanumerico misto esteso.","Alfanumerico misto esteso.","Alfanumerico misto esteso."
  ],
  serie:[
    "Scelta a 2 vie su colore.",
    "Scelta a 2 vie su categoria (lettera/numero).",
    "Mappatura a 4 vie (manuale o verbale).",
    "Come sopra, con inibizione (No-Go) casuale.",
    "Mappatura a 4 vie, incrociata rispetto al livello 3.",
    "Come sopra, con No-Go casuale.",
    "Doppia modalità di risposta: manuale + verbale.",
    "Doppia modalità, mappatura invertita rispetto al livello 7.",
    "Doppia modalità, altra combinazione manuale/verbale.",
    "Come sopra, con No-Go casuale.",
    "Doppia modalità, mappatura invertita rispetto al livello 9.",
    "Come sopra, con No-Go casuale.",
    "Doppia modalità, altra combinazione ancora.",
    "Come sopra, con No-Go casuale.",
    "Doppia modalità, mappatura invertita rispetto al livello 13.",
    "Come sopra, con No-Go casuale.",
    "Regola congiuntiva OR cross-dimensionale (colore O categoria).",
    "Come sopra, mappatura invertita.",
    "Regola congiuntiva OR, altra combinazione.",
    "Come sopra, mappatura invertita.",
    "Regola congiunta colore×categoria, con inibizione su un lato.",
    "Come sopra, mappatura invertita.",
    "N-1 back: risposta sullo stimolo precedente (doppia manuale).",
    "N-1 back: risposta sullo stimolo precedente (manuale + verbale)."
  ],
  accesso:[
    "Nomi concreti, alta frequenza.","Nomi concreti, alta frequenza.","Nomi concreti, alta frequenza.","Nomi concreti, alta frequenza.",
    "Concreto specifico / categorie meno immediate.","Concreto specifico.","Concreto specifico.","Concreto specifico.",
    "Astratto / semi-tecnico.","Astratto / semi-tecnico.","Astratto / semi-tecnico.","Astratto / semi-tecnico.",
    "Astratto/tecnico raro o nome proprio.","Astratto/tecnico raro.","Astratto/tecnico raro.","Astratto/tecnico raro."
  ],
  categorizzazione:[
    "Categorie tassonomiche molto distanti (es. animali vs utensili).","Categorie molto distanti.","Categorie molto distanti.","Categorie molto distanti.",
    "Categorie tassonomiche più vicine (es. animali vs cibo, bevande vs cibi solidi).","Tassonomiche vicine.","Tassonomiche vicine.","Tassonomiche vicine.",
    "Raggruppamento funzionale entro un dominio condiviso (es. ascesa con sforzo vs meccanica; suono che si produce vs si blocca).","Funzionale.","Funzionale.","Funzionale.",
    "Categorie astratte per qualità/processo, non per tipo di oggetto (es. precisione fine vs forza grossolana).","Astratto per processo.","Astratto per processo.","Astratto per processo."
  ]
};

// Note dei 32 livelli: per Griglie, Intruso e Inversione sono GENERATE dagli stessi parametri usati dai
// generatori (così non possono andare fuori sincrono); Serie usa l'elenco di regole; Accesso e
// Categorizzazione descrivono la miscela graduale delle fasce originali.
const SERIE_NOTES_EXTRA = [
  "n-1 back (proposta): sx / «Sì» in base allo stimolo precedente.",
  "n-1 back (proposta): risposta solo verbale («Sì»/«No»).",
  "n-1 back (proposta): mappatura invertita rispetto al livello 23.",
  "n-1 back (proposta): «No» / dx, mappatura invertita.",
  "n-2 back (proposta): risposta sullo stimolo di DUE posizioni prima (doppia manuale).",
  "n-2 back (proposta): manuale + verbale.",
  "n-2 back (proposta): risposta solo verbale.",
  "n-2 back (proposta): mappatura invertita rispetto al livello 29."
];
function levelNote(exId, level){
  const B = LEVEL_NOTES_BASE;
  switch(exId){
    case "griglie": {
      const cat = GRID_CATEGORY_BY_LEVEL[level], sub = (level-1)%4 + 1;
      const rows = gridRowsForLevel(level), cols = gridColsForLevel(level);
      const effLevel = tierEffectiveLevel(level, cat);
      const tg = gridScoreTargets(effLevel);
      const extra = [];
      if(effLevel>=6) extra.push("simbolo grande/piccolo");
      if(effLevel>=17) extra.push("bordo continuo/tratteggiato/puntinato"); else if(effLevel>=12) extra.push("bordo continuo/tratteggiato");
      if(effLevel>=9) extra.push("sfondo pieno/vuoto");
      const readNote = effLevel!==level ? ` — combinazioni calibrate come al livello ${effLevel} (${GRID_CATEGORY_LABELS[cat].toLowerCase()} ${effLevel>level ? "è facile da leggere per un lettore italiano" : "è poco familiare per un lettore italiano"})` : "";
      return `${GRID_CATEGORY_LABELS[cat]} (passo ${sub}/4) — griglia ${rows}×${cols}${readNote}. Punteggio delle consegne (stimolo + molteplicità + astrazione): da ${tg[0].toFixed(1)} a ${tg[9].toFixed(1)}, media ${(tg.reduce((a,b)=>a+b,0)/10).toFixed(1)}; almeno ${gridColorMin(effLevel)} consegne su 10 usano i colori (sfondo, bordo, colore del simbolo); astrazione massima ${gridAbstractionMax(effLevel).toFixed(1)} (posizioni composte, negazioni, relazioni tra celle vicine solo dove il punteggio lo consente).` + (extra.length ? ` Attributi extra: ${extra.join(", ")}.` : "");
    }
    case "intruso": {
      const eligible = intrusoEligibleFamilies(level, intrusoPlanLen(level));
      const lenTxt = intrusoPlanLen(level)===1 ? "1 simbolo" : `${intrusoPlanLen(level)} simboli`;
      const nAll = eligible.map(f=>targetNForLevelIntruso(level, f, Math.min(intrusoPlanLen(level), intrusoMaxLen(f))));
      const nLo = Math.min(...nAll), nHi = Math.max(...nAll);
      const bits = [`punteggio di difficoltà ${intrusoTargetD(level).toFixed(2)} (lunghezza + famiglia + somiglianza + numerosità); elementi di ${lenTxt} in tutte le schermate; ${nLo===nHi ? nLo : nLo+"-"+nHi} elementi per schermata (meno per le famiglie più ostiche, così tutte le schermate pesano uguale)`];
      const effLevelIntruso = intrusoEffLevel(level);
      if(effLevelIntruso>=3) bits.push(`tipi «quasi uguali» nel ${Math.round(Math.min(1,(effLevelIntruso-2)/30)*100)}% dei testi`);
      const newFam = INTRUSO_ALL_FAMILIES.filter(f=>f.unlockLevel===level).map(f=>f.label);
      // "Appena raggiunta questa soglia": confronta il livello effettivo di QUESTO livello con quello del
      // precedente, perché con la curva concava la soglia (pairsFrom/triplesFrom, fissa) può essere
      // superata anche senza che level la tocchi esattamente.
      const prevEffLevelIntruso = level>1 ? intrusoEffLevel(level-1) : -Infinity;
      const extra = [];
      const prevL = level>1 ? intrusoPlanLen(level-1) : 1, curL = intrusoPlanLen(level);
      if(curL>prevL) extra.push(curL===2 ? "elementi di 2 simboli in tutte le schermate" : "elementi di 3 simboli in tutte le schermate");
      let s = bits.join("; ") + ".";
      if(level===1) s += " Famiglie di partenza: " + newFam.join(", ") + " (glifi singoli).";
      else {
        if(newFam.length) s += " Nuove famiglie: " + newFam.join(", ") + ".";
        if(extra.length){ const e = extra.join("; "); s += " " + e.charAt(0).toUpperCase() + e.slice(1) + "."; }
        if(!newFam.length && !extra.length && level<=28) s += " Stesse famiglie del livello precedente.";
      }
      if(level>=29) s += " Tutte le famiglie disponibili: sale solo la difficoltà di discriminazione.";
      return s;
    }
    case "inversione": {
      const lens = inversioneLens(level);
      const items = inversioneSessionTotal(level);
      const pp = invPronounceProb(level);
      const parts = [level<=INV_LEXICAL_UNTIL ? "Parole reali" : (pp>=1 ? "Non-parole pronunciabili" : `Non-parole (pronunciabili ${Math.round(pp*100)}%)`)];
      parts.push(`lunghezze ${lens.join("-")}`);
      parts.push(level>=16 ? "contrassegni rosso+verde" : (level>=5 ? `1 o 2 contrassegni rossi (2 nel ${Math.round(Math.min(1,(level-4)/12)*100)}%)` : "1 contrassegno rosso"));
      if(level>=INV_ALNUM_FROM) parts.push("blocco alfanumerico");
      const pc = invMixedCaseProb(level);
      if(pc>0) parts.push(pc>=1 ? "maiuscole/minuscole miste" : `maiuscole/minuscole miste nel ${Math.round(pc*100)}% delle stringhe`);
      return `${parts.join(", ")}; ${items} elementi in sessione.`;
    }
    case "intrusoconc": {
      const hi = 1+Math.floor((level-1)*5/32);
      return `Fascia di astrazione fino a ${hi}/5; intruso ` + (level<9 ? "di un campo lontano." : `anche dello stesso campo (circa ${Math.round(0.9*(level-8)/24*100)}% dei quesiti).`);
    }
    case "analogie": {
      const hi = 1+Math.floor((level-1)*5/32);
      return `Relazioni fino alla fascia ${hi}/5` + (level<=12 ? "; scelta fra 4 opzioni" : "; risposta libera") + (level>=17 ? "; quesiti anche invertiti." : ".");
    }
    case "classificazioni": {
      const lo = Math.max(1, 1+Math.floor((level-1)*5/32)-1), hi = 1+Math.floor((level-1)*5/32);
      const names = ["", "categorie concrete e frequenti", "categorie concrete meno immediate", "categorie funzionali o di materiali", "categorie astratte o specialistiche", "categorie molto astratte"];
      return `Fascia di astrazione ${lo===hi?hi:lo+"-"+hi}/5 (${names[hi]}); termini sempre più atipici` + (level<=8 ? "; scelta fra 4 opzioni." : "; risposta libera.");
    }
    case "serie":
      return level<=B.serie.length ? B.serie[level-1] : SERIE_NOTES_EXTRA[level-B.serie.length-1];
    case "accesso": {
      const names = ["Nomi concreti, alta frequenza", "Concreto specifico / categorie meno immediate", "Astratto / semi-tecnico", "Astratto/tecnico raro o nome proprio"];
      const pos = levelT(level)*3, lo = Math.floor(pos), frac = pos-lo;
      const mix = (frac>=0.05 && lo<3) ? ` — miscela graduale con la fascia successiva (${Math.round(frac*100)}%)` : "";
      return `Fascia lessicale ${(pos+1).toFixed(1).replace(".",",")}/4: ${names[Math.round(pos)]}${mix}.`;
    }
    case "categorizzazione": {
      const q = 1 + levelT(level)*15, lo = Math.floor(q), frac = q-lo;
      const near = Math.round(q);
      const blockDesc = B.categorizzazione[Math.floor((near-1)/4)*4];   // la nota descrittiva è quella del primo livello di ogni blocco da 4
      const mix = (frac>=0.05 && lo<16) ? ` (mix graduale: ${Math.round((1-frac)*100)}% fascia ${lo} + ${Math.round(frac*100)}% fascia ${lo+1})` : "";
      return `Fascia ${q.toFixed(1).replace(".",",")}/16 — ${blockDesc}${mix}`;
    }
  }
  return "";
}

function colorHex(name){
  if(!name) return null;
  const c = COLORS.find(x=>x.name===name);
  return c? c.css : null;
}
