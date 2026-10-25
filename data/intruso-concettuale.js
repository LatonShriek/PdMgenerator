// Dati per «Intruso concettuale» (ispirato al subtest Intruso del VRT): tre parole della stessa categoria
// (banca di Classificazioni) + una di un'altra. Qui: il dominio di ogni categoria, per graduare la
// distanza dell'intruso (altro dominio = lontano = facile; stesso dominio = vicino = difficile).
// Doppio uso: script classico nel browser e modulo in Node (test).
(function(root){
  function D(dominio, nomi){ var o={}; nomi.split("|").forEach(function(n){ o[n]=dominio; }); return o; }
  var DOMINI = Object.assign({},
    D("cibo","Frutta|Verdura|Dolci|Cereali|Spezie|Formaggi|Pasta|Bevande"),
    D("animali","Animali domestici|Uccelli|Pesci|Insetti|Animali della fattoria"),
    D("natura","Fiori|Alberi|Rocce e minerali|Fenomeni atmosferici|Pianeti"),
    D("casa","Mobili|Utensili da cucina|Elettrodomestici|Posate|Cancelleria|Giocattoli"),
    D("vestiario","Indumenti|Calzature|Gioielli|Tessuti"),
    D("trasporti","Mezzi di trasporto|Mezzi pubblici"),
    D("luoghi","Edifici"),
    D("corpo","Parti del corpo|Malattie|Esperienze sensoriali|Medici specialisti"),
    D("lavoro","Mestieri|Professioni artistiche|Cariche istituzionali|Attrezzi da lavoro|Materiali da costruzione|Metalli"),
    D("cultura","Strumenti musicali|Generi letterari|Stili artistici|Figure retoriche|Sport|Giochi da tavolo|Religioni"),
    D("scienza","Unità di misura|Strumenti di misura|Operazioni matematiche|Discipline scientifiche|Forme geometriche|Concetti di tempo|Stagioni|Punti cardinali|Colori"),
    D("mente","Emozioni|Virtù|Difetti|Valori civili|Processi mentali|Sentimenti d'amore"),
    D("societa","Forme di governo|Fenomeni sociali|Documenti|Mezzi di comunicazione"),
    // ampliamento (passo 11)
    D("corpo","Articolazioni|Organi interni|Fasi della vita|Reparti ospedalieri|Agenti patogeni"),
    D("cultura","Strumenti a fiato|Atti linguistici|Parti del discorso|Sistemi di scrittura|Elementi del racconto|Modi verbali"),
    D("scienza","Fonti di energia|Parti del giorno|Cose trasparenti|Grandezze fisiche|Elementi chimici|Concetti di quantità|Concetti di spazio|Processi di cambiamento"),
    D("societa","Mezzi di pagamento|Gradi di istruzione|Cose che scadono|Reati|Settori economici|Istituzioni pubbliche|Relazioni sociali|Forme di conflitto|Ricompense e punizioni|Concetti economici|Istituzioni sociali"),
    D("natura","Fenomeni geologici|Corpi idrici"),
    D("casa","Cose fragili|Cose che si piegano"),
    D("cibo","Nutrienti"),
    D("lavoro","Fasi di un progetto"),
    D("casa","Stanze della casa|Prodotti per l'igiene|Cose per scrivere"),
    D("luoghi","Negozi"),
    D("cibo","Prodotti da forno|Condimenti|Carni e salumi|Frutta secca|Legumi"),
    D("trasporti","Parti dell'auto"),
    D("mente","Tipi di ragionamento|Concetti logici|Bisogni umani|Concetti di probabilità|Strategie di memoria|Qualità del pensiero")
  );
  if (typeof module !== "undefined" && module.exports) module.exports = DOMINI;
  else root.INTRUSO_DOMINI = DOMINI;
})(typeof window !== "undefined" ? window : globalThis);
