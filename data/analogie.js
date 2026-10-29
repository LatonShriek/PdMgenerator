// Banca per «Analogie» (ispirato al subtest Relazioni del VRT): A : B = C : ?
// Coppie raggruppate per tipo di relazione; t = fascia di astrazione 1-5; le coppie sono ordinate dalla più
// immediata alla meno immediata. «A:B/alt1/alt2» = risposte alternative accettate per B.
// stato = "proposta": in bozza, DA VALIDARE da Rodrigo (non è materiale del VRT).
// Doppio uso: script classico nel browser e modulo in Node (test).
(function(root){
  function R(id, nome, t, testo, coppie){
    return { id:id, nome:nome, t:t, stato:"proposta", testo:testo,
      coppie: coppie.split(" ").map(function(p){ var q=p.split(":"), r=q[1].split("/"); return {a:q[0].replace(/_/g," "), b:r[0].replace(/_/g," "), ok:r.slice(1).map(function(x){return x.replace(/_/g," ");})}; }) };
  }
  var ANALOGIE = [
    R("contrario","Contrari",1,"è il contrario di",
      "caldo:freddo alto:basso giorno:notte grande:piccolo aperto:chiuso pieno:vuoto veloce:lento giovane:vecchio dentro:fuori salire:scendere ricco:povero luce:buio lungo:corto duro:morbido asciutto:bagnato sano:malato vicino:lontano forte:debole pesante:leggero"),
    R("categoria","Esempio e categoria",1,"è un esempio di",
      "cane:animale rosa:fiore mela:frutta sedia:mobile auto:veicolo martello:attrezzo pino:albero carota:verdura chitarra:strumento rosso:colore camicia:indumento calcio:sport tulipano:fiore leone:animale violino:strumento arancia:frutta tavolo:mobile pantaloni:indumento tennis:sport treno:veicolo"),
    R("parte","Parte e tutto",1,"è una parte di",
      "ruota:auto pagina:libro petalo:fiore dito:mano foglia:albero tasto:pianoforte lancetta:orologio mattone:muro ala:uccello manubrio:bicicletta finestra:casa radice:albero suola:scarpa maniglia:porta manico:pentola lente:occhiali pedale:bicicletta"),
    R("strumento","Strumento e funzione",2,"serve per",
      "forbici:tagliare penna:scrivere ago:cucire pennello:dipingere forchetta:mangiare chiave:aprire ombrello:ripararsi/proteggersi occhiali:vedere telefono:chiamare/telefonare scopa:spazzare matita:disegnare martello:battere pentola:cuocere pala:scavare fiammifero:accendere freno:fermare ascia:spaccare trapano:forare bilancia:pesare"),
    R("luogo","Professione e luogo di lavoro",2,"lavora in",
      "medico:ospedale insegnante:scuola cuoco:cucina giudice:tribunale contadino:campo sacerdote:chiesa bibliotecario:biblioteca pescatore:mare attore:teatro farmacista:farmacia marinaio:nave infermiere:ospedale cassiere:banca meccanico:officina fornaio:forno barista:bar poliziotto:commissariato astronauta:spazio pilota:aereo commesso:negozio ricercatore:laboratorio"),
    R("attrezzo","Professione e attrezzo",2,"usa",
      "pittore:pennello sarto:ago chirurgo:bisturi falegname:sega fotografo:macchina_fotografica muratore:cazzuola astronomo:telescopio barbiere:rasoio giardiniere:cesoie agricoltore:aratro/trattore cuoco:mestolo meccanico:chiave dentista:trapano pescatore:rete contadino:zappa scrittore:penna pompiere:idrante ciabattino:martello"),
    R("contenitore","Contenitore e contenuto",3,"contiene",
      "portafoglio:denaro/soldi vaso:fiori valigia:abiti/vestiti serbatoio:carburante/benzina pentola:minestra/cibo teiera:tè biblioteca:libri acquario:pesci magazzino:merci bicchiere:acqua/bevanda frigorifero:cibi fienile:fieno cantina:vino cassaforte:preziosi zaino:libri"),
    R("materiale","Materiale e prodotto",3,"serve per fare",
      "lana:maglione farina:pane uva:vino latte:formaggio argilla:mattone/vaso cotone:camicia legno:mobile/tavolo pelle:scarpa olive:olio marmo:statua sabbia:vetro ferro:cancello carta:libro pietra:muro cuoio:borsa ceramica:piatto cera:candela zucchero:dolce"),
    R("sinonimo","Sinonimi",3,"significa quasi lo stesso di",
      "felice:contento veloce:rapido ricco:benestante coraggioso:audace triste:malinconico stanco:affaticato furbo:astuto vecchio:anziano brutto:sgradevole silenzioso:tranquillo simpatico:piacevole rumoroso:fragoroso sporco:lurido strano:bizzarro cominciare:iniziare finire:terminare bello:grazioso"),
    R("causa","Causa ed effetto",4,"ha come effetto",
      "fuoco:cenere/fumo pioggia:pozzanghera/fango sole:abbronzatura freddo:brividi sforzo:sudore/stanchezza studio:conoscenza/sapere taglio:cicatrice semina:raccolto vento:onde sonno:sbadiglio corto_circuito:blackout incendio:distruzione siccità:carestia fumo:tosse urto:ammaccatura terremoto:macerie esercizio:muscoli"),
    R("grado","Grado crescente",4,"è meno intenso o più piccolo di",
      "ruscello:fiume collina:montagna stagno:lago lago:mare pioggerella:diluvio mormorio:grido passeggiata:maratona sentiero:autostrada fresco:gelido tiepido:caldo brezza:uragano sussurro:urlo tepore:calura sorriso:risata scintilla:incendio spintone:colpo"),
    R("trasformazione","Trasformazione",4,"diventa",
      "girino:rana bruco:farfalla seme:pianta uovo:pulcino bambino:adulto ghiaccio:acqua boccio:fiore neve:acqua cucciolo:adulto farina:pane acqua:vapore fiore:frutto ghianda:quercia bozzolo:farfalla mosto:vino pulcino:gallina"),
    R("opera","Autore e opera",5,"è l'autore di",
      "Dante:Divina_Commedia/Inferno Leonardo:Gioconda/Monna_Lisa Manzoni:Promessi_Sposi Verdi:Traviata/Aida/Rigoletto Michelangelo:David/Pietà/Cappella_Sistina Collodi:Pinocchio Marconi:radio Colombo:America Puccini:Tosca/Bohème Boccaccio:Decameron Verga:I_Malavoglia Rossini:Il_Barbiere_di_Siviglia Raffaello:Scuola_di_Atene Volta:pila Gutenberg:stampa Leopardi:L_infinito Meucci:telefono"),
    R("simbolo","Simbolo e significato",5,"è il simbolo di",
      "colomba:pace bilancia:giustizia corona:regalità fede_nuziale:matrimonio bandiera:nazione cuore:amore croce_rossa:soccorso/aiuto arcobaleno:speranza crisantemo:lutto/morte scudo:difesa/protezione ulivo:pace clessidra:tempo lucchetto:sicurezza lauro:vittoria"),
    // ==== AMPLIAMENTO (passo 11): relazioni più astratte (istituzioni, concetti, norme, scopi) e più coppie; stesse regole, sempre 2 coppie per quesito ====
    // ---- fascia 1 ----
    R("verso","Animale e verso",1,"fa il verso",
      "cane:abbaiare gatto:miagolare mucca:muggire pecora:belare gallo:cantare cavallo:nitrire leone:ruggire ape:ronzare rana:gracidare asino:ragliare serpente:sibilare lupo:ululare"),
    R("cucciolo","Animale adulto e cucciolo",1,"da piccolo si chiama",
      "cavallo:puledro mucca:vitello pecora:agnello gallina:pulcino capra:capretto cervo:cerbiatto oca:papero rana:girino orso:orsetto leone:leoncino anatra:anatroccolo"),
    R("femminile","Maschile e femminile",1,"al femminile diventa",
      "gallo:gallina toro:mucca re:regina attore:attrice leone:leonessa principe:principessa cameriere:cameriera maestro:maestra dottore:dottoressa cavallo:cavalla studente:studentessa pittore:pittrice"),
    // ---- fascia 2 ----
    R("collettivo","Individuo e gruppo",2,"in gruppo forma",
      "pecora:gregge lupo:branco ape:sciame pesce:banco stella:costellazione albero:bosco isola:arcipelago soldato:esercito uccello:stormo giocatore:squadra cantante:coro libro:biblioteca"),
    R("abitazione","Animale e abitazione",2,"vive in",
      "ape:alveare uccello:nido ragno:ragnatela volpe:tana cavallo:stalla cane:canile gallina:pollaio formica:formicaio maiale:porcile castoro:diga pecora:ovile pesce:acquario"),
    R("segnale","Segnale e significato",2,"indica",
      "semaforo_rosso:fermarsi bandiera_bianca:resa sirena:allarme fischio_dell'arbitro:interruzione sveglia:risveglio campanello:ingresso lampeggiante:emergenza freccia:svolta clacson:avvertimento fumata_bianca:elezione bandiera_a_scacchi:traguardo gong:inizio"),
    R("risultato","Azione e risultato",2,"produce",
      "scrivere:lettera cucinare:pasto dipingere:quadro costruire:casa cucire:abito comporre:musica scavare:buca disegnare:schizzo impastare:pane intrecciare:cesto scolpire:statua"),
    R("luogoazione","Luogo e attività",2,"ci si va per",
      "biblioteca:leggere stadio:tifare piscina:nuotare ospedale:curarsi scuola:imparare cinema:guardare palestra:allenarsi chiesa:pregare banca:depositare mercato:comprare museo:ammirare ristorante:mangiare"),
    // ---- fascia 3 ----
    R("proprieta","Cosa e proprietà tipica",3,"è caratterizzato da",
      "ghiaccio:freddo fuoco:calore diamante:durezza seta:morbidezza limone:acidità miele:dolcezza notte:buio deserto:aridità piuma:leggerezza neve:candore lama:affilatura"),
    R("unita","Unità e grandezza",3,"è l'unità che misura",
      "metro:lunghezza litro:capacità grammo:peso secondo:tempo grado:temperatura watt:potenza ettaro:superficie volt:tensione decibel:intensità_sonora euro:valore"),
    R("strumentomisura","Strumento di misura e grandezza",3,"misura",
      "termometro:temperatura bilancia:peso orologio:tempo righello:lunghezza barometro:pressione tachimetro:velocità cronometro:durata bussola:direzione anemometro:vento sismografo:terremoto altimetro:altitudine contatore:consumo"),
    R("rimedio","Rimedio e problema",3,"serve a combattere",
      "occhiali:miopia cerotto:ferita ombrello:pioggia diga:inondazione vaccino:contagio antifurto:furto sapone:sporco crema_solare:scottatura salvagente:annegamento estintore:incendio cintura_di_sicurezza:incidente aspirina:dolore"),
    R("prodottomestiere","Mestiere e prodotto",3,"produce",
      "panettiere:pane calzolaio:scarpe sarto:abiti vasaio:vasi falegname:mobili contadino:grano pescatore:pesce tipografo:libri vetraio:vetri casaro:formaggio pasticcere:dolci muratore:muri"),
    R("insieme","Elemento e insieme astratto",3,"è un elemento di",
      "capitolo:libro verso:poesia atto:dramma articolo:legge nota:melodia fotogramma:film pennellata:dipinto tappa:viaggio anello:catena episodio:serie scena:film lettera:parola"),
    // ---- fascia 4 ----
    R("studioso","Studioso e oggetto di studio",4,"studia",
      "geologo:rocce astronomo:astri botanico:piante zoologo:animali archeologo:reperti sociologo:società psicologo:mente storico:passato linguista:lingue meteorologo:atmosfera cardiologo:cuore entomologo:insetti"),
    R("atto","Professionista e suo atto",4,"redige o emette",
      "giudice:sentenza architetto:progetto medico:diagnosi notaio:atto giornalista:articolo traduttore:traduzione legislatore:legge critico:recensione perito:perizia arbitro:decisione ingegnere:calcolo"),
    R("terapia","Terapia e disturbo",4,"si usa contro",
      "antibiotico:infezione insulina:diabete fisioterapia:rigidità protesi:amputazione chemioterapia:tumore bendaggio:distorsione apparecchio_acustico:sordità dieta:obesità sedativo:agitazione analgesico:dolore ossigeno:insufficienza_respiratoria"),
    R("meta","Azione e meta",4,"ha come scopo",
      "viaggiare:destinazione studiare:conoscenza curare:guarigione votare:elezione allenarsi:forma addestrare:abilità negoziare:accordo coltivare:raccolto restaurare:recupero cercare:scoperta difendere:protezione educare:formazione"),
    R("contrarioastratto","Contrari astratti",4,"è il contrario di",
      "libertà:schiavitù pace:guerra verità:menzogna coraggio:viltà giustizia:ingiustizia ricchezza:miseria sapere:ignoranza abbondanza:carestia concordia:discordia lode:biasimo fiducia:sospetto onestà:disonestà"),
    R("sinonimoastratto","Sinonimi astratti",4,"significa quasi lo stesso di",
      "saggezza:sapienza ostinazione:testardaggine pazienza:sopportazione audacia:ardimento tristezza:mestizia astuzia:scaltrezza disprezzo:sdegno rancore:risentimento paura:timore sincerità:franchezza orgoglio:fierezza umiltà:modestia"),
    R("norma","Regola e violazione",4,"se non rispettata dà luogo a",
      "legge:reato regola:infrazione contratto:inadempienza orario:ritardo promessa:tradimento divieto:trasgressione confine:sconfinamento giuramento:spergiuro patto:rottura obbligo:evasione"),
    // ---- fascia 5 ----
    R("istituzione","Istituzione e scopo",5,"esiste per garantire",
      "scuola:istruzione tribunale:giustizia ospedale:salute banca:risparmio esercito:difesa parlamento:legislazione polizia:sicurezza biblioteca:cultura museo:conservazione sindacato:tutela assicurazione:protezione"),
    R("animalequalita","Animale e qualità simbolica",5,"è il simbolo di",
      "volpe:astuzia leone:coraggio formica:laboriosità colomba:pace gufo:saggezza serpente:inganno pavone:vanità agnello:mitezza lepre:velocità tartaruga:lentezza aquila:potenza cane:fedeltà"),
    R("complementare","Concetti complementari",5,"si accompagna a",
      "diritto:dovere colpa:pena dare:ricevere insegnare:imparare medico:paziente vendita:acquisto comando:obbedienza promettere:mantenere produzione:consumo teoria:prassi domanda:risposta"),
    R("intensita","Intensità crescente di stati d'animo",5,"è meno intenso di",
      "simpatia:amore irritazione:rabbia preoccupazione:angoscia stima:ammirazione disappunto:indignazione tristezza:disperazione sorpresa:stupore affetto:passione dispiacere:dolore interesse:ossessione"),
    R("eccesso","Virtù e suo eccesso",5,"portata all'eccesso degenera in",
      "coraggio:temerarietà risparmio:avarizia fiducia:ingenuità sicurezza:arroganza generosità:prodigalità prudenza:diffidenza ambizione:avidità orgoglio:superbia curiosità:morbosità assertività:aggressività")
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = ANALOGIE;
  else root.ANALOGIE = ANALOGIE;
})(typeof window !== "undefined" ? window : globalThis);
