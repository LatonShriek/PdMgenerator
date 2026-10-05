# vendor/ — librerie esterne con versione fissata

Servite in locale (niente CDN a runtime). File ottenuti dai pacchetti npm ufficiali con `npm pack <pacchetto>@<versione>`.

| File | Pacchetto npm | Versione | Licenza |
|---|---|---|---|
| pptxgen-3.12.0.bundle.js | pptxgenjs `dist/pptxgen.bundle.js` | 3.12.0 | MIT |
| docx-8.5.0.umd.js | docx `build/index.umd.js` | 8.5.0 | MIT |
| FileSaver-2.0.5.min.js | file-saver `dist/FileSaver.min.js` | 2.0.5 | MIT |
| firebase-{app,auth,firestore}-compat-10.14.1.js | firebase (file `firebase-*-compat.js` in radice) | 10.14.1 | Apache-2.0 |

Note:
- docx: sul CDN l'app usava `index.umd.min.js` (minificato da jsDelivr); su npm esiste solo `index.umd.js`, non minificato (stesso codice, file più pesante).
- Firebase: stessa versione e stessi moduli compat, ma presi da npm e non da gstatic.
- Per aggiornare una libreria: scaricare la nuova versione, cambiare nome file e riga `<script>` in index.html, provare esportazioni e cronologia.
