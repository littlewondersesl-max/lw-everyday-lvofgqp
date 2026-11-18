import * as THREE from 'three';
import {OrbitControls} from 'three/addons/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/RoundedBoxGeometry.js';
import * as TX from './textures.js';
import {buildFraction,buildShape,build2D,SHAPES,buildBlock,buildBall,BLOCK,BALL_R} from './builders.js';

const $=id=>document.getElementById(id);
const stage=$('stage');
const V3=THREE.Vector3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gcd=(a,b)=>b?gcd(b,a%b):a;

/* ---------------- language (same EN / EN+中文 option as the rest of the app) ---------------- */
let BI=LWLang.zh; // shared app-wide setting (js/lang.js)
function syncLang(){document.body.classList.toggle('bi',BI)}
LWLang.on(z=>{BI=z;syncLang();refreshLabels();updateInfo()});
syncLang();

/* ---------------- renderer / scene ---------------- */
const coarse=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<620;
let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
}catch(err){$('nogl').style.display='flex';throw err}
renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?1.75:2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D table. Drag objects to move them, drag the table to turn the view.');
stage.insertBefore(canvas,stage.firstChild);

const scene=new THREE.Scene();
const BG=0xf1eaf7;
scene.background=new THREE.Color(BG);scene.fog=new THREE.Fog(BG,26,70);
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;

const camera=new THREE.PerspectiveCamera(36,1,.1,120);
const key=new THREE.DirectionalLight(0xfff2e0,2.2);
key.position.set(-5,11,6);key.castShadow=true;
const SM=coarse?1024:2048;key.shadow.mapSize.set(SM,SM);
Object.assign(key.shadow.camera,{left:-8,right:8,top:6.5,bottom:-6.5,near:2,far:30});
key.shadow.bias=-.0003;key.shadow.normalBias=.035;
scene.add(key);
const fill=new THREE.DirectionalLight(0xdfe8ff,.7);fill.position.set(6,5,-4);scene.add(fill);
scene.add(new THREE.HemisphereLight(0xfff6ee,0xc9bde6,.55));

/* table (top surface is y = 0) */
const TW=10.6,TD=6.8,FLOOR=-3.6;
const table=new THREE.Group();scene.add(table);
{
  const wood=TX.woodTex();wood.repeat.set(1,1);
  const topMat=new THREE.MeshStandardMaterial({map:wood,roughness:.55,metalness:0});
  const top=new THREE.Mesh(new RoundedBoxGeometry(TW,.5,TD,4,.14),topMat);top.position.y=-.25;top.receiveShadow=true;top.castShadow=true;table.add(top);
  const legMat=new THREE.MeshStandardMaterial({color:0xb67a45,roughness:.6});
  for(const sx of[-1,1])for(const sz of[-1,1]){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.26,.2,3.1,20),legMat);leg.position.set(sx*(TW/2-.55),-.5-1.55,sz*(TD/2-.55));leg.castShadow=true;leg.receiveShadow=true;table.add(leg);
  }
  const apronMat=new THREE.MeshStandardMaterial({color:0xa9703d,roughness:.7});
  for(const sz of[-1,1]){const a=new THREE.Mesh(new THREE.BoxGeometry(TW-1.4,.4,.14),apronMat);a.position.set(0,-.7,sz*(TD/2-.55));a.castShadow=true;table.add(a)}
  for(const sx of[-1,1]){const a=new THREE.Mesh(new THREE.BoxGeometry(.14,.4,TD-1.4),apronMat);a.position.set(sx*(TW/2-.55),-.7,0);a.castShadow=true;table.add(a)}
  const floor=new THREE.Mesh(new THREE.CircleGeometry(60,64),new THREE.MeshStandardMaterial({color:0xd5c8e7,roughness:1,envMapIntensity:.25}));
  floor.rotation.x=-Math.PI/2;floor.position.y=FLOOR;floor.receiveShadow=true;scene.add(floor);
}
const BX=TW/2-.25,BZ=TD/2-.25;  // usable half-extents for object centres
const clampXZ=(v,r=0)=>{v.x=clamp(v.x,-BX+r,BX-r);v.z=clamp(v.z,-BZ+r,BZ-r);return v};

/* turntable */
const TT={c:new V3(3.15,0,.15),R:1.6,h:.24,dir:0,omega:1.15,angle:0};
const ttGroup=new THREE.Group();ttGroup.position.copy(TT.c);scene.add(ttGroup);
let ttDisc;
{
  const base=new THREE.Mesh(new THREE.CylinderGeometry(TT.R+.12,TT.R+.2,.1,48),new THREE.MeshStandardMaterial({color:0x6c4ea0,roughness:.45}));base.position.y=.05;base.castShadow=base.receiveShadow=true;ttGroup.add(base);
  ttDisc=new THREE.Group();ttDisc.position.y=.1;ttGroup.add(ttDisc);
  const topTex=TX.turntableTopTex();
  const side=new THREE.MeshStandardMaterial({color:0xcfc3e6,roughness:.5});
  const topM=new THREE.MeshStandardMaterial({map:topTex,roughness:.5});
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(TT.R,TT.R,TT.h-.1,64),[side,topM,side]);disc.position.y=(TT.h-.1)/2;disc.castShadow=disc.receiveShadow=true;ttDisc.add(disc);
}
// curved arrow around the turntable (mirrored for clockwise)
const arrow=new THREE.Group();
{
  const R=TT.R+.55,arc=4.3,t0=.35,t1=t0+arc;
  const m=new THREE.MeshStandardMaterial({color:0xff7aa8,roughness:.4,side:THREE.DoubleSide,emissive:0xff4f8f,emissiveIntensity:.25});
  const tor=new THREE.Mesh(new THREE.TorusGeometry(R,.07,8,72,arc),m);tor.rotation.x=-Math.PI/2;tor.rotation.z=0;
  // torus arc starts at angle 0; rotate about its own axis by t0
  const holder=new THREE.Group();holder.add(tor);tor.rotation.set(0,0,0);
  const tg=new THREE.TorusGeometry(R,.07,8,72,arc);tg.rotateZ(t0);tg.rotateX(-Math.PI/2);
  const tmesh=new THREE.Mesh(tg,m);arrow.add(tmesh);
  const head=new THREE.Mesh(new THREE.ConeGeometry(.24,.5,16),m);
  const ex=R*Math.cos(t1),ez=-R*Math.sin(t1);
  head.position.set(ex,0,ez);
  const tan=new V3(-Math.sin(t1),0,-Math.cos(t1)).normalize();
  head.quaternion.setFromUnitVectors(new V3(0,1,0),tan);
  arrow.add(head);
  arrow.position.y=.12;arrow.visible=false;
  ttGroup.add(arrow);
  arrow.userData.noPick=true;
}
ttGroup.visible=false;

/* camera + controls */
const HOME={dir:new V3(0,.86,.62).normalize(),dist:10.8,target:new V3(0,-.2,.3)};
function homeDist(){const a=camera.aspect;return Math.min(25,Math.max(HOME.dist,14.8/a))}
function homePose(){return {pos:HOME.target.clone().addScaledVector(HOME.dir,homeDist()),target:HOME.target.clone()}}
const controls=new OrbitControls(camera,canvas);   // NOTE: my own pointerdown handler (below) is registered first
controls.enableDamping=true;controls.dampingFactor=.09;
controls.minDistance=3.2;controls.maxDistance=26;
controls.minPolarAngle=.18;controls.maxPolarAngle=1.36;     // never below the table top
controls.screenSpacePanning=false;controls.zoomSpeed=.9;controls.rotateSpeed=.8;controls.panSpeed=.9;
controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
let camTween=null;
function resetView(){const h=homePose();camTween={t:0,p0:camera.position.clone(),t0:controls.target.clone(),p1:h.pos,t1:h.target}}
function zoom(f){const off=camera.position.clone().sub(controls.target);const d=clamp(off.length()*f,controls.minDistance,controls.maxDistance);off.setLength(d);camera.position.copy(controls.target).add(off)}
let hintT=0;function showHint(){const h=$('hint');h.classList.add('show');clearTimeout(hintT);hintT=setTimeout(()=>h.classList.remove('show'),7000)}
$('help').onclick=showHint;if(coarse)setTimeout(showHint,600);
$('zin').onclick=()=>zoom(.78);$('zout').onclick=()=>zoom(1.28);$('rview').onclick=resetView;

function resize(){
  const r=stage.getBoundingClientRect();const w=Math.max(200,r.width|0),h=Math.max(160,r.height|0);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
new ResizeObserver(()=>{const first=!resize.done;resize();if(first){resize.done=1;const h=homePose();camera.position.copy(h.pos);controls.target.copy(h.target);controls.update()}}).observe(stage);

/* ---------------- floating word labels (sprites) ---------------- */
const labels=new Map();
function mkLabel(k,en,zh,at,opt={}){
  let L=labels.get(k);
  if(L&&L.en===en&&L.zh===zh&&L.bi===BI&&L.color===opt.color){L.at=at;return L}
  if(L){scene.remove(L.sprite);L.sprite.material.map.dispose();L.sprite.material.dispose()}
  const c=TX.labelCanvas(BI&&zh?[en,zh]:[en],{color:opt.color,small:opt.small});
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true,fog:false}));
  const h=(opt.h||.66);sp.scale.set(h*c.width/c.height,h,1);sp.renderOrder=30;sp.raycast=()=>{};
  scene.add(sp);
  L={sprite:sp,en,zh,bi:BI,at,color:opt.color,born:performance.now()};labels.set(k,L);return L;
}
function dropLabel(k){const L=labels.get(k);if(!L)return;scene.remove(L.sprite);L.sprite.material.map.dispose();L.sprite.material.dispose();labels.delete(k)}
function clearLabels(){[...labels.keys()].forEach(dropLabel)}
function refreshLabels(){/* labels re-create themselves next frame because L.bi differs */}
const tmpV=new V3();
function updateLabels(t){
  for(const [k,L] of labels){const p=L.at();if(!p){dropLabel(k);continue}
    const age=Math.min(1,(performance.now()-L.born)/220),pop=1-Math.pow(1-age,3);
    L.sprite.position.set(p.x,p.y+(L.noBob?0:Math.sin(t*2.2+k.length)*.05),p.z);
    L.sprite.material.opacity=pop;
  }
}

/* ---------------- items ---------------- */
const KINDS={
  apple:{type:'frac',en:'Apple',zh:'苹果'},orange:{type:'frac',en:'Orange',zh:'橙子'},pizza:{type:'frac',en:'Pizza',zh:'披萨'},cake:{type:'frac',en:'Cake',zh:'蛋糕'},
  chocolate:{type:'frac',en:'Chocolate',zh:'巧克力'},disc:{type:'frac',en:'Circle',zh:'圆形'},square:{type:'frac',en:'Square',zh:'正方形'},rectangle:{type:'frac',en:'Rectangle',zh:'长方形'},
  cube:{type:'shape',en:'Cube',zh:'立方体'},cuboid:{type:'shape',en:'Cuboid',zh:'长方体'},sphere:{type:'shape',en:'Sphere',zh:'球体'},cylinder:{type:'shape',en:'Cylinder',zh:'圆柱体'},cone:{type:'shape',en:'Cone',zh:'圆锥体'},pyramid:{type:'shape',en:'Pyramid',zh:'棱锥'},triprism:{type:'shape',en:'Triangular prism',zh:'三棱柱'},
  block0:{type:'block',color:0xe94b4b,en:'Red block',zh:'红积木'},block1:{type:'block',color:0x3f8ef0,en:'Blue block',zh:'蓝积木'},block2:{type:'block',color:0xf5c32c,en:'Yellow block',zh:'黄积木'},block3:{type:'block',color:0x3fb87a,en:'Green block',zh:'绿积木'},block4:{type:'block',color:0x9a6be0,en:'Purple block',zh:'紫积木'},
  ball0:{type:'ball',c:[0xe94b4b,0xffffff],en:'Red ball',zh:'红球'},ball1:{type:'ball',c:[0x3f8ef0,0xffffff],en:'Blue ball',zh:'蓝球'},ball2:{type:'ball',c:[0xf5c32c,0xe9568b],en:'Yellow ball',zh:'黄球'},
};
const TRAYS={
  fractions:['apple','orange','pizza','cake','chocolate','disc','square','rectangle'],
  shapes:['cube','cuboid','sphere','cylinder','cone','pyramid','triprism'],
  stack:['block0','block1','block2','block3','block4'],
  rotate:['block0','apple','cake','pyramid','cone','cuboid'],
  roll:['ball0','ball1','ball2'],
};
const FW={2:['half','halves','二分之一'],3:['third','thirds','三分之一'],4:['quarter','quarters','四分之一'],5:['fifth','fifths','五分之一'],6:['sixth','sixths','六分之一'],8:['eighth','eighths','八分之一'],10:['tenth','tenths','十分之一']};
const NUM=['zero','one','two','three','four','five','six','seven','eight','nine','ten'],ZNUM=['零','一','二','三','四','五','六','七','八','九','十'];
const fracEn=(k,n)=>k===1?`one ${FW[n][0]}`:`${NUM[k]} ${FW[n][1]}`;
const fracZh=(k,n)=>`${ZNUM[n]}分之${ZNUM[k]}`;

let mode='fractions',active=null,uid=1,show2D=false;
const items=[];
const mats=o=>{const a=[];o.traverse(m=>{if(m.isMesh)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>a.push(x))});return a};
function disposeObj(o){o.traverse(m=>{if(m.isMesh||m.isLineSegments){m.geometry&&m.geometry.dispose();(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x&&x.dispose&&x.dispose())}})}
function tagPick(item,root,idx){root.traverse(o=>{if(o.isMesh){o.userData.item=item;if(idx!==undefined)o.userData.pieceIndex=idx}else if(o.isLineSegments){o.raycast=()=>{}}})}

function setupFrac(item,n){
  if(item.pcs)for(const pc of item.pcs){item.group.remove(pc.group);disposeObj(pc.group)}
  const b=buildFraction(item.kind,n);
  item.n=n;
  item.pcs=b.pieces.map((p,i)=>{
    const pc={...p,pos:new V3(),target:new V3(),lift:0,liftT:0,sel:false,mats:mats(p.group)};
    if(n>1){
      if(p.boxCenter)pc.target.set(p.boxCenter.x*.34,0,p.boxCenter.z*.34);
      else pc.target.copy(p.dir).multiplyScalar(.2*b.radius+.12);
    }
    item.group.add(p.group);tagPick(item,p.group,i);return pc;
  });
  item.baseRadius=b.radius;item.height=b.height;
  item.radius=b.radius+(n>1?.24*b.radius+.2:0);
}
function spawn(kind,x,z,opts={}){
  const K=KINDS[kind],item={id:uid++,kind,type:K.type,mode:opts.mode||mode,group:new THREE.Group(),p:new V3(x,0,z),lift:opts.noDrop?0:1.6,liftT:0,onTT:false,n:1,v:new V3(),vy:0,spin:0};
  item.group.userData.item=item;
  if(K.type==='frac'){setupFrac(item,1)}
  else if(K.type==='shape'){const s=buildShape(kind);item.shape=s;item.group.add(s.group);item.radius=s.radius;item.height=s.height;tagPick(item,s.group);
    const sh=SHAPES[kind];item.comp=build2D(sh.two.k,new THREE.Color(sh.color).lerp(new THREE.Color(0xffffff),.35).getHex());item.comp.group.visible=false;item.group.add(item.comp.group);tagPick(item,item.comp.group);}
  else if(K.type==='block'){const b=buildBlock(K.color);item.group.add(b.group);item.radius=BLOCK*.75;item.height=BLOCK;tagPick(item,b.group)}
  else if(K.type==='ball'){const b=buildBall(...K.c);item.ball=b;item.group.add(b.group);item.radius=BALL_R;item.height=BALL_R*2;tagPick(item,b.group);item.bounce=false;item.snap=true}
  clampXZ(item.p,item.radius);
  item.group.position.set(item.p.x,item.lift,item.p.z);
  item.group.visible=item.mode===mode;
  scene.add(item.group);items.push(item);
  layoutComp(item);
  if(!opts.keepActive)setActive(item);
  return item;
}
function removeItem(item){scene.remove(item.group);disposeObj(item.group);items.splice(items.indexOf(item),1);if(active===item)active=null}
function layoutComp(item){
  if(!item.comp)return;
  const half=item.shape.half,ch=item.comp.half;
  // beside it: to the right, or the left when near the right edge
  const side=item.p.x+half+ch+.5>BX?-1:1;
  item.comp.group.position.set(side*(half+ch+.45),0,0);item.comp.side=side;
}
const modeItems=()=>items.filter(i=>i.mode===mode);

function setActive(item){
  if(active&&active!==item&&active.pcs)active.pcs.forEach(p=>{p.sel=false;p.liftT=0});
  active=item;highlight();updateInfo();
}
function highlight(){
  for(const it of items){if(!it.pcs)continue;for(const pc of it.pcs){const on=pc.sel;for(const m of pc.mats){if(m.emissive){m.emissive.setHex(on?0xffd45c:0x000000);m.emissiveIntensity=on?.26:0}}pc.liftT=on?.22:0}}
}
// active ring on the table
const ring=new THREE.Mesh(new THREE.RingGeometry(.94,1,64),new THREE.MeshBasicMaterial({color:0xd8588d,transparent:true,opacity:.85,depthWrite:false,fog:false}));
ring.rotation.x=-Math.PI/2;ring.position.y=.012;ring.renderOrder=2;ring.visible=false;scene.add(ring);

/* ---------------- info card ---------------- */
const info=$('info');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ln=(cls,en,zh)=>`<div class="${cls}">${en}</div>${zh?`<div class="${cls} zh">${zh}</div>`:''}`;
function selectedPieces(){return active&&active.pcs?active.pcs.filter(p=>p.sel):[]}
function updateInfo(){
  let h='';
  if(mode==='fractions'){
    const a=active&&active.mode==='fractions'?active:null;
    if(!a){h=ln('t','Fractions','分数')+ln('s','Drag an object from the tray onto the table, then press a number to cut it into equal parts.','把托盘里的物体拖到桌子上，再点数字把它平均分开。')}
    else{
      const K=KINDS[a.kind],n=a.n;
      if(n===1){h=ln('t',`${K.en}: 1 whole`,`${K.zh}：1 个整体`)+ln('s','Press a number below to cut it into equal parts.','点下面的数字，把它平均分成几份。')}
      else{
        const w=FW[n];
        h=ln('t',`Cut into ${n}: each piece is one ${w[0]} (1/${n})`,`平均分成${n}份：每一份是${w[2]}（1/${n}）`)+
          ln('s',`${NUM[n][0].toUpperCase()+NUM[n].slice(1)} ${w[1]} make a whole.`,`${n}个${w[2]}合起来是一个整体。`);
        const sel=selectedPieces(),k=sel.length;
        if(k){
          let en,zh,sub='',zsub='';
          if(k===n){en=`${n}/${n} · one whole`;zh=`${n}/${n} · 一个整体`}
          else{en=`${k}/${n} · ${fracEn(k,n)}`;zh=`${k}/${n} · ${fracZh(k,n)}`;
            const g=gcd(k,n);if(g>1){sub=`same as ${k/g}/${n/g} (${fracEn(k/g,n/g)})`;zsub=`和 ${k/g}/${n/g}（${fracZh(k/g,n/g)}）一样大`}}
          h+=`<div class="sel">${en}${sub?`<small>${sub}</small>`:''}${BI?`<div class="zh">${zh}${zsub?`<small>${zsub}</small>`:''}</div>`:''}</div>`;
        }else h+=ln('s','Tap a piece to see its fraction.','点一下小块，看看它是几分之几。');
      }
    }
  }else if(mode==='shapes'){
    const a=active&&active.mode==='shapes'?active:null;
    if(!a)h=ln('t','3D Shapes','立体图形')+ln('s','Drag a shape onto the table. Tap it, or press “What is it?”.','把图形拖到桌子上，点一下它，或按“这是什么？”。');
    else{const s=SHAPES[a.kind];
      if(a.named||show2D){
        h=ln('t',show2D?`${s.en} (3D), ${s.two.en} (2D)`:`${s.en} (3D)`,show2D?`${s.zh}（立体），${s.two.zh}（平面）`:`${s.zh}（立体）`)+ln('s',s.note.en,s.note.zh);
      }else h=ln('t','What is it?','这是什么？')+ln('s','Tap the shape or press the pink button.','点一下图形，或按粉色按钮。');
    }
  }else if(mode==='stack'){
    const st=stacks().filter(s=>s.length>1);
    h=st.length?ln('t',`stack: ${Math.max(...st.map(s=>s.length))} blocks high`,`堆叠：${Math.max(...st.map(s=>s.length))}块高`)+ln('s','Drag the top block to take it off.','拖走最上面的积木，就能拿下来。')
      :ln('t','Stack','堆叠')+ln('s','Drag blocks onto the table, then put one on top of another.','把积木拖到桌子上，再把一块放到另一块上面。');
  }else if(mode==='rotate'){
    h=TT.dir===0?ln('t','Rotate','旋转')+ln('s','Drop something on the turntable, then press clockwise or counterclockwise.','把东西放在转盘上，再按顺时针或逆时针。')
      :ln('t',`rotate: ${TT.dir<0?'clockwise':'counterclockwise'}`,`旋转：${TT.dir<0?'顺时针':'逆时针'}`)+ln('s','Things on the turntable turn with it.','转盘上的东西会跟着一起转。');
  }else{
    const b=modeItems().filter(i=>i.type==='ball');
    h=ln('t','Roll and bounce','滚动和弹跳')+ln('s','Drag a ball onto the table. Press Roll or Bounce.','把球拖到桌子上，按“滚动”或“弹跳”。');
  }
  info.innerHTML=h;
}
let toastT=0;
function toast(en,zh){const t=$('toast');t.innerHTML=esc(en)+(BI&&zh?` · ${esc(zh)}`:'');t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2300)}

/* ---------------- fractions: cut / join ---------------- */
function targetFrac(){
  if(active&&active.type==='frac'&&active.mode==='fractions')return active;
  const l=modeItems().filter(i=>i.type==='frac');return l.length?l[l.length-1]:null;
}
function cut(n){
  const it=targetFrac();
  if(!it){toast('Drag an object onto the table first.','先把物体拖到桌子上。');return}
  active=it;
  // keep the middle of the object where it is
  if(it.n>1)it.p.copy(centroid(it));
  setupFrac(it,n);clampXZ(it.p,it.radius);highlight();updateInfo();
  knife(it);
}
function centroid(it){const c=new V3();it.pcs.forEach(pc=>c.add(pc.pos));c.multiplyScalar(1/it.pcs.length);return new V3(it.p.x+c.x,0,it.p.z+c.z)}
function join(){
  const it=targetFrac();if(!it){toast('Nothing to join yet.','还没有可以合并的东西。');return}
  if(it.n===1){toast('It is already whole.','它已经是完整的了。');return}
  it.p.copy(centroid(it));clampXZ(it.p,it.baseRadius);
  setupFrac(it,1);highlight();active=it;updateInfo();
}
// a quick knife swoosh over the object (decoration)
let knifeObj=null;
function makeKnife(){
  const g=new THREE.Group();
  const metal=new THREE.MeshStandardMaterial({color:0xe9edf3,metalness:.9,roughness:.2});
  const blade=new THREE.Mesh(new THREE.BoxGeometry(.04,.62,1.7),metal);blade.position.set(0,.31,0);   // long axis = z, edge at the bottom
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.14,.2,.9),new THREE.MeshStandardMaterial({color:0x7a4a2a,roughness:.6}));handle.position.set(0,.72,-.35);
  g.add(blade,handle);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.raycast=()=>{}}});g.visible=false;scene.add(g);return g;
}
let knifeAnim=null;
function knife(it){
  if(!knifeObj)knifeObj=makeKnife();
  knifeAnim={t:0,it};knifeObj.visible=true;
}
function updateKnife(dt){   // quick "chop": drop onto the object and lift away again
  if(!knifeAnim)return;knifeAnim.t+=dt/.7;const t=knifeAnim.t,it=knifeAnim.it;
  if(t>=1||!items.includes(it)){knifeObj.visible=false;knifeAnim=null;return}
  const down=t<.35?(t/.35):1-(t-.35)/.65,e=down*down*(3-2*down);
  knifeObj.position.set(it.p.x,.05+(1-e)*1.8+ (it.height||.5)*(1-e)*.0,it.p.z);
  knifeObj.rotation.set(0,0,0);
}

/* ---------------- stack ---------------- */
function blocks(){return items.filter(i=>i.type==='block'&&i.mode===mode)}
function above(b,list=blocks()){return list.filter(o=>o!==b&&Math.abs(o.p.x-b.p.x)<.25&&Math.abs(o.p.z-b.p.z)<.25&&o.p.y>b.p.y+.2).sort((a,c)=>a.p.y-c.p.y)}
function stacks(){
  if(mode!=='stack')return [];
  const bl=blocks(),res=[];
  for(const b of bl){if(b.p.y>.2)continue;const col=[b,...above(b,bl)];res.push(col)}
  return res;
}
function stackSnap(b,carried,tx,tz){
  let best=null,bd=1.15;
  for(const o of blocks()){
    if(carried.includes(o))continue;
    if(above(o,blocks().filter(x=>!carried.includes(x))).length)continue;   // only the top block of a column
    const d=Math.hypot(o.p.x-tx,o.p.z-tz);if(d<bd){bd=d;best=o}
  }
  return best;
}

/* ---------------- picking + dragging ---------------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new V3(0,1,0),0),hitV=new V3();
function setRay(e,dy=0){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY+dy-r.top)/r.height*2-1));ray.setFromCamera(ndc,camera)}
function pickAt(e){
  setRay(e);
  const roots=modeItems().map(i=>i.group);
  const hits=ray.intersectObjects(roots,true);
  for(const h of hits){let o=h.object;const it=o.userData.item;if(it&&it.group.visible)return {item:it,piece:o.userData.pieceIndex,point:h.point}}
  return null;
}
function planePoint(e,y){setRay(e,(e.pointerType==='touch'&&drag&&drag.tray)?-56:0);plane.constant=-y;return ray.ray.intersectPlane(plane,hitV)?hitV.clone():null}

let drag=null,trayDrag=null;
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType==='mouse'){controls.enabled=true;return}
  if(drag){controls.enabled=true;drag=null;return}      // a second finger: let the camera handle it
  const hit=pickAt(e);
  if(!hit){controls.enabled=true;drag={bg:true,x:e.clientX,y:e.clientY,moved:false,id:e.pointerId};return}
  controls.enabled=false;
  beginDrag(e,hit);
});
function beginDrag(e,hit){
  const it=hit.item;
  const d={item:it,piece:(it.type==='frac'&&it.n>1)?hit.piece:undefined,x:e.clientX,y:e.clientY,moved:false,id:e.pointerId,t:performance.now()};
  const py=Math.max(0,hit.point?hit.point.y:0);d.py=py;
  const pp=planePoint(e,py);
  if(d.piece!==undefined){const pc=it.pcs[d.piece];d.off=new V3(it.p.x+pc.pos.x-pp.x,0,it.p.z+pc.pos.z-pp.z)}
  else d.off=new V3(it.p.x-pp.x,0,it.p.z-pp.z);
  if(it.type==='block'&&mode==='stack'){d.carried=[it,...above(it)]}
  drag=d;canvas.classList.add('drag');
}
window.addEventListener('pointermove',e=>{
  if(trayDrag&&!trayDrag.item){
    const r=stage.getBoundingClientRect();
    trayDrag.ghost&&(trayDrag.ghost.style.left=e.clientX+'px',trayDrag.ghost.style.top=e.clientY+'px');
    if(Math.hypot(e.clientX-trayDrag.x,e.clientY-trayDrag.y)>8&&!trayDrag.ghost){const g=document.createElement('img');g.className='fx-ghost';g.src=trayDrag.src;document.body.appendChild(g);trayDrag.ghost=g;g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'}
    if(e.clientX>r.left&&e.clientX<r.right&&e.clientY>r.top&&e.clientY<r.bottom){
      drag={tray:true};const pp=planePoint(e,0);drag=null;
      if(pp){const it=spawn(trayDrag.kind,pp.x,pp.z,{noDrop:true});it.lift=.3;trayDrag.item=it;trayDrag.ghost&&trayDrag.ghost.remove();trayDrag.ghost=null;
        controls.enabled=false;drag={item:it,x:e.clientX,y:e.clientY,moved:true,id:e.pointerId,py:0,off:new V3(),t:performance.now(),fresh:true,tray:true};
        if(it.type==='block'&&mode==='stack')drag.carried=[it];canvas.classList.add('drag')}
    }
    return;
  }
  if(!drag||drag.bg)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
  drag.moved=true;
  const pp=planePoint(e,drag.py);if(!pp)return;
  const it=drag.item,tx=pp.x+drag.off.x,tz=pp.z+drag.off.z;
  if(drag.piece!==undefined){
    const pc=it.pcs[drag.piece];
    const w=new V3(tx,0,tz);clampXZ(w,pc.size*.6);
    pc.pos.set(w.x-it.p.x,0,w.z-it.p.z);pc.target.copy(pc.pos);
    return;
  }
  const w=new V3(tx,0,tz);
  if(it.onTT){it.onTT=false}
  if(it.type==='block'&&mode==='stack'){
    clampXZ(w,.7);const base=stackSnap(it,drag.carried,w.x,w.z);
    let x=w.x,z=w.z,y=0;if(base){x=base.p.x;z=base.p.z;y=base.p.y+BLOCK}
    drag.carried.forEach((b,k)=>{b.p.set(x,y+k*BLOCK,z);b.liftT=.28});
    drag.snapTo=base;
  }else{
    clampXZ(w,it.radius);it.p.x=w.x;it.p.z=w.z;it.p.y=0;it.liftT=.3;
    if(mode==='rotate'&&Math.hypot(w.x-TT.c.x,w.z-TT.c.z)<TT.R-.1){it.p.y=TT.h}
    if(it.type==='ball'){it.v.set(0,0,0);it.vy=0;it.bounce=false;it.p.y=.3;}
    if(it.comp)layoutComp(it);
  }
});
function endDrag(e){
  if(trayDrag){
    const td=trayDrag;trayDrag=null;td.ghost&&td.ghost.remove();
    if(!td.item){ // simple tap on a tray tile: put it on the table in a free spot
      if(Math.hypot(e.clientX-td.x,e.clientY-td.y)<10){const s=freeSpot(td.kind);spawn(td.kind,s.x,s.z)}
    }
  }
  const d=drag;drag=null;controls.enabled=true;canvas.classList.remove('drag');
  if(!d)return;
  if(d.bg){
    if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<6){ // tap on empty space
      if(active&&active.pcs){active.pcs.forEach(p=>p.sel=false);highlight();updateInfo()}
    }
    return;
  }
  const it=d.item;
  if(d.carried)d.carried.forEach(b=>b.liftT=0);else it.liftT=0;
  if(d.piece!==undefined){
    const pc=it.pcs[d.piece];
    if(!d.moved){ // tap: toggle this piece
      if(active!==it){if(active&&active.pcs)active.pcs.forEach(p=>p.sel=false);active=it}
      pc.sel=!pc.sel;highlight();updateInfo();
    }
    return;
  }
  if(!d.moved){tapItem(it);return}
  settle(it,d);
  setActive(it);
}
window.addEventListener('pointerup',endDrag);
window.addEventListener('pointercancel',endDrag);
function tapItem(it){
  if(it.type==='frac'&&it.n===1){setActive(it)}
  else if(it.type==='shape'){it.named=true;setActive(it)}
  else setActive(it);
}
function settle(it,d){
  if(d&&d.carried){updateInfo();return}
  if(it.type==='ball'){it.p.y=0;it.bounce=true;it.vy=-1;it.v.set(0,0,0);return}
  if(mode==='rotate'){
    const dx=it.p.x-TT.c.x,dz=it.p.z-TT.c.z;
    if(Math.hypot(dx,dz)<TT.R-.1){it.onTT=true;it.p.y=TT.h;it.p.x=it.p.x;return}
    // keep clear of the turntable edge
    const dd=Math.hypot(dx,dz),minD=TT.R+it.radius*.7;if(dd<minD&&dd>0){it.p.x=TT.c.x+dx/dd*minD;it.p.z=TT.c.z+dz/dd*minD;clampXZ(it.p,it.radius)}
  }
  it.p.y=0;
  if(it.type!=='block')unoverlap(it);
  if(it.comp)layoutComp(it);
}
function unoverlap(it){
  for(let k=0;k<5;k++){let moved=false;
    for(const o of modeItems()){if(o===it||o.type==='ball'||it.type==='ball')continue;
      const dx=it.p.x-o.p.x,dz=it.p.z-o.p.z,d=Math.hypot(dx,dz)||.001,min=(it.radius+o.radius)*.78;
      if(d<min){it.p.x+=dx/d*(min-d);it.p.z+=dz/d*(min-d);clampXZ(it.p,it.radius);moved=true}}
    if(!moved)break}
}
function freeSpot(kind){
  const r=KINDS[kind].type==='frac'?1.7:1.1;
  const cand=[];for(const z of[-1.5,1.5,0])for(const x of[-3.6,-1.3,1.0,3.5])cand.push({x,z});
  const mi=modeItems();let best=cand[0],bs=-1;
  for(const c of cand){
    let m=9;for(const o of mi){m=Math.min(m,Math.hypot(c.x-o.p.x,c.z-o.p.z)-o.radius)}
    if(mode==='rotate'){m=Math.min(m,Math.hypot(c.x-TT.c.x,c.z-TT.c.z)-TT.R-.3)}
    if(m>bs){bs=m;best=c}
    if(m>r)return c;
  }
  return best;
}

/* ---------------- tray ---------------- */
const icons={};
function makeIcons(){
  const S=112,sc=new THREE.Scene();sc.environment=scene.environment;sc.background=new THREE.Color(0xfbf4fa);
  sc.add(new THREE.HemisphereLight(0xffffff,0xd8cce8,.7));const dl=new THREE.DirectionalLight(0xffffff,2.2);dl.position.set(-3,6,4);sc.add(dl);
  const cam=new THREE.PerspectiveCamera(30,1,.1,60);
  const old={w:canvas.width,h:canvas.height,pr:renderer.getPixelRatio()};
  renderer.setPixelRatio(1);renderer.setSize(S,S,false);
  const out=document.createElement('canvas');out.width=out.height=S;const g=out.getContext('2d');
  for(const k of Object.keys(KINDS)){
    const K=KINDS[k];let grp;
    if(K.type==='frac'){const b=buildFraction(k,1);grp=new THREE.Group();b.pieces.forEach(p=>grp.add(p.group))}
    else if(K.type==='shape')grp=buildShape(k).group;
    else if(K.type==='block')grp=buildBlock(K.color).group;
    else grp=buildBall(...K.c).group;
    sc.add(grp);
    const box=new THREE.Box3().setFromObject(grp),c=box.getCenter(new V3()),r=box.getSize(new V3()).length()/2;
    const dir=new V3(.55,.85,1).normalize();cam.position.copy(c).addScaledVector(dir,r/Math.sin(THREE.MathUtils.degToRad(15))*1.02);cam.lookAt(c);cam.updateProjectionMatrix();
    renderer.render(sc,cam);g.clearRect(0,0,S,S);g.drawImage(canvas,0,0,S,S);icons[k]=out.toDataURL('image/png');
    sc.remove(grp);disposeObj(grp);
  }
  renderer.setPixelRatio(old.pr);
}
function buildTray(){
  const tr=$('tray');
  tr.innerHTML=TRAYS[mode].map(k=>{const K=KINDS[k];return `<button class="fx-tile" data-kind="${k}" aria-label="${esc(K.en)}: drag onto the table"><img alt="" src="${icons[k]||''}"><span>${esc(K.en)}</span><span class="zh">${esc(K.zh)}</span></button>`}).join('');
}
$('tray').addEventListener('pointerdown',e=>{
  const t=e.target.closest('.fx-tile');if(!t)return;
  e.preventDefault();
  trayDrag={kind:t.dataset.kind,x:e.clientX,y:e.clientY,src:t.querySelector('img').src,item:null};
});
// (tap on a tile with the keyboard)
$('tray').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('.fx-tile')){e.preventDefault();const k=e.target.closest('.fx-tile').dataset.kind;const s=freeSpot(k);spawn(k,s.x,s.z)}});
// mouse/touch scrolling of the tray on phones: horizontal swipes on a tile scroll, so only start a drag on a clearly vertical/upward move

/* ---------------- modes + buttons ---------------- */
function setMode(m){
  mode=m;active=null;clearLabels();knifeAnim=null;if(knifeObj)knifeObj.visible=false;
  document.querySelectorAll('.fx-tab').forEach(b=>{const on=b.dataset.mode===m;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
  document.querySelectorAll('.fx-grp').forEach(g=>g.classList.toggle('on',g.dataset.for===m));
  for(const it of items)it.group.visible=it.mode===m;
  ttGroup.visible=m==='rotate';
  buildTray();
  const last=modeItems().slice(-1)[0];if(last&&m!=='roll')active=last;
  highlight();updateInfo();
}
document.querySelectorAll('.fx-tab').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
document.querySelectorAll('[data-cut]').forEach(b=>b.onclick=()=>cut(+b.dataset.cut));
$('join').onclick=join;
$('whatis').onclick=()=>{
  const l=modeItems().filter(i=>i.type==='shape');
  const it=(active&&active.type==='shape'&&active.mode==='shapes')?active:l[l.length-1];
  if(!it){toast('Drag a shape onto the table first.','先把图形拖到桌子上。');return}
  it.named=true;active=it;updateInfo();
};
$('tog2d').onclick=()=>{show2D=!show2D;$('tog2d').setAttribute('aria-pressed',show2D);updateInfo()};
$('spread').onclick=()=>{
  const bl=blocks().sort((a,b)=>a.p.y-b.p.y);let i=0;
  for(const b of bl){b.p.set(-3.9+(i%6)*1.45,0,-1.7+Math.floor(i/6)*1.6);i++}
  updateInfo();
};
function ttSet(d){TT.dir=d;updateInfo()}
$('cw').onclick=()=>ttSet(-1);$('ccw').onclick=()=>ttSet(1);$('tstop').onclick=()=>ttSet(0);
function ballsHere(){const b=modeItems().filter(i=>i.type==='ball');if(!b.length){const s=freeSpot('ball0');return [spawn('ball0',-3.6,.2,{keepActive:false})]}return b}
function ballTargets(){const all=ballsHere();return (active&&active.type==='ball'&&all.includes(active))?[active]:all}
$('roll').onclick=()=>{for(const b of ballTargets()){b.bounce=false;b.vy=0;b.p.y=0;const dir=b.p.x<0?1:-1;b.v.set(dir*4.6,0,(Math.random()-.5)*.5);b.labelKind='roll';b.labelUntil=performance.now()+1500}};
$('bounce').onclick=()=>{for(const b of ballTargets()){b.v.set(0,0,0);b.bounce=true;b.vy=7.6;b.p.y=Math.max(b.p.y,.001);b.labelKind='bounce';b.labelUntil=performance.now()+1500}};
$('bstop').onclick=()=>{for(const b of modeItems().filter(i=>i.type==='ball')){b.v.set(0,0,0);b.bounce=false;b.vy=0;b.p.y=0}};
function resetTable(){
  for(const it of [...items])removeItem(it);
  clearLabels();TT.dir=0;TT.angle=0;ttDisc.rotation.y=0;active=null;show2D=false;$('tog2d').setAttribute('aria-pressed',false);
  resetView();updateInfo();
}
$('reset').onclick=resetTable;
{const mq=matchMedia('(max-width:700px)');const place=()=>{(mq.matches?stage:$('bar')).appendChild($('reset'))};mq.addEventListener('change',place);place()}

/* ---------------- simulation ---------------- */
const GRAV=19,REST=.68,DEC=.8,WALLR=.72;
const Q=new THREE.Quaternion(),AX=new V3(),UP=new V3(0,1,0);
function stepBalls(dt){
  const bl=modeItems().filter(i=>i.type==='ball'&&i!==(drag&&drag.item));
  for(const b of bl){
    if(b.bounce||b.p.y>.002){
      b.vy-=GRAV*dt;b.p.y+=b.vy*dt;
      if(b.p.y<=0){b.p.y=0;if(Math.abs(b.vy)>1.6){b.vy=-b.vy*REST;b.hits=(b.hits||0)+1}else{b.vy=0;b.bounce=false}}
    }
    const sp=Math.hypot(b.v.x,b.v.z);
    if(sp>0){
      const ns=Math.max(0,sp-(b.p.y<=.002?DEC:0)*dt);b.v.multiplyScalar(ns/sp);
      if(ns<.05)b.v.set(0,0,0);
      const dx=b.v.x*dt,dz=b.v.z*dt;b.p.x+=dx;b.p.z+=dz;
      if(b.p.x<-BX+BALL_R){b.p.x=-BX+BALL_R;b.v.x=Math.abs(b.v.x)*WALLR}
      if(b.p.x>BX-BALL_R){b.p.x=BX-BALL_R;b.v.x=-Math.abs(b.v.x)*WALLR}
      if(b.p.z<-BZ+BALL_R){b.p.z=-BZ+BALL_R;b.v.z=Math.abs(b.v.z)*WALLR}
      if(b.p.z>BZ-BALL_R){b.p.z=BZ-BALL_R;b.v.z=-Math.abs(b.v.z)*WALLR}
      const dist=Math.hypot(dx,dz);
      if(dist>0){AX.set(dz,0,-dx).normalize();   // up x dir
        AX.crossVectors(UP,new V3(dx,0,dz).normalize());Q.setFromAxisAngle(AX,dist/BALL_R);
        b.ball.mesh.quaternion.premultiply(Q);b.spin+=dist/BALL_R}
    }
  }
  for(let i=0;i<bl.length;i++)for(let j=i+1;j<bl.length;j++){
    const a=bl[i],c=bl[j];if(Math.abs(a.p.y-c.p.y)>BALL_R*1.4)continue;
    const dx=c.p.x-a.p.x,dz=c.p.z-a.p.z,d=Math.hypot(dx,dz);
    if(d<BALL_R*2&&d>1e-4){
      const nx=dx/d,nz=dz/d,rv=(c.v.x-a.v.x)*nx+(c.v.z-a.v.z)*nz;
      if(rv<0){a.v.x+=rv*nx;a.v.z+=rv*nz;c.v.x-=rv*nx;c.v.z-=rv*nz}
      const o=(BALL_R*2-d)/2;a.p.x-=nx*o;a.p.z-=nz*o;c.p.x+=nx*o;c.p.z+=nz*o;
    }
  }
}
function stepTurntable(dt){
  if(mode!=='rotate')return;
  const dth=TT.dir*TT.omega*dt;
  TT.angle+=dth;ttDisc.rotation.y=TT.angle;
  if(!dth)return;
  const c=Math.cos(dth),s=Math.sin(dth);
  const rot=(v)=>{const x=v.x-TT.c.x,z=v.z-TT.c.z;  // rotation about +Y by dth (counter-clockwise seen from above)
    v.x=TT.c.x+x*c+z*s;v.z=TT.c.z-x*s+z*c};
  for(const it of modeItems()){
    if(!it.onTT||(drag&&drag.item===it))continue;
    rot(it.p);rot(it.group.position);it.group.rotation.y+=dth;
  }
}
const _t=new V3();
function updateItems(dt){
  const k=1-Math.exp(-dt*20),kl=1-Math.exp(-dt*12);
  for(const it of items){
    if(it.mode!==mode)continue;
    it.lift+=(it.liftT-it.lift)*kl;
    const g=it.group;
    if(it.type==='ball'){g.position.set(it.p.x,it.p.y+Math.max(0,it.lift-(it.liftT?0:0)),it.p.z);continue}
    if(it.onTT){ // rotation keeps both in sync; ease only height
      g.position.y+=(it.p.y+it.lift-g.position.y)*k;
      if(Math.hypot(g.position.x-it.p.x,g.position.z-it.p.z)>.5){g.position.x=it.p.x;g.position.z=it.p.z}
      else{g.position.x+=(it.p.x-g.position.x)*k;g.position.z+=(it.p.z-g.position.z)*k}
    }else{
      g.position.x+=(it.p.x-g.position.x)*k;g.position.z+=(it.p.z-g.position.z)*k;g.position.y+=(it.p.y+it.lift-g.position.y)*k;
    }
    if(it.pcs){
      for(const pc of it.pcs){
        pc.pos.x+=(pc.target.x-pc.pos.x)*kl*.8;pc.pos.z+=(pc.target.z-pc.pos.z)*kl*.8;
        pc.lift+=(pc.liftT-pc.lift)*kl;
        pc.group.position.set(pc.pos.x,pc.lift,pc.pos.z);
      }
    }
    if(it.comp){
      const on=show2D&&mode==='shapes';it.comp.group.visible=on;
    }
  }
  // ring
  if(active&&active.mode===mode&&mode!=='roll'){
    ring.visible=true;const r=active.radius+.12;ring.scale.set(r,r,r);ring.position.set(active.group.position.x,.012+(active.onTT?TT.h:0),active.group.position.z);
    if(active.type==='block'){ring.visible=mode==='stack'&&false}
  }else ring.visible=false;
}
function updateWordLabels(){
  const now=performance.now();
  // fraction: selected pieces
  if(mode==='fractions'){
    const sel=selectedPieces();
    if(active&&active.pcs&&sel.length&&active.n>1){
      const n=active.n,k=sel.length;
      mkLabel('fsel',k===n?`${n}/${n}`:`${k}/${n}`,k===n?'一个整体':fracZh(k,n),()=>{
        if(!active||!active.pcs)return null;const s=active.pcs.filter(p=>p.sel);if(!s.length)return null;
        const c=new V3();s.forEach(p=>c.add(p.top).add(new V3(p.pos.x,p.lift,p.pos.z)));c.multiplyScalar(1/s.length);return c.add(active.group.position).add(new V3(0,.75,0));
      },{color:'#c2410c',h:.8});
    }else dropLabel('fsel');
  }else dropLabel('fsel');
  // shapes
  if(mode==='shapes'){
    for(const it of modeItems().filter(i=>i.type==='shape')){
      const sh=SHAPES[it.kind],showName=show2D||(it.named&&active===it);
      if(showName){
        mkLabel('s3-'+it.id,`${sh.en} (3D)`,`${sh.zh}（立体）`,()=>it.group.parent?new V3(it.group.position.x,it.group.position.y+it.height+.7,it.group.position.z):null,{color:'#6c4ea0',small:true,h:.5});
      }else dropLabel('s3-'+it.id);
      if(show2D){
        mkLabel('s2-'+it.id,`${sh.two.en} (2D)`,`${sh.two.zh}（平面）`,()=>{const c=it.comp;return new V3(it.group.position.x+c.group.position.x,it.group.position.y+.65,it.group.position.z)},{color:'#2c9a83',small:true,h:.5});
      }else dropLabel('s2-'+it.id);
    }
  }
  // stack
  if(mode==='stack'){
    const live=new Set();
    for(const col of stacks()){
      if(col.length<2)continue;const top=col[col.length-1],k='st-'+col[0].id;live.add(k);
      mkLabel(k,'stack','堆叠',()=>new V3(top.group.position.x,top.group.position.y+BLOCK+.75,top.group.position.z),{color:'#d8588d',h:.78});
    }
    for(const k of [...labels.keys()])if(k.startsWith('st-')&&!live.has(k))dropLabel(k);
  }
  // rotate
  if(mode==='rotate'){
    arrow.visible=TT.dir!==0;arrow.scale.z=TT.dir<0?-1:1;
    if(TT.dir!==0){
      mkLabel('rot','rotate','旋转',()=>new V3(TT.c.x,3.3,TT.c.z),{color:'#d8588d',h:.85});
      const cw=TT.dir<0;
      mkLabel('rotdir',cw?'clockwise ↻':'counterclockwise ↺',cw?'顺时针':'逆时针',()=>new V3(TT.c.x,.6,TT.c.z+TT.R+1.15),{color:cw?'#2c9a83':'#d9771f',h:.62});
    }else{dropLabel('rot');dropLabel('rotdir')}
  }else arrow.visible=false;
  // balls
  if(mode==='roll'){
    for(const b of modeItems().filter(i=>i.type==='ball')){
      const sp=Math.hypot(b.v.x,b.v.z),k='ball-'+b.id;
      const showBounce=b.bounce&&b.labelKind==='bounce'||(b.labelKind==='bounce'&&now<b.labelUntil);
      const showRoll=b.labelKind==='roll'&&(sp>.25||now<b.labelUntil&&sp>0);
      if(showBounce)mkLabel(k,'bounce','弹跳',()=>new V3(b.group.position.x,Math.max(b.group.position.y,0)+BALL_R*2+1.3,b.group.position.z),{color:'#d9771f',h:.8});
      else if(showRoll)mkLabel(k,'roll','滚动',()=>new V3(b.group.position.x,b.group.position.y+BALL_R*2+.95,b.group.position.z),{color:'#d8588d',h:.8});
      else dropLabel(k);
    }
  }
}

/* ---------------- main loop ---------------- */
let last=performance.now(),frames=0;
function frame(now){
  requestAnimationFrame(frame);
  if(document.hidden)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(camTween){camTween.t=Math.min(1,camTween.t+dt/.55);const e=1-Math.pow(1-camTween.t,3);camera.position.lerpVectors(camTween.p0,camTween.p1,e);controls.target.lerpVectors(camTween.t0,camTween.t1,e);if(camTween.t>=1)camTween=null}
  controls.update();
  controls.target.x=clamp(controls.target.x,-4.8,4.8);controls.target.z=clamp(controls.target.z,-3.2,3.2);controls.target.y=clamp(controls.target.y,0,1.2);
  if(camera.position.y<.6)camera.position.y=.6;
  stepTurntable(dt);stepBalls(dt);updateItems(dt);updateKnife(dt);updateWordLabels();updateLabels(now/1000);
  if(mode==='stack'&&frames%20===0)updateInfo();
  renderer.render(scene,camera);frames++;
}

/* ---------------- start ---------------- */
makeIcons();
resize();
buildTray();updateInfo();
renderer.setClearColor(BG);
requestAnimationFrame(frame);

// small test/diagnostic hook (not used by the UI)
window.__fr3d={
  THREE,scene,camera,controls,items,spawn,cut,join,setMode,TT,
  get mode(){return mode},get active(){return active},
  pick(i,p){const it=active;if(!it||!it.pcs)return;it.pcs[i].sel=p!==false?!it.pcs[i].sel:false;highlight();updateInfo()},
  state(){return {mode,frames,cam:camera.position.toArray(),target:controls.target.toArray(),
    items:items.map(i=>({id:i.id,kind:i.kind,mode:i.mode,n:i.n,x:i.p.x,y:i.p.y,z:i.p.z,onTT:i.onTT,spin:i.spin,vx:i.v.x,vz:i.v.z,bounce:i.bounce,gy:i.group.position.y,ry:i.group.rotation.y,hits:i.hits||0,sel:i.pcs?i.pcs.filter(p=>p.sel).length:0})),
    tt:{dir:TT.dir,angle:TT.angle},labels:[...labels.entries()].map(([k,L])=>[k,L.en])}},
  toScreen(x,y,z){const v=new V3(x,y,z).project(camera),r=canvas.getBoundingClientRect();return [r.left+(v.x+1)/2*r.width,r.top+(1-v.y)/2*r.height]},
  pieceScreen(i,it=active){const pc=it.pcs[i];return this.toScreen(it.group.position.x+pc.pos.x+pc.top.x*1.1,pc.top.y-.12+pc.lift,it.group.position.z+pc.pos.z+pc.top.z*1.1)},
  clearActive(){active=null},
  ready:true
};
