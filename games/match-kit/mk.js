/* Little Wonders match-kit: one small engine behind the "Match" game series (sort, quiz, memory, order). Config comes from each game page. */
(function(){
const BASE=new URL('art/',document.currentScript.src).href;
const FLAT={"c-ch1-cook-dinner-1.jpg":"#fef1e0","c-ch1-cook-dinner-2.jpg":"#fdf2e0","c-ch1-do-homework-1.jpg":"#fdf0dd","c-ch1-do-homework-2.jpg":"#fcedd6","c-ch1-feed-the-dog-1.jpg":"#fef3e1","c-ch1-feed-the-dog-2.jpg":"#fef3e1","c-ch1-make-the-bed-1.jpg":"#fbebd4","c-ch1-make-the-bed-2.jpg":"#fbefd9","c-ch1-tidy-up-toys-1.jpg":"#fef3e1","c-ch1-tidy-up-toys-2.jpg":"#fef3e1","c-ch1-wash-the-dishes-1.jpg":"#fdf2e0","c-ch1-wash-the-dishes-2.jpg":"#fef1e0","c-ch2-do-the-laundry-1.jpg":"#fdf5e2","c-ch2-do-the-laundry-2.jpg":"#fff4e2","c-ch2-mow-the-lawn-1.jpg":"#fdf1d9","c-ch2-mow-the-lawn-2.jpg":"#fdf1d9","c-ch2-sweep-the-porch-1.jpg":"#fdf1d9","c-ch2-sweep-the-porch-2.jpg":"#fdf1d9","c-ch2-take-out-the-trash-1.jpg":"#fbecd5","c-ch2-take-out-the-trash-2.jpg":"#fcedd6","c-ch2-wash-the-car-1.jpg":"#fcedd6","c-ch2-wash-the-car-2.jpg":"#faebd4","c-ch2-water-the-plants-1.jpg":"#fef3e1","c-ch2-water-the-plants-2.jpg":"#fef3df","c-ea1-bird-1.jpg":"#fcf5eb","c-ea1-cat-1.jpg":"#faf5e2","c-ea1-dog-1.jpg":"#fcf6ea","c-ea1-goldfish-1.jpg":"#fbf7ec","c-ea1-hamster-1.jpg":"#f9f5ea","c-ea1-rabbit-1.jpg":"#fbf7eb","c-ea2-cow-1.jpg":"#fef5e4","c-ea2-frog-1.jpg":"#fbf0de","c-ea2-sheep-1.jpg":"#fef5e4","c-ea2-snail-1.jpg":"#fbf0de","place-fridge.jpg":"#faf4e6","place-garden.jpg":"#faf5e7","place-oven.jpg":"#fbf5e7","place-pot.jpg":"#fbf5e7","w-bicycle.jpg":"#fbf6e3","w-cup.jpg":"#faf3e3","w-glasses.jpg":"#faf6ea","w-hat.jpg":"#f9f1de","w-key.jpg":"#fcf5eb","w-lantern.jpg":"#f9f5ea","w-plate.jpg":"#faf6ea","w-shoes.jpg":"#fcf6e8","w-soap.jpg":"#f9f5ea","w-spoon.jpg":"#fdf7eb","w-teapot.jpg":"#fcf5eb","w-teddy.jpg":"#f5eedc","w-toothbrush.jpg":"#f9f2e0","w-towel.jpg":"#f9f5ea","w-umbrella.jpg":"#fdf7e7","w-washer.jpg":"#f9f5ea","w-watch.jpg":"#f9f1e4","x-baby-snail.jpg":"#f8f0d9","x-blank-page.jpg":"#faf6eb","x-calf.jpg":"#faf7e8","x-charger.jpg":"#faf6eb","x-chick.jpg":"#faf7e8","x-clean-clothes.jpg":"#faf6eb","x-cold-water.jpg":"#f9f5ea","x-comb.jpg":"#faf6ea","x-curtain.jpg":"#f9f5ea","x-dark-path.jpg":"#fbf4e2","x-dirty-clothes.jpg":"#faf6eb","x-done-page.jpg":"#faf6eb","x-duckling.jpg":"#faf7e8","x-egg-nest.jpg":"#f9f1dc","x-empty-bath.jpg":"#fbf4e2","x-empty-cups.jpg":"#fbf6e3","x-fork.jpg":"#faf6ea","x-frogspawn.jpg":"#f8f0db","x-full-bath.jpg":"#fcf4e1","x-hot-tea.jpg":"#faf6ea","x-lamb.jpg":"#faf7e8","x-lit-lantern.jpg":"#fcf4e1","x-lock.jpg":"#f9f5ea","x-mirror.jpg":"#f9f5ea","x-music-guitar.jpg":"#faf5ea","x-phone.jpg":"#fbf7eb","x-placeset.jpg":"#ffffff","x-silent-guitar.jpg":"#faf5ea","x-soap.jpg":"#ffffff","x-tadpole.jpg":"#f9f1dc","x-tea-cups.jpg":"#fbf5e5","x-towel.jpg":"#ffffff","x-window.jpg":"#fbf7eb"};/* flat-background pictures: contain-fit on their own paper colour */
function flatBg(i){return i&&FLAT[i]}
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
/* ---------- level 12+ (B1): same game, same pictures, derived from the A2 plan with less word support, more distractors and fuller clues ---------- */
const B1T={
'mm-before-after':{desk:'I started with a blank page, and after an hour of hard work my homework is finally ___.',bath:'The bath was empty, so I turned on the tap and waited. Now it is ___.',lantern:'The path was too dark to walk along until I lit the lantern. Now it gives us ___.',washing_machine:'My clothes were dirty after the match, but after one cycle in the washing machine they are ___.',kettle:'The water was cold, but after a few minutes in the kettle it is ___.',teapot:'The cups were empty until the teapot poured some ___ into them.',guitar:'The room was silent until she picked up the guitar and began to play ___.'},
'mm-feed-pets':{cat:'It sleeps most of the day, but at night it hunts quietly. It cleans itself with its tongue.',dog:'It is loyal and always waits for you at the door. When you come home, it wags its tail.',bird:'It has a beak and feathers, and it sings at sunrise. Because it can fly, it needs a big cage.',goldfish:'It never makes a sound and it breathes through gills. You have to change the water in its bowl.',rabbit:'It is quiet and gentle, and its back legs are strong. It hops fast and loves carrots and leaves.',hamster:'It sleeps all day and wakes up at night. It runs on its wheel and stores food in its cheeks.'},
'mm-kite-week':{sunny:'On Monday there was not a single cloud, so we put on sun cream and walked to the park without a coat.',cloudy:'On Tuesday the sky was grey all day, but it did not rain, so it felt cooler than Monday.',rainy:'On Wednesday the streets were wet and we needed umbrellas, so I stayed inside and read a book.',snowy:'On Thursday everything outside was white. We wore our warmest gloves and built a snowman.',stormy:'On Friday there was thunder and lightning, and the wind was strong. It was not safe to fly the kite.',windy:'On Saturday the trees were moving and the kite flew high in the sky. It was perfect weather for kites.'},
'mm-mama-baby':{hen:'Farmers collect eggs from a hen, and when an egg hatches, the baby that comes out is called a ___.',cow:'A cow gives us milk, and her baby, which drinks that milk too, is called a ___.',sheep:'We use wool from a sheep, and her baby is called a ___.',duck:'A duck swims on the pond with her babies behind her, and the baby is called a ___.',snail:'A snail carries its shell wherever it goes. A young snail is just called a ___.',frog:'A frog lays eggs in the pond, and the baby that hatches has a tail and lives in water. It is called a ___.'},
'mm-pack-mountain':{hot:'The sun was strong and there was no wind, so for the walk I wore ___.',cold:'The wind was freezing at the top of the mountain, so to keep my head and neck warm I wore ___.',foggy:'The fog was so thick that I could hardly see the path, so I carried ___.',rainy:'It started to pour while we were climbing, so I quickly opened ___.',puddles:'The path was full of deep puddles, so to keep my feet and body dry I wore ___.',rbw:'The rain stopped and the sun came out, and in the sky we saw ___.'},
'mm-read-find':{sofa:'In the evening the whole family sits together on the ___ to watch TV.',heater:'It is freezing today, so we switched on the ___ to keep the room warm.',bottle:'I take a ___ to school so that I can drink water all day.',fan:'It is a boiling hot afternoon, so I turned on the ___ to cool the room.',laptop:'I write my emails and finish my homework on my ___.',headphones:'The bus is noisy, so I listen to music through my ___.',paintbrush:'To paint a picture, first I dip my ___ in the colour.',bin:'When I finish eating, I throw the wrapper in the ___.'},
'mm-taste-test':{juice:'Which drink is sweeter than milk and comes from squeezed fruit?',kiwi:'Which fruit is fuzzier than a lemon and is green inside?',lemon:'Which fruit is sourer than a kiwi and is usually yellow?',milk:'Which drink is whiter than juice and comes from a cow?',noodles:'Which food is longer and thinner than a grain of rice, and is often eaten in soup?',orange:'Which fruit is sweeter than a lemon, easier to peel than a kiwi, and has the same name as its colour?',pizza:'Which food is cheesier than rice and is cut into triangle slices?',rice:'Which food is smaller than a noodle and comes in tiny white grains?'},
'mm-zoom-guess':{apple:'It grows on trees and can be red, green or yellow. Cut it open and you find small brown seeds in the middle.',bread:'Bakers make it from flour in the oven, and it is softer inside than outside. We cut it into slices for sandwiches.',carrot:'It grows under the ground and it is orange. Rabbits love it, and it is crunchier than a potato.',donut:'It is sweeter than most breads, it is round and often has icing on top, and it has a hole in the middle.',egg:'A hen lays it, and it has a hard shell outside. Inside, the yellow part is called the yolk.',fish:'It breathes under water and swims faster than a turtle. Its body is covered in shiny scales.',grapes:'They grow in bunches on a vine and they are smaller than apples. This one is cut in half so we can see inside.',honey:'Bees make it, and it is much stickier than juice. We lift it with a dipper.',['ice-cream']:'It is colder than milk and it melts in the sun. We serve it with a scoop in a cone or a bowl.'},
'mm-use-it':{cup:'You were very thirsty after the football match. What did you do with the cup?',spoon:'Mum made hot soup for dinner. What did you do with the spoon?',toothbrush:'It was time for bed. What did you do with the toothbrush?',watch:'You did not want to be late for the bus. What did you do with your watch?',shoes:'It was time to leave for school. What did you do with your shoes?',hat:'The sun was very bright at the beach. What did you do with your hat?',glasses:'You opened your favourite story before bed. What did you do with your glasses and the book?',umbrella:'Dark clouds came and it started to pour. What did you do with your umbrella?',teddy:'You felt a little scared in the dark. What did you do with your teddy?',bicycle:'It was a lovely Saturday and the park is far away. What did you do with your bicycle?'},
'mm-helper-pairs':{fridge:'We keep milk and ice cream in here so they do not go bad.',plate:'I cut my dinner with a knife and eat it with a fork from this.',phone:'When its battery is nearly empty, I connect it to a charger.',window:'I open it to let in fresh air, and I close the curtain at night.',soap:'After I wash my hands with it, I dry them with a towel.',mirror:'I look at myself in it before school, then I comb my hair.',key:'I use it to unlock the front door when I get home.'}};
const B1X={'mm-use-it':{glasses:{nx:['a-hat','a-shoes']}}};
function deriveB1(cfg){
 const src=(cfg.levels||{}).A2||(cfg.levels||{}).A1||[];const ph0=JSON.parse(JSON.stringify(src)),T=B1T[cfg.id]||{},X=B1X[cfg.id]||{},TH=cfg.things||{};
 const lab=id=>(TH[id]||{}).l||'';
 ph0.forEach(ph=>{
  if(ph.t==='quiz'){delete ph.listen;delete ph.autosay;
   const pool=ph.pool||[];ph.choices=Math.min((ph.choices||3)+1,6,Math.max(pool.length,3));
   if(/read-find|shadow-match/.test(cfg.id))ph.ol=false;
   ph.rounds.forEach(r=>{r.q=r.q||{};if(r.q.say===true)delete r.q.say;if(T[r.id])r.q.t=T[r.id];if(X[r.id])Object.assign(r,X[r.id]);
    if(r.opts){const ans=[].concat(r.a),have=new Set(r.opts);const add=pool.filter(x=>!have.has(x)&&!ans.includes(x)&&!(r.nx||[]).includes(x));if(add.length&&r.opts.length<6)r.opts=r.opts.concat([add[(r.id.length*7+r.opts.length)%add.length]])}})}
  else if(ph.t==='memory'){ph.ol=false;ph.pairs.forEach(p=>{if(T[p.id])p.b={t:T[p.id]}})}
  else if(ph.t==='order'){ph.ol=false}
  else if(ph.t==='sort'){ph.pl=false;
   ph.bins.forEach(b=>{if(b.a&&!b.l){b.l=b.a;delete b.i}});
   const labs=ph.pieces.map(p=>lab(p.id)).filter(Boolean);
   ph.pieces.forEach(p=>{if(p.ask)return;const k=p.sb?Object.keys(p.sb)[0]:null,s=(k&&p.sb[k])||p.say||'';if(!s)return;
    const m=/\b(in|on|at|under)\b(?= (?:the|a|an|my) )/.exec(s);
    if(m){const o=['in','on','at','under'].filter(x=>x!==m[1]);p.ask={q:s.replace(m[0],'___'),o:[m[1],...shuf(o).slice(0,2)],a:m[1],s};return}
    const l=lab(p.id),i=l?s.toLowerCase().indexOf(l.toLowerCase()):-1;
    if(i>=0){const w=s.substr(i,l.length);p.ask={q:s.slice(0,i)+'___'+s.slice(i+l.length),o:[w,...shuf(labs.filter(x=>x!==l)).slice(0,2)],a:w,s}}})}
 });
 return ph0}
function run(cfg){
 const q=new URLSearchParams(location.search);
 const mid=q.get('mid')==='1';
 // level: A1, A2 or B1 (shown as "12+"). ?lv= or ?lvl= wins; otherwise the level this profile used last (kept per profile in localStorage)
 const normLv=v=>{v=String(v||'').toUpperCase().replace(/\s/g,'');return v==='12+'||v==='B1'?'B1':(v==='A1'||v==='A2')?v:null};
 const curId=()=>{try{const s=JSON.parse(localStorage.getItem('lwp.students')||'{}'),l=Array.isArray(s.list)?s.list:[];return s.cur&&l.some(x=>x&&x.id===s.cur)?s.cur:'s0'}catch(e){return 's0'}};
 const LVK='lw.everyday.level.'+curId();
 const saveLv=()=>{if(!mid)try{localStorage.setItem(LVK,lv)}catch(e){}};
 let lv=normLv(q.get('lv'))||normLv(q.get('lvl'))||(mid?null:(()=>{try{return normLv(localStorage.getItem(LVK))}catch(e){return null}})())||'A1';
 if(!cfg.levels.B1)cfg.levels.B1=deriveB1(cfg);
 const LVN={A1:'A1',A2:'A2',B1:'12+'},LVO=['A1','A2','B1'];
 const gid='games/'+cfg.id,TH=cfg.things||{};
 const app=$('#app');
 let S;// run state
 function allowedFn(){const al=cfg.alias||{};if(!mid)return()=>true;const n=(cfg.mid||{})[lv]||(cfg.mid||{}).A2||3,set=new Set((cfg.book||[]).slice(0,n)),all=new Set(cfg.book||[]);return id=>{id=al[id]||id;return !all.has(id)||set.has(id)}}
 function th(id){return TH[id]||{}}
 function spec(x){if(x&&x.th)return Object.assign({},th(x.th),x,{id:x.th});return x||{}}
 function imHtml(sp,cls,c){const i=sp.i,fb=flatBg(i),cut=i&&/\.webp$/.test(i);const col=c||sp.c||PAL[0];
  return `<div class="im ${cut?'cut':''}${fb?'flat':''} ${cls||''}" style="--c:${col}${fb?';--bg:'+fb:''}">`+(i?`<img src="${BASE+i}" alt="${esc(sp.l||sp.a||'')}" draggable="false">`:`<div class="tx">${esc(sp.t||sp.l||'')}</div>`)+'</div>'}
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
  if(!mid)LVO.forEach(l=>{const b=el('button',l===lv?'on':'',LVN[l]);b.onclick=()=>{if(l===lv)return;lv=l;saveLv();history.replaceState(null,'','?lv='+l);start()};L.appendChild(b)});
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
  saveLv();
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
    const ch=el('div','chip'+(/\.webp$/.test(pc._sp.i||'')?' cut':'')+(flatBg(pc._sp.i)?' flat':'')+(pc._sp.i?'':' txt'),pc._sp.i?`<img src="${BASE+pc._sp.i}" alt="${esc(pc._sp.l||'')}">`:esc(pc._sp.l||''));ch.style.setProperty('--c',pc._c);if(flatBg(pc._sp.i))ch.style.setProperty('--bg',flatBg(pc._sp.i));ch.title=pc._sp.l||'';$('.chips',bin).appendChild(ch);
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
  if(qs.th||qs.i){const n=qs.n||1;const pr=el('div','pair');for(let k=0;k<n;k++){const d=el('div','');d.innerHTML=imHtml(qsp,'',qs.sh?'#f6f0e6':PAL[2]);const im=$('img',d);if(im&&(qs.sh||qs.sc||qs.rot||qs.clip)){im.dataset.fx=1;im.style.transform=`rotate(${(qs.rot||0)+(k?(qs.rot2||0):0)}deg) scale(${qs.sc||1})`;if(qs.clip)im.style.clipPath=qs.clip;im.style.objectPosition=qs.pos||'center';if(qs.org)im.style.transformOrigin=qs.org}if(k&&n>1)d.style.transform='rotate(6deg)';pr.appendChild(d)}card.appendChild(pr)}
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
  const sc=S.first,tot=S.total;try{P().win(gid,'match:'+lv,{v:sc});if(P().unit){for(let k=0;k<=LVO.indexOf(lv);k++)P().unit(gid,LVO[k],3)}}catch(e){}
  const pa=$('#party');pa.innerHTML=`<div>Well done!<small>${sc} of ${tot} right the first time</small></div><div class="row"></div>`;
  const row=$('.row',pa);const again=el('button','btn','Play again');again.onclick=start;row.appendChild(again);
  if(!mid&&lv!=='B1'){const nl=LVO[LVO.indexOf(lv)+1];const nx=el('button','btn','Try '+LVN[nl]);nx.onclick=()=>{lv=nl;saveLv();history.replaceState(null,'','?lv='+nl);start()};row.appendChild(nx)}
  pa.style.display='flex';say('Well done!');
  const cols=['#f7a8c4','#9cc8f0','#ffd23f','#7ccf8a','#c7a8f0'];for(let i=0;i<70;i++){const c=el('div','c');c.style.left=Math.random()*100+'vw';c.style.background=cols[i%5];c.style.animationDuration=2+Math.random()*2+'s';c.style.animationDelay=Math.random()*1.5+'s';pa.appendChild(c)}
 }
 const pa=el('div');pa.id='party';document.body.appendChild(pa);
 start();
}
window.MK={run};
})();
