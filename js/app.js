(function(){
const D=window.LW, Q=s=>document.querySelector(s);
const SECTIONS=[['packs','Flashcard Packs'],['weather','Everyday Weather'],['chores','Household Chores'],['games','Games'],['stories','Stories & Reading'],['lessons','Lessons']];
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function entries(sec){
  const seen=new Set(),b=[];
  D.books.filter(x=>x.section===sec).forEach(x=>{
    if(!x.series){b.push({title:x.title,sub:x.sub,href:'viewer.html?book='+x.id,img:x.cover,book:x});return}
    if(seen.has(x.series))return; seen.add(x.series);
    b.push({title:x.seriesTitle,sub:'Level A1 or A2',href:'book.html?s='+x.series,img:x.cover});
  });
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
  const st=Q('#stage'), strip=Q('#strip'); let i=0;
  strip.innerHTML=b.seq.map((s,k)=>`<button data-k="${k}" class="th ${s.type}">${s.type==='page'?`<img loading="lazy" src="${s.src}" alt="page ${s.n}">`:`<span>${s.type==='game'?'🎮':'▶'}<b class="tl"><br>${esc(s.title)}</b></span>`}</button>`).join('');
  st.innerHTML=b.seq.map((s,k)=>{
    let h;
    if(s.type==='page') h=`<img class="slide" loading="${k<2?'eager':'lazy'}" src="${s.src}" alt="Page ${s.n}">`;
    else if(s.type==='game') h=`<div class="gamebox"><div class="gbar">Game: <b>${esc(s.title)}</b> <a href="${s.src}" target="_blank">open full screen ↗</a></div><iframe data-src="${s.src}" title="${esc(s.title)}" allow="fullscreen; autoplay"></iframe></div>`;
    else if(s.src) h=`<video class="bookvid" src="${s.src}"${s.poster?` poster="${s.poster}"`:''} controls playsinline preload="none" title="${esc(s.title)}"></video>`;
    else h=`<div class="videoph"><div class="play">▶</div><h3>${esc(s.title)}</h3><p>Video slot — coming soon.</p></div>`;
    return `<section class="vitem ${s.type}" id="p${k+1}" data-k="${k}">${h}</section>`}).join('');
  const items=[...st.children];
  function go(k,smooth){if(k<0||k>=items.length)return;items[k].scrollIntoView({behavior:smooth===false?'auto':'smooth',block:'start'})}
  strip.querySelectorAll('.th').forEach(t=>t.onclick=()=>go(+t.dataset.k));
  function mark(k){if(k===i&&strip.querySelector('.on'))return;i=k;const s=b.seq[k];
    strip.querySelectorAll('.th').forEach((t,j)=>t.classList.toggle('on',j===k));
    const a=strip.children[k]; if(a){const r=a.getBoundingClientRect(),sr=strip.getBoundingClientRect();if(r.top<sr.top||r.bottom>sr.bottom)strip.scrollBy({top:r.top-sr.top-sr.height/2+r.height/2,left:r.left-sr.left-sr.width/2+r.width/2})}
    Q('#count').textContent=`${s.type==='page'?'Page '+s.n:(s.type==='game'?'Game':'Video')} · ${k+1} / ${items.length}`;
    history.replaceState(null,'','#'+(k+1));}
  const vis=new Map();
  const io=new IntersectionObserver(es=>{es.forEach(e=>vis.set(+e.target.dataset.k,e.intersectionRatio));let best=i,bv=-1;vis.forEach((v,k)=>{if(v>bv+.01||(Math.abs(v-bv)<=.01&&k<best)){bv=v;best=k}});if(bv>0)mark(best)},{threshold:[0,.25,.5,.75,1]}); items.forEach(x=>io.observe(x));
  // lazy-load game iframes only when near the viewport
  const lio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const f=e.target.querySelector('iframe[data-src]');if(f){f.src=f.dataset.src;f.removeAttribute('data-src')}lio.unobserve(e.target)}}),{rootMargin:'400px 0px'});
  items.filter(x=>x.classList.contains('game')).forEach(x=>lio.observe(x));
  Q('#fs').onclick=()=>{const e=document.documentElement;document.fullscreenElement?document.exitFullscreen():e.requestFullscreen&&e.requestFullscreen()};
  document.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'||e.key==='ArrowDown'||e.key==='PageDown'){go(i+1);e.preventDefault()}if(e.key==='ArrowLeft'||e.key==='ArrowUp'||e.key==='PageUp'){go(i-1);e.preventDefault()}if(e.key==='Home'){go(0);e.preventDefault()}if(e.key==='End'){go(items.length-1);e.preventDefault()}});
  Q('#downloads').innerHTML=(b.series?`<p class="crumb"><a href="book.html?s=${b.series}">${esc(b.seriesTitle)}</a> › Level ${b.level}</p>`:'')+`<h3>Downloads</h3>${b.downloads.map(d=>`<a class="dlb" href="${d.href}" download>⬇ ${esc(d.label)} <small>${d.size} MB</small></a>`).join('')||'<p>No downloads.</p>'}${b.note?`<p class="note">${esc(b.note)}</p>`:''}<p class="hint">Scroll or swipe down through the pages · click a thumbnail to jump · ↑ ↓ keys also work.</p>`;
  window.addEventListener('hashchange',()=>{const k=(parseInt(location.hash.slice(1))||1)-1;if(k!==i)go(k)});
  const k0=Math.max(0,Math.min(items.length-1,(parseInt((location.hash||'').slice(1))||1)-1));
  mark(k0); if(k0>0) requestAnimationFrame(()=>go(k0,false));
}
function chooser(){
  menu();
  const p=new URLSearchParams(location.search), sid=p.get('s'), S=(D.series||{})[sid];
  if(!S){location.replace('index.html');return}
  const lv=p.get('l'), all=D.books.filter(x=>x.series===sid);
  document.title=S.title+' · Little Wonders'; Q('#btitle').textContent=S.title;
  const card=(href,img,h,t,cls)=>`<div class="card ${cls||''}"><a class="cl" href="${href}"><div class="thumb"><img src="${img}" alt=""></div><div class="ct"><h3>${esc(h)}</h3><p>${esc(t)}</p></div></a></div>`;
  let html=`<section class="sec"><p class="crumb"><a href="index.html">Home</a> › ${lv?`<a href="book.html?s=${sid}">${esc(S.title)}</a> › Level ${esc(lv)}`:esc(S.title)}</p>`;
  if(!lv||!S.levels[lv]){
    html+=`<h2>${esc(S.title)}: choose a level</h2><div class="grid lvgrid">`+Object.keys(S.levels).map(l=>{const c=all.find(x=>x.level===l);return card('viewer.html?book='+c.id,c.cover,'Level '+l,S.levels[l].split('·')[1].trim(),'lv')}).join('')+`</div><div class="dls lvdl">`+Object.keys(S.levels).map(l=>{const c=all.find(x=>x.level===l);return c.downloads.map(d=>`<a href="${d.href}" download>PDF Level ${l} (${d.size} MB)</a>`).join('')}).join('')+`</div>`;
  }else{
    location.replace('viewer.html?book='+all.find(x=>x.level===lv).id);return;
  }
  Q('#home').innerHTML=html+`</section>`;
}
window.LWApp={home,viewer,chooser};
})();
