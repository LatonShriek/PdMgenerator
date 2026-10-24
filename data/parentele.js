// Dati per l'esercizio "Parentele" (ispirato alle Relazioni di familiarità del VRT, ma con quesiti
// generati da un albero genealogico). Nomi: devono essere ≥60 maschili e ≥60 femminili, senza i
// nomi del VRT (vedi vrt-esclusi.js, filtrati dal generatore) e senza omonimi fra i due elenchi.
(function(root){
  var PARENTELE_NOMI = {
    M: ["Alberto","Alessandro","Andrea","Angelo","Antonio","Arturo","Benedetto","Bruno","Camillo","Cesare",
      "Claudio","Corrado","Cristiano","Damiano","Davide","Diego","Domenico","Edoardo","Elia","Emilio",
      "Enrico","Enzo","Fabio","Federico","Filippo","Fulvio","Gabriele","Gaetano","Giacomo","Gianni",
      "Giorgio","Giovanni","Giulio","Guido","Igor","Ivo","Leonardo","Lorenzo","Luciano","Manuel",
      "Massimo","Mauro","Nicola","Oscar","Pietro","Raffaele","Renato","Riccardo","Salvatore","Sandro",
      "Sergio","Stefano","Tommaso","Ugo","Valerio","Vincenzo","Walter","Aldo","Bernardo","Fausto",
      "Gino","Osvaldo"],
    F: ["Adele","Agnese","Alba","Alessia","Alice","Amalia","Antonella","Barbara","Beatrice","Bianca",
      "Camilla","Carla","Carolina","Cecilia","Chiara","Clara","Claudia","Costanza","Daniela","Debora",
      "Elena","Eleonora","Elisa","Emanuela","Enrica","Erica","Eva","Fabiola","Federica","Fiorella",
      "Flavia","Francesca","Gabriella","Gemma","Giada","Giovanna","Giulia","Ilaria","Irene","Laura",
      "Letizia","Lidia","Linda","Lisa","Manuela","Marta","Martina","Michela","Monica","Nadia",
      "Nicoletta","Olga","Paola","Patrizia","Rita","Roberta","Rosa","Silvana","Teresa","Valentina",
      "Vera","Viola"]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = PARENTELE_NOMI;
  else root.PARENTELE_NOMI = PARENTELE_NOMI;
})(typeof window !== "undefined" ? window : globalThis);
