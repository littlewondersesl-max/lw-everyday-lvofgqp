/* Little Wonders · goals panel (coin star, dropdown, page coins). Loaded lazily by progress.js on pages with the site header.
   Reads raw events from LWProgress (localStorage lwp.goals.<student>), scores them with js/goal-tags.js, and draws the UI.
   Scoring rule: points for a FIRST success and for IMPROVEMENT only. Repeating something earns nothing. */
(function(){
if(window.LWGoals)return;
const P=window.LWProgress;if(!P)return;
const ME=document.currentScript,ROOT=new URL('..',ME?ME.src:location.href).href;
const LV=['A1','A2','B1'],TARGET=30; // points that fill one bar at one level
const STAR='<svg viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="lwg-g" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#e09a00"/></radialGradient></defs><circle cx="16" cy="16" r="14.5" fill="url(#lwg-g)" stroke="#b97700" stroke-width="1.6"/><circle cx="16" cy="16" r="10.6" fill="none" stroke="#c98a00" stroke-width="1" stroke-opacity=".7"/><path d="M16 7.4l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" fill="#fff8d6" stroke="#b97700" stroke-width="1.1" stroke-linejoin="round"/></svg>';
const FAMN={Objects:'Everyday objects',Animals:'Animals',Weather:'Weather',Chores:'Chores'};
const PL={c:'word cards',b:'tiny stories',p:'action pairs',s:'story pages',w:'worksheet pages'};
let T,B;
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function norm(b){let s=0;for(const k in b)s+=b[k];const o={};for(const k in b)o[k]=b[k]/(s||1);return o}
// ---------- registry lookups
function defOf(id){id=T.ALIAS[id]||id;if(T.ITEMS[id])return Object.assign({id,tagged:1},T.ITEMS[id]);
  if(B[id])return {id,tagged:1,book:1,lvl:B[id].lvl};
  const d=T.DEFAULTS[P.typeOf(id)]||T.DEFAULTS.game;return Object.assign({id,tagged:0,label:id},d)}
function winDef(def,key){const base=String(key).split(':')[0];const w=(def.wins||{})[base]||{label:base,unit:''};const sfx=String(key).split(':')[1];
  return {label:w.label,unit:w.unit||'',bars:norm(w.bars||def.bars),lvl:(LV.indexOf(sfx)>=0?sfx:(w.lvl||def.lvl)),sfx:LV.indexOf(sfx)>=0?sfx:''}}
// ---------- scoring (pure function of the raw record + registry, so re-tagging re-scores history)
function ledger(){
  const data=P.goalsData(),C=data.c||{};
  const S={pts:{},lines:{},gram:{},topic:{},seen:{},untagged:[]};
  LV.forEach(l=>{S.pts[l]={};S.lines[l]={};S.gram[l]={};S.topic[l]={};S.seen[l]={}});
  const add=(L,bars,p)=>{if(!p)return;for(const b in bars)S.pts[L][b]=(S.pts[L][b]||0)+p*bars[b]};
  const line=(L,bar,txt,order)=>{(S.lines[L][bar]=S.lines[L][bar]||[]).push({t:txt,o:order||5})};
  const topics=(L,list,n)=>String(list||'').split(',').filter(Boolean).forEach(t=>S.topic[L][t]=(S.topic[L][t]||0)+(n||1));
  const gram=(L,list,n)=>String(list||'').split(',').filter(Boolean).forEach(g=>S.gram[L][g]=(S.gram[L][g]||0)+(n||1));
  const fam={}; // book pages seen: fam|L -> kind -> n
  Object.keys(C).forEach(id=>{const r=C[id],def=defOf(id);if(!def.tagged&&S.untagged.indexOf(id)<0)S.untagged.push(id);
    const L0=def.lvl;
    // book pages (coins)
    if(r.pg){const bk=B[id];Object.keys(r.pg).forEach(n=>{let kind='c',kb=null;if(bk){kind=bk.k[n-1]||'o';kb=T.KINDS[kind]}else kb={bars:def.bars,w:1,n:'page'};
      add(L0,norm(kb.bars),kb.w||1);
      if(bk){const key=bk.fam+'|'+L0;fam[key]=fam[key]||{};fam[key][kind]=(fam[key][kind]||0)+1;if(kind!=='o'){gram(L0,bk.g[n]);topics(L0,bk.t[n])}}})}
    // first play / completion
    if(r.f&&(def.book?0:1)&&P.typeOf(id)==='game'){add(L0,norm(def.bars),1)}
    if(r.d){const p=P.typeOf(id)==='worksheet'?2:(P.typeOf(id)==='project'?2:4);add(L0,norm(def.bars),p);if(def.g)gram(L0,def.g.join(','));if(def.topic)topics(L0,def.topic)}
    // videos in a series
    if(r.v){Object.keys(r.v).forEach(v=>{const L=(def.vLvl&&def.vLvl[v])||L0;add(L,norm(def.bars),4);if(def.g)gram(L,def.g.join(','));if(def.topic)topics(L,def.topic)})}
    // wins and improvements
    if(r.w){Object.keys(r.w).forEach(k=>{const w=r.w[k],wd=winDef(def,k);add(wd.lvl,wd.bars,3+1.5*Math.min(3,w.n||0));if(def.topic)topics(wd.lvl,def.topic)})}
    // correct choices
    if(r.ok){const n=Object.keys(r.ok).length;add(L0,norm(def.bars),Math.min(12,.75*n));if(def.topic)topics(L0,def.topic,n)}
    // item descriptions: one parent-facing sentence per item, shown under every bar that item feeds
    if(!def.book){const parts=[];
      if(r.w)Object.keys(r.w).forEach(k=>{const w=r.w[k],wd=winDef(def,k);const u=wd.unit?wd.unit+' ':'';const nm=wd.label+(wd.sfx?' ('+wd.sfx+')':'');
        const hasV=typeof w.f==='number';
        parts.push({t:hasV?`${nm}: first success at ${u}${w.f}${w.n?`, improved to ${u}${w.v}`:''}`:`${nm}: first success`,bars:wd.bars,L:wd.lvl})});
      if(r.v){const nv=Object.keys(r.v).length;parts.push({t:`${def.label}: ${nv}${def.vTotal?' of '+def.vTotal:''} ${def.vLabel||'videos'} finished`,bars:norm(def.bars),L:L0})}
      if(r.ok){const n=Object.keys(r.ok).length;parts.push({t:`${def.label}: ${n}${def.okTotal?' of '+def.okTotal:''} ${def.okLabel||'choices'} answered correctly`,bars:norm(def.bars),L:L0})}
      if(r.d&&!r.v)parts.push({t:`${def.label}: finished`,bars:norm(def.bars),L:L0});
      if(r.f&&!r.w&&!r.ok&&!r.d&&!r.v&&P.typeOf(id)==='game')parts.push({t:`${def.label}: tried`,bars:norm(def.bars),L:L0});
      parts.forEach(pt=>{for(const b in pt.bars)if(pt.bars[b]>=.1)line(pt.L,b,pt.t,3)})}});
  // book lines: one per family, with "x of N" using the published pages
  Object.keys(fam).forEach(key=>{const [f,L]=key.split('|');const tot={};Object.keys(B).forEach(id=>{if(window.LW&&LW.books&&!LW.books.some(b=>b.id===id))return;const bk=B[id];if(bk.fam!==f||bk.lvl!==L)return;for(const ch of bk.k)tot[ch]=(tot[ch]||0)+1});
    ['vocab','sentences','spelling','listening'].forEach(bar=>{const parts=[];Object.keys(T.KINDS).forEach(kd=>{if(kd==='o'||!fam[key][kd])return;const sh=norm(T.KINDS[kd].bars)[bar]||0;if(sh>=.2)parts.push(`${fam[key][kd]} of ${tot[kd]||'?'} ${PL[kd]}`)});
      if(parts.length)line(L,bar,`${FAMN[f]||f}: ${parts.join(', ')} seen`,1)})});
  // grammar and speaking lines
  LV.forEach(L=>{const gs=Object.keys(S.gram[L]).filter(g=>T.GRAMMAR[g]);gs.sort((a,b)=>S.gram[L][b]-S.gram[L][a]);
    if(gs.length)line(L,'grammar','Met so far: '+gs.map(g=>`${T.GRAMMAR[g][0]} (${S.gram[L][g]})`).join(', '),1);
    const left=Object.keys(T.GRAMMAR).filter(g=>LV.indexOf(T.GRAMMAR[g][1])<=LV.indexOf(L)&&!S.gram[L][g]&&!Object.keys(S.gram).some(l=>S.gram[l][g]));
    if(left.length&&(S.pts[L].grammar||0)>0)line(L,'grammar','Still to meet: '+left.map(g=>T.GRAMMAR[g][0]).join(', '),9);
    const ts=Object.keys(S.topic[L]).filter(t=>T.TOPICS[t]);
    if(ts.length)line(L,'speaking','Topics practised: '+ts.map(t=>T.TOPICS[t]).join(', '),1);
    const miss=Object.keys(T.TOPICS).filter(t=>!S.topic[L][t]&&!Object.keys(S.topic).some(l=>S.topic[l][t]));
    if(ts.length&&miss.length)line(L,'speaking','Still to try: '+miss.map(t=>T.TOPICS[t]).join(', '),9)});
  return S}
function total(S,L){return Object.values(S.pts[L]).reduce((a,b)=>a+b,0)}
function autoLevel(S){for(let i=LV.length-1;i>0;i--){if(total(S,LV[i])>=10)return LV[i]}return 'A1'} // highest level with 10+ points; A1 is the floor
function status(p){const f=p/TARGET;return f<=0?'Not started yet':f<.2?'Just started':f<.5?'Building':f<.8?'Going well':'Strong'}
// ---------- sound (WebAudio, no files)
let AC=null;function ac(){try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state==='suspended')AC.resume()}catch(e){}return AC}
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,()=>ac(),{passive:true,capture:true}));
function soundOn(){try{return localStorage.getItem('lwp.coinsound')!=='0'}catch(e){return true}}
function chime(){if(!soundOn())return;const c=ac();if(!c||c.state!=='running')return;const t=c.currentTime;
  [[1318.5,0,.30],[1975.5,.075,.34]].forEach(([f,d,len])=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;
    g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.05,t+d+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d+len);o.connect(g);g.connect(c.destination);o.start(t+d);o.stop(t+d+len+.02);
    const o2=c.createOscillator(),g2=c.createGain();o2.type='triangle';o2.frequency.value=f*2;g2.gain.setValueAtTime(0,t+d);g2.gain.linearRampToValueAtTime(.012,t+d+.004);g2.gain.exponentialRampToValueAtTime(.0001,t+d+len*.6);o2.connect(g2);g2.connect(c.destination);o2.start(t+d);o2.stop(t+d+len)})}
// ---------- UI
const css=`.lwg-star{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:0;border-radius:50%;background:transparent;padding:2px;cursor:pointer;position:relative;transition:transform .15s}.lwg-star:hover{transform:scale(1.08)}.lwg-star:focus-visible{outline:3px solid #6c4ea0;outline-offset:2px}.lwg-star svg{width:100%;height:100%;filter:drop-shadow(0 1px 2px rgba(120,80,0,.35))}
.lwg-star.pulse svg{animation:lwgp .5s ease}@keyframes lwgp{0%{transform:scale(1)}40%{transform:scale(1.35) rotate(-8deg)}100%{transform:scale(1)}}
.lwg-pn{position:fixed;z-index:1001;width:min(430px,calc(100vw - 16px));max-height:calc(100vh - 84px);overflow:auto;background:#fff;border-radius:20px;box-shadow:0 18px 50px rgba(60,40,110,.32);border:1px solid #eadff7;font-family:Nunito,system-ui,sans-serif;color:#45506b}
.lwg-hd{padding:16px 18px 10px;border-bottom:1px solid #f0e9f8}.lwg-hd h3{margin:0;color:#6c4ea0;font-size:20px}.lwg-hd p{margin:4px 0 0;font-size:13.5px;line-height:1.4}
.lwg-lv{display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap}.lwg-lv span{font-size:12.5px;font-weight:800;color:#8a7fa8;margin-right:2px}.lwg-lv button{border:2px solid #e2d3f3;background:#fff;color:#6c4ea0;border-radius:999px;padding:3px 11px;font:800 13px Nunito,system-ui,sans-serif;cursor:pointer}.lwg-lv button[aria-pressed=true]{background:#6c4ea0;border-color:#6c4ea0;color:#fff}
.lwg-bars{padding:6px 10px 4px}.lwg-b{border-radius:14px;margin:4px 0}.lwg-b>button{display:block;width:100%;text-align:left;border:0;background:#faf7fd;border-radius:14px;padding:10px 14px 11px;cursor:pointer;font-family:inherit;color:inherit}.lwg-b>button:hover{background:#f3ecfa}.lwg-b>button:focus-visible{outline:3px solid #6c4ea0}
.lwg-r{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:15.5px;color:#4a3a78}.lwg-r em{font-style:normal;font-size:12.5px;color:#2c7a6a;white-space:nowrap;margin-left:auto;font-weight:800}.lwg-r i{width:8px;height:8px;border:solid #8a7fa8;border-width:0 2px 2px 0;transform:rotate(45deg);transition:transform .15s;margin:-3px 2px 0 4px;flex:none}.lwg-b[data-open] .lwg-r i{transform:rotate(-135deg);margin-top:3px}
.lwg-can{display:block;font-size:13px;line-height:1.35;margin-top:3px;color:#5b6682}.lwg-tr{display:block;height:9px;border-radius:5px;background:#eadff7;margin-top:8px;overflow:hidden}.lwg-tr b{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#ffd23f,#e8a200);transition:width .5s}
.lwg-dt{display:none;padding:10px 16px 12px 16px;font-size:13.5px;line-height:1.45}.lwg-b[data-open] .lwg-dt{display:block}.lwg-dt h4{margin:2px 0 4px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#8a7fa8}.lwg-dt ul{margin:0 0 8px;padding-left:18px}.lwg-dt li{margin:2px 0}.lwg-ex{font-style:italic;color:#4a3a78}.lwg-no{color:#8a7fa8}
.lwg-ft{padding:8px 18px 14px;font-size:12.5px;color:#7a7f95;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}.lwg-ft button{border:2px solid #e2d3f3;background:#fff;color:#6c4ea0;border-radius:10px;padding:4px 10px;font:800 12.5px Nunito,system-ui,sans-serif;cursor:pointer}
.lwc{position:absolute;top:10px;right:10px;width:34px;height:34px;z-index:4;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(90,60,0,.4))}.lwc svg{width:100%;height:100%;display:block}.lwc.got{opacity:.28;filter:grayscale(.4)}
.lwc-fly{position:fixed;z-index:1100;pointer-events:none;width:34px;height:34px;margin:0;filter:drop-shadow(0 4px 6px rgba(90,60,0,.35))}.lwc-fly svg{width:100%;height:100%}
.lwg-plus{position:fixed;z-index:1100;pointer-events:none;font:800 14px Nunito,system-ui,sans-serif;color:#b97700;background:#fff8d6;border:1.5px solid #e0a526;border-radius:999px;padding:1px 8px;animation:lwgf 1s ease forwards}@keyframes lwgf{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}
@media (max-width:760px){.lwg-star{width:32px;height:32px}.lwp-nb{padding:6px 8px!important;font-size:12px!important}}
@media (prefers-reduced-motion:reduce){.lwg-star.pulse svg{animation:none}.lwg-tr b{transition:none}}`;
function addCSS(){if(document.getElementById('lwg-css'))return;const s=document.createElement('style');s.id='lwg-css';s.textContent=css;document.head.appendChild(s)}
let star=null,panel=null,openBars={};
function mount(){const box=document.querySelector('.lwp-st');if(!box||box.querySelector('.lwg-star'))return;
  star=document.createElement('button');star.type='button';star.className='lwg-star';star.id='lwg-star';star.setAttribute('aria-haspopup','dialog');star.setAttribute('aria-expanded','false');star.setAttribute('aria-label','Goals and progress for '+P.current().name);star.title='Goals and progress';star.innerHTML=STAR;
  const who=box.querySelector('#lwp-who');who&&who.nextSibling?box.insertBefore(star,who.nextSibling):box.appendChild(star);star.onclick=toggle}
function levelPref(){return P.goalsData().lv||'auto'}
function render(){if(!panel)return;const S=ledger(),pref=levelPref(),L=pref==='auto'?autoLevel(S):pref;
  const bars=T.GOALS.map(g=>{const p=S.pts[L][g.id]||0,pct=Math.min(100,Math.round(100*p/TARGET)),lv=g.levels[L];
    const lines=(S.lines[L][g.id]||[]).sort((a,b)=>a.o-b.o).filter(x=>typeof x.t==='string');
    const others=LV.filter(l=>l!==L&&(S.pts[l][g.id]||0)>0).map(l=>`${l}: ${status(S.pts[l][g.id])}`);
    return `<div class="lwg-b" data-g="${g.id}"${openBars[g.id]?' data-open="1"':''}><button type="button" aria-expanded="${openBars[g.id]?'true':'false'}" aria-controls="lwg-d-${g.id}"><span class="lwg-r"><span>${esc(g.title)}</span><em>${status(p)}</em><i></i></span><span class="lwg-can">${esc(lv.can)}</span><span class="lwg-tr" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(g.title)} progress"><b style="width:${pct}%"></b></span></button>
    <div class="lwg-dt" id="lwg-d-${g.id}" role="region" aria-label="${esc(g.title)} details"><h4>At level ${L}</h4><ul class="lwg-ex"><li>${esc(lv.ex[0])}</li><li>${esc(lv.ex[1])}</li></ul>
    <h4>What your child has done</h4>${lines.length?`<ul>${lines.map(x=>`<li>${esc(x.t)}</li>`).join('')}</ul>`:'<p class="lwg-no">Nothing recorded for this goal at this level yet. Points appear after the first activity.</p>'}
    ${others.length?`<h4>Other levels</h4><ul>${others.map(o=>`<li>${esc(o)}</li>`).join('')}</ul>`:''}</div></div>`}).join('');
  const keepTop=panel.scrollTop;
  panel.innerHTML=`<div class="lwg-hd"><h3>${esc(P.current().name)}'s goals</h3><p>Each goal fills as your child completes new things and improves. Repeating an activity does not add anything.</p>
   <div class="lwg-lv" role="group" aria-label="Level shown"><span>Level</span><button type="button" data-l="auto" aria-pressed="${pref==='auto'}">Automatic (${L})</button>${LV.map(l=>`<button type="button" data-l="${l}" aria-pressed="${pref===l}">${l}</button>`).join('')}</div></div>
   <div class="lwg-bars">${bars}</div><div class="lwg-ft"><span>Showing the ${L} version of each goal.</span><button type="button" id="lwg-snd" aria-pressed="${soundOn()}">Coin sound: ${soundOn()?'on':'off'}</button></div>`;
  panel.scrollTop=keepTop;
  panel.querySelectorAll('.lwg-b>button').forEach(b=>b.onclick=()=>{const g=b.parentNode.dataset.g;openBars[g]=!openBars[g];render()});
  panel.querySelectorAll('.lwg-lv button').forEach(b=>b.onclick=()=>{const d=P.goalsData();d.lv=b.dataset.l;P.goalsSave(d);render()});
  const sb=panel.querySelector('#lwg-snd');sb.onclick=()=>{try{localStorage.setItem('lwp.coinsound',soundOn()?'0':'1')}catch(e){}if(soundOn()){ac();chime()}render()}}
function place(){if(!panel||!star)return;const r=star.getBoundingClientRect(),w=Math.min(430,innerWidth-16);let x=r.left+r.width/2-w+36;x=Math.max(8,Math.min(x,innerWidth-w-8));panel.style.left=x+'px';panel.style.top=(r.bottom+8)+'px'}
function toggle(){panel?close():open()}
function open(){if(!star)return;if(panel)return;panel=document.createElement('div');panel.className='lwg-pn';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Goals and progress');document.body.appendChild(panel);star.setAttribute('aria-expanded','true');render();place();
  setTimeout(()=>{document.addEventListener('pointerdown',away,true);document.addEventListener('keydown',esc_,true)},0)}
function close(){if(!panel)return;panel.remove();panel=null;star&&star.setAttribute('aria-expanded','false');document.removeEventListener('pointerdown',away,true);document.removeEventListener('keydown',esc_,true)}
function away(e){if(panel&&!panel.contains(e.target)&&!star.contains(e.target))close()}
function esc_(e){if(e.key==='Escape'){close();star&&star.focus()}}
addEventListener('resize',place);addEventListener('scroll',()=>{if(panel&&!panel.matches(':hover'))place()},{passive:true});
// ---------- book page coins (viewer)
function coins(){const st=document.getElementById('stage');const book=new URLSearchParams(location.search).get('book');if(!st||!book)return;
  const hdr=document.querySelector('header.top');const items=[...st.querySelectorAll('.vitem.page')];if(!items.length)return;
  const list=items.map(el=>{const img=el.querySelector('img.slide');const m=img&&/Page (\d+)/.exec(img.alt||'');if(!m)return null;const n=+m[1];
    const got=P.hasCoin(book,n);const c=document.createElement('div');c.className='lwc'+(got?' got':'');c.innerHTML=STAR;c.setAttribute('aria-hidden','true');el.appendChild(c);
    return {el,n,c,got,seen:false}}).filter(Boolean);
  const io=new IntersectionObserver(es=>es.forEach(e=>{const o=list.find(x=>x.el===e.target);if(o&&e.intersectionRatio>=.25)o.seen=true}),{threshold:[0,.25,.5]});list.forEach(o=>io.observe(o.el));
  let q=[],busy=false;
  function check(){const hb=(hdr?hdr.getBoundingClientRect().bottom:0)+4;
    list.forEach(o=>{if(o.got||!o.seen)return;const r=o.c.getBoundingClientRect();if(r.top+r.height/2<=hb+6){o.got=true;q.push({o,rect:r,hb})}});
    if(q.length&&!busy)drain()}
  function drain(){busy=true;let animated=0;const run=()=>{const it=q.shift();if(!it){busy=false;return}
      const isNew=P.coin(book,it.o.n);it.o.c.classList.add('got');
      if(isNew){if(animated++<5){fly(it)}else pulse()}
      setTimeout(run,isNew&&animated<=5?160:0)};run()}
  let tick=false;const on=()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{tick=false;check()})};
  addEventListener('scroll',on,{passive:true});addEventListener('resize',on);setTimeout(on,300);
  window.LWGoals._coins={check,list}}
function fly(it){const s=star&&star.getBoundingClientRect();if(!s){pulse();return}
  const f=document.createElement('div');f.className='lwc-fly';f.innerHTML=STAR;document.body.appendChild(f);
  const sx=it.rect.left,sy=Math.max(it.rect.top,it.hb-4),ex=s.left+s.width/2-17,ey=s.top+s.height/2-17;
  f.style.left=sx+'px';f.style.top=sy+'px';
  const dur=matchMedia('(prefers-reduced-motion:reduce)').matches?200:760;
  const a=f.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1},{transform:`translate(${(ex-sx)*.35}px,${(ey-sy)*.55+6}px) scale(1.15) rotate(120deg)`,opacity:1,offset:.45},{transform:`translate(${ex-sx}px,${ey-sy}px) scale(.7) rotate(360deg)`,opacity:.9}],{duration:dur,easing:'cubic-bezier(.45,.05,.55,.95)',fill:'forwards'});
  window.LWGoals._lastFly=f;
  a.onfinish=()=>{f.remove();chime();pulse(true)}}
function pulse(plus){if(!star)return;star.classList.remove('pulse');void star.offsetWidth;star.classList.add('pulse');if(plus){const r=star.getBoundingClientRect(),p=document.createElement('div');p.className='lwg-plus';p.textContent='+1';p.style.left=(r.left+r.width/2-14)+'px';p.style.top=(r.bottom-2)+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1000)}
  if(panel)render()}
window.LWGoals={ledger:()=>ledger(),autoLevel:()=>autoLevel(ledger()),open,close,chime,level:()=>{const S=ledger(),p=levelPref();return p==='auto'?autoLevel(S):p}};
function load(src,cb){const s=document.createElement('script');s.src=ROOT+src;s.onload=cb;s.onerror=()=>console.warn('[goals] could not load',src);document.head.appendChild(s)}
function init(){T=window.LWGoalTags;B=window.LWGoalBooks||{};if(!T)return;addCSS();mount();coins();
  addEventListener('lwgoals',e=>{if(!panel)return;render()});
  const u=ledger().untagged;if(u.length)console.info('[goals] content without a tag entry (scored with defaults):',u.join(', '))}
function boot(){load('js/goal-tags.js',()=>load('js/goal-books.js',init))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
