/* Hidden stars (viewer.html only). Simple on purpose, so it is easy to improve later.
   Each book has an item from page 1 / the cover (js/hidden-spots.js, made by find_spots.py). The item hides small and
   partly tucked in on a few later pages. Tap it: sparkle + chime + a star, recorded once per item per student
   through LWProgress.correct(bookId,'hs:<page>') (that is what turns it into goal points).
   Sound follows the goals sound switch (LWGoals.chime respects lwp.coinsound). */
(function(){
'use strict';
var H=window.LWHidden,stage=document.getElementById('stage');
if(!H||!stage||window.__lwh)return;window.__lwh=1;
var id=new URLSearchParams(location.search).get('book'),B=H.books&&H.books[id];
if(!B)return;
var P=window.LWProgress,mem={},N=B.spots.length;
function foundMap(){var out={};try{var r=((P.goalsData().c||{})[id]||{}).ok||{};Object.keys(r).forEach(function(k){if(k.indexOf('hs:')===0)out[k.slice(3)]=1})}catch(e){}
  Object.keys(mem).forEach(function(k){out[k]=1});return out}
function count(){return B.spots.filter(function(s){return foundMap()[s.p]}).length}
function record(p){var first=false;try{first=!!(P&&P.correct(id,'hs:'+p))}catch(e){}if(!P){first=!mem[p]}mem[p]=1;return first}
var css='.lwh-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:8px 14px;background:#fff8e1;border:2px solid #ffd35a;border-radius:14px;font-weight:800;color:#5b4a1a;font-size:16px}'
+'.lwh-bar img{height:34px;width:auto;max-width:48px;object-fit:contain}.lwh-bar .lwh-n{margin-left:auto;background:#fff;border:2px solid #ffd35a;border-radius:999px;padding:2px 12px;font-size:15px;white-space:nowrap}'
+'.lwh-bar.done{background:#e9f9e5;border-color:#7fd36e;color:#27591d}.lwh-bar.done .lwh-n{border-color:#7fd36e}'
+'.lwh-it{position:absolute;z-index:3;padding:0;border:0;background:none;cursor:pointer;min-width:30px;transition:transform .15s;-webkit-tap-highlight-color:transparent}'
+'.lwh-it img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;-webkit-user-drag:none;user-select:none}'
+'.lwh-it:hover,.lwh-it:focus-visible{transform:translate(-50%,-50%) scale(1.25) rotate(var(--r))!important}.lwh-it:focus-visible{outline:3px solid #6c4ea0;outline-offset:3px;border-radius:8px}'
+'.lwh-got{position:absolute;z-index:3;width:max(22px,2.6%);aspect-ratio:1;pointer-events:none;opacity:.85}.lwh-got svg,.lwh-pop svg{width:100%;height:100%;display:block}'
+'.lwh-pop{position:absolute;z-index:5;width:max(44px,6%);aspect-ratio:1;pointer-events:none;transform:translate(-50%,-50%);animation:lwhpop 1.1s ease-out forwards}'
+'@keyframes lwhpop{0%{transform:translate(-50%,-50%) scale(.2);opacity:0}25%{transform:translate(-50%,-60%) scale(1.25);opacity:1}100%{transform:translate(-50%,-190%) scale(1);opacity:0}}'
+'.lwh-sp{position:absolute;z-index:5;width:8px;height:8px;margin:-4px;border-radius:50%;background:#ffd35a;box-shadow:0 0 6px #fff;pointer-events:none;animation:lwhsp .8s ease-out forwards}'
+'@keyframes lwhsp{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}'
+'@media (prefers-reduced-motion:reduce){.lwh-pop,.lwh-sp{animation-duration:.01s}}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
var STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.5 5.7 21.2l1.5-7.1L1.8 9.2l7.2-.8z" fill="#ffc83d" stroke="#e19a00" stroke-width="1.4" stroke-linejoin="round"/></svg>';
// hint banner, right above page 1
var bar=document.createElement('div');bar.className='lwh-bar';bar.setAttribute('role','status');
bar.innerHTML='<img src="img/hidden/'+B.item+'.png" alt=""><span class="lwh-t"></span><span class="lwh-n"></span>';
stage.parentNode.insertBefore(bar,stage);
function upd(){var c=count(),done=c>=N;bar.classList.toggle('done',done);
  bar.querySelector('.lwh-t').textContent=done?'You found every '+B.label+'! Great job!':'Find the '+B.label+' on later pages!';
  bar.querySelector('.lwh-n').textContent='Found '+c+' of '+N}
function fx(sec,sp,el){
  var pop=document.createElement('span');pop.className='lwh-pop';pop.style.left=sp.x*100+'%';pop.style.top=sp.y*100+'%';pop.innerHTML=STAR;sec.appendChild(pop);setTimeout(function(){pop.remove()},1200);
  for(var i=0;i<10;i++){var a=i/10*6.283,d=34+Math.random()*30,s=document.createElement('span');s.className='lwh-sp';
    s.style.left=sp.x*100+'%';s.style.top=sp.y*100+'%';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');sec.appendChild(s);setTimeout(function(n){n.remove()},900,s)}
  try{if(window.LWGoals&&LWGoals.chime)LWGoals.chime()}catch(e){}}
function got(sec,sp){var g=document.createElement('span');g.className='lwh-got';g.style.left=sp.x*100+'%';g.style.top=sp.y*100+'%';g.style.transform='translate(-50%,-50%)';g.innerHTML=STAR;sec.appendChild(g)}
var ar=(H.items&&H.items[B.item])||1;
B.spots.forEach(function(sp){
  var img=stage.querySelector('.vitem.page img.slide[alt="Page '+sp.p+'"]');if(!img)return;var sec=img.parentNode;
  if(foundMap()[sp.p]){got(sec,sp);return}
  var b=document.createElement('button');b.type='button';b.className='lwh-it';b.setAttribute('aria-label','Hidden '+B.label+'. Tap to find it!');
  b.style.cssText='left:'+sp.x*100+'%;top:'+sp.y*100+'%;width:max(30px,'+sp.w*100+'%);aspect-ratio:'+ar+';--r:'+sp.r+'deg;transform:translate(-50%,-50%) rotate('+sp.r+'deg)';
  b.innerHTML='<img src="img/hidden/'+B.item+'.png" alt="" draggable="false"'+(sp.f?' style="transform:scaleX(-1)"':'')+'>';
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();record(sp.p);fx(sec,sp,b);b.remove();got(sec,sp);upd()});
  sec.appendChild(b)});
upd();
})();
