// Esportazione PowerPoint — Intruso percettivo (comprende le misure del carattere per adattarlo alla cella).
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

// Larghezza reale per carattere (rapporto rispetto al fontSize), misurata rendendo OGNI
// singolo carattere di OGNI pool a 100pt e leggendo la larghezza effettiva del testo (non
// un valore teorico, e non solo i primi caratteri del pool: la prima calibrazione usava
// per errore un campione non rappresentativo — es. i numeri romani "Ⅰ Ⅱ Ⅲ" sono stretti,
// ma "Ⅷ" nello stesso pool è quasi il triplo; il cirillico "А Б В" è normale, ma "Э Ж Щ"
// nello stesso pool sono molto più larghi). Qui si usa il carattere PIÙ LARGO di ciascun
// pool, con un margine di sicurezza del 15% sopra il valore misurato.
// Famiglie il cui carattere va dimensionato sull'ingombro REALE del glifo (non su una stima per
// famiglia): mahjong, domino e semi delle carte disegnano una tessera molto più piccola del
// riquadro del carattere, per cui con la stima fissa restavano a circa un terzo dello spazio.
const INTRUSO_INK_FIT = new Set(["mahjong","domino","suits"]);

const INTRUSO_FILL = 0.84;

let _inkCanvas = null;

// Ingombro del glifo per unità di corpo (larghezza e altezza totali, misurate rispetto al centro
// della riga, che è dove il testo viene centrato nella cella). Restituisce null se il browser
// non sa misurarlo: si ricade allora sul calcolo per famiglia di prima.
function measureInkRatio(items, fontFamily){
  try{
    _inkCanvas = _inkCanvas || document.createElement("canvas");
    const ctx = _inkCanvas.getContext("2d");
    const SZ = 200;
    ctx.font = `${SZ}px ${fontFamily}`;
    let rw = 0, rh = 0;
    [...new Set(items.map(String))].forEach(it=>{
      const m = ctx.measureText(it);
      const halfW = Math.max(m.width/2 + m.actualBoundingBoxLeft, m.actualBoundingBoxRight - m.width/2);
      let halfH;
      if(m.fontBoundingBoxAscent!=null && m.fontBoundingBoxDescent!=null){
        const centerAboveBaseline = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
        halfH = Math.max(m.actualBoundingBoxAscent - centerAboveBaseline, m.actualBoundingBoxDescent + centerAboveBaseline);
      } else {
        halfH = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2;
      }
      rw = Math.max(rw, 2*halfW/SZ);
      rh = Math.max(rh, 2*halfH/SZ);
    });
    return (rw>0 && rh>0) ? {rw, rh} : null;
  } catch(e){ return null; }
}

// Corpo massimo (nella stessa unità di cellW/cellH) per cui il glifo sta nella cella.
function fitInkFontSize(items, cellW, cellH, fontFamily, fill){
  const r = measureInkRatio(items, fontFamily);
  return r ? Math.min(cellW*fill/r.rw, cellH*fill/r.rh) : null;
}

const INTRUSO_FAMILY_CHAR_WIDTH = {
  digit: 0.6, letter: 0.95, roman: 1.85,
  cyrillic: 1.05, armenian: 1.05, thai: 1.0, geez: 1.25, "cyrillic-arcaico": 1.3, canadian: 1.4,
  arrow: 1.0, geometric: 1.0, suits: 1.3, music: 1.05, punct: 0.9, zodiac: 1.3,
  dice: 1.2, domino: 1.4, mahjong: 1.45, cjk: 1.1,
  // famiglie nuove — valori prudenziali (non misurati su font reali): meglio un carattere un po' più
  // piccolo che un testo che esce dalla cella
  lower: 0.95, mixedcase: 1.05, greek: 1.1, katakana: 1.25, hiragana: 1.25, hebrew: 1.0, devanagari: 1.2,
  circles: 1.3, quadrants: 1.3, box: 1.1, sets: 1.2, braille: 1.2,
};

// larghezza per simbolo quando l'elemento è una coppia/terna di glifi pittografici (più stretta della stima prudente per il singolo)
const INTRUSO_GROUP_CHAR_WIDTH = { suits:1.15, zodiac:1.1 };

const INTRUSO_DEFAULT_TEXT_CHAR_WIDTH = 0.95;

 // famiglie testuali non calibrate esplicitamente
const INTRUSO_DEFAULT_ATOMIC_CHAR_WIDTH = 1.0;

 // famiglie a glifo singolo non calibrate esplicitamente
function exportIntruso(deck, level){
  // Esporta l'intera sessione (tutte le schermate del mazzo, non solo quella a video),
  // come nei file originali che contengono più slide per sessione.
  const p = new PptxGenJS();
  p.layout = "LAYOUT_WIDE"; // 13.33x7.5in
  const SLIDE_W=13.33, SLIDE_H=7.5, MARGIN=0.3;
  const areaW = SLIDE_W - MARGIN*2, areaH = SLIDE_H - MARGIN*2;
  // Dopo ogni schermata, di norma, una slide uguale con un cerchio rosso attorno all'unico elemento (soluzione): si disattiva dalla barra laterale.
  const withSolution = state.intrusoSolutionSlides !== false;
  deck.slides.forEach((s,si)=>{
   [false, true].filter(sol=>!sol || withSolution).forEach(solution=>{
    const slide = p.addSlide();
    slide.background = {color:"FFFFFF"};
    slide.addNotes(solution
      ? `Livello ${level}. SOLUZIONE della schermata ${si+1}/${deck.slides.length} (${s.familyLabel}): ${s.answer}`
      : `Livello ${level}. Schermata ${si+1}/${deck.slides.length} (${s.familyLabel}). ${s.rule}`);
    const n = s.items.length;
    // Numero di colonne come nell'anteprima (bestGridCols): solo divisori esatti di n, così
    // l'ultima riga è sempre piena quanto le altre, mai una riga a metà.
    const cols = bestGridCols(n, areaW, areaH);
    const rows = n / cols;
    const cellW = areaW/cols, cellH = areaH/rows;
    // Il font è vincolato sia dall'altezza sia dalla larghezza della cella: le famiglie
    // testuali ai livelli alti arrivano a stringhe di 5 caratteri, quindi la sola altezza
    // non basta a evitare che il testo esca dalla cella in orizzontale. Il rapporto
    // larghezza/font varia per famiglia (vedi INTRUSO_FAMILY_CHAR_WIDTH sopra) — mai un
    // singolo valore fisso uguale per tutte, che è esattamente ciò che causava lo
    // sformarsi dei numeri romani.
    const itemLen = Math.max(1, ...s.items.map(it=>[...String(it)].length));
    const isAtomic = itemLen === 1 && INTRUSO_ATOMIC_FAMILIES.some(f=>f.id===s.familyId);
    // (le famiglie a pool ristretto ai livelli alti hanno elementi di 2-3 simboli: itemLen li
    // conta già, e la larghezza per simbolo resta quella calibrata della famiglia)
    const charWidth = INTRUSO_FAMILY_CHAR_WIDTH[s.familyId]
      ?? (isAtomic ? INTRUSO_DEFAULT_ATOMIC_CHAR_WIDTH : INTRUSO_DEFAULT_TEXT_CHAR_WIDTH);
    // Margine di altezza più prudente (32 invece di 40): un po' di scorta in più nel caso
    // in cui, nonostante la calibrazione, il testo vada comunque a capo su due righe.
    const fontSizeByHeight = cellH*32;
    // Elementi di 2-3 simboli: la coppia/terna occupa solo una parte della cella (62% / 74%), così lo
    // spazio TRA le coppie è nettamente più grande di quello DENTRO la coppia e si leggono come unità
    // distinte (segnalato da Rodrigo su zodiaco e semi delle carte, dove si toccavano o si sovrapponevano).
    const groupFrac = itemLen>=3 ? 0.74 : (itemLen===2 ? 0.62 : 0.85);
    const effCharWidth = (itemLen>=2 && INTRUSO_GROUP_CHAR_WIDTH[s.familyId]) || charWidth;
    const fontSizeByWidth = (cellW*72*groupFrac) / itemLen / effCharWidth;
    let fontSize = Math.floor(Math.min(fontSizeByHeight, fontSizeByWidth));
    // Tessere (mahjong, domino, semi): corpo calcolato sull'ingombro reale del glifo, il più grande
    // possibile restando dentro la cella (cellW/cellH sono in pollici → punti).
    // (l'ingombro misurato nel browser vale per il glifo singolo: con coppie/terne il font di PowerPoint
    // può essere più largo e i glifi si sovrapporrebbero, quindi si usa il calcolo per larghezza)
    const inkFit = (INTRUSO_INK_FIT.has(s.familyId) && itemLen===1)
      ? fitInkFontSize(s.items, cellW*72, cellH*72, PPTX_FONT_STACK, INTRUSO_FILL) : null;
    if(inkFit) fontSize = Math.max(10, Math.min(400, Math.floor(inkFit)));
    const framed = intrusoFramed(s.familyId, itemLen);
    // Con gli orientamenti: il corpo si riduce perché l'elemento ruotato (qualunque angolo usato nella schermata) stia nella cella; la cornice
    // resta dritta e di misura fissa, ruota solo il testo. Ogni elemento è una casella di testo grande quanto il suo ingombro, centrata nella
    // cella, con la rotazione del riquadro (verificata in LibreOffice; il testo specchiato invece non si può fare, per questo niente speculari).
    const rotAngles = (s.orient>1 && s.angles) ? [...new Set(s.angles)] : null;
    const rbox = rotAngles ? intrusoRotBox(itemLen, effCharWidth, rotAngles, framed) : null;
    if(rbox){
      fontSize = Math.max(8, Math.floor(Math.min(fontSize, (cellW*72*0.92)/rbox.W, (cellH*72*0.92)/rbox.H)));
    }
    s.items.forEach((it,i)=>{
      const r = Math.floor(i/cols), c = i%cols;
      if(rbox){
        const cx = MARGIN+c*cellW+cellW/2, cy = MARGIN+r*cellH+cellH/2;
        if(framed){
          const fw = rbox.W*fontSize/72, fh = rbox.H*fontSize/72;
          slide.addShape((p.ShapeType && p.ShapeType.roundRect) || "roundRect", {
            x:cx-fw/2, y:cy-fh/2, w:fw, h:fh, fill:{color:"FFFFFF"}, line:{color:"8A948E", width:1.5}, rectRadius:0.1
          });
        }
        const tw = rbox.w*fontSize/72, th = rbox.h*fontSize/72;
        slide.addText(it, {
          x:cx-tw/2, y:cy-th/2, w:tw, h:th, rotate:(s.angles && s.angles[i])||0,
          align:"center", valign:"middle", fontSize, bold:true, color:"1E2A26", isTextBox:true, wrap:false, margin:0
        });
        return;
      }
      if(framed){
        // cornice sottile attorno all'elemento (vedi intrusoFramed): larga quanto il testo + un po' d'aria, mai oltre la cella
        const fw = Math.min(cellW*0.94, fontSize/72*itemLen*effCharWidth*1.12 + 0.16), fh = Math.min(cellH*0.92, fontSize/72*1.35);
        slide.addShape((p.ShapeType && p.ShapeType.roundRect) || "roundRect", {
          x:MARGIN+c*cellW+(cellW-fw)/2, y:MARGIN+r*cellH+(cellH-fh)/2, w:fw, h:fh,
          fill:{color:"FFFFFF"}, line:{color:"8A948E", width:1.5}, rectRadius:0.1
        });
      }
      slide.addText(it, {
        x:MARGIN+c*cellW, y:MARGIN+r*cellH, w:cellW, h:cellH,
        align:"center", valign:"middle", fontSize, bold:true, color:"1E2A26",
        isTextBox:true, wrap:false,
        // con il corpo calcolato sul glifo la riga può risultare più alta della cella: niente
        // "riduci al testo" (che in PowerPoint rimpicciolirebbe tutto alla prima modifica) e niente margini interni
        ...(inkFit ? { margin:0 } : { fit:"shrink" })
      });
    });
    if(solution){
      const ro = Math.floor(s.oddIndex/cols), co = s.oddIndex%cols;
      const d = Math.min(cellW, cellH)*0.97;
      slide.addShape((p.ShapeType && p.ShapeType.ellipse) || "ellipse", {
        x:MARGIN+co*cellW+(cellW-d)/2, y:MARGIN+ro*cellH+(cellH-d)/2, w:d, h:d,
        fill:{type:"none"}, line:{color:"E02424", width:5}
      });
    }
   });
  });
  return p.writeFile({fileName:exportFileName("intruso", level, "pptx")});
}
