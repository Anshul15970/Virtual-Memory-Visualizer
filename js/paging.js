import { runFIFO, runLRU, runOptimal, buildMatrix } from "./algorithms.js";

let pgState = null;
let pgInterval = null;
let pgPlaying = false;
let speedMs = 900;

// ============================================================
// PAGING STEP-BY-STEP
// ============================================================
function initPaging(){
  let refs=document.getElementById('pg-ref').value.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n));
  let nF=parseInt(document.getElementById('pg-frames').value);
  let algo=document.getElementById('pg-algo').value;
  if(!refs.length||nF<1)return;
  if(pgInterval)clearInterval(pgInterval);
  pgPlaying=false;
  let steps=algo==='fifo'?runFIFO(refs,nF):algo==='lru'?runLRU(refs,nF):runOptimal(refs,nF);
  pgState={refs,nF,algo,steps,current:-1};
  document.getElementById('pg-sim').style.display='block';
  document.getElementById('btn-prev').disabled=true;
  document.getElementById('btn-next').disabled=false;
  document.getElementById('btn-play').disabled=false;
  document.getElementById('btn-reset').disabled=false;
  document.getElementById('btn-play').textContent='⏵ Play';
  renderSeqDisplay();
  renderFrames({frames:[],page:null,hit:null,replaced:null,type:null});
  clearLog();
  updateStats(0,0,refs.length);
  document.getElementById('step-explain').innerHTML='<strong>Ready.</strong> Press Next or Play to begin step-by-step simulation.';
  document.getElementById('pg-matrix').innerHTML='';
}

function resetPaging(){
  if(pgInterval)clearInterval(pgInterval);
  pgPlaying=false;pgState=null;
  document.getElementById('pg-sim').style.display='none';
  ['btn-prev','btn-next','btn-play','btn-reset'].forEach(id=>document.getElementById(id).disabled=true);
}

function nextStep(){
  if(!pgState||pgState.current>=pgState.steps.length-1){if(pgPlaying)togglePlay();return;}
  pgState.current++;
  let step=pgState.steps[pgState.current];
  renderSeqDisplay();renderFrames(step);addLogEntry(step,pgState.current);updateExplain(step,pgState.algo);
  document.getElementById('pg-matrix').innerHTML=buildMatrix(pgState.refs,pgState.steps,pgState.nF,pgState.current);
  let hits=pgState.steps.slice(0,pgState.current+1).filter(s=>s.hit).length;
  updateStats(hits,pgState.current+1-hits,pgState.refs.length);
  document.getElementById('btn-prev').disabled=pgState.current<=0;
  document.getElementById('btn-next').disabled=pgState.current>=pgState.steps.length-1;
  if(pgState.current>=pgState.steps.length-1&&pgPlaying)togglePlay();
}

function prevStep(){
  if(!pgState||pgState.current<=0)return;
  pgState.current--;
  let step=pgState.steps[pgState.current];
  renderSeqDisplay();renderFrames(step);updateExplain(step,pgState.algo);
  document.getElementById('pg-matrix').innerHTML=buildMatrix(pgState.refs,pgState.steps,pgState.nF,pgState.current);
  let hits=pgState.steps.slice(0,pgState.current+1).filter(s=>s.hit).length;
  updateStats(hits,pgState.current+1-hits,pgState.refs.length);
  document.getElementById('btn-prev').disabled=pgState.current<=0;
  document.getElementById('btn-next').disabled=false;
  rebuildLog();
}

function togglePlay(){
  if(!pgState)return;
  pgPlaying=!pgPlaying;
  document.getElementById('btn-play').textContent=pgPlaying?'⏸ Pause':'⏵ Play';
  if(pgPlaying)pgInterval=setInterval(nextStep,speedMs);
  else clearInterval(pgInterval);
}

function renderSeqDisplay(){
  let refs=pgState.refs,cur=pgState.current;
  document.getElementById('seq-display').innerHTML=refs.map((r,i)=>`<div class="seq-item ${i<cur?'past':i===cur?'current':'future'}">${r}</div>`).join('');
}

function renderFrames(step){
  let html='';
  for(let i=0;i<pgState.nF;i++){
    let val=step.frames&&step.frames[i]!==undefined?step.frames[i]:null;
    let cls='';
    if(val!==null){
      if(step.type==='hit'&&val===step.page)cls='hit';
      else if(val===step.replaced)cls='replaced';
      else if(val===step.page&&step.type!=='hit')cls='fault';
      else cls='occupied';
    }
    html+=`<div class="frame ${cls}"><div class="frame-label">F${i}</div>${val!==null?`<div class="frame-value">${val}</div>`:`<div class="frame-empty">—</div>`}</div>`;
  }
  document.getElementById('frames-display').innerHTML=html;
}

function updateExplain(step,algo){
  let name=algo.toUpperCase();
  let why=algo==='fifo'?'arrived first (FIFO queue oldest)':algo==='lru'?'least recently used (not accessed longest)':'not needed for longest time ahead (Optimal look-ahead)';
  let msg=step.hit
    ?`<strong>HIT</strong> — Page <strong>${step.page}</strong> is already in RAM frame ${step.frames.indexOf(step.page)}. No disk access. Frames: [${step.frames.join(', ')}]`
    :step.replaced
      ?`<strong>PAGE FAULT</strong> — Page <strong>${step.page}</strong> not in RAM. Evicted page <strong>${step.replaced}</strong> because it ${why}. [${name}] Frames: [${step.frames.join(', ')}]`
      :`<strong>PAGE FAULT (LOAD)</strong> — Page <strong>${step.page}</strong> placed in an empty frame. No eviction needed. Frames: [${step.frames.join(', ')}]`;
  document.getElementById('step-explain').innerHTML=msg;
}

function addLogEntry(step,idx){
  let log=document.getElementById('step-log');
  let cls=step.hit?'log-hit':step.replaced?'log-replace':'log-fault';
  let icon=step.hit?'✓ HIT':step.replaced?'⇄ SWAP':'! LOAD';
  let detail=step.hit?`P${step.page} in frame ${step.frames.indexOf(step.page)}`:step.replaced?`P${step.page} ← evicted P${step.replaced}`:`P${step.page} → empty frame`;
  log.innerHTML+=`<div class="log-entry ${cls}">[${String(idx+1).padStart(2,'0')}] ${icon} · ${detail} · [${step.frames.join(' ')}]</div>`;
  log.scrollTop=log.scrollHeight;
}

function rebuildLog(){
  clearLog();
  for(let i=0;i<=pgState.current;i++)addLogEntry(pgState.steps[i],i);
}

function clearLog(){document.getElementById('step-log').innerHTML='';}

function updateStats(hits,faults,total){
  document.getElementById('s-hits').textContent=hits;
  document.getElementById('s-faults').textContent=faults;
  let hp=total?Math.round(hits/total*100):0;
  document.getElementById('hit-bar').style.width=hp+'%';
  document.getElementById('fault-bar').style.width=(100-hp)+'%';
  document.getElementById('hit-pct').textContent=hp+'%';
  document.getElementById('fault-pct').textContent=(100-hp)+'%';
}

export function setSpeed(value) {
  speedMs = value;
}

export { initPaging, nextStep, prevStep, togglePlay, resetPaging };