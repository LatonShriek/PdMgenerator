// Costruttore del documento Word del fascicolo (docbuilder.js).
// Spostato da index.html al passo 8 del refactoring, SENZA cambiare il codice (script classico, stesse variabili globali di prima).
/* =========================================================
   FASCICOLO ESERCIZI A CASA — costruttore documento .docx (docbuilder.js)
   ========================================================= */
// ============================================================================
// Costruisce il Document (libreria "docx") a partire dai dati generati da
// engine.js. Isomorfo: buildFascicoloDocument(docx, data, rasterize) — dove
// `docx` è la libreria (require('docx') in Node, window.docx nel browser) e
// `rasterize` è una funzione async (svgString) => Uint8Array PNG.
//
// Ogni misura qui sotto (font, dimensioni cella, larghezza tabella, immagini)
// è stata estratta byte per byte da un fascicolo originale reale di Rodrigo
// (non stimata): pagina A4, margini 1440 twips, titolo Times New Roman 90pt,
// intestazioni Calibri 25pt/15pt, celle griglia Arial 12pt grassetto centrate,
// tabelle prompt/risposta Arial 25pt con righe alte almeno 0.83".
// ============================================================================
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DocBuilder = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const GRID_CELL_W = 752;      // DXA — una colonna della matrice di simboli (originale)
  const LEGEND_CELL_W = 1500;   // DXA — una colonna della legenda sequenze (6 per riga)
  const PROMPT_LABEL_W = 4350;  // DXA — colonna prompt (originale)
  const PROMPT_ANSWER_W = 4125; // DXA — colonna risposta (originale)
  const PROMPT_ROW_H = 1190;    // DXA — altezza minima riga tabella prompt (originale, ~0.83")
  // Altezza minima di riga per le griglie a 25 righe (prime 3 di ogni fascicolo):
  // senza un'altezza esplicita, Word restringe ogni riga al minimo indispensabile
  // per il testo e la griglia finisce per occupare solo una piccola parte della
  // pagina, lasciando il resto vuoto — bug segnalato da Rodrigo sul fascicolo
  // originale. Con 520 DXA × 25 righe, però, il totale (più titolo/sottotitolo)
  // superava di poco l'altezza utile della pagina A4: l'ultima riga della
  // griglia veniva spinta da sola su una seconda pagina — bug trovato
  // rendendo davvero il documento con LibreOffice e contando le pagine, non
  // solo leggendo il codice. 492 DXA lascia margine sufficiente perché la
  // griglia resti intera su una pagina, verificato.
  const GRID_ROW_H = 492;

  function thinBorders(docx) {
    const { BorderStyle } = docx;
    const edge = { style: BorderStyle.SINGLE, size: 8, color: '000000' };
    return { top: edge, bottom: edge, left: edge, right: edge, insideHorizontal: edge, insideVertical: edge };
  }

  function symbolGridTable(docx, grid, opts = {}) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, VerticalAlign, AlignmentType } = docx;
    // Righe con altezza esplicita SOLO per le griglie grandi (25 righe, piena
    // pagina): la griglia mista (4ª) resta volutamente più piccola e continua
    // ad auto-dimensionarsi sul contenuto, per lasciare spazio alla legenda sotto.
    // opts.compact (solo fascicolo delle soluzioni): margini di cella e altezza riga ridotti, così la
    // griglia a piena pagina lascia sotto lo spazio per il paragrafo di soluzione senza uscire dalla pagina.
    const rowHeight = opts.fillPage ? (opts.compact ? 420 : GRID_ROW_H) : null;
    const cellMarg = opts.compact ? 40 : 100;
    // opts.highlight: Set di "riga,colonna" da evidenziare — SOLO nel fascicolo delle
    // soluzioni (vedi buildFascicoloDocument), per mostrare esattamente dove sono le
    // occorrenze/parole, non solo quante sono.
    const highlight = opts.highlight || null;
    const rows = grid.map((rowArr, r) => new TableRow({
      height: rowHeight ? { value: rowHeight, rule: 'atLeast' } : undefined,
      children: rowArr.map((sym, c) => {
        const isHi = highlight && highlight.has(r + ',' + c);
        return new TableCell({
          width: { size: GRID_CELL_W, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: cellMarg, bottom: cellMarg, left: 100, right: 100 },
          shading: isHi ? { fill: 'FFE9A8' } : undefined,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sym, size: 24, bold: true, font: 'Arial', color: isHi ? '8A5A00' : undefined })] })],
        });
      }),
    }));
    return new Table({
      rows,
      width: { size: GRID_CELL_W * grid[0].length, type: WidthType.DXA },
      columnWidths: grid[0].map(() => GRID_CELL_W),
      borders: thinBorders(docx),
    });
  }

  // Costruisce l'insieme "riga,colonna" da evidenziare a partire da uno o più elenchi di
  // occorrenze nella forma [[r,c],[r,c],...] (una per match) — usata per le griglie 1-3
  // (un solo bersaglio, `occurrences`), per la griglia mista e per il crucipuzzle italiano
  // (più bersagli/parole, ciascuno con il proprio elenco di celle).
  function highlightSetFrom(occurrenceLists) {
    const set = new Set();
    occurrenceLists.forEach(cellsList => {
      cellsList.forEach(([r, c]) => set.add(r + ',' + c));
    });
    return set;
  }

  function legendTable(docx, sequences, counts) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, AlignmentType } = docx;
    const perRow = 6; // come nell'originale: sequenze disposte 6 per riga
    const rowsData = [];
    const countsRowsData = [];
    for (let i = 0; i < sequences.length; i += perRow) {
      rowsData.push(sequences.slice(i, i + perRow));
      if (counts) countsRowsData.push(counts.slice(i, i + perRow));
    }
    const rows = rowsData.map((rowArr, ri) => {
      const cells = rowArr.map((seq, ci) => {
        // Nel fascicolo delle soluzioni il conteggio va accanto a ogni sequenza (stesso
        // dato già mostrato nell'anteprima a schermo con "Mostra risposta"), mai nel
        // fascicolo bianco destinato al paziente.
        const text = counts ? `${seq.join(' ')} (${countsRowsData[ri][ci]})` : seq.join(' ');
        return new TableCell({
          width: { size: LEGEND_CELL_W, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 30, font: 'Arial' })] })],
        });
      });
      while (cells.length < perRow) cells.push(new TableCell({ width: { size: LEGEND_CELL_W, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }));
      return new TableRow({ children: cells });
    });
    return new Table({ rows, width: { size: LEGEND_CELL_W * perRow, type: WidthType.DXA }, columnWidths: Array(perRow).fill(LEGEND_CELL_W), borders: thinBorders(docx) });
  }

  function promptAnswerTable(docx, prompts, answers, opts = {}) {
    const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, AlignmentType, VerticalAlign } = docx;
    // opts (blocco lessicale): consegne lunghe ("seconda lettera «R», penultima «V»") con carattere più
    // piccolo, colonna del testo più larga e righe meno alte, così le 10 righe stanno in UNA pagina
    // (prima andavano a capo su 3 righe e le ultime finivano nella pagina successiva).
    const labelW = opts.labelW || PROMPT_LABEL_W, answerW = opts.answerW || PROMPT_ANSWER_W;
    const rowH = opts.rowH || PROMPT_ROW_H, promptSize = opts.fontSize || 50;
    const rows = prompts.map((pr, i) => new TableRow({
      height: { value: rowH, rule: 'atLeast' },
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: labelW, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(pr), bold: true, size: promptSize, font: 'Arial' })] })],
        }),
        new TableCell({
          width: { size: answerW, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
          // Nel fascicolo bianco la cella resta vuota (spazio per la risposta del
          // paziente); nel fascicolo delle soluzioni riporta la risposta corretta,
          // quando ne esiste una univoca (anagrammi, calcolo — non i prompt aperti
          // come categorie o accesso lessicale, per cui non c'è un'unica risposta giusta).
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: (answers && answers[i] != null)
              ? [new TextRun({ text: String(answers[i]), bold: true, italics: true, size: 44, font: 'Arial', color: '2F6F63' })]
              : [new TextRun({ text: '' })]
          })],
        }),
      ],
    }));
    return new Table({ rows, width: { size: labelW + answerW, type: WidthType.DXA }, columnWidths: [labelW, answerW], borders: thinBorders(docx) });
  }

  // Intestazione di sezione: un solo paragrafo centrato, titolo in Calibri 25pt
  // grassetto + un a-capo naturale (spazio finale forza il wrap) + eventuale
  // sottotitolo Calibri 15pt grassetto — fedele all'originale (due dimensioni
  // di font nello stesso paragrafo, non due paragrafi separati).
  // Larghezza utile della pagina A4 (11906 DXA totali − 1440 DXA di margine per lato).
  const PAGE_USABLE_W = 11906 - 1440 * 2;

  // Dimensione UNICA del titolo di sezione, uguale in ogni pagina del fascicolo.
  // Prima il titolo si restringeva (da 25pt fino a 13pt) in base alla lunghezza del testo
  // per restare su una riga sola, con il risultato che pagine diverse avevano titoli di
  // grandezza visibilmente diversa (segnalato da Rodrigo). Ora la dimensione è una sola
  // costante: 18pt, scelta perché il titolo più critico — quello delle 3 griglie a piena
  // pagina, con bersaglio di 4-6 caratteri anche cirillici/sillabici — sta su una riga
  // sola (verificato renderizzando il documento vero). I titoli lunghi delle altre pagine
  // (crucipuzzle, categorie) vanno a capo su due righe senza ridurre il carattere: lì la
  // pagina ha spazio a sufficienza.
  const HEADING_SIZE = 36; // half-points → 18pt

  // Intestazione di sezione: un solo paragrafo centrato, titolo in Calibri
  // grassetto (dimensione unica HEADING_SIZE, uguale in tutte le pagine) + un
  // a-capo naturale + eventuale sottotitolo Calibri 15pt grassetto.
  function heading(docx, text, subtitle) {
    const { Paragraph, TextRun, AlignmentType } = docx;
    const runs = [new TextRun({ text: text + ' ', bold: true, size: HEADING_SIZE, font: 'Calibri' })];
    if (subtitle) runs.push(new TextRun({ text: subtitle, bold: true, size: 30, font: 'Calibri', break: 1 }));
    // pageBreakBefore: true su OGNI intestazione — un esercizio per pagina, come
    // nell'originale (dove il titolo occupa la prima pagina da solo e ogni
    // "Cerchiare...", "Risolvere...", ecc. comincia sempre su una pagina nuova).
    return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 160 }, pageBreakBefore: true, children: runs });
  }

  function pageBreak(docx) {
    const { Paragraph, PageBreak } = docx;
    return new Paragraph({ children: [new PageBreak()] });
  }

  async function imageParagraph(docx, rasterize, svgString, widthPx, heightPx) {
    const { Paragraph, ImageRun, AlignmentType } = docx;
    const png = await rasterize(svgString);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: png, type: 'png', transformation: { width: widthPx, height: heightPx } })],
    });
  }

  async function buildFascicoloDocument(docx, data, rasterize, engine, withSolutions) {
    const { Document, Paragraph, TextRun, AlignmentType } = docx;
    const children = [];
    const p = data.params;

    // Paragrafo di soluzione: stessa informazione già mostrata nell'anteprima a schermo
    // con "Mostra risposta" (occorrenze, ordine corretto...), qui in corsivo/verde sotto
    // l'esercizio corrispondente — presente SOLO nel fascicolo gemello delle soluzioni,
    // mai in quello bianco per il paziente.
    function solutionParagraph(text, size) {
      return new Paragraph({ spacing: { before: 80 }, keepLines: true, children: [new TextRun({ text, italics: true, bold: true, size: size || 22, font: 'Calibri', color: '2F6F63' })] });
    }

    // Titolo: Times New Roman 90pt centrato, come nell'originale — occupa la
    // prima pagina quasi per intero, il primo esercizio comincia da solo.
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Fascicolo ${data.week}`, size: 180, font: 'Times New Roman' })] }));
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: `${data.week}°settimana${withSolutions ? ' — soluzioni' : ''}`, size: 180, font: 'Times New Roman' })] }));

    // 1-3: griglie ricerca-sequenza singola — 25 righe × 12 colonne come l'originale.
    // Nel fascicolo delle soluzioni le celle delle occorrenze sono evidenziate
    // direttamente nella griglia, non solo contate.
    data.grids.forEach((g) => {
      children.push(heading(docx, `Cerchiare e contare tutte le sequenze ${g.target.join('')}`, '(orizzontale e verticale)'));
      children.push(symbolGridTable(docx, g.grid, { fillPage: true, compact: !!withSolutions, highlight: withSolutions ? highlightSetFrom(g.occurrences) : null }));
      if (withSolutions) children.push(solutionParagraph(`Soluzione: ${g.count} occorrenze (${g.countH} orizzontali, ${g.countV} verticali) — evidenziate in griglia.`));
    });

    // 4: griglia multi-bersaglio (16 righe, volutamente più piccola) + legenda. Nelle
    // soluzioni, oltre al conteggio in legenda, le celle di ogni occorrenza sono
    // evidenziate direttamente in griglia (tutti i bersagli con lo stesso colore: la
    // legenda sotto dice già quale sequenza conta quanto).
    children.push(heading(docx, 'Cerchiare tutte le sequenze indicate', '(orizzontale, verticale e obliqua — 12 sequenze da trovare)'));
    children.push(symbolGridTable(docx, data.multi.grid, { highlight: withSolutions ? highlightSetFrom(data.multi.positions.flat()) : null }));
    children.push(new Paragraph({ spacing: { before: 160 }, children: [] }));
    children.push(legendTable(docx, data.multi.targets, withSolutions ? data.multi.counts : null));

    // 5: crucipuzzle italiano a ricerca libera — a differenza della griglia mista qui
    // NON c'è alcun elenco bersaglio nel fascicolo bianco: il paziente cerca da solo
    // parole italiane di senso compiuto, in tutte le direzioni e in entrambi i versi.
    // Nel fascicolo delle soluzioni si evidenziano TUTTE le parole realmente presenti
    // (quelle piazzate di proposito e le eventuali extra comparse per caso nel rumore
    // di fondo), non solo quelle piazzate — "tutte le potenziali", come richiesto — con
    // il relativo elenco sotto la griglia.
    children.push(heading(docx, 'Cerca nella griglia tutte le parole italiane di senso compiuto che riesci a trovare',
      `(almeno ${data.crucipuzzle.minWordsToFind} — orizzontale, verticale e obliquo, in avanti e all'indietro)`));
    children.push(symbolGridTable(docx, data.crucipuzzle.grid, { highlight: withSolutions ? highlightSetFrom(data.crucipuzzle.foundWords.map(f => f.cells)) : null }));
    if (withSolutions) {
      // Stesso trattamento dell'anteprima a schermo: una parola corta trovata due volte in
      // griglia (frequente, es. "ORO") compare una sola volta con il conteggio, non ripetuta.
      const wordCounts = {};
      data.crucipuzzle.foundWords.forEach(f => { wordCounts[f.word] = (wordCounts[f.word] || 0) + 1; });
      const wordList = Object.keys(wordCounts).sort().map(w => wordCounts[w] > 1 ? `${w} (×${wordCounts[w]})` : w).join(', ');
      children.push(solutionParagraph(`Parole presenti in griglia (${data.crucipuzzle.foundWords.length}): ${wordList}.`));
    }

    // 6: sequenziamento + immagine (quasi a piena pagina, come l'originale)
    const seqTitle = engine.sequencingInstructionText(data.sequencing.mode);
    children.push(heading(docx, seqTitle));
    const seqSvg = engine.renderSequencingSVG(data.sequencing);
    // Immagine ridotta di circa l'8% rispetto all'originale (586×845 → 540×779): il titolo di
    // questa pagina può occupare 3 righe e, alla dimensione unica dei titoli, con l'immagine a
    // piena pagina l'ultima riga di cerchi finiva su una pagina a parte (verificato con
    // LibreOffice su tutte le 12 settimane).
    // Nel fascicolo delle soluzioni l'immagine è più piccola (78%): sotto c'è l'ordine corretto e deve
    // restare nella stessa pagina.
    children.push(await imageParagraph(docx, rasterize, seqSvg, withSolutions ? 421 : 540, withSolutions ? 608 : 779));
    if (withSolutions) children.push(solutionParagraph(`Ordine corretto: ${data.sequencing.order.join(' → ')}`, 20));

    // 7: labirinto + immagine (dimensione di stampa come l'originale; la
    // difficoltà reale è nel numero di celle, deciso da weekParams). Nel fascicolo
    // delle soluzioni il percorso risolto è disegnato direttamente nell'immagine
    // (stesso motore SVG usato dall'anteprima a schermo con "Mostra risposta").
    children.push(heading(docx, 'Risolvere il labirinto'));
    const mazeSvg = engine.renderMazeSVG(data.maze, 24, !!withSolutions);
    const mazeAspect = (data.maze.cols * 24 + 80) / (data.maze.rows * 24 + 140);
    const mazeWidth = 602;
    children.push(await imageParagraph(docx, rasterize, mazeSvg, mazeWidth, Math.round(mazeWidth / mazeAspect)));

    // 8: accesso lessicale — un solo blocco unificato, qualunque sia lo schema di
    // questa settimana (iniziale, posizione, congiunte/disgiunte, o combinazione a due
    // vincoli lettera+categoria / lettera+lunghezza / categoria+lunghezza). Prompt
    // aperto, senza un'unica risposta corretta: nessuna soluzione da riportare, in
    // nessuno dei due fascicoli — come nell'anteprima a schermo.
    children.push(heading(docx, data.lexicalBlock.label));
    children.push(promptAnswerTable(docx, data.lexicalBlock.prompts, null, data.lexicalBlock.prompts.length > 8 ? { fontSize: 32, rowH: 900, labelW: 5600, answerW: 2875 } : {}));

    // 9: accesso lessicale per categoria — prompt aperto, stesso discorso di sopra. Se
    // questa parte è stata rigenerata singolarmente a un livello diverso da quello globale
    // del fascicolo, "almeno N parole" segue quel livello (data.categoriesMinWords),
    // non quello globale (p.categoryMinWords) — stessa logica dell'anteprima a schermo.
    children.push(heading(docx, `Scrivere parole che appartengano alle categorie (almeno ${data.categoriesMinWords ?? p.categoryMinWords})`));
    children.push(promptAnswerTable(docx, data.categories));

    // 11: anagrammi — la soluzione va SOLO nel fascicolo gemello delle soluzioni,
    // mai in quello bianco.
    children.push(heading(docx, 'Risolvere i seguenti anagrammi'));
    children.push(promptAnswerTable(docx, data.anagrams.map(a => a.scrambled), withSolutions ? data.anagrams.map(a => a.solution) : null));

    // 12: calcolo — stessa logica.
    children.push(heading(docx, 'Calcolare il risultato'));
    children.push(promptAnswerTable(docx, data.calc.map(c => c.expression), withSolutions ? data.calc.map(c => String(c.result)) : null));

    return new Document({
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
        children,
      }],
    });
  }

  return { buildFascicoloDocument };
});

