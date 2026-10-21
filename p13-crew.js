/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 13/14: p13-crew.js
   CREW & MODELS — spacesuit system (flight / EVA), suit locker
   station, first-person suit arms + visor, full astronaut body
   model (external cam), ship/rover/station detail passes.
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 12 — CREW & MODELS ====================*/
const CREW={body:null,arms:null,visor:null,seatedPose:null};
function crewAccentHue(){
 const n=(FL.netName||NET.name||'KESTREL');
 let h=0;for(let i=0;i<n.length;i++)h=(h*31+n.charCodeAt(i))|0;
 return ((h>>>0)%360)/360;}
/* ---------- astronaut body (visible in external cam) ---------- */
function crewMakeBody(){
 if(CREW.body)return CREW.body;
 const g=new THREE.Group();
 const acc=new THREE.Color().setHSL(crewAccentHue(),.62,.5);
 const suit=new THREE.MeshLambertMaterial({color:0xd8dde2});
 const dark=new THREE.MeshLambertMaterial({color:0x3a4148});
 const accm=new THREE.MeshLambertMaterial({color:acc});
 const gold=new THREE.MeshLambertMaterial({color:0xc8a03a,emissive:0x6b4e12,emissiveIntensity:.35});
 const M=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o;};
 /* torso + hips */
 M(new THREE.BoxGeometry(.42,.5,.24),suit,0,1.18,0).userData.suitSkin=1;
 M(new THREE.BoxGeometry(.34,.22,.2),dark,0,.86,0);
 /* accent chest plate + control deck */
 M(new THREE.BoxGeometry(.3,.16,.05),accm,0,1.22,.13);
 M(new THREE.BoxGeometry(.16,.08,.03),dark,0,1.1,.13);
 /* backpack (EVA) + twin tanks */
 const bp=M(new THREE.BoxGeometry(.34,.42,.16),dark,0,1.2,-.19);
 M(new THREE.CylinderGeometry(.05,.05,.4,8),suit,-.1,1.24,-.26).rotation.z=.12;
 M(new THREE.CylinderGeometry(.05,.05,.4,8),suit,.1,1.24,-.26).rotation.z=-.12;
 bp.visible=true;g.userData.bp=bp;
 /* helmet + gold visor + rim lights */
 M(new THREE.SphereGeometry(.155,14,12),suit,0,1.62,0).userData.suitSkin=1;
 const vs=M(new THREE.SphereGeometry(.13,12,10),gold,0,1.62,.045);
 vs.scale.set(1,.82,.62);g.userData.visor=vs;
 M(new THREE.BoxGeometry(.05,.02,.02),accm,-.07,1.68,.13);
 M(new THREE.BoxGeometry(.05,.02,.02),accm,.07,1.68,.13);
 /* arms: shoulder pivot groups so they can pose */
 const mkArm=(sx)=>{
  const s=new THREE.Group();s.position.set(sx*.26,1.38,0);g.add(s);
  const up=new THREE.Mesh(new THREE.BoxGeometry(.11,.3,.12),suit);up.position.y=-.15;up.userData.suitSkin=1;s.add(up);
  const el=new THREE.Group();el.position.y=-.3;s.add(el);
  const lo=new THREE.Mesh(new THREE.BoxGeometry(.095,.28,.1),suit);lo.position.y=-.14;el.add(lo);
  const gl=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.11),accm);gl.position.y=-.3;el.add(gl);
  return{s,el};};
 g.userData.armL=mkArm(-1);g.userData.armR=mkArm(1);
 /* legs: hip pivots */
 const mkLeg=(sx)=>{
  const h=new THREE.Group();h.position.set(sx*.12,.78,0);g.add(h);
  const up=new THREE.Mesh(new THREE.BoxGeometry(.14,.36,.15),suit);up.position.y=-.18;up.userData.suitSkin=1;h.add(up);
  const kn=new THREE.Group();kn.position.y=-.36;h.add(kn);
  const lo=new THREE.Mesh(new THREE.BoxGeometry(.12,.36,.13),suit);lo.position.y=-.18;kn.add(lo);
  const bt=new THREE.Mesh(new THREE.BoxGeometry(.13,.08,.2),dark);bt.position.set(0,-.38,.03);kn.add(bt);
  return{h,kn};};
 g.userData.legL=mkLeg(-1);g.userData.legR=mkLeg(1);
 g.visible=false;
 CREW.body=g;
 return g;}
function crewPose(mode){ /* 'stand' | 'sit' | 'walk' phase */
 const g=CREW.body;if(!g)return;
 const L=g.userData.legL,R=g.userData.legR,aL=g.userData.armL,aR=g.userData.armR;
 if(mode==='sit'){
  L.h.rotation.x=R.h.rotation.x=-1.45;L.kn.rotation.x=R.kn.rotation.x=1.5;
  aL.s.rotation.x=aR.s.rotation.x=-.55;aL.el.rotation.x=aR.el.rotation.x=-.7;
 }else{
  L.h.rotation.x=R.h.rotation.x=0;L.kn.rotation.x=R.kn.rotation.x=0;
  aL.s.rotation.x=aR.s.rotation.x=0;aL.el.rotation.x=aR.el.rotation.x=-.15;}}
/* ---------- first-person suit arms + visor ---------- */
function crewMakeArms(){
 if(CREW.arms)return CREW.arms;
 const g=new THREE.Group();
 const acc=new THREE.Color().setHSL(crewAccentHue(),.62,.5);
 const mk=(sx)=>{
  const a=new THREE.Group();
  const sleeve=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.3),
   new THREE.MeshLambertMaterial({color:0xd8dde2}));
  sleeve.position.set(sx*.13,-.1,-.28);sleeve.rotation.y=sx*-.35;a.add(sleeve);
  const cuff=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.06),new THREE.MeshLambertMaterial({color:acc}));
  cuff.position.set(sx*.175,-.075,-.42);cuff.rotation.y=sx*-.35;a.add(cuff);
  return a;};
 g.add(mk(-1));g.add(mk(1));
 g.visible=false;g.renderOrder=999;
 CREW.arms=g;return g;}
function crewVisorEl(){
 if(CREW.visor)return CREW.visor;
 const v=document.createElement('div');v.id='visor';
 v.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:39;opacity:0;transition:opacity .4s;'+
  'background:radial-gradient(ellipse at 50% 45%,rgba(200,160,58,0) 55%,rgba(200,160,58,.16) 82%,rgba(120,86,20,.42) 100%);'+
  'box-shadow:inset 0 0 120px rgba(60,40,0,.5)';
 document.body.appendChild(v);CREW.visor=v;return v;}
/* ---------- suit state ---------- */
function crewEva(){return FL.suit==='eva';}
function crewToggleSuit(){
 if(!PL.inside){toast('SUIT CHANGES ONLY INSIDE THE SHIP — AT THE EVA LOCKER');sfx('deny');return;}
 FL.suit=crewEva()?'flight':'eva';
 sfx('sw');
 toast(crewEva()?'EVA SUIT ON — SEALING · VISOR DOWN · O2 ONLINE':'EVA SUIT STOWED — FLIGHT SUIT');
 crewSyncVisuals();}
function crewSyncVisuals(){
 const eva=crewEva(),col=eva?0xd8dde2:0x454b52;
 if(CREW.body){
  CREW.body.userData.bp.visible=eva;
  CREW.body.userData.visor.visible=eva;
  CREW.body.traverse(o=>{if(o.userData&&o.userData.suitSkin&&o.material)o.material.color.setHex(col);});}
 if(CREW.arms)
  CREW.arms.traverse(o=>{if(o.geometry&&o.geometry.parameters&&o.geometry.parameters.width===.09)
   o.material.color.setHex(eva?0xd8dde2:0x454b52);});
 if(CREW.visor)CREW.visor.style.opacity=(eva&&!PL.inside)?'1':'0';
 if(CREW.lockerLight)CREW.lockerLight.material.emissiveIntensity=eva?.06:.9;}
function crewTick(dt){
 if(!CREW.body)crewMakeBody();
 if(!CREW.arms){crewMakeArms();cam.add(CREW.arms);}
 if(!CREW.visor)crewVisorEl();
 const b=CREW.body;
 if(PL.seated){ /* sit in the pilot seat, visible through the canopy */
  crewPose('sit');
  b.position.set(PL.seatX,0,-6.15);
  b.rotation.set(0,Math.PI,0);
  b.visible=true;
 }else if(!PL.inside){ /* on foot, outside the hull */
  crewPose('stand');
  b.position.copy(PL.pos);
  b.rotation.set(0,PL.yaw+Math.PI,0);
  b.visible=true;
 }else{
  crewPose('stand');
  b.position.copy(PL.pos);
  b.rotation.set(0,PL.yaw+Math.PI,0);
  b.visible=true;}
 CREW.arms.visible=PL.inside?false:(VM.cur>0);
 if(CREW.visor)CREW.visor.style.opacity=(crewEva()&&!PL.inside)?'1':'0';}
/* ---------- suit locker (garage, by the ramp) ---------- */
function crewBuildLocker(){
 const g=new THREE.Group();
 const shell=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.3,.55),MT.furn2);
 shell.position.set(0,1.15,0);g.add(shell);
 const door=new THREE.Mesh(new THREE.BoxGeometry(1.14,2.1,.06),MT.dark);
 door.position.set(0,1.15,.29);g.add(door);
 const suit=new THREE.Mesh(new THREE.BoxGeometry(.6,1.2,.18),
  new THREE.MeshLambertMaterial({color:0xd8dde2}));
 suit.position.set(-.24,1.05,.36);g.add(suit);
 const helm=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),
  new THREE.MeshLambertMaterial({color:0xd8dde2}));
 helm.position.set(.28,1.7,.36);g.add(helm);
 const led=new THREE.Mesh(new THREE.BoxGeometry(.5,.06,.04),
  new THREE.MeshLambertMaterial({color:0x111111,emissive:0xffb347,emissiveIntensity:.9}));
 led.position.set(0,2.26,.32);g.add(led);
 CREW.lockerLight=led;
 const lb=makeLabel('EVA LOCKER',.9,.16,'#ffd9a0');
 lb.position.set(0,2.5,.3);g.add(lb);
 g.position.set(1.92,0,11.6);g.rotation.y=-Math.PI/2;
 SHIPG.add(g);
 hitGrp(g,'EVA SUIT LOCKER','WEAR / STOW SUIT',()=>crewToggleSuit());}
/* ---------- ship exterior detail pass ---------- */
function shipDetail(){
 const add=(m,x,y,z,rx,ry,rz)=>{m.position.set(x,y,z);
  if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);SHIPG.add(m);return m;};
 /* canard winglets + dorsal fin */
 add(new THREE.Mesh(new THREE.BoxGeometry(2.6,.07,.75),MT.hullD),0,.7,-9.4,0,0,0);
 add(new THREE.Mesh(new THREE.BoxGeometry(.08,1.1,1.5),MT.hullD),0,1.75,-1.2,-.28,0,0);
 /* engine glow rings + inner bells */
 for(const sx of[-1.15,1.15]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.52,.05,8,20),
   new THREE.MeshLambertMaterial({color:0x111111,emissive:0xff8c3a,emissiveIntensity:.8}));
  add(ring,sx,.55,10.35,Math.PI/2,0,0);}
 /* RCS quads (nose + tail, all four corners) */
 const rc=new THREE.MeshLambertMaterial({color:0x2a2f36});
 for(const [x,y,z] of[[-1.9,1.2,-8.6],[1.9,1.2,-8.6],[-1.9,-.4,-8.6],[1.9,-.4,-8.6],
  [-1.9,1.2,9.4],[1.9,1.2,9.4],[-1.9,-.4,9.4],[1.9,-.4,9.4]]){
  const n=new THREE.Mesh(new THREE.CylinderGeometry(.05,.09,.16,6),rc);
  add(n,x,y,z,x===0?0:(x<0?Math.PI/2:-Math.PI/2),0,0);}
 /* belly skid plates + panel strips */
 add(new THREE.Mesh(new THREE.BoxGeometry(1.7,.08,4.4),MT.hullD),0,-1.06,1.5,0,0,0);
 add(new THREE.Mesh(new THREE.BoxGeometry(.05,.02,9),MT.hullD),-1.1,2.02,-1,0,0,0);
 add(new THREE.Mesh(new THREE.BoxGeometry(.05,.02,9),MT.hullD),1.1,2.02,-1,0,0,0);
 /* docking ring + strobe on the spine */
 const dr=new THREE.Mesh(new THREE.TorusGeometry(.34,.05,8,18),MT.furn2);
 add(dr,0,2.32,2.2,Math.PI/2,0,0);}
/* ---------- rover v2 (replacement body) ---------- */
function roverV2Body(){
 const g=new THREE.Group();
 const frame=new THREE.MeshLambertMaterial({color:0x6a7480});
 const dark=new THREE.MeshLambertMaterial({color:0x2e343b});
 const acc=new THREE.MeshLambertMaterial({color:0xb8862b});
 const M=(geo,m,x,y,z,rx,ry,rz)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);
  if(rx||ry||rz)o.rotation.set(rx||0,ry||0,rz||0);g.add(o);return o;};
 /* chassis rails + cross members */
 M(new THREE.BoxGeometry(1.5,.14,2.6),frame,0,.42,0);
 M(new THREE.BoxGeometry(1.2,.1,.4),dark,0,.5,.8);
 M(new THREE.BoxGeometry(1.2,.1,.4),dark,0,.5,-.8);
 /* deck + cargo bed rails */
 M(new THREE.BoxGeometry(1.4,.08,1.1),dark,0,.56,.7);
 for(const sx of[-.6,.6])M(new THREE.BoxGeometry(.06,.3,1.0),frame,sx,.72,.7);
 /* seat + console */
 M(new THREE.BoxGeometry(.6,.1,.6),acc,0,.66,-.35);
 M(new THREE.BoxGeometry(.6,.5,.1),frame,0,.9,-.62,-.15,0,0);
 /* mast + head + light bar */
 M(new THREE.CylinderGeometry(.04,.05,1.1,8),dark,0,1.1,-.5);
 const head=M(new THREE.BoxGeometry(.34,.2,.2),frame,0,1.66,-.5);
 M(new THREE.BoxGeometry(.3,.06,.02),new THREE.MeshLambertMaterial({color:0x111111,emissive:0xfff2c0,emissiveIntensity:1.1}),0,1.78,-.4);
 /* wheels with fenders */
 for(const [sx,sz] of[[-.82,-.95],[.82,-.95],[-.82,.95],[.82,.95]]){
  const w=M(new THREE.CylinderGeometry(.34,.34,.22,12),dark,sx,.34,sz,0,0,Math.PI/2);
  w.userData.wheel=1;
  M(new THREE.BoxGeometry(.34,.08,.5),frame,sx,.72,sz);}
 return g;}
/* ---------- station + mothership detail pass ---------- */
function stationDetail(g){
 if(!g)return;
 const blink=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xff5a3a,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
 blink.position.set(0,g.userData.stR?g.userData.stR+8:26,0);
 blink.scale.setScalar(4);g.add(blink);
 g.userData.blink=blink;
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.15,.05,10,6),new THREE.MeshLambertMaterial({color:0x3a4148}));
 ant.position.set(4,14,0);g.add(ant);}
function stationDetailTick(){
 for(const b of BODY){
  if(b.stG&&b.stG.userData.blink&&b.stG.userData.blink.material)
   b.stG.userData.blink.material.opacity=(Math.sin(T.t*3.4)>0)?1:.12;}}
