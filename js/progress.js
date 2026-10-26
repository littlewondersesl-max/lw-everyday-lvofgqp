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
function st(){return jget(KS,{cur:'s0',list:[{id:'s0',name:''}]})}
function current(){const s=st();return s.list.find(x=>x.id===s.cur)||{id:s.cur,name:''}}
function students(){return st().list.filter(x=>x.name)}
function newStudent(name){name=String(name||'').trim().slice(0,40);if(!name)return null;const s=st();const id='s'+Date.now().toString(36);
  s.list.push({id,name});s.cur=id;jset(KS,s);localStorage.removeItem(KD+id);return id}
function switchStudent(id){const s=st();if(s.list.some(x=>x.id===id)){s.cur=id;jset(KS,s)}}
function all(){return jget(KD+current().id,{})}
function rec(id){return all()[resolve(id)]||null}
function upd(id,f){id=resolve(id);const d=all();const r0=d[id]||{};d[id]=f(r0)||r0;d[id].t=Date.now();jset(KD+current().id,d);return d[id]}
function resolve(id){return REG[id]&&REG[id].alias||id}
// ---- events
function played(id){return upd(id,r=>{r.n=(r.n||0)+1})}
function open(id){return upd(id,r=>{r.open=1})}
function finish(id){return upd(id,r=>{r.open=1;r.done=1})}
function page(id,n,last){return upd(id,r=>{r.last=n;r.max=Math.max(r.max||0,n);if(last&&n>=last)r.done=1})}
function watched(series,vid){if(REG[series]&&REG[series].type==='video'){const p=REG[series].series;if(p)upd(p,r=>{r.w=r.w||{};r.w[series]=1});return upd(series,r=>{r.done=1})}
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
.lwp-st{display:flex;align-items:center;gap:8px;margin-left:8px;white-space:nowrap}.lwp-who{font-size:13px;color:#8a7fa8;max-width:160px;overflow:hidden;text-overflow:ellipsis}.lwp-who b{color:#6c4ea0}
.lwp-nb{border:0;border-radius:12px;padding:7px 12px;font:800 14px Nunito,system-ui,sans-serif;background:#6c4ea0;color:#fff;cursor:pointer}.lwp-nb:hover{background:#5a3f8a}
.lwp-ov{position:fixed;inset:0;z-index:1000;background:rgba(40,30,70,.35);display:flex;align-items:center;justify-content:center;padding:16px}
.lwp-dlg{background:#fff;border-radius:22px;box-shadow:0 18px 50px rgba(60,40,110,.3);padding:22px 22px 18px;width:min(380px,100%);font-family:Nunito,system-ui,sans-serif;color:#45506b}
.lwp-dlg h3{margin:0 0 4px;color:#6c4ea0;font-size:21px}.lwp-dlg p{margin:0 0 12px;font-size:14px}.lwp-dlg input,.lwp-dlg select{width:100%;box-sizing:border-box;border:2px solid #e2d3f3;border-radius:12px;padding:10px 12px;font:700 16px Nunito,system-ui,sans-serif;color:#45506b;outline:0}.lwp-dlg input:focus{border-color:#6c4ea0}
.lwp-row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}.lwp-row button{border:0;border-radius:12px;padding:9px 16px;font:800 15px Nunito,system-ui,sans-serif;cursor:pointer}.lwp-ok{background:#2c9a83;color:#fff}.lwp-cn{background:#f0eaf8;color:#6c4ea0}
.lwp-sw{margin-top:14px;padding-top:12px;border-top:1px solid #eee}.lwp-sw label{display:block;font-size:13px;font-weight:800;margin-bottom:6px}
.lwp-done{position:relative}.lwp-done>.lwp-mk.lwp-mk{top:8px;bottom:auto}
@media (max-width:760px){.lwp-who{display:none}.lwp-nb{padding:6px 10px;font-size:13px}}`;
function addCSS(){if(document.getElementById('lwp-css'))return;const s=document.createElement('style');s.id='lwp-css';s.textContent=css;(document.head||document.documentElement).appendChild(s)}
// ---- New student control (pages with the site header)
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function header(){const top=document.querySelector('header.top');if(!top||!top.querySelector('#menu')||top.querySelector('.lwp-st'))return;const cur=current();
  const box=document.createElement('div');box.className='lwp-st';
  box.innerHTML=(cur.name?`<span class="lwp-who">Student: <b>${esc(cur.name)}</b></span>`:'')+`<button type="button" class="lwp-nb" id="lwp-new">New student</button>`;
  const burger=top.querySelector('.burger');top.insertBefore(box,burger||null);box.querySelector('button').onclick=dialog}
function dialog(){const others=students().filter(x=>x.id!==current().id);const ov=document.createElement('div');ov.className='lwp-ov';
  ov.innerHTML=`<div class="lwp-dlg" role="dialog" aria-modal="true" aria-labelledby="lwp-h"><h3 id="lwp-h">New student</h3><p>Type the student's name. They start with a clean slate: no marks on anything.</p>
  <input id="lwp-name" maxlength="40" placeholder="Student name" autocomplete="off"><div class="lwp-row"><button class="lwp-cn" type="button">Cancel</button><button class="lwp-ok" type="button">Save</button></div>
  ${others.length?`<div class="lwp-sw"><label for="lwp-pick">Or continue with a saved student</label><select id="lwp-pick"><option value="">Choose…</option>${others.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>`:''}</div>`;
  document.body.appendChild(ov);const inp=ov.querySelector('#lwp-name');inp.focus();const close=()=>ov.remove();
  const save=()=>{if(newStudent(inp.value))location.reload();else inp.focus()};
  ov.querySelector('.lwp-ok').onclick=save;ov.querySelector('.lwp-cn').onclick=close;ov.onclick=e=>{if(e.target===ov)close()};
  inp.onkeydown=e=>{if(e.key==='Enter')save();if(e.key==='Escape')close()};
  const pk=ov.querySelector('#lwp-pick');if(pk)pk.onchange=()=>{if(pk.value){switchStudent(pk.value);location.reload()}}}
// ---- auto wiring from the <script> tag
const ME=document.currentScript;const SCRIPT_BASE=new URL('..',ME?ME.src:location.href).href; // site root
function auto(){addCSS();header();const id=ME&&ME.dataset.id;if(!id)return;const t=ME.dataset.type||typeOf(id);if(ME.dataset.type)register(id,t);
  const also=ME.dataset.series; // "seriesId:videoId" also marked when this item is used
  if(t==='game'){let done=false;const go=()=>{if(done||API.manual)return;done=true;played(id);if(also){const [s,v]=also.split(':');watched(s,v)}};
    ['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,go,{capture:true,once:false,passive:true}))}
  else if(t==='project'||t==='worksheet'){open(id);if(t==='worksheet')finish(id)}
  const fin=ME.dataset.finish;if(fin){const chk=()=>{if(document.querySelector(fin)){finish(id);mo.disconnect()}};const mo=new MutationObserver(chk);
    const start=()=>{mo.observe(document.body,{childList:true,subtree:true});chk()};document.body?start():addEventListener('DOMContentLoaded',start)}}
const API={register,typeOf,played,open,finish,page,watched,isWatched,get:rec,marks,markHTML,checkHTML,decorate,idFromHref,current,students,newStudent,switchStudent,dialog,manual:false};
window.LWProgress=API;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
})();
