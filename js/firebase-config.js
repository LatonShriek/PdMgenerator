// Configurazione di Firebase (cronologia condivisa online). Unico punto da toccare per collegare o scollegare Firebase.
// Spostato da index.html al passo 5 del refactoring, SENZA cambiare il codice.
// Script classico: si carica da index.html e usa le stesse variabili globali di prima.
// Provato con tests/golden-browser.js (materiale e schermata prima e dopo identici) e con la prova in browser della copia di sicurezza.

/* =========================================================
   CRONOLOGIA CONDIVISA (opzionale) — Firebase/Firestore, stesso schema di
   Borgo Planner e Progress Tracker. Serve a NON riproporre lo stesso criterio
   di Categorizzazione o la stessa parola di Accesso lessicale allo stesso
   gruppo/paziente quando un ciclo si ripete a distanza di mesi o anni, anche
   da un altro dispositivo/browser — cosa che la sola cronologia locale (salvata
   nel browser) non può garantire.

   SETUP (una tantum, come per gli altri tuoi progetti):
   1. Crea un progetto Firebase (o riusa uno esistente) su console.firebase.google.com
   2. Abilita Firestore Database e Authentication -> Anonimo
   3. Incolla qui sotto la tua config (Impostazioni progetto -> Le tue app -> Config)
   4. Imposta le regole Firestore così (solo utenti autenticati, anche anonimi):
        match /catHistory/{doc} { allow read, write: if request.auth != null; }
        match /accessoHistory/{doc} { allow read, write: if request.auth != null; }
        match /fascicoloHistory/{doc} { allow read, write: if request.auth != null; }
        match /materialHistory/{doc} { allow read, write: if request.auth != null; }
        match /groupProgress/{doc} { allow read, write: if request.auth != null; }
   (materialHistory: cronologia di Griglie-Conteggio, Intruso percettivo e Inversione e riordino.)
   (groupProgress: andamento registrato dallo sperimentatore e livello di ogni gruppo — vedi "Progressione del gruppo".)
   Anche senza Firebase la cronologia funziona: viene ricordata su questo browser, per gruppo.
   Finché firebaseConfig resta vuoto, questa sezione non fa nulla: l'app
   funziona esattamente come prima, solo senza memoria tra un dispositivo e l'altro.
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyCEFMdVHdANv1PsVlb-Wo65JHe4IKMtk3o",
    authDomain: "pdmgenerator.firebaseapp.com",
    projectId: "pdmgenerator",
    storageBucket: "pdmgenerator.firebasestorage.app",
    messagingSenderId: "203067967755",
    appId: "1:203067967755:web:6ec8266c59798c852e3a0e"
};
