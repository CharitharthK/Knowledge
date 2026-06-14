/* Knowledge Hub — generic engine. Renders a topic from data/<id>.json.
   Add a hub: drop a new JSON in /data and link it from index.html. */
(function(){
  var sc=document.currentScript;
  var TOPIC=new URL(location.href).searchParams.get('topic')||(sc&&sc.dataset.default)||'ml';
  fetch('data/'+TOPIC+'.json',{cache:'no-cache'})
    .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
    .then(function(D){boot(D);})
    .catch(function(err){var s=document.getElementById('stage');
      if(s)s.innerHTML='<div class="loaderr">Couldn\u2019t load <code>data/'+TOPIC+'.json</code><br>'
        +err+'<br><br>Make sure the file exists and the page is served over http(s), not opened from disk.</div>';});
  function boot(D){


const {cols,topics,leaves,topicEdges,leafEdges,domains:DOM}=D;
const TOTAL=Object.keys(leaves).length;
const META=D.meta||{};
{const b=document.querySelector('.brand');
 if(b){b.querySelector('.kbd').textContent=META.kbd||'knowledge hub';
   b.querySelector('h1').innerHTML=esc(META.title||'Knowledge')+(META.subtitle?' <span>'+esc(META.subtitle)+'</span>':'');}
 document.title=(META.title||'Knowledge')+' \u00b7 Hub';
 {var pt=document.querySelector('.progtxt');if(pt)pt.innerHTML='<b id="progN">0</b>/'+TOTAL;}}
function mdLite(t){t=esc(t);
 t=t.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 const blocks=t.split(/\n\n+/).map(b=>{
   if(/^- /m.test(b)&&b.split(/\n/).every(l=>l.trim().startsWith('- ')))
     return '<ul>'+b.split(/\n/).map(l=>'<li>'+l.replace(/^- /,'')+'</li>').join('')+'</ul>';
   return '<p>'+b.replace(/\n/g,'<br>')+'</p>';});
 return blocks.join('');}
function nodeBody(n,emptyMsg){
 let h=n.desc?'<p>'+esc(n.desc).replace(/\n+/g,'</p><p>')+'</p>':'<p class="empty">'+emptyMsg+'</p>';
 if(n.levels&&n.levels.length){h+='<div class="sub-h">Learn it · basics \u2192 advanced</div>';
   n.levels.forEach(lv=>{h+='<details class="lvl"'+(lv.open?' open':'')+'><summary><span class="lvtag '
     +(lv.tag||'')+'">'+esc(lv.label)+'</span></summary><div class="lvbody">'+mdLite(lv.body)+'</div></details>';});}
 return h;}
const NS="http://www.w3.org/2000/svg";
const $=s=>document.querySelector(s);
const done=new Set(), doneT=new Set(); let current=null, tracedKey=null;
const isTouch = !window.matchMedia('(hover:hover)').matches;
const PREREQ={2:[0,1],3:[2],4:[3],5:[4],6:[5],7:[6]};
let enforceLocks=(D.meta&&D.meta.progressive)===true; const colHeadEl=[]; let lockedState=[], locksInit=false;

/* adjacency */
const tadj={}; Object.keys(topics).forEach(k=>tadj[k]={out:[],in:[]});
topicEdges.forEach(e=>{tadj[e.s].out.push(e);tadj[e.t].in.push(e);});
const ladj={}; Object.keys(leaves).forEach(k=>ladj[k]={out:[],in:[]});
Object.keys(topics).forEach(k=>ladj[k]={out:[],in:[]});
leafEdges.forEach(e=>{(ladj[e.s]||(ladj[e.s]={out:[],in:[]})).out.push(e);(ladj[e.t]||(ladj[e.t]={out:[],in:[]})).in.push(e);});
const REL={prereq:{o:'prereq for',i:'requires'},builds:{o:'leads to',i:'builds on'},applies:{o:'applied in',i:'uses'},contains:{o:'includes',i:'part of'}};
const KCOL={prereq:'var(--gold)',builds:'var(--cyan)',applies:'var(--mint)',contains:'var(--muted2)'};

/* ---- layout ---- */
const map=$('#map'), svg=$('#links');
const COLW=248, GAP=16, PADX=34, HEADY=18, TOPY=58, CARDGAP=16;
const cardEl={};
function layout(){
  // clear cards/heads (keep svg)
  [...map.querySelectorAll('.card,.colhead')].forEach(e=>e.remove());
  let maxBottom=0;
  cols.forEach((col,ci)=>{
    const x=PADX+ci*(COLW+GAP);
    const h=document.createElement('div'); h.className='colhead';
    h.style.left=x+'px'; h.style.top=HEADY+'px'; h.style.width=COLW+'px';
    h.innerHTML='<span class="n">'+String(ci+1).padStart(2,'0')+'</span><span>'+col.title+'</span><span class="ln"></span><span class="hlock">🔒</span>';
    map.appendChild(h); colHeadEl[ci]=h;
    let y=TOPY;
    col.keys.forEach(k=>{
      const t=topics[k]; const c=document.createElement('div'); c.className='card';
      c.style.left=x+'px'; c.style.top=y+'px'; c.style.width=COLW+'px';
      c.style.setProperty('--cdom',DOM[t.domain].c);
      let chips=t.subs.map(sk=>'<span class="chip" data-k="'+sk+'"><span class="cd"></span>'+esc(leaves[sk].label)+'</span>').join('');
      c.innerHTML='<div class="ttl"><span class="dot"></span><span class="tlabel">'+esc(t.label)+'</span>'
        +(t.subs.length?'<span class="cnt">'+t.subs.length+'</span>':'')
        +'<button class="tcheck" title="Mark whole topic complete"></button></div>'
        +(chips?'<div class="chips">'+chips+'</div>':'');
      c.dataset.k=k; map.appendChild(c); cardEl[k]=c;
      c.addEventListener('click',ev=>{
        if(ev.target.closest('.tcheck')){ev.stopPropagation(); if(!isLocked(k)) toggleTopicDone(k); return;}
        if(isLocked(k)){ev.stopPropagation(); toast('🔒 Complete '+lockReason(k)+' to unlock '+cols[t.col].title); return;}
        const ch=ev.target.closest('.chip');
        if(ch){ev.stopPropagation();openLeaf(ch.dataset.k);return;}
        if(isTouch){ if(tracedKey===k) openTopic(k); else traceCard(k); }
        else openTopic(k);});
      if(!isTouch){
        c.addEventListener('mouseenter',()=>{if(!current)highlight(k);});
        c.addEventListener('mouseleave',()=>{if(!current)clearHi();});
      }
      y+=c.offsetHeight+CARDGAP;
    });
    maxBottom=Math.max(maxBottom,y);
  });
  const W=PADX*2+cols.length*(COLW+GAP)-GAP, H=maxBottom+40;
  MAPW=W; MAPH=H;
  map.style.width=W+'px'; map.style.height=H+'px';
  svg.setAttribute('width',W); svg.setAttribute('height',H);
  applyScale();
  drawLinks();
}
function center(k){const c=cardEl[k]; return {x:parseFloat(c.style.left),y:parseFloat(c.style.top),
  w:COLW,h:c.offsetHeight};}
function drawLinks(){
  svg.innerHTML='';
  topicEdges.forEach(e=>{
    const a=center(e.s),b=center(e.t);
    const aRight=b.x+ b.w/2 > a.x + a.w/2;
    const sx=aRight?a.x+a.w:a.x, sy=a.y+Math.min(a.h/2,28);
    const tx=aRight?b.x:b.x+b.w, ty=b.y+Math.min(b.h/2,28);
    const dx=Math.max(40,Math.abs(tx-sx)*0.45)*(aRight?1:-1);
    const p=document.createElementNS(NS,'path');
    p.setAttribute('d',`M${sx},${sy} C${sx+dx},${sy} ${tx-dx},${ty} ${tx},${ty}`);
    p.setAttribute('class','lk '+e.k); e.el=p; svg.appendChild(p);
  });
}

/* ---- highlight on hover ---- */
function neighborSet(k){const s=new Set([k]);
  tadj[k].out.forEach(e=>s.add(e.t)); tadj[k].in.forEach(e=>s.add(e.s)); return s;}
function highlight(k){
  const nb=neighborSet(k);
  Object.keys(topics).forEach(tk=>{const c=cardEl[tk];
    c.classList.toggle('cold',!nb.has(tk)); c.classList.toggle('hot',tk===k);});
  topicEdges.forEach(e=>{const on=(e.s===k||e.t===k);
    e.el.classList.toggle('hot',on); e.el.classList.toggle('cold',!on);});
}
function clearHi(){Object.values(cardEl).forEach(c=>c.classList.remove('cold','hot'));
  topicEdges.forEach(e=>e.el.classList.remove('hot','cold'));}

/* ---- mobile: tap-to-trace + peek bar ---- */
function traceCard(k){
  const t=topics[k]; tracedKey=k;
  Object.values(cardEl).forEach(c=>c.classList.remove('sel'));
  cardEl[k].classList.add('sel'); highlight(k);
  const n=tadj[k].out.length+tadj[k].in.length;
  $('#pkDot').style.background=DOM[t.domain].c;
  $('#pkTtl').textContent=t.label;
  $('#pkSub').textContent=n+' connection'+(n===1?'':'s')+' · tap a lit card to follow';
  $('#peek').classList.add('show');
  ensureVisible(k);
}
function clearTrace(){tracedKey=null;$('#peek').classList.remove('show');
  Object.values(cardEl).forEach(c=>c.classList.remove('sel'));clearHi();}
$('#pkX').onclick=clearTrace;
$('#pkBtn').onclick=()=>{if(tracedKey)openTopic(tracedKey);};

/* ---- progressive disclosure: completion + locks ---- */
function topicComplete(tk){const t=topics[tk];
  return doneT.has(tk) || (t.subs.length>0 && t.subs.every(s=>done.has(s)));}
function setTopicDone(tk,val){const subs=topics[tk].subs;
  if(val){subs.forEach(s=>done.add(s));doneT.add(tk);}
  else{subs.forEach(s=>done.delete(s));doneT.delete(tk);}}
function setLeafDone(lk,val){if(val)done.add(lk);else{done.delete(lk);doneT.delete(leaves[lk].parent);}}
function toggleTopicDone(k){const willBe=!topicComplete(k);setTopicDone(k,willBe);
  toast(willBe?'✓ '+topics[k].label+' complete':topics[k].label+' marked incomplete');refreshAll();}
function columnComplete(ci){return cols[ci].keys.every(topicComplete);}
function columnUnlocked(ci){const p=PREREQ[ci]; return !p||p.every(columnComplete);}
function isLocked(tk){return enforceLocks && !columnUnlocked(topics[tk].col);}
function lockReason(tk){return (PREREQ[topics[tk].col]||[]).map(i=>cols[i].title).join(' & ');}
function refreshChecks(){Object.keys(topics).forEach(k=>{const c=cardEl[k]; if(!c)return;
  const on=topicComplete(k); c.classList.toggle('tdone',on);
  const cb=c.querySelector('.tcheck'); if(cb)cb.classList.toggle('on',on);});}
function updateLocks(){
  const newly=[];
  cols.forEach((col,ci)=>{
    const open=columnUnlocked(ci);
    col.keys.forEach(k=>cardEl[k]&&cardEl[k].classList.toggle('locked',enforceLocks&&!open));
    const head=colHeadEl[ci]; if(head)head.classList.toggle('locked',enforceLocks&&!open);
    if(locksInit && open && lockedState[ci]===true){newly.push(ci);
      if(head){head.classList.add('justunlocked');setTimeout(()=>head.classList.remove('justunlocked'),900);}}
    lockedState[ci]=enforceLocks&&!open;
  });
  topicEdges.forEach(e=>{e.el.style.opacity=(isLocked(e.s)||isLocked(e.t))?'.05':'';});
  if(locksInit && newly.length) toast('🔓 '+newly.map(i=>cols[i].title).join(' & ')+' unlocked');
  locksInit=true;
}
function refreshAll(){refreshDone();refreshChecks();updateProg();updateLocks();saveDone();}
let toastT; function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2200);}
$('#focusBtn').onclick=function(){enforceLocks=!enforceLocks;
  this.classList.toggle('free',!enforceLocks);
  this.innerHTML=enforceLocks?'<span class="lk">🔒</span>Focus':'<span class="lk">🔓</span>Free';
  updateLocks();saveDone();
  toast(enforceLocks?'Focus mode — tiers lock until prerequisites are done':'Free mode — everything unlocked');};

/* ---- panel ---- */
function relConns(adjObj,store){
  const arr=[];
  adjObj.out.forEach(e=>arr.push({rel:REL[e.k].o,k:e.k,other:e.t}));
  adjObj.in.forEach(e=>arr.push({rel:REL[e.k].i,k:e.k,other:e.s}));
  return arr;
}
function nameOf(k){return topics[k]?topics[k].label:(leaves[k]?leaves[k].label:k);}
function domOf(k){return topics[k]?topics[k].domain:(leaves[k]?leaves[k].domain:'role');}
function openTopic(k){
  const t=topics[k]; current=k;
  Object.values(cardEl).forEach(c=>c.classList.remove('sel'));
  cardEl[k].classList.add('sel'); highlight(k);
  $('#dchip').innerHTML='<span class="sw" style="background:'+DOM[t.domain].c+'"></span>topic · '+cols[t.col].title;
  $('#ptitle').textContent=t.label;
  let h=nodeBody(t,'A stage on the roadmap.');
  if(t.subs.length){
    h+='<div class="sub-h">Covers · '+t.subs.length+'</div>';
    t.subs.forEach(sk=>{const o=leaves[sk];
      h+='<button class="subitem" onclick="openLeaf(\''+sk+'\')"><span class="dotc" style="background:'+DOM[o.domain].c+'"></span><span class="cn">'+esc(o.label)+'</span></button>';});
  }
  const cn=relConns(tadj[k]);
  if(cn.length){h+='<div class="sub-h">Connects to · '+cn.length+'</div>';
    cn.sort((a,b)=>a.k.localeCompare(b.k));
    cn.forEach(c=>{h+=connHTML(c,openTopic.name);});}
  if(t.links&&t.links.length){h+=resHTML(t.links);}
  showPanel(h,k);
}
function openLeaf(k){
  const o=leaves[k]; current=k;
  Object.values(cardEl).forEach(c=>c.classList.remove('sel'));
  const pc=cardEl[o.parent]; if(pc){pc.classList.add('sel'); highlight(o.parent);}
  $('#dchip').innerHTML='<span class="sw" style="background:'+DOM[o.domain].c+'"></span>topic · '+esc(topics[o.parent].label);
  $('#ptitle').textContent=o.label;
  let h=nodeBody(o,'Part of '+esc(topics[o.parent].label)+'.');
  const cn=relConns(ladj[k]||{out:[],in:[]});
  if(cn.length){h+='<div class="sub-h">Connects to · '+cn.length+'</div>';
    cn.sort((a,b)=>a.k.localeCompare(b.k));
    cn.forEach(c=>{h+=connHTML(c);});}
  if(o.links&&o.links.length){h+=resHTML(o.links);}
  // back to parent
  h+='<div class="sub-h">In context</div><button class="subitem" onclick="openTopic(\''+o.parent+'\')"><span class="dotc" style="background:'+DOM[domOf(o.parent)].c+'"></span><span class="cn">↑ '+esc(topics[o.parent].label)+'</span></button>';
  showPanel(h,k);
}
function connHTML(c){const o=c.other;
  return '<button class="conn" onclick="navTo(\''+o+'\')"><span class="rel" style="color:'+KCOL[c.k]+'">'+c.rel
    +'</span><span class="dotc" style="background:'+DOM[domOf(o)].c+'"></span><span class="cn">'+esc(nameOf(o))+'</span></button>';}
function resHTML(links){let h='<div class="sub-h">Resources · '+links.length+'</div>';
  links.forEach(l=>{const t=(l.type||'article').toLowerCase();
    h+='<a class="res" href="'+l.url+'" target="_blank" rel="noopener"><span class="tag '+t+'">'+t+'</span><span class="rl">'+esc(l.title)+'</span></a>';});
  return h;}
function navTo(k){
  const tk = topics[k]?k:leaves[k].parent;
  if(isLocked(tk)){toast('🔒 Complete '+lockReason(tk)+' to unlock '+cols[topics[tk].col].title);return;}
  topics[k]?openTopic(k):openLeaf(k); ensureVisible(tk); }
window.openTopic=openTopic; window.openLeaf=openLeaf; window.navTo=navTo;
function showPanel(h,k){$('#pbody').innerHTML=h;$('#pbody').scrollTop=0;syncMark();
  tracedKey=null;$('#peek').classList.remove('show');
  $('#panel').classList.add('open');$('#scrim').classList.add('show');
  ensureVisible(topics[k]?k:leaves[k].parent);}
function ensureVisible(tk){const c=cardEl[tk]; if(!c)return;
  const cx=(parseFloat(c.style.left)+COLW/2)*scale, cy=(parseFloat(c.style.top)+40)*scale;
  stage.scrollTo({left:cx-stage.clientWidth*0.32,top:cy-stage.clientHeight/2,behavior:'smooth'});}
function closePanel(){$('#panel').classList.remove('open');$('#scrim').classList.remove('show');
  Object.values(cardEl).forEach(c=>c.classList.remove('sel'));current=null;clearTrace();}
$('#close').onclick=closePanel;$('#scrim').onclick=closePanel;
addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});

/* ---- completion ---- */
function syncMark(){const b=$('#markbtn'); let on,txt;
  if(topics[current]){on=topicComplete(current);txt=on?'✓ Topic complete — undo':'✓ Mark whole topic complete';}
  else{on=done.has(current);txt=on?'✓ Completed — undo':'✓ Mark complete';}
  b.classList.toggle('done',on);b.textContent=txt;}
$('#markbtn').onclick=()=>{if(!current)return;
  if(topics[current])setTopicDone(current,!topicComplete(current));
  else setLeafDone(current,!done.has(current));
  refreshAll();syncMark();};
function refreshDone(){document.querySelectorAll('.chip').forEach(ch=>ch.classList.toggle('done',done.has(ch.dataset.k)));}
function updateProg(){let c=0;done.forEach(k=>{if(leaves[k])c++;});$('#progN').textContent=c;
  $('#progfill').style.width=(100*c/TOTAL)+'%';}
/* persistent storage (survives closing the app) */
const SKEY='kh.progress.'+TOPIC;try{if(TOPIC==='ml'&&!localStorage.getItem(SKEY)){var _o=localStorage.getItem('mlmap.progress.v1');if(_o)localStorage.setItem(SKEY,_o);}}catch(e){}
function loadDone(){try{const r=localStorage.getItem(SKEY);if(!r)return;const o=JSON.parse(r);
  if(Array.isArray(o)){o.forEach(k=>{if(leaves[k])done.add(k);});}
  else{(o.done||[]).forEach(k=>{if(leaves[k])done.add(k);});
       (o.doneT||[]).forEach(k=>{if(topics[k])doneT.add(k);});
       if(typeof o.focus==='boolean')enforceLocks=o.focus;}
  }catch(e){}}
function saveDone(){try{localStorage.setItem(SKEY,JSON.stringify({done:[...done],doneT:[...doneT],focus:enforceLocks}));}catch(e){}}

/* ---- search ---- */
$('#search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();
  if(!q){clearHi();return;}
  const hay=n=>(n.label+' '+((n.tags||[]).join(' '))).toLowerCase();
  const match=n=>hay(n).includes(q);
  const hitT=new Set(); let firstChip=null;
  Object.keys(topics).forEach(k=>{if(match(topics[k]))hitT.add(k);});
  Object.keys(leaves).forEach(k=>{if(match(leaves[k])){hitT.add(leaves[k].parent);if(!firstChip)firstChip=k;}});
  Object.keys(topics).forEach(k=>cardEl[k].classList.toggle('cold',!hitT.has(k)));
  topicEdges.forEach(ed=>ed.el.classList.add('cold'));
  document.querySelectorAll('.chip').forEach(ch=>{const m=match(leaves[ch.dataset.k]);
    ch.style.outline=m?'1px solid var(--gold)':''; ch.style.opacity=(!q||m||match(topics[leaves[ch.dataset.k].parent]))?'1':'.3';});
});

/* ---- zoom & pan ---- */
const stage=$('#stage'), canvas=$('#canvas');
let scale=1, MAPW=1000, MAPH=800;
function applyScale(){
  map.style.transform='scale('+scale+')';
  canvas.style.width=(MAPW*scale)+'px';
  canvas.style.height=(MAPH*scale)+'px';
}
function clampScale(s){return Math.max(.4,Math.min(2.2,s));}
/* zoom around a focal point given in stage-viewport coords */
function zoomTo(ns,fx,fy){
  ns=clampScale(ns);
  const cx=(stage.scrollLeft+fx)/scale, cy=(stage.scrollTop+fy)/scale;
  scale=ns; applyScale();
  stage.scrollLeft=cx*scale-fx; stage.scrollTop=cy*scale-fy;
}
function zoomCenter(factor){zoomTo(scale*factor,stage.clientWidth/2,stage.clientHeight/2);}
function setScale(s){scale=clampScale(s);applyScale();}
$('#zin').onclick=()=>zoomCenter(1.2);
$('#zout').onclick=()=>zoomCenter(1/1.2);
$('#zfit').onclick=fit;
function fit(){
  scale=clampScale(Math.min((stage.clientWidth-24)/MAPW,1));
  applyScale(); stage.scrollTo({left:0,top:0});
}

/* mouse drag-to-pan (background only) */
let pan=false,sx,sy,sl,st;
stage.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='mouse'||e.target.closest('.card'))return;
  pan=true;sx=e.clientX;sy=e.clientY;sl=stage.scrollLeft;st=stage.scrollTop;stage.classList.add('grab');});
addEventListener('pointermove',e=>{if(!pan)return;stage.scrollLeft=sl-(e.clientX-sx);stage.scrollTop=st-(e.clientY-sy);});
addEventListener('pointerup',()=>{pan=false;stage.classList.remove('grab');});

/* trackpad / ctrl+wheel zoom (one-finger native scroll otherwise) */
stage.addEventListener('wheel',e=>{
  if(e.ctrlKey){ e.preventDefault();
    const r=stage.getBoundingClientRect();
    zoomTo(scale*(e.deltaY<0?1.08:0.926), e.clientX-r.left, e.clientY-r.top);
  }
},{passive:false});

/* touch: pinch to zoom (one-finger pan stays native) */
let pinch=null;
const tdist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
const tmid=t=>({x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2});
stage.addEventListener('touchstart',e=>{
  if(e.touches.length===2){const r=stage.getBoundingClientRect(),m=tmid(e.touches);
    pinch={d:tdist(e.touches),s:scale,
      cx:(stage.scrollLeft+(m.x-r.left))/scale, cy:(stage.scrollTop+(m.y-r.top))/scale};
    e.preventDefault();}
},{passive:false});
stage.addEventListener('touchmove',e=>{
  if(pinch&&e.touches.length===2){e.preventDefault();
    const r=stage.getBoundingClientRect(),m=tmid(e.touches);
    scale=clampScale(pinch.s*(tdist(e.touches)/pinch.d)); applyScale();
    stage.scrollLeft=pinch.cx*scale-(m.x-r.left);
    stage.scrollTop =pinch.cy*scale-(m.y-r.top);}
},{passive:false});
stage.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=null;});
/* double-tap to zoom in on a spot */
let lastTap=0;
stage.addEventListener('touchend',e=>{
  if(e.changedTouches.length!==1)return;
  const now=Date.now(), t=e.changedTouches[0];
  if(now-lastTap<300 && !e.target.closest('.card')){
    const r=stage.getBoundingClientRect();
    zoomTo(scale<1.1?1.5:0.7, t.clientX-r.left, t.clientY-r.top); lastTap=0;
  } else lastTap=now;
},{passive:true});

function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
const topbar=document.querySelector('.topbar');
function syncTop(){stage.style.top=topbar.offsetHeight+'px';}
addEventListener('resize',()=>{syncTop();drawLinks();});
/* tap empty space to clear a trace */
stage.addEventListener('click',e=>{
  if(isTouch && tracedKey && !e.target.closest('.card') && !e.target.closest('.peek')) clearTrace();
});
loadDone();
syncTop();
if(!enforceLocks){const fb=$('#focusBtn');fb.classList.add('free');fb.innerHTML='<span class="lk">🔓</span>Free';}
layout();
requestAnimationFrame(()=>{layout(); syncTop(); refreshDone(); refreshChecks(); updateLocks(); setTimeout(fit,60);});
updateProg();

  }
  window.TOPIC=TOPIC;
})();
