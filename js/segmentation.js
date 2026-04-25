
let segments = [];

// ============================================================
// SEGMENTATION
// ============================================================
function initSegments(){
  segments=[
    {name:'Code',base:1000,limit:400,access:'R'},
    {name:'Data',base:2000,limit:300,access:'RW'},
    {name:'Stack',base:3000,limit:500,access:'RW'},
  ];
  renderSegTable();renderSegVisual();
}

function addSegment(){
  if(segments.length>=6)return;
  segments.push({name:'Seg'+segments.length,base:4000+segments.length*1000,limit:200,access:'RW'});
  renderSegTable();renderSegVisual();
}

function removeSegment(i){segments.splice(i,1);renderSegTable();renderSegVisual();}

function resetSegments(){initSegments();document.getElementById('seg-result').innerHTML='';}

function renderSegTable(){
  document.getElementById('seg-tbody').innerHTML=segments.map((s,i)=>`
    <tr>
      <td style="color:var(--text3)">${i}</td>
      <td><input style="width:110px" value="${s.name}" onchange="segments[${i}].name=this.value;renderSegVisual()"></td>
      <td><input type="number" style="width:90px" value="${s.base}" onchange="segments[${i}].base=parseInt(this.value)||0;renderSegVisual()"></td>
      <td><input type="number" style="width:90px" value="${s.limit}" onchange="segments[${i}].limit=parseInt(this.value)||0;renderSegVisual()"></td>
      <td><select style="width:70px" onchange="segments[${i}].access=this.value">
        <option ${s.access==='R'?'selected':''}>R</option>
        <option ${s.access==='RW'?'selected':''}>RW</option>
        <option ${s.access==='RX'?'selected':''}>RX</option>
      </select></td>
      <td><button class="btn btn-red" style="padding:2px 8px;font-size:10px" onclick="removeSegment(${i})">✕</button></td>
    </tr>`).join('');
}

function translateAddress(){
  let sn=parseInt(document.getElementById('seg-num').value);
  let off=parseInt(document.getElementById('seg-offset').value);
  let res=document.getElementById('seg-result');
  if(isNaN(sn)||sn<0||sn>=segments.length){
    res.innerHTML=`<div class="explanation-box" style="border-color:var(--red);color:var(--red)"><strong>SEGMENTATION FAULT</strong> — Segment <strong>${sn}</strong> does not exist. Valid range: 0–${segments.length-1}.</div>`;return;
  }
  let seg=segments[sn];
  if(isNaN(off)||off<0||off>=seg.limit){
    res.innerHTML=`<div class="explanation-box" style="border-color:var(--red);color:var(--red)"><strong>SEGMENTATION FAULT</strong> — Offset <strong>${off}</strong> is out of bounds for "${seg.name}" (limit: <strong>${seg.limit}</strong>). Valid offsets: 0–${seg.limit-1}.</div>`;return;
  }
  let phys=seg.base+off;
  res.innerHTML=`<div class="explanation-box" style="border-color:var(--green)">
    <strong>✓ Translation Successful</strong><br>
    Segment <strong>${sn}</strong> ("${seg.name}") · Base: <strong>${seg.base}</strong> · Limit: <strong>${seg.limit}</strong> · Access: ${seg.access}<br>
    Logical Address: (<strong>${sn}</strong>, <strong>${off}</strong>) → Physical: <strong>${phys}</strong><br>
    <span style="color:var(--text3)">Formula: ${seg.base} (base) + ${off} (offset) = ${phys}</span>
  </div>`;
}

function renderSegVisual(){
  if(!segments.length){document.getElementById('seg-visual').innerHTML='<div style="color:var(--text3);text-align:center;padding:20px;font-size:12px">No segments defined.</div>';return;}
  let colors=['var(--blue)','var(--green)','var(--amber)','var(--purple)','var(--red)','var(--text2)'];
  let maxAddr=Math.max(...segments.map(s=>s.base+s.limit));
  let totalH=Math.min(segments.length*64,380);
  let sc=totalH/maxAddr;
  let html=`<div style="position:relative;height:${totalH+30}px;background:var(--surface2);border-radius:8px;padding:10px 10px 10px 70px;border:1px solid var(--border)">`;
  segments.forEach((seg,i)=>{
    let top=seg.base*sc,h=Math.max(seg.limit*sc,24),c=colors[i%colors.length];
    html+=`<div style="position:absolute;left:70px;right:10px;top:${top}px;height:${h}px;background:${c}20;border:1px solid ${c};border-radius:4px;display:flex;align-items:center;padding:0 10px;overflow:hidden">
      <span style="font-size:11px;font-weight:700;color:${c}">${seg.name}</span>
      <span style="font-size:10px;color:var(--text3);margin-left:8px">[${seg.base}–${seg.base+seg.limit-1}] · ${seg.access}</span>
    </div>
    <div style="position:absolute;left:0;top:${top}px;width:64px;text-align:right;font-size:9px;color:var(--text3);padding-right:8px;line-height:1.2">${seg.base}</div>`;
  });
  html+='</div>';
  document.getElementById('seg-visual').innerHTML=html;
}

export { initSegments, addSegment, resetSegments, translateAddress };