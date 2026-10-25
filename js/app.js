(function(){
const D=window.LW, Q=s=>document.querySelector(s);
const SECTIONS=[['packs','Flashcard Packs'],['weather','Everyday Weather'],['chores','Household Chores'],['games','Games'],['stories','Stories & Reading'],['lessons','Lessons']];
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function entries(sec){
  const b=D.books.filter(x=>x.section===sec).map(x=>({title:x.title,sub:x.sub,href:'viewer.html?book='+x.id,img:x.cover,book:x}));
  return b.concat(D.items.filter(x=>x.section===sec));
}
const NAV=[
  ['Everyday Series',[['Flashcard packs',()=>entries('packs').filter(e=>!e.book||e.book.id!=='az')],['Everyday Weather',()=>entries('weather')],['Household Chores',()=>entries('chores')]]],
  ['Games',()=>entries('games')],
  ['Stories & Reading','stories'],
  ['Lessons',()=>{const l=entries('lessons'),az=entries('packs').filter(e=>e.book&&e.book.id==='az');const g=e=>(e.book&&e.book.group)||e.group||'';return {main:az.concat(l.filter(e=>!g(e))),groups:[...new Set(l.filter(g).map(g))].map(n=>[n,l.filter(e=>g(e)===n)])}}]
];
function link(e,cls){cls=cls?` class="${cls}"`:'';return e.href?`<a${cls} href="${e.href}">${esc(e.title)}</a>`:e.links?e.links.map(l=>`<a${cls} href="${l[1]}">${esc(e.title.split('—')[0].trim())}: ${esc(l[0])}</a>`).join(''):`<span class="soon">${esc(e.title)} (soon)</span>`}
function navBody(name,src){
  if(src==='stories'){const all=entries('stories'),lib=all.find(e=>e.title==='Story Library');
    return (lib?link(lib,'pin'):'')+all.filter(e=>e!==lib).map(e=>link(e,'child')).join('')}
  if(Array.isArray(src)) return src.map(([n,f])=>`<div class="sdd"><button class="sddb">${n} ▸</button><div class="sddm">${f().map(e=>link(e)).join('')}</div></div>`).join('');
  const r=src(); if(Array.isArray(r)) return r.map(e=>link(e)).join('');
  return r.main.map(e=>link(e)).join('')+r.groups.map(([n,a])=>`<div class="grp">${esc(n)}</div>`+a.map(e=>link(e)).join('')).join('');
}
function menu(){
  const m=Q('#menu'); m.innerHTML=NAV.map(([name,src])=>`<div class="dd"><button class="ddb">${name} ▾</button><div class="ddm">${navBody(name,src)}</div></div>`).join('');
  m.querySelectorAll('.sddb').forEach(b=>b.onclick=e=>{b.parentNode.classList.toggle('open');e.stopPropagation()});
  m.querySelectorAll('.ddm').forEach(d=>d.addEventListener('click',e=>{if(e.target.tagName!=='A')e.stopPropagation()}));
  m.querySelectorAll('.ddb').forEach(b=>b.onclick=e=>{const p=b.parentNode;const o=p.classList.contains('open');m.querySelectorAll('.dd').forEach(x=>x.classList.remove('open'));if(!o)p.classList.add('open');e.stopPropagation()});
  document.addEventListener('click',()=>m.querySelectorAll('.dd').forEach(x=>x.classList.remove('open')));
  Q('#burger').onclick=()=>m.classList.toggle('show');
}
function home(){
  menu();
  Q('#home').innerHTML=`<section class="hero"><img src="img/logo.png" alt=""><div><h1>The Everyday Series</h1><p>Picture sentence flashcards, games and stories for young English learners. Pick a book to open the lesson: pages in order, with games in between.</p></div></section>`+
  SECTIONS.map(([id,name])=>`<section class="sec" id="${id}"><h2>${name}</h2><div class="grid">${entries(id).map(e=>{
    const img=e.img?`<div class="thumb"><img loading="lazy" src="${e.img}" alt=""></div>`:`<div class="thumb ph">Coming soon</div>`;
    const dls=e.book&&e.book.downloads.length?`<div class="dls">${e.book.downloads.map(d=>`<a href="${d.href}" download>${esc(d.label)}</a>`).join('')}</div>`:'';
    const links=e.links?`<div class="dls">${e.links.map(l=>`<a href="${l[1]}">${esc(l[0])}</a>`).join('')}</div>`:'';
    const body=`${img}<div class="ct"><h3>${esc(e.title)}</h3><p>${esc(e.sub||'')}</p>${e.note?`<p class="note">${esc(e.note)}</p>`:''}</div>`;
    return `<div class="card${e.href?'':' off'}">${e.href?`<a class="cl" href="${e.href}">${body}</a>`:body}${dls}${links}</div>`}).join('')}</div></section>`).join('');
}
function viewer(){
  menu();
  const id=new URLSearchParams(location.search).get('book'); const b=D.books.find(x=>x.id===id)||D.books[0];
  document.title=b.title+' · Little Wonders'; Q('#btitle').textContent=b.title;
  let i=Math.max(0,Math.min(b.seq.length-1,(parseInt((location.hash||'').slice(1))||1)-1));
  const st=Q('#stage'), strip=Q('#strip');
  strip.innerHTML=b.seq.map((s,k)=>`<button data-k="${k}" class="th ${s.type}">${s.type==='page'?`<img loading="lazy" src="${s.src}" alt="page ${s.n}">`:`<span>${s.type==='game'?'🎮':'▶'}<br>${esc(s.title)}</span>`}</button>`).join('');
  strip.querySelectorAll('.th').forEach(t=>t.onclick=()=>go(+t.dataset.k));
  function show(){
    const s=b.seq[i];
    if(s.type==='page') st.innerHTML=`<img class="slide" src="${s.src}" alt="Page ${s.n}">`;
    else if(s.type==='game') st.innerHTML=`<div class="gamebox"><div class="gbar">Game: <b>${esc(s.title)}</b> <a href="${s.src}" target="_blank">open full screen ↗</a></div><iframe src="${s.src}" title="${esc(s.title)}" allow="fullscreen; autoplay"></iframe></div>`;
    else if(s.src) st.innerHTML=`<video class="bookvid" src="${s.src}"${s.poster?` poster="${s.poster}"`:''} controls playsinline preload="metadata" title="${esc(s.title)}"></video>`;
    else st.innerHTML=`<div class="videoph"><div class="play">▶</div><h3>${esc(s.title)}</h3><p>Video slot — coming soon.</p></div>`;
    const pn=s.type==='page'?`Page ${s.n}`:(s.type==='game'?'Game':'Video');
    Q('#count').textContent=`${pn} · ${i+1} / ${b.seq.length}`;
    strip.querySelectorAll('.th').forEach((t,k)=>t.classList.toggle('on',k===i));
    const a=strip.children[i]; if(a) strip.scrollTo({left:a.offsetLeft-strip.clientWidth/2+a.clientWidth/2,behavior:'smooth'});
    st.classList.toggle('isgame',s.type==='game');
    history.replaceState(null,'','#'+(i+1));
    Q('#prev').disabled=i===0; Q('#next').disabled=i===b.seq.length-1;
    const n=b.seq[i+1]; if(n&&n.type==='page'){const im=new Image();im.src=n.src}
  }
  function go(k){if(k<0||k>=b.seq.length)return;i=k;show()}
  Q('#prev').onclick=()=>go(i-1); Q('#next').onclick=()=>go(i+1);
  Q('#fs').onclick=()=>{const e=Q('.stagewrap');document.fullscreenElement?document.exitFullscreen():e.requestFullscreen&&e.requestFullscreen()};
  document.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){go(i+1);e.preventDefault()}if(e.key==='ArrowLeft'||e.key==='PageUp'){go(i-1);e.preventDefault()}if(e.key==='Home')go(0);if(e.key==='End')go(b.seq.length-1)});
  let sx=null,sy=0; st.addEventListener('touchstart',e=>{if(b.seq[i].type!=='page')return;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
  st.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))go(i+(dx<0?1:-1));sx=null});
  Q('#downloads').innerHTML=`<h3>Downloads</h3>${b.downloads.map(d=>`<a class="dlb" href="${d.href}" download>⬇ ${esc(d.label)} <small>${d.size} MB</small></a>`).join('')||'<p>No downloads.</p>'}${b.note?`<p class="note">${esc(b.note)}</p>`:''}<p class="hint">Keys: ← → to move · swipe on phones · games open between pages.</p>`;
  window.addEventListener('hashchange',()=>{const k=(parseInt(location.hash.slice(1))||1)-1;if(k!==i)go(k)});
  show();
}
window.LWApp={home,viewer};
})();
