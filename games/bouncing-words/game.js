/* Bouncing Words · Little Wonders
   three.js (rendering) + cannon-es (physics), both bundled in vendor/bw-libs.js.
   Fixed-timestep physics (120 Hz) with render interpolation (lerp/slerp of the previous and current pose).
   Energy comes only from elastic wall impacts (no mid-air nudges); power decays 100% → 0% over 60 s.
   The 60-second clock is exact whatever the frame rate, and can be fast-forwarded by window.__bw. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const SENT=window.BW_SENTENCES||{A1:[],A2:[],B1:[]},PID='games/bouncing-words';
const LEVELS=[
 {k:'A1',name:'Starter',sub:'Short and simple · 4–6 words',cls:'L1',size:2.0,demo:['I','like','my','ball.']},
 {k:'A2',name:'Basic',sub:'Longer · 8–11 words',cls:'L2',size:1.7,demo:['We','are','going','to','the','zoo.']},
 {k:'B1',name:'Intermediate',sub:'Varied grammar · 12–16 words',cls:'L3',size:1.42,demo:['If','I','had','wings,','I','would','fly.']}
];
const PALETTE=['#e8504f','#f08a00','#2c9a83','#3f7fe0','#8a5cc8','#d8588d','#3aa655','#e0662f','#1fa1c7','#b9568f'];
const H=10,D=7,TOTAL=60,STEP=1/120,MAXV=28,MAXW=12,G=-18;   // box height, depth (world units), seconds from 100% to 0%, physics step
const strengthAt=t=>t>=TOTAL?0:1-Math.pow(t/TOTAL,2);   // gentle at first (97% after 10 s), 0% at 60 s

const el={list:$('list'),cats:$('cats'),play:$('play'),lv:$('lv'),stage:$('stage'),msg:$('msg'),status:$('status'),blocks:$('blocks'),pwf:$('pwf'),pwn:$('pwn')};
const L=window.BWLibs;
let T,C,R=null,scene,cam,renderer,world,font,matWord,matWall,cmWW,cmWF,boxGroup,wordGroup,keyLight;
let W=24,curLevel=null,round=null,simT=0,acc=0,lastNow=0,running=false,glOK=true,texCache={};
let midAir={samples:0,hits:0,maxU:0,sumU:0},ftMs=[];

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=(T.PCFShadowMap!=null)?T.PCFShadowMap:1;
  renderer.setClearColor(0xefe9fb,1);
  el.stage.insertBefore(renderer.domElement,el.stage.firstChild);
  scene=new T.Scene();
  cam=new T.PerspectiveCamera(26,2,.5,600);
  scene.add(new T.HemisphereLight(0xffffff,0xd8cdf0,2.1));
  keyLight=new T.DirectionalLight(0xfff6e8,2.2);keyLight.castShadow=true;
  keyLight.shadow.mapSize.set(512,512);keyLight.shadow.bias=-.001;keyLight.shadow.normalBias=.04;keyLight.shadow.radius=1;
  scene.add(keyLight,keyLight.target);
  const fill=new T.PointLight(0xffffff,90,60,1.6);fill.position.set(0,H*.7,D/2+6);scene.add(fill);
  boxGroup=new T.Group();wordGroup=new T.Group();scene.add(boxGroup,wordGroup);
  font=new T.Font(window.BW_FONT);
  world=new C.World({gravity:new C.Vec3(0,G,0)});
  world.allowSleep=true;world.solver.iterations=8;
  matWord=new C.Material('word');matWall=new C.Material('wall');
  cmWW=new C.ContactMaterial(matWord,matWord,{friction:.08,restitution:.9});
  cmWF=new C.ContactMaterial(matWord,matWall,{friction:.06,restitution:.98});
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
  // One solid extruded word (front, sides and a single back). From behind you see it mirrored, like a real object.
  const dep=.26,bt=.028;
  const g=new T.TextGeometry(text,{font,size:1,depth:dep,curveSegments:3,bevelEnabled:true,bevelThickness:bt,bevelSize:.022,bevelSegments:1});
  g.computeBoundingBox();const bb=g.boundingBox;
  g.translate(-(bb.min.x+bb.max.x)/2,-(bb.min.y+bb.max.y)/2,-(bb.min.z+bb.max.z)/2);
  const mat=new T.MeshStandardMaterial({color,roughness:.36,metalness:.04});
  const mesh=new T.Mesh(g,mat);mesh.castShadow=true;
  return {text,color,idx,g,mat,grp:mesh,w1:bb.max.x-bb.min.x,h1:bb.max.y-bb.min.y,z1:bb.max.z-bb.min.z,revealed:false,pulse:0};
}
function clearRound(){
  endShowcase(true);
  if(!round)return;
  round.words.forEach(o=>{if(o._onCollide)o.body.removeEventListener('collide',o._onCollide);world.removeBody(o.body);wordGroup.remove(o.grp);o.g.dispose();o.mat.dispose()});
  round=null;
}
function rnd(a,b){return a+Math.random()*(b-a)}
function spawn(words,lv){
  // size: level default, shrunk if the sentence has a lot of long words
  const area=words.reduce((s,o)=>s+o.w1*o.h1,0),maxw=Math.max(...words.map(o=>o.w1));
  let k=Math.min(lv.size,Math.sqrt(.20*W*H*2/area),W*.31/maxw);
  const placed=[];
  words.forEach((o,i)=>{
    o.k=k;o.g.scale(k,k,k);
    o.hw=o.w1*k/2+.05;o.hh=o.h1*k/2+.05;o.hz=o.z1*k+.02;
    o.grp.visible=false;
    o.shape=new C.Box(new C.Vec3(o.hw,o.hh,o.hz));
    const body=new C.Body({mass:Math.max(.5,o.w1*o.h1*k*k*.4),material:matWord,shape:o.shape,allowSleep:true,sleepSpeedLimit:.35,sleepTimeLimit:.8});
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
    // One lively toss at the start; after that, only wall impacts add energy.
    body.velocity.set(rnd(-10,10),rnd(-2,8),rnd(-5,5));
    body.angularVelocity.set(rnd(-5,5),rnd(-5,5),rnd(-5,5));
    body.linearDamping=0;body.angularDamping=.012;
    o.hit=false;o.hitWall=false;o.hitN=null;o.preV=body.velocity.clone();
    o.prevP=body.position.clone();o.prevQ=body.quaternion.clone();
    o._onCollide=e=>onWordCollide(o,e);
    body.addEventListener('collide',o._onCollide);
    world.addBody(body);o.body=body;o.born=rnd(0,.3);o.k=k;
    wordGroup.add(o.grp);
  });
}
function onWordCollide(o,e){
  if(o.body.type===C.Body.KINEMATIC)return;
  const c=e.contact,n=c.ni,other=e.body;
  // ni points from bi to bj; we want the normal pointing away from the other body (bounce direction)
  const flip=(c.bi===o.body);
  const nx=flip?-n.x:n.x,ny=flip?-n.y:n.y,nz=flip?-n.z:n.z;
  if(!o.hit){o.hitN=[nx,ny,nz];o.hitWall=other.mass===0}
  else if(other.mass===0){o.hitN=[nx,ny,nz];o.hitWall=true}
  o.hit=true;
}
function stepOnce(h){
  simT+=h;
  const s=strengthAt(simT),calm=1-s;
  // High restitution while there is power, so wall hits keep them bouncing; low at the end so they settle.
  cmWW.restitution=.12+.80*s;cmWF.restitution=.16+.84*s;
  if(!round)return;
  // Almost no air drag while lively, so mid-air paths are clean ballistic arcs. Damping rises only as power dies.
  const ld=.002+.28*calm*calm*calm,ad=.01+.4*calm*calm*calm;
  for(const o of round.words){
    const b=o.body;
    if(!o.prevP){o.prevP=b.position.clone();o.prevQ=b.quaternion.clone();o.preV=b.velocity.clone()}
    else {o.prevP.copy(b.position);o.prevQ.copy(b.quaternion);o.preV.copy(b.velocity)}
    o.hit=false;o.hitWall=false;o.clamped=false;
    if(b.type===C.Body.KINEMATIC)continue;
    b.linearDamping=ld;b.angularDamping=ad;
    b.allowSleep=s<.12;
  }
  world.step(h);
  // Catch lingering contacts too (the collide event only fires on first contact).
  for(const c of world.contacts){
    const ni=c.ni;
    for(const o of round.words){
      if(o.body===c.bi){o.hit=true;if(c.bj.mass===0){o.hitWall=true;o.hitN=[-ni.x,-ni.y,-ni.z]}else if(!o.hitN)o.hitN=[-ni.x,-ni.y,-ni.z]}
      else if(o.body===c.bj){o.hit=true;if(c.bi.mass===0){o.hitWall=true;o.hitN=[ni.x,ni.y,ni.z]}else if(!o.hitN)o.hitN=[ni.x,ni.y,ni.z]}
    }
  }
  for(const o of round.words){
    if(o.body.type===C.Body.KINEMATIC)continue;
    const b=o.body,v=b.velocity;
    // Impact-only energy: if this was a real wall hit (approaching with speed), top up the bounce to match the current power.
    if(o.hit&&o.hitWall&&o.hitN){
      const [nx,ny,nz]=o.hitN,pre=o.preV;
      const preIn=-(pre.x*nx+pre.y*ny+pre.z*nz);
      if(preIn>1.2){
        const vn=v.x*nx+v.y*ny+v.z*nz,want=Math.max(preIn*(.2+.85*s),6.5*s);
        if(want>vn){const d=want-vn;v.x+=d*nx;v.y+=d*ny;v.z+=d*nz}
      }
    }
    const sp=v.length();if(sp>MAXV)v.scale(MAXV/sp,v);
    const av=b.angularVelocity,aw=av.length();if(aw>MAXW)av.scale(MAXW/aw,av);
    // Mid-air check (no contact): velocity should change only by gravity (and tiny damping).
    if(!o.hit){
      const p=o.preV,ux=v.x-p.x,uy=v.y-(p.y+G*h),uz=v.z-p.z,err=Math.hypot(ux,uy,uz);
      midAir.samples++;midAir.sumU+=err;if(err>midAir.maxU)midAir.maxU=err;
    }else midAir.hits++;
  }
  // Safety net: if a word tunnels out, bounce it back in (counts as a wall hit, not a mid-air push).
  const hx=W/2,hz=D/2,rest=.16+.84*s;
  for(const o of round.words){
    if(o.body.type===C.Body.KINEMATIC)continue;
    const p=o.body.position,v=o.body.velocity;let c=false;
    if(p.x>hx-o.hw){p.x=hx-o.hw;if(v.x>0)v.x=-v.x*rest;c=true}
    else if(p.x<-hx+o.hw){p.x=-hx+o.hw;if(v.x<0)v.x=-v.x*rest;c=true}
    if(p.y>H-o.hh){p.y=H-o.hh;if(v.y>0)v.y=-v.y*rest;c=true}
    else if(p.y<o.hh){p.y=o.hh;if(v.y<0)v.y=-v.y*rest;c=true}
    if(p.z>hz-o.hz){p.z=hz-o.hz;if(v.z>0)v.z=-v.z*rest;c=true}
    else if(p.z<-hz+o.hz){p.z=-hz+o.hz;if(v.z<0)v.z=-v.z*rest;c=true}
    if(c){o.clamped=true;o.prevP.copy(p)}
  }
}
const _iq=()=>({x:0,y:0,z:0,w:1});
let _sq=_iq();
function sync(dt,alpha){
  if(!round)return;
  if(alpha==null)alpha=1;
  for(const o of round.words){
    const b=o.body,g=o.grp;
    if(show&&show.o===o){
      g.position.set(b.position.x,b.position.y,b.position.z);g.quaternion.set(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w);
    }else if(o.prevP&&alpha<1){
      const a=alpha,p=o.prevP,q=b.quaternion;
      g.position.set(p.x+(b.position.x-p.x)*a,p.y+(b.position.y-p.y)*a,p.z+(b.position.z-p.z)*a);
      slerpQ(o.prevQ,q,a,_sq);g.quaternion.set(_sq.x,_sq.y,_sq.z,_sq.w);
    }else{
      g.position.set(b.position.x,b.position.y,b.position.z);g.quaternion.set(b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w);
    }
    const ap=Math.min(1,Math.max(0,(simT-o.born)/.28));let sc=ap<1?ap*(2-ap):1;
    if(o.pulse>0){o.pulse=Math.max(0,o.pulse-dt/1.6);const p=Math.sin((1-o.pulse)*Math.PI);o.mat.emissive.set(o.color);o.mat.emissiveIntensity=p*.85;sc*=1+.22*p}
    else if(o.mat.emissiveIntensity){o.mat.emissiveIntensity=0}
    if(show&&show.o===o){
      const k=show.phase==='in'?ease(Math.min(1,show.t/show.tin)):show.phase==='hold'?1:1-ease(Math.min(1,show.t/show.tout));
      sc*=1+.4*k;
      if(!o.pulse){o.mat.emissive.set(o.color);o.mat.emissiveIntensity=.22*k}
    }
    g.scale.setScalar(sc);g.visible=sc>.01;
  }
}


/* ---------- click a word: glide it to the centre, hold ~1 s, then release ---------- */
let show=null;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function slerpQ(q1,q2,t,out){
  let dot=q1.x*q2.x+q1.y*q2.y+q1.z*q2.z+q1.w*q2.w,x2=q2.x,y2=q2.y,z2=q2.z,w2=q2.w;
  if(dot<0){x2=-x2;y2=-y2;z2=-z2;w2=-w2;dot=-dot}
  let x,y,z,w;
  if(dot>.9995){x=q1.x+(x2-q1.x)*t;y=q1.y+(y2-q1.y)*t;z=q1.z+(z2-q1.z)*t;w=q1.w+(w2-q1.w)*t;const n=Math.hypot(x,y,z,w)||1;x/=n;y/=n;z/=n;w/=n}
  else{const th=Math.acos(Math.min(1,dot)),st=Math.sin(th),s1=Math.sin((1-t)*th)/st,s2=Math.sin(t*th)/st;x=q1.x*s1+x2*s2;y=q1.y*s1+y2*s2;z=q1.z*s1+z2*s2;w=q1.w*s1+w2*s2}
  if(out.set)out.set(x,y,z,w);else{out.x=x;out.y=y;out.z=z;out.w=w}
  return out;
}
function faceCamQ(){const q=new C.Quaternion();q.setFromEuler(0,Math.atan2(cam.position.x,cam.position.z),0);return q}
function showcasePos(o){
  // Screen centre, well in front of the box, sized so the word is easy to read.
  const fov=cam.fov*Math.PI/180, half=Math.max(o.hh,o.hw*.28);
  const dist=Math.max(4, half/Math.tan(fov/2)/.24);
  const dir=new T.Vector3();cam.getWorldDirection(dir);
  const p=cam.position.clone().add(dir.multiplyScalar(dist));
  if(p.z<D/2+o.hz+1.2)p.z=D/2+o.hz+1.2;
  return new C.Vec3(p.x,p.y,p.z);
}
function applyShowPose(p,q){const b=show.o.body;b.position.set(p.x,p.y,p.z);b.quaternion.set(q.x,q.y,q.z,q.w)}
function beginShowcase(o){
  if(!o||(show&&show.o===o&&show.phase!=='out'))return;
  if(show)endShowcase(true);
  const b=o.body,gp=o.grp;
  const fromP=new C.Vec3(gp.position.x,gp.position.y,gp.position.z),fromQ=new C.Quaternion(gp.quaternion.x,gp.quaternion.y,gp.quaternion.z,gp.quaternion.w);
  show={o,phase:'in',t:0,tin:.45,hold:1,tout:.45,
    fromP,fromQ,toP:showcasePos(o),toQ:faceCamQ(),
    backP:fromP.clone(),backQ:fromQ.clone(),mass:b.mass};
  b.collisionResponse=false;b.type=C.Body.KINEMATIC;b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);o.grp.renderOrder=20;
}
function endShowcase(snap){
  if(!show)return;
  const b=show.o.body,s=strengthAt(simT);
  if(snap){const p=show.backP;b.position.set(p.x,p.y,p.z);b.quaternion.copy(show.backQ)}
  b.collisionResponse=true;b.type=C.Body.DYNAMIC;
  if(b.mass!==show.mass){b.mass=show.mass;b.updateMassProperties()}
  b.velocity.set(rnd(-8,8)*s,(s>.04?s*rnd(5,12):0),rnd(-4,4)*s);
  b.angularVelocity.set(rnd(-5,5)*s,rnd(-5,5)*s,rnd(-5,5)*s);
  if(show.o.prevP){show.o.prevP.copy(b.position);show.o.prevQ.copy(b.quaternion)}
  b.wakeUp();show.o.grp.renderOrder=0;show=null;
}
function tickShowcase(dt){
  if(!show)return;
  const S=show;S.t+=dt;
  if(S.phase==='in'){
    const u=ease(Math.min(1,S.t/S.tin)),q=new C.Quaternion();
    slerpQ(S.fromQ,S.toQ,u,q);
    applyShowPose(new C.Vec3(S.fromP.x+(S.toP.x-S.fromP.x)*u,S.fromP.y+(S.toP.y-S.fromP.y)*u,S.fromP.z+(S.toP.z-S.fromP.z)*u),q);
    if(S.t>=S.tin){S.phase='hold';S.t=0;applyShowPose(S.toP,S.toQ)}
  }else if(S.phase==='hold'){
    applyShowPose(S.toP,S.toQ);
    if(S.t>=S.hold){S.phase='out';S.t=0}
  }else{
    const u=ease(Math.min(1,S.t/S.tout)),q=new C.Quaternion();
    slerpQ(S.toQ,S.backQ,u,q);
    applyShowPose(new C.Vec3(S.toP.x+(S.backP.x-S.toP.x)*u,S.toP.y+(S.backP.y-S.toP.y)*u,S.toP.z+(S.backP.z-S.toP.z)*u),q);
    if(S.t>=S.tout)endShowcase(false);
  }
}
function eventRay(ev){
  const r=renderer.domElement.getBoundingClientRect();
  const nx=((ev.clientX-r.left)/r.width)*2-1,ny=-((ev.clientY-r.top)/r.height)*2+1;
  const a=new T.Vector3(nx,ny,-1).unproject(cam),b=new T.Vector3(nx,ny,1).unproject(cam);b.sub(a);
  return {o:a,d:b};
}
function rayHit(o,origin,dir){
  const q=o.body.quaternion,qi=new C.Quaternion(-q.x,-q.y,-q.z,q.w),p=o.body.position;
  const lo=qi.vmult(new C.Vec3(origin.x-p.x,origin.y-p.y,origin.z-p.z));
  const ld=qi.vmult(new C.Vec3(dir.x,dir.y,dir.z));
  let tmin=0,tmax=1;
  const L=[lo.x,lo.y,lo.z],D=[ld.x,ld.y,ld.z],B=[[-o.hw,o.hw],[-o.hh,o.hh],[-o.hz,o.hz]];
  for(let i=0;i<3;i++){
    if(Math.abs(D[i])<1e-9){if(L[i]<B[i][0]||L[i]>B[i][1])return null;continue}
    let t1=(B[i][0]-L[i])/D[i],t2=(B[i][1]-L[i])/D[i];if(t1>t2){const k=t1;t1=t2;t2=k}
    tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2);if(tmin>tmax)return null;
  }
  return tmin;
}
function pickWord(ev){
  if(!round||!R)return null;const ray=eventRay(ev);let best=null,bt=1;
  for(const o of round.words){const t=rayHit(o,ray.o,ray.d);if(t!=null&&t<bt){bt=t;best=o}}
  return best;
}
el.stage.addEventListener('click',e=>{if(!R||!round)return;const o=pickWord(e);if(o)beginShowcase(o)});
el.stage.addEventListener('pointermove',e=>{if(!R||!round)return;el.stage.style.cursor=pickWord(e)?'pointer':''});

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
  document.body.classList.remove('playing');running=false;curLevel=null;endShowcase(true);clearRound();document.title='Bouncing Words · Little Wonders';
  if(push!==false)history.pushState(null,'',location.pathname+location.search);
}
function newSentence(){
  if(!R||!curLevel)return;
  const lv=LEVELS.find(l=>l.k===curLevel),pick=pickSentence(curLevel);
  clearRound();
  const pal=PALETTE.slice();for(let i=pal.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pal[i],pal[j]]=[pal[j],pal[i]]}
  const words=pick.text.split(/\s+/).map((w,i)=>makeWord(w,pal[i%pal.length],i));
  simT=0;acc=0;
  endShowcase(true);
  round={level:curLevel,idx:pick.i,text:pick.text,words,revealed:0};
  spawn(words,lv);
  buildBlocks();updatePower();setStatus();
  sync(0);
}
function shake(){
  if(!round)return;endShowcase(true);simT=0;acc=0;
  round.words.forEach(o=>{o.born=-1;o.body.velocity.set(rnd(-10,10),rnd(6,14),rnd(-5,5));o.body.angularVelocity.set(rnd(-6,6),rnd(-6,6),rnd(-6,6));o.body.wakeUp();if(o.prevP){o.prevP.copy(o.body.position);o.prevQ.copy(o.body.quaternion)}});
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
  const raw=Math.max(0,(now-lastNow)/1000);lastNow=now;
  ftMs.push(raw*1000);if(ftMs.length>240)ftMs.shift();
  const dt=Math.min(.05,raw);
  if(glOK&&!document.hidden){
    acc+=dt;let n=0;while(acc>=STEP&&n<8){stepOnce(STEP);acc-=STEP;n++}if(n>=8)acc=acc%STEP;
    const alpha=Math.min(1,acc/STEP);
    tickShowcase(dt);sync(dt,alpha);updatePower();renderer.render(scene,cam);
  }
  requestAnimationFrame(frame);
}
new ResizeObserver(()=>{if(R&&curLevel){layout();if(round){buildBlocks();for(const o of round.words)if(o.revealed){const b=el.blocks.children[round.words.indexOf(o)];b.classList.remove('next');b.classList.add('on');b.style.setProperty('--wc',o.color);b.querySelector('.t').textContent=o.text}markNext();fitBlocks()}}}).observe(document.body);
new ResizeObserver(()=>{if(R&&curLevel)layout()}).observe(el.stage);
addEventListener('popstate',()=>{const k=location.hash.slice(1);if(LEVELS.some(l=>l.k===k))startLevel(k,false);else toList(false)});

/* ---------- test hook (fast-forward the simulation, read positions) ---------- */
window.__bw={
  advance(sec){const n=Math.round(sec/STEP);for(let i=0;i<n;i++)stepOnce(STEP);if(round)round.words.forEach(o=>{if(o.prevP){o.prevP.copy(o.body.position);o.prevQ.copy(o.body.quaternion)}});sync(0,1);updatePower();if(renderer)renderer.render(scene,cam);return simT},
  resetMidAir(){midAir={samples:0,hits:0,maxU:0,sumU:0};return midAir},
  midAir(){const m=midAir;return {samples:m.samples,hits:m.hits,maxUnexpected:m.maxU,meanUnexpected:m.samples?m.sumU/m.samples:0}},
  frameStats(){const a=ftMs.slice();if(!a.length)return {n:0};const s=[...a].sort((x,y)=>x-y),n=s.length,sum=s.reduce((p,c)=>p+c,0);return {n,avg:sum/n,min:s[0],med:s[n>>1],p95:s[Math.min(n-1,Math.floor(n*.95))],max:s[n-1]}},
  resetFrameStats(){ftMs=[];return true},
  clickWord(i){if(round&&round.words[i])beginShowcase(round.words[i])},
  advanceShowcase(sec){tickShowcase(sec);sync(0);if(renderer)renderer.render(scene,cam);return show&&{phase:show.phase,t:show.t,text:show.o.text}},
  // Place a word in mid-box, back towards the camera, so a test can photograph the mirrored side.
  poseBack(i){
    if(!round)return null;const o=round.words[i],b=o.body;
    // Park the other words so this one is clearly seen from behind, then freeze it.
    round.words.forEach((w,j)=>{if(j===i)return;w.body.position.set((j%2?1:-1)*(W/2-w.hw-0.4),w.hh+0.05,(j%3-1)*1.6);w.body.velocity.set(0,0,0);w.body.angularVelocity.set(0,0,0)});
    b.position.set(0,H*.48,1.3);b.quaternion.setFromEuler(0,Math.PI,0);b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);
    b.type=C.Body.KINEMATIC;
    sync(0);if(renderer)renderer.render(scene,cam);
    return o.text;
  },
  project(i){
    if(!round||!renderer)return null;const p=round.words[i].body.position,v=new T.Vector3(p.x,p.y,p.z).project(cam),r=renderer.domElement.getBoundingClientRect();
    return {x:r.left+(v.x+1)/2*r.width,y:r.top+(-v.y+1)/2*r.height,behind:v.z>1,on:Math.abs(v.x)<.95&&Math.abs(v.y)<.95,word:round.words[i].text};
  },
  state(){
    if(!round)return null;
    return {level:round.level,text:round.text,simT,strength:strengthAt(simT),W,H,D,revealed:round.revealed,glOK,
      show:show&&{i:show.o.idx,phase:show.phase,t:show.t,text:show.o.text,pos:[show.o.body.position.x,show.o.body.position.y,show.o.body.position.z]},
      words:round.words.map(o=>{const p=o.body.position,v=o.body.velocity,fz=o.body.quaternion.vmult(new C.Vec3(0,0,1)).z;
        return {w:o.text,pos:[p.x,p.y,p.z],speed:v.length(),inside:Math.abs(p.x)<=W/2&&p.y>=0&&p.y<=H&&Math.abs(p.z)<=D/2,sleeping:o.body.sleepState===2,hw:o.hw,hh:o.hh,hz:o.hz,k:o.k,vis:o.grp.visible,up:o.body.quaternion.vmult(new C.Vec3(0,1,0)).y,fz,back:fz<0,hit:!!o.hit}})}
  }
};

buildList();
const h0=location.hash.slice(1);
if(LEVELS.some(l=>l.k===h0))startLevel(h0,false);
})();
