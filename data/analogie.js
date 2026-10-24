// Banca per «Analogie» (ispirato al subtest Relazioni del VRT): A : B = C : ?
// Coppie raggruppate per tipo di relazione; t = fascia di astrazione 1-5; le coppie sono ordinate dalla più
// immediata alla meno immediata. «A:B/alt1/alt2» = risposte alternative accettate per B.
// stato = "proposta": scritta da Claude, DA VALIDARE da Rodrigo (non è materiale del VRT).
// Doppio uso: script classico nel browser e modulo in Node (test).
(function(root){
  function R(id, nome, t, testo, coppie){
    return { id:id, nome:nome, t:t, stato:"proposta", testo:testo,
      coppie: coppie.split(" ").map(function(p){ var q=p.split(":"), r=q[1].split("/"); return {a:q[0].replace(/_/g," "), b:r[0].replace(/_/g," "), ok:r.slice(1).map(function(x){return x.replace(/_/g," ");})}; }) };
  }
  var ANALOGIE = [
    R("contrario","Contrari",1,"è il contrario di",
      "caldo:freddo alto:basso giorno:notte grande:piccolo aperto:chiuso pieno:vuoto veloce:lento giovane:vecchio dentro:fuori salire:scendere ricco:povero luce:buio"),
    R("categoria","Esempio e categoria",1,"è un esempio di",
      "cane:animale rosa:fiore mela:frutta sedia:mobile auto:veicolo martello:attrezzo pino:albero carota:verdura chitarra:strumento rosso:colore camicia:indumento calcio:sport"),
    R("parte","Parte e tutto",1,"è una parte di",
      "ruota:auto pagina:libro petalo:fiore dito:mano foglia:albero tasto:pianoforte lancetta:orologio mattone:muro ala:uccello manubrio:bicicletta finestra:casa"),
    R("strumento","Strumento e funzione",2,"serve per",
      "forbici:tagliare penna:scrivere ago:cucire pennello:dipingere forchetta:mangiare chiave:aprire ombrello:ripararsi/proteggersi occhiali:vedere telefono:chiamare/telefonare scopa:spazzare matita:disegnare"),
    R("luogo","Professione e luogo di lavoro",2,"lavora in",
      "medico:ospedale insegnante:scuola cuoco:cucina giudice:tribunale contadino:campo sacerdote:chiesa bibliotecario:biblioteca pescatore:mare attore:teatro farmacista:farmacia marinaio:nave"),
    R("attrezzo","Professione e attrezzo",2,"usa",
      "pittore:pennello sarto:ago chirurgo:bisturi falegname:sega fotografo:macchina_fotografica muratore:cazzuola astronomo:telescopio barbiere:rasoio giardiniere:cesoie agricoltore:aratro/trattore"),
    R("contenitore","Contenitore e contenuto",3,"contiene",
      "portafoglio:denaro/soldi vaso:fiori valigia:abiti/vestiti serbatoio:carburante/benzina pentola:minestra/cibo teiera:tè biblioteca:libri acquario:pesci magazzino:merci bicchiere:acqua/bevanda"),
    R("materiale","Materiale e prodotto",3,"serve per fare",
      "lana:maglione farina:pane uva:vino latte:formaggio argilla:mattone/vaso cotone:camicia legno:mobile/tavolo pelle:scarpa olive:olio marmo:statua sabbia:vetro"),
    R("sinonimo","Sinonimi",3,"significa quasi lo stesso di",
      "felice:contento veloce:rapido ricco:benestante coraggioso:audace triste:malinconico stanco:affaticato furbo:astuto vecchio:anziano brutto:sgradevole silenzioso:tranquillo"),
    R("causa","Causa ed effetto",4,"ha come effetto",
      "fuoco:cenere/fumo pioggia:pozzanghera/fango sole:abbronzatura freddo:brividi sforzo:sudore/stanchezza studio:conoscenza/sapere taglio:cicatrice semina:raccolto vento:onde sonno:sbadiglio"),
    R("grado","Grado crescente",4,"è meno intenso o più piccolo di",
      "ruscello:fiume collina:montagna stagno:lago lago:mare pioggerella:diluvio mormorio:grido passeggiata:maratona sentiero:autostrada fresco:gelido tiepido:caldo"),
    R("trasformazione","Trasformazione",4,"diventa",
      "girino:rana bruco:farfalla seme:pianta uovo:pulcino bambino:adulto ghiaccio:acqua boccio:fiore neve:acqua cucciolo:adulto farina:pane"),
    R("opera","Autore e opera",5,"è l'autore di",
      "Dante:Divina_Commedia/Inferno Leonardo:Gioconda/Monna_Lisa Manzoni:Promessi_Sposi Verdi:Traviata/Aida/Rigoletto Michelangelo:David/Pietà/Cappella_Sistina Collodi:Pinocchio Marconi:radio Colombo:America Puccini:Tosca/Bohème Boccaccio:Decameron"),
    R("simbolo","Simbolo e significato",5,"è il simbolo di",
      "colomba:pace bilancia:giustizia corona:regalità fede_nuziale:matrimonio bandiera:nazione cuore:amore croce_rossa:soccorso/aiuto arcobaleno:speranza crisantemo:lutto/morte scudo:difesa/protezione")
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = ANALOGIE;
  else root.ANALOGIE = ANALOGIE;
})(typeof window !== "undefined" ? window : globalThis);
