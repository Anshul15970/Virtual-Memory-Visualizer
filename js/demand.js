
let dpState = null;
let dpInterval = null;
let dpPlaying = false;

// ============================================================
// DEMAND PAGING
// ============================================================
function initDemand(){
  let seq=document.getElementById('dp-seq').value.trim().split(/\s+/).map(Number).filter(n=>!isNaN(n));
  let nF=parseInt(document.getElementById('dp-frames').value);
  let tot=parseInt(document.getElementById('dp-total').value);
  if(!seq.length)return;
  tot=Math.max(tot,Math.max(...seq));
  let steps=buildDemandSteps(seq,nF);
  dpState={seq,nF,totalPages:tot,steps,current:-1};
  document.getElementById('dp-sim').style.display='block';
  ['dp-prev','dp-next','dp-play','dp-reset'].forEach(id=>document.getElementById(id).disabled=false);
  document.getElementById('dp-prev').disabled=true;
  document.getElementById('dp-play').textContent='⏵ Play';
  renderDpSeq();renderDpMemory(null);clearDpLog();
  document.getElementById('dp-transfer').style.display='none';
  document.getElementById('dp-explain').innerHTML='<strong>Ready.</strong> Press Next to access pages on demand.';
  dpUpdateStats(0,0,0);
}

function buildDemandSteps(seq,nF){
  let frames=[],queue=[],steps=[];
  for(let i=0;i<seq.length;i++){
    let p=seq[i],hit=frames.includes(p),rep=null;
    if(!hit){if(frames.length>=nF){rep=queue.shift();frames.splice(frames.indexOf(rep),1);}frames.push(p);queue.push(p);}
    steps.push({page:p,hit,replaced:rep,frames:[...frames],queue:[...queue]});
  }
  return steps;
}

function resetDemand(){
  if(dpInterval)clearInterval(dpInterval);
  dpPlaying=false;dpState=null;
  document.getElementById('dp-sim').style.display='none';
  ['dp-prev','dp-next','dp-play','dp-reset'].forEach(id=>document.getElementById(id).disabled=true);
}

function dpNext(){
  if(!dpState||dpState.current>=dpState.steps.length-1){if(dpPlaying)dpTogglePlay();return;}
  dpState.current++;
  let step=dpState.steps[dpState.current];
  renderDpSeq();renderDpMemory(step);addDpLog(step);
  document.getElementById('dp-prev').disabled=dpState.current<=0;
  document.getElementById('dp-next').disabled=dpState.current>=dpState.steps.length-1;
  if(!step.hit){
    let tr=document.getElementById('dp-transfer');tr.style.display='flex';
    document.getElementById('dp-from-page').textContent='P'+step.page;
    document.getElementById('dp-to-frame').textContent='F'+step.frames.indexOf(step.page);
    setTimeout(()=>{tr.style.display='none';},900);
  } else {document.getElementById('dp-transfer').style.display='none';}
  let hits=dpState.steps.slice(0,dpState.current+1).filter(s=>s.hit).length;
  let loads=dpState.steps.slice(0,dpState.current+1).filter(s=>!s.hit).length;
  dpUpdateStats(hits,dpState.current+1-hits,loads);
  if(dpState.current>=dpState.steps.length-1&&dpPlaying)dpTogglePlay();
}

function dpPrev(){
  if(!dpState||dpState.current<=0)return;
  dpState.current--;
  let step=dpState.steps[dpState.current];
  renderDpSeq();renderDpMemory(step);
  document.getElementById('dp-prev').disabled=dpState.current<=0;
  document.getElementById('dp-next').disabled=false;
  let hits=dpState.steps.slice(0,dpState.current+1).filter(s=>s.hit).length;
  dpUpdateStats(hits,dpState.current+1-hits,dpState.current+1-hits);
}

function dpTogglePlay() {
  if (!dpState) return;
  dpPlaying = !dpPlaying;
  const btn = document.getElementById('dp-play');
  btn.textContent = dpPlaying ? '⏸ Pause' : '⏵ Play';
  if (dpPlaying) {
    dpInterval = setInterval(() => {
      if (dpState.current >= dpState.steps.length - 1) {
        clearInterval(dpInterval);
        dpPlaying = false;
        btn.textContent = '⏵ Play';
        return;
      }
      dpNext();
    }, 900); // you can later connect speed control
  } else {
    clearInterval(dpInterval);
  }
}

function renderDpSeq(){
  let seq=dpState.seq,cur=dpState.current;
  document.getElementById('dp-seq-display').innerHTML=seq.map((p,i)=>`<div class="seq-item ${i<cur?'past':i===cur?'current':'future'}">P${p}</div>`).join('');
}

function renderDpMemory(step){
  let frames=step?step.frames:[];
  let ramHtml='';
  for(let i=0;i<dpState.nF;i++){
    let val=frames[i];
    let cls=val===undefined?'empty':(step&&val===step.page&&!step.hit)?'active':'loaded';
    ramHtml+=`<div class="mem-frame-row ${cls}">
      <div class="mem-frame-num">F${i}</div>
      ${val!==undefined?`<div class="mem-frame-val">Page ${val}</div>`:`<div style="color:var(--text3);font-size:12px">— empty —</div>`}
    </div>`;
  }
  document.getElementById('dp-ram').innerHTML=ramHtml;
  let diskHtml='';
  for(let p=1;p<=dpState.totalPages;p++){
    let inRam=frames.includes(p);
    let accessing=step&&step.page===p&&!step.hit;
    diskHtml+=`<div class="disk-page ${inRam?'in-ram':''} ${accessing?'accessing':''}">${p}</div>`;
  }
  document.getElementById('dp-disk').innerHTML=diskHtml;
  if(step){
    let msg=step.hit
      ?`<strong>CACHE HIT</strong> — Page <strong>${step.page}</strong> already in RAM (frame ${step.frames.indexOf(step.page)}). No disk read needed.`
      :step.replaced
        ?`<strong>PAGE FAULT</strong> — Page <strong>${step.page}</strong> not in RAM. Swapped out Page <strong>${step.replaced}</strong> to disk and loaded Page ${step.page}.`
        :`<strong>PAGE FAULT (FIRST LOAD)</strong> — Page <strong>${step.page}</strong> accessed for the first time. Loaded from disk into an empty frame.`;
    document.getElementById('dp-explain').innerHTML=msg;
  }
}

function addDpLog(step){
  let log=document.getElementById('dp-log');
  let cls=step.hit?'log-hit':step.replaced?'log-replace':'log-fault';
  let icon=step.hit?'✓ HIT':step.replaced?'↕ SWAP':'⬇ LOAD';
  let d=step.hit?`P${step.page} in RAM (frame ${step.frames.indexOf(step.page)})`:step.replaced?`P${step.page} loaded · P${step.replaced} swapped to disk`:`P${step.page} loaded from disk (first access)`;
  log.innerHTML+=`<div class="log-entry ${cls}">[${String(dpState.current+1).padStart(2,'0')}] ${icon} · ${d}</div>`;
  log.scrollTop=log.scrollHeight;
}

function clearDpLog(){document.getElementById('dp-log').innerHTML='';}
function dpUpdateStats(hits,faults,loads){
  document.getElementById('dp-hits').textContent=hits;
  document.getElementById('dp-faults').textContent=faults;
  document.getElementById('dp-loads').textContent=loads;
}


export { initDemand, dpNext, dpPrev, dpTogglePlay, resetDemand };