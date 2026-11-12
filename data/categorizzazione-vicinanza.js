/* =========================================================
   CATEGORIZZAZIONE — criteri a VICINANZA SEMANTICA con trappole (bozza «proposta», da validare)
   I due gruppi stanno nello stesso campo (tutti animali, tutti oggetti dello stesso tipo…) e si distinguono per una
   caratteristica: la categoria apparente è troppo larga e non regge (es. «animali marini» con tonno e delfino).
   Si aggiungono alla libreria alla fascia indicata. Ogni voce usa solo termini che hanno già un'icona OpenMoji.
   ========================================================= */
(function(){
  var V = [];
  function T(it,en){ return {it:it, en:en}; }
  function C(tier,label,a,b){ V.push({tier:tier, entry:{label:label, a:a.map(function(x){return T(x[0],x[1]);}), b:b.map(function(x){return T(x[0],x[1]);}), proposal:true}}); }
  C(9,"Carnivori / Erbivori",
    [["leone","lion"],["tigre","tiger"],["lupo","wolf"],["coccodrillo","crocodile"],["aquila","eagle"]],
    [["mucca","cow"],["cavallo","horse"],["coniglio","rabbit"],["giraffa","giraffe"],["zebra","zebra"],["cammello","camel"]]);
  C(9,"Fanno luce propria / Riflettono la luce",
    [["sole","sun"],["candela accesa","lit candle"],["torcia","flashlight"],["fulmine","lightning bolt"],["lampada led","led lamp"]],
    [["luna","moon"],["specchio rotto","cracked mirror"],["diamante","diamond gem"],["finestra di vetro","glass window"],["bottiglia di vetro","glass bottle"]]);
  C(10,"Animali domestici / Animali selvatici",
    [["maiale","pig"],["mucca","cow"],["gallina","chicken"],["capra","goat"],["cavallo","horse"],["coniglio","rabbit"]],
    [["cervo","deer"],["lupo","wolf"],["volpe","fox"],["cinghiale","wild boar"],["scoiattolo","squirrel"],["stambecco","mountain goat"]]);
  C(11,"Di vetro / Di plastica",
    [["bottiglia di vetro","glass bottle"],["barattolo di vetro","glass jar"],["finestra di vetro","glass window"],["bottiglia di birra","beer bottle"]],
    [["bottiglia di plastica","plastic bottle"],["sacchetto di plastica","plastic bag"],["secchio di plastica","plastic bucket"],["palloncino","balloon"]]);
  C(11,"Freschi / Conservati",
    [["pomodoro fresco","fresh tomato"],["pesce fresco","fresh fish"],["melanzana fresca","fresh eggplant"],["uovo","fresh egg"]],
    [["pomodori secchi","sun-dried tomatoes"],["sottaceti","pickles jar"],["marmellata","jam jar"],["olive","olives"]]);
  C(12,"Funzionano a elettricità / Sono manuali",
    [["rasoio elettrico","electric razor"],["spazzolino elettrico","electric toothbrush"],["chitarra elettrica","electric guitar"],["piano elettrico","electric piano"],["lampada led","led lamp"]],
    [["rasoio usa e getta","disposable razor"],["spazzolino da denti","toothbrush"],["chitarra","acoustic guitar"],["orologio a molla","wind-up clock"],["scopa","broom"]]);
  C(12,"Pesci / Animali acquatici che non sono pesci",
    [["tonno","tuna fish"],["pesce rosso","goldfish"],["squalo","shark"],["pesce","fish"]],
    [["delfino","dolphin"],["balena","whale"],["polpo","octopus"],["calamaro","squid"],["foca","seal animal"],["granchio","crab"]]);
  C(13,"Insetti / Animaletti che non sono insetti",
    [["formica","ant"],["farfalla","butterfly"],["coccinella","ladybug"],["zanzara","mosquito"],["ape","bee hive"]],
    [["scorpione","scorpion"],["lumaca","snail"],["lombrico","earthworm"],["granchio","crab"],["chiocciola","garden snail"]]);
  C(14,"Mammiferi acquatici / Altri animali del mare",
    [["delfino","dolphin"],["balena","whale"],["foca","seal animal"],["narvalo","narwhal"]],
    [["squalo","shark"],["tonno","tuna fish"],["polpo","octopus"],["calamaro","squid"],["granchio","crab"]]);
  C(14,"Depongono uova / Non depongono uova",
    [["gallina","chicken"],["rana","frog"],["serpente","snake"],["tartaruga","turtle"],["aquila","eagle"],["coccodrillo","crocodile"]],
    [["pipistrello","bat animal"],["delfino","dolphin"],["balena","whale"],["coniglio","rabbit"],["canguro","kangaroo"]]);
  C(15,"Attivi di notte / Attivi di giorno",
    [["gufo","owl night"],["pipistrello","bat flying night"],["procione","raccoon"],["tasso","badger animal"],["puzzola","skunk"]],
    [["farfalla diurna","daytime butterfly"],["lucertola al sole","lizard sunbathing"],["scoiattolo","squirrel"],["aquila in volo","eagle diving"],["mucca","cow"]]);
  C(16,"Strumenti a corda / Strumenti a fiato e a percussione",
    [["violino","violin"],["chitarra","acoustic guitar"],["arpa","harp"],["pianoforte a coda","grand piano"]],
    [["flauto","flute"],["tromba","trumpet instrument"],["tamburo","drum"],["djembe","djembe drum"],["fisarmonica","accordion"]]);
  var L = (typeof CATEGORIZZAZIONE_LIBRARY !== "undefined") ? CATEGORIZZAZIONE_LIBRARY : null;
  if (L) V.forEach(function(v){ (L[String(v.tier)] = L[String(v.tier)] || []).push(v.entry); });
  if (typeof module !== "undefined" && module.exports) module.exports = V;
  else window.CATEGORIZZAZIONE_VICINANZA = V;
})();
