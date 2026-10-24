// Banca per l'esercizio "Classificazioni" (ispirato al subtest Classificazioni del VRT, Basagni 2017):
// dati 3 termini, nominare la categoria che li comprende.
// Ogni categoria: n = nome, s = sinonimi accettati, p = categorie più ampie accettate come risposta,
// t = fascia di astrazione (1 concreta e immediata … 5 astratta), w = termini dal più tipico/frequente
// al meno tipico (l'ordine conta: il generatore lo usa per graduare la difficoltà).
// stato = "proposta": banca scritta da Claude, DA VALIDARE da Rodrigo prima dell'uso clinico
// (non è materiale originale del VRT né dei fascicoli). Le voci validate si marcano "verificata".
// Doppio uso: script classico nel browser (variabile globale) e modulo in Node (test).
(function(root){
  function C(t, n, w, s, p){ return {n:n, t:t, w:w.split(" "), s:s?s.split("|"):[], p:p?p.split("|"):[], stato:"proposta"}; }
  var CLASSIFICAZIONI = [
    // ---- fascia 1: categorie concrete, molto frequenti ----
    C(1,"Frutta","mela pera banana arancia fragola uva pesca ciliegia","frutti","Cibo|Alimenti|Cose da mangiare"),
    C(1,"Verdura","carota zucchina spinaci lattuga cipolla melanzana sedano cavolo","ortaggi|verdure","Cibo|Alimenti|Cose da mangiare"),
    C(1,"Animali domestici","cane gatto coniglio criceto canarino pesce_rosso tartaruga cavia","","Animali"),
    C(1,"Uccelli","passero piccione aquila gallina pappagallo cigno gufo corvo","volatili","Animali"),
    C(1,"Pesci","trota salmone tonno sogliola merluzzo sardina spigola squalo","","Animali"),
    C(1,"Insetti","mosca zanzara formica ape farfalla coccinella cavalletta vespa","","Animali"),
    C(1,"Mobili","sedia tavolo armadio divano letto comodino scrivania libreria","arredi|arredamento",""),
    C(1,"Indumenti","camicia pantaloni gonna maglione giacca cappotto calzini sciarpa","vestiti|abiti|abbigliamento",""),
    C(1,"Mezzi di trasporto","auto treno aereo bicicletta autobus nave moto tram","veicoli|mezzi",""),
    C(1,"Strumenti musicali","chitarra pianoforte violino tromba flauto tamburo fisarmonica arpa","","Oggetti"),
    C(1,"Parti del corpo","mano piede testa braccio gamba naso occhio orecchio","",""),
    C(1,"Colori","rosso blu verde giallo arancione viola rosa marrone","tinte|colore",""),
    C(1,"Bevande","acqua latte vino birra tè caffè succo aranciata","da bere","Cibo e bevande"),
    C(1,"Mestieri","falegname idraulico muratore panettiere sarto elettricista fabbro meccanico","professioni|lavori|professione",""),
    C(1,"Sport","calcio tennis nuoto pallavolo basket ciclismo sci atletica","discipline sportive|attività sportive",""),
    C(1,"Fiori","rosa tulipano margherita viola girasole garofano orchidea giglio","","Piante"),
    C(1,"Giocattoli","bambola pallone trenino orsacchiotto puzzle trottola monopattino costruzioni","giochi",""),
    C(1,"Utensili da cucina","pentola padella mestolo colino coltello tagliere frullatore grattugia","attrezzi da cucina|arnesi da cucina|oggetti da cucina|strumenti da cucina","Utensili|Oggetti di casa"),
    C(1,"Dolci","torta gelato cioccolato biscotto crostata tiramisù caramella budino","dessert|cose dolci","Cibo|Alimenti|Cose da mangiare"),
    C(1,"Animali della fattoria","mucca maiale pecora cavallo gallina capra asino oca","animali da cortile|animali da allevamento","Animali"),
    // ---- fascia 2: concrete, meno immediate ----
    C(2,"Attrezzi da lavoro","martello cacciavite pinza sega trapano chiave_inglese pialla cesoie","utensili|arnesi|attrezzi","Strumenti"),
    C(2,"Posate","forchetta cucchiaio coltello cucchiaino forchettina","","Utensili|Oggetti da tavola"),
    C(2,"Cereali","grano riso mais orzo avena segale farro miglio","","Cibo|Alimenti|Piante"),
    C(2,"Spezie","pepe cannella zafferano curry paprika noce_moscata chiodi_di_garofano zenzero","aromi","Cibo|Alimenti"),
    C(2,"Calzature","scarpa stivale sandalo pantofola ciabatta sneaker zoccolo scarponcino","scarpe","Indumenti|Abbigliamento"),
    C(2,"Edifici","casa chiesa scuola ospedale castello grattacielo stazione teatro","costruzioni","Luoghi"),
    C(2,"Mezzi pubblici","autobus tram metropolitana treno traghetto filobus","mezzi di trasporto pubblico","Mezzi di trasporto|Veicoli"),
    C(2,"Pianeti","Mercurio Venere Terra Marte Giove Saturno Urano Nettuno","corpi celesti","Astri"),
    C(2,"Gioielli","anello collana bracciale orecchini spilla ciondolo diadema catenina","monili|ornamenti","Accessori"),
    C(2,"Elettrodomestici","frigorifero lavatrice lavastoviglie forno aspirapolvere frullatore tostapane asciugacapelli","apparecchi elettrici|macchine di casa","Oggetti di casa"),
    C(2,"Formaggi","mozzarella parmigiano gorgonzola ricotta pecorino provolone fontina mascarpone","latticini","Cibo|Alimenti"),
    C(2,"Pasta","spaghetti penne fusilli tagliatelle rigatoni farfalle lasagne tortellini","tipi di pasta|formati di pasta","Cibo|Alimenti|Primi piatti"),
    C(2,"Alberi","quercia pino abete faggio ulivo pioppo castagno salice","piante|essenze","Piante"),
    C(2,"Cancelleria","penna matita gomma temperino quaderno righello graffetta colla","materiale scolastico|articoli da scrittura|oggetti da scrivania","Oggetti"),
    C(2,"Medici specialisti","cardiologo neurologo oculista dentista pediatra ortopedico dermatologo chirurgo","dottori|professioni sanitarie|professioni mediche","Professioni|Mestieri"),
    // ---- fascia 3: categorie meno immediate / funzionali ----
    C(3,"Forme geometriche","cerchio quadrato triangolo rettangolo rombo ovale esagono pentagono","figure geometriche|figure",""),
    C(3,"Stagioni","primavera estate autunno inverno","","Periodi dell'anno"),
    C(3,"Punti cardinali","nord sud est ovest","direzioni",""),
    C(3,"Unità di misura","metro litro chilo secondo grado ettaro miglio watt","misure|grandezze","Misure"),
    C(3,"Mezzi di comunicazione","telefono radio televisione giornale lettera internet telegrafo cellulare","media|strumenti di comunicazione","Comunicazione"),
    C(3,"Strumenti di misura","righello bilancia termometro metro orologio barometro cronometro contachilometri","apparecchi di misura|misuratori","Strumenti|Oggetti"),
    C(3,"Documenti","passaporto patente carta_d'identità tessera_sanitaria certificato contratto ricevuta libretto","carte|certificati","Carte"),
    C(3,"Rocce e minerali","granito marmo quarzo basalto calcare diamante argilla pomice","pietre|minerali|rocce","Materiali|Elementi naturali"),
    C(3,"Metalli","ferro rame oro argento alluminio stagno piombo acciaio","materiali metallici","Materiali"),
    C(3,"Fenomeni atmosferici","pioggia neve grandine nebbia temporale vento tuono arcobaleno","fenomeni meteorologici|meteo|condizioni meteorologiche","Fenomeni naturali"),
    C(3,"Generi letterari","romanzo poesia novella commedia tragedia saggio favola giallo","tipi di libri|generi","Letteratura"),
    C(3,"Giochi da tavolo","scacchi dama tombola monopoli domino backgammon carte scarabeo","giochi di società|giochi","Giochi"),
    C(3,"Materiali da costruzione","mattone cemento sabbia calce legno vetro acciaio intonaco","materiali edili|materiali","Materiali"),
    C(3,"Tessuti","cotone lana seta lino velluto jeans nylon flanella","stoffe|materiali tessili","Materiali"),
    // ---- fascia 4: categorie astratte o specialistiche ----
    C(4,"Emozioni","gioia tristezza rabbia paura sorpresa disgusto vergogna ansia","sentimenti|stati d'animo|stati emotivi",""),
    C(4,"Virtù","coraggio onestà pazienza giustizia umiltà generosità prudenza temperanza","qualità morali|valori|doti morali","Qualità"),
    C(4,"Difetti","pigrizia avarizia invidia superbia egoismo vanità arroganza ipocrisia","vizi|difetti morali|qualità negative","Qualità"),
    C(4,"Discipline scientifiche","fisica chimica biologia geologia astronomia matematica botanica zoologia","scienze|materie scientifiche","Scienze|Materie"),
    C(4,"Forme di governo","monarchia repubblica democrazia dittatura oligarchia anarchia teocrazia impero","sistemi politici|regimi politici|tipi di governo|regimi","Politica"),
    C(4,"Stili artistici","barocco gotico romanico rinascimento impressionismo cubismo surrealismo liberty","movimenti artistici|correnti artistiche|stili","Arte"),
    C(4,"Figure retoriche","metafora similitudine ironia iperbole allegoria metonimia ossimoro litote","figure del discorso|figure di stile","Linguaggio"),
    C(4,"Professioni artistiche","pittore scultore musicista scrittore attore regista poeta ballerino","artisti|mestieri artistici","Professioni|Mestieri"),
    C(4,"Religioni","cristianesimo islam buddismo ebraismo induismo sikhismo scintoismo taoismo","fedi|credi religiosi|confessioni","Credenze"),
    C(4,"Malattie","influenza morbillo diabete asma varicella polmonite bronchite tubercolosi","patologie|infermità|disturbi","Salute"),
    C(4,"Cariche istituzionali","presidente ministro sindaco prefetto senatore deputato questore console","cariche pubbliche|ruoli istituzionali|cariche","Ruoli"),
    C(4,"Sentimenti d'amore","affetto passione tenerezza devozione attaccamento infatuazione amore gelosia","affetti","Emozioni|Sentimenti"),
    // ---- fascia 5: molto astratte ----
    C(5,"Concetti di tempo","ora giorno settimana secolo epoca istante era stagione","unità di tempo|misure del tempo|periodi di tempo|tempo","Misure"),
    C(5,"Valori civili","libertà uguaglianza giustizia solidarietà legalità fratellanza democrazia tolleranza","principi|ideali|valori","Valori"),
    C(5,"Processi mentali","memoria attenzione ragionamento percezione immaginazione giudizio intuizione apprendimento","funzioni cognitive|funzioni mentali|facoltà mentali|abilità cognitive","Funzioni"),
    C(5,"Fenomeni sociali","migrazione urbanizzazione globalizzazione disoccupazione inflazione emarginazione secolarizzazione sovrappopolazione","problemi sociali|fenomeni collettivi","Società"),
    C(5,"Operazioni matematiche","addizione sottrazione moltiplicazione divisione radice potenza logaritmo derivata","calcoli|operazioni","Matematica"),
    C(5,"Esperienze sensoriali","vista udito tatto olfatto gusto equilibrio dolore propriocezione","sensi|percezioni","Percezioni")
  ];
  CLASSIFICAZIONI.forEach(function(c){ c.w = c.w.map(function(x){ return x.replace(/_/g," "); }); });
  if (typeof module !== "undefined" && module.exports) module.exports = CLASSIFICAZIONI;
  else root.CLASSIFICAZIONI = CLASSIFICAZIONI;
})(typeof window !== "undefined" ? window : globalThis);
