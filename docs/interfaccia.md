# Interfaccia

*Parte della documentazione di PdM CDCD: indice in [README.md](../README.md). Spostato dal README al passo 6 del refactoring, senza cambiare il testo.*

## Interfaccia

- Sidebar: elenco esercizi, controllo livello (o settimana per il Fascicolo), controlli specifici dell'esercizio attivo, azioni (genera, mostra risposta/regola, esporta, storico generazioni, stampa), campo nome/numero gruppo, pannello di progressione.
- Area principale ("stage"): titolo e metadati dell'esercizio, eventuale box regola/istruzioni, area di rendering del materiale, navigazione tra schermate multiple (usata da "Serie attentive alternate").
- Storico generazioni: elenco locale (per questo browser) di ogni generazione fatta, con esercizio, livello e riepilogo — separato dallo storico anti-ripetizione usato per escludere materiale già proposto.
- Stile grafico volutamente sobrio/clinico (palette verde salvia, tipografia serif per i titoli), pensato per essere leggibile sia a schermo che in stampa/PowerPoint.

## Tablet e telefono (responsive, dal 10 nov 2026)

- **Computer e tablet in orizzontale (oltre 900px di larghezza)**: come sempre, barra laterale fissa a sinistra e area di lavoro a destra.
- **Tablet in verticale e telefono (fino a 900px)**: in alto compare una barra con il pulsante **☰ Menu**. La barra laterale diventa un cassetto che scorre da sinistra. Si chiude toccando lo sfondo scuro, con il tasto Esc o scegliendo un esercizio; si chiude anche premendo *Genera nuovo materiale*, *Mostra risposta / regola* o *Storico generazioni*, così il risultato si vede subito. Muovere il cursore del livello **non** chiude il menu.
- **Bersagli per le dita**: pulsanti, selettori e scorrevoli sono più alti (40-52px) sugli schermi stretti e su qualunque schermo a tocco.
- **Telefono (fino a 600px)**: margini più piccoli; l'*Intruso percettivo* mantiene una larghezza minima leggibile e si fa scorrere di lato (meglio girando il telefono in orizzontale); la parola dell'*Accesso lessicale* si riduce per non uscire dal riquadro; la *Categorizzazione* passa a 2 colonne.
- Le regole stanno in fondo a `css/style.css`, valgono solo a schermo e **mai in stampa**. Il pulsante e lo sfondo del cassetto sono in `index.html` (`#topbar`, `#menuBackdrop`); la logica (poche righe, `setMenuOpen`) in `js/app.js`.
- Controllo automatico: `tests/menu-browser.js`. Limite noto: provato solo con Chromium alle misure 820×1180 e 390×844, non su iPad o telefoni veri.
