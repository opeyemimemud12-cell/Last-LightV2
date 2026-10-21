/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 11/14: p11-planet.js
   SPHERICAL PLANET SURFACES — planet-centric geo math, chunked
   terrain that conforms to the true sphere, directional gravity,
   floating-origin rebases (walk around entire planets), atmosphere
   clouds / dust / entry heat, persistent build flattening.
   Replaces the legacy flat 1600m terrain patch (FIRMWARE 15).
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 10 — SPHERICAL PLANETS ====================*/
const S2V1=new THREE.Vector3(),S2V2=new THREE.Vector3(),S2V3=new THREE.Vector3(),
 S2V4=new THREE.Vector3(),S2V5=new THREE.Vector3(),S2Q1=new THREE.Quaternion(),
 S2Q2=new THREE.Quaternion(),S2YAX=new THREE.Vector3(0,1,0);
const SURF2={on:false,Rm:6.4e6,body:null,th:0,atmH:9000,anchor:V3(0,1,0),eBF:V3(1,0,0),zBF:V3(0,0,1),
 apW:V3(),hA:0,exitAlt:9000,RBASE:300,g0x:0,g0z:0,fx:0,fz:0,epoch:0,cells:new Map(),
 flats:[],rocks:null,clouds:null,dust:null,dustG:null,heatEl:null,heat:0,
 ampC:100,ampM:200,detA:12,n:null,n2:null,n3:null,n4:null,wl:null,cellMat:null};
function sstep(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
function sur2BasisBF(dir,e,z){ /* body-frame east/zenith for a unit dir (planet axis = +Y) */
 e.set(dir.z,0,-dir.x);
 if(e.lengthSq()<1e-6)e.set(1,0,0);
 e.normalize();
 z.crossVectors(e,dir).normalize();}
function sur2DirAt(x,z,out){ /* body-frame unit dir under ENU point (x,z) — central projection */
 out.copy(SURF2.anchor).multiplyScalar(SURF2.Rm+SURF2.hA);
 out.addScaledVector(SURF2.eBF,x).addScaledVector(SURF2.zBF,z);
 return out.normalize();}
function sur2HBase(d){ /* deterministic terrain height above the sphere (body seed) */
 const S=SURF2;
 let h=(fbm3(S.n,d.x*3,d.y*3,d.z*3,4)-.5)*2*S.ampC;
 const pm=sstep(.40,.62,fbm3(S.n4,d.x*2.5,d.y*2.5,d.z*2.5,3));
 const r=Math.max(0,fbm3(S.n2,d.x*9,d.y*9,d.z*9,4)-.5)*2;
 h+=Math.pow(r,1.6)*S.ampM*pm;
 h+=(fbm3(S.n3,d.x*42,d.y*42,d.z*42,3)-.5)*2*S.detA;
 return h;}
function sur2H(d){ /* + build flattening (derived from live build list — persists via builds) */
 const h=sur2HBase(d),F=SURF2.flats;
 if(!F.length)return h;
 const R=SURF2.Rm;
 for(let i=0;i<F.length;i++){const f=F[i];
  const ad=Math.acos(clamp(d.dot(f.d),-1,1))*R;
  if(ad<f.r*1.6)return h*sstep(f.r*.7,f.r*1.4,ad)+f.h*(1-sstep(f.r*.7,f.r*1.4,ad));}
 return h;}
function sur2ENU(dirBF,altAbove,out){ /* ENU position of sphere point (dir, metres above terrain) */
 const h=sur2H(dirBF);
 out.copy(dirBF).applyAxisAngle(S2YAX,SURF2.th).multiplyScalar(SURF2.Rm+h+altAbove).sub(SURF2.apW);
 return out.set(out.dot(LF.east),out.dot(LF.up),out.dot(LF.zn));}
function sur2GroundY(x,z){
 const d=sur2DirAt(x,z,S2V1);
 const h=sur2H(d);
 S2V2.copy(d).applyAxisAngle(S2YAX,SURF2.th).multiplyScalar(SURF2.Rm+h).sub(SURF2.apW);
 return S2V2.dot(LF.up);}
function sur2UpAt(x,z,out){return sur2DirAt(x,z,out).applyAxisAngle(S2YAX,SURF2.th);}
function sur2AltM(p){ /* radial altitude above terrain of an ENU point */
 const d=sur2DirAt(p.x,p.z,S2V1);
 S2V2.copy(LF.east).multiplyScalar(p.x).addScaledVector(LF.up,p.y).addScaledVector(LF.zn,p.z).add(SURF2.apW);
 return S2V2.length()-SURF2.Rm-sur2H(d);}
function sur2BasisQAt(dirW,q){ /* quaternion orienting local +Y to dirW, +X east */
 const e=S2V4.set(dirW.z,0,-dirW.x);
 if(e.lengthSq()<1e-6)e.set(1,0,0);
 e.normalize();
 const zn=S2V5.crossVectors(e,dirW).normalize();
 TMQ.setFromRotationMatrix(TMM.makeBasis(e,dirW,zn));
 return q.copy(TMQ);}
/* ---------- terrain cells ---------- */
const CELL_LOD=[{S:64,r:2,res:20},{S:128,r:5,res:12},{S:512,r:7,res:10},{S:2048,r:3,res:8}];
function cellKey(d){return Math.round(d.x*2e5)+'_'+Math.round(d.y*2e5)+'_'+Math.round(d.z*2e5);}
function sur2GenCell(L,ci,cj){
 const lod=CELL_LOD[L],S=lod.S,R=lod.res;
 const cx=SURF2.g0x+ci*S+S/2,cz=SURF2.g0z+cj*S+S/2;
 const n=R+1;
 const pos=new Float32Array(n*n*3),col=new Float32Array(n*n*3);
 const cC=sur2DirAt(cx,cz,S2V1).clone();
 const P=PAL[SURF2.body.pal];
 const c0=hxc(P.tg[0]),c1=hxc(P.tg[1]),c2=hxc(P.tg[2]),c3=hxc(P.tg[3]);
 const mn=SURF2.wl!==null?SURF2.wl-2:-S.ampC*.4,mx=S.ampC*1.15+SURF2.ampM*.9;
 const d=new THREE.Vector3(),w=new THREE.Vector3();
 let minH=1e9;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const gx=cx-S/2+i*(S/R),gz=cz-S/2+j*(S/R);
  sur2DirAt(gx,gz,d);
  const h=sur2H(d);
  if(h<minH)minH=h;
  w.copy(d).applyAxisAngle(S2YAX,SURF2.th).multiplyScalar(SURF2.Rm+h).sub(SURF2.apW);
  const k=(j*n+i)*3;
  pos[k]=w.dot(LF.east)-cx;pos[k+1]=w.dot(LF.up);pos[k+2]=w.dot(LF.zn)-cz;
  const t=clamp((h-mn)/((mx-mn)||1),0,1);
  let r,g,b;
  if(t<.33){const u=t/.33;r=lerp(c0[0],c1[0],u);g=lerp(c0[1],c1[1],u);b=lerp(c0[2],c1[2],u);}
  else if(t<.66){const u=(t-.33)/.33;r=lerp(c1[0],c2[0],u);g=lerp(c1[1],c2[1],u);b=lerp(c1[2],c2[2],u);}
  else{const u=(t-.66)/.34;r=lerp(c2[0],c3[0],u);g=lerp(c2[1],c3[1],u);b=lerp(c2[2],c3[2],u);}
  const sh=.55+clamp(t,0,1)*.45;
  col[k]=r*sh;col[k+1]=g*sh;col[k+2]=b*sh;}
 const idx=[];
 for(let j=0;j<R;j++)for(let i=0;i<R;i++){const a=j*n+i,b2=a+1,c2=a+n,d2=a+n+1;idx.push(a,c2,b2,b2,c2,d2);}
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 geo.setAttribute('color',new THREE.BufferAttribute(col,3));
 geo.setIndex(idx);geo.computeVertexNormals();
 if(!SURF2.cellMat)SURF2.cellMat=new THREE.MeshLambertMaterial({vertexColors:true});
 const mesh=new THREE.Mesh(geo,SURF2.cellMat);
 mesh.userData={cx,cz,cC,minH,rb:1};
 if(SURF2.wl!==null&&minH<SURF2.wl+1){
  const wm=new THREE.Mesh(new THREE.PlaneGeometry(S*1.04,S*1.04),
   new THREE.MeshLambertMaterial({color:new THREE.Color(P.sea),transparent:true,opacity:.82}));
  wm.rotation.x=-Math.PI/2;wm.position.y=SURF2.wl;mesh.add(wm);}
 return {mesh,L};}
function sur2EnsureCells(budget){
 if(!SURF2.on)return;
 let made=0;
 for(let L=0;L<CELL_LOD.length;L++){
  const lod=CELL_LOD[L];
  if(L===3&&(SURF2.Rm<2e5||(SET.q||'high')==='potato'||(SET.q||'high')==='low'))continue;
  const pi=Math.round((SURF2.fx-SURF2.g0x)/lod.S),pj=Math.round((SURF2.fz-SURF2.g0z)/lod.S);
  const prevCov=L>0?CELL_LOD[L-1].S*(CELL_LOD[L-1].r+.5):0;
  const list=[];
  for(let dj=-lod.r;dj<=lod.r;dj++)for(let di=-lod.r;di<=lod.r;di++){
   const d2=di*di+dj*dj;
   if(d2>lod.r*lod.r+1)continue;
   if(L>0&&Math.abs(di*lod.S)<prevCov-lod.S*.6&&Math.abs(dj*lod.S)<prevCov-lod.S*.6)continue;
   list.push({di:pi+di,dj:pj+dj,d:d2});}
  list.sort((a,b2)=>a.d-b2.d);
  for(const it of list){
   const cx=SURF2.g0x+it.di*lod.S+lod.S/2,cz=SURF2.g0z+it.dj*lod.S+lod.S/2;
   const key=cellKey(sur2DirAt(cx,cz,S2V1))+'_'+L;
   let c=SURF2.cells.get(key);
   if(!c){
    if(made>=budget)return;
    c=sur2GenCell(L,it.di,it.dj);
    SURF2.cells.set(key,c);SURFG.add(c.mesh);made++;}
   else if(!c.mesh.parent)SURFG.add(c.mesh);}}
 if(SURF2.cells.size>150){
  for(const [k,c] of SURF2.cells){
   const u=c.mesh.userData;
   if(Math.hypot(u.cx-SURF2.fx,u.cz-SURF2.fz)>CELL_LOD[2].S*CELL_LOD[2].r*1.45){
    SURFG.remove(c.mesh);
    c.mesh.geometry.dispose();
    for(const ch of c.mesh.children)ch.geometry.dispose();
    SURF2.cells.delete(k);
    if(SURF2.cells.size<=120)break;}}}}
function sur2Rocks(){
 if(!SURF2.rocks){
  SURF2.rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),
   new THREE.MeshLambertMaterial({color:new THREE.Color(PAL[SURF2.body.pal].tg[1])}),220);
  SURF2.rocks.userData.rb=1;SURFG.add(SURF2.rocks);}
 const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),SC=V3(1,1,1),PP=V3(0,0,0);
 const base=Math.floor(SURF2.epoch*7919);
 for(let i=0;i<220;i++){
  const h1=(Math.sin((base+i)*12.9898)*43758.5453)%1,h2=(Math.sin((base+i)*78.233)*12543.211)%1;
  const a=h1*6.2832,dd=40+Math.abs(h2)*420;
  const x=Math.cos(a)*dd,z=Math.sin(a)*dd;
  PP.set(x,sur2GroundY(x,z),z);
  Q.setFromEuler(new THREE.Euler(h1*6.3,h2*6.3,h1*3.1));
  const s=.4+Math.abs(h1*h2)*2.4;SC.set(s,s*(.5+Math.abs(h2)),s);
  M4.compose(PP,Q,SC);SURF2.rocks.setMatrixAt(i,M4);}
 SURF2.rocks.instanceMatrix.needsUpdate=true;}
/* ---------- clouds / dust / heat overlay ---------- */
const S2CLOUD_FS='uniform float uT,uCov,uOp;uniform vec3 uSun;varying vec3 vP;'+
'float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}'+
'float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);'+
'return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),'+
'mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}'+
'float fb(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}'+
'void main(){vec3 d=normalize(vP);'+
'float c=fb(d*7.+vec3(uT*.012,uT*.005,0.));c=smoothstep(1.-uCov,1.-uCov*.35,c);'+
'float li=max(dot(d,normalize(uSun)),0.);'+
'vec3 col=mix(vec3(.55,.58,.66),vec3(1.04,1.0,.94),pow(li,.6));'+
'gl_FragColor=vec4(col,c*uOp);}';
function sur2Sky(){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(139000,32,20),
  new THREE.ShaderMaterial({vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,
  uniforms:{uTop:{value:new THREE.Color(.05,.08,.16)},uHor:{value:new THREE.Color(.1,.12,.18)},
   uSun:{value:V3(0,1,0)},uSunC:{value:new THREE.Color(1,.95,.85)}}}));
 sky.renderOrder=-5;sky.frustumCulled=false;sky.userData.rb=2;SURFG.add(sky);TER.sky=sky;
 const cl=new THREE.Mesh(new THREE.SphereGeometry(132000,24,16),
  new THREE.ShaderMaterial({vertexShader:SKY_VS,fragmentShader:S2CLOUD_FS,side:THREE.BackSide,
   transparent:true,depthWrite:false,
   uniforms:{uT:{value:0},uCov:{value:.5},uOp:{value:.85},uSun:{value:V3(0,1,0)}}}));
 cl.renderOrder=-4;cl.frustumCulled=false;cl.userData.rb=2;
 if((SET.q||'high')==='potato'||(SET.q||'high')==='low')cl.visible=false;
 SURFG.add(cl);SURF2.clouds=cl;
 const N=2600,pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){const th=rnd(0,6.3),ph=Math.acos(rnd(-1,1));
  pos[i*3]=Math.sin(ph)*Math.cos(th)*128000;pos[i*3+1]=Math.cos(ph)*128000;pos[i*3+2]=Math.sin(ph)*Math.sin(th)*128000;}
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const stars=new THREE.Points(sg,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,color:0xdfe8ff,transparent:true,opacity:1,depthWrite:false}));
 stars.renderOrder=-3;stars.frustumCulled=false;stars.userData.rb=2;SURFG.add(stars);TER.stars=stars;
 TER.sun=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
 TER.sun.scale.setScalar(11000);TER.sun.renderOrder=-2;SURFG.add(TER.sun);
 TER.sun2=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffe8c0,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
 TER.sun2.scale.setScalar(42000);TER.sun2.renderOrder=-2;SURFG.add(TER.sun2);
 const dg=new THREE.Group();
 const dn=140,dp=new Float32Array(dn*3);
 for(let i=0;i<dn;i++){dp[i*3]=rnd(-16,16);dp[i*3+1]=rnd(-1,9);dp[i*3+2]=rnd(-16,16);}
 const dgeo=new THREE.BufferGeometry();dgeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
 const dust=new THREE.Points(dgeo,new THREE.PointsMaterial({color:0xcfc4a8,size:.06,transparent:true,opacity:.4,depthWrite:false}));
 dg.add(dust);dg.userData.rb=2;SURF2.dust=dust;SURF2.dustG=dg;SURFG.add(dg);
 if(!SURF2.heatEl){
  const h=document.createElement('div');h.id='heat';
  h.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;'+
   'background:radial-gradient(ellipse at 50% 62%,rgba(255,60,0,0) 38%,rgba(255,90,10,.55) 78%,rgba(255,200,80,.92) 100%);'+
   'transition:opacity .25s';
  document.body.appendChild(h);SURF2.heatEl=h;}}
/* ---------- enter / rebase / tick ---------- */
function sur2Enter(bd,dirBF){
 SURF2.on=true;SURF2.body=bd;
 SURF2.Rm=Math.max(400,bd.r*US*8000);
 SURF2.anchor.copy(dirBF).normalize();
 sur2BasisBF(SURF2.anchor,SURF2.eBF,SURF2.zBF);
 const P=PAL[bd.pal];
 const sc=clamp(SURF2.Rm/3.2e6,.3,2.5);
 SURF2.ampC=(P.amp||14)*8*sc;SURF2.ampM=(P.amp||14)*14*sc;SURF2.detA=(P.amp||14)*.8;
 SURF2.wl=P.sea?-SURF2.ampC*.30:null;
 SURF2.atmH=bd.at?bd.at*1000:((P.atI||0)>.05?8000:0);
 SURF2.exitAlt=SURF2.Rm<6000?SURF2.Rm*.8:clamp(SURF2.atmH*.25,1500,2400);
 bd._atm=(P.atI||0)>.05?1:0;
 SURF2.n=mkn3(hashId(bd.id)+11);SURF2.n2=mkn3(hashId(bd.id)+37);
 SURF2.n3=mkn3(hashId(bd.id)+91);SURF2.n4=mkn3(hashId(bd.id)+53);
 SURF2.hA=sur2HBase(SURF2.anchor);
 SURF2.RBASE=clamp(SURF2.Rm*.06,60,380);
 SURF2.g0x=0;SURF2.g0z=0;SURF2.fx=0;SURF2.fz=0;SURF2.epoch++;
 SURF2.cells.clear();
 for(const ch of SURFG.children.slice())
  if(ch.userData&&ch.userData.rb){
   SURFG.remove(ch);
   if(ch.userData.rb===1){ch.geometry.dispose();for(const cc of ch.children)cc.geometry.dispose();}}
 SURF2.rocks=null;SURF2.flats=[];
 bd._atm=(P.atI||0)>.05?1:0;
 /* establish the ENU frame NOW (spawnSurfBuilds runs before updateSurface) */
 SURF2.th=2*Math.PI*T.t/((bd.rot||24)*3600);
 TER={h:sur2GroundY,h0:0,wl:SURF2.wl,sky:null,stars:null,sun:null,sun2:null};
 scene.fog=new THREE.FogExp2(0x8899aa,P.fog||.0009);
 sur2WorldPt(SURF2.anchor,SURF2.hA,SURF2.apW);
 {const uW=S2V3.copy(SURF2.anchor).applyAxisAngle(S2YAX,SURF2.th).clone();
  LF.up.copy(uW);
  LF.east.set(uW.z,0,-uW.x);
  if(LF.east.lengthSq()<1e-6)LF.east.set(1,0,0);
  LF.east.normalize();
  LF.zn.crossVectors(LF.east,LF.up).normalize();
  LF.qw?LF.qw.copy(uW):LF.qw=uW.clone();}
 sur2Sky();
 sur2EnsureCells(14);}
function sur2WorldPt(dirBF,h,out){
 return out.copy(dirBF).applyAxisAngle(S2YAX,SURF2.th).multiplyScalar(SURF2.Rm+h);}
function sur2Rebase(fx,fz){
 if(!SURF2.on)return;
 const oldE=S2V3.copy(LF.east),oldU=S2V4.copy(LF.up),oldZ=S2V5.copy(LF.zn);
 const nA=sur2DirAt(fx,fz,S2V1).clone();
 const shipA=sur2AltM(SHIPG.position);
 const shipD=sur2DirAt(SHIPG.position.x,SHIPG.position.z,S2V1).clone();
 const plA=PL.pos.y-sur2GroundY(PL.pos.x,PL.pos.z);
 const plD=sur2DirAt(PL.pos.x,PL.pos.z,S2V1).clone();
 const rvOut=ROVER.out;
 const rvA=rvOut?ROVER.g.position.y-sur2GroundY(ROVER.g.position.x,ROVER.g.position.z):0;
 const rvD=rvOut?sur2DirAt(ROVER.g.position.x,ROVER.g.position.z,S2V1).clone():null;
 SURF2.anchor.copy(nA);
 /* continuous basis transport: project the OLD east onto the new tangent plane.
    (A formula restart swings 90 degrees near the poles — a real discontinuity.) */
 S2V3.copy(SURF2.eBF).addScaledVector(nA,-SURF2.eBF.dot(nA));
 if(S2V3.lengthSq()<1e-10)sur2BasisBF(nA,S2V3,SURF2.zBF);
 else{S2V3.normalize();SURF2.zBF.crossVectors(S2V3,nA).normalize();}
 SURF2.eBF.copy(S2V3);
 SURF2.hA=sur2HBase(nA);
 sur2WorldPt(nA,SURF2.hA,SURF2.apW);
 SURF2.g0x=Math.floor(fx/CELL_LOD[0].S)*CELL_LOD[0].S;
 SURF2.g0z=Math.floor(fz/CELL_LOD[0].S)*CELL_LOD[0].S;
 SURF2.fx=fx;SURF2.fz=fz;SURF2.epoch++;
 /* refresh the ENU basis LF.* NOW — from the transported body basis */
 const nU=nA.clone().applyAxisAngle(S2YAX,SURF2.th);
 const nE=S2V1.copy(SURF2.eBF).applyAxisAngle(S2YAX,SURF2.th);
 if(nE.lengthSq()<1e-10)nE.set(nU.z,0,-nU.x);
 if(nE.lengthSq()<1e-10)nE.set(1,0,0);
 nE.normalize();
 const nZ=S2V2.crossVectors(nE,nU).normalize();
 LF.up.copy(nU);LF.east.copy(nE);LF.zn.copy(nZ);
 LF.qw?LF.qw.copy(nU):LF.qw=nU.clone();
 if(LAND)LAND.q0=[nA.x,nA.y,nA.z];
 /* frame rotation: old -> new (world space) */
 S2Q1.setFromRotationMatrix(TMM.makeBasis(nE,nU,nZ));
 S2Q2.setFromRotationMatrix(TMM.makeBasis(oldE,oldU,oldZ));
 const dQ=S2Q2.copy(S2Q2).invert().premultiply(S2Q1); /* dQ = S2Q1 * S2Q2^-1 */
 SURFV.applyQuaternion(dQ);
 if(!PL.inside)PL.vel.applyQuaternion(dQ);
 SHIPG.position.copy(sur2ENU(shipD,shipA,S2V1));
 SHIPG.quaternion.premultiply(dQ);
 PL.pos.copy(sur2ENU(plD,plA,S2V1));
 const fw=S2V2.set(Math.sin(PL.yaw),0,Math.cos(PL.yaw)).applyQuaternion(dQ);
 PL.yaw=Math.atan2(fw.x,fw.z);
 if(rvD){
  ROVER.g.position.copy(sur2ENU(rvD,rvA,S2V1));
  const rf=S2V2.set(Math.sin(ROVER.head),0,Math.cos(ROVER.head)).applyQuaternion(dQ);
  ROVER.head=Math.atan2(rf.x,rf.z);ROVER.wpos.copy(ROVER.g.position);}
 for(const b of SURFBLD){
  if(!b._dir||!b._g)continue;
  b._g.position.copy(sur2ENU(b._dir,b._alt||0,S2V1));
  const bdW=sur2DirAt(b._g.position.x,b._g.position.z,S2V2).applyAxisAngle(S2YAX,SURF2.th);
  sur2BasisQAt(bdW,S2Q1);
  b._g.quaternion.copy(S2Q1);
  b._g.rotateY(b.ry||0);}
 if(CACHE&&CACHE._dir&&CACHE.g)CACHE.g.position.copy(sur2ENU(CACHE._dir,0,S2V1));
 for(const c of SURF2.cells.values()){const u=c.mesh.userData;c.mesh.position.set(u.cx,0,u.cz);}
 sur2Rocks();}
function sur2Focus(){
 if(PL.seated||PL.inside)return SHIPG.position;
 if(PL.mode==='rover')return ROVER.g.position;
 return PL.pos;}
function sur2Tick(dt){
 if(!SURF2.on||!LF.body)return;
 SURF2.th=2*Math.PI*T.t/((LF.body.rot||24)*3600);
 /* the frame origin rides the planet's spin: recompute apW EVERY tick so the
    ENU basis (LF.*, rotating) and the origin never shear apart */
 sur2WorldPt(SURF2.anchor,SURF2.hA,SURF2.apW);
 const f=sur2Focus();
 if(Math.hypot(f.x-SURF2.fx,f.z-SURF2.fz)>SURF2.RBASE)sur2Rebase(f.x,f.z);
 else{SURF2.fx=f.x;SURF2.fz=f.z;}
 sur2EnsureCells(3);
 if(SURF2.clouds&&SURF2.clouds.visible){
  const cu=SURF2.clouds.material.uniforms;
  cu.uT.value=T.t;
  cu.uSun.value.copy(LF.sun);
  cu.uCov.value=clamp(.30+((PAL[Lf2BodyPal()].cov)||.2),0,.95);
  SURF2.clouds.position.copy(cam.position);}
 if(SURF2.dustG){
  SURF2.dustG.position.set(Math.round(cam.position.x),0,Math.round(cam.position.z));
  const w=(SRF.wind||0)*.4+2;
  const pa=SURF2.dust.geometry.attributes.position;
  for(let i=0;i<pa.count;i++){
   let x=pa.getX(i)+dt*w*(1+(i%3)*.2);
   if(x>16)x-=32;
   pa.setX(i,x);}
  pa.needsUpdate=true;
  SURF2.dust.material.opacity=clamp((SRF.wind||0)*.06+(PAL[Lf2BodyPal()].atm?.12:.02),0,.5);}
 if(SURF2.heatEl)SURF2.heatEl.style.opacity=(clamp(SURF2.heat,0,1)*.85).toFixed(2);}
function Lf2BodyPal(){return SURF2.body?SURF2.body.pal:'terra';}
function sur2Flats(){ /* flattening derived from builds — persists with them, multiplayer-safe */
 SURF2.flats.length=0;
 if(!SURF2.on)return;
 for(const b of SURFBLD){
  if(!b._dir)continue;
  const P=PARTS[b.part];
  SURF2.flats.push({d:b._dir,r:P&&P.w?3.4:2.6,h:(b._flath!=null?b._flath:sur2HBase(b._dir))});}}
function sur2Dispose(){
 SURF2.on=false;
 for(const c of SURF2.cells.values()){c.mesh.geometry.dispose();for(const ch of c.mesh.children)ch.geometry.dispose();}
 SURF2.cells.clear();
 if(SURF2.rocks){SURFG.remove(SURF2.rocks);SURF2.rocks.geometry.dispose();SURF2.rocks=null;}
 SURF2.clouds=null;SURF2.dust=null;SURF2.dustG=null;
 SURF2.body=null;SURF2.flats.length=0;SURF2.heat=0;
 if(SURF2.heatEl)SURF2.heatEl.style.opacity=0;}
/* method aliases (consumed by p08/p09/p12) */
SURF2.groundY=sur2GroundY;SURF2.altM=sur2AltM;SURF2.enuOf=sur2ENU;SURF2.dirAt=sur2DirAt;SURF2.upAt=sur2UpAt;
