/* Little Wonders · Teacher's Corner (one shared include, no build step).
   Add before </body> on any page:  <script src="(path to)/js/teachers-corner.js"></script>
   It loads css/teachers-corner.css itself, adds a "Teacher's Corner" button to the site header (or a small floating one on
   pages without a header) and mounts a full-screen blackboard overlay: wood frame, green slate, chalk toolbar, chalk stage.
   Closes with the Close button or Escape (innermost layer first: text box, then note card, then the board). No sounds
   except the Listen button on a note card (browser speech). Drawings stay in memory until the page is reloaded.
   Notes list: how-to / goals for the current page or book, built from data already on the page. A page can add its own:
     window.LWTeacherNotes=[{id:'tip1',title:'Warm-up',text:'Line one.\n- bullet\n- bullet'}]   (set before or after this script)
   Authored notes (book note, goals, LWTeacherNotes) drive the badge: it counts those not yet opened and is hidden at 0. */
(function(){
'use strict';
if(window.LWTeachersCorner)return;
var ME=document.currentScript;
var JS_URL=ME&&ME.src?ME.src:location.href;
var D=document;

/* ---------- small helpers ---------- */
function el(tag,cls,attrs){var e=D.createElement(tag);if(cls)e.className=cls;if(attrs)for(var k in attrs){if(attrs[k]!==false&&attrs[k]!=null)e.setAttribute(k,attrs[k])}return e}
var ICON={
 board:'<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M7 20h10"/><path d="M7 13l3-3 2 2 4-4"/>',
 pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
 hl:'<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 01-2.8 0l-5.2-5.2a2 2 0 010-2.8L14 4"/>',
 eraser:'<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
 line:'<path d="M5 12h14"/>',
 arrow:'<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
 rect:'<rect x="4" y="4" width="16" height="16" rx="2"/>',
 circle:'<circle cx="12" cy="12" r="9"/>',
 text:'<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
 undo:'<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>',
 redo:'<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>',
 trash:'<path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/>',
 image:'<path d="M16 5h6"/><path d="M19 2v6"/><path d="M21 11.5V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h7.5"/><path d="m21 15-3.1-3.1a2 2 0 00-2.8 0L6 21"/><circle cx="9" cy="9" r="2"/>',
 save:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
 full:'<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/>',
 x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 vol:'<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7"/><path d="M19 5a10 10 0 010 14"/>'
};
function svg(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[name]+'</svg>'}
function hash(s){var h=5381;s=String(s);for(var i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)}
function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function nice(g){var M={can_cant:"can / can't",to_be:'to be',have_has:'have / has',present_simple:'present simple',this_that:'this / that',link_time:'time linkers',link_contrast:'contrast linkers'};return String(g).split(',').map(function(x){x=x.trim();return M[x]||x.replace(/_/g,' ')}).filter(Boolean)}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i})}

/* ---------- page context -> notes ---------- */
var Q=new URLSearchParams(location.search);
var pageKey=location.pathname.replace(/\/index\.html$/,'/')+(Q.get('book')?'?book='+Q.get('book'):Q.get('s')?'?s='+Q.get('s'):Q.get('story')?'?story='+Q.get('story'):'');
function metaDesc(){var m=D.querySelector('meta[name="description"],meta[property="og:description"]');return m&&m.content?m.content.trim():''}
function pageTitle(){return (D.title||'').replace(/\s*[·|-]\s*Little Wonders.*$/i,'').trim()||'this page'}
function bookInfo(){var id=Q.get('book');if(!id||!window.LW||!LW.books)return null;for(var i=0;i<LW.books.length;i++)if(LW.books[i].id===id)return LW.books[i];return null}
function entries(){
  var out=[],cls=D.body.classList;
  function add(id,title,text,auth){if(text&&String(text).trim())out.push({id:id,title:title,text:String(text).trim(),auth:!!auth})}
  var b=cls.contains('viewer')?bookInfo():null;
  if(b){
    var seq=b.seq||[],pages=seq.filter(function(s){return s.type==='page'}).length,games=seq.filter(function(s){return s.type==='game'}).length,vids=seq.filter(function(s){return s.type==='video'}).length;
    var about=[b.title+(b.sub?' - '+b.sub:''),pages+' pages'+(games?', '+games+' game'+(games>1?'s':''):'')+(vids?', '+vids+' video'+(vids>1?'s':''):'')+' in the lesson.'];
    if(b.downloads&&b.downloads.length)about.push('Downloads: '+b.downloads.map(function(d){return d.label}).join(', ')+' (at the bottom of the page).');
    add('about','About this book',about.join('\n'));
    add('howto','How to use it','Scroll or swipe down through the pages.\n- Click a thumbnail to jump to that page.\n- Arrow keys, Page Up / Page Down, Home and End also move through the book.\n- The full screen button (bottom right) fills the screen.');
    if(b.note)add('note','Book note',b.note,true);
    var G=window.LWGoalBooks&&LWGoalBooks[b.id];
    if(G){
      var gs=[],ts=[];for(var p in (G.g||{}))gs=gs.concat(nice(G.g[p]));for(var q in (G.t||{}))ts=ts.concat(nice(G.t[q]));
      gs=uniq(gs).sort();ts=uniq(ts).sort();
      if(gs.length||ts.length)add('goals','Goals for this book',(gs.length?'Language in this book:\n'+gs.map(function(x){return '- '+x}).join('\n'):'')+(ts.length?(gs.length?'\n':'')+'Topics:\n'+ts.map(function(x){return '- '+x}).join('\n'):''),true);
      var k=(parseInt((location.hash||'').slice(1))||1)-1,s=seq[k];
      if(s&&s.type==='page'&&G.g&&G.g[s.n])add('pagegoals','Goals for page '+s.n,nice(G.g[s.n]).map(function(x){return '- '+x}).join('\n'));
    }
  }else if(cls.contains('chooser')){
    var S=window.LW&&LW.series&&LW.series[Q.get('s')];
    add('howto','Choose a level',(S?S.title+'. ':'')+'Pick Level A1 or A2. Both open the lesson viewer with the pages in order. The PDF buttons download the printable flashcards.');
  }else if(cls.contains('home')){
    add('howto','How to use this site','Pick a flashcard pack, game, story or lesson from the cards or from the menu at the top.\n- A flashcard pack opens as a lesson: pages in order, with games in between.\n- Games and activities open on their own page.');
    add('students','Student progress','Use the Student button in the header to keep each student\'s progress separate. My account is your own profile.\n- A check mark means the item was used.\n- The number counts plays, or the furthest page reached.');
  }else{
    var d=metaDesc();
    add('about','About this page',pageTitle()+(d?'\n'+d:'')+'\nUse the board to draw or write an example for the class, then press Close to go back to the activity.');
  }
  var T=window.LWTeacherNotes;if(typeof T==='function'){try{T=T()}catch(e){T=null}}
  if(T&&T.length)for(var i=0;i<T.length;i++)if(T[i]&&T[i].text)add('t:'+(T[i].id||i),T[i].title||'Teacher note',T[i].text,true);
  out.push({id:'mine',title:'My notes',mine:true});
  return out;
}

/* ---------- read state (drives the badge) ---------- */
function studentId(){try{return window.LWProgress&&LWProgress.current().id||'s0'}catch(e){return 's0'}}
function readKey(){return 'lwtc.read.'+studentId()}
function entryKey(e){return pageKey+'|'+e.id+'|'+hash(e.text)}
function unread(){var r=jget(readKey(),{});return entries().filter(function(e){return e.auth&&!r[entryKey(e)]})}
function markRead(e){if(!e.auth)return;var r=jget(readKey(),{});r[entryKey(e)]=1;jset(readKey(),r)}

/* ---------- build DOM ---------- */
var dock,openBtn,badge,root,board,scrim,card,canvas,ctx,stage,hint,dropEl,statusEl,listEl,fileIn,sizeIn,colorIn,pickWrap;
var isOpen=false,lastFocus=null,prevOverflow='';
var tool='pen',ink='#f7f4ec',inkName='chalk',size=6;
var states=[[]],idx=0,cur=null,textEd=null,dpr=1,cw=0,chh=0,off=document.createElement('canvas'),raf=0;
var TOOLS=[['pen','Chalk','pen'],['hl','Highlighter','hl'],['eraser','Eraser','eraser'],['line','Line','line'],['arrow','Arrow','arrow'],['rect','Rectangle','rect'],['circle','Circle','circle'],['text','Text','text']];
var INKS=[['chalk','White','#f7f4ec'],['yellow','Yellow','#e6c34a'],['teal','Teal','#127a68'],['coral','Coral','#d85a45']];

function loadAssets(){
  var base=new URL('../css/teachers-corner.css',JS_URL).href;
  if(!D.getElementById('lwtc-css')){var l=el('link','',{id:'lwtc-css',rel:'stylesheet',href:base});(D.head||D.documentElement).appendChild(l)}
  if(!D.getElementById('lwtc-fonts')){var f=el('link','',{id:'lwtc-fonts',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560&family=Nunito:wght@700;800;900&family=Outfit:wght@400;600&display=swap'});(D.head||D.documentElement).appendChild(f)}
}

function buildButton(){
  dock=el('div','lwtc-dock');
  openBtn=el('button','lwtc-open',{type:'button','aria-label':"Teacher's Corner",'aria-haspopup':'dialog'});
  openBtn.innerHTML=svg('board')+'<span class="lwtc-label">Teacher\'s Corner</span>';
  var neck='<svg class="lwtc-neck" viewBox="0 0 52 40" aria-hidden="true"><path d="M6 14c8 1 10 8 18 9 7 1 10-4 20-1-8 7-14 10-22 9-7-1-12-6-16-12 0-2 0-4 0-5z"/></svg>';
  dock.appendChild(openBtn);dock.insertAdjacentHTML('beforeend',neck);
  badge=el('span','lwtc-badge');dock.appendChild(badge);
  var top=D.querySelector('header.top');
  if(top){var brand=top.querySelector('.brand');top.insertBefore(dock,brand&&brand.nextSibling||top.firstChild)}
  else{dock.classList.add('lwtc-float');D.body.appendChild(dock)}
  openBtn.addEventListener('click',function(){isOpen?close():open()});
  badge.addEventListener('click',function(){open()});
  updateBadge();
}
function updateBadge(){
  var n=0;try{n=unread().length}catch(e){}
  dock.classList.toggle('lwtc-has-badge',n>0);
  if(n>0){badge.textContent=String(n);openBtn.setAttribute('aria-label',"Teacher's Corner, "+n+(n>1?' new notes':' new note'))}
  else{badge.textContent='';openBtn.setAttribute('aria-label',"Teacher's Corner")}
}

function toolBtn(cls,label,icon,extra){var b=el('button','lwtc-tool '+(cls||''),{type:'button','aria-label':label,title:label});b.innerHTML=svg(icon)+(extra||'');return b}
function buildOverlay(){
  root=el('div','lwtc-root',{role:'dialog','aria-modal':'true','aria-label':"Teacher's Corner",tabindex:'-1','data-open':'no','aria-hidden':'true'});root.setAttribute('inert','');
  var frame=el('div','lwtc-frame');root.appendChild(frame);
  var notes=el('aside','lwtc-notes',{'aria-label':'Notes'});notes.innerHTML='<h2>Notes</h2>';listEl=el('ul','lwtc-list');notes.appendChild(listEl);frame.appendChild(notes);
  board=el('div','lwtc-board');frame.appendChild(board);
  var bar=el('div','lwtc-bar');board.appendChild(bar);
  bar.appendChild(Object.assign(el('h2','lwtc-title'),{textContent:"Teacher's Corner"}));
  var sc=el('div','lwtc-scroll',{role:'toolbar','aria-label':'Chalk tools'});bar.appendChild(sc);
  var toolEls={};
  TOOLS.forEach(function(t){var b=toolBtn('',t[1],t[2]);b.dataset.on=String(t[0]===tool);b.dataset.tool=t[0];b.setAttribute('aria-pressed',String(t[0]===tool));b.onclick=function(){setTool(t[0])};toolEls[t[0]]=b;sc.appendChild(b)});
  sc.appendChild(el('span','lwtc-gap'));
  var sw=[];
  INKS.forEach(function(k){var b=el('button','lwtc-swatch',{type:'button','aria-label':k[1]+' chalk',title:k[1],'data-ink':k[0]});b.dataset.on=String(k[0]===inkName);b.onclick=function(){setInk(k[0],k[2])};sw.push(b);sc.appendChild(b)});
  pickWrap=el('label','lwtc-pick',{title:'Pick any colour'});colorIn=el('input','',{type:'color',value:'#f7f4ec','aria-label':'Pick any chalk colour'});pickWrap.appendChild(colorIn);sc.appendChild(pickWrap);
  colorIn.oninput=function(){setInk('custom',colorIn.value)};
  var sz=el('label','lwtc-size');sz.innerHTML='<span>Chalk size</span>';sizeIn=el('input','',{type:'range',min:'2',max:'24',value:String(size),'aria-label':'Chalk size'});sz.appendChild(sizeIn);sc.appendChild(sz);
  sizeIn.oninput=function(){size=+sizeIn.value};
  sc.appendChild(el('span','lwtc-gap'));
  var bUndo=toolBtn('','Undo','undo'),bRedo=toolBtn('','Redo','redo'),bClear=toolBtn('','Clear the board','trash');
  bUndo.onclick=undo;bRedo.onclick=redo;bClear.onclick=clearAll;[bUndo,bRedo,bClear].forEach(function(b){sc.appendChild(b)});
  sc.appendChild(el('span','lwtc-gap'));
  var bAdd=toolBtn('lwtc-wide','Add a picture','image','<span>Add picture</span>'),bSave=toolBtn('lwtc-wide','Save as image','save','<span>Save as image</span>');
  bAdd.onclick=function(){fileIn.click()};bSave.onclick=saveImage;sc.appendChild(bAdd);sc.appendChild(bSave);
  var bFull=null;if(D.fullscreenEnabled){bFull=toolBtn('','Full screen','full');bFull.onclick=function(){D.fullscreenElement?D.exitFullscreen():root.requestFullscreen&&root.requestFullscreen().catch(function(){})};sc.appendChild(bFull)}
  var bClose=el('button','lwtc-close',{type:'button','aria-label':'Close'});bClose.innerHTML=svg('x')+'Close';bClose.onclick=close;bar.appendChild(bClose);
  statusEl=el('p','lwtc-status',{role:'status','aria-live':'polite'});board.appendChild(statusEl);
  stage=el('div','lwtc-stage');board.appendChild(stage);
  canvas=el('canvas','lwtc-canvas',{'data-tool':tool,'aria-label':'Chalk board. Draw with a pen or finger.'});stage.appendChild(canvas);ctx=canvas.getContext('2d');
  hint=el('p','lwtc-hint');hint.textContent='Draw with the chalk, or drop a picture here.';stage.appendChild(hint);
  dropEl=el('p','lwtc-drop');dropEl.hidden=true;dropEl.textContent='Drop to add it to the board';stage.appendChild(dropEl);
  fileIn=el('input','lwtc-file',{type:'file',accept:'image/*',tabindex:'-1','aria-hidden':'true'});stage.appendChild(fileIn);
  fileIn.onchange=function(){if(fileIn.files&&fileIn.files[0])addFile(fileIn.files[0]);fileIn.value=''};
  // note card
  scrim=el('div','lwtc-scrim',{role:'dialog','aria-modal':'true','aria-label':'Note','data-open':'no'});card=el('div','lwtc-card');scrim.appendChild(card);root.appendChild(scrim);
  // refs for state sync
  root._tools=toolEls;root._sw=sw;root._undo=bUndo;root._redo=bRedo;root._clear=bClear;
  D.body.appendChild(root);
  // events
  canvas.addEventListener('pointerdown',pDown);canvas.addEventListener('pointermove',pMove);canvas.addEventListener('pointerup',pUp);canvas.addEventListener('pointercancel',pUp);
  stage.addEventListener('dragover',function(e){if(hasFile(e)){e.preventDefault();dropEl.hidden=false}});
  stage.addEventListener('dragleave',function(e){if(!stage.contains(e.relatedTarget))dropEl.hidden=true});
  stage.addEventListener('drop',function(e){dropEl.hidden=true;var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f){e.preventDefault();addFile(f)}});
  ['keydown','keyup','keypress'].forEach(function(t){root.addEventListener(t,function(e){e.stopPropagation()})});
  if(window.ResizeObserver)new ResizeObserver(function(){if(isOpen)resize()}).observe(stage);
  window.addEventListener('resize',function(){if(isOpen)resize()});
  syncUI();
}
function hasFile(e){var t=e.dataTransfer&&e.dataTransfer.types;return !!t&&Array.prototype.indexOf.call(t,'Files')>=0}

/* ---------- tool state ---------- */
function setTool(t){commitText();tool=t;canvas.dataset.tool=t;syncUI()}
function setInk(name,hex){ink=hex;inkName=name;syncUI()}
function syncUI(){
  for(var k in root._tools){var on=k===tool;root._tools[k].dataset.on=String(on);root._tools[k].setAttribute('aria-pressed',String(on))}
  root._sw.forEach(function(b){b.dataset.on=String(b.dataset.ink===inkName)});
  pickWrap.dataset.on=String(inkName==='custom');
  root._undo.disabled=idx<=0;root._redo.disabled=idx>=states.length-1;root._clear.disabled=!states[idx].length;
  hint.hidden=states[idx].length>0||!!textEd;
}

/* ---------- history and drawing ---------- */
function items(){return states[idx]}
function commit(next){states=states.slice(0,idx+1);states.push(next);if(states.length>101)states.shift();idx=states.length-1;syncUI();paint()}
function undo(){commitText();if(idx>0){idx--;syncUI();paint()}}
function redo(){commitText();if(idx<states.length-1){idx++;syncUI();paint()}}
function clearAll(){commitText();if(items().length)commit([])}
function resize(){
  var r=stage.getBoundingClientRect();if(!r.width||!r.height)return;
  dpr=Math.min(2,window.devicePixelRatio||1);cw=r.width;chh=r.height;
  canvas.width=Math.round(cw*dpr);canvas.height=Math.round(chh*dpr);off.width=canvas.width;off.height=canvas.height;paint()
}
function lw(s){return s/900*Math.max(cw,640)}
function strokePath(c,s,W,H){
  var pts=s.pts;c.beginPath();
  if(s.t==='pen'||s.t==='hl'||s.t==='er'){
    if(pts.length===1){c.arc(pts[0][0]*W,pts[0][1]*H,c.lineWidth/2,0,Math.PI*2);c.fill();return}
    c.moveTo(pts[0][0]*W,pts[0][1]*H);
    for(var i=1;i<pts.length-1;i++){var mx=(pts[i][0]+pts[i+1][0])/2*W,my=(pts[i][1]+pts[i+1][1])/2*H;c.quadraticCurveTo(pts[i][0]*W,pts[i][1]*H,mx,my)}
    var l=pts[pts.length-1];c.lineTo(l[0]*W,l[1]*H);c.stroke();return
  }
  var a=s.a,b=s.b,x1=a[0]*W,y1=a[1]*H,x2=b[0]*W,y2=b[1]*H;
  if(s.t==='line'||s.t==='arrow'){
    c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
    if(s.t==='arrow'){var ang=Math.atan2(y2-y1,x2-x1),hl=Math.max(12,c.lineWidth*4);c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-hl*Math.cos(ang-.45),y2-hl*Math.sin(ang-.45));c.moveTo(x2,y2);c.lineTo(x2-hl*Math.cos(ang+.45),y2-hl*Math.sin(ang+.45));c.stroke()}
  }else if(s.t==='rect'){c.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1))}
  else if(s.t==='circle'){c.ellipse((x1+x2)/2,(y1+y2)/2,Math.max(1,Math.abs(x2-x1)/2),Math.max(1,Math.abs(y2-y1)/2),0,0,Math.PI*2);c.stroke()}
}
function drawStrokes(c,list,W,H){
  list.forEach(function(s){
    if(s.t==='img')return;
    c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=s.c;c.fillStyle=s.c;c.globalAlpha=1;c.globalCompositeOperation='source-over';
    if(s.t==='text'){
      var px=s.fs*W;c.font='560 '+px+'px Fraunces, Georgia, "Times New Roman", serif';c.textBaseline='top';
      String(s.txt).split('\n').forEach(function(line,i){c.fillText(line,s.x*W,s.y*H+i*px*1.2)});
    }else{
      c.lineWidth=lw(s.w)*(s.t==='hl'?2.4:s.t==='er'?1.8:1);
      if(s.t==='hl')c.globalAlpha=.38;
      if(s.t==='er')c.globalCompositeOperation='destination-out';
      strokePath(c,s,W,H);
    }
    c.restore()});
}
function drawImages(c,list,W,H){list.forEach(function(s){if(s.t!=='img')return;var w=s.wN*W,h=w*s.ar;c.drawImage(s.img,s.cx*W-w/2,s.cy*H-h/2,w,h)})}
function paint(){
  if(!ctx||!cw)return;
  var list=cur?items().concat([cur]):items();
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cw,chh);
  drawImages(ctx,list,cw,chh);
  var o=off.getContext('2d');o.setTransform(dpr,0,0,dpr,0,0);o.clearRect(0,0,cw,chh);drawStrokes(o,list,cw,chh);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(off,0,0);ctx.restore();
}
function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;paint()})}
function pt(e){var r=canvas.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]}
function pDown(e){
  if(e.button>0||textEd&&tool!=='text')return;
  if(tool==='text'){e.preventDefault();openText(pt(e),e);return}
  commitText();e.preventDefault();try{canvas.setPointerCapture(e.pointerId)}catch(x){}
  var p=pt(e);
  if(tool==='pen'||tool==='hl'||tool==='eraser')cur={t:tool==='eraser'?'er':tool,pts:[p],c:ink,w:size};
  else cur={t:tool,a:p,b:p,c:ink,w:size};
  hint.hidden=true;paint()
}
function pMove(e){
  if(!cur)return;
  var evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];if(!evs.length)evs=[e];
  evs.forEach(function(ev){var p=pt(ev);if(cur.pts)cur.pts.push(p);else cur.b=p});
  schedule()
}
function pUp(e){
  if(!cur)return;var s=cur;cur=null;try{canvas.releasePointerCapture(e.pointerId)}catch(x){}
  if(s.pts)s.pts=s.pts.slice();
  var ok=true;if(s.a){var dx=(s.b[0]-s.a[0])*cw,dy=(s.b[1]-s.a[1])*chh;ok=Math.hypot(dx,dy)>3}
  if(ok)commit(items().concat([s]));else{syncUI();paint()}
}

/* ---------- text tool ---------- */
function openText(p,e){
  commitText();
  var fsPx=Math.max(16,(size*2+14)/900*Math.max(cw,640));
  var ta=el('textarea','lwtc-text',{rows:'1','aria-label':'Type on the board. Press Enter to place it.',spellcheck:'false'});
  ta.style.left=Math.min(p[0]*cw,cw-140)+'px';ta.style.top=Math.min(p[1]*chh,chh-fsPx*1.6)+'px';ta.style.fontSize=fsPx+'px';ta.style.color=ink;
  stage.appendChild(ta);textEd={ta:ta,x:Math.min(p[0],1-140/cw),y:Math.min(p[1],1-fsPx*1.6/chh),fs:fsPx/cw,c:ink,done:false};
  ta.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&!ev.shiftKey){ev.preventDefault();commitText()}});
  ta.addEventListener('input',function(){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px'});
  ta.addEventListener('blur',function(){setTimeout(commitText,0)});
  hint.hidden=true;setTimeout(function(){ta.focus()},0)
}
function closeText(){if(!textEd)return;var t=textEd;textEd=null;t.done=true;if(t.ta.parentNode)t.ta.remove();syncUI()}
function commitText(){
  if(!textEd||textEd.done)return;var t=textEd,v=t.ta.value.replace(/\s+$/,'');closeText();
  if(v.trim())commit(items().concat([{t:'text',x:t.x,y:t.y,txt:v,c:t.c,fs:t.fs}]))
}
function cancelText(){closeText()}

/* ---------- pictures and save ---------- */
function addFile(f){
  if(!f||!/^image\//.test(f.type)){note('Only pictures can be added to the board.');return}
  var url=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
    var ar=im.naturalHeight/im.naturalWidth||1,w=Math.min(.6*cw,.6*chh/ar);
    commit(items().concat([{t:'img',img:im,cx:.5,cy:.5,wN:w/cw,ar:ar}]));note('Picture added. Draw on top of it.')
  };
  im.onerror=function(){note('That picture could not be opened.')};im.src=url
}
function note(msg){statusEl.textContent=msg;clearTimeout(note.t);note.t=setTimeout(function(){statusEl.textContent=''},4000)}
function saveImage(){
  commitText();var W=canvas.width,H=canvas.height;if(!W)return;
  var o=el('canvas');o.width=W;o.height=H;var c=o.getContext('2d');
  c.fillStyle='#1a4034';c.fillRect(0,0,W,H);
  var g=c.createRadialGradient(W/2,0,0,W/2,0,Math.max(W,H)*.6);g.addColorStop(0,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.drawImage(canvas,0,0);
  o.toBlob(function(b){if(!b){note('Could not save the picture.');return}
    var a=el('a','',{download:'teachers-corner.png',href:URL.createObjectURL(b)});D.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},4000);note('Saved as teachers-corner.png')},'image/png')
}

/* ---------- notes list and cards ---------- */
var cardEntry=null,mineTa=null;
function renderList(){
  listEl.innerHTML='';var r=jget(readKey(),{});
  entries().forEach(function(e){
    var li=el('li'),b=el('button','',{type:'button'});b.textContent=e.title;
    if(e.auth&&!r[entryKey(e)]){var d=el('span','lwtc-new',{'aria-label':'new'});b.appendChild(d)}
    b.onclick=function(){openCard(e)};li.appendChild(b);listEl.appendChild(li)})
}
function fillText(box,text){
  var ul=null;String(text).split('\n').forEach(function(line){
    if(/^- /.test(line)){if(!ul){ul=el('ul');box.appendChild(ul)}ul.appendChild(Object.assign(el('li'),{textContent:line.slice(2)}))}
    else{ul=null;if(line.trim())box.appendChild(Object.assign(el('p'),{textContent:line}))}})
}
function plain(text){return String(text).replace(/^- /gm,'').replace(/\n+/g,'. ').replace(/:\./g,':')}
function openCard(e){
  commitText();cardEntry=e;card.innerHTML='';mineTa=null;
  var h=el('h2');h.textContent=e.title;card.appendChild(h);
  var body=el('div','lwtc-card-text');
  if(e.mine){mineTa=el('textarea','',{'aria-label':'My notes for this page',placeholder:'Type your own notes for this page. They stay on this device.'});mineTa.value=jget('lwtc.mine.'+pageKey,'');mineTa.oninput=function(){jset('lwtc.mine.'+pageKey,mineTa.value)};body.appendChild(mineTa)}
  else fillText(body,e.text);
  card.appendChild(body);
  var btns=el('div','lwtc-card-btns');
  var L=el('button','lwtc-listen',{type:'button'});L.innerHTML=svg('vol')+'Listen';L.onclick=function(){speak(e.title+'. '+plain(e.mine?(mineTa.value||'No notes yet.'):e.text))};
  var C=el('button','lwtc-card-close',{type:'button'});C.textContent='Close';C.onclick=closeCard;
  if(window.speechSynthesis)btns.appendChild(L);btns.appendChild(C);card.appendChild(btns);
  scrim.dataset.open='yes';(mineTa||C).focus();
  if(e.auth){markRead(e);renderList();updateBadge()}
}
function closeCard(){if(scrim.dataset.open!=='yes')return;scrim.dataset.open='no';cardEntry=null;stopSpeech();root.focus()}
function speak(t){if(!window.speechSynthesis)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.lang='en-US';u.rate=.9;speechSynthesis.speak(u)}catch(e){}}
function stopSpeech(){try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}}

/* On a phone, if some other part of the page is wider than the screen, the layout viewport grows past the screen and a fixed
   overlay would hang off the edge. Pin the board to what is actually visible in that case (visual viewport). */
function fitScreen(){
  if(!root)return;var v=window.visualViewport,s=root.style;
  if(isOpen&&v&&v.scale<=1.01&&window.innerWidth>v.width+2){s.inset='auto';s.left=v.offsetLeft+'px';s.top=v.offsetTop+'px';s.width=v.width+'px';s.height=v.height+'px'}
  else{s.inset='';s.left=s.top=s.width=s.height=''}
  if(isOpen)resize();
}
if(window.visualViewport){visualViewport.addEventListener('resize',function(){if(isOpen)fitScreen()});visualViewport.addEventListener('scroll',function(){if(isOpen)fitScreen()})}

/* ---------- open / close / keys ---------- */
function open(){
  if(isOpen)return;if(!root)buildOverlay();
  lastFocus=D.activeElement;renderList();
  root.dataset.open='yes';root.removeAttribute('inert');root.removeAttribute('aria-hidden');isOpen=true;
  prevOverflow=D.body.style.overflow;D.body.style.overflow='hidden';D.body.classList.add('lwtc-is-open');
  fitScreen();resize();syncUI();root.focus();
}
function close(){
  if(!isOpen)return;commitText();closeCard();cur=null;
  root.dataset.open='no';root.setAttribute('inert','');root.setAttribute('aria-hidden','true');isOpen=false;fitScreen();
  if(D.fullscreenElement&&D.fullscreenElement===root)D.exitFullscreen().catch(function(){});
  D.body.style.overflow=prevOverflow;D.body.classList.remove('lwtc-is-open');stopSpeech();updateBadge();
  try{(lastFocus&&D.contains(lastFocus)?lastFocus:openBtn).focus()}catch(e){}
}
window.addEventListener('keydown',function(e){
  if(!isOpen)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(textEd)cancelText();else if(scrim.dataset.open==='yes')closeCard();else close();return}
  var inField=e.target&&/^(INPUT|TEXTAREA)$/.test(e.target.tagName)&&e.target.type!=='range'&&e.target.type!=='color';
  if((e.ctrlKey||e.metaKey)&&!inField&&scrim.dataset.open!=='yes'){var k=e.key.toLowerCase();if(k==='z'){e.preventDefault();e.shiftKey?redo():undo()}else if(k==='y'){e.preventDefault();redo()}}
},true);

function init(){
  loadAssets();buildButton();
  var re=function(){updateBadge();if(isOpen&&scrim.dataset.open!=='yes')renderList()};window.addEventListener('hashchange',re);window.addEventListener('storage',re);
  setTimeout(re,600);setTimeout(re,2000);window.addEventListener('load',re); // data.js / goal data may arrive late
}
window.LWTeachersCorner={open:open,close:close,isOpen:function(){return isOpen},unread:function(){return unread().length}};
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init);else init();
})();
