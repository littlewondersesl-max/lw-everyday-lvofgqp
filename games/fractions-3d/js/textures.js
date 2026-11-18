// Procedural canvas textures (no image files).
import * as THREE from 'three';

export function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
export function canvasTex(w,h,draw,opts={}){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);t.colorSpace=opts.linear?THREE.NoColorSpace:THREE.SRGBColorSpace;
  t.anisotropy=4;if(opts.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping}
  return t;
}

export function woodTex(){
  return canvasTex(1024,512,(g,w,h)=>{
    const r=rng(7);
    const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#d9a066');gr.addColorStop(.5,'#cf9459');gr.addColorStop(1,'#d89f64');
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(let i=0;i<260;i++){
      const y=r()*h,a=.05+r()*.1;g.strokeStyle=r()<.5?`rgba(120,70,30,${a})`:`rgba(255,225,170,${a})`;
      g.lineWidth=.6+r()*2.2;g.beginPath();g.moveTo(0,y);
      for(let x=0;x<=w;x+=64)g.lineTo(x,y+Math.sin(x*.012+i)*3+(r()-.5)*2);
      g.stroke();
    }
    // plank seams
    g.strokeStyle='rgba(90,50,20,.35)';g.lineWidth=2;
    for(const y of [h/3,2*h/3]){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}
  },{repeat:true});
}

export function floorTex(){
  return canvasTex(256,256,(g,w,h)=>{g.fillStyle='#ece4f4';g.fillRect(0,0,w,h)});
}

// Apple skin: u around, v bottom->top
export function appleSkinTex(){
  return canvasTex(512,256,(g,w,h)=>{
    const r=rng(11);
    g.fillStyle='#c9302c';g.fillRect(0,0,w,h);
    for(let i=0;i<420;i++){
      const x=r()*w,len=40+r()*160,y=r()*h;
      const t=r();g.strokeStyle=t<.45?`rgba(235,75,55,${.18+r()*.2})`:t<.8?`rgba(140,20,25,${.15+r()*.2})`:`rgba(235,200,70,${.1+r()*.16})`;
      g.lineWidth=2+r()*7;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*10,y+len);g.stroke();
    }
    // yellow-green blush near the top
    const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'rgba(210,190,60,0)');gr.addColorStop(.9,'rgba(210,190,60,0)');gr.addColorStop(1,'rgba(190,200,70,.55)');
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(let i=0;i<160;i++){g.fillStyle='rgba(255,230,160,.5)';g.beginPath();g.arc(r()*w,r()*h,.8+r()*1.2,0,7);g.fill()}
  });
}
// Flesh of an apple cut through the core. Canvas x = r (0..1 of rmax), y = height (bottom..top)
export function appleFleshTex(profile,rmax,ymin,ymax){
  return canvasTex(512,512,(g,w,h)=>{
    const X=r=>r/rmax*w,Y=y=>h-(y-ymin)/(ymax-ymin)*h;
    g.fillStyle='#fbf0c4';g.fillRect(0,0,w,h);
    const gr=g.createRadialGradient(0,h/2,10,0,h/2,w);gr.addColorStop(0,'#f1dc9a');gr.addColorStop(.35,'#f7e8b0');gr.addColorStop(1,'#fcf5d3');
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    const r=rng(5);
    for(let i=0;i<500;i++){g.fillStyle=`rgba(210,170,80,${.03+r()*.05})`;g.fillRect(r()*w,r()*h,1,6+r()*10)}
    // core: pointed oval along the axis
    const cy=Y((ymin+ymax)/2),ch=h*.36,cw=w*.2;
    g.save();g.beginPath();
    g.moveTo(0,cy-ch);g.bezierCurveTo(cw*1.3,cy-ch*.7,cw*1.3,cy+ch*.7,0,cy+ch);g.closePath();
    g.fillStyle='#ecd48e';g.fill();g.lineWidth=5;g.strokeStyle='#c9a45a';g.stroke();
    g.lineWidth=2;g.strokeStyle='rgba(150,110,50,.55)';g.beginPath();g.moveTo(0,cy-ch*.9);g.bezierCurveTo(cw*.8,cy-ch*.5,cw*.8,cy+ch*.5,0,cy+ch*.9);g.stroke();
    g.restore();
    // seeds
    for(const dy of [-.33,.33]){
      g.save();g.translate(cw*.42,cy+dy*ch);g.rotate(dy>0?-.15:.15);
      g.beginPath();g.moveTo(0,-ch*.2);g.bezierCurveTo(cw*.24,-ch*.1,cw*.2,ch*.14,0,ch*.2);g.bezierCurveTo(-cw*.2,ch*.14,-cw*.24,-ch*.1,0,-ch*.2);
      g.fillStyle='#4a2a14';g.fill();g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.ellipse(-cw*.05,-ch*.06,cw*.04,ch*.07,0,0,7);g.fill();g.restore();
    }
    // skin edge along the profile
    g.lineJoin='round';g.lineWidth=11;g.strokeStyle='#b4281f';g.beginPath();
    profile.forEach(([pr,py],i)=>{i?g.lineTo(X(pr),Y(py)):g.moveTo(X(pr),Y(py))});g.stroke();
    g.lineWidth=4;g.strokeStyle='#efe3a0';g.beginPath();
    profile.forEach(([pr,py],i)=>{const px=X(pr)-9;i?g.lineTo(px,Y(py)):g.moveTo(px,Y(py))});g.stroke();
  });
}
export function orangeSkinTex(){
  const mk=(bump)=>canvasTex(512,256,(g,w,h)=>{
    const r=rng(21);
    g.fillStyle=bump?'#808080':'#f08a12';g.fillRect(0,0,w,h);
    for(let i=0;i<3600;i++){
      const x=r()*w,y=r()*h,s=.8+r()*1.8;
      g.fillStyle=bump?(r()<.5?'rgba(40,40,40,.6)':'rgba(225,225,225,.6)'):(r()<.5?'rgba(210,100,0,.35)':'rgba(255,190,70,.3)');
      g.beginPath();g.arc(x,y,s,0,7);g.fill();
    }
  },{linear:bump});
  return {map:mk(false),bump:mk(true)};
}
export function orangeFleshTex(profile,rmax,ymin,ymax){
  return canvasTex(512,512,(g,w,h)=>{
    const X=r=>r/rmax*w,Y=y=>h-(y-ymin)/(ymax-ymin)*h;
    const cy=Y((ymin+ymax)/2);
    g.fillStyle='#f6a31e';g.fillRect(0,0,w,h);
    const gr=g.createRadialGradient(0,cy,10,0,cy,w*1.05);gr.addColorStop(0,'#ffd980');gr.addColorStop(.25,'#ffb938');gr.addColorStop(1,'#f08a12');
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    const r=rng(9);
    for(let i=0;i<700;i++){g.fillStyle=`rgba(255,${200+r()*40|0},110,${.05+r()*.1})`;const a=r()*Math.PI-Math.PI/2,d=20+r()*w;g.fillRect(Math.cos(a)*d,cy+Math.sin(a)*d,2,8)}
    // segment walls radiating from the centre
    g.strokeStyle='rgba(255,246,220,.95)';g.lineCap='round';
    for(let k=0;k<=6;k++){const a=-Math.PI/2+k*Math.PI/6;g.lineWidth=5;g.beginPath();g.moveTo(0,cy);g.lineTo(Math.cos(a)*w*1.2,cy+Math.sin(a)*w*1.2);g.stroke()}
    g.fillStyle='#fff3cf';g.beginPath();g.arc(0,cy,w*.045,0,7);g.fill();
    // pith + rind along the profile
    g.lineJoin='round';
    g.lineWidth=26;g.strokeStyle='#f08a12';g.beginPath();profile.forEach(([pr,py],i)=>{i?g.lineTo(X(pr),Y(py)):g.moveTo(X(pr),Y(py))});g.stroke();
    g.lineWidth=13;g.strokeStyle='#fff1c7';g.beginPath();profile.forEach(([pr,py],i)=>{const px=X(pr)-17;i?g.lineTo(px,Y(py)):g.moveTo(px,Y(py))});g.stroke();
  });
}

// Pizza top: planar map of the whole disc (crust ring, sauce, cheese, toppings)
export function pizzaTopTex(){
  return canvasTex(1024,1024,(g,w,h)=>{
    const c=w/2,R=w/2,r=rng(31);
    g.fillStyle='#b9772b';g.beginPath();g.arc(c,c,R,0,7);g.fill();             // crust
    const gr=g.createRadialGradient(c,c,R*.7,c,c,R);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(90,45,10,.35)');
    g.fillStyle=gr;g.beginPath();g.arc(c,c,R,0,7);g.fill();
    for(let i=0;i<600;i++){g.fillStyle=r()<.5?'rgba(235,170,80,.5)':'rgba(120,60,15,.35)';const a=r()*7,d=R*(.86+r()*.13);g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,2+r()*4,0,7);g.fill()}
    g.fillStyle='#c93a24';g.beginPath();g.arc(c,c,R*.84,0,7);g.fill();             // sauce
    g.fillStyle='#f6c64f';g.beginPath();g.arc(c,c,R*.8,0,7);g.fill();             // cheese
    for(let i=0;i<70;i++){const a=r()*7,d=Math.sqrt(r())*R*.78;g.fillStyle=r()<.5?'rgba(255,225,120,.7)':'rgba(240,170,50,.55)';g.beginPath();g.ellipse(c+Math.cos(a)*d,c+Math.sin(a)*d,18+r()*34,10+r()*20,r()*3,0,7);g.fill()}
    const pts=[];
    for(let i=0;i<13;i++){let ok=0,x,y;for(let t=0;t<40&&!ok;t++){const a=r()*7,d=Math.sqrt(r())*R*.66;x=c+Math.cos(a)*d;y=c+Math.sin(a)*d;ok=pts.every(p=>Math.hypot(p[0]-x,p[1]-y)>R*.2)}pts.push([x,y])}
    for(const [x,y] of pts){ // pepperoni
      g.fillStyle='#b3261e';g.beginPath();g.arc(x,y,R*.085,0,7);g.fill();
      g.fillStyle='#8c1a14';for(let k=0;k<6;k++){g.beginPath();g.arc(x+(r()-.5)*R*.09,y+(r()-.5)*R*.09,3+r()*4,0,7);g.fill()}
      g.strokeStyle='rgba(255,170,120,.5)';g.lineWidth=3;g.beginPath();g.arc(x,y,R*.085,0,7);g.stroke();
    }
    for(let i=0;i<9;i++){const a=r()*7,d=Math.sqrt(r())*R*.7,x=c+Math.cos(a)*d,y=c+Math.sin(a)*d; // olives
      g.fillStyle='#2b2b2b';g.beginPath();g.arc(x,y,R*.03,0,7);g.fill();g.fillStyle='#e8d9a0';g.beginPath();g.arc(x,y,R*.012,0,7);g.fill()}
    for(let i=0;i<10;i++){const a=r()*7,d=Math.sqrt(r())*R*.7,x=c+Math.cos(a)*d,y=c+Math.sin(a)*d; // basil
      g.save();g.translate(x,y);g.rotate(r()*7);g.fillStyle='#2f8f3a';g.beginPath();g.ellipse(0,0,R*.05,R*.026,0,0,7);g.fill();g.restore()}
  });
}
export function cakeTopTex(){
  return canvasTex(1024,1024,(g,w,h)=>{
    const c=w/2,R=w/2,r=rng(41);
    g.fillStyle='#f6a6c4';g.fillRect(0,0,w,h);
    const gr=g.createRadialGradient(c,c,R*.1,c,c,R);gr.addColorStop(0,'#ffd0e1');gr.addColorStop(1,'#f08fb4');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=14;g.lineCap='round';
    for(let k=0;k<18;k++){const a=k/18*Math.PI*2;g.beginPath();g.arc(c+Math.cos(a)*R*.86,c+Math.sin(a)*R*.86,R*.075,0,7);g.stroke()}
    const cols=['#ffd93b','#4fc3f7','#7bd66a','#ffffff','#b388ff','#ff8a65'];
    for(let i=0;i<260;i++){const a=r()*7,d=Math.sqrt(r())*R*.95;g.save();g.translate(c+Math.cos(a)*d,c+Math.sin(a)*d);g.rotate(r()*7);g.fillStyle=cols[i%cols.length];g.fillRect(-9,-3,18,6);g.restore()}
  });
}
export function chocoTopTex(){
  return canvasTex(512,256,(g,w,h)=>{
    g.fillStyle='#4a2512';g.fillRect(0,0,w,h);
    const m=22;
    g.fillStyle='#3a1a0b';g.fillRect(m-6,m-6,w-2*m+12,h-2*m+12);
    const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#6a3a1e');gr.addColorStop(1,'#4a2512');
    g.fillStyle=gr;g.fillRect(m,m,w-2*m,h-2*m);
    g.strokeStyle='rgba(255,210,170,.5)';g.lineWidth=5;g.beginPath();g.moveTo(m,h-m);g.lineTo(m,m);g.lineTo(w-m,m);g.stroke();
    g.strokeStyle='rgba(0,0,0,.5)';g.beginPath();g.moveTo(w-m,m);g.lineTo(w-m,h-m);g.lineTo(m,h-m);g.stroke();
    g.fillStyle='rgba(255,230,200,.10)';g.beginPath();g.ellipse(w*.3,h*.3,w*.22,h*.12,-.3,0,7);g.fill();
  });
}
export function ballTex(c1,c2){
  return canvasTex(512,256,(g,w,h)=>{
    const n=6;
    for(let i=0;i<n;i++){g.fillStyle=i%2?c2:c1;g.fillRect(i*w/n,0,w/n+1,h)}
    g.fillStyle='#ffffff';g.fillRect(0,0,w,h*.06);g.fillRect(0,h*.94,w,h*.06);
    g.fillStyle='rgba(255,255,255,.9)';
    for(let i=0;i<n;i++){const x=(i+.5)*w/n;g.beginPath();g.arc(x,h*.5,h*.075,0,7);g.fill()}
  });
}
export function turntableTopTex(){
  return canvasTex(512,512,(g,w,h)=>{
    const c=w/2;
    g.fillStyle='#e8e2f3';g.beginPath();g.arc(c,c,c,0,7);g.fill();
    for(let k=0;k<12;k++){g.fillStyle=k%2?'#d6cbec':'#efe9f8';g.beginPath();g.moveTo(c,c);g.arc(c,c,c*.96,k*Math.PI/6,(k+1)*Math.PI/6);g.closePath();g.fill()}
    g.fillStyle='#ff7aa8';g.beginPath();g.moveTo(c,c);g.arc(c,c,c*.96,-.12,.12);g.closePath();g.fill();     // marker wedge (shows the spin)
    g.fillStyle='#6c4ea0';g.beginPath();g.arc(c,c,c*.07,0,7);g.fill();
    g.strokeStyle='#6c4ea0';g.lineWidth=8;g.beginPath();g.arc(c,c,c*.96,0,7);g.stroke();
  });
}

// Floating word labels (sprites)
export function labelCanvas(lines,opt={}){
  const font=opt.font||"900 64px Nunito,'Baloo 2',system-ui,sans-serif",zfont="800 44px 'PingFang SC','Microsoft YaHei','Noto Sans SC','Noto Sans CJK SC',sans-serif";
  const c=document.createElement('canvas');const g=c.getContext('2d');
  g.font=font;let w=g.measureText(lines[0]).width;
  if(lines[1]){g.font=zfont;w=Math.max(w,g.measureText(lines[1]).width)}
  const padX=40,padY=26,h1=opt.small?60:76,h2=lines[1]?58:0;
  c.width=Math.ceil(w+padX*2);c.height=h1+h2+padY*2-8;
  const x=c.width/2;
  const col=opt.color||'#6c4ea0';
  g.fillStyle='rgba(255,255,255,.95)';g.strokeStyle=col;g.lineWidth=8;
  const r=34,W=c.width-8,H=c.height-8;g.beginPath();g.roundRect(4,4,W,H,r);g.fill();g.stroke();
  g.textAlign='center';g.textBaseline='middle';
  g.font=font;g.fillStyle=col;g.fillText(lines[0],x,padY+h1/2-4);
  if(lines[1]){g.font=zfont;g.fillStyle='#4a5a7a';g.fillText(lines[1],x,padY+h1+h2/2-8)}
  return c;
}
