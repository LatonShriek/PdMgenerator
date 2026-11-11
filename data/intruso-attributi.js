// Dati per «Intruso concettuale» a ATTRIBUTO (bozza «proposta», da validare clinicamente).
// Diversamente dalle categorie di Classificazioni, qui tutte e quattro le parole stanno nello stesso campo
// (es. tutti animali) e l'intruso si distingue per una caratteristica (es. non è domestico): prossimità semantica alta.
// Ogni regola ha parole «sì» (la rispettano) e parole «no» (non la rispettano, ma ne sembrano vicine: sono le trappole).
// tier 1 = caratteristica evidente; 4 = caratteristica sottile o con trappola forte (la categoria apparente è troppo larga).
(function(root){
  var R = [];
  function A(regola, tier, si, no){ R.push({ regola:regola, tier:tier, si:si.split("|"), no:no.split("|") }); }
  A("si indossano ai piedi",1,"scarpa|calzino|stivale|pantofola|sandalo|ciabatta","guanto|cappello|sciarpa|cintura|cravatta");
  A("si mangiano caldi",1,"minestra|zuppa|polenta|risotto|caffè|tè","gelato|insalata|yogurt|sorbetto|macedonia");
  A("sport con la palla",1,"calcio|pallavolo|basket|tennis|rugby|golf","nuoto|sci|ciclismo|atletica|scherma");
  A("mezzi che volano",1,"aereo|elicottero|mongolfiera|deltaplano|aliante","nave|sottomarino|treno|moto|slitta");
  A("animali domestici",2,"maiale|mucca|gallina|pecora|coniglio|asino|capra","cervo|lupo|faina|volpe|cinghiale|scoiattolo");
  A("servono per tagliare",2,"forbici|coltello|sega|accetta|taglierino","martello|pinza|cacciavite|lima|trapano");
  A("mezzi che vanno su rotaia",2,"treno|tram|metropolitana|funicolare|locomotiva","autobus|filobus|taxi|bicicletta|furgone");
  A("professioni sanitarie",2,"medico|infermiere|fisioterapista|psicologo|dentista","notaio|ingegnere|giudice|architetto|commercialista");
  A("parti di una pianta",2,"radice|fusto|foglia|fiore|seme","vaso|terra|innaffiatoio|giardino|serra");
  A("emozioni piacevoli",2,"gioia|serenità|entusiasmo|orgoglio|speranza","rabbia|ansia|invidia|tristezza|paura");
  A("strumenti a corda",2,"violino|chitarra|arpa|violoncello|contrabbasso","flauto|tromba|clarinetto|tamburo|xilofono");
  A("si mangiano crudi",3,"insalata|carota|sedano|finocchio|pomodoro|cetriolo","patata|melanzana|zucca|spinaci|fagiolini");
  A("frutti che crescono sugli alberi",3,"mela|pera|arancia|ciliegia|pesca|albicocca","fragola|anguria|melone|ananas|mirtillo");
  A("capitali europee",3,"Roma|Parigi|Madrid|Berlino|Vienna|Lisbona","Barcellona|Milano|Istanbul|Zurigo|Ginevra");
  A("fiumi italiani",3,"Po|Tevere|Arno|Adige|Piave","Danubio|Senna|Tamigi|Loira|Nilo");
  A("cibi dolci",3,"miele|zucchero|cioccolato|marmellata|torta","sale|aceto|limone|peperoncino|olio");
  A("di origine animale",3,"latte|uova|formaggio|burro|prosciutto|miele","latte di soia|margarina|olio|tofu|farina");
  A("funzionano a elettricità",3,"frigorifero|lavatrice|televisore|frullatore|asciugacapelli","ventaglio|scopa|mortaio|fornello a gas|orologio a pendolo");
  A("parenti acquisiti (per matrimonio)",3,"suocero|cognato|genero|nuora|suocera","zio|cugino|nonno|nipote|fratello");
  A("uccelli che non volano",3,"pinguino|struzzo|kiwi|emù","aquila|gabbiano|passero|colomba|rondine");
  A("mammiferi che vivono in acqua",4,"balena|delfino|foca|tricheco","squalo|tonno|polpo|salmone|medusa");
  A("producono luce propria",4,"sole|lampadina|candela|lucciola|fulmine","luna|specchio|vetro|diamante|pianeta");
  A("animali che depongono uova",4,"gallina|tartaruga|rana|serpente|aquila","pipistrello|delfino|balena|gatto|canguro");
  A("animali che vanno in letargo",4,"orso|marmotta|riccio|ghiro","lupo|cervo|volpe|cinghiale|lepre");
  A("mesi di 31 giorni",4,"gennaio|marzo|maggio|luglio|agosto|ottobre|dicembre","aprile|giugno|settembre|novembre");
  A("numeri primi",4,"2|3|5|7|11|13|17","9|15|21|27|25");
  if (typeof module !== "undefined" && module.exports) module.exports = R;
  else root.INTRUSO_ATTRIBUTI = R;
})(typeof window !== "undefined" ? window : globalThis);
