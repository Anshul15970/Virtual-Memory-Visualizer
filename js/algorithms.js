// ============================================================
// ALGORITHMS
// ============================================================
function runFIFO(refs,nF){
  let frames=[],queue=[],steps=[];
  for(let i=0;i<refs.length;i++){
    let p=refs[i],hit=frames.includes(p),rep=null;
    if(!hit){if(frames.length>=nF){rep=queue.shift();frames.splice(frames.indexOf(rep),1);}frames.push(p);queue.push(p);}
    steps.push({page:p,hit,replaced:rep,frames:[...frames],type:hit?'hit':rep?'replace':'load'});
  }
  return steps;
}

function runLRU(refs,nF){
  let frames=[],steps=[];
  for(let i=0;i<refs.length;i++){
    let p=refs[i],hit=frames.includes(p),rep=null;
    if(!hit){
      if(frames.length>=nF){
        let lru=null,minT=Infinity;
        for(let f of frames){let lu=-1;for(let j=i-1;j>=0;j--){if(refs[j]===f){lu=j;break;}}if(lu<minT){minT=lu;lru=f;}}
        rep=lru;frames.splice(frames.indexOf(rep),1);
      }
      frames.push(p);
    }
    steps.push({page:p,hit,replaced:rep,frames:[...frames],type:hit?'hit':rep?'replace':'load'});
  }
  return steps;
}

function runOptimal(refs,nF){
  let frames=[],steps=[];
  for(let i=0;i<refs.length;i++){
    let p=refs[i],hit=frames.includes(p),rep=null;
    if(!hit){
      if(frames.length>=nF){
        let far=-1,vic=null;
        for(let f of frames){let nx=refs.indexOf(f,i+1);if(nx===-1){vic=f;break;}if(nx>far){far=nx;vic=f;}}
        rep=vic;frames.splice(frames.indexOf(rep),1);
      }
      frames.push(p);
    }
    steps.push({page:p,hit,replaced:rep,frames:[...frames],type:hit?'hit':rep?'replace':'load'});
  }
  return steps;
}

// ============================================================
// BUILD FRAME MATRIX HTML
// ============================================================
function buildMatrix(refs,steps,nFrames,currentStep){
  // currentStep = -1 means show all; otherwise show up to that step
  let showAll = currentStep === undefined || currentStep === -1;
  let len = showAll ? steps.length : currentStep + 1;

  // Header row: step numbers
  let html='<thead><tr><th>Frame</th>';
  for(let i=0;i<len;i++) html+=`<th>${refs[i]}<br><span style="font-size:9px;color:var(--text3)">#${i+1}</span></th>`;
  html+='</tr></thead><tbody>';

  // Frame rows
  for(let f=0;f<nFrames;f++){
    html+=`<tr><th>F${f}</th>`;
    for(let i=0;i<len;i++){
      let step=steps[i];
      let val=step.frames[f];
      if(val===undefined){
        html+='<td class="empty">—</td>';
      } else {
        let cls='loaded';
        if(step.hit && val===step.page) cls='hit';
        else if(val===step.replaced) cls='replace';
        else if(val===step.page && !step.hit) cls='fault';
        html+=`<td class="${cls}">${val}</td>`;
      }
    }
    html+='</tr>';
  }

  // Result row: H/F
  html+='<tr class="result-row"><th style="font-size:10px;color:var(--text3)">Result</th>';
  for(let i=0;i<len;i++){
    let step=steps[i];
    if(step.hit) html+='<td class="hit">H</td>';
    else if(step.replaced) html+='<td class="replace">R</td>';
    else html+='<td class="fault">F</td>';
  }
  html+='</tr></tbody>';
  return html;
}


export { runFIFO, runLRU, runOptimal, buildMatrix };