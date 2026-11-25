/* Bouncing Words · Little Wonders
   three.js (rendering) + cannon-es (physics), both bundled in vendor/bw-libs.js. Fixed 120 Hz physics steps driven by a simulation clock,
   so the 60-second energy decay is exact whatever the frame rate (and can be fast-forwarded by the test hook window.__bw). */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SENT=window.BW_SENTENCES||{A1:[],A2:[],B1:[]},PID='games/bouncing-words';
const LEVELS=[
 {k:'A1',name:'Starter',sub:'Short and simple · 4–6 words',cls:'L1',size:2.6,demo:['I','like','my','ball.']},
 {k:'A2',name:'Basic',sub:'Longer · 8–11 words',cls:'L2',size:2.2,demo:['We','are','going','to','the','zoo.']},
 {k:'B1',name:'Intermediate',sub:'Varied grammar · 12–16 words',cls:'L3',size:1.85,demo:['If','I','had','wings,','I','would','fly.']}
];
const PALETTE=['#e8504f','#f08a00','#2c9a83','#3f7fe0','#8a5cc8','#d8588d','#3aa655','#e0662f','#1fa1c7','#b9568f'];
const H=10,D=7,TOTAL=60,STEP=1/120,MAXV=24,MAXW=9;   // box height, depth (world units), seconds from 100% to 0%, physics step
const strengthAt=t=>t>=TOTAL?0:1-Math.pow(t/TOTAL,2);   // gentle at first (97% after 10 s), 0% at 60 s

const el={list:$('list'),cats:$('cats'),play:$('play'),lv:$('lv'),stage:$('stage'),msg:$('msg'),status:$('status'),blocks:$('blocks'),pwf:$('pwf'),pwn:$('pwn')};
const L=window.BWLibs;
let T,C,R=null,scene,cam,renderer,world,font,matWord,matWall,cmWW,cmWF,boxGroup,wordGroup,keyLight;
let W=24,curLevel=null,round=null,simT=0,acc=0,lastNow=0,running=false,glOK=true,texCache={};

/* ---------- picker ---------- */
function buildList(){
  el.cats.innerHTML=LEVELS.map(l=>`<button class="bw-cat ${l.cls}" data-k="${l.k}"><h2>${l.name}<small>${l.k}</small></h2><span class="sp">${l.sub}</span><span class="demo" data-lw-skip>${l.demo.map(w=>`<i>${w}</i>`).join('')}</span><span class="go">Play</span></button>`).join('');
  el.lv.innerHTML=LEVELS.map(l=>`<button data-k="${l.k}" class="${l.cls}">${l.name}<small>${l.k}</small></button>`).join('');
}
el.cats.addEventListener('click',e=>{const b=e.target.closest('.bw-cat');if(b)startLevel(b.dataset.k)});
el.lv.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.k!==curLevel)startLevel(b.dataset.k)});
$('back').onclick=()=>toList();
$('newb').onclick=()=>newSentence();
$('shake').onclick=()=>shake();

/* ---------- sentence bag: no repeats until the whole list has been used, never the same one twice in a row ---------- */
const bags={},lastIdx={};
function pickSentence(k){
  const list=SENT[k];let bag=bags[k];
  if(!bag||!bag.length){
    bag=list.map((_,i)=>i);
    for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}
    if(bag.length>1&&bag[bag.length-1]===lastIdx[k]){const j=Math.floor(Math.random()*(bag.length-1));[bag[bag.length-1],bag[j]]=[bag[j],bag[bag.length-1]]}
    bags[k]=bag;
  }
  const i=bag.pop();lastIdx[k]=i;return {i,text:list[i]};
}

/* ---------- 3D set-up ---------- */
function initGL(){
  if(R)return true;
  if(!L){fail('3D could not load. Please reload the page.');return false}
  T=L.THREE;C=L.CANNON;
  try{
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  }catch(e){fail('Your browser cannot show the 3D box (WebGL is off). Try Chrome or Edge.');return false}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.setClearColor(0xefe9fb,1);
  el.stage.insertBefore(renderer.domElement,el.stage.firstChild);
  scene=new T.Scene();
  cam=new T.PerspectiveCamera(26,2,.5,600);
  scene.add(new T.HemisphereLight(0xffffff,0xd8cdf0,2.1));
  keyLight=new T.DirectionalLight(0xfff6e8,2.2);keyLight.castShadow=true;
  keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.bias=-.0006;keyLight.shadow.normalBias=.03;keyLight.shadow.radius=3;
  scene.add(keyLight,keyLight.target);
  const fill=new T.PointLight(0xffffff,90,60,1.6);fill.position.set(0,H*.7,D/2+6);scene.add(fill);
  boxGroup=new T.Group();wordGroup=new T.Group();scene.add(boxGroup,wordGroup);
  font=new T.Font(window.BW_FONT);
  world=new C.World({gravity:new C.Vec3(0,-24,0)});
  world.allowSleep=true;world.solver.iterations=12;
  matWord=new C.Material('word');matWall=new C.Material('wall');
  cmWW=new C.ContactMaterial(matWord,matWord,{friction:.18,restitution:.8});
  cmWF=new C.ContactMaterial(matWord,matWall,{friction:.25,restitution:.9});
  world.addContactMaterial(cmWW);world.addContactMaterial(cmWF);
  R={};return true;
}
function fail(m){glOK=false;el.msg.style.display='flex';el.msg.textContent=m}
function tex(name,draw,w,h,rx,ry){
  const key=name+rx+'_'+ry;if(texCache[key])return texCache[key];
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return texCache[key]=t;
}
let wallBodies=[];
function buildBox(){
  while(boxGroup.children.length){const m=boxGroup.children.pop();m.geometry&&m.geometry.dispose();m.material&&m.material.dispose&&m.material.dispose()}
  wallBodies.forEach(b=>world.removeBody(b));wallBodies=[];
  const mk=(geo,mat,x,y,z,recv)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.receiveShadow=!!recv;boxGroup.add(m);return m};
  const floorT=tex('floor',(g,w,h)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.fillStyle=(x+y)%2?'#d9f1e8':'#c4e8dc';g.fillRect(x*w/4,y*h/4,w/4,h/4)}},256,256,W/6,D/6);
  const backT=tex('back',(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#f6f1ff');gr.addColorStop(1,'#e6dcfa');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.55)';for(let y=0;y<4;y++)for(let x=0;x<4;x++){g.beginPath();g.arc(x*w/4+(y%2?w/8:0)+w/8,y*h/4+h/8,w/26,0,7);g.fill()}},256,256,W/6,H/6);
  mk(new T.PlaneGeometry(W,D),new T.MeshStandardMaterial({map:floorT,roughness:.7}),0,0,0,1).rotation.x=-Math.PI/2;
  mk(new T.PlaneGeometry(W,H),new T.MeshStandardMaterial({map:backT,roughness:.9}),0,H/2,-D/2,1);
  const sideMat=()=>new T.MeshStandardMaterial({color:0xf0e9fc,roughness:.9});
  const l=mk(new T.PlaneGeometry(D,H),sideMat(),-W/2,H/2,0,1);l.rotation.y=Math.PI/2;
  const r=mk(new T.PlaneGeometry(D,H),sideMat(),W/2,H/2,0,1);r.rotation.y=-Math.PI/2;
  const ce=mk(new T.PlaneGeometry(W,D),new T.MeshStandardMaterial({color:0xf7f3ff,roughness:.9,transparent:true,opacity:.55}),0,H,0,0);ce.rotation.x=Math.PI/2;
  // glass-cube frame
  const bar=new T.MeshStandardMaterial({color:0x8f78d0,roughness:.35,metalness:.1}),bt=.34;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
    mk(new T.BoxGeometry(bt,bt,D+bt),bar,sx*W/2,sy>0?H:0,0,0);
  });
  [[-1,0],[1,0],[-1,H],[1,H]].forEach(([sx,y])=>{[-1,1].forEach(sz=>{mk(new T.BoxGeometry(bt,bt,bt),bar,sx*W/2,y,sz*D/2,0)})});
  [-1,1].forEach(sz=>{[0,H].forEach(y=>mk(new T.BoxGeometry(W+bt,bt,bt),bar,0,y,sz*D/2,0));[-1,1].forEach(sx=>mk(new T.BoxGeometry(bt,H+bt,bt),bar,sx*W/2,H/2,sz*D/2,0))});
  // front glass (visual only; the physics wall is at the same place)
  const glassT=tex('glass',(g,w,h)=>{g.clearRect(0,0,w,h);const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'rgba(255,255,255,.00)');gr.addColorStop(.18,'rgba(255,255,255,.20)');gr.addColorStop(.26,'rgba(255,255,255,.04)');gr.addColorStop(.31,'rgba(255,255,255,.14)');gr.addColorStop(.40,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)},512,256,1,1);
  const gl=mk(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({map:glassT,transparent:true,depthWrite:false}),0,H/2,D/2+.02,0);gl.renderOrder=10;
  // physics walls (thick, so nothing can tunnel through)
  const wall=(hx,hy,hz,x,y,z)=>{const b=new C.Body({mass:0,material:matWall,shape:new C.Box(new C.Vec3(hx,hy,hz))});b.position.set(x,y,z);world.addBody(b);wallBodies.push(b)};
  wall(W/2+3,2,D/2+3,0,-2,0);wall(W/2+3,2,D/2+3,0,H+2,0);
  wall(2,H/2+3,D/2+3,-W/2-2,H/2,0);wall(2,H/2+3,D/2+3,W/2+2,H/2,0);
  wall(W/2+3,H/2+3,2,0,H/2,-D/2-2);wall(W/2+3,H/2+3,2,0,H/2,D/2+2);
  // light + shadow camera follow the box
  keyLight.position.set(-W*.22,H+9,D+4);keyLight.target.position.set(0,0,0);
  const s=keyLight.shadow.camera,ex=Math.max(W,D*2)*.62+3;s.left=-ex;s.right=ex;s.top=ex*.7;s.bottom=-ex*.7;s.near=1;s.far=60;s.updateProjectionMatrix();
}
function fitCamera(){
  const fov=cam.fov*Math.PI/180,ay=H*.66,ty=H*.47,v=new T.Vector3();
  const corners=[[-1,0],[1,0],[-1,H],[1,H]].map(([sx,y])=>[sx*(W/2+.18),y+(y?.18:-.18),D/2+.18]);
  for(let d=6;d<560;d+=.2){
    cam.position.set(0,ay,D/2+d);cam.lookAt(0,ty,0);cam.updateMatrixWorld(true);
    let ok=true;
    for(const c of corners){v.set(c[0],c[1],c[2]).project(cam);if(Math.abs(v.x)>.99||Math.abs(v.y)>.985){ok=false;break}}
    if(ok)break;
  }
}
function layout(){
  if(!R)return;
  const w=Math.max(200,el.stage.clientWidth),h=Math.max(150,el.stage.clientHeight);
  renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
  const nw=Math.min(34,Math.max(13,Math.round(H*(w/h)*10)/10));
  if(Math.abs(nw-W)>W*.02||!boxGroup.children.length){
    W=nw;buildBox();
    if(round)round.words.forEach(o=>{const b=o.body,hx=W/2-o.hw-.1;b.position.x=Math.max(-hx,Math.min(hx,b.position.x));b.wakeUp()});
  }
  fitCamera();
}

/* ---------- words ---------- */
function makeWord(text,color,idx){
  const dep=.17,bt=.035;
  const g=new T.TextGeometry(text,{font,size:1,depth:dep,curveSegments:5,bevelEnabled:true,bevelThickness:bt,bevelSize:.03,bevelSegments:2});
  g.computeBoundingBox();const bb=g.boundingBox;
  g.translate(-(bb.min.x+bb.max.x)/2,-(bb.min.y+bb.max.y)/2,bt);   // centred; the front half sits at z 0..dep+2bt
  const mat=new T.MeshStandardMaterial({color,roughness:.36,metalness:.04});
  const grp=new T.Group(),a=new T.Mesh(g,mat),b=new T.Mesh(g,mat);
  b.rotation.y=Math.PI;               // the back half is turned round, so the word reads correctly from behind too
  a.castShadow=b.castShadow=true;grp.add(a,b);
  return {text,color,idx,g,mat,grp,w1:bb.max.x-bb.min.x,h1:bb.max.y-bb.min.y,z1:dep+2*bt,revealed:false,pulse:0};
}
function clearRound(){
  if(!round)return;
  round.words.forEach(o=>{world.removeBody(o.body);wordGroup.remove(o.grp);o.g.dispose();o.mat.dispose()});
  round=null;
}
function rnd(a,b){return a+Math.random()*(b-a)}
function spawn(words,lv){
  // size: level default, shrunk if the sentence has a lot of long words
  const area=words.reduce((s,o)=>s+o.w1*o.h1,0),maxw=Math.max(...words.map(o=>o.w1));
  let k=Math.min(lv.size,Math.sqrt(.34*W*H*2/area),W*.40/maxw);
  const placed=[];
  words.forEach((o,i)=>{
    o.k=k;o.g.scale(k,k,k);
    o.hw=o.w1*k/2+.05;o.hh=o.h1*k/2+.05;o.hz=o.z1*k+.02;
    o.grp.visible=false;
    o.shape=new C.Box(new C.Vec3(o.hw,o.hh,o.hz));
    const body=new C.Body({mass:Math.max(.5,o.w1*o.h1*k*k*.4),material:matWord,shape:o.shape,allowSleep:true,sleepSpeedLimit:.25,sleepTimeLimit:.7});
    // find a free spot in the upper part of the box (axis-aligned boxes, roughly upright)
    let pos=null;
    for(let t=0;t<260&&!pos;t++){
      const x=rnd(-W/2+o.hw+.3,W/2-o.hw-.3),y=rnd(H*.38+o.hh,H-o.hh-.3),z=rnd(-D/2+o.hz+.4,D/2-o.hz-.4);
      const pad=t<120?.15:0;
      if(placed.every(p=>Math.abs(p[0]-x)>p[3]+o.hw+pad||Math.abs(p[1]-y)>p[4]+o.hh+pad||Math.abs(p[2]-z)>p[5]+o.hz+pad))pos=[x,y,z];
    }
    if(!pos)pos=[rnd(-W/3,W/3),rnd(H*.4,H-1),rnd(-D/3,D/3)];
    placed.push([pos[0],pos[1],pos[2],o.hw,o.hh,o.hz]);
    body.position.set(pos[0],pos[1],pos[2]);
    body.quaternion.setFromEuler(rnd(-.35,.35),rnd(-.5,.5),rnd(-.4,.4));
    body.velocity.set(rnd(-7,7),rnd(-6,2),rnd(-3,3));
    body.angularVelocity.set(rnd(-4,4),rnd(-4,4),rnd(-4,4));
    body.linearDamping=.01;body.angularDamping=.05;
    world.addBody(body);o.body=body;o.born=rnd(0,.3);o.kick=rnd(.2,.8);
    wordGroup.add(o.grp);
  });
}
// Where the words come to rest: standing in a few lanes (front to back). Planned from where the words are when the energy runs low, so they hardly have to cross each other.
function planLanes(words){
  const byZ=words.map((_,i)=>i).sort((a,b)=>words[b].body.position.z-words[a].body.position.z);
  const cap=W-2.4,gap=.7,lanes=[[]];let used=0;
  byZ.forEach(i=>{const w=words[i].hw*2;if(used+w>cap&&lanes[lanes.length-1].length){lanes.push([]);used=0}lanes[lanes.length-1].push(i);used+=w+gap});
  const n=lanes.length,hzm=Math.max(...words.map(o=>o.hz)),zf=D/2-hzm-.5,zb=-D/2+hzm+.6;
  lanes.forEach((ln,j)=>{
    ln.sort((a,b)=>words[a].body.position.x-words[b].body.position.x);
    const tot=ln.reduce((s,i)=>s+words[i].hw*2,0)+gap*(ln.length-1);let x=-tot/2;
    const z=n===1?zf-.8:zf-j*(zf-zb)/(n-1);
    ln.forEach(i=>{const o=words[i];o.tx=x+o.hw;o.tz=z;x+=o.hw*2+gap});
  });
  round.planned=true;
}
function stepOnce(h){
  simT+=h;
  const s=strengthAt(simT),calm=1-s;
  cmWW.restitution=.28+.58*s;cmWF.restitution=.32+.62*s;
  if(!round)return;
  const rw=Math.max(0,Math.min(1,(.62-s)/.4)),lw=Math.max(0,Math.min(1,(.42-s)/.3));      // 0 while lively; 1 once nearly out of energy: words stand up and face the glass
  const ld=.01+.3*calm*calm*calm,ad=.05+.5*calm*calm*calm;
  for(const o of round.words){
    const b=o.body;b.linearDamping=ld;b.angularDamping=ad;
    if(s>.015){
      o.kick-=h;
      if(o.kick<=0){
        o.kick=rnd(.3,.85);
        const low=b.position.y<H*.5;
        b.velocity.x+=rnd(-1,1)*s*11;b.velocity.z+=rnd(-1,1)*s*5.5;
        b.velocity.y+= low&&b.velocity.y<7 ? s*rnd(9,19) : rnd(-1,1)*s*6;
        b.angularVelocity.x+=rnd(-1,1)*s*7;b.angularVelocity.y+=rnd(-1,1)*s*7;b.angularVelocity.z+=rnd(-1,1)*s*7;
        b.wakeUp();
      }
    }
    if(rw>0){
      // gentle self-righting: turn so the word is upright and its face points at (or away from) the glass
      const q=b.quaternion,f=q.vmult(new C.Vec3(0,0,1)),tz=f.z>=0?0:Math.PI;
      const qt=new C.Quaternion();qt.setFromAxisAngle(new C.Vec3(0,1,0),tz);
      const qi=new C.Quaternion(q.x,q.y,q.z,q.w);qi.conjugate(qi);
      const qe=qt.mult(qi);if(qe.w<0){qe.x=-qe.x;qe.y=-qe.y;qe.z=-qe.z;qe.w=-qe.w}
      const ang=2*Math.acos(Math.min(1,qe.w)),sn=Math.sqrt(Math.max(1e-9,1-qe.w*qe.w));
      if(ang>.015){
        const gain=Math.min(5,ang*4)/sn,wx=qe.x*gain,wy=qe.y*gain,wz=qe.z*gain,a=Math.min(1,rw*h*10);
        const av=b.angularVelocity;av.x+=(wx-av.x)*a;av.y+=(wy-av.y)*a;av.z+=(wz-av.z)*a;if(ang>.06)b.wakeUp();
      }
    }
    if(lw>0&&!round.planned)planLanes(round.words);
    if(lw>0&&o.tx!==undefined){
      // soft spring towards this word's resting place (and damping), strongest once the energy is nearly gone
      const v=b.velocity,a=lw*h;
      v.x+=(22*(o.tx-b.position.x)-8*v.x)*a;v.z+=(22*(o.tz-b.position.z)-8*v.z)*a;
      if(Math.abs(o.tx-b.position.x)>.25||Math.abs(o.tz-b.position.z)>.25)b.wakeUp();
    }
    const v=b.velocity,sp=v.length();if(sp>MAXV)v.scale(MAXV/sp,v);
    const av=b.angularVelocity,aw=av.length();if(aw>MAXW)av.scale(MAXW/aw,av);
  }
  world.step(h);
  // safety net: nothing may ever leave the box
  const hx=W/2,hz=D/2;
  for(const o of round.words){const p=o.body.position;
    if(p.x<-hx||p.x>hx||p.y<0||p.y>H||p.z<-hz||p.z>hz){
      p.x=Math.max(-hx+o.hw,Math.min(hx-o.hw,p.x));p.y=Math.max(o.hh,Math.min(H-o.hh,p.y));p.z=Math.max(-hz+o.hz,Math.min(hz-o.hz,p.z));
      o.body.velocity.scale(.3,o.body.velocity);}}
}
function sync(dt){
  if(!round)return;
  for(const o of round.words){
    const b=o.body,g=o.grp;
    g.position.set(b.position.x,b.position.y,b.position.z);g.quaternion.set(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w);
    const a=Math.min(1,Math.max(0,(simT-o.born)/.28));let sc=a<1?a*(2-a):1;
    if(o.pulse>0){o.pulse=Math.max(0,o.pulse-dt/1.6);const p=Math.sin((1-o.pulse)*Math.PI);o.mat.emissive.set(o.color);o.mat.emissiveIntensity=p*.85;sc*=1+.22*p}
    else if(o.mat.emissiveIntensity){o.mat.emissiveIntensity=0}
    g.scale.setScalar(sc);g.visible=sc>.01;
  }
}

/* ---------- rounds ---------- */
function startLevel(k,push){
  if(!initGL())return;
  const lv=LEVELS.find(l=>l.k===k);if(!lv)return;
  curLevel=k;document.body.classList.add('playing');
  el.play.className='bw-play '+lv.cls;
  [...el.lv.children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  el.lv.style.setProperty('--c',getComputedStyle(el.play).getPropertyValue('--c'));
  if(push!==false)history.pushState(null,'','#'+k);
  document.title='Bouncing Words · '+lv.name+' · Little Wonders';
  requestAnimationFrame(()=>{layout();newSentence();startLoop()});
}
function toList(push){
  document.body.classList.remove('playing');running=false;curLevel=null;clearRound();document.title='Bouncing Words · Little Wonders';
  if(push!==false)history.pushState(null,'',location.pathname+location.search);
}
function newSentence(){
  if(!R||!curLevel)return;
  const lv=LEVELS.find(l=>l.k===curLevel),pick=pickSentence(curLevel);
  clearRound();
  const pal=PALETTE.slice();for(let i=pal.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pal[i],pal[j]]=[pal[j],pal[i]]}
  const words=pick.text.split(/\s+/).map((w,i)=>makeWord(w,pal[i%pal.length],i));
  simT=0;acc=0;
  round={level:curLevel,idx:pick.i,text:pick.text,words,revealed:0,planned:false};
  spawn(words,lv);
  buildBlocks();updatePower();setStatus();
  sync(0);
}
function shake(){
  if(!round)return;simT=0;acc=0;round.planned=false;round.words.forEach(o=>{o.tx=undefined});
  round.words.forEach(o=>{o.born=-1;o.kick=rnd(0,.3);o.body.velocity.y+=rnd(6,12);o.body.angularVelocity.set(rnd(-6,6),rnd(-6,6),rnd(-6,6));o.body.wakeUp()});
}
function buildBlocks(){
  const n=round.words.length;
  const avail=el.blocks.clientWidth||innerWidth*.94,per=Math.max(1,Math.floor((avail+8)/92)),rows=Math.ceil(n/Math.min(n,per)),cols=Math.ceil(n/rows);
  el.blocks.style.setProperty('--cols',cols);
  el.blocks.innerHTML=round.words.map((o,i)=>`<button type="button" class="bw-b" data-i="${i}" disabled aria-label="Word ${i+1}, hidden"><span class="n">${i+1}</span><span class="t"></span></button>`).join('');
  markNext();fitBlocks();
}
function markNext(){
  [...el.blocks.children].forEach((b,i)=>{const nx=i===round.revealed;b.classList.toggle('next',nx);b.disabled=!nx});
}
function fitBlocks(){
  if(!round)return;
  [...el.blocks.children].forEach((b,i)=>{const t=b.querySelector('.t');if(!round.words[i].revealed)return;
    let fs=Math.min(26,Math.max(13,b.clientHeight*.46));t.style.fontSize=fs+'px';
    while(fs>11&&t.scrollWidth>b.clientWidth-14){fs-=1;t.style.fontSize=fs+'px'}});
}
el.blocks.addEventListener('click',e=>{const b=e.target.closest('.bw-b');if(b&&!b.disabled)reveal(+b.dataset.i)});
function reveal(i){
  if(!round||i!==round.revealed)return;
  const o=round.words[i],b=el.blocks.children[i];
  o.revealed=true;o.pulse=1;round.revealed++;
  b.classList.remove('next');b.classList.add('on');b.style.setProperty('--wc',o.color);b.querySelector('.t').textContent=o.text;b.setAttribute('aria-label','Word '+(i+1)+': '+o.text);
  markNext();fitBlocks();setStatus();
  if(round.revealed===round.words.length){try{const P=window.LWProgress;if(P)P.correct(PID,round.level+':'+round.idx)}catch(_){}}
}
function setStatus(){
  if(!round)return;const n=round.words.length,r=round.revealed;
  el.status.classList.toggle('done',r===n);
  el.status.innerHTML=r===n?'✓ Well done! Now say the whole sentence together.':`Say word <b>${r+1}</b> of ${n} out loud, then tap the glowing block.`;
}
function updatePower(){
  const s=strengthAt(simT);el.pwf.style.transform='scaleX('+s.toFixed(3)+')';el.pwn.textContent=Math.round(s*100)+'%';
}

/* ---------- loop ---------- */
function startLoop(){if(running)return;running=true;lastNow=performance.now();requestAnimationFrame(frame)}
function frame(now){
  if(!running)return;
  const dt=Math.min(.05,Math.max(0,(now-lastNow)/1000));lastNow=now;
  if(glOK&&!document.hidden){
    acc+=dt;let n=0;while(acc>=STEP&&n<6){stepOnce(STEP);acc-=STEP;n++}if(n>=6)acc=0;
    sync(dt);updatePower();renderer.render(scene,cam);
  }
  requestAnimationFrame(frame);
}
new ResizeObserver(()=>{if(R&&curLevel){layout();if(round){buildBlocks();for(const o of round.words)if(o.revealed){const b=el.blocks.children[round.words.indexOf(o)];b.classList.remove('next');b.classList.add('on');b.style.setProperty('--wc',o.color);b.querySelector('.t').textContent=o.text}markNext();fitBlocks()}}}).observe(document.body);
new ResizeObserver(()=>{if(R&&curLevel)layout()}).observe(el.stage);
addEventListener('popstate',()=>{const k=location.hash.slice(1);if(LEVELS.some(l=>l.k===k))startLevel(k,false);else toList(false)});

/* ---------- test hook (fast-forward the simulation, read positions) ---------- */
window.__bw={
  advance(sec){const n=Math.round(sec/STEP);for(let i=0;i<n;i++)stepOnce(STEP);sync(0);updatePower();if(renderer)renderer.render(scene,cam);return simT},
  state(){
    if(!round)return null;
    return {level:round.level,text:round.text,simT,strength:strengthAt(simT),W,H,D,revealed:round.revealed,glOK,
      words:round.words.map(o=>{const p=o.body.position,v=o.body.velocity;return {w:o.text,pos:[p.x,p.y,p.z],speed:v.length(),inside:Math.abs(p.x)<=W/2&&p.y>=0&&p.y<=H&&Math.abs(p.z)<=D/2,sleeping:o.body.sleepState===2,hw:o.hw,hh:o.hh,hz:o.hz,vis:o.grp.visible,up:o.body.quaternion.vmult(new C.Vec3(0,1,0)).y,fz:Math.abs(o.body.quaternion.vmult(new C.Vec3(0,0,1)).z)}})}
  }
};

buildList();
const h0=location.hash.slice(1);
if(LEVELS.some(l=>l.k===h0))startLevel(h0,false);
})();
