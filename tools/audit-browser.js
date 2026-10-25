// Verifica in browser: 4 cicli (32 livelli x 1 seduta) per gruppo, per gli esercizi non ancora coperti da audit-verbale.js.
// Uso: NODE_PATH=... CHROMIUM_PATH=... node tools/audit-browser.js [cicli] [esercizio]
const path=require('path'); let pw; try{pw=require('playwright')}catch(e){pw=require('playwright-core')}
const CYCLES=+process.argv[2]||4, ONLY=process.argv[3];
(async()=>{
  const browser=await pw.chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
  const ctx=await browser.newContext({viewport:{width:1400,height:1000}});
  await ctx.route('**/*',r=>r.request().url().startsWith('file://')?r.continue():r.abort());
  const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html')); await page.waitForTimeout(500);
  const EX=ONLY?[ONLY]:['categorizzazione','intruso','griglie','inversione','accesso','serie'];
  for(const ex of EX){
    const res=await page.evaluate(async({ex,CYCLES,W})=>{ window.__W=W;
      localStorage.setItem('pdm_group_name','AUDIT-'+ex);
      localStorage.clear?0:0;
      const labels=new Map(); const seen=new Map(); let tot=0, reps=0, short=0, perLevelNew=[]; const sample={};
      state.exercise=ex; if(ex==='accesso') state.accessoWordsOverride=+(window.__W||1);
      for(let c=0;c<CYCLES;c++) for(let L=1;L<=32;L++){
        state.level=L; await generate();
        const d=state.deck; let ids=[];
        if(ex==='accesso') ids=d.words.map(w=>'w|'+w);
        else if(ex==='categorizzazione'){ ids=d.slides.map(s=>'c|'+s.rawLabel+'|'+(s.items||[]).map(x=>typeof x==='string'?x:(x.en||x.it||x.label||x.name||JSON.stringify(x))).sort().join(',')); d.slides.forEach(s=>{const k='L|'+s.rawLabel; labels.set(k,(labels.get(k)||0)+1);}); }
        else if(ex==='intruso'||ex==='griglie'||ex==='inversione') ids=[ex+'|'+(()=>{let str='';try{str=JSON.stringify(d.slides,(k,v)=>['left','right','above','below'].includes(k)?undefined:v);}catch(e){str=String(Math.random());}let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return h;})()];
        else if(ex==='serie') ids=['s|'+d.seq.map(s=>s.char+s.color[0]).join('')];
        else ids=(d.historyKeys||[]).map(k=>ex+'|'+k);
        if(!sample.k) sample.k=Object.keys(d);
        ids.forEach(k=>{tot++; if(seen.has(k)) reps++; seen.set(k,(seen.get(k)||0)+1);});
      }
      return {tot,reps,distinct:seen.size,labels:labels.size,labelMax:labels.size?Math.max(...labels.values()):0};
    },{ex,CYCLES,W:+process.env.ACCESSO_WORDS||1});
    console.log(ex.padEnd(18),'elementi',res.tot,'distinti',res.distinct,'ripetuti',res.reps, res.labels?('| criteri distinti '+res.labels+', max usi '+res.labelMax):'');
  }
  if(errs.length) console.log('ERRORI PAGINA',errs.slice(0,3));
  await browser.close();
})();
