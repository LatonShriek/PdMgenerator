// Verifica: un gruppo che fa 4 cicli (32 livelli x 1 seduta x 8 quesiti) rivede lo stesso quesito identico?
// Uso: node tools/audit-verbale.js [cicli]
const { buildClassificazioni } = require('../js/generators/classificazioni.js');
const { buildAnalogie } = require('../js/generators/analogie.js');
const { buildIntrusoConcettuale } = require('../js/generators/intruso-concettuale.js');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const CAPS = { classificazioni:4000, intrusoconc:3000, analogie:5000 };
const sig = {
  classificazioni: it => 'c|'+it.category+'|'+it.terms.slice().sort().join(','),
  analogie: it => 'a|'+it.prompt,
  intrusoconc: it => 'i|'+it.words.slice().sort().join(',')+'|'+it.words[it.oddIndex],
};
function run(name, build, cycles, cap){
  const rng = mulberry32(12345); let used = []; const seen = new Map(); let reps = 0, tot = 0, short = 0;
  const catCount = new Map();
  for (let c=0;c<cycles;c++) for (let L=1;L<=32;L++){
    const d = build(L,{rng,used:used.slice(-cap),count:8});
    if (d.items.length<8) short++;
    used = used.concat(d.historyKeys);
    d.items.forEach(it=>{ const s=sig[name](it); tot++; if(seen.has(s)) reps++; seen.set(s,(seen.get(s)||0)+1); const k=it.category||it.relation; catCount.set(k,(catCount.get(k)||0)+1); });
  }
  const mx = Math.max(...catCount.values()), mn = Math.min(...catCount.values());
  console.log(name.padEnd(16),'quesiti',tot,'identici ripetuti',reps,'sedute incomplete',short,'| per categoria/relazione min',mn,'max',mx,'(n.',catCount.size+')');
}
const cycles = +process.argv[2]||4;
run('classificazioni', buildClassificazioni, cycles, CAPS.classificazioni);
run('analogie', buildAnalogie, cycles, CAPS.analogie);
run('intrusoconc', buildIntrusoConcettuale, cycles, CAPS.intrusoconc);
