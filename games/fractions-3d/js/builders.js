// Geometry builders for the cut-able fraction objects. Pieces are built directly (no CSG),
// so every cut face is exact and gets its own "inside" material (apple flesh, cake layers...).
import * as THREE from 'three';
import * as TX from './textures.js';

const TAU=Math.PI*2;
class GB{
  constructor(){this.p=[];this.n=[];this.u=[];this.i=[]}
  v(x,y,z,nx,ny,nz,u,v){const k=this.p.length/3;this.p.push(x,y,z);this.n.push(nx,ny,nz);this.u.push(u,v);return k}
  tri(a,b,c){ // winding fixed against the vertex normals
    const P=this.p,N=this.n;
    const ax=P[a*3],ay=P[a*3+1],az=P[a*3+2];
    const e1=[P[b*3]-ax,P[b*3+1]-ay,P[b*3+2]-az],e2=[P[c*3]-ax,P[c*3+1]-ay,P[c*3+2]-az];
    const cx=e1[1]*e2[2]-e1[2]*e2[1],cy=e1[2]*e2[0]-e1[0]*e2[2],cz=e1[0]*e2[1]-e1[1]*e2[0];
    if(cx*cx+cy*cy+cz*cz<1e-14)return;
    const nx=N[a*3]+N[b*3]+N[c*3],ny=N[a*3+1]+N[b*3+1]+N[c*3+1],nz=N[a*3+2]+N[b*3+2]+N[c*3+2];
    if(cx*nx+cy*ny+cz*nz>=0)this.i.push(a,b,c);else this.i.push(a,c,b);
  }
  quad(a,b,c,d){this.tri(a,b,c);this.tri(a,c,d)}
  empty(){return this.i.length===0}
  geo(){const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));
    g.setIndex(this.i);g.computeBoundingSphere();return g}
}
const P=(r,a)=>[r*Math.cos(a),-r*Math.sin(a)];  // x,z at polar (r,a); positive a = counter-clockwise seen from above

// Extruded annular sector (pizza, cake layers, discs...)
function sectorSolid(B,o){
  const {r0=0,r1,a0,a1,y0,y1,seg,full=false,k}=o;
  const top=B[k.top],bot=B[k.bot||k.top],out=B[k.outer],inn=B[k.inner||k.outer],cut=B[k.cut];
  const uvT=o.uvTop||((x,z)=>[x,z]),uvC=o.uvCut||((r,y)=>[r,y]);
  const da=(a1-a0)/seg;
  for(let j=0;j<seg;j++){
    const A=a0+j*da,Bn=A+da;
    const q=(r,a)=>P(r,a);
    const [x00,z00]=q(r0,A),[x10,z10]=q(r1,A),[x11,z11]=q(r1,Bn),[x01,z01]=q(r0,Bn);
    if(top){
      const t=[[x00,z00],[x10,z10],[x11,z11],[x01,z01]].map(([x,z])=>top.v(x,y1,z,0,1,0,...uvT(x,z)));
      top.quad(...t);
    }
    if(bot){
      const t=[[x00,z00],[x10,z10],[x11,z11],[x01,z01]].map(([x,z])=>bot.v(x,y0,z,0,-1,0,...uvT(x,z)));
      bot.quad(...t);
    }
    if(out){ // outer wall
      const n0=[Math.cos(A),0,-Math.sin(A)],n1=[Math.cos(Bn),0,-Math.sin(Bn)];
      const u0=A/TAU,u1=Bn/TAU;
      const v=[out.v(x10,y0,z10,...n0,u0,y0),out.v(x11,y0,z11,...n1,u1,y0),out.v(x11,y1,z11,...n1,u1,y1),out.v(x10,y1,z10,...n0,u0,y1)];
      out.quad(...v);
    }
    if(r0>0&&inn){
      const n0=[-Math.cos(A),0,Math.sin(A)],n1=[-Math.cos(Bn),0,Math.sin(Bn)];
      const v=[inn.v(x00,y0,z00,...n0,0,0),inn.v(x01,y0,z01,...n1,1,0),inn.v(x01,y1,z01,...n1,1,1),inn.v(x00,y1,z00,...n0,0,1)];
      inn.quad(...v);
    }
  }
  if(!full&&cut){
    for(const [a,n] of [[a0,[Math.sin(a0),0,Math.cos(a0)]],[a1,[-Math.sin(a1),0,-Math.cos(a1)]]]){
      const [xa,za]=P(r0,a),[xb,zb]=P(r1,a);
      const v=[cut.v(xa,y0,za,...n,...uvC(r0,y0)),cut.v(xb,y0,zb,...n,...uvC(r1,y0)),cut.v(xb,y1,zb,...n,...uvC(r1,y1)),cut.v(xa,y1,za,...n,...uvC(r0,y1))];
      cut.quad(...v);
    }
  }
}

// Surface of revolution over an angle range (+ flat cut faces through the axis)
function revolve(B,prof,a0,a1,seg,full,kSkin,kFace,faceUV){
  const skin=B[kSkin],face=B[kFace];
  const N=prof.length;
  // profile normals
  const nr=[],ny=[];
  for(let i=0;i<N;i++){
    const p0=prof[Math.max(0,i-1)],p1=prof[Math.min(N-1,i+1)];
    const dr=p1[0]-p0[0],dy=p1[1]-p0[1],l=Math.hypot(dr,dy)||1;
    nr.push(dy/l);ny.push(-dr/l);
  }
  const da=(a1-a0)/seg;
  for(let j=0;j<seg;j++){
    const A=a0+j*da,Bn=A+da;
    for(let i=0;i<N-1;i++){
      const mk=(a,k)=>{const [x,z]=P(prof[k][0],a);return skin.v(x,prof[k][1],z,nr[k]*Math.cos(a),ny[k],-nr[k]*Math.sin(a),a/TAU,k/(N-1))};
      skin.quad(mk(A,i),mk(Bn,i),mk(Bn,i+1),mk(A,i+1));
    }
  }
  if(!full&&face){
    const contour=prof.map(p=>new THREE.Vector2(p[0],p[1]));
    const tris=THREE.ShapeUtils.triangulateShape(contour,[]);
    for(const [a,n] of [[a0,[Math.sin(a0),0,Math.cos(a0)]],[a1,[-Math.sin(a1),0,-Math.cos(a1)]]]){
      const ids=prof.map(([r,y])=>{const [x,z]=P(r,a);return face.v(x,y,z,...n,...faceUV(r,y))});
      for(const t of tris)face.tri(ids[t[0]],ids[t[1]],ids[t[2]]);
    }
  }
}

const cache={};
const mat=(key,fn)=>cache[key]||(cache[key]=fn());
const std=(o)=>new THREE.MeshStandardMaterial(o);
const mats={
  appleSkin:()=>mat('appleSkin',()=>std({map:TX.appleSkinTex(),roughness:.38,metalness:0})),
  orangeSkin:()=>mat('orangeSkin',()=>{const t=TX.orangeSkinTex();return std({map:t.map,bumpMap:t.bump,bumpScale:1.2,roughness:.6})}),
  stem:()=>mat('stem',()=>std({color:0x6b4423,roughness:.8})),
  leaf:()=>mat('leaf',()=>std({color:0x3aa148,roughness:.6,side:THREE.DoubleSide})),
};

function appleProfile(){
  const R=.98,H=.86,pts=[],N=40;
  for(let i=0;i<=N;i++){
    const th=Math.PI*i/N;               // 0 bottom .. pi top
    const f=1+.07*(-Math.cos(th));
    let r=R*Math.sin(th)*f,y=-H*Math.cos(th);
    y-=.2*Math.exp(-Math.pow((Math.PI-th)/.33,2));   // stem dimple
    y+=.08*Math.exp(-Math.pow(th/.3,2));              // bottom dimple
    pts.push([Math.max(r,0),y]);
  }
  const ymin=Math.min(...pts.map(p=>p[1]));
  return {pts:pts.map(([r,y])=>[r,y-ymin]),R:R*1.07,h:Math.max(...pts.map(p=>p[1]))-ymin};
}
function orangeProfile(){
  const R=.86,H=.8,pts=[],N=36;
  for(let i=0;i<=N;i++){const th=Math.PI*i/N;pts.push([Math.max(R*Math.sin(th),0),-H*Math.cos(th)+H])}
  return {pts,R,h:2*H};
}
const APPLE=appleProfile(),ORANGE=orangeProfile();

/* ---------- public: build(kind,n) ---------- */
// returns {pieces:[{group,dir,top:Vector3,size}], radius, height}
export function buildFraction(kind,n){
  const full=n===1,pieces=[];
  const secSeg=Math.max(5,Math.ceil(72/n));
  const sectors=(fn)=>{for(let k=0;k<n;k++){const a0=k*TAU/n,a1=(k+1)*TAU/n,am=(a0+a1)/2;const out=fn(a0,a1,full,am);pieces.push(out)}};
  let radius=1,height=1;
  if(kind==='apple'||kind==='orange'){
    const pr=kind==='apple'?APPLE:ORANGE;radius=pr.R;height=pr.h;
    const ymin=0,ymax=pr.h;
    const faceMat=mat(kind+'f',()=>std({map:(kind==='apple'?TX.appleFleshTex:TX.orangeFleshTex)(pr.pts,pr.R,ymin,ymax),roughness:.55}));
    const skinMat=kind==='apple'?mats.appleSkin():mats.orangeSkin();
    sectors((a0,a1,fl,am)=>{
      const B={skin:new GB(),face:new GB()};
      revolve(B,pr.pts,a0,a1,secSeg,fl,'skin','face',(r,y)=>[r/pr.R,(y-ymin)/(ymax-ymin)]);
      const g=new THREE.Group();
      g.add(new THREE.Mesh(B.skin.geo(),skinMat));
      if(!B.face.empty())g.add(new THREE.Mesh(B.face.geo(),faceMat));
      return {group:g,dir:fl?new THREE.Vector3():new THREE.Vector3(Math.cos(am),0,-Math.sin(am)),am,top:new THREE.Vector3(Math.cos(am)*pr.R*.45*(fl?0:1),pr.h+.05,-Math.sin(am)*pr.R*.45*(fl?0:1)),size:pr.R};
    });
    // stem + leaf (apple) / navel button (orange) belong to the first piece
    const p0=pieces[0].group;
    if(kind==='apple'){
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,.5,8),mats.stem());
      const sy=APPLE.pts[APPLE.pts.length-1][1];
      stem.position.set(.04,sy+.17,0);stem.rotation.z=-.18;p0.add(stem);
      const leafShape=new THREE.Shape();leafShape.moveTo(0,0);leafShape.quadraticCurveTo(.25,.22,.62,0);leafShape.quadraticCurveTo(.25,-.2,0,0);
      const leaf=new THREE.Mesh(new THREE.ShapeGeometry(leafShape,6),mats.leaf());
      leaf.rotation.x=-Math.PI/2+.25;leaf.position.set(.05,sy+.3,.02);leaf.rotation.z=.25;p0.add(leaf);
      if(n>1)for(const pc of pieces){pc.group.userData.hasStem=pc===pieces[0]}
    }else{
      const sy=ORANGE.pts[ORANGE.pts.length-1][1];
      const nub=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),mats.stem());nub.position.set(0,sy-.02,0);nub.scale.y=.5;p0.add(nub);
    }
  }else if(kind==='pizza'){
    radius=1.55;height=.2;const R=radius;
    const top=mat('pizzaTop',()=>std({map:TX.pizzaTopTex(),roughness:.7}));
    const crust=mat('crust',()=>std({color:0xd79a45,roughness:.85}));
    const inside=mat('pizzaIn',()=>std({color:0xf4dca0,roughness:.9}));
    const uv=(x,z)=>[x/(2*R)+.5,.5+z/(2*R)];
    sectors((a0,a1,fl,am)=>{
      const B={top:new GB(),crust:new GB(),cut:new GB(),rim:new GB(),rimcut:new GB()};
      sectorSolid(B,{r0:0,r1:R,a0,a1,y0:0,y1:.13,seg:secSeg,full:fl,k:{top:'top',bot:'crust',outer:'crust',cut:'cut'},uvTop:uv});
      // raised crust rim
      sectorSolid(B,{r0:R*.9,r1:R,a0,a1,y0:.13,y1:.2,seg:secSeg,full:fl,k:{top:'rim',bot:'rim',outer:'crust',inner:'crust',cut:'rimcut'},uvTop:uv});
      const g=new THREE.Group();
      g.add(new THREE.Mesh(B.top.geo(),top));g.add(new THREE.Mesh(B.crust.geo(),crust));g.add(new THREE.Mesh(B.rim.geo(),crust));
      if(!B.cut.empty())g.add(new THREE.Mesh(B.cut.geo(),inside)),g.add(new THREE.Mesh(B.rimcut.geo(),crust));
      return {group:g,dir:fl?new THREE.Vector3():new THREE.Vector3(Math.cos(am),0,-Math.sin(am)),am,top:new THREE.Vector3(Math.cos(am)*R*.5*(fl?0:1),.3,-Math.sin(am)*R*.5*(fl?0:1)),size:R};
    });
  }else if(kind==='cake'){
    radius=1.35;const R=radius;
    const layers=[['s',.38],['c',.09],['s',.38],['c',.09],['s',.34]];
    const H=layers.reduce((a,l)=>a+l[1],0)+.1;height=H+.25;
    const sponge=mat('sponge',()=>std({color:0xf3d38a,roughness:.9,map:TX.canvasTex(128,128,(g,w,h)=>{const r=TX.rng(3);g.fillStyle='#f6d98f';g.fillRect(0,0,w,h);for(let i=0;i<300;i++){g.fillStyle=`rgba(${200+r()*30|0},${150+r()*30|0},70,.25)`;g.beginPath();g.arc(r()*w,r()*h,1+r()*2.2,0,7);g.fill()}},{repeat:true})}));
    const cream=mat('cream',()=>std({color:0xfff4f0,roughness:.5}));
    const jam=mat('jam',()=>std({color:0xd7263d,roughness:.4}));
    const frost=mat('frost',()=>std({color:0xf48fb1,roughness:.45}));
    const frostTop=mat('frostTop',()=>std({map:TX.cakeTopTex(),roughness:.5}));
    const cherryM=mat('cherry',()=>std({color:0xc4122f,roughness:.2}));
    const uv=(x,z)=>[x/(2*R)+.5,.5+z/(2*R)];
    sectors((a0,a1,fl,am)=>{
      const B={s:new GB(),c:new GB(),sc:new GB(),cc:new GB(),f:new GB(),ft:new GB(),fc:new GB()};
      let y=0;
      layers.forEach(([t,h],li)=>{
        sectorSolid(B,{r0:0,r1:R,a0,a1,y0:y,y1:y+h,seg:secSeg,full:fl,k:t==='s'?{top:'s',bot:'s',outer:'s',cut:'sc'}:{top:'c',bot:'c',outer:'c',cut:'cc'},uvCut:(r,yy)=>[r/R,yy*1.2]});
        y+=h;
      });
      // frosting: slightly wider cap with rounded look
      sectorSolid(B,{r0:0,r1:R+.03,a0,a1,y0:y,y1:y+.1,seg:secSeg,full:fl,k:{top:'ft',bot:'f',outer:'f',cut:'fc'},uvTop:uv});
      const g=new THREE.Group();
      g.add(new THREE.Mesh(B.s.geo(),sponge));g.add(new THREE.Mesh(B.c.geo(),cream));g.add(new THREE.Mesh(B.f.geo(),frost));g.add(new THREE.Mesh(B.ft.geo(),frostTop));
      if(!B.sc.empty()){g.add(new THREE.Mesh(B.sc.geo(),sponge));g.add(new THREE.Mesh(B.cc.geo(),cream));g.add(new THREE.Mesh(B.fc.geo(),frost))}
      // strawberry/cherry
      const cr=fl?0:R*.62;
      const ch=new THREE.Mesh(new THREE.SphereGeometry(.16,14,10),cherryM);ch.position.set(Math.cos(am)*cr,y+.2,-Math.sin(am)*cr);g.add(ch);
      const st=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.2,5),mats.stem());st.position.set(ch.position.x+.02,y+.4,ch.position.z);st.rotation.z=-.3;g.add(st);
      return {group:g,dir:fl?new THREE.Vector3():new THREE.Vector3(Math.cos(am),0,-Math.sin(am)),am,top:new THREE.Vector3(Math.cos(am)*R*.55*(fl?0:1),y+.5,-Math.sin(am)*R*.55*(fl?0:1)),size:R};
    });
  }else if(kind==='disc'){
    radius=1.35;height=.22;const R=radius;
    const m=mat('disc',()=>std({color:0x3b8fe0,roughness:.45}));
    const m2=mat('discTop',()=>std({color:0x5aa8f2,roughness:.4}));
    sectors((a0,a1,fl,am)=>{
      const B={t:new GB(),s:new GB()};
      sectorSolid(B,{r0:0,r1:R,a0,a1,y0:0,y1:.22,seg:secSeg,full:fl,k:{top:'t',bot:'s',outer:'s',cut:'s'}});
      const g=new THREE.Group();g.add(new THREE.Mesh(B.t.geo(),m2));g.add(new THREE.Mesh(B.s.geo(),m));
      return {group:g,dir:fl?new THREE.Vector3():new THREE.Vector3(Math.cos(am),0,-Math.sin(am)),am,top:new THREE.Vector3(Math.cos(am)*R*.5*(fl?0:1),.3,-Math.sin(am)*R*.5*(fl?0:1)),size:R};
    });
  }else{ // boxes: square, rectangle, chocolate
    const def={square:{w:2.5,d:2.5,h:.22,col:0xf0b429,top:0xffc94d},rectangle:{w:3.6,d:1.8,h:.22,col:0x2fb67c,top:0x4fd09a},chocolate:{w:3.4,d:1.7,h:.3,col:0x3a1a0b,top:0}}[kind];
    const {w,d,h}=def;radius=Math.hypot(w,d)/2;height=h;
    // grid: square uses a 2-row grid for 4,6,8,10 ; everything else strips along x
    let cols=n,rows=1;
    if(kind==='square'&&n>=4&&n%2===0){rows=2;cols=n/2}
    const cw=w/cols,cd=d/rows;
    const topM=kind==='chocolate'?mat('chocoTop',()=>std({map:TX.chocoTopTex(),roughness:.35})):mat(kind+'Top',()=>std({color:def.top,roughness:.4}));
    const sideM=kind==='chocolate'?mat('chocoSide',()=>std({color:0x3a1a0b,roughness:.4})):mat(kind+'Side',()=>std({color:def.col,roughness:.45}));
    const geoC=new THREE.BoxGeometry(cw,h,cd);
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const cx=-w/2+cw*(c+.5),cz=-d/2+cd*(r+.5);
      const bg=geoC.clone();bg.translate(cx,h/2,cz);
      const mesh=new THREE.Mesh(bg,[sideM,sideM,topM,sideM,sideM,sideM]); // +x,-x,+y,-y,+z,-z
      const g=new THREE.Group();g.add(mesh);
      const dir=new THREE.Vector3(cx,0,cz);
      pieces.push({group:g,dir:n===1?new THREE.Vector3():dir,am:0,top:new THREE.Vector3(cx,h+.3,cz),size:Math.max(cw,cd)/2,boxCenter:new THREE.Vector3(cx,0,cz)});
    }
  }
  // finalise: shadows, per-piece materials (so highlighting one piece does not affect others)
  pieces.forEach((pc,i)=>{
    pc.group.traverse(o=>{
      if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.pieceIndex=i;
        o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}
    });
  });
  return {pieces,radius,height};
}

/* ---------- 3D shapes ---------- */
export const SHAPES={
  cube:{en:'cube',zh:'立方体',two:{k:'square',en:'square',zh:'正方形'},color:0x4f9cf0,note:{en:'6 square faces',zh:'6个正方形的面'}},
  cuboid:{en:'cuboid',zh:'长方体',two:{k:'rectangle',en:'rectangle',zh:'长方形'},color:0xf59a3c,note:{en:'6 rectangle faces',zh:'6个长方形的面'}},
  sphere:{en:'sphere',zh:'球体',two:{k:'circle',en:'circle',zh:'圆形'},color:0xe9568b,note:{en:'perfectly round',zh:'圆滚滚的'}},
  cylinder:{en:'cylinder',zh:'圆柱体',two:{k:'circle',en:'circle',zh:'圆形'},color:0x35b58a,note:{en:'top and bottom are circles',zh:'上下两个面是圆形'}},
  cone:{en:'cone',zh:'圆锥体',two:{k:'circle',en:'circle',zh:'圆形'},color:0xf2c230,note:{en:'the flat base is a circle',zh:'底面是圆形'}},
  pyramid:{en:'pyramid',zh:'棱锥',two:{k:'triangle',en:'triangle',zh:'三角形'},color:0x8a6fd6,note:{en:'4 triangle sides, square base',zh:'4个三角形的侧面，底面是正方形'}},
  triprism:{en:'triangular prism',zh:'三棱柱',two:{k:'triangle',en:'triangle',zh:'三角形'},color:0xe0566a,note:{en:'two triangle ends',zh:'两头是三角形'}},
};
export function buildShape(kind){
  const s=SHAPES[kind];let geo;
  switch(kind){
    case 'cube':geo=new THREE.BoxGeometry(1.4,1.4,1.4);break;
    case 'cuboid':geo=new THREE.BoxGeometry(2.3,.95,1.3);break;
    case 'sphere':geo=new THREE.SphereGeometry(.82,40,28);break;
    case 'cylinder':geo=new THREE.CylinderGeometry(.68,.68,1.6,40);break;
    case 'cone':geo=new THREE.CylinderGeometry(0,.85,1.7,40,1);break;
    case 'pyramid':geo=new THREE.ConeGeometry(1.0,1.55,4,1);geo.rotateY(Math.PI/4);break;
    case 'triprism':geo=new THREE.CylinderGeometry(.95,.95,2.1,3);geo.rotateZ(Math.PI/2);geo.rotateX(-Math.PI/2);break;
  }
  geo.computeBoundingBox();geo.translate(0,-geo.boundingBox.min.y,0);geo.computeBoundingBox();
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:s.color,roughness:.35,metalness:.02,flatShading:kind==='pyramid'||kind==='triprism'}));
  m.castShadow=m.receiveShadow=true;
  const g=new THREE.Group();g.add(m);
  if(kind!=='sphere'){
    const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,25),new THREE.LineBasicMaterial({color:0x2a2350,transparent:true,opacity:.28}));g.add(e);
  }
  const bb=geo.boundingBox;
  return {group:g,mesh:m,radius:Math.max(bb.max.x,bb.max.z,-bb.min.x,-bb.min.z)*1.05,height:bb.max.y,half:Math.max(bb.max.x,-bb.min.x)};
}
export function build2D(kind,color){
  const sh=new THREE.Shape();let half=.8;
  if(kind==='square'){half=.75;sh.moveTo(-.75,-.75);sh.lineTo(.75,-.75);sh.lineTo(.75,.75);sh.lineTo(-.75,.75);sh.closePath()}
  else if(kind==='rectangle'){half=1.15;sh.moveTo(-1.15,-.6);sh.lineTo(1.15,-.6);sh.lineTo(1.15,.6);sh.lineTo(-1.15,.6);sh.closePath()}
  else if(kind==='circle'){half=.85;sh.absarc(0,0,.85,0,TAU,false)}
  else{half=1.0;const h=1.7;sh.moveTo(-1,-h/3);sh.lineTo(1,-h/3);sh.lineTo(0,h*2/3);sh.closePath()}
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false,curveSegments:32});
  geo.rotateX(-Math.PI/2);
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.5}));
  m.castShadow=m.receiveShadow=true;
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,25),new THREE.LineBasicMaterial({color:0x2a2350,transparent:true,opacity:.45}));
  const g=new THREE.Group();g.add(m);g.add(e);
  return {group:g,half};
}

/* ---------- blocks + balls ---------- */
export const BLOCK=1.1;
export function buildBlock(color){
  const geo=new THREE.BoxGeometry(BLOCK,BLOCK,BLOCK);geo.translate(0,BLOCK/2,0);
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.4}));
  m.castShadow=m.receiveShadow=true;
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:.18}));
  const g=new THREE.Group();g.add(m);g.add(e);return {group:g,mesh:m};
}
export const BALL_R=.58;
const css=c=>typeof c==='number'?'#'+c.toString(16).padStart(6,'0'):c;
export function buildBall(c1,c2){
  const m=new THREE.Mesh(new THREE.SphereGeometry(BALL_R,36,26),new THREE.MeshStandardMaterial({map:TX.ballTex(css(c1),css(c2)),roughness:.35}));
  m.castShadow=m.receiveShadow=true;
  const g=new THREE.Group();m.position.y=BALL_R;g.add(m);return {group:g,mesh:m};
}
