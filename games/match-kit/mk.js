/* Little Wonders match-kit: one small engine behind the "Match" game series (sort, quiz, memory, order). Config comes from each game page. */
(function(){
const BASE=new URL('art/',document.currentScript.src).href;
const PAL=['#ffd0dc','#bfe6f2','#ffe8a8','#d3f0c4','#e2d4fa','#ffd9b8','#c9ecea','#fbd3f0'];
const $=(s,r)=>(r||document).querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let voice=null;function pv(){const v=speechSynthesis.getVoices();voice=v.find(x=>/^en-(GB|US)/.test(x.lang))||v.find(x=>/^en/.test(x.lang))||null}
if('speechSynthesis' in window){pv();speechSynthesis.onvoiceschanged=pv}
function say(t){if(!t||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/_+/g,'blank'));u.lang='en-GB';if(voice)u.voice=voice;u.rate=.85;speechSynthesis.speak(u)}catch(e){}}
const P=()=>window.LWProgress;
function run(cfg){
 const q=new URLSearchParams(location.search);
 const mid=q.get('mid')==='1';
 let lv=q.get('lv')==='A2'?'A2':'A1';
 const gid='games/'+cfg.id,TH=cfg.things||{};
 const app=$('#app');
 let S;// run state
 function allowedFn(){const al=cfg.alias||{};if(!mid)return()=>true;const n=(cfg.mid||{})[lv]||3,set=new Set((cfg.book||[]).slice(0,n)),all=new Set(cfg.book||[]);return id=>{id=al[id]||id;return !all.has(id)||set.has(id)}}
 function th(id){return TH[id]||{}}
 function spec(x){if(x&&x.th)return Object.assign({},th(x.th),x,{id:x.th});return x||{}}
 function imHtml(sp,cls,c){const i=sp.i,cut=i&&/\.webp$/.test(i);const col=c||sp.c||PAL[0];
  return `<div class="im ${cut?'cut':''} ${cls||''}" style="--c:${col}">`+(i?`<img src="${BASE+i}" alt="${esc(sp.l||sp.a||'')}" draggable="false">`:`<div class="tx">${esc(sp.t||sp.l||'')}</div>`)+'</div>'}
 function cap(t){const c=$('#cap');if(c)c.textContent=t||''}
 function setSub(t){$('#sub').textContent=t||''}
 function bump(){S.done++;$('#bar i').style.width=(100*S.done/S.total)+'%'}
 function credit(key,first){if(first){S.first++;try{P().correct(gid,lv+':'+key)}catch(e){}}}
 function build(){
  app.innerHTML='';
  const pg=el('div');pg.id='page';
  pg.innerHTML=`<div id="hd"><div id="lvs"></div><h1>${esc(cfg.title)}</h1><span id="tcs"><span data-tc-slot style="--tcs-size:40px;--tcs-radius:50%;--tcs-bg:#fff;--tcs-bg-hover:#fbe3ec;--tcs-color:#c84678;--tcs-border:3px solid #f4c8d8;--tcs-shadow:none;--tcs-icon:20px"></span></span></div><div id="sub"></div><div id="bar"><i></i></div><div id="stage"></div><div id="cap"></div><div id="foot">Pip's Little Wonders · ${esc(cfg.foot||'')}</div><div id="ask"></div>`;
  app.appendChild(pg);
  const L=$('#lvs');
  if(!mid)['A1','A2'].forEach(l=>{const b=el('button',l===lv?'on':'',l);b.onclick=()=>{if(l===lv)return;lv=l;history.replaceState(null,'','?lv='+l);start()};L.appendChild(b)});
 }
 function plan(){const ok=allowedFn();const out=[];
  (cfg.levels[lv]||[]).forEach((ph,i)=>{ph=JSON.parse(JSON.stringify(ph));ph.ix=i;
   if(ph.t==='sort'){ph.pieces=ph.pieces.filter(p=>ok(p.id));const used=new Set();ph.pieces.forEach(p=>p.to.forEach(b=>used.add(b)));ph.bins=ph.bins.filter(b=>used.has(b.id));if(!ph.pieces.length)return;ph.units=ph.pieces.length}
   else if(ph.t==='quiz'){ph.rounds=ph.rounds.filter(r=>ok(r.id));ph.pool=(ph.pool||[]).filter(ok);if(!ph.rounds.length)return;ph.units=ph.rounds.length}
   else if(ph.t==='memory'){ph.pairs=ph.pairs.filter(p=>ok(p.id));if(ph.pairs.length<2)return;ph.units=ph.pairs.length}
   else if(ph.t==='order'){if(mid&&ph.midSkip!==false)return;ph.units=ph.steps.length}
   out.push(ph)});
  return out}
 async function start(){
  speechSynthesis&&speechSynthesis.cancel&&speechSynthesis.cancel();
  document.querySelectorAll('.c').forEach(c=>c.remove());$('#party').style.display='none';
  build();
  const phs=plan();S={first:0,done:0,total:phs.reduce((a,p)=>a+p.units,0)||1,phs};
  try{window.__mk=S}catch(e){}
  for(const ph of phs){await runPhase(ph)}
  finish()
 }
 function runPhase(ph){return new Promise(res=>{const st=$('#stage');st.innerHTML='';cap('');setSub(ph.p||'');({sort,quiz,memory,order})[ph.t](ph,st,res)})}
 /* ---------- sort ---------- */
 function sort(ph,st,res){
  const bins=el('div','bins'),tray=el('div','tray'+(ph.pieces.length>8?' dense':''));
  const ovl=!!ph.ovl;
  ph.bins.forEach((b,i)=>{const d=el('div','bin'+(ovl?' ovl':''));d.dataset.id=b.id;d.setAttribute('aria-label',b.l||b.a||b.id);
   d.innerHTML=(b.i?imHtml(b,'',PAL[(i+1)%PAL.length]):`<div class="im" style="--c:${PAL[(i+1)%PAL.length]}"><div class="tx" style="font-size:clamp(14px,min(3.4vh,5.4vw),40px)">${esc(b.l||'').replace(/\n/g,'<br>')}</div></div>`)+(b.i&&b.l?`<div class="btitle">${esc(b.l)}</div>`:'')+'<div class="chips"></div>';
   bins.appendChild(d)});
  const pcs=shuf(ph.pieces).map((p,i)=>{const sp=spec({th:p.id,...(p.sp||{})});const d=el('div','pc');d.dataset.id=p.id;d.innerHTML=imHtml(sp,'',PAL[i%PAL.length])+(ph.pl===false?'':`<div class="lb">${esc(sp.l||'')}</div>`);d._p=p;d._sp=sp;d._c=PAL[i%PAL.length];tray.appendChild(d);return d});
  st.appendChild(bins);st.appendChild(tray);
  let sel=null,left=pcs.length,busy=false;
  const select=pc=>{if(sel)sel.classList.remove('sel');sel=pc===sel?null:pc;if(sel){sel.classList.add('sel');say(sel._sp.l)}};
  async function attempt(pc,bin){if(busy)return;const p=pc._p,ok=p.to.includes(bin.dataset.id);
   if(ok){busy=true;const first=!p.miss;credit(ph.ix+':'+p.id,first);
    pc.classList.add('gone');if(sel===pc)sel=null;bin.classList.add('ok');
    const ch=el('div','chip'+(/\.webp$/.test(pc._sp.i||'')?' cut':'')+(pc._sp.i?'':' txt'),pc._sp.i?`<img src="${BASE+pc._sp.i}" alt="${esc(pc._sp.l||'')}">`:esc(pc._sp.l||''));ch.style.setProperty('--c',pc._c);ch.title=pc._sp.l||'';$('.chips',bin).appendChild(ch);
    const t=(p.sb&&p.sb[bin.dataset.id])||p.say||pc._sp.s||pc._sp.l;cap(t);say(t);
    if(p.ask)await askBox(p.ask);else await wait(900);
    bin.classList.remove('ok');bump();left--;busy=false;if(!left){await wait(500);res()}
   }else{p.miss=true;pc.classList.remove('sel');if(sel===pc)sel=null;pc.classList.remove('shk');void pc.offsetWidth;pc.classList.add('shk');bin.classList.add('no');setTimeout(()=>bin.classList.remove('no'),500);cap('')}}
  bins.addEventListener('click',e=>{const b=e.target.closest('.bin');if(b&&sel)attempt(sel,b)});
  tray.addEventListener('pointerdown',e=>{const pc=e.target.closest('.pc');if(!pc||busy||e.button>0)return;e.preventDefault();
   const sx=e.clientX,sy=e.clientY;let drag=null;
   const mv=ev=>{if(!drag&&Math.hypot(ev.clientX-sx,ev.clientY-sy)>8){drag=pc.cloneNode(true);drag.className='pc drag';drag.style.width=pc.offsetWidth+'px';document.body.appendChild(drag);pc.style.opacity='.35'}
    if(drag){drag.style.left=ev.clientX-pc.offsetWidth/2+'px';drag.style.top=ev.clientY-pc.offsetWidth/2+'px';const b=document.elementFromPoint(ev.clientX,ev.clientY);bins.querySelectorAll('.bin').forEach(x=>x.classList.toggle('hot',x===(b&&b.closest('.bin'))))}};
   const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);
    bins.querySelectorAll('.bin').forEach(x=>x.classList.remove('hot'));
    if(drag){drag.remove();pc.style.opacity='';const b=document.elementFromPoint(ev.clientX,ev.clientY);const bn=b&&b.closest('.bin');if(bn)attempt(pc,bn)}else select(pc)};
   addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up)});
 }
 function askBox(a){return new Promise(res=>{const A=$('#ask');A.style.display='flex';let miss=false;
  const qh=esc(a.q).replace('___','<b>___</b>');A.innerHTML=`<div class="box"><div class="q">${qh}</div><div class="a"></div></div>`;
  const row=$('.a',A);say(a.q.replace('___','blank'));
  shuf(a.o).forEach(o=>{const b=el('button','',esc(o));b.dataset.ok=o===a.a?1:0;b.onclick=async()=>{if(o===a.a){b.classList.add('ok');$('.q b',A).textContent=o;$('.q b',A).classList.add('f');const t=a.s||a.q.replace('___',o);cap(t);say(t);row.style.pointerEvents='none';await wait(1500);A.style.display='none';res()}else{miss=true;b.classList.add('no');b.disabled=true;setTimeout(()=>b.classList.remove('no'),500)}};row.appendChild(b)})})}
 /* ---------- quiz ---------- */
 async function quiz(ph,st,res){
  const w=el('div','qwrap');st.appendChild(w);
  for(const r of ph.rounds){await round(ph,r,w)}
  res()}
 function round(ph,r,w){return new Promise(resolve=>{
  w.innerHTML='';cap('');if(r.p||ph.p)setSub(r.p||ph.p);
  const ans=[].concat(r.a);let ids;const ok=allowedFn();
  if(r.opts){ids=r.opts.filter(x=>ans.includes(x)||ok(x));if(!ids.includes(ans[0]))ids.push(ans[0]);const want=r.opts.length;const extra=shuf((ph.pool||[]).filter(x=>!ids.includes(x)&&!ans.includes(x)&&!(r.nx||[]).includes(x)&&ok(x)));while(ids.length<want&&extra.length)ids.push(extra.pop())}
  else{ids=[ans[0]];const cand=[...new Set([...(r.d||[]),...(ph.pool||[])])].filter(x=>!ans.includes(x));const c1=shuf(cand.filter(x=>ok(x)&&!(r.nx||[]).includes(x)));const c=c1.length?c1:shuf(cand);ids=ids.concat(c.slice(0,(ph.choices||3)-1))}
  ids=shuf(ids);
  const qs=r.q||{};const card=el('div','qcard'+(qs.sh?' sh':''));
  const qsp=qs.th?spec({th:qs.th}):qs;
  if(qs.th||qs.i){const n=qs.n||1;const pr=el('div','pair');for(let k=0;k<n;k++){const d=el('div','');d.innerHTML=imHtml(qsp,'',qs.sh?'#f6f0e6':PAL[2]);const im=$('img',d);if(im&&(qs.sh||qs.sc||qs.rot||qs.clip)){im.dataset.fx=1;im.style.transform=`rotate(${(qs.rot||0)+(k?(qs.rot2||0):0)}deg) scale(${qs.sc||1})`;if(qs.clip)im.style.clipPath=qs.clip;im.style.objectPosition=qs.pos||'center'}if(k&&n>1)d.style.transform='rotate(6deg)';pr.appendChild(d)}card.appendChild(pr)}
  if(qs.parts){const pr=el('div','pair parts');qs.parts.forEach((pt,k)=>{if(k)pr.appendChild(el('div','arr','\u2192'));const d=el('div','');const sp=spec(pt);d.innerHTML=imHtml(sp,'',PAL[(k+2)%PAL.length])+(pt.l||sp.l?`<div class="lb">${esc(pt.l||sp.l)}</div>`:'');pr.appendChild(d)});pr.appendChild(el('div','arr','\u2192'));pr.appendChild(el('div','qm','?'));card.appendChild(pr)}
  if(qs.t){const t=el('div','qt',esc(qs.t).replace('___','<b>___</b>'));card.appendChild(t)}
  if(ph.listen||qs.say){const lb=el('button','btn','Listen');lb.style.cssText='font-size:16px;min-height:38px;padding:2px 14px';lb.onclick=()=>say(qs.say&&qs.say!==true?qs.say:qs.t);card.appendChild(lb)}
  w.appendChild(card);
  const o=el('div','opts');
  ids.forEach((id,i)=>{const sp=spec({th:id,...((r.os||{})[id]||{})});const b=el('button','opt'+(sp.i?'':' txtonly'));b.dataset.id=id;b.dataset.l=sp.l||'';b.dataset.ok=ans.includes(id)?1:0;
   b.innerHTML=imHtml(sp,'',PAL[(i+3)%PAL.length])+(ph.ol===false||!sp.i?'':`<div class="lb">${esc(sp.l||'')}</div>`)+'<span class="tick"></span>';o.appendChild(b)});
  w.appendChild(o);
  let miss=false,lock=false;
  if(qs.say===true||ph.autosay)say(qs.t);
  o.onclick=async e=>{const b=e.target.closest('.opt');if(!b||lock)return;
   if(b.dataset.ok==='1'){lock=true;b.classList.add('ok');credit(ph.ix+':'+r.id,!miss);
    if(qs.t&&qs.t.includes('___')){const bb=$('.qt b',card);bb.textContent=b.dataset.l;bb.classList.add('f')}
    card.classList.add('rev');card.querySelectorAll('img[data-fx]').forEach(i=>{i.style.clipPath='';i.style.transform=''});
    const t=r.say||sp0(b.dataset.id).s||b.dataset.l;cap(t);say(t);bump();o.querySelectorAll('.opt').forEach(x=>x.classList.add('off'));await wait(r.hold||1700);resolve()}
   else{miss=true;b.classList.add('no');b.dataset.dead=1;say(sp0(b.dataset.id).l)}}
 })}
 const sp0=id=>spec({th:id});
 /* ---------- memory ---------- */
 function memory(ph,st,res){
  const g=el('div','mem');st.appendChild(g);
  let cards=[];ph.pairs.forEach(p=>{['a','b'].forEach(k=>cards.push({id:p.id,k,sp:spec(p[k]),p}))});cards=shuf(cards);
  const els=cards.map((c,i)=>{const b=el('button','mc');b.setAttribute('aria-label','card');
   const f=c.sp.i?imHtml(c.sp,'',PAL[(i)%PAL.length])+(ph.ol?`<div class="lb">${esc(c.sp.l||'')}</div>`:''):`<div class="qt">${esc(c.sp.t||c.sp.l||'')}</div>`;
   b.innerHTML=`<div class="in"><div class="b"></div><div class="f">${f}</div></div>`;b._c=c;g.appendChild(b);return b});
  function lay(){const W=g.clientWidth,H=g.clientHeight,n=els.length,gap=10;let best=null;
   for(let c=2;c<=8;c++){const r=Math.ceil(n/c),w=Math.min((W-gap*(c-1))/c,(H-gap*(r-1))/r*1.2);if(!best||w>best.w)best={c,r,w}}
   g.style.gridTemplateColumns=`repeat(${best.c},${best.w}px)`;g.style.gridAutoRows=(best.w/1.2)+'px';g.style.setProperty('--mfs',Math.max(11,Math.min(26,best.w*.1))+'px')}
  lay();addEventListener('resize',lay);setTimeout(lay,60);setTimeout(lay,400);
  let up=[],busy=false,left=ph.pairs.length;
  g.onclick=async e=>{const b=e.target.closest('.mc');if(!b||busy||b.classList.contains('up')||b.classList.contains('done'))return;
   b.classList.add('up');const c=b._c;if(c.sp.l||c.sp.s)say(c.sp.s||c.sp.l);up.push(b);
   if(up.length<2)return;busy=true;const [x,y]=up;up=[];await wait(900);
   if(x._c.id===y._c.id&&x._c.k!==y._c.k){[x,y].forEach(z=>{z.classList.remove('up');z.classList.add('done')});const p=x._c.p;credit(ph.ix+':'+p.id,true);const t=p.say||'';cap(t);say(t);bump();left--;await wait(900);busy=false;if(!left){await wait(400);removeEventListener('resize',lay);res()}}
   else{[x,y].forEach(z=>z.classList.remove('up'));await wait(450);busy=false}}
 }
 /* ---------- order ---------- */
 function order(ph,st,res){
  const w=el('div','ord');const slots=el('div','slots'),tr=el('div','otray');w.appendChild(slots);w.appendChild(tr);st.appendChild(w);
  const words=ph.words||['First','Next','Then','Last','Finally'];
  ph.steps.forEach((s,i)=>{const d=el('div','slot',`<span class="n">${i+1}</span><span class="w">${esc(words[Math.min(i,words.length-1)])}</span>`);slots.appendChild(d)});
  slots.style.marginBottom='22px';
  let ord=shuf(ph.steps.map((s,i)=>i));if(ord.every((v,i)=>v===i)&&ord.length>1)ord.reverse();
  const tiles=ord.map((ix,k)=>{const s=ph.steps[ix];const sp=spec(s);const b=el('button','otile',imHtml(sp,'',PAL[k%PAL.length])+(ph.ol===false?'':`<div class="lb">${esc(sp.l||'')}</div>`));b._ix=ix;tr.appendChild(b);return b});
  let n=0,miss=new Set(),lock=false;
  tr.onclick=async e=>{const b=e.target.closest('.otile');if(!b||lock||b.classList.contains('gone'))return;
   if(b._ix===n){lock=true;const sl=slots.children[n];sl.classList.add('full');const s=ph.steps[n],sp=spec(s);sl.insertAdjacentHTML('beforeend',imHtml(sp,'',PAL[n%PAL.length]));b.classList.add('gone');credit(ph.ix+':'+n,!miss.has(n));const t=s.say||sp.l;cap(t);say(t);bump();n++;await wait(1000);lock=false;if(n===ph.steps.length){await wait(500);res()}}
   else{miss.add(n);b.classList.remove('no');void b.offsetWidth;b.classList.add('no')}}
 }
 function finish(){
  const sc=S.first,tot=S.total;try{P().win(gid,'match:'+lv,{v:sc});if(P().unit){P().unit(gid,lv,2);if(lv==='A2')P().unit(gid,'A1',2)}}catch(e){}
  const pa=$('#party');pa.innerHTML=`<div>Well done!<small>${sc} of ${tot} right the first time</small></div><div class="row"></div>`;
  const row=$('.row',pa);const again=el('button','btn','Play again');again.onclick=start;row.appendChild(again);
  if(!mid&&lv==='A1'){const nx=el('button','btn','Try A2');nx.onclick=()=>{lv='A2';history.replaceState(null,'','?lv=A2');start()};row.appendChild(nx)}
  pa.style.display='flex';say('Well done!');
  const cols=['#f7a8c4','#9cc8f0','#ffd23f','#7ccf8a','#c7a8f0'];for(let i=0;i<70;i++){const c=el('div','c');c.style.left=Math.random()*100+'vw';c.style.background=cols[i%5];c.style.animationDuration=2+Math.random()*2+'s';c.style.animationDelay=Math.random()*1.5+'s';pa.appendChild(c)}
 }
 const pa=el('div');pa.id='party';document.body.appendChild(pa);
 start();
}
window.MK={run};
})();
