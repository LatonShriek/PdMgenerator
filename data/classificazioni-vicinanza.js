// Categorie STRETTE per «Classificazioni», a VICINANZA SEMANTICA con trappole (bozza «proposta», da validare).
// Prima la banca chiedeva soprattutto categorie larghe (frutta, animali…), dove l'intruso e la risposta si vedono
// subito. Qui la categoria è stretta e confinante con altre plausibili: i tre termini sono tutti animali, ma solo
// per alcuni la categoria giusta è «selvatici», «rapaci» o «mammiferi acquatici».
// Formato: C(fascia, nome, termini dal più tipico al meno, sinonimi, categorie più ampie accettate, TRAPPOLE),
// dove le trappole sono categorie vicine e plausibili che però NON reggono per tutti e tre i termini: nelle
// risposte a scelta compaiono fra le opzioni e, nella risposta libera, compaiono come «risposte da non accettare».
// Doppio uso: script classico (variabile globale) e modulo in Node.
(function(root){
  function C(t, n, w, s, p, d){ return {n:n, t:t, w:w.split(" ").map(function(x){return x.replace(/_/g," ");}), s:s?s.split("|"):[], p:p?p.split("|"):[], d:d?d.split("|"):[], stato:"proposta"}; }
  var V = [
    C(2,"Animali selvatici","lupo cervo volpe cinghiale scoiattolo orso tasso faina","","Animali","Animali domestici|Animali della fattoria|Predatori"),
    C(2,"Rettili","serpente lucertola tartaruga coccodrillo camaleonte geco iguana vipera","","Animali","Anfibi|Animali striscianti|Animali a sangue freddo"),
    C(2,"Agrumi","arancia limone mandarino pompelmo cedro bergamotto clementina lime","","Frutta","Frutti gialli|Frutti rossi|Frutta di stagione"),
    C(2,"Alberi da frutto","melo pero ciliegio pesco albicocco susino fico noce","","Alberi|Piante","Alberi sempreverdi|Alberi di montagna|Frutta"),
    C(2,"Strumenti a corda","chitarra violino arpa violoncello contrabbasso mandolino liuto banjo","","Strumenti musicali","Strumenti a fiato|Strumenti ad arco|Strumenti a percussione"),
    C(2,"Sport di squadra","calcio pallavolo basket rugby pallanuoto hockey baseball pallamano","","Sport","Sport con la palla|Sport individuali|Sport all'aperto"),
    C(2,"Funzionano a elettricità","frigorifero lavatrice televisore lampada aspirapolvere frullatore tostapane asciugacapelli","","Elettrodomestici|Oggetti di casa","Cose che si accendono|Oggetti di cucina|Elettrodomestici da cucina"),
    C(3,"Rapaci","aquila falco gufo avvoltoio sparviero nibbio poiana civetta","uccelli da preda","Uccelli|Animali","Uccelli notturni|Uccelli di montagna|Predatori"),
    C(3,"Mammiferi acquatici","balena delfino foca orca tricheco otaria lamantino beluga","","Mammiferi|Animali","Pesci|Animali marini|Animali acquatici"),
    C(3,"Anfibi","rana rospo salamandra tritone raganella proteo axolotl","","Animali","Rettili|Animali acquatici|Animali di stagno"),
    C(3,"Frutti di bosco","fragola lampone mirtillo mora ribes uva_spina rovo","bacche","Frutta","Frutta rossa|Agrumi|Frutti d'estate"),
    C(3,"Strumenti ad arco","violino viola violoncello contrabbasso viola_da_gamba rebec","","Strumenti musicali|Strumenti a corda","Strumenti a fiato|Strumenti a percussione|Strumenti a tastiera"),
    C(3,"Strumenti a percussione","tamburo timpano xilofono triangolo cembalo maracas batteria piatti","","Strumenti musicali","Strumenti a corda|Strumenti a fiato|Strumenti elettronici"),
    C(3,"Pasta lunga","spaghetti linguine tagliatelle bucatini fettuccine capellini vermicelli pappardelle","","Pasta|Primi piatti","Pasta corta|Pasta fresca|Pasta al forno"),
    C(3,"Pasta corta","penne fusilli rigatoni farfalle maccheroni conchiglie ditalini orecchiette","","Pasta|Primi piatti","Pasta lunga|Pasta fresca|Pasta ripiena"),
    C(3,"Formaggi freschi","mozzarella ricotta stracchino mascarpone robiola crescenza burrata fiocchi_di_latte","","Formaggi|Latticini","Formaggi stagionati|Latticini freschi|Formaggi a pasta molle"),
    C(3,"Pietre preziose","diamante rubino smeraldo zaffiro topazio ametista opale turchese","gemme","Gioielli|Minerali","Metalli preziosi|Perle|Gioielli d'oro"),
    C(3,"Metalli preziosi","oro argento platino palladio rodio","","Metalli","Pietre preziose|Gioielli|Monete"),
    C(3,"Conifere","pino abete cipresso larice cedro sequoia tasso ginepro","","Alberi|Piante","Alberi sempreverdi|Alberi di montagna|Alberi da frutto"),
    C(3,"Sport individuali","nuoto atletica sci ginnastica judo golf ciclismo scherma","","Sport","Sport di squadra|Sport all'aperto|Sport acquatici"),
    C(3,"Numeri pari","2 4 6 8 10 12 14 16","","Numeri","Numeri dispari|Multipli di quattro|Numeri piccoli"),
    C(3,"Mezzi senza motore","bicicletta monopattino skateboard slitta carrozza canoa pattini barca_a_remi","","Mezzi di trasporto","Mezzi a due ruote|Mezzi ecologici|Mezzi sportivi"),
    C(3,"Cose di vetro","bicchiere bottiglia finestra specchio lampadina vaso occhiali barattolo","","Oggetti","Cose fragili|Cose trasparenti|Cose di cristallo"),
    C(3,"Cose appuntite","ago spillo chiodo spina punteruolo stuzzicadenti lama aculeo","","Oggetti","Cose pericolose|Attrezzi|Cose da cucito"),
    C(4,"Animali che vanno in letargo","orso marmotta riccio ghiro pipistrello criceto tasso","","Animali","Animali selvatici|Animali di montagna|Animali notturni"),
    C(4,"Animali notturni","gufo pipistrello civetta tasso riccio lucciola volpe topo","","Animali","Rapaci|Animali selvatici|Animali che vanno in letargo"),
    C(4,"Roditori","topo scoiattolo castoro criceto porcospino cavia ratto marmotta","","Mammiferi|Animali","Animali domestici|Animali selvatici|Piccoli mammiferi"),
    C(4,"Marsupiali","canguro koala wallaby opossum wombat diavolo_della_tasmania","","Mammiferi|Animali","Animali australiani|Animali della savana|Mammiferi"),
    C(4,"Formaggi stagionati","parmigiano grana pecorino asiago montasio caciocavallo provolone","","Formaggi|Latticini","Formaggi freschi|Formaggi a pasta dura|Formaggi italiani"),
    C(4,"Sport con la racchetta","tennis badminton squash ping_pong padel racchettoni","","Sport","Sport con la palla|Sport individuali|Sport di squadra"),
    C(4,"Mesi di trentuno giorni","gennaio marzo maggio luglio agosto ottobre dicembre","","Mesi","Mesi estivi|Mesi dell'anno|Mesi lunghi"),
    C(4,"Ossa","femore tibia omero radio costola sterno vertebra cranio","","Parti del corpo","Articolazioni|Organi interni|Muscoli"),
    C(4,"Cose che galleggiano","sughero zattera boa legno tappo ghiaccio canotto salvagente","","","Cose leggere|Cose di legno|Barche"),
    C(5,"Numeri primi","2 3 5 7 11 13 17 19","","Numeri","Numeri dispari|Numeri interi|Numeri piccoli")
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = V;
  else root.CLASSIFICAZIONI_VICINANZA = V;
})(typeof window !== "undefined" ? window : globalThis);
