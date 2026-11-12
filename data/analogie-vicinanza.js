// Relazioni per «Analogie» con TRAPPOLE esplicite (bozza «proposta», da validare).
// Ogni coppia può portare le risposte-trappola dopo «|»: parole vicine e plausibili che però sono sbagliate per
// quella relazione (il contrario scambiato con un sinonimo, la classe zoologica sbagliata ma confinante, lo
// strumento giusto per un'azione affine…). Nelle risposte a scelta compaiono fra le opzioni; nella risposta
// libera compaiono come «risposte da non accettare».
// Formato coppia: «a:b/alternativa_accettata|trappola1,trappola2». Gli spazi si scrivono con «_».
// Doppio uso: script classico (variabile globale) e modulo in Node.
(function(root){
  function sp(x){ return x.replace(/_/g," "); }
  function R(id, nome, t, testo, coppie){
    return { id:id, nome:nome, t:t, stato:"proposta", testo:testo,
      coppie: coppie.split(" ").map(function(p){
        var parts=p.split("|"), q=parts[0].split(":"), r=q[1].split("/");
        return { a:sp(q[0]), b:sp(r[0]), ok:r.slice(1).map(sp), d:(parts[1]||"").split(",").filter(Boolean).map(sp) };
      }) };
  }
  var V = [
    R("causa2","Causa ed effetto (trappola: oggetti collegati)",3,"ha come effetto",
      "pioggia:pozzanghera|nuvola,ombrello sole:abbronzatura|estate,occhiali freddo:brividi|inverno,cappotto fuoco:cenere|legna,fiammifero digiuno:fame|cibo,dieta sonno:sbadiglio|letto,notte sforzo:sudore|fatica,palestra polvere:starnuto|scopa,pulizia lutto:tristezza|funerale,nero barzelletta:risata|battuta,festa caldo:sudore|estate,ventilatore ferita:cicatrice|cerotto,sangue"),
    R("specialista","Specialista e organo",3,"si occupa di",
      "cardiologo:cuore|polmoni,vene oculista:occhi|orecchie,vista otorino:orecchie|occhi,udito dentista:denti|ossa,gengive ortopedico:ossa|muscoli,denti dermatologo:pelle|capelli,unghie pneumologo:polmoni|cuore,respiro neurologo:cervello|cuore,ossa gastroenterologo:stomaco|cuore,reni nefrologo:reni|fegato,vescica podologo:piedi|mani,gambe ematologo:sangue|ossa,cuore"),
    R("animaleluogo","Animale e luogo di vita preciso",3,"vive in",
      "pecora:ovile|stalla,recinto maiale:porcile|stalla,pollaio gallina:pollaio|ovile,stalla ape:alveare|nido,tana formica:formicaio|alveare,tana volpe:tana|nido,stalla uccello:nido|tana,gabbia cavallo:scuderia|ovile,pollaio ragno:ragnatela|tana,nido cane:canile|stalla,gabbia coniglio:conigliera|stalla,pollaio scimmia:giungla|savana,deserto"),
    R("strumentoazione","Strumento e azione precisa (trappola: azione affine)",3,"serve per",
      "martello:battere|forare,tagliare trapano:forare|avvitare,battere pinza:stringere|tagliare,forare sega:segare|limare,incollare lima:limare|segare,pulire pennello:dipingere|disegnare,scrivere ago:cucire|incollare,tagliare cacciavite:avvitare|forare,battere forbici:tagliare|strappare,incollare colla:incollare|cucire,tagliare scopa:spazzare|lavare,aspirare pala:scavare|raccogliere,piantare ascia:spaccare|segare,forare"),
    R("classezoo","Animale e classe zoologica (trappola: classe confinante)",4,"appartiene alla classe dei",
      "delfino:mammiferi|pesci,balene pipistrello:mammiferi|uccelli,roditori pinguino:uccelli|pesci,mammiferi squalo:pesci|mammiferi,predatori serpente:rettili|vermi,anfibi tartaruga:rettili|anfibi,molluschi ragno:aracnidi|insetti,vermi gambero:crostacei|pesci,molluschi cozza:molluschi|pesci,crostacei rana:anfibi|rettili,insetti coccodrillo:rettili|anfibi,pesci salamandra:anfibi|rettili,insetti"),
    R("contrarioCar","Contrari di carattere (trappola: sinonimo o via di mezzo)",4,"è l'opposto di",
      "avaro:generoso|tirchio,parsimonioso timido:sfacciato|riservato,schivo ottimista:pessimista|fiducioso,speranzoso estroverso:introverso|socievole,aperto prudente:temerario|cauto,attento umile:superbo|modesto,semplice paziente:impaziente|calmo,tollerante ordinato:disordinato|pulito,preciso sincero:falso|onesto,ingenuo coraggioso:vigliacco|temerario,audace calmo:nervoso|tranquillo,sereno allegro:triste|felice,pensieroso")
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = V;
  else root.ANALOGIE_VICINANZA = V;
})(typeof window !== "undefined" ? window : globalThis);
