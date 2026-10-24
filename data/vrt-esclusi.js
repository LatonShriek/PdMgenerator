// Materiale del VRT (Verbal Reasoning Test, Basagni et al. 2017) da NON riprodurre nei nuovi esercizi.
// Per le parentele: i nomi propri usati nel protocollo originale, esclusi dalle banche di nomi
// perché nessun quesito generato richiami un item del test (stessa struttura con nomi diversi sì,
// stessi nomi no). Altri esercizi aggiungeranno qui le proprie liste.
// Doppio uso: script classico nel browser (variabile globale) e modulo in Node (test).
(function(root){
  var VRT_ESCLUSI = {
    nomi: ["Lucia","Silvia","Emma","Franco","Maria","Luca","Marco","Mario","Luisa","Matteo","Paolo","Nina",
      "Roberto","Carlo","Simona","Ettore","Anna","Giuseppe","Iole","Loredana","Vittorio","Daniele","Simone",
      "Rocco","Dino","Rosario","Francesco","Michele","Sara"]
  };
  if (typeof module !== "undefined" && module.exports) module.exports = VRT_ESCLUSI;
  else root.VRT_ESCLUSI = VRT_ESCLUSI;
})(typeof window !== "undefined" ? window : globalThis);
