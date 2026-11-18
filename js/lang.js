/* Little Wonders · one app-wide language setting (EN  /  EN+中文).
   - one shared localStorage key  'lw.lang'  ('en' | 'zh');  the old Useful Words key 'uw.lang' is still read and kept in sync
   - ?lang=zh / ?lang=en in any URL sets it
   - one toggle, fixed top-right of the screen, identical on every page
   - LWLang.add({English:'中文'}) / LWLang.addRe([[/regex/, m=>'中文']]) register page text; while "EN+中文" is on, a small Chinese line is
     added under (or after) every element whose own text matches. Turning it off removes every Chinese line again.
   - LWLang.t('English') gives the Chinese for code that builds text itself; LWLang.zh is true when Chinese is on; 'lwlang' events fire on change. */
(function(){
if(window.LWLang)return;
var KEY='lw.lang',LEG='uw.lang',D={'Back to the app':'返回首页'},RE=[],cbs=[];
function ls(){try{return window.localStorage}catch(e){return null}}
function get(k){var s=ls();try{return s&&s.getItem(k)}catch(e){return null}}
function put(v){var s=ls();try{if(s){s.setItem(KEY,v);s.setItem(LEG,v)}}catch(e){}}
function read(){var q=null;try{q=new URLSearchParams(location.search).get('lang')}catch(e){}
  if(q==='zh'||q==='en'){put(q);return q}
  var v=get(KEY)||get(LEG);return v==='zh'?'zh':'en'}
var L={zh:read()==='zh'};
function urlSync(){try{var u=new URL(location.href);if(L.zh)u.searchParams.set('lang','zh');else u.searchParams.delete('lang');
  if(u.href!==location.href)history.replaceState(history.state,'',u.href)}catch(e){}}
L.get=function(){return L.zh?'zh':'en'};
L.set=function(v,silent){armed=true;v=v==='zh'||v===true?'zh':'en';var ch=(v==='zh')!==L.zh;L.zh=v==='zh';put(v);urlSync();apply();
  if(ch||silent===false){cbs.forEach(function(f){try{f(L.zh)}catch(e){}});try{window.dispatchEvent(new CustomEvent('lwlang',{detail:{zh:L.zh}}))}catch(e){}}};
L.on=function(f){cbs.push(f)};
L.add=function(m){for(var k in m)D[norm(k)]=m[k];schedule()};
L.addRe=function(a){a.forEach(function(r){RE.push(r)});schedule()};
function norm(s){return String(s).replace(/\s+/g,' ').trim()}
var EDGE=/^[\s\u200d\ufe0f\p{So}\p{Sk}\p{Sm}\p{Pd}\u2190-\u21ff\u25a0-\u27bf]+|[\s\u200d\ufe0f\p{So}\p{Sk}\p{Sm}\u2190-\u21ff\u25a0-\u27bf]+$/gu;
function look(s){s=norm(s);if(!s)return null;if(D.hasOwnProperty(s))return D[s];
  var t=s.replace(EDGE,'');if(t&&t!==s&&D.hasOwnProperty(t))return D[t];
  for(var i=0;i<RE.length;i++){var m=s.match(RE[i][0]);if(m){var r=RE[i][1];return typeof r==='function'?r(m):r}}
  return null}
L.t=function(s){var r=look(s);return r==null?'':r};
var SKIP={SCRIPT:1,STYLE:1,SVG:1,CANVAS:1,TEXTAREA:1,INPUT:1,SELECT:1,OPTION:1,NOSCRIPT:1,IFRAME:1,VIDEO:1,AUDIO:1,IMG:1,PRE:0};
function own(el){var s='';for(var n=el.firstChild;n;n=n.nextSibling)if(n.nodeType===3)s+=n.nodeValue;return s}
function skipped(el){for(var e=el;e&&e.nodeType===1;e=e.parentNode){if(SKIP[e.tagName]||(e.classList&&e.classList.contains('lwzh'))||(e.hasAttribute&&(e.hasAttribute('data-lw-skip')||e.id==='lw-lang')))return true}return false}
function mk(el,zh){var cs;try{cs=getComputedStyle(el).display}catch(e){cs=''}
  var par=el.parentNode&&el.parentNode.nodeType===1?el.parentNode:null,pd='';try{pd=par?getComputedStyle(par).display:''}catch(e){}
  var sp=document.createElement('span');sp.className='lwzh';sp.setAttribute('data-lwzh','1');sp.setAttribute('lang','zh-Hans');sp.textContent=zh;
  if(/flex|grid/.test(cs)||(/inline/.test(cs)&&!/block/.test(cs)&&/flex|grid/.test(pd)))sp.className+=' lwzh-in';
  else if(/^inline$/.test(cs))sp.className+=' lwzh-in';
  return sp}
function scan(root){if(!L.zh||!root||root.nodeType!==1&&root.nodeType!==9)return;
  var els=root.nodeType===1?[root].concat([].slice.call(root.querySelectorAll('*'))):[].slice.call(root.querySelectorAll('*'));
  for(var i=0;i<els.length;i++){var el=els[i];if(skipped(el))continue;
    var kids=el.children,has=false;for(var k=0;k<kids.length;k++)if(kids[k].getAttribute&&kids[k].getAttribute('data-lwzh')){has=true;break}
    var o=own(el);
    var ex=el.hasAttribute('data-zh')?el.getAttribute('data-zh'):null;
    var z=ex!=null?ex:(o.trim()?look(o):null);
    if(has){ // refresh or drop when the English changed
      var cur=null;for(var k2=0;k2<kids.length;k2++)if(kids[k2].getAttribute&&kids[k2].getAttribute('data-lwzh')){cur=kids[k2];break}
      if(z==null){cur.remove()}else if(cur.textContent!==z){cur.textContent=z}
      continue}
    if(z==null||z==='')continue;
    el.appendChild(mk(el,z))}}
function clear(){var a=document.querySelectorAll('[data-lwzh]');for(var i=0;i<a.length;i++)a[i].remove()}
var pend=0,busy=false,armed=false;
function schedule(){if(pend||!L.zh||!document.body||!armed)return;pend=1;(window.requestAnimationFrame||setTimeout)(function(){pend=0;run()})}
function run(){if(!armed)return;busy=true;try{scan(document.body)}catch(e){}busy=false;obs&&obs.takeRecords()}
var obs=null;
function apply(){var h=document.documentElement;h.classList.toggle('lw-zh',L.zh);h.setAttribute('data-lw',L.zh?'zh':'en');
  btnSync();if(L.zh){run()}else clear()}
function btnSync(){var b=document.getElementById('lw-lang');if(!b)return;[].forEach.call(b.querySelectorAll('button'),function(x){var on=(x.getAttribute('data-l')==='zh')===L.zh;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on)})}
var CSS='#lw-lang{position:fixed;top:8px;right:10px;z-index:2147483000;display:flex;gap:0;padding:3px;height:36px;box-sizing:border-box;border-radius:999px;background:#fff;border:2px solid #6c4ea0;box-shadow:0 2px 8px rgba(108,78,160,.22);font:800 13px/1 Nunito,"Baloo 2",system-ui,"PingFang SC","Microsoft YaHei",sans-serif;margin:0}'
+'#lw-lang button{all:unset;box-sizing:border-box;cursor:pointer;padding:0 11px;height:26px;display:flex;align-items:center;border-radius:999px;color:#6c4ea0;font:inherit;white-space:nowrap;-webkit-tap-highlight-color:transparent}'
+'#lw-lang button.on{background:#6c4ea0;color:#fff}#lw-lang button:focus-visible{outline:3px solid #f2a6c6;outline-offset:1px}'
+'.lwzh{display:block;font-weight:600;font-size:.82em;line-height:1.25;opacity:.92;letter-spacing:.02em;font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",sans-serif;text-transform:none;font-style:normal;white-space:normal}'
+'.lwzh-in,.crumb .lwzh{display:inline;margin-left:.45em}'
+'@media (max-width:520px){#lw-lang{top:6px;right:6px;height:34px}#lw-lang button{padding:0 9px;height:24px;font-size:12.5px}}'
+'html.lw-has header.top,html.lw-has .lw-hdr{padding-right:178px}'
+'@media (max-width:520px){html.lw-has header.top,html.lw-has .lw-hdr{padding-right:150px}html.lw-has .lw-hdr-s{padding-right:18px;padding-top:48px}}'
+'@media print{#lw-lang{display:none!important}html.lw-has header.top,html.lw-has .lw-hdr,html.lw-has .lw-hdr-s{padding-right:0!important;padding-top:0!important}}';
function mount(){if(document.getElementById('lw-lang')||!document.body)return;
  var st=document.createElement('style');st.id='lw-lang-css';st.textContent=CSS;document.head.appendChild(st);
  var d=document.createElement('div');d.id='lw-lang';d.setAttribute('role','group');d.setAttribute('aria-label','Language 语言');
  d.innerHTML='<button type="button" data-l="en" title="English only">EN</button><button type="button" data-l="zh" title="English + 中文">EN+中文</button>';
  d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button[data-l]');if(b){e.preventDefault();e.stopPropagation();L.set(b.getAttribute('data-l'),false)}},true);
  document.body.appendChild(d);document.documentElement.classList.add('lw-has');btnSync();
  window.addEventListener('storage',function(e){if(e.key===KEY||e.key===LEG){var v=get(KEY);if((v==='zh')!==L.zh){L.zh=v==='zh';urlSync();apply();cbs.forEach(function(f){f(L.zh)})}}});
  obs=new MutationObserver(function(ms){if(busy||!L.zh)return;var ok=false;for(var i=0;i<ms.length&&!ok;i++){var m=ms[i],t=m.target;
      if(t.nodeType===3)t=t.parentNode;if(t&&t.nodeType===1&&!(t.classList&&t.classList.contains('lwzh'))&&!(t.closest&&t.closest('#lw-lang,[data-lw-skip]')))ok=true}
    if(ok)schedule()});
  obs.observe(document.body,{childList:true,subtree:true,characterData:true});
  apply();
  // the first scan waits until the page (and any framework that hydrates it) has finished loading
  var arm=function(){setTimeout(function(){armed=true;apply()},450)};
  if(document.readyState==='complete')arm();else window.addEventListener('load',arm)}
L.mount=mount;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
L.rescan=function(){if(L.zh)run()};
window.LWLang=L;
document.documentElement.classList.toggle('lw-zh',L.zh);
})();
