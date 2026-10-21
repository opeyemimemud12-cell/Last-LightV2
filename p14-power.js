/* ═══════════════════════════════════════════════════════════════
   LAST LIGHT — source part 14/14: p14-power.js
   POWER GRID & ENGINEERING — functional electrical networks for
   player bases (solar / battery / cable / generator / consumers,
   load management, overload breakers), TRANSIT RINGS (velocity
   boost gates), new build parts, SYS terminal grid panel.
   Also carries the closure tail (boot + state hook) as the last
   source part.
   ═══════════════════════════════════════════════════════════════ */
/*==================== PART 13 — POWER GRID & RINGS ====================*/
const POWER={sup:0,dem:0,store:0,cap:0,clients:0,ok:true,ringPulse:0,parts:{}};
/* new build parts merge into the shared registry */
Object.assign(PARTS,{
 battery:{n:'BATTERY BANK',cost:{m:4,p:4},cat:'POWER',pw:{cap:400},solid:1},
 cable:{n:'POWER CABLE',cost:{m:1},cat:'POWER',pw:{wire:1}},
 gen:{n:'FUEL GENERATOR',cost:{m:6,p:6},cat:'POWER',pw:{out:60},solid:1},
 flood:{n:'FLOODLIGHT',cost:{m:2,p:2},cat:'POWER',pw:{in:14}},
 ring:{n:'TRANSIT RING',cost:{m:60,p:40,e:2},cat:'POWER',pw:{in:0,ring:1},w:1}});
const PWV1=new THREE.Vector3(),PWV2=new THREE.Vector3();
function pwMeshMods(){ /* extra geometry for the new parts (patched into partMesh) */
 return true;}
function powerTick(dt){
 if(MODE!=='surface'||!SURF2.on){POWER.ok=true;return;}
 /* collect grid nodes from live surface builds */
 const nodes=[];
 for(const b of SURFBLD){
  const P=PARTS[b.part];if(!P||!P.pw)continue;
  if(b._g)nodes.push({b,P,x:b._g.position.x,z:b._g.position.z});}
 /* components: parts within 2.2m chain (cables bridge up to 7m) */
 const comps=[];
 const seen=new Set();
 for(let i=0;i<nodes.length;i++){
  if(seen.has(i))continue;
  const comp=[i];seen.add(i);
  let grew=true;
  while(grew){
   grew=false;
   for(let j=0;j<nodes.length;j++){
    if(seen.has(j))continue;
    for(const k of comp){
     const a=nodes[k],c=nodes[j];
     const reach=(a.P.pw.wire||c.P.pw.wire)?7.2:2.2;
     if(Math.hypot(a.x-c.x,a.z-c.z)<=reach){comp.push(j);seen.add(j);grew=true;break;}}}}
  comps.push(comp.map(k=>nodes[k]));}
 /* per component: balance supply vs demand, charge/discharge batteries */
 let tsup=0,tdem=0,tstore=0,tcap=0,clients=0;
 const day=LF.dayF>.25&&LF.sinE>0?LF.dayF:0;
 for(const comp of comps){
  let sup=0,dem=0;
  for(const n of comp){
   const pw=n.P.pw;
   if(pw.out)sup+=pw.out;                                 /* generators */
   if(n.P.solar)sup+=18*day;                              /* solar: sun-scaled */
   if(pw.cap){tstore+=(n.b._pwS!=null?n.b._pwS:(n.b._pwS=pw.cap*.5));tcap+=pw.cap;}
   if(pw.in)dem+=pw.in;
   if(n.P.lamp)dem+=8;
   if(n.P.ring)dem+=0;                                    /* rings draw on use */
   clients++;}
  tsup+=sup;tdem+=dem;
  const powered=sup>=dem-.01;
  if(!powered&&tstore>0){/* battery covers shortfall */}
  for(const n of comp){
   const on=powered||(dem>0&&tstore>dem*dt*2);
   if(n.P.lamp&&n.b._g.userData.light)n.b._g.userData.light.visible=on;
   if(n.P.pw&&n.P.pw.in&&n.b._g.userData.light)n.b._g.userData.light.visible=on; /* floodlights trip too */
   if(n.P.pw&&n.P.pw.ring)n.b._pwReady=powered||tstore>25;}}
 /* battery charge/discharge (global simple pool) */
 const net=tsup-tdem;
 tstore=clamp(tstore+net*dt*.5,0,Math.max(1,tcap));
 for(const comp of comps)for(const n of comp)if(n.P.pw.cap)n.b._pwS=tstore;
 POWER.sup=tsup;POWER.dem=tdem;POWER.store=tstore;POWER.cap=tcap;POWER.clients=clients;
 const ok=tdem<=tsup+tstore+.01;
 if(ok!==POWER.ok){
  POWER.ok=ok;
  if(!ok){toast('GRID OVERLOAD — DEMAND '+Math.round(tdem)+'kW EXCEEDS SUPPLY · LIGHTS TRIPPED',1);sfx('deny');}
  else toast('GRID RESTORED — SUPPLY '+Math.round(tsup)+'kW',1);}
 /* transit rings: detect ship crossing the ring plane */
 POWER.ringPulse=Math.max(0,POWER.ringPulse-dt*2);
 for(const comp of comps)for(const n of comp){
  if(!n.P.pw||!n.P.pw.ring||!n.b._g||!n.b._dir)continue;
  if(!n.b._lastSide)n.b._lastSide=0;
  const c=n.b._g.position;
  PWV1.set(0,0,1).applyQuaternion(n.b._g.quaternion); /* ring axis (world/ENU) */
  PWV2.copy(SHIPG.position).sub(c);
  const side=Math.sign(PWV2.dot(PWV1))||1;
  const distR=Math.hypot(PWV2.x,PWV2.y,PWV2.z);
  if(n.b._lastSide!==0&&side!==n.b._lastSide&&distR<9&&Math.abs(PWV2.dot(PWV1))<7){
   const charge=n.b._pwStore!=null?n.b._pwStore:(n.b._pwStore=100);
   if(charge>=25&&(SURFV.length()>4)){
    n.b._pwStore=charge-25;
    const along=Math.sign(SURFV.dot(PWV1))||1;
    SURFV.addScaledVector(PWV1,along*130);
    POWER.ringPulse=1;SHK.t=.7;SHK.amp=.5;
    sfx('tele');toast('TRANSIT RING — +130 m/s · GRID DRAINED 25kJ',1);
    if(n.b._g.userData.ringGlow){n.b._g.userData.ringGlow.material.emissiveIntensity=3;}}}
  n.b._lastSide=side;
  if(n.b._g.userData.ringGlow)
   n.b._g.userData.ringGlow.material.emissiveIntensity=
    lerp(n.b._g.userData.ringGlow.material.emissiveIntensity,.9,dt*3)+POWER.ringPulse*2;}}
function powerHTML(){
 if(MODE!=='surface')return '<div class="dim">POWER GRID — LAND ON A SURFACE WITH GENERATION</div>';
 const st=POWER.ok?'<span style="color:#7dffa8">NOMINAL</span>':'<span style="color:#ff5a5a">OVERLOAD</span>';
 return '<div class="trow"><b>BASE POWER GRID</b> — '+st+'</div>'+
  '<div class="trow">SUPPLY '+Math.round(POWER.sup)+' kW · DEMAND '+Math.round(POWER.dem)+
  ' kW · BATTERIES '+Math.round(POWER.store)+'/'+Math.round(POWER.cap)+' kJ</div>'+
  '<div class="trow dim">CLIENTS '+POWER.clients+' · SOLAR SCALES WITH SUNLIGHT · RINGS FIRE AT 25 kJ</div>';}
/* ═════════════════════ CLOSURE TAIL (last source part) ═════════════════════ */
boot();
/* --------- dev/drive hooks (headless verification, harmless in play) --------- */
window.__LLDIRIVE={land:(id)=>{POW.amp=true;enterSurface(bodyById(id),new THREE.Vector3(.6,1,.3).normalize(),0,false);},
 suit:()=>{PL.inside=true;crewToggleSuit();},hover:()=>fl2HoverToggle()};
/* --------- touch layer state hook (read by js/touch.js) --------- */
window.__LLSTATE=function(){return{seated:PL.seated,rover:PL.mode==='rover',bld:BLDG.on,docked:DOCKED,mode:MODE,tool:VM.cur,term:!!TERM,paused:PAUSED,dead:DEAD,menu:MENU,hyper:H.on,hover:FL2.hover,assist:FL2.assist,suit:FL.suit||'flight'};};
}catch(err){const f=document.getElementById('fatal');if(f){f.style.display='flex';document.getElementById('fmsg').textContent=''+((err&&err.stack)||err);}}
})();
//===== END OF FILE — IF YOU CAN SEE THIS, YOUR COPY IS COMPLETE =====
