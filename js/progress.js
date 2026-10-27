/* Little Wonders · per-student progress (one shared module, no build step).
   Include on any page:  <script src="(path to)/js/progress.js" data-id="games/my-game" data-type="game"></script>
   Types: game | book | project | worksheet | videoSeries | video   (see README "Progress tracking"). */
(function(){
if(window.LWProgress)return;
const KS='lwp.students',KD='lwp.data.';
// ---- registry: id -> {type,total}. Anything not listed gets a type from its location (see typeOf).
const REG={
  'games/four-corners':{type:'project'},
  'games/everyday-english':{type:'videoSeries',total:11},
  'stories/comic-stories':{type:'videoSeries',total:10},
  'lessons/conversations':{type:'videoSeries',total:3},
  'lessons/conversations/a1':{type:'video',series:'lessons/conversations'},
  'lessons/conversations/a2':{type:'video',series:'lessons/conversations'},
  'lessons/conversations/b1':{type:'video',series:'lessons/conversations'},
  'stories/jack-texts':{type:'worksheet'},
  'chem':{type:'worksheet'},
  'lessons/chem-word-lab':{type:'worksheet',alias:'chem'}
};
function register(id,type,opts){REG[id]=Object.assign({},REG[id]||{},opts||{},{type});return REG[id]}
function typeOf(id){if(REG[id])return REG[id].type;if(id.indexOf('/')<0)return 'book';return 'game'}
// ---- students
function jget(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const MAIN='My account',MAINID='s0'; // the teacher's own profile: always present, always first, never deleted or reset
function st(){const s=jget(KS,null)||{};if(!Array.isArray(s.list))s.list=[];
  s.list=s.list.filter(x=>x&&x.id&&x.id!==MAINID&&String(x.name||'').trim());s.list.unshift({id:MAINID,name:MAIN});
  if(!s.list.some(x=>x.id===s.cur))s.cur=MAINID;return s}
function current(){const s=st();return s.list.find(x=>x.id===s.cur)||s.list[0]}
function students(){return st().list}
function nameTaken(name){const n=name.toLowerCase();return st().list.some(x=>x.name.toLowerCase()===n)}
// New student only ADDS a profile (fresh id, empty data). It never touches My account (s0) or any other profile's data.
function newStudent(name){name=String(name||'').trim().replace(/\s+/g,' ').slice(0,40);if(!name||nameTaken(name))return null;const s=st();let id;
  do{id='s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}while(id===MAINID||s.list.some(x=>x.id===id));
  s.list.push({id,name});s.cur=id;jset(KS,s);return id}
function switchStudent(id){const s=st();if(s.list.some(x=>x.id===id)){s.cur=id;jset(KS,s)}}
function all(){return jget(KD+current().id,{})}
function rec(id){return all()[resolve(id)]||null}
function upd(id,f){id=resolve(id);const d=all();const r0=d[id]||{};d[id]=f(r0)||r0;d[id].t=Date.now();jset(KD+current().id,d);return d[id]}
function resolve(id){return REG[id]&&REG[id].alias||id}
// ---- goals data layer: RAW events only (first plays, first wins and best values, correct choices, book-page coins).
// Points are computed from these by js/goals.js using the tag registry (js/goal-tags.js), so re-tagging re-scores history.
const KG='lwp.goals.';
function goalsData(){return jget(KG+current().id,{})}
function goalsSave(d){jset(KG+current().id,d)}
function gupd(id,f){id=resolve(id);const d=goalsData();d.c=d.c||{};const r=d.c[id]||(d.c[id]={});const res=f(r);if(res){d.t=Date.now();goalsSave(d);try{dispatchEvent(new CustomEvent('lwgoals',{detail:Object.assign({id},res)}))}catch(e){}}return res||null}
// win(id,key,{v,lvl}): first success of `key` (a named task) is recorded once; a higher `v` later counts as an improvement. Returns {first}|{better}|null.
function win(id,key,o){o=o||{};const v=typeof o.v==='number'&&isFinite(o.v)?o.v:null;return gupd(id,r=>{r.w=r.w||{};const w=r.w[key];
  if(!w){r.w[key]={t:Date.now(),f:v,v:v,n:0};return {first:1}}
  if(v!==null&&(w.v===null||v>w.v)){if(w.v===null)w.f=v;else w.n=(w.n||0)+1;w.v=v;return {better:1}}return null})}
function correct(id,key){return gupd(id,r=>{r.ok=r.ok||{};if(r.ok[key])return null;r.ok[key]=1;return {first:1}})}
function coin(book,n){return !!gupd(book,r=>{r.pg=r.pg||{};if(r.pg[n])return null;r.pg[n]=Date.now();return {coin:n}})}
function hasCoin(book,n){const r=(goalsData().c||{})[resolve(book)];return !!(r&&r.pg&&r.pg[n])}
// ---- events
function played(id){const r=upd(id,r=>{r.n=(r.n||0)+1});if(typeOf(id)==='game')gupd(id,g=>{if(g.f)return null;g.f=Date.now();return {first:1}});return r}
function open(id){return upd(id,r=>{r.open=1})}
function finish(id){const r=upd(id,r=>{r.open=1;r.done=1});gupd(id,g=>{if(g.d)return null;g.d=Date.now();return {done:1}});return r}
function page(id,n,last){return upd(id,r=>{r.last=n;r.max=Math.max(r.max||0,n);if(last&&n>=last)r.done=1})}
function watched(series,vid,noGoal){if(REG[series]&&REG[series].type==='video'){const p=REG[series].series;if(p)upd(p,r=>{r.w=r.w||{};r.w[series]=1});gupd(series,g=>{if(g.d)return null;g.d=Date.now();return {done:1}});return upd(series,r=>{r.done=1})}
  if(!noGoal)gupd(series,g=>{g.v=g.v||{};if(g.v[vid])return null;g.v[vid]=Date.now();return {video:vid}});
  return upd(series,r=>{r.w=r.w||{};r.w[vid]=1})}
function isWatched(series,vid){const r=rec(series);return !!(r&&r.w&&r.w[vid])}
// ---- marks
const CK='<span class="lwp-ck" aria-label="done"></span>';
const INF='<svg class="lwp-inf" viewBox="0 0 24 12" aria-label="in progress"><path d="M6 1.5C3.2 1.5 1.5 3.6 1.5 6s1.7 4.5 4.5 4.5c3.6 0 8.4-9 12-9 2.8 0 4.5 2.1 4.5 4.5s-1.7 4.5-4.5 4.5c-3.6 0-8.4-9-12-9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
function marks(id){const t=typeOf(id),r=rec(id),R=REG[resolve(id)]||REG[id]||{};if(!r)return null;let c=null;
  if(t==='game'){if(!r.n)return null;c=String(r.n)}
  else if(t==='book'){if((r.max||0)<3&&!r.done)return null;c=r.done?null:String(r.max)}
  else if(t==='project'){if(!r.open)return null;c=r.done?null:INF}
  else if(t==='worksheet'||t==='video'){if(!r.open&&!r.done)return null}
  else if(t==='videoSeries'){const w=Object.keys(r.w||{}).length;if(!w)return null;c=w+'/'+(R.total||w)}
  return {check:true,count:c}}
function markHTML(id){const m=marks(id);if(!m)return '';return `<span class="lwp-mk lwp-l">${CK}</span>`+(m.count?`<span class="lwp-mk lwp-r">${m.count}</span>`:'')}
function idFromHref(href){if(!href)return null;let u;try{u=new URL(href,location.href)}catch(e){return null}
  const q=u.searchParams;if(/\/viewer\.html$/.test(u.pathname)&&q.get('book'))return q.get('book');if(/\/book\.html$/.test(u.pathname)&&q.get('s'))return q.get('s');
  const base=new URL('.',SCRIPT_BASE).pathname;let p=u.pathname;if(p.indexOf(base)!==0)return null;p=p.slice(base.length).replace(/\/index\.html$/,'').replace(/\/$/,'');
  const keys=Object.keys(REG).sort((a,b)=>b.length-a.length);for(const k of keys)if(p===k)return k;
  for(const k of keys)if(p.indexOf(k+'/')===0)return k;
  return p.replace(/\/[^/]+\.html$/,'')}
// decorate any element (default: home/level cards). sel: elements; get: el -> {id, box}
function decorate(root){(root||document).querySelectorAll('.card').forEach(c=>{const a=c.querySelector('a.cl')||c.querySelector('.dls a');const th=c.querySelector('.thumb');if(!a||!th)return;
  const id=c.dataset.pid||idFromHref(a.getAttribute('href'));if(!id)return;th.classList.add('lwp-box');th.querySelectorAll('.lwp-mk').forEach(x=>x.remove());th.insertAdjacentHTML('beforeend',markHTML(id))})}
function checkHTML(){return `<span class="lwp-mk lwp-l">${CK}</span>`}
// ---- styles
const css=`.lwp-box{position:relative}.lwp-mk.lwp-mk{position:absolute;bottom:8px;z-index:3;display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 7px;border-radius:13px;background:rgba(255,255,255,.94);box-shadow:0 1px 5px rgba(0,0,0,.18);font:800 13px/1 Nunito,system-ui,sans-serif;color:#2c7a6a;pointer-events:none}
.lwp-mk.lwp-l{left:8px;padding:0;width:26px}.lwp-mk.lwp-r{right:8px}.lwp-ck.lwp-ck{margin:0;padding:0;display:block;width:7px;height:13px;border:solid #2c9a83;border-width:0 3px 3px 0;transform:translateY(-2px) rotate(45deg)}.lwp-inf{width:22px;height:11px;color:#6c4ea0}
.lwp-st{display:flex;align-items:center;gap:8px;margin-left:8px;white-space:nowrap}.lwp-who{display:inline-flex;align-items:center;gap:5px;border:2px solid #d9c9ee;border-radius:12px;background:#f6f0fc;padding:5px 10px;font:700 13px Nunito,system-ui,sans-serif;color:#8a7fa8;max-width:200px;cursor:pointer}.lwp-who:hover{border-color:#6c4ea0}.lwp-who b{color:#6c4ea0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lwp-who:after{content:'';border:solid #6c4ea0;border-width:0 2px 2px 0;padding:2px;transform:translateY(-2px) rotate(45deg)}
.lwp-nb{border:0;border-radius:12px;padding:7px 12px;font:800 14px Nunito,system-ui,sans-serif;background:#6c4ea0;color:#fff;cursor:pointer}.lwp-nb:hover{background:#5a3f8a}
.lwp-ov{position:fixed;inset:0;z-index:1000;background:rgba(40,30,70,.35);display:flex;align-items:center;justify-content:center;padding:16px}
.lwp-dlg{background:#fff;border-radius:22px;box-shadow:0 18px 50px rgba(60,40,110,.3);padding:22px 22px 18px;width:min(380px,100%);font-family:Nunito,system-ui,sans-serif;color:#45506b}
.lwp-dlg h3{margin:0 0 4px;color:#6c4ea0;font-size:21px}.lwp-dlg p{margin:0 0 12px;font-size:14px}.lwp-dlg input,.lwp-dlg select{width:100%;box-sizing:border-box;border:2px solid #e2d3f3;border-radius:12px;padding:10px 12px;font:700 16px Nunito,system-ui,sans-serif;color:#45506b;outline:0}.lwp-dlg input:focus{border-color:#6c4ea0}
.lwp-row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}.lwp-row button{border:0;border-radius:12px;padding:9px 16px;font:800 15px Nunito,system-ui,sans-serif;cursor:pointer}.lwp-ok{background:#2c9a83;color:#fff}.lwp-cn{background:#f0eaf8;color:#6c4ea0}
.lwp-sw{margin-top:14px;padding-top:12px;border-top:1px solid #eee}.lwp-sw label{display:block;font-size:13px;font-weight:800;margin-bottom:6px}
.lwp-now{background:#f0eaf8;border-radius:12px;padding:8px 12px;margin:0 0 12px;font-size:14px}.lwp-now b{color:#6c4ea0}
.lwp-ls{display:flex;flex-direction:column;gap:6px;max-height:210px;overflow:auto;margin:0 0 4px}.lwp-ls button{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;box-sizing:border-box;border:2px solid #e2d3f3;border-radius:12px;background:#fff;padding:9px 12px;font:800 15px Nunito,system-ui,sans-serif;color:#45506b;cursor:pointer;text-align:left}.lwp-ls button:hover{border-color:#6c4ea0}.lwp-ls button.cur{border-color:#2c9a83;background:#e6f5f1;cursor:default}.lwp-ls small{font-weight:800;color:#2c7a6a;white-space:nowrap}.lwp-err{color:#b3261e;font-size:13px;font-weight:700;margin:6px 0 0;min-height:1em}
.lwp-done{position:relative}.lwp-done>.lwp-mk.lwp-mk{top:8px;bottom:auto}
@media (max-width:760px){.lwp-who{max-width:118px;padding:4px 8px}.lwp-who span{display:none}.lwp-st{gap:5px;margin-left:4px}.lwp-nb{padding:6px 10px;font-size:13px}}`;
function addCSS(){if(document.getElementById('lwp-css'))return;const s=document.createElement('style');s.id='lwp-css';s.textContent=css;(document.head||document.documentElement).appendChild(s)}
// ---- New student control (pages with the site header)
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function header(){const top=document.querySelector('header.top');if(!top||!top.querySelector('#menu')||top.querySelector('.lwp-st'))return;const cur=current();
  const box=document.createElement('div');box.className='lwp-st';
  box.innerHTML=`<button type="button" class="lwp-who" id="lwp-who" title="Switch student" aria-label="Current student: ${esc(cur.name)}. Switch student"><span>Student:</span> <b>${esc(cur.name)}</b></button><button type="button" class="lwp-nb" id="lwp-new">New student</button>`;
  const burger=top.querySelector('.burger');top.insertBefore(box,burger||null);box.querySelector('#lwp-who').onclick=box.querySelector('#lwp-new').onclick=dialog}
function dialog(){if(document.querySelector('.lwp-ov'))return;const cur=current(),list=students();const ov=document.createElement('div');ov.className='lwp-ov';
  ov.innerHTML=`<div class="lwp-dlg" role="dialog" aria-modal="true" aria-labelledby="lwp-h"><h3 id="lwp-h">Students</h3>
  <p class="lwp-now">Showing: <b>${esc(cur.name)}</b></p>
  <div class="lwp-sw" style="margin-top:0;padding-top:0;border:0"><label>Switch to</label><div class="lwp-ls">${list.map(x=>`<button type="button" data-id="${x.id}"${x.id===cur.id?' class="cur" aria-current="true"':''}><span>${esc(x.name)}</span>${x.id===cur.id?'<small>Showing now</small>':''}</button>`).join('')}</div></div>
  <div class="lwp-sw"><label for="lwp-name">New student</label><input id="lwp-name" maxlength="40" placeholder="Student name" autocomplete="off"><p class="lwp-err" id="lwp-err" role="alert"></p>
  <p style="margin:6px 0 0;font-size:13px">A new student starts with a clean slate. ${esc(MAIN)} and every other student keep their progress.</p></div>
  <div class="lwp-row"><button class="lwp-cn" type="button">Close</button><button class="lwp-ok" type="button">Add student</button></div></div>`;
  document.body.appendChild(ov);const inp=ov.querySelector('#lwp-name'),err=ov.querySelector('#lwp-err');const close=()=>ov.remove();
  const save=()=>{const v=inp.value.trim();if(!v){err.textContent='Type a name first.';inp.focus();return}
    if(newStudent(v))location.reload();else{err.textContent=nameTaken(v.replace(/\s+/g,' '))?'That name is already used.':'Please try another name.';inp.focus()}};
  ov.querySelector('.lwp-ok').onclick=save;ov.querySelector('.lwp-cn').onclick=close;ov.onclick=e=>{if(e.target===ov)close()};
  inp.onkeydown=e=>{if(e.key==='Enter')save();if(e.key==='Escape')close()};ov.onkeydown=e=>{if(e.key==='Escape')close()};
  ov.querySelectorAll('.lwp-ls button').forEach(b=>b.onclick=()=>{if(b.dataset.id===cur.id){close();return}switchStudent(b.dataset.id);location.reload()});
  (ov.querySelector('.lwp-ls button:not(.cur)')||inp).focus()}
// ---- auto wiring from the <script> tag
const ME=document.currentScript;const SCRIPT_BASE=new URL('..',ME?ME.src:location.href).href; // site root
function loadGoals(){if(document.getElementById('lwg-js')||!document.querySelector('header.top .lwp-st'))return;const s=document.createElement('script');s.id='lwg-js';s.src=new URL('js/goals.js',SCRIPT_BASE).href;document.head.appendChild(s)}
function auto(){addCSS();header();loadGoals();const id=ME&&ME.dataset.id;if(!id)return;const t=ME.dataset.type||typeOf(id);if(ME.dataset.type)register(id,t);
  const also=ME.dataset.series; // "seriesId:videoId" also marked when this item is used
  if(t==='game'){let done=false;const go=()=>{if(done||API.manual)return;done=true;played(id);if(also){const [s,v]=also.split(':');watched(s,v,true)}};
    ['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,go,{capture:true,once:false,passive:true}))}
  else if(t==='project'||t==='worksheet'){open(id);if(t==='worksheet')finish(id)}
  const fin=ME.dataset.finish;if(fin){const chk=()=>{if(document.querySelector(fin)){finish(id);mo.disconnect()}};const mo=new MutationObserver(chk);
    const start=()=>{mo.observe(document.body,{childList:true,subtree:true});chk()};document.body?start():addEventListener('DOMContentLoaded',start)}}
const API={win,correct,coin,hasCoin,goalsData,goalsSave,register,typeOf,played,open,finish,page,watched,isWatched,get:rec,marks,markHTML,checkHTML,decorate,idFromHref,current,students,newStudent,switchStudent,dialog,manual:false};
window.LWProgress=API;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})();
