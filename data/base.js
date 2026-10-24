// Dati di base degli esercizi: alfabeti, parole reali, fasce lessicali, regole delle serie e delle sequenze.
// Spostato da index.html al passo 9 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   DATI DI BASE
   ========================================================= */
const ALPHABET = "ABCDEFGHILMNOPQRSTUVZ".split("");
const VOWELS = "AEIOU".split("");
const CONSONANTS = ALPHABET.filter(c=>!VOWELS.includes(c));

// Parole reali per i livelli lessicali (1-4) di Inversione e riordino. Pool ampliato: prima erano
// 20 parole da 3 e 20 da 4 lettere (con diverse parole rare o poco naturali, es. PIO, SIR, REA),
// ora 63 da 3 e 194 da 4, tutte comuni e riconoscibili (validate per frequenza d'uso su un
// corpus italiano), con lettere tutte diverse tra loro e solo lettere dell'alfabeto italiano.
const REAL_WORDS = {
  3: "AGO APE ORA UVA VIA ZIO ZIA DEA DIO IRA ERA ECO MIO MIA TUO TUA SUO SUA LUI LEI NOI VOI POI DUE UNO TRE SEI BUE GRU OCA SUD USA USO ORE API HAI SAI FAI VAI DAI MAI QUI CUI AMO ALI PER CON DEI NEL GLI DAL TRA SUL SUI NEI COL CHI SIA STA STO SUE VIE USI".split(" "),
  4: "COSA VITA DIRE COSE CASO FINE VERO NOME TIPO MANO MESI CAPO VOCE SERA ZONA CURA ALTO LUCE SOLA AUTO ARTE MANI VERA PACE SOLE NOTA LATO TEMA NERO PENA PARI ARMI SOLI FASE VOTI LEGA NOMI VOCI FAME MODI DURA VINO CENA CARO NAVE BENI LUNA MODA ONDA PANE NOVE VITE FILA ALTI LAGO VISO RETI RISO NASO NAVI CODA LUPO BUIO PURO DITA DITO PURA CIMA LUCI LATI SENO SOCI MURA MIRA ERBA GARE ONDE GOLA MITO NUDO EROI CAOS MURI TONI VIDE LEVA URLA RITO MALI TELA PESI SPIA RIGA NIDO RAMI NOIA LUPI PELI NUDA MARI ODIA VASO RAME POSA MELA CAVI GITA PINO VOLA VENA SETA BACI LITE GENI ESCA SANI VELA DOSI TUBI FICO DOTI VASI RUBA DONI FUSO DOTE AMPI DIGA TOPI RIMA FORI MUTA LIDO RIVE NOCE ORME URNE AULE CONI MUTI MORA FUMA CIME PURI DAZI CUBO PILA MUSA TACI OASI EQUA FATO GELA ORTI CUPO RIME NUCA CELA FOCE FUSI PERA CUBI LUME RANE ARIE REMI ZELO VELI FEDI MULO ZERO SALE FARE DARE ROSA MARE CANE ARCO ORCA TEMO PURE PELO GUFO FOCA TIRO URLO FUMO CIBO RAMO VELO TUBO SANO CARI NATI".split(" ")
};
// Lessico di controllo: parole italiane reali (3-5 lettere, lettere tutte diverse) che NON devono
// mai comparire come "non-parole" — prima una non-parola generata a caso poteva coincidere per
// caso con una parola vera (es. PANE, LUNA).
// INV_REAL_BLOCK: dati in data/inv-real-block.js (caricato prima di questo script).

const LEXICAL_TIERS = [
  { // 1 - concreto, alta frequenza
    words:["Pomodoro","Cane","Martello","Sedia","Finestra","Bicicletta","Cucchiaio","Gatto","Scarpa","Ombrello","Chiave","Bottiglia","Orologio","Zaino","Lampada",
      "Tavolo","Letto","Porta","Libro","Penna","Forchetta","Piatto","Tazza","Specchio","Armadio","Scala","Cappello","Guanto","Calzino","Cintura",
      "Borsa","Matita","Quaderno","Sapone","Pettine","Cuscino","Coperta","Tenda","Vaso","Candela","Secchio","Scopa","Padella","Pentola","Bilancia",
      "Termometro","Cassetto","Divano","Tappeto","Asciugamano"]
  },
  { // 2 - concreto specifico / categorie meno immediate
    words:["Quercia","Delfino","Treno","Falegname","Vulcano","Cascata","Ghiacciaio","Farfalla","Girasole","Chitarra","Elicottero","Bussola","Ventaglio","Telaio","Lanterna",
      "Renna","Scoiattolo","Libellula","Tartaruga","Cammello","Geyser","Altopiano","Fiordo","Mulino","Faro","Acquedotto","Anfiteatro","Sarcofago","Meridiana",
      "Telescopio","Microscopio","Sestante","Astrolabio","Clessidra","Liuto","Mandolino","Cornamusa","Xilofono","Airone","Fenicottero","Alce","Bisonte",
      "Foca","Otaria","Pellicano","Colibrì","Mangrovia","Savana","Tundra","Estuario"]
  },
  { // 3 - astratto / semi-tecnico
    words:["Tristezza","Varietà","Conservazione","Equilibrio","Pazienza","Coraggio","Abitudine","Rassegnazione","Nostalgia","Percezione","Esitazione","Armonia","Delusione","Serenità",
      "Malinconia","Gratitudine","Ambizione","Diffidenza","Empatia","Solidarietà","Resilienza","Curiosità","Indifferenza","Speranza","Rimpianto","Entusiasmo",
      "Scetticismo","Umiltà","Arroganza","Tenacia","Ironia","Ambiguità","Coerenza","Autonomia","Consapevolezza","Introspezione","Vulnerabilità",
      "Autenticità","Determinazione","Apprensione","Sollievo","Riluttanza","Rimorso","Ostinazione"]
  },
  { // 4 - astratto/tecnico raro, proprio
    words:["Pacciamatura","Timbratura","Marte","Futuro","Fato","Sussidiarietà","Circospezione","Reticenza","Empirismo","Ossimoro","Meridiana","Alambicco","Estemporaneo","Palinsesto","Sincretismo",
      "Epifania","Anacronismo","Paradigma","Euristica","Dicotomia","Endemismo","Metonimia","Sinestesia","Solipsismo","Egemonia","Apoteosi","Catarsi",
      "Dialettica","Epistemologia","Fenomenologia","Ermeneutica","Teleologia","Aporia","Palindromo","Neologismo","Antitesi","Sofisma","Eristica"]
  }
];
// piccola correzione: rimuove un carattere non italiano rimasto per errore
LEXICAL_TIERS[2].words = LEXICAL_TIERS[2].words.filter(w=>/^[A-Za-zàèéìòù]+$/.test(w));

// coppie di domini "vicini" semanticamente, per costruire intrusi difficili
// (l'intruso non è ovviamente estraneo: appartiene a un dominio contiguo/facilmente confondibile)
// Coppie di gruppi reali (6 immagini = due gruppi da 3), vicinanza semantica crescente col livello.
// Alcune coppie replicano direttamente esempi osservati nei materiali originali.
// Libreria di criteri + pool di item per Categorizzazione: dati reali estratti
// dai 16 file "Categorizzazione.pptx" di Rodrigo (142 criteri, corretti da lui),
// con pool ampliati (5+ item per lato) cosi' ogni generazione pesca una
// combinazione diversa senza dover inventare nuovi criteri — vedi
// CATEGORIZZAZIONE_LIBRARY e le funzioni in fondo al file (caricate da
// categorization_library.js / categorization_engine.js).

// 32 livelli. I primi 24 sono l'elenco fornito
// direttamente da Rodrigo, non generato: ogni livello è una singola consegna, senza
// varianti speculari automatiche (le variazioni di mappatura sono già scritte esplicitamente
// livello per livello, es. i livelli 3-6 differiscono tra loro apposta).
const SERIE_RULES = [
  "Mano dx se nero, sx se rosso.",
  "Mano dx se lettera, sx se numero.",
  "Mano dx se A o 1, sx se B o 2 (variante con Sì/No).",
  "Mano dx se A o 1, sx se B o 2 (variante con Sì/No) + 1 No-Go casualmente.",
  "Mano dx se A o 2, sx se B o 1 (variante con Sì/No).",
  "Mano dx se A o 2, sx se B o 1 (variante con Sì/No) + 1 No-Go casualmente.",
  "Mano dx se A, sx se B, «Sì» se 1, «No» se 2.",
  "«Sì» se A, «No» se B, mano dx se 1, sx se 2.",
  "Mano dx se A, «Sì» se B, sx se 1, «No» se 2.",
  "Mano dx se A, «Sì» se B, sx se 1, «No» se 2 + 1 No-Go casualmente.",
  "Mano sx se A, «No» se B, dx se 1, «Sì» se 2.",
  "Mano sx se A, «No» se B, dx se 1, «Sì» se 2 + 1 No-Go casualmente.",
  "Mano dx se A, «No» se B, sx se 1, «Sì» se 2.",
  "Mano dx se A, «No» se B, sx se 1, «Sì» se 2 + 1 No-Go casualmente.",
  "Mano sx se A, «Sì» se B, dx se 1, «No» se 2.",
  "Mano sx se A, «Sì» se B, dx se 1, «No» se 2 + 1 No-Go casualmente.",
  // Livelli 17-22: riordinati rispetto alla stesura originale (segnalato da Rodrigo — il go/no-go
  // a 3 uscite sembrava più difficile della mappatura a 4 vie). La regola con inibizione incrociata
  // (colore E categoria insieme, con No-Go) richiede di leggere due caratteristiche insieme E di
  // inibire in base a quella combinazione: due carichi nuovi insieme. La regola "OR cross-
  // dimensionale" richiede di leggere le stesse due caratteristiche insieme ma SENZA inibire mai.
  // Ora si introduce prima l'incrocio delle due caratteristiche da solo (ex 19-22), poi si aggiunge
  // l'inibizione sopra un incrocio già padroneggiato (ex 17-18), invece delle due cose insieme.
  "Mano dx se lettera nera o numero rosso; sx se lettera rossa o numero nero.",
  "Mano sx se lettera nera o numero rosso; «Sì» se lettera rossa o numero nero.",
  "Mano dx se lettera rossa o numero nero; «No» se lettera nera o numero rosso.",
  "Mano sx se lettera nera o numero rosso; «No» se lettera rossa o numero nero.",
  "Mano dx se lettera nera, No-Go se lettera rossa; sx se numero rosso, No-Go se numero nero.",
  "Mano sx se lettera nera, No-Go se lettera rossa; «Sì» se numero rosso, No-Go se numero nero.",
  "n-1 back: risposta basata sullo stimolo precedente (dx se era nero/lettera, sx se era rosso/numero).",
  "n-1 back: risposta basata sullo stimolo precedente (dx se era nero/lettera, «Sì» se era rosso/numero).",
  // ---- Livelli 25-32: PROPOSTA da validare (estensione della progressione n-back, stessa formulazione dei livelli 23-24) ----
  "n-1 back: risposta basata sullo stimolo precedente (sx se era nero/lettera, «Sì» se era rosso/numero).",
  "n-1 back: risposta basata sullo stimolo precedente («Sì» se era nero/lettera, «No» se era rosso/numero).",
  "n-1 back, mappatura invertita rispetto al livello 23 (sx se era nero/lettera, dx se era rosso/numero).",
  "n-1 back: risposta basata sullo stimolo precedente («No» se era nero/lettera, dx se era rosso/numero).",
  "n-2 back: risposta basata sullo stimolo di due posizioni prima (dx se era nero/lettera, sx se era rosso/numero).",
  "n-2 back: risposta basata sullo stimolo di due posizioni prima (dx se era nero/lettera, «Sì» se era rosso/numero).",
  "n-2 back: risposta basata sullo stimolo di due posizioni prima («Sì» se era nero/lettera, «No» se era rosso/numero).",
  "n-2 back, mappatura invertita rispetto al livello 29 (sx se era nero/lettera, dx se era rosso/numero)."
];
const SERIE_MAX_LEVEL = SERIE_RULES.length; // 32, come tutti gli altri esercizi

const SEQUENCE_RULES = [
  {key:"ripeti", label:"Ripeti in avanti", kinds:["letters","digits","alnum"], apply:s=>s},
  {key:"inverti", label:"Inverti", kinds:["letters","digits","alnum"], apply:s=>s.split("").reverse().join("")},
  {key:"ordina", label:"Riordina (crescente/alfabetico)", kinds:["letters","digits","alnum"], apply:s=>s.split("").sort().join("")},
  {key:"somma", label:"Somma le cifre", kinds:["digits"], apply:s=>String(s.split("").reduce((a,c)=>a+Number(c),0))},
  {key:"parita", label:"Solo pari/dispari alternati", kinds:["digits"], apply:s=>{
      let ev=s.split("").filter(c=>Number(c)%2===0);
      let od=s.split("").filter(c=>Number(c)%2!==0);
      let out=[]; let i=0;
      while(ev.length||od.length){ if(i%2===0 && ev.length) out.push(ev.shift()); else if(od.length) out.push(od.shift()); i++; }
      return out.join("")||"—";
  }},
  {key:"vocali", label:"Solo vocali", kinds:["letters","alnum"], apply:s=>s.split("").filter(c=>"AEIOU".includes(c.toUpperCase())).join("")||"—"},
  {key:"consonanti", label:"Solo consonanti", kinds:["letters","alnum"], apply:s=>s.split("").filter(c=>/[A-Z]/i.test(c) && !"AEIOU".includes(c.toUpperCase())).join("")||"—"},
  {key:"posdispari", label:"Solo posizioni dispari (1ª, 3ª, 5ª...)", kinds:["letters","digits","alnum"], apply:s=>s.split("").filter((c,i)=>i%2===0).join("")||"—"},
  {key:"pospari", label:"Solo posizioni pari (2ª, 4ª, 6ª...)", kinds:["letters","digits","alnum"], apply:s=>s.split("").filter((c,i)=>i%2===1).join("")||"—"}
];
// Alias per compatibilità con il codice esistente che referenzia ancora DIGIT_RULES
// (il selettore mostra solo le regole applicabili al tipo di blocco corrente).
const DIGIT_RULES = SEQUENCE_RULES;
