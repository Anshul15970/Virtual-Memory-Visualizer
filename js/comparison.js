
import { runFIFO, runLRU, runOptimal, buildMatrix } from "./algorithms.js";

// ============================================================
// COMPARISON TAB
// ============================================================
function runComparison(){
  let refs=document.getElementById('cmp-ref').value.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n));
  let nF=parseInt(document.getElementById('cmp-frames').value);
  if(!refs.length||nF<1)return;

  let results={
    fifo:runFIFO(refs,nF),
    lru:runLRU(refs,nF),
    optimal:runOptimal(refs,nF)
  };
  let faults={
    fifo:results.fifo.filter(s=>!s.hit).length,
    lru:results.lru.filter(s=>!s.hit).length,
    optimal:results.optimal.filter(s=>!s.hit).length
  };
  let bestAlgo=Object.keys(faults).reduce((a,b)=>faults[a]<=faults[b]?a:b);
  let maxFaults=Math.max(...Object.values(faults));

  // Cards
  let algoMeta={fifo:{color:'var(--blue)',label:'FIFO'},lru:{color:'var(--amber)',label:'LRU'},optimal:{color:'var(--green)',label:'Optimal'}};
  let cardsHtml='';
  for(let [algo,meta] of Object.entries(algoMeta)){
    let f=faults[algo],h=refs.length-f;
    let hp=Math.round(h/refs.length*100);
    let best=algo===bestAlgo;
    cardsHtml+=`<div class="algo-card ${best?'best':''}">
      ${best?`<div class="best-badge">★ Best</div>`:''}
      <div class="algo-name ${algo}">${meta.label}</div>
      <div class="algo-stat"><span class="algo-stat-lbl">Page Faults</span><span class="algo-stat-val" style="color:var(--amber)">${f}</span></div>
      <div class="bar-track"><div class="bar-fill fill-amber" style="width:${maxFaults?Math.round(f/maxFaults*100):0}%"></div></div>
      <div class="algo-stat" style="margin-top:8px"><span class="algo-stat-lbl">Hits</span><span class="algo-stat-val" style="color:var(--green)">${h}</span></div>
      <div class="bar-track"><div class="bar-fill fill-green" style="width:${hp}%"></div></div>
      <div class="algo-stat" style="margin-top:8px"><span class="algo-stat-lbl">Hit Rate</span><span class="algo-stat-val" style="color:${meta.color}">${hp}%</span></div>
    </div>`;
  }
  document.getElementById('cmp-cards').innerHTML=cardsHtml;

  // Bar chart (pure CSS)
  let chartHtml='<div style="display:flex;align-items:flex-end;gap:20px;height:120px;padding:0 10px">';
  let algos=['fifo','lru','optimal'];
  let colors=[{f:'var(--blue)',l:'FIFO'},{f:'var(--amber)',l:'LRU'},{f:'var(--green)',l:'Optimal'}];
  for(let i=0;i<3;i++){
    let pct=maxFaults?Math.round(faults[algos[i]]/maxFaults*100):0;
    chartHtml+=`<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
      <div style="font-size:12px;color:${colors[i].f};font-weight:700">${faults[algos[i]]}</div>
      <div style="width:100%;height:${pct}px;background:${colors[i].f};border-radius:4px 4px 0 0;min-height:4px;transition:height .6s;opacity:0.9"></div>
      <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px">${colors[i].l}</div>
    </div>`;
  }
  chartHtml+='</div><div style="border-top:1px solid var(--border);margin:4px 10px 0;font-size:10px;color:var(--text3);text-align:center;padding-top:6px">Page Faults (lower is better)</div>';
  document.getElementById('cmp-chart').innerHTML=chartHtml;

  // Three matrices stacked
  let matHtml='';
  for(let [algo,meta] of Object.entries(algoMeta)){
    matHtml+=`<div style="margin-bottom:20px">
      <div style="font-size:12px;font-weight:700;color:${meta.color};margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">${meta.label} — ${faults[algo]} faults</div>
      <div class="matrix-wrap"><table class="matrix">${buildMatrix(refs,results[algo],nF,-1)}</table></div>
    </div>`;
  }
  document.getElementById('cmp-matrix-inner').innerHTML=matHtml;
  document.getElementById('anomaly-banner').style.display='none';
  document.getElementById('cmp-results').style.display='block';
}

// Belady's Anomaly: FIFO with frames+1 should have <= faults, but sometimes has more
function runBeladys(){
  let refs=document.getElementById('cmp-ref').value.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n));
  let nF=parseInt(document.getElementById('cmp-frames').value);
  if(!refs.length||nF<1)return;
  let f1=runFIFO(refs,nF).filter(s=>!s.hit).length;
  let f2=runFIFO(refs,nF+1).filter(s=>!s.hit).length;
  let banner=document.getElementById('anomaly-banner');
  if(f2>f1){
    banner.style.display='block';
    banner.innerHTML=`<strong>⚠ Belady's Anomaly Detected!</strong><br>
    With <strong>${nF}</strong> frames → <strong>${f1}</strong> faults. With <strong>${nF+1}</strong> frames → <strong>${f2}</strong> faults.<br>
    Adding more frames caused MORE page faults! This is Belady's Anomaly — it only occurs in FIFO, not in LRU or Optimal.`;
  } else {
    banner.style.display='block';
    banner.style.borderColor='var(--green)';banner.style.color='var(--green)';banner.style.background='var(--green-dim)';
    banner.innerHTML=`<strong>✓ No Belady's Anomaly</strong><br>
    With <strong>${nF}</strong> frames → <strong>${f1}</strong> faults. With <strong>${nF+1}</strong> frames → <strong>${f2}</strong> faults.<br>
    Adding a frame did not increase faults. Try a different reference string or frame count to trigger the anomaly.`;
  }
}

export { runComparison, runBeladys };