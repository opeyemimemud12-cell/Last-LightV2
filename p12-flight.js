/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 12/14: p12-flight.js
   FLIGHT MODEL 2.0 — true momentum & inertia (vector velocity),
   mass-dependent handling, flight assist, RCS, atmospheric entry
   (drag + plasma heating), aircraft-style aero flight with lift &
   banking, VTOL HOVER mode with altitude hold, precision landing,
   live PFD instrument data. Space + surface sides.
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 11 — FLIGHT MODEL 2.0 ====================*/
const FL2={assist:true,hover:false,hoverT:20,gload:1,heatK:0,ias:0,vs:0,agl:0,
 stall:false,lift:0,drag:0,entry:false};
const F2V1=new THREE.Vector3(),F2V2=new THREE.Vector3(),F2V3=new THREE.Vector3(),
 F2Q1=new THREE.Quaternion(),F2Q2=new THREE.Quaternion();
function fl2Mass(){ /* mass factor: hull + cargo + rover */
 let m=1+clamp((INV.metal||0)/400,0,.4)+clamp((INV.parts||0)/260,0,.3)+clamp((INV.exo||0)/40,0,.3);
 if(ROVER.out)m+=.15;
 return m;}
/* ---------- SPACE FLIGHT (called from patched flightUpdate) ---------- */
function fl2Space(dt){
 const mf=fl2Mass();
 const powered=SP.thr>0&&pwr('eng')&&SYSD.eng>20;
 const acc=SP.thr*420/mf*(FL.alloc?FL.alloc.eng:1);
 if(PL.seated&&!INTRO.on&&!DOCKED){
  if(powered)SP.vel.addScaledVector(SP.fwd,acc*dt);            /* main drive */
  if(KEYS.KeyS&&SP.thr<=0.001)SP.vel.addScaledVector(SP.fwd,-200/mf*dt); /* retro at zero throttle */
  if(KEYS.KeyQ)SP.vel.addScaledVector(SP.rt,-120/mf*dt);       /* RCS strafe port */
  if(KEYS.Space)SP.vel.addScaledVector(SP.up,120/mf*dt);       /* RCS translate up */
 }
 /* momentum is preserved; assist only bleeds lateral drift */
 const v=SP.vel.length();
 if(v>.01){
  if(FL2.assist&&!H.on){
   F2V1.copy(SP.fwd).multiplyScalar(SP.vel.dot(SP.fwd));
   SP.vel.lerp(F2V1,clamp(dt*.9,0,1));}
  else SP.vel.multiplyScalar(1-dt*.002);}
 if(H.on)SP.vel.copy(SP.fwd).multiplyScalar(4000+H.t*60000);
 SP.spd=SP.vel.length();
 SP.pos.addScaledVector(SP.vel,dt);
 /* atmospheric entry (space side): drag + plasma + hull stress */
 FL2.entry=false;FL2.heatK=0;SURF2.heat=0;
 const nb=fl2NearestBody();
 let windOn=false;
 if(nb&&nb.b&&nb.b._atm&&nb.dr<nb.b.r*US*.6&&SP.spd>40){
  const P=PAL[nb.b.pal];
  const H0=Math.max(.01,(nb.b.at||9)/8); /* atmosphere scale height in units (at is km) */
  const rho=Math.exp(-Math.max(0,nb.dr)/H0);
  const sp2=SP.spd;
  const dragK=rho*sp2*sp2*2.2e-6;
  if(dragK>.05){
   FL2.entry=true;windOn=true;
   F2V1.copy(SP.vel).normalize();
   SP.vel.addScaledVector(F2V1,-Math.min(sp2*.85,dragK*dt));
   FL2.heatK=clamp(rho*sp2/900,0,1);
   SURF2.heat=FL2.heatK;
   SHK.t=Math.max(SHK.t,FL2.heatK*.6);SHK.amp=Math.max(SHMAMP(),FL2.heatK*.5);
   setLoop('wind',FL2.heatK*.5,90+FL2.heatK*160);
   if(FL2.heatK>.82){SYSD.hull=clamp(SYSD.hull-dt*4,0,100);hurt(dt*1.4,'HULL BREACH — ATMOSPHERIC ENTRY TOO FAST');}
   if(T.t-(SRF.entryT||0)>6){SRF.entryT=T.t;toast('ATMOSPHERIC ENTRY — '+nb.b.name.toUpperCase()+' · DRAG '+Math.round(rho*100)+'%',1);}}}
 if(!windOn&&MODE==='space')setLoop('wind',0);}
function SHMAMP(){return .5;}
function fl2NearestBody(){
 let best=null,bd=1e18;
 for(const b of BODY){
  if(b.t==='star'||b.t==='gas')continue;
  const d=SP.pos.distanceTo(b.posU)-b.r*US;
  if(d<bd){bd=d;best=b;}}
 return best?{b:best,dr:bd}:null;}
/* ---------- SURFACE FLIGHT (replaces legacy surfaceFlight core) ---------- */
function fl2Surf(dt){
 if(!PL.seated||INTRO.on)return;
 const bd=LF.body;if(!bd)return;
 const g=(bd.g||9.8),mf=fl2Mass();
 /* attitude: mouse = pitch/yaw rate, A/D = roll (or strafe in hover) */
 TMQ.setFromEuler(new THREE.Euler(-STK.y*.85*dt,-STK.x*.65*dt,(FL2.hover?0:((KEYS.KeyA?1:0)-(KEYS.KeyD?1:0)))*1.3*dt,'XYZ'));
 SHIPG.quaternion.multiply(TMQ).normalize();
 STK.x*=Math.exp(-dt*.7);STK.y*=Math.exp(-dt*.7);
 const fwd=F2V1.set(0,0,-1).applyQuaternion(SHIPG.quaternion);
 const up=F2V2.set(0,1,0).applyQuaternion(SHIPG.quaternion);
 const rt=F2V3.set(1,0,0).applyQuaternion(SHIPG.quaternion);
 const P=PAL[bd.pal];
 const altNow=sur2AltM(SHIPG.position);
 const rho=bd._atm?clamp(1-altNow/Math.max(1,SURF2.atmH),0,1)*1.2:0;
 const airV=SURFV.length();
 FL2.ias=airV*Math.sqrt(Math.max(0,rho/1.2));
 const powered=pwr('eng')&&SYSD.eng>20;
 if(powered){const dth=((KEYS.KeyW?1:0)-(KEYS.KeyS?1:0))*.45*dt;SP.thr=clamp(SP.thr+dth,0,1);}
 else SP.thr=0;
 const thrust=powered?SP.thr*52/mf:0;
 if(FL2.hover){ /* ---- VTOL HOVER: altitude hold + lateral strafe ---- */
  if(FL2.hoverT<altNow-40)FL2.hoverT=clamp(altNow+6,2,4000);
  const vErr=FL2.hoverT-altNow;
  const aUp=clamp(vErr*1.2+(KEYS.Space?14:0),-20,46);
  /* ENU frame: local vertical IS +Y (the world-space up vector never belongs here) */
  if(powered)SURFV.y+=aUp*dt;
  if(SURFV.y>60)SURFV.y=60;if(SURFV.y<-40)SURFV.y=-40;
  SURFV.y-=powered?0:g*dt; /* engines hold altitude; power loss = fall */
  SURFV.addScaledVector(rt,((KEYS.KeyD?1:0)-(KEYS.KeyA?1:0))*16*dt);
  /* W/S reserved for altitude target; A/D strafe laterally */
  if(KEYS.KeyW)FL2.hoverT+=dt*60;
  if(KEYS.KeyS)FL2.hoverT=Math.max(2,FL2.hoverT-dt*40);
  if(FL2.assist){
   const k=1-clamp(dt*1.6,0,1);
   const hx=SURFV.x*k,hz=SURFV.z*k;
   SURFV.x=hx;SURFV.z=hz;}
  if(rho>0)SURFV.multiplyScalar(1-clamp(dt*rho*.3,0,.5));
  FL2.gload=clamp((aUp+g)/9.8,.2,3);
 }else{ /* ---- CRUISE: momentum + aerodynamics ---- */
  SURFV.addScaledVector(fwd,thrust*dt);
  SURFV.y-=g*dt;
  FL2.lift=0;FL2.stall=false;
  if(rho>0&&airV>1){
   FL2.drag=rho*airV*airV*.0011;
   const vHat=F2V1.copy(SURFV).normalize();
   SURFV.addScaledVector(vHat,-Math.min(airV,FL2.drag*dt));
   const aoa=clamp(up.dot(vHat),-.6,.9);
   FL2.lift=rho*airV*airV*.0016*(aoa+.12);
   SURFV.addScaledVector(up,FL2.lift*dt*2.2);
   /* stall = falling leaf: SINKING at low airspeed. A powered climb-out is not a stall. */
   FL2.stall=rho>.5&&airV<38&&altNow>6&&SURFV.y<-.5&&FL2.lift<g*.5;
   if(FL2.stall){
    F2Q1.setFromAxisAngle(F2V1.set(1,0,0).applyQuaternion(SHIPG.quaternion),dt*.3);
    SHIPG.quaternion.multiply(F2Q1);}
   FL2.gload=clamp((FL2.lift+g)/9.8,.1,9);
  }else FL2.gload=1;
  if(FL2.assist&&rho<=0)SURFV.multiplyScalar(1-clamp(dt*.25,0,1));}
 SHIPG.position.addScaledVector(SURFV,dt);
 FL2.agl=sur2AltM(SHIPG.position);
 FL2.vs=SURFV.y;
 /* ground contact */
 const gy=SURF2.groundY(SHIPG.position.x,SHIPG.position.z)+GEAR;
 if(SHIPG.position.y<=gy){
  const imp=-SURFV.y;
  SHIPG.position.y=gy;
  if(imp>3&&GEARST.d<.7){hurt(imp*1.5,'GEAR-UP LANDING — BELLY IMPACT');SYSD.hull=clamp(SYSD.hull-imp*.6,0,100);toast('GEAR-UP LANDING — BELLY SCRAPE (G = GEAR)',1);}
  if(imp>12){hurt(imp*1.2,'HARD LANDING — STRUCTURAL STRESS');SYSD.hull=clamp(SYSD.hull-imp*.8,0,100);sfx('thud');SHK.t=1;SHK.amp=.7;SURFV.set(0,0,0);}
  else{
   if(SURFV.y<0)SURFV.y=0;
   SURFV.x*=Math.exp(-dt*4);SURFV.z*=Math.exp(-dt*4);
   /* settle level on the gear — ONLY when the pilot's hands are off the stick */
   if(SURFV.length()<3&&SP.thr<.05&&Math.abs(STK.y)<.08&&Math.abs(STK.x)<.08){
    F2Q1.setFromUnitVectors(F2V2.set(0,1,0).applyQuaternion(SHIPG.quaternion),F2V3.set(0,1,0));
    F2Q2.identity().slerp(F2Q1,.05);
    SHIPG.quaternion.premultiply(F2Q2);}
   if(FL2.hover&&FL2.hoverT<4)FL2.hoverT=2;}}
 /* liftoff assist: a NEAR-LEVEL powered liftoff engages VTOL hover.
    Nose high? That's a rocket climb — cruise stays on and you go up FAST. */
 if(!FL2.hover&&powered&&SP.thr>.35&&SURFV.y>2.5&&Math.abs(fwd.y)<.75){
  FL2.hover=true;FL2.hoverT=clamp(FL2.agl+8,2,4000);
  toast('VTOL HOVER ENGAGED — Z TOGGLE · W/S ALTITUDE · SPACE BOOST',1);}
 /* entry heating in the upper atmosphere */
 SURF2.heat=clamp((FL2.agl-SURF2.exitAlt*.55)/Math.max(1,SURF2.exitAlt*.45),0,1)*clamp(airV/300,0,1)*(bd._atm?1:0);
 if(FL2.agl>SURF2.exitAlt){exitSurface();return;}
 for(const g2 of ENGGLOW)g2.material.opacity=SP.thr*.9;
 for(const cc of ENGCONE){cc.material.opacity=SP.thr*.7*(.8+Math.random()*.4);cc.scale.y=lerp(.25,1.9,SP.thr);}
 setLoop('eng',SP.thr*.4,60+SP.thr*140);
 if(rho>0)setLoop('wind',clamp(airV/220,0,.55)*rho,90+airV*.3);}
function fl2HoverToggle(){
 if(MODE!=='surface'||!PL.seated){sfx('deny');return;}
 FL2.hover=!FL2.hover;
 FL2.hoverT=clamp(sur2AltM(SHIPG.position)+4,2,4000);
 sfx('sw');toast(FL2.hover?'HOVER MODE — W/S ALTITUDE · A/D STRAFE · SPACE BOOST':'CRUISE MODE — AIRCRAFT CONTROLS · BANK TO TURN',1);}
function fl2AssistToggle(){
 FL2.assist=!FL2.assist;sfx('sw');
 toast(FL2.assist?'FLIGHT ASSIST ON — DRIFT CORRECTED':'FLIGHT ASSIST OFF — FULL NEWTONIAN DRIFT (O = BACK ON)',1);}
/* ---------- PFD instrument data (drawn by mfdTick) ---------- */
function fl2PFD(){
 if(MODE==='surface'&&LF.body)
  return{mode:FL2.hover?'HOVER':'CRUISE',ias:Math.round(FL2.ias),agl:Math.max(0,Math.round(FL2.agl)),
   vs:Math.round(FL2.vs),g:FL2.gload.toFixed(1),thr:Math.round(SP.thr*100),
   stall:FL2.stall,heat:FL2.heatK,entry:FL2.entry,drag:Math.round(FL2.drag),lift:Math.round(FL2.lift)};
 return{mode:'SPACE',ias:Math.round(SP.spd*8),agl:0,vs:0,g:FL2.gload.toFixed(1),
  thr:Math.round(SP.thr*100),stall:false,heat:FL2.heatK,entry:FL2.entry,drag:0,lift:0};}
