window.addEventListener('error',function(e){var f=document.getElementById('fatal');if(f){f.style.display='flex';document.getElementById('fmsg').textContent=''+(e.message||e.error)+'\n'+(e.filename||'')+' @line '+(e.lineno||'?');}});
window.addEventListener('unhandledrejection',function(e){var f=document.getElementById('fatal');if(!f)return;if(e.reason&&/pointer lock|PointerLock|NotAllowedError/i.test(''+(e.reason.message||e.reason.name||e.reason)))return;f.style.display='flex';document.getElementById('fmsg').textContent='PROMISE: '+((e.reason&&e.reason.message)||e.reason);});
(async()=>{try{
let THREE;
try{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');}
catch(e){THREE=await import('https://unpkg.com/three@0.160.0/build/three.module.js');}
window.THREE=THREE;
const $=id=>document.getElementById(id);
$('stip').textContent='renderer…';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.16;
document.body.appendChild(renderer.domElement);
const SAVEKEY='lastlight.save',SETKEY='lastlight.set',US=1/8;
let SET={v:.7,sens:1,q:2,rs:1,sd:1,fov:72,useed:777};
try{const s=JSON.parse(localStorage.getItem(SETKEY)||'{}');if(s)SET=Object.assign(SET,s);}catch(e){}
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(SET.fov||72,innerWidth/innerHeight,.08,2.6e6);
const AMB=new THREE.AmbientLight(0x5a6a84,.8);scene.add(AMB);
const AMB0=new THREE.Color(0x5a6a84);
const SUNL=new THREE.DirectionalLight(0xfff2dd,1.9);scene.add(SUNL);scene.add(SUNL.target);
const HEMI=new THREE.HemisphereLight(0x88aacc,0x22201a,0);scene.add(HEMI);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const clockR=new THREE.Clock();
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const TMP=V3(0,0,0),TMP2=V3(0,0,0),TMP3=V3(0,0,0),TMQ=new THREE.Quaternion(),QT2=new THREE.Quaternion(),TMM=new THREE.Matrix4(),EUL=new THREE.Euler();
const GOV={k:1,acc:0,n:0,low:0,high:0};

/*==================== PART 2 — DATA, STATE, SAVE, AUDIO ====================*/
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const fmtK=n=>n>=1e9?(n/1e9).toFixed(2)+'B km':n>=1e6?(n/1e6).toFixed(1)+'M km':n>=1e3?(n/1e3).toFixed(0)+'k km':n.toFixed(0)+' km';
const fmtT=s=>{s=Math.max(0,Math.floor(s));const d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return(d?d+'d ':'')+('0'+h).slice(-2)+':'+('0'+m).slice(-2);};
const fmtD=km=>km>=9.46e13?(km/9.46e12).toFixed(1)+' ly':fmtK(km);
const rnd=(a,b)=>a+Math.random()*(b-a);
const PAL={
 earth:{sea:'#0a3d70',lo:'#39662f',hi:'#8f7d55',pk:'#e9e9ec',at:'#5fb2ff',atI:1.15,skyD:[.36,.58,.92],amp:16,wind:.25,tg:['#2f5728','#4e7a3a','#8f7d55','#d8d8dc'],fog:.0016,sw:14,dr:22,cov:.55},
 terra:{sea:'#0d4a52',lo:'#7d5a35',hi:'#b0935c',pk:'#e4e8e4',at:'#7fe0c8',atI:1.0,skyD:[.42,.66,.82],amp:22,wind:.3,tg:['#6b4f2e','#8f7040','#b0935c','#e4e8e4'],fog:.0013,sw:16,dr:20,cov:.45},
 ocean:{sea:'#062f5e',lo:'#2e6a4a',hi:'#5f8f6a',pk:'#e8f0f4',at:'#68b8ff',atI:1.2,skyD:[.34,.56,.9],amp:12,wind:.35,tg:['#1d4a38','#2e6a4a','#5f8f6a','#cfe0e8'],fog:.0018,sw:15,dr:20,cov:.65},
 rock:{lo:'#4c4038',hi:'#7d685a',pk:'#b5a48f',at:'#9a9a9a',atI:0,skyD:[.5,.35,.28],amp:30,wind:.02,tg:['#3a3029','#5c4a3e','#7d685a','#b5a48f'],fog:0,sw:60,dr:70,cov:0},
 desert:{lo:'#8a5a2e',hi:'#c98f4e',pk:'#e8d0a0',at:'#e8b070',atI:.35,skyD:[.75,.6,.4],amp:26,wind:.15,tg:['#6e4522','#8a5a2e','#c98f4e','#e8d0a0'],fog:.0009,sw:26,dr:30,cov:.12},
 ice:{lo:'#9fb4c4',hi:'#d8e8f0',pk:'#ffffff',at:'#bcd8ff',atI:.4,skyD:[.6,.7,.85],amp:24,wind:.12,tg:['#7d94a8','#9fb4c4','#d8e8f0','#ffffff'],fog:.0011,sw:10,dr:26,cov:.3},
 lava:{lo:'#2a1a14',hi:'#4c332a',pk:'#8a6a50',at:'#ff7030',atI:.5,skyD:[.45,.2,.1],amp:34,wind:.05,tg:['#1c100c','#3a241a','#4c332a','#6a4a34'],fog:.002,sw:40,dr:40,cov:.15},
 toxic:{lo:'#8f7a30',hi:'#c2ab4a',pk:'#e8d878',at:'#e8cf6a',atI:1.4,skyD:[.8,.7,.3],amp:20,wind:.1,tg:['#6a5a20','#8f7a30','#c2ab4a','#e8d878'],fog:.0035,sw:30,dr:25,cov:.75},
 gas:{lo:'#c2a068',hi:'#e8d0a0',pk:'#f8ecd8',at:'#f8e0b0',atI:.5,skyD:[.8,.7,.5],amp:0,wind:0,tg:['#c2a068','#e8d0a0'],fog:0,sw:0,dr:0,cov:0}
};
const SYSTEMS={
 Sol:{name:'SOL',pos:[0,0,0],c:0xfff3d0},
 Proxima:{name:'PROXIMA CENTAURI',pos:[3.9e13,.6e13,-.5e13],c:0xff9a60},
 AlphaCen:{name:'ALPHA CENTAURI',pos:[4.06e13,.72e13,-.37e13],c:0xfff0d8},
 Barnard:{name:"BARNARD'S STAR",pos:[5.0e13,-1.5e13,2.4e13],c:0xff8858},
 Sirius:{name:'SIRIUS',pos:[3.1e13,5.1e13,-5.4e13],c:0xcfe0ff},
 Vega:{name:'VEGA',pos:[-1.55e14,9.2e13,1.38e14],c:0xdfe8ff}
};
const BDEF=[
 {sys:'Sol',id:'sol',name:'Sol',t:'star',r:696340,pal:'gas',rot:609,desc:'G-class star. Do not approach.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Sol',id:'mercury',name:'Mercury',t:'rock',r:2440,a:5.79e7,per:2112,rot:1407.6,pal:'rock',g:3.7,tk:440,res:{ore:2,exo:1},desc:'Scorched cratered metal world.',haz:'NO ATMOSPHERE · EXTREME HEAT'},
 {sys:'Sol',id:'venus',name:'Venus',t:'rock',r:6052,a:1.082e8,per:5412,rot:-5832,pal:'toxic',at:110,g:8.9,tk:737,res:{ore:1,exo:2},desc:'Sulfuric clouds, retrograde spin.',haz:'CRUSHING TOXIC ATMOSPHERE'},
 {sys:'Sol',id:'earth',name:'Earth',t:'rock',r:6371,a:1.496e8,per:8766,rot:23.93,pal:'earth',at:60,g:9.81,tk:288,res:{ice:3,org:3,ore:1},desc:'Home. Was home.',haz:'DESTROYED — DEBRIS FIELD'},
 {sys:'Sol',id:'luna',name:'Luna',t:'rock',par:'earth',r:1737,a:384400,per:655,rot:336,pal:'rock',g:1.62,tk:250,res:{ice:2,ore:3},desc:'Earth\'s moon. Long, dark nights.',haz:'NO ATMOSPHERE · 14-DAY NIGHT'},
 {sys:'Sol',id:'mars',name:'Mars',t:'rock',r:3390,a:2.279e8,per:16488,rot:24.62,pal:'desert',at:11,g:3.71,tk:210,res:{ice:2,ore:3,org:1},desc:'Red desert, thin CO2 air.',haz:'THIN ATMOSPHERE · COLD NIGHTS'},
 {sys:'Sol',id:'cinder',name:'Cinder',t:'rock',r:1150,a:2.1e7,per:610,rot:4.3,pal:'lava',g:2.1,tk:1050,res:{ore:4,exo:2},desc:'Molten dwarf skimming the sun. A day lasts 4.3 hours.',haz:'MOLTEN SURFACE · RADIATION'},
 {sys:'Sol',id:'jove',name:'Jove',t:'gas',r:69911,a:7.785e8,per:43330,rot:9.93,pal:'gas',ring:[126000,190000],g:24.8,tk:165,res:{exo:1},desc:'Banded gas giant with a faint ring.',haz:'NO SOLID SURFACE — DO NOT DESCEND'},
 {sys:'Proxima',id:'proxima',name:'Proxima Centauri',t:'star',r:107000,pal:'gas',rot:2900,desc:'Red dwarf flare star.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Proxima',id:'pb',name:'Proxima b',t:'rock',r:7160,a:7.3e6,per:271,rot:43,pal:'terra',at:45,g:10.2,tk:278,res:{ice:4,org:4,ore:2},desc:'Temperate world in the habitable zone. A second Earth.',haz:'MINOR TECTONIC ACTIVITY'},
 {sys:'Proxima',id:'ember',name:'Ember',t:'rock',par:'pb',r:1450,a:62000,per:96,rot:96,pal:'rock',g:1.8,tk:200,res:{ore:3,ice:1},desc:'Sun-scorched moon of Proxima b.',haz:'NO ATMOSPHERE'},
 {sys:'AlphaCen',id:'alpa',name:'Alpha Centauri A',t:'star',r:850000,pal:'gas',rot:5200,desc:'Yellow twin of the trinity.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'AlphaCen',id:'alpb',name:'Alpha Centauri B',t:'star',par:'alpa',r:612000,a:3.5e9,per:4e5,rot:4400,pal:'gas',desc:'Orange dwarf in wide binary orbit.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'AlphaCen',id:'alkere',name:'Alkere',t:'rock',r:7600,a:1.9e8,per:6800,rot:26,pal:'ocean',at:70,g:11,tk:291,res:{ice:3,org:3},desc:'Ocean world — island archipelagos, warm rains.',haz:'STORM SEAS'},
 {sys:'AlphaCen',id:'thessia',name:'Thessia',t:'rock',par:'alkere',r:1800,a:90000,per:150,rot:150,pal:'ice',g:2.4,tk:180,res:{ice:3,exo:1},desc:'Frozen moon over a blue sea.',haz:'NO ATMOSPHERE · COLD'},
 {sys:'Barnard',id:'barnard',name:"Barnard's Star",t:'star',r:103000,pal:'gas',rot:3200,desc:'Ancient red dwarf.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Barnard',id:'inger',name:'Inger',t:'rock',r:5900,a:8.4e7,per:390,rot:37,pal:'ice',at:18,g:8.2,tk:175,res:{ice:4,ore:2,exo:1},desc:'Glacier world under a red sun.',haz:'DEEP COLD · THIN AIR'},
 {sys:'Barnard',id:'skadi',name:'Skadi',t:'rock',par:'inger',r:900,a:45000,per:71,rot:71,pal:'ice',g:1.1,tk:90,res:{ice:2,exo:1},desc:'A snowball moon.',haz:'NO ATMOSPHERE · EXTREME COLD'},
 {sys:'Sirius',id:'sira',name:'Sirius A',t:'star',r:1190000,pal:'gas',rot:3800,desc:'Brightest star in Earth\'s old sky.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Sirius',id:'sirb',name:'Sirius B',t:'star',par:'sira',r:5850,a:1.5e9,per:1.2e5,rot:8500,pal:'rock',desc:'White dwarf — a dead star\'s ember.',haz:'SURFACE = 25000K. INSTANT DEATH'},
 {sys:'Sirius',id:'aster',name:'Aster',t:'rock',r:6200,a:5.2e8,per:9000,rot:19.4,pal:'desert',at:30,g:9,tk:335,res:{ore:4,exo:1,org:1},desc:'Hot ochre desert world.',haz:'HEAT · DUST STORMS'},
 {sys:'Vega',id:'vega',name:'Vega',t:'star',r:1460000,pal:'gas',rot:3060,desc:'Blue-white giant, 25 light years out.',haz:'STELLAR CORONA — LETHAL'},
 {sys:'Vega',id:'vegamir',name:'Vegamir',t:'rock',r:15500,a:1.1e9,per:12000,rot:14.7,pal:'ice',at:90,g:13.2,tk:95,res:{ice:5,exo:3},ring:[21000,40000],desc:'Ringed ice super-earth. Exotic matter motherlode.',haz:'EXTREME COLD · HIGH GRAVITY'},
 {sys:'Vega',id:'hale',name:'Hale',t:'rock',par:'vegamir',r:2100,a:220000,per:210,rot:210,pal:'rock',g:2.6,tk:130,res:{ore:3},desc:'Rocky moon inside the ring plane.',haz:'NO ATMOSPHERE · RING DEBRIS'}
];
/*------------ procedural deep-space anomalies (seeded chart) ------------*/
const ANOM={bh:[],neb:[],wh:[],voy:null};
(function(){
 const mk=(x,y,z)=>V3(x,y,z).multiplyScalar(US);
 ANOM.bh.push({name:'MAW OF KERR',pos:[6.2e14,-2.1e14,3.4e14],r:7.5e7,posU:mk(6.2e14,-2.1e14,3.4e14),
  desc:'Stellar-mass black hole. The accretion disk outshines entire moons.',haz:'EVENT HORIZON — DO NOT APPROACH'});
 ANOM.bh.push({name:'HOLLOW CROWN',pos:[-9.4e14,4.6e14,-7.7e14],r:5.2e7,posU:mk(-9.4e14,4.6e14,-7.7e14),
  desc:'A dead star wrapped in a cold ring of shattered light. Nothing that falls in reports back.',haz:'EVENT HORIZON — DO NOT APPROACH'});
 ANOM.neb.push({name:'CARINA VEIL',pos:[-2.2e14,5.5e13,1.6e14],R:7.5e13,c:'#ff5a8a',posU:mk(-2.2e14,5.5e13,1.6e14),
  desc:'Crimson emission nebula. Starbirth region, heavy radiation, sensor scatter.',haz:'SENSOR INTERFERENCE — REDUCED VISIBILITY'});
 ANOM.neb.push({name:'EMBER NURSERY',pos:[5.4e13,-3.2e13,7.8e13],R:6.2e13,c:'#ffb347',posU:mk(5.4e13,-3.2e13,7.8e13),
  desc:'Amber hydrogen clouds lit from within by infant stars.',haz:'SENSOR INTERFERENCE — REDUCED VISIBILITY'});
 ANOM.neb.push({name:'PALE MAELSTROM',pos:[-1.2e14,-6.4e13,-9.6e13],R:5.4e13,c:'#7fd4ff',posU:mk(-1.2e14,-6.4e13,-9.6e13),
  desc:'Cold blue cyclotron of gas and dust, slowly collapsing.',haz:'SENSOR INTERFERENCE — REDUCED VISIBILITY'});
 ANOM.wh.push({name:'CYAN GATE A',pos:[8.5e12,2.2e12,-4.1e12],link:1,c:'#7fd4ff',posU:mk(8.5e12,2.2e12,-4.1e12),
  desc:'Stable wormhole mouth. Fly in, come out somewhere else entirely.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.wh.push({name:'CYAN GATE B',pos:[-1.46e14,8.9e13,1.31e14],link:0,c:'#7fd4ff',posU:mk(-1.46e14,8.9e13,1.31e14),
  desc:'Stable wormhole mouth. Its twin hangs near Sol.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.wh.push({name:'AMBER GATE A',pos:[2.9e13,4.8e13,-5.8e13],link:3,c:'#ffb347',posU:mk(2.9e13,4.8e13,-5.8e13),
  desc:'Wormhole mouth near Sirius. The amber twin waits toward Barnard.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.wh.push({name:'AMBER GATE B',pos:[4.9e13,-1.9e13,2.9e13],link:2,c:'#ffb347',posU:mk(4.9e13,-1.9e13,2.9e13),
  desc:'Wormhole mouth. The amber twin waits near Sirius.',haz:'TRAVEL GATE — FLIES BOTH WAYS'});
 ANOM.voy={name:'VOYAGER 1',pos:[1.22e10,5.1e9,-2.05e10],posU:mk(1.22e10,5.1e9,-2.05e10),c:'#ffd9a0',
  desc:'Humanity\'s farthest reach. 1977 vintage, golden record still bolted on.',haz:'RARE RELIC — RECOVERABLE'};
 for(const n of ANOM.neb)n.col3=new THREE.Color(n.c);
})();
function freshFL(){return{v:13,t:0,mode:'space',sys:'Sol',p:[839,0,0],q:[0,0,0,1],spd:0,thr:0,vel:null,suit:'flight',assist:true,
 land:null,
 pow:{brk:{main:true,life:true,eng:true,nav:true,lit:true},amp:false,heat:true,grav:true,rea:{on:true,water:100,scram:0},batt:100},
 sysd:{hull:100,eng:100,rea:100,lif:100,avo:100},
 inv:{water:8,food:4,ice:0,ore:0,exo:0,metal:0,parts:3},
 vit:{hp:100,suit:100,cab:100,hun:100,thi:100},
 flg:{intro:false,earthGone:false,goneT:0,won:false,roverOut:false},
 builds:[],cr:500,netName:null,
 o2:{coc:100,liv:100,eng:100,gar:100},
 wire:[{s:'airlock',d:'lights'},{s:'airlock',d:'siren'},{s:'o2',d:'lights'},{s:'o2',d:'siren'},{s:'o2',d:'hud'}],
 alloc:{eng:1,nav:1,life:1},
 scan:{},log:[],supQ:null,mark:null,hot:0,roverPwr:false};}
let FL=freshFL(),INV=FL.inv,VIT=FL.vit,POW=FL.pow,SYSD=FL.sysd,FLG=FL.flg;
const T={t:0,dt:0,rate:60};
const PL={pos:V3(0,0,6),vel:V3(0,0,0),yaw:Math.PI,pitch:0,seated:false,seatX:0,inside:true,onG:true,suitOn:false,hurtT:0};
const SP={pos:V3(839,0,0),q:new THREE.Quaternion(),spd:0,thr:0,vel:V3(0,0,0),fwd:V3(0,0,-1),up:V3(0,1,0),rt:V3(1,0,0)};
const H={chg:0,on:false,t:0,cd:0,heat:0};
const STK={x:0,y:0};
const CAMM='fp';let camMode='fp';
let MARK=null,TERM=null,HOVERED=null,PAUSED=false,DEAD=false,BOOTED=false,MENU=true,INTRO={on:false,t:0,ln:0,boom:false,done:true};
let COURSE=null,GEARST={d:0,tgt:0},FRAMEID=0,SDT=0;
const GEARLEGS=[],DBTN=[],NAVL=[],NAVS=[],ENGCONE=[],KEEP=new Set();
let STROBE=null,NEBHALO=null;
const EVT={next:300};const EVTS=[];
let LAND=null,LF={up:V3(0,1,0),east:V3(1,0,0),zn:V3(0,0,1),sun:V3(1,0,0),sinE:0,lst:12,temp:15,dayF:0,body:null,qw:null};
let TER=null,CACHE=null,SRF={wind:0,extL:false,navL:true,align:false,whcd:0,nebK:0,nebName:'',bhK:0};
let MODE='space';
function toast(m,a){const d=document.createElement('div');d.className='tmsg'+(a?' a':'');d.textContent=m;$('toast').appendChild(d);setTimeout(()=>d.remove(),4600);}
function saveGame(silent){FL.t=T.t;FL.mode=MODE;FL.p=[SP.pos.x,SP.pos.y,SP.pos.z];FL.q=[SP.q.x,SP.q.y,SP.q.z,SP.q.w];FL.spd=SP.spd;FL.thr=SP.thr;
 FL.vel=[SP.vel.x,SP.vel.y,SP.vel.z];FL.suit=FL.suit||'flight';FL.assist=FL2.assist;FL.v=13;
 if(MODE==='surface'&&LAND&&SURF2.on){
  LAND.roverOut=ROVER.out;
  LAND.roverP=ROVER.out?(function(){const d=sur2DirAt(ROVER.g.position.x,ROVER.g.position.z,new THREE.Vector3()).clone();return[d.x,d.y,d.z,ROVER.head];})():null;
  FL.land={b:LAND.b,sd:[SURF2.anchor.x,SURF2.anchor.y,SURF2.anchor.z],sa:Math.max(0,sur2AltM(SHIPG.position)),yaw:LAND.yaw||0,roverP:LAND.roverP};}
 else FL.land=null;
 FL.roverPwr=ROVER.rea;
 try{localStorage.setItem(SAVEKEY,JSON.stringify(FL,(k,v)=>k.charAt(0)==='_'?undefined:v));if(!silent)toast('GAME SAVED');}catch(e){toast('SAVE FAILED');}}
function loadGame(){try{const s=localStorage.getItem(SAVEKEY);if(!s)return false;const o=JSON.parse(s);if(o.v!==11&&o.v!==12&&o.v!==13)return false;
 if(o.v===11){o.v=13;o.builds=[];o.cr=500;o.netName=null;o.o2={coc:100,liv:100,eng:100,gar:100};
  o.wire=[{s:'airlock',d:'lights'},{s:'airlock',d:'siren'},{s:'o2',d:'lights'},{s:'o2',d:'siren'},{s:'o2',d:'hud'}];o.alloc={eng:1,nav:1,life:1};}
 if(o.v===12||o.v===11){o.v=13;
  o.vel=null;o.suit='flight';o.assist=true;
  if(o.land&&o.land.q0){o.land.sd=o.land.q0;o.land.sa=o.land.alt||0;}}
 FL=o;INV=FL.inv;VIT=FL.vit;POW=FL.pow;SYSD=FL.sysd;FLG=FL.flg;T.t=FL.t||0;MODE=FL.mode||'space';
 if(MODE==='surface'&&!FL.land)MODE='space';
 LAND=FL.land?{b:FL.land.b,q0:FL.land.sd,yaw:FL.land.yaw||0,alt:FL.land.sa||0,roverP:FL.land.roverP||null,roverOut:FL.land.roverP?true:false}:null;
 SP.pos.set(FL.p[0],FL.p[1],FL.p[2]);SP.q.set(FL.q[0],FL.q[1],FL.q[2],FL.q[3]);SP.spd=FL.spd||0;SP.thr=FL.thr||0;
 if(FL.vel)SP.vel.set(FL.vel[0],FL.vel[1],FL.vel[2]);
 else{SP.fwd.set(0,0,-1).applyQuaternion(SP.q);SP.vel.copy(SP.fwd).multiplyScalar(SP.spd);}
 FL2.assist=FL.assist!==false;FL.suit=FL.suit||'flight';
 MARK=FL.mark?bodyById(FL.mark):null;
 const ep=FL.earthPosKm;if(ep&&typeof ep.copy!=='function')FL.earthPosKm=V3(ep.x||0,ep.y||0,ep.z||0);if(!FL.earthPosKm)FL.earthPosKm=V3(0,0,0);
 return true;}catch(e){return false;}}
function bodyById(id){return BODY.find(b=>b.id===id);}
function bodyName(id){const b=bodyById(id);return b?b.name:id;}
/*------------ AUDIO ------------*/
const AU={on:false,v:.7};
AU.init=function(){if(AU.on)return;try{const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();AU.mg=AU.ctx.createGain();AU.mg.gain.value=AU.v;AU.mg.connect(AU.ctx.destination);
 const nb=AU.ctx.createBuffer(1,AU.ctx.sampleRate*2,AU.ctx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=nb;AU.on=true;AU.lo={};}catch(e){}};
AU.setV=function(v){AU.v=v;if(AU.mg)AU.mg.gain.value=v;};
function aOsc(t,f){const o=AU.ctx.createOscillator();o.type=t;o.frequency.value=f;return o;}
function aGain(v){const g=AU.ctx.createGain();g.gain.value=v;return g;}
function aNoise(){const s=AU.ctx.createBufferSource();s.buffer=AU.noise;s.loop=true;return s;}
AU.loop=function(id,make){if(!AU.on)return null;if(!AU.lo[id])AU.lo[id]=make();return AU.lo[id];};
function setLoop(id,g,f){if(!AU.on)return;const l=AU.loop(id,()=>{const g0=aGain(0);g0.connect(AU.mg);const inner=makeLoops[id]();inner.connect(g0);return{g:g0};});if(l){l.g.gain.setTargetAtTime(g,AU.ctx.currentTime,.12);if(f&&l.f)l.f.frequency.setTargetAtTime(f,AU.ctx.currentTime,.1);}}
const makeLoops={
 eng:()=>{const o=aOsc('sawtooth',48);o.start();const n=aNoise();n.start();const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=260;o.connect(lp);n.connect(lp);return lp;},
 rea:()=>{const o=aOsc('triangle',57);o.start();const o2=aOsc('sine',114);o2.start();const m=aGain(.5);o.connect(m);o2.connect(m);return m;},
 wind:()=>{const n=aNoise();n.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=460;bp.Q.value=.4;n.connect(bp);return bp;},
 hyp:()=>{const o=aOsc('sawtooth',170);o.start();const o2=aOsc('sawtooth',173.5);o2.start();const hp=AU.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=240;const m=aGain(.5);o.connect(m);o2.connect(m);m.connect(hp);return hp;},
 drl:()=>{const o=aOsc('square',61);o.start();const n=aNoise();n.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=880;bp.Q.value=1.2;const m=aGain(.4);o.connect(m);n.connect(m);m.connect(bp);return bp;},
 pad:()=>{const o=aOsc('triangle',110);o.start();const o2=aOsc('triangle',164.8);o2.start();const o3=aOsc('triangle',220.6);o3.start();const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;const m=aGain(1);o.connect(m);o2.connect(m);o3.connect(m);m.connect(lp);return lp;},
 alm:()=>{const o=aOsc('square',560);o.start();const m=aGain(.6);o.connect(m);return m;},
 rumble:()=>{const o=aOsc('sawtooth',34);o.start();const n=aNoise();n.start();const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=110;const m=aGain(.5);o.connect(m);n.connect(m);m.connect(lp);return lp;},
 neb:()=>{const n=aNoise();n.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=200;bp.Q.value=.25;n.connect(bp);return bp;},
 siren:()=>{const o=aOsc('square',680);o.start();const l=aOsc('sine',2.4);l.start();const lg=aGain(320);l.connect(lg);lg.connect(o.frequency);const m=aGain(.35);o.connect(m);return m;},
 voc:()=>{const o1=aOsc('sawtooth',142);o1.start();const o2=aOsc('sine',196);o2.start();const l=aOsc('sine',5.2);l.start();const bp=AU.ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=720;bp.Q.value=2.4;const lg=aGain(340);l.connect(lg);lg.connect(bp.frequency);const m=aGain(.55);o1.connect(m);o2.connect(m);m.connect(bp);return bp;}
};
function sfx(n){if(!AU.on)return;const c=AU.ctx,t=c.currentTime;const env=(g,a,pk,d)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);};
 const tone=(ty,f0,f1,pk,d)=>{const o=aOsc(ty,f0),g=aGain(0);o.connect(g);g.connect(AU.mg);if(f1)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+d);env(g,.005,pk,d);o.start(t);o.stop(t+d+.1);};
 const nz=(pk,d,fc)=>{const s=aNoise(),f=AU.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=fc;const g=aGain(0);s.connect(f);f.connect(g);g.connect(AU.mg);env(g,.01,pk,d);s.start(t);s.stop(t+d+.1);};
 if(n==='click')tone('square',900,700,.1,.06);
 else if(n==='beep')tone('sine',740,740,.12,.14);
 else if(n==='sw'){tone('square',420,300,.09,.08);setTimeout(()=>sfx('click'),70);}
 else if(n==='deny')tone('sawtooth',130,90,.14,.22);
 else if(n==='pickup')tone('sine',540,860,.12,.12);
 else if(n==='thud'){nz(.2,.18,300);tone('sine',90,50,.2,.2);}
 else if(n==='door')nz(.14,.5,900);
 else if(n==='ramp'){tone('sawtooth',60,110,.1,1.6);nz(.1,1.6,400);}
 else if(n==='boom'){nz(.5,2.4,700);tone('sine',110,26,.5,2.2);}
 else if(n==='whoosh')nz(.3,.9,2400);
 else if(n==='hiss')nz(.16,.4,3800);
 else if(n==='heal')tone('sine',420,640,.1,.3);
 else if(n==='step'){nz(.04,.07,600);tone('triangle',rnd(280,430),200,.028,.06);}
 else if(n==='gear'){nz(.14,.3,500);tone('square',170,110,.12,.32);setTimeout(()=>{nz(.1,.22,300);},240);}
 else if(n==='tele'){tone('sine',200,940,.2,.7);setTimeout(()=>tone('sine',900,170,.18,.8),380);nz(.1,.9,1400);}
 else if(n==='ping')tone('sine',1180,1150,.15,.9);
 else if(n==='flare')tone('sawtooth',520,1500,.15,.8);
 else if(n==='flash'){nz(.4,2.6,260);tone('sine',72,28,.4,2.4);}
 else if(n==='hov')tone('sine',1250,1200,.045,.04);
 else if(n==='warp'){for(let i=0;i<3;i++)setTimeout(()=>tone('sawtooth',140+i*90,700+i*420,.2,1.8),i*150);nz(.18,2.2,900);}
 else if(n==='warpin'){nz(.45,1.8,600);tone('sine',900,60,.35,1.5);tone('sine',60,900,.28,1.9);}
 else if(n==='build'){nz(.16,.22,800);tone('square',220,140,.13,.2);}
 else if(n==='squelch'){nz(.07,.06,3400);tone('square',1500,900,.05,.05);}
 else if(n==='dock'){tone('sine',180,120,.22,.5);nz(.12,.5,400);setTimeout(()=>tone('sine',240,180,.18,.4),260);}
 else if(n==='cash'){tone('sine',880,880,.12,.1);setTimeout(()=>tone('sine',1320,1320,.12,.16),110);}
 else if(n==='radio'){tone('sine',740,740,.07,.08);setTimeout(()=>tone('sine',980,980,.07,.1),90);}}
function saveSet(){try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}}

/*==================== PART 3 — TEXTURES, UNIVERSE, PLANETS ====================*/
function hxc(h){if(typeof h==='number')h='#'+h.toString(16).padStart(6,'0');return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255];}
function hashId(s){let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h%99991;}
function mkn3(seed){const h=(x,y,z)=>{let n=(x*374761393+y*668265263+z*1440662683+seed*97)|0;n=(n^(n>>>13))*1274126177|0;n=n^(n>>>16);return((n>>>0)%10000)/10000;};
 return(x,y,z)=>{const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
 const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
 const a=lerp(h(xi,yi,zi),h(xi+1,yi,zi),u),b=lerp(h(xi,yi+1,zi),h(xi+1,yi+1,zi),u),c=lerp(h(xi,yi,zi+1),h(xi+1,yi,zi+1),u),d=lerp(h(xi,yi+1,zi+1),h(xi+1,yi+1,zi+1),u);
 return lerp(lerp(a,b,v),lerp(c,d,v),w);};}
function fbm3(n,x,y,z,o){let a=.5,f=1,s=0,t=0;for(let i=0;i<o;i++){s+=a*n(x*f,y*f,z*f);t+=a;a*=.5;f*=2.02;}return s/t;}
function glowTexture(){const cv=document.createElement('canvas');cv.width=cv.height=128;const cx=cv.getContext('2d');
 const g=cx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
 cx.fillStyle=g;cx.fillRect(0,0,128,128);return new THREE.CanvasTexture(cv);}
const GLOW=glowTexture();
function makeLabel(txt,w,h,col,bgc,fs){const cv=document.createElement('canvas');cv.width=256;cv.height=Math.max(32,Math.round(256*h/w));const cx=cv.getContext('2d');
 if(bgc){cx.fillStyle=bgc;cx.fillRect(0,0,cv.width,cv.height);}
 cx.font='bold '+Math.round((fs||30)*(cv.height/64))+'px Consolas,monospace';cx.textAlign='center';cx.textBaseline='middle';
 cx.fillStyle=col||'#ffd9a0';cx.fillText(txt,cv.width/2,cv.height/2+1);
 const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}));return m;}
/*------------ body construction ------------*/
const BODY=[];
const BSTAR={};
const UNI=new THREE.Group();scene.add(UNI);
/* seeded PRNG — the cosmic structure stays fixed & persistent */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function seedVec(id){const s=mulberry32(((hashId(id)||1)^Math.imul(SET.useed||777,2654435761))>>>0);return V3(s()*41-20,s()*41-20,s()*41-20);}
/* --- GLSL: Ashima 3D simplex noise + fBm --- */
const GLSL_NOISE=`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
 const vec2 C=vec2(1./6.,1./3.);
 const vec4 D=vec4(0.,.5,1.,2.);
 vec3 i=floor(v+dot(v,C.yyy));
 vec3 x0=v-i+dot(i,C.xxx);
 vec3 g=step(x0.yzx,x0.xyz);
 vec3 l=1.-g;
 vec3 i1=min(g.xyz,l.zxy);
 vec3 i2=max(g.xyz,l.zxy);
 vec3 x1=x0-i1+C.xxx;
 vec3 x2=x0-i2+C.yyy;
 vec3 x3=x0-D.yyy;
 i=mod289(i);
 vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
 float n_=0.142857142857;
 vec3 ns=n_*D.wyz-D.xzx;
 vec4 j=p-49.*floor(p*ns.z*ns.z);
 vec4 x_=floor(j*ns.z);
 vec4 y_=floor(j-7.*x_);
 vec4 x=x_*ns.x+ns.yyyy;
 vec4 y=y_*ns.x+ns.yyyy;
 vec4 h=1.-abs(x)-abs(y);
 vec4 b0=vec4(x.xy,y.xy);
 vec4 b1=vec4(x.zw,y.zw);
 vec4 s0=floor(b0)*2.+1.;
 vec4 s1=floor(b1)*2.+1.;
 vec4 sh=-step(h,vec4(0.));
 vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
 vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
 vec3 p0=vec3(a0.xy,h.x);
 vec3 p1=vec3(a0.zw,h.y);
 vec3 p2=vec3(a1.xy,h.z);
 vec3 p3=vec3(a1.zw,h.w);
 vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
 p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
 vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
 m=m*m;
 return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float a=.5,f=1.,s=0.,t=0.;for(int i=0;i<5;i++){s+=a*snoise(p*f);t+=a;a*=.5;f*=2.03;}return s/t;}
`;
const PLANT_VS=`varying vec3 vN;varying vec3 vNW;varying vec3 vWP;
void main(){vN=normalize(position);vNW=normalize(mat3(modelMatrix)*normal);vWP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const PLANT_FS=GLSL_NOISE+`
uniform vec3 uSeed,uSeaCol,uLo,uHi,uPk,uStarC,uSunD,uCamP;
uniform float uMode,uFreq,uSeaL,uNightAmt,uLava,uTime;
varying vec3 vN,vNW,vWP;
void main(){
 vec3 p=vN;
 vec3 L=normalize(uSunD);
 if(uMode>2.5){ /* star: granulation + limb darkening */
  float g=fbm(p*5.5+uSeed+vec3(uTime*.015,0.,uTime*.01));
  float g2=fbm(p*17.+uSeed*2.3);
  vec3 col=uStarC*(1.22+.6*g+.28*g2)+vec3(.25);
  float mu=clamp(dot(normalize(uCamP-vWP),vNW),0.,1.);
  col*=.5+.5*pow(mu,.55);
  gl_FragColor=vec4(col,1.);return;}
 float dif=smoothstep(-.06,.14,dot(vNW,L));
 vec3 col=vec3(.5);float spec=0.;float emis=0.;
 if(uMode<.5){ /* terran: fBm continents, biomes, ice, night cities */
  float e=fbm(p*uFreq+uSeed);
  float e2=fbm(p*uFreq*3.6+uSeed*1.7+5.);
  float det=e*.72+e2*.28;
  float land=smoothstep(uSeaL,uSeaL+.015,det);
  float t=clamp((det-uSeaL)/max(1.-uSeaL,.001),0.,1.);
  vec3 low=mix(uLo,uHi,smoothstep(.02,.48,t));
  vec3 hi=mix(low,uPk,smoothstep(.58,.82,t));
  vec3 landC=mix(uHi*1.05+vec3(.14,.11,.06),hi,smoothstep(.012,.075,t));
  float dp=clamp((uSeaL-det)/max(uSeaL,.001),0.,1.);
  vec3 sea=uSeaCol*mix(1.02,.42,dp);
  col=mix(sea,landC,land);
  float cap=smoothstep(.74,.88,abs(p.y)+e2*.16);
  col=mix(col,vec3(.93,.96,1.),cap);
  spec=(1.-land)*(1.-cap*.8);
  float city=smoothstep(.58,.8,fbm(p*6.5+uSeed*3.1+11.))*land*(1.-cap);
  emis=uNightAmt*city;
 }else if(uMode<1.5){ /* gas giant: domain-warped bands */
  float warp=fbm(p*2.6+uSeed);
  float b=sin(p.y*7.+warp*2.6+uSeed.x)*.5+.5;
  col=mix(uLo,uHi,smoothstep(.18,.82,b));
  col*= .9+.16*fbm(p*8.5+uSeed*2.+vec3(warp*.8));
  col=mix(col,uPk,smoothstep(.87,1.,b)*.55);
 }else{ /* barren: ridged fBm + craters + optional lava */
  float e=fbm(p*uFreq+uSeed);
  float r=1.-abs(fbm(p*uFreq*2.2+uSeed*2.+7.));
  float t=clamp(e*.62+r*.38,0.,1.);
  col=mix(uLo,uHi,smoothstep(.14,.58,t));
  col=mix(col,uPk,smoothstep(.68,.9,t));
  col*= .84+.16*smoothstep(.4,.52,abs(fbm(p*5.5+uSeed+3.)));
  if(uLava>.5){
   float lk=1.-smoothstep(.015,.075,abs(fbm(p*4.6+uSeed*1.3)-.5));
   col+=vec3(1.05,.3,.03)*lk*1.7;emis=lk*.9;}}
 vec3 lit=col*(dif*1.14+.032);
 lit*=mix(vec3(1.),vec3(1.1,.97,.85),smoothstep(.4,0.,dif)*.55);
 vec3 V=normalize(uCamP-vWP);
 vec3 H=normalize(V+L);
 lit+=spec*pow(max(dot(vNW,H),0.),85.)*dif*vec3(.85,1.,1.15)*.8;
 lit+=emis*(1.-dif)*vec3(1.,.62,.3)*1.5+emis*vec3(.5,.2,.05);
 gl_FragColor=vec4(lit,1.);}`;
const CLOUD_FS=GLSL_NOISE+`
uniform vec3 uSeed,uSunD;uniform float uTime,uFreqC;
varying vec3 vN,vNW,vWP;
void main(){
 float e=fbm(vN*uFreqC+uSeed+vec3(uTime*.006,0.,uTime*.004));
 float e2=fbm(vN*uFreqC*2.7+uSeed*1.9+vec3(-uTime*.004,0.,uTime*.003));
 float a=smoothstep(.5,.72,e*.75+e2*.25);
 float dif=smoothstep(-.08,.2,dot(vNW,normalize(uSunD)));
 gl_FragColor=vec4(vec3(1.05)*(dif+.04),a*.9);}`;
const AT_VS='varying vec3 vWN;varying vec3 vWP;void main(){vWN=normalize(mat3(modelMatrix)*normal);vWP=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const AT_FS=`uniform vec3 uC,uSun,uCam;uniform float uI;
varying vec3 vWN,vWP;
void main(){
 vec3 V=normalize(uCam-vWP);
 vec3 L=normalize(uSun);
 float rim=pow(clamp(1.-abs(dot(vWN,V)),0.,1.),2.2);
 float mu=dot(V,L);
 float ray=.75*(1.+mu*mu);
 float mie=pow(max(mu,0.),9.);
 vec3 sc=uC*ray*rim+vec3(1.,.86,.72)*mie*rim*.5;
 sc=mix(sc,sc*vec3(1.4,.6,.3),smoothstep(.32,-.06,dot(vWN,L))*.55);
 float lit=clamp(dot(vWN,L)*.72+.42,0.,1.);
 float a=clamp(rim*uI*lit+rim*mie*.35,0.,1.);
 gl_FragColor=vec4(sc*a*1.7,a);}`;
function bodyUniforms(bd){
 const P=PAL[bd.pal];
 return{uSeed:{value:seedVec(bd.id)},uSunD:{value:V3(1,0,0)},uCamP:{value:V3(0,0,0)},uTime:{value:0},
  uMode:{value:bd.t==='star'?3:(bd.t==='gas'?1:((bd.pal==='earth'||bd.pal==='ocean'||bd.pal==='terra')?0:2))},
  uFreq:{value:bd.t==='gas'?2.4:2.9+(hashId(bd.id)%140)/100},
  uSeaL:{value:bd.pal==='ocean'?.34:bd.pal==='terra'?.47:bd.pal==='earth'?.52:.5},
  uSeaCol:{value:new THREE.Color(P.sea||P.lo)},uLo:{value:new THREE.Color(P.lo)},uHi:{value:new THREE.Color(P.hi)},uPk:{value:new THREE.Color(P.pk)},
  uStarC:{value:new THREE.Color(SYSTEMS[bd.sys].c)},
  uNightAmt:{value:bd.night?1:0},uLava:{value:bd.pal==='lava'?1:0}};}
/*==================== PART 3B — PROCEDURAL UNIVERSE v2 (4 galaxies → ~56 systems → worlds, moons, stations) ====================*/
const GAL=[
 {id:'orion',name:'ORION SPUR',c:'#ffd9a0',ctr:[0,0,0],spread:1.9e14,home:1},
 {id:'veil',name:'SAGITTARIUS VEIL',c:'#ff8ac0',ctr:[5.4e16,3.2e16,-7.1e16],spread:2.2e15},
 {id:'lyra',name:'LYRA DEEP',c:'#7fd4ff',ctr:[-6.8e16,4.4e16,5.6e16],spread:2.6e15},
 {id:'forge',name:'THE COLD FORGE',c:'#b8ff9a',ctr:[4.6e17,-2.8e17,8.4e16],spread:3.2e15}];
const STATIONS=[];
(function expandUniverse(){
 const rng=mulberry32(((SET.useed||777)*2246822519)>>>0);
 const pick=a=>a[Math.floor(rng()*a.length)];
 const SYL=['KEL','VOR','TASH','MIR','OTH','ZAN','KRE','VAL','SUR','NOX','HEX','ARA','DUN','KOR','SEL','RIG','THAL','UMB','BRA','VEX','OSH','KAAN','LOTH','MER','SOLI','VAR'];
 const used=new Set(Object.keys(SYSTEMS).map(s=>SYSTEMS[s].name));
 const mkName=()=>{let n,guard=0;do{n=pick(SYL)+(rng()<.45?pick(SYL).toLowerCase():'')+(rng()<.75?'-'+(Math.floor(rng()*89)+10):' '+['MAJOR','MINOR','PRIME','II','III','IV','V','IX'][Math.floor(rng()*8)]);guard++;}while(used.has(n)&&guard<40);used.add(n);return n;};
 const CLS=[['O',[.62,.72,1],900000],['B',[.72,.82,1],520000],['A',[.86,.92,1],300000],['F',[.99,.99,.98],180000],['G',[1,.96,.85],130000],['K',[1,.85,.64],95000],['M',[1,.72,.5],70000]];
 const PALS=['rock','desert','ice','lava','toxic','ocean','terra','earth'];
 const DESC={
  rock:['An ancient cratered carcass of a world.','Silent, airless, hammered by eons of impacts.','A broken stone hurtling in the dark.'],
  desert:['Ochre dunes to the horizon. The wind never rests.','A furnace of rust and grit.','Salt flats crack under a bleached sky.'],
  ice:['A frozen ocean sealed beneath kilometers of crust.','Glacial ridges groan in the long night.','Blue-white and utterly still.'],
  lava:['Rivers of molten rock vein the crust.','The surface breathes fire. Sensors struggle.','A young world, still furious at being born.'],
  toxic:['Amber clouds of poison drift in slow cyclones.','The air itself is a solvent. Suit integrity critical.','Acid rains etch the lowlands.'],
  ocean:['Endless sea, scattered archipelagos.','Warm rains over deep water.','A water world — land is a rumor here.'],
  terra:['Continents of scrub and red grass.','A temperate world under a patient sun.','Canyons, dust, and thin but workable air.'],
  earth:['Green continents under white cloud decks.','A living world — oceans, storms, seasons.','Almost, almost like home.']};
 const HAZZ={rock:'NO ATMOSPHERE',desert:'HEAT · DUST STORMS',ice:'EXTREME COLD',lava:'MOLTEN SURFACE · RADIATION',toxic:'TOXIC ATMOSPHERE',ocean:'DEEP OCEAN · STORM SEAS',terra:'THIN ATMOSPHERE',earth:'HABITABLE — RARE'};
 let nExp=0;
 for(const g of GAL){
  const nSys=14;
  for(let i=0;i<nSys;i++){
   const key='X'+g.id+nExp;nExp++;
   const cls=CLS[Math.floor(Math.pow(rng(),1.7)*7)];
   const name=mkName();
   let px,py,pz;
   if(g.home){px=(rng()*2-1)*g.spread;py=(rng()*2-1)*g.spread*.22;pz=(rng()*2-1)*g.spread;}
   else{px=g.ctr[0]+(rng()*2-1)*g.spread;py=g.ctr[1]+(rng()*2-1)*g.spread*.3;pz=g.ctr[2]+(rng()*2-1)*g.spread;}
   const hxr=v=>Math.round(v*255);
   const cHex=(hxr(cls[1][0])<<16)|(hxr(cls[1][1])<<8)|hxr(cls[1][2]);
   SYSTEMS[key]={name,pos:[px,py,pz],c:cHex,gal:g.id};
   BDEF.push({sys:key,id:'st'+key,name:name,t:'star',r:cls[2]*(0.8+rng()*1.5),pal:'gas',rot:200+rng()*4000,desc:cls[0]+'-class star in the '+g.name+'.',haz:'STELLAR CORONA — LETHAL'});
   const nPl=2+Math.floor(rng()*6);
   let a=(0.32+rng()*.5)*1.5e8;
   for(let p=0;p<nPl;p++){
    a*=1.55+rng()*1.1;
    const early=p<2&&a<1.1e8;
    const pal=early?pick(['rock','desert','lava','toxic']):pick(PALS);
    const pid='p'+key+'_'+p;
    const r=1400+Math.pow(rng(),2)*15000;
    const hot=a<1.2e8,cold=a>7e8;
    const tk=pal==='lava'?1000:hot?600+rng()*300:cold?70+rng()*90:200+rng()*130;
    const res={};if(rng()<.8)res.ore=1+Math.floor(rng()*4);if(rng()<.6)res.ice=1+Math.floor(rng()*4);if(rng()<.35)res.org=1+Math.floor(rng()*3);if(rng()<.22)res.exo=1+Math.floor(rng()*3);
    const bd={sys:key,id:pid,name:name.split(' ')[0]+' '+['b','c','d','e','f','g','h'][p],t:pal==='gas'?'gas':'rock',r,a,per:400+Math.floor(rng()*30000),rot:(6+rng()*70)*(rng()<.15?-1:1),pal,
     g:pal==='gas'?8+rng()*18:(r/6371)*9.8*(.7+rng()*.6),tk,res,desc:pick(DESC[pal]),haz:HAZZ[pal]};
    if(pal==='gas'){bd.haz='NO SOLID SURFACE — DO NOT DESCEND';if(rng()<.4)bd.ring=[r*.18,r*.34];}
    else bd.at=(pal==='earth'||pal==='ocean'||pal==='terra')?(40+Math.floor(rng()*70)):(pal==='toxic'?110:(rng()<.5?Math.floor(rng()*20):0));
    BDEF.push(bd);
    const nMoon=(pal==='gas'?Math.floor(rng()*4):(rng()<.42?1+Math.floor(rng()*2):0));
    for(let m=0;m<nMoon;m++){
     const mres=rng()<.7?{ore:1+Math.floor(rng()*3),ice:rng()<.6?1+Math.floor(rng()*3):0}:{};
     BDEF.push({sys:key,id:pid+'m'+m,name:bd.name.split(' ').pop()+'-'+(m+1),t:'rock',par:pid,r:600+Math.floor(rng()*1900),a:r*(2.2+m*1.4+rng()),per:90+Math.floor(rng()*600),rot:80+Math.floor(rng()*600),pal:rng()<.55?'ice':'rock',g:.3+rng()*2,tk:80+Math.floor(rng()*160),res:mres,
      desc:'Moon of '+bd.name+'.',haz:'NO ATMOSPHERE'});}}}}
 for(const s in SYSTEMS)if(!SYSTEMS[s].gal)SYSTEMS[s].gal='orion';
 /* deep-space stations — 62% of systems (Sol always gets one) */
 for(const s in SYSTEMS){
  if(s!=='Sol'&&rng()>.62)continue;
  const pls=BDEF.filter(b=>b.sys===s&&b.t!=='star');
  const par=pls.length?pls[Math.floor(rng()*pls.length)]:BDEF.find(b=>b.sys===s&&b.t==='star');
  STATIONS.push({id:'stn_'+s,sys:s,name:(s==='Sol'?'KESTREL YARD':SYSTEMS[s].name.split(' ')[0]+' '+(rng()<.5?'ANCHORAGE':'GATEWAY')),
   par:par.id,a:(par.a||4e7)+2.5e7*(1+rng()*2),per:(par.per||400)*1.2,ang:rng()*6.28,r:.8+rng()*.5,seed:Math.floor(rng()*99999),dist:1e18,posKm:V3(0,0,0),posU:V3(0,0,0)});}
})();
function buildStarfield(){
 if(UNI.userData.sfx){for(const o of UNI.userData.sfx){UNI.remove(o);if(o.geometry&&o.geometry.dispose)o.geometry.dispose();}}
 UNI.userData.sfx=[]
 if(UNI.userData.sf){UNI.remove(UNI.userData.sf);if(UNI.userData.sf.geometry.dispose)UNI.userData.sf.geometry.dispose();}
 if(UNI.userData.sf2){UNI.remove(UNI.userData.sf2);if(UNI.userData.sf2.geometry.dispose)UNI.userData.sf2.geometry.dispose();}
 const dens=clamp((SET.sd||1)*[.45,.8,1.15,1.6][SET.q||2],.25,2.6);
 /* 10,000 stars at 100% density — seeded PRNG, spectral classes, milky band */
 const rng=mulberry32((((SET.useed||777)*2654435761)>>>0)^0x9E3779B9);
 const SPEC=[['O',.004,[.62,.72,1],1.6],['B',.028,[.72,.82,1],1.35],['A',.08,[.86,.92,1],1.16],['F',.12,[.99,.99,.98],1],['G',.2,[1,.96,.85],.9],['K',.3,[1,.85,.64],.76],['M',.268,[1,.72,.5],.62]];
 let acc=0;for(const s of SPEC)acc+=s[1];
 const pickClass=()=>{const r=rng()*acc;let c=0;for(const s of SPEC){c+=s[1];if(r<c)return s;}return SPEC[6];};
 const bn=V3(rng()*2-1,rng()*2-1,rng()*2-1).normalize();
 const bandPos=(out)=>{const th=rng()*Math.PI*2,ph=Math.acos(rng()*2-1);
  let x=Math.sin(ph)*Math.cos(th),y=Math.cos(ph),z=Math.sin(ph)*Math.sin(th);
  if(rng()<.55){const k=x*bn.x+y*bn.y+z*bn.z;
   x-=k*bn.x;y-=k*bn.y;z-=k*bn.z;
   const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;
   const j=(rng()-.5)*.26;x+=j*bn.x;y+=j*bn.y;z+=j*bn.z;
   const l2=Math.hypot(x,y,z)||1;x/=l2;y/=l2;z/=l2;}
  out(x,y,z);};
 const mkLayer=(N,size,brightK)=>{const pos=new Float32Array(N*3),col=new Float32Array(N*3);
  for(let i=0;i<N;i++){bandPos((x,y,z)=>{pos[i*3]=x*1.85e6;pos[i*3+1]=y*1.85e6;pos[i*3+2]=z*1.85e6;});
   const S=pickClass(),lum=Math.pow(rng(),2.2)*.7+.3,k=brightK*(.45+lum*.85);
   col[i*3]=S[2][0]*k*S[3];col[i*3+1]=S[2][1]*k*S[3];col[i*3+2]=S[2][2]*k*S[3];}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  return new THREE.Points(g,new THREE.PointsMaterial({size,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.95,depthWrite:false}));};
 const pts=mkLayer(Math.round(8200*dens),1.7,.75);pts.frustumCulled=false;pts.renderOrder=-10;UNI.add(pts);UNI.userData.sf=pts;
 const sf2=mkLayer(Math.round(1800*dens),3.4,1.05);sf2.frustumCulled=false;sf2.renderOrder=-9;UNI.add(sf2);UNI.userData.sf2=sf2;
 if((SET.q||2)>=1){const N3=Math.round(420*dens),p3=new Float32Array(N3*3);
  for(let i=0;i<N3;i++){bandPos((x,y,z)=>{const rr=Math.sqrt(Math.max(.001,1-z*z));p3[i*3]=x*rr*1.84e6;p3[i*3+1]=z*1.84e6;p3[i*3+2]=y*rr*1.84e6;});}
  const g3=new THREE.BufferGeometry();g3.setAttribute('position',new THREE.BufferAttribute(p3,3));
  const dust=new THREE.Points(g3,new THREE.PointsMaterial({color:0xaac4e8,size:52,sizeAttenuation:false,transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false}));
  dust.frustumCulled=false;dust.renderOrder=-10;UNI.add(dust);UNI.userData.sfx.push(dust);}
 const markPts=entries=>{const pp=[],cc=[];
  for(const e of entries){const p=e.pos,d=Math.hypot(p[0],p[1],p[2])||1,c=new THREE.Color(e.c);
   pp.push(p[0]/d*1.84e6,p[1]/d*1.84e6,p[2]/d*1.84e6);cc.push(c.r,c.g,c.b);}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));gg.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
  const sp=new THREE.Points(gg,new THREE.PointsMaterial({size:5,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:1,depthWrite:false}));
  sp.frustumCulled=false;sp.renderOrder=-9;UNI.add(sp);UNI.userData.sfx.push(sp);};
 const sysE=[];for(const s in SYSTEMS){if(s==='Sol')continue;sysE.push({pos:SYSTEMS[s].pos,c:SYSTEMS[s].c});}
 markPts(sysE);
 markPts(ANOM.bh.map(b=>({pos:b.pos,c:0xff8040})).concat(ANOM.wh,ANOM.voy?[ANOM.voy]:[]));
 if((SET.q||2)>=1)for(const nb of ANOM.neb){
  const dir=nb.posU.clone().normalize();
  for(let k=0;k<7;k++){
   const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:nb.col3,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false}));
   sp.position.copy(dir).add(V3(rnd(-.05,.05),rnd(-.05,.05),rnd(-.05,.05))).normalize().multiplyScalar(1.83e6);
   sp.scale.setScalar(rnd(2.6e5,5.4e5));sp.renderOrder=-9;sp.frustumCulled=false;
   UNI.add(sp);UNI.userData.sfx.push(sp);}}}
function buildBodies(){
 for(const b of BDEF){
  const bd=Object.assign({},b);bd.posKm=V3(0,0,0);bd.posU=V3(0,0,0);bd.ang=hashId(b.id)%628/100;
  bd.makeClouds=(bd.t==='rock'&&(bd.pal==='earth'||bd.pal==='terra'||bd.pal==='ocean'||bd.pal==='ice'));
  bd.night=(bd.id==='earth'||bd.id==='pb'||bd.id==='alkere');
  const grp=new THREE.Group();bd.grp=grp;UNI.add(grp);
  const rU=bd.r*US;
  bd.mat=new THREE.ShaderMaterial({vertexShader:PLANT_VS,fragmentShader:PLANT_FS,uniforms:bodyUniforms(bd)});
  if(bd.t==='star'&&!bd.par)BSTAR[bd.sys]=bd;
  const seg=bd.t==='star'?48:40;
  bd.mesh=new THREE.Mesh(new THREE.SphereGeometry(rU,seg,Math.round(seg*.66)),bd.mat);
  bd.mesh.rotation.y=0;grp.add(bd.mesh);
  if(bd.t==='star'){const sm=new THREE.SpriteMaterial({map:GLOW,color:SYSTEMS[bd.sys].c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
   bd.glow=new THREE.Sprite(sm);bd.glow.scale.setScalar(rU*9);grp.add(bd.glow);}
  if(bd.ring){const rg=makeRing(bd);grp.add(rg);}
  BODY.push(bd);}}
function makeRing(bd){const g=new THREE.Group();const inU=bd.ring[0]*US,outU=bd.ring[1]*US;
 const cv=document.createElement('canvas');cv.width=256;cv.height=8;const cx=cv.getContext('2d');
 const n=mkn3(hashId(bd.id)+5);
 for(let x=0;x<256;x++){const e=fbm3(n,x/24,0,0,3);const a=clamp((.3+e*.9)*Math.sin(x/256*Math.PI),0,1);
  const c=lerp(150,235,e);cx.fillStyle='rgba('+Math.round(c)+','+Math.round(c*.93)+','+Math.round(c*.8)+','+a.toFixed(3)+')';cx.fillRect(x,0,1,8);}
 const rt=new THREE.CanvasTexture(cv);rt.colorSpace=THREE.SRGBColorSpace;
 const geo=new THREE.RingGeometry(inU,outU,96,1);
 const posA=geo.attributes.position,uvA=geo.attributes.uv;
 for(let i=0;i<posA.count;i++){const r=Math.hypot(posA.getX(i),posA.getY(i));uvA.setXY(i,(r-inU)/(outU-inU),.5);}
 const disc=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({map:rt,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
 disc.rotation.x=-Math.PI/2;g.add(disc);
 const cnt=bd.id==='vegamir'?2600:1100;
 const rockG=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:0xb8a88e}),cnt);
 const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),S=V3(1,1,1),P=V3(0,0,0);
 const rmin=inU*.98,rmax=outU*1.02,sp=(rmax-rmin);
 for(let i=0;i<cnt;i++){const r=Math.sqrt(lerp(rmin*rmin,rmax*rmax,Math.random()));
  const a=rnd(0,Math.PI*2);P.set(Math.cos(a)*r,(Math.random()+Math.random()+Math.random()-1.5)*sp*.012,Math.sin(a)*r);
  Q.setFromEuler(new THREE.Euler(rnd(0,6.3),rnd(0,6.3),rnd(0,6.3)));
  const s=lerp(sp/700,sp/110,Math.random());S.set(s*rnd(.6,1.6),s*rnd(.6,1.6),s*rnd(.6,1.6));
  M4.compose(P,Q,S);rockG.setMatrixAt(i,M4);}
 g.add(rockG);g.rotation.x=bd.id==='vegamir'?.34:.42;g.rotation.z=bd.id==='vegamir'?.1:0;
 return g;}
function applyShaders(){
 for(const b of BODY){
  if(b.makeClouds){
   const cm=new THREE.Mesh(new THREE.SphereGeometry(b.r*US*1.018,40,26),
    new THREE.ShaderMaterial({vertexShader:PLANT_VS,fragmentShader:CLOUD_FS,transparent:true,depthWrite:false,
     uniforms:{uSeed:{value:seedVec(b.id+'c')},uSunD:{value:V3(1,0,0)},uTime:{value:0},uFreqC:{value:3.4}}}));
   b.clouds=cm;b.grp.add(cm);}
  const p=PAL[b.pal];
  if(b.at&&b.t==='rock'){const am=new THREE.ShaderMaterial({vertexShader:AT_VS,fragmentShader:AT_FS,uniforms:{uC:{value:new THREE.Color(p.at)},uI:{value:p.atI},uSun:{value:V3(1,0,0)},uCam:{value:V3(0,0,0)}},
   transparent:true,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false});
  b.atmo=new THREE.Mesh(new THREE.SphereGeometry(b.r*US*(1+b.at/b.r*2.2+.03),40,26),am);b.grp.add(b.atmo);}}}
/*------------ orbital update (single pass — O(bodies) for a 200-body universe) ------------*/
function updateBodies(){
 const byId={};for(const b of BODY)byId[b.id]=b;
 for(const b of BODY){
  if(b.t==='star'&&!b.par){b.posKm.set(SYSTEMS[b.sys].pos[0],SYSTEMS[b.sys].pos[1],SYSTEMS[b.sys].pos[2]);}
  else{const par=b.par?byId[b.par]:null;
   let cx0=0,cy0=0,cz0=0;
   if(par){if(par.id==='earth'&&FLG.earthGone){cx0=FL.earthPosKm.x;cy0=FL.earthPosKm.y;cz0=FL.earthPosKm.z;}
    else{cx0=par.posKm.x;cy0=par.posKm.y;cz0=par.posKm.z;}}
   else{let st=null;for(const x of BODY){if(x.sys===b.sys&&x.t==='star'&&!x.par){st=x;break;}}
    if(st){cx0=st.posKm.x;cy0=st.posKm.y;cz0=st.posKm.z;}}
   const ang=b.ang+2*Math.PI*T.t/((b.per||1)*3600);
   b.posKm.set(cx0+Math.cos(ang)*b.a,cy0+Math.sin(ang*.7)*b.a*.004,cz0+Math.sin(ang)*b.a);}
  b.posU.copy(b.posKm).multiplyScalar(US);
  if(b.mesh)b.mesh.rotation.y=2*Math.PI*T.t/((b.rot||24)*3600);
  if(b.clouds)b.clouds.rotation.y=2*Math.PI*T.t/((b.rot||24)*3600)*1.14;}
 for(const st of STATIONS){
  const par=byId[st.par];if(!par)continue;
  const ang=st.ang+2*Math.PI*T.t/((st.per||1)*3600);
  st.posKm.set(par.posKm.x+Math.cos(ang)*st.a,par.posKm.y,par.posKm.z+Math.sin(ang)*st.a);
  if(!st.posU)st.posU=V3(0,0,0);
  st.posU.copy(st.posKm).multiplyScalar(US);}
 if(DEB.on)updateDebris();}
function nearestStar(posU){let best=null,bd=1e18;for(const b of BODY){if(b.t!=='star')continue;const d=posU.distanceTo(b.posU);if(d<bd){bd=d;best=b;}}return{b:best,d:bd};}
function placeBodies(){
 if(MODE==='space'){UNI.visible=true;UNI.userData.sf.visible=true;if(UNI.userData.sf2)UNI.userData.sf2.visible=true;
  for(const b of BODY){TMP.copy(b.posU).sub(SP.pos);b.grp.position.copy(TMP);b.grp.scale.setScalar(1);b.grp.visible=true;
   const st=BSTAR[b.sys]||b;
   TMP2.copy(st.posU).sub(b.posU).normalize();
   const uu=b.mat.uniforms;
   if(uu){uu.uSunD.value.copy(TMP2);uu.uCamP.value.copy(cam.position);uu.uTime.value=T.t;}
   if(b.clouds){const cu=b.clouds.material.uniforms;cu.uSunD.value.copy(TMP2);cu.uTime.value=T.t;}
   if(b.atmo){b.atmo.material.uniforms.uCam.value.copy(cam.position);b.atmo.material.uniforms.uSun.value.copy(TMP2);}}
  if(DEB.on){DEB.grp.position.copy(DEB.posU).sub(SP.pos);DEB.grp.visible=true;}}
 else{const SW=shipWorldU();UNI.visible=true;UNI.userData.sf.visible=false;if(UNI.userData.sf2)UNI.userData.sf2.visible=false;
  for(const a of ANOM.bh.concat(ANOM.wh,ANOM.voy?[ANOM.voy]:[]))if(a.grp)a.grp.visible=false;
  if(NEBHALO)NEBHALO.material.opacity=0;
  for(const b of BODY){TMP.copy(b.posU).sub(SW).multiplyScalar(8000);
   const d=TMP.length(),k=d>9e5?9e5/d:1;
   if(b===LF.body||b.t==='star'){b.grp.visible=false;continue;}
   b.grp.position.copy(TMP).multiplyScalar(k||0);b.grp.scale.setScalar(8000*(k||1));b.grp.visible=true;}
  if(DEB.on)DEB.grp.visible=false;}}
/*------------ course / gear / dashboard ------------*/
function coursePos(out){out=out||V3();
 if(!COURSE)return null;
 if(COURSE.kind==='body')return out.copy(COURSE.ref.posU);
 if(COURSE.kind==='anom')return out.copy(COURSE.ref.posU);
 if(COURSE.kind==='sys'){const st=BODY.find(x=>x.sys===COURSE.ref&&x.t==='star'&&!x.par);return st?out.copy(st.posU):null;}
 return null;}
function setCourse(kind,ref,name){COURSE={kind,ref,name};
 if(kind==='body'){MARK=ref;FL.mark=ref.id;}
 sfx('beep');toast('COURSE SET — '+name+' · FOLLOW THE HUD ARROW · N = AUTO-ALIGN');}
function toggleGear(){GEARST.tgt=GEARST.tgt>0?0:1;sfx('gear');
 toast(GEARST.tgt?'LANDING GEAR DEPLOYING':'LANDING GEAR STOWING');dashSync();}
function gearAnim(dt){GEARST.d+=((GEARST.tgt>0?1:0)-GEARST.d)*Math.min(1,dt*1.3);
 for(const p of GEARLEGS)p.rotation.x=(1-GEARST.d)*1.5*(p.userData.s||1);}
function dashBtn(i){
 switch(i){
  case 0:toggleGear();break;
  case 1:SRF.extL=!SRF.extL;toast('EXTERIOR FLOODS '+(SRF.extL?'ON':'OFF'));sfx('sw');break;
  case 2:SRF.navL=!SRF.navL;toast('NAV LIGHTS '+(SRF.navL?'ON':'OFF'));sfx('sw');break;
  case 3:if(!POW.brk.main||POW.batt<=0){toast('NO POWER');sfx('deny');}else{POW.brk.lit=!POW.brk.lit;syncLevers();toast('CABIN LIGHTS '+(POW.brk.lit?'ON':'OFF'));sfx('sw');}break;
  case 4:{const nv=SET.v>0?0:.7;SET.v=nv;AU.setV(nv);saveSet();toast(nv?'AUDIO ON':'AUDIO MUTED');sfx('sw');}break;
  case 5:scannerPing();break;
  case 6:{let any=false;for(const D of DOORS)if(D.tgt<1)any=true;for(const D of DOORS)D.tgt=any?1:0;sfx('door');toast(any?'ALL DOORS OPENING':'ALL DOORS CLOSING');}break;
  case 7:toggleRamp();break;
  case 8:camMode=camMode==='ext'?'fp':'ext';sfx('click');toast(camMode==='ext'?'EXTERNAL CAMERA':'COCKPIT VIEW');break;
  case 9:SRF.align=!SRF.align;sfx('beep');toast(SRF.align?'AUTO-ALIGN ENGAGED':'AUTO-ALIGN OFF');break;}
 dashSync();}
function dashSync(){for(let i=0;i<DBTN.length;i++){let on=false;
  switch(i){case 0:on=GEARST.tgt>0;break;case 1:on=SRF.extL;break;case 2:on=SRF.navL;break;case 3:on=POW.brk.lit&&pwr('main');break;
   case 4:on=SET.v>0;break;case 5:on=false;break;case 6:on=DOORS.every(d=>d.tgt>0);break;case 7:on=RAMPST.tgt>0;break;
   case 8:on=camMode==='ext';break;case 9:on=SRF.align;break;}
  DBTN[i].led.material.emissiveIntensity=on?1.3:.06;}}
function navBlink(){if(!NAVL.length&&!STROBE)return;const t=T.t;
 const blink=Math.sin(t*3)>0?1.15:.08;
 for(const m of NAVL)m.material.emissiveIntensity=SRF.navL?blink:.05;
 for(const s2 of NAVS)s2.material.opacity=SRF.navL?(blink>.5?.8:.25):0;
 if(STROBE)STROBE.material.opacity=(SRF.navL&&Math.sin(t*5.3)>.55)?.95:0;}
/*------------ anomalies ------------*/
function wormholeJump(w){const sib=ANOM.wh[w.link];SRF.whcd=45;
 SP.pos.copy(sib.posU).addScaledVector(SP.fwd,3.4e8);SP.spd=Math.min(SP.spd,400);
 SHK.t=1.6;SHK.amp=1.1;sfx('tele');
 toast('WORMHOLE TRANSIT — '+w.name+' → '+sib.name,1);
 FL.log.push({t:T.t,m:'WORMHOLE TRANSIT: '+w.name+' → '+sib.name});saveGame(true);}
function anomUpdate(dt){
 if(MODE!=='space')return;
 let bhPull=0;
 for(const b of ANOM.bh){
  const d=SP.pos.distanceTo(b.posU);
  const inf=2.5e11;
  if(d<inf){
   const k=clamp(1-d/inf,0,1);
   bhPull=Math.max(bhPull,k);
   TMP.copy(b.posU).sub(SP.pos).normalize();
   SP.pos.addScaledVector(TMP,k*k*8200*dt);
   if(k>.5){SHK.t=Math.max(SHK.t,.25);SHK.amp=Math.max(SHK.amp,k*.4);}
   if(d<b.r*US*1.7){die('CROSSED THE EVENT HORIZON OF '+b.name);return;}
   if(T.t-(SRF.bhT||0)>8&&k>.2){SRF.bhT=T.t;toast('GRAVITY WELL — '+b.name+' IS PULLING YOU IN',1);}}}
 SRF.bhK=bhPull;
 setLoop('rumble',bhPull*.55,36+bhPull*44);
 T.rate=60*clamp(1-bhPull*.85,.15,1);
 let nk=0,nn=null;
 for(const n of ANOM.neb){
  const d=SP.pos.distanceTo(n.posU),R=n.R*US;
  if(d<R&&nk<1-d/R){nk=1-d/R;nn=n;}}
 if(nn&&SRF.nebName!==nn.name){SRF.nebName=nn.name;toast('ENTERING NEBULA — '+nn.name+' · SENSORS DEGRADED',1);FL.log.push({t:T.t,m:'ENTERED NEBULA: '+nn.name});}
 if(!nn&&SRF.nebName){SRF.nebName='';FL.log.push({t:T.t,m:'CLEAR SKIES — SENSORS NOMINAL'});}
 SRF.nebK=nk;
 setLoop('neb',nk*.22);
 if(UNI.userData.sf)UNI.userData.sf.material.opacity=clamp(.95-nk*.85,0,.95);
 if(UNI.userData.sf2)UNI.userData.sf2.material.opacity=clamp(1-nk*.9,0,1);
 if(NEBHALO){NEBHALO.material.opacity=nk*.34;
  if(nn)NEBHALO.material.color.set(nn.c);
  NEBHALO.position.copy(cam.position);}
 if(nk>0&&nn)AMB.color.lerp(nn.col3,Math.min(1,dt*1.5)*nk);
 else AMB.color.lerp(AMB0,Math.min(1,dt*1.5));
 if(SRF.whcd>0)SRF.whcd-=dt;
 else for(const w of ANOM.wh){if(SP.pos.distanceTo(w.posU)<3e8){wormholeJump(w);break;}}
 const vp=ANOM.voy;
 if(vp&&!FLG.voyGot){
  const d=SP.pos.distanceTo(vp.posU);
  if(!FLG.voySeen&&d<2.5e8){FLG.voySeen=true;sfx('ping');
   toast('RARE CONTACT — VOYAGER 1 PASSING CLOSE. THE GOLDEN RECORD GLEAMS.',1);
   FL.log.push({t:T.t,m:'FLYBY: VOYAGER 1 — PALE BLUE DOT CARRIER'});}
  if(FLG.voySeen&&d<7.5e7){FLG.voyGot=true;INV.parts+=2;INV.exo+=1;sfx('pickup');
   toast('VOYAGER 1 RECOVERED — +2 PARTS · +1 EXOTIC · HUMANITY\'S FARTHEST REACH',1);
   FL.log.push({t:T.t,m:'RECOVERED: VOYAGER 1 — 24 BILLION KM FROM HOME'});}}
 const all=ANOM.bh.concat(ANOM.wh,vp?[vp]:[]);
 for(const a of all){
  if(!a.grp)continue;
  TMP.copy(a.posU).sub(SP.pos);
  const vis=TMP.length()<2.55e6;
  a.grp.position.copy(TMP);a.grp.visible=vis;}
 if(vp&&vp.grp)vp.grp.rotation.y+=dt*.3;
 for(const w of ANOM.wh)if(w.grp&&w.grp.visible){w.ring.rotation.z+=dt*.6;w.disc.rotation.z-=dt*.45;}
 for(const b of ANOM.bh)if(b.grp&&b.grp.visible&&b.disk)b.disk.rotation.z+=dt*.14;}
/*------------ random space events ------------*/
function eventTick(dt){if(MODE!=='space'||!BOOTED||MENU)return;
 EVT.next-=dt;
 if(EVT.next<=0){EVT.next=rnd(260,540);spawnEvent();}
 for(let i=EVTS.length-1;i>=0;i--){const e=EVTS[i];e.t+=dt;
  if(e.up)e.up(e,dt);
  if(e.t>e.dur){if(e.g&&e.g.parent)scene.remove(e.g);EVTS.splice(i,1);}}}
function spawnEvent(){const r=Math.random();
 if(r<.42)meteors();else if(r<.72)flare();else nova();}
function meteors(){
 const g=new THREE.Group();scene.add(g);
 const m=new THREE.MeshBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});
 for(let i=0;i<10;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,rnd(6,14)),m);
  b.position.set(rnd(-60,60),rnd(-40,40),-rnd(120,420));
  b.rotation.y=rnd(-.7,.7)+Math.PI/2;g.add(b);}
 g.position.copy(SP.fwd).multiplyScalar(300).add(V3(rnd(-200,200),rnd(-120,120),rnd(-200,200)));
 EVTS.push({g,t:0,dur:2.6,up(e2,dt2){e2.g.position.addScaledVector(SP.fwd,dt2*260);e2.g.children[0].material.opacity=Math.max(0,.9-e2.t*.4);}});
 sfx('whoosh');toast('METEOR STREAM — DEBRIS CROSSING CLOSE');}
function flare(){
 const ns=nearestStar(SP.pos);
 if(ns.d>2.4e12){meteors();return;}
 POW.batt=clamp(POW.batt-12,0,100);sfx('flare');
 toast('SOLAR FLARE — '+ns.b.name.toUpperCase()+' RADIATION SPIKE · BATTERY -12%',1);
 FL.log.push({t:T.t,m:'EVENT: SOLAR FLARE FROM '+ns.b.name.toUpperCase()});
 const base=SUNL.intensity;
 EVTS.push({g:null,t:0,dur:3,up(e2){SUNL.intensity=base*(1+2.2*Math.sin(Math.min(1,e2.t/e2.dur)*Math.PI));}});}
function nova(){
 const dir=V3(rnd(-1,1),rnd(-.4,.6),rnd(-1,1)).normalize();
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xdfe8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
 sp.position.copy(dir).multiplyScalar(1.7e6);sp.scale.setScalar(1.2e5);scene.add(sp);
 EVTS.push({g:sp,t:0,dur:7,up(e2){const k=e2.t/e2.dur;e2.g.material.opacity=k<.25?k*4*.95:Math.max(0,.95-(k-.25)*1.3);e2.g.scale.setScalar(1.2e5+k*8e5);}});
 sfx('flash');
 toast('DISTANT SUPERNOVA — THE LIGHT OF A DYING STAR, OLDER THAN YOUR MISSION');
 FL.log.push({t:T.t,m:'EVENT: SUPERNOVA OBSERVED — CORE-COLLAPSE, 40,000 LY'});}
/*------------ anomaly visuals ------------*/
function buildAnomalies(){
 for(const b of ANOM.bh){
  const g=new THREE.Group();g.visible=false;UNI.add(g);b.grp=g;
  const rU=b.r*US;
  g.add(new THREE.Mesh(new THREE.SphereGeometry(rU,48,32),new THREE.MeshBasicMaterial({color:0x000000})));
  const cv=document.createElement('canvas');cv.width=256;cv.height=16;const cx=cv.getContext('2d');
  for(let x=0;x<256;x++){const t=x/255;
   const r=Math.round(lerp(255,120,t)),gg=Math.round(lerp(240,60,t)),bb=Math.round(lerp(210,30,t));
   cx.fillStyle='rgba('+r+','+gg+','+bb+','+(1-t*.55).toFixed(3)+')';cx.fillRect(x,0,1,16);}
  const bt=new THREE.CanvasTexture(cv);bt.colorSpace=THREE.SRGBColorSpace;
  const disk=new THREE.Mesh(new THREE.RingGeometry(rU*1.35,rU*4.4,110,1),
   new THREE.MeshBasicMaterial({map:bt,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  const pa=disk.geometry.attributes.position,uv=disk.geometry.attributes.uv;
  for(let i=0;i<pa.count;i++){const rr=Math.hypot(pa.getX(i),pa.getY(i));uv.setXY(i,(rr-rU*1.35)/(rU*4.4-rU*1.35),.5);}
  disk.rotation.x=-1.05;b.disk=disk;g.add(disk);
  const ph=new THREE.Mesh(new THREE.TorusGeometry(rU*1.28,rU*.02,8,90),new THREE.MeshBasicMaterial({color:0xfff0d8}));
  ph.rotation.x=Math.PI/2-1.05;g.add(ph);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffa060,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
  gl.scale.setScalar(rU*7);g.add(gl);
  g.rotation.z=.3;}
 for(const w of ANOM.wh){
  const g=new THREE.Group();g.visible=false;UNI.add(g);w.grp=g;
  const R=2.4e8;
  w.ring=new THREE.Mesh(new THREE.TorusGeometry(R,R*.045,10,80),new THREE.MeshBasicMaterial({color:new THREE.Color(w.c)}));
  g.add(w.ring);
  w.disc=new THREE.Mesh(new THREE.CircleGeometry(R*.94,48),
   new THREE.MeshBasicMaterial({color:new THREE.Color(w.c),transparent:true,opacity:.32,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  g.add(w.disc);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:new THREE.Color(w.c),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
  gl.scale.setScalar(R*3.4);g.add(gl);}
 if(ANOM.voy){const g=new THREE.Group();g.visible=false;UNI.add(g);ANOM.voy.grp=g;
  const gold=new THREE.MeshLambertMaterial({color:0xc8a44a});
  bxp(g,1.2,.9,.9,gold,0,0,0);
  const dish=new THREE.Mesh(new THREE.SphereGeometry(1.15,20,12,0,Math.PI*2,0,1.25),gold);
  dish.position.set(0,.35,1.15);dish.rotation.x=-.4;g.add(dish);
  const boom=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.4,6),gold);boom.rotation.x=Math.PI/2;boom.position.set(0,0,-2.6);g.add(boom);
  for(let i=0;i<3;i++)bxp(g,.06,1.6,.5,gold,.5,-.2,-3.6,0,0,.35+i*.55);
  bxp(g,.4,.4,1.6,new THREE.MeshLambertMaterial({color:0x333a40}),0,.05,-4.4);
  const bcn=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffd9a0,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
  bcn.position.y=1.4;bcn.scale.setScalar(4);g.add(bcn);
  g.scale.setScalar(9);}
 NEBHALO=new THREE.Mesh(new THREE.SphereGeometry(5e5,24,16),
  new THREE.MeshBasicMaterial({color:0x7fd4ff,transparent:true,opacity:0,side:THREE.BackSide,depthWrite:false}));
 NEBHALO.frustumCulled=false;NEBHALO.renderOrder=-8;UNI.add(NEBHALO);}
/*------------ static-matrix freeze (perf) ------------*/
function freezeStatic(root){for(const c of root.children){if(KEEP.has(c))continue;
 if(c.updateMatrix)c.updateMatrix();
 c.matrixAutoUpdate=false;
 freezeStatic(c);}}
/*------------ earth destruction ------------*/
const DEB={on:false,grp:new THREE.Group(),chunks:[],vel:V3(0,0,0),posU:V3(0,0,0)};
FL.earthPosKm=V3(0,0,0);let DEBposU=V3(0,0,0);
function applyEarthGone(silent){const e=bodyById('earth');
 if(!FL.earthPosKm||typeof FL.earthPosKm.copy!=='function')FL.earthPosKm=V3(0,0,0);
 if(!FLG.earthGone){FL.earthPosKm.copy(e.posKm);FLG.earthGone=true;FLG.goneT=T.t;}
 e.grp.visible=false;DEB.posU.copy(FL.earthPosKm).multiplyScalar(US);
 if(!DEB.on){DEB.on=true;scene.add(DEB.grp);
  const N=1400,pos=new Float32Array(N*3),col=new Float32Array(N*3),r0=e.r*US;
  for(let i=0;i<N;i++){const th=rnd(0,6.3),ph=Math.acos(rnd(-1,1)),rr=r0*lerp(1,2.4,Math.pow(Math.random(),.7));
   pos[i*3]=Math.sin(ph)*Math.cos(th)*rr;pos[i*3+1]=Math.cos(ph)*rr;pos[i*3+2]=Math.sin(ph)*Math.sin(th)*rr;
   const h=Math.random();col[i*3]=1;col[i*3+1]=.25+h*.45;col[i*3+2]=.1+h*.2;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  DEB.pts=new THREE.Points(g,new THREE.PointsMaterial({size:14,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.95,depthWrite:false}));
  DEB.grp.add(DEB.pts);
  for(let i=0;i<5;i++){const ch=new THREE.Mesh(new THREE.IcosahedronGeometry(r0*rnd(.05,.12),1),new THREE.MeshBasicMaterial({color:0xffa050}));
   ch.position.set(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(r0*1.2);DEB.grp.add(ch);
   DEB.chunks.push({m:ch,v:V3(rnd(-1,1),rnd(-1,1),rnd(-1,1)).multiplyScalar(r0*.05)});}
  const rg=new THREE.Mesh(new THREE.RingGeometry(.82,1,64),new THREE.MeshBasicMaterial({color:0xffc890,transparent:true,opacity:.8,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
  rg.rotation.x=rnd(-.4,.4);DEB.grp.add(rg);DEB.ring=rg;}
 if(!silent){sfx('boom');SHK.t=3;SHK.amp=1.4;
  const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xfff0c0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  fl.scale.setScalar(200);DEB.grp.add(fl);let ft=0;DEB.flash={m:fl,t:0};}}
function updateDebris(){if(!DEB.on)return;DEB.posU.copy(FL.earthPosKm).multiplyScalar(US);
 DEB.grp.scale.setScalar(1+Math.min(2.2,(T.t-FLG.goneT)/8000));
 DEB.pts.rotation.y+=T.dt*.02;
 for(const c of DEB.chunks){c.m.position.addScaledVector(c.v,T.dt);c.m.rotation.x+=T.dt*.3;c.m.rotation.y+=T.dt*.2;}
 if(DEB.ring){const a=Math.max(0,.8-(T.t-FLG.goneT)/240);DEB.ring.material.opacity=a;DEB.ring.scale.setScalar(200+(T.t-FLG.goneT)*40);}
 if(DEB.flash){DEB.flash.t+=T.dt;const k=DEB.flash.t;DEB.flash.m.scale.setScalar(200+k*4200);DEB.flash.m.material.opacity=Math.max(0,1.6-k*.7);
  if(k>2.6){DEB.grp.remove(DEB.flash.m);DEB.flash=null;}}}
const SHK={t:0,amp:0};
function shipWorldU(){if(MODE!=='surface'||!LF.body||!SURF2.on)return SP.pos;
 const d=sur2DirAt(SHIPG.position.x,SHIPG.position.z,TMP3).applyAxisAngle(V3(0,1,0),SURF2.th);
 TMP3.copy(d).multiplyScalar(LF.body.r*US+Math.max(0,sur2AltM(SHIPG.position))/8000);return TMP3.add(LF.body.posU);}

/*==================== PART 4 — SHIP INTERIOR + INTERACTION ====================*/
const SHIPG=new THREE.Group();scene.add(SHIPG);
const GEAR=1.35;
const MT={
 hull:new THREE.MeshLambertMaterial({color:0x9aa6ad}),
 hullD:new THREE.MeshLambertMaterial({color:0x6a747c}),
 hullDD:new THREE.MeshLambertMaterial({color:0x49525a}),
 accent:new THREE.MeshLambertMaterial({color:0x8a6a30}),
 wall:new THREE.MeshLambertMaterial({color:0x4a545e}),
 floor:new THREE.MeshLambertMaterial({color:0x3a4149}),
 ceil:new THREE.MeshLambertMaterial({color:0x404852}),
 dark:new THREE.MeshLambertMaterial({color:0x262d34}),
 furn:new THREE.MeshLambertMaterial({color:0x5a6570}),
 furn2:new THREE.MeshLambertMaterial({color:0x43505c}),
 amber:new THREE.MeshLambertMaterial({color:0x8a6a30}),
 amberB:new THREE.MeshLambertMaterial({color:0xb8862e}),
 glass:new THREE.MeshLambertMaterial({color:0x9cc8e8,transparent:true,opacity:.15}),
 mattress:new THREE.MeshLambertMaterial({color:0x46525e}),
 blanket:new THREE.MeshLambertMaterial({color:0x7a4a30}),
 crate:new THREE.MeshLambertMaterial({color:0x5a5245}),
 screenD:new THREE.MeshLambertMaterial({color:0x0a0f0c}),
 water:new THREE.MeshLambertMaterial({color:0x3a6a8a})
};
function bx(w,h,d,mt,x,y,z,rx,ry,rz){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;SHIPG.add(m);return m;}
function bxp(parent,w,h,d,mt,x,y,z,rx,ry,rz){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);m.position.set(x,y,z);if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;parent.add(m);return m;}
const COLL=[];const LEVERS=[];
function syncLevers(){for(const L of LEVERS){if(L.t==='b')syncSwitch(L.lev,POW.brk[L.k]);else if(L.t==='o')syncSwitch(L.lev,POW[L.k]);else syncSwitch(L.lev,POW.rea.on);}}
const LIGHTS=[];let REACORE=null,ENGGLOW=[],RAMPLAMP=null,ENSTRIP=null;
function buildShip(){
 bx(4.6,3.3,23.4,MT.hull,0,1.45,3);
 const chin=new THREE.Mesh(new THREE.CylinderGeometry(.45,1.85,3.2,10),MT.hullD);
 chin.rotation.x=-Math.PI/2;chin.scale.set(1,1,.22);chin.position.set(0,-.6,-10.3);SHIPG.add(chin);
 bx(3.6,2.4,1.6,MT.hullD,0,1.45,15.1);
 for(const sx of[-1,1]){const nac=new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,4.6,10),MT.hullD);nac.rotation.x=Math.PI/2;nac.position.set(sx*2.85,1.0,12.6);SHIPG.add(nac);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(.42,12),new THREE.MeshBasicMaterial({color:0xffa050,transparent:true,opacity:0}));gl.position.set(sx*2.85,1.0,14.92);gl.rotation.y=Math.PI;SHIPG.add(gl);ENGGLOW.push(gl);} makeGearLeg(-1.7,-5.5,-1);makeGearLeg(1.7,-5.5,-1);makeGearLeg(-1.7,12.6,1);makeGearLeg(1.7,12.6,1);
 const gl2=new THREE.Mesh(new THREE.CircleGeometry(1.1,16),new THREE.MeshBasicMaterial({color:0xffb060,transparent:true,opacity:0}));gl2.position.set(0,1.45,15.92);gl2.rotation.y=Math.PI;SHIPG.add(gl2);ENGGLOW.push(gl2);
 bx(4.2,.12,22,MT.floor,0,-.06,3);bx(4.2,.12,22,MT.ceil,0,2.96,3);
 bx(.12,2.9,22,MT.wall,-2.16,1.45,3);bx(.12,2.9,22,MT.wall,2.16,1.45,3);
 ENSTRIP=new THREE.MeshLambertMaterial({color:0x223038,emissive:0xbfd8e8,emissiveIntensity:1.3});
 for(const sx of[-1,0,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,21),ENSTRIP);st.position.set(sx*1.24,2.89,3);SHIPG.add(st);}
 bx(4.2,.85,.15,MT.wall,0,.425,-8);bx(4.2,.4,.15,MT.wall,0,2.7,-8);
 bx(.15,1.7,.15,MT.wall,-2.03,1.65,-8);bx(.15,1.7,.15,MT.wall,2.03,1.65,-8);
 const wnd=new THREE.Mesh(new THREE.BoxGeometry(3.9,1.7,.05),MT.glass);wnd.position.set(0,1.65,-8);SHIPG.add(wnd);
 for(const zz of[-3.5,4.5,10.5]){bx(1.4,2.9,.12,MT.wall,-1.4,1.45,zz);bx(1.4,2.9,.12,MT.wall,1.4,1.45,zz);bx(1.4,.7,.12,MT.wall,0,2.55,zz);}
 bx(.6,2.9,.12,MT.wall,-1.8,1.45,14);bx(.6,2.9,.12,MT.wall,1.8,1.45,14);bx(3.0,.3,.12,MT.wall,0,2.75,14);
 for(const p of[[0,2.58,-1.2],[0,2.58,8.6]]){const L=new THREE.PointLight(0xe8f2fa,0,15,1.2);L.position.set(p[0],p[1],p[2]);SHIPG.add(L);LIGHTS.push(L);}
 const EL1=new THREE.PointLight(0xff3020,0,11,1.6);EL1.position.set(0,2.6,-4.5);SHIPG.add(EL1);LIGHTS.push(EL1);EL1.userData.emerg=true;EL1.visible=false;
 const EL2=new THREE.PointLight(0xff3020,0,11,1.6);EL2.position.set(0,2.6,7.5);SHIPG.add(EL2);LIGHTS.push(EL2);EL2.userData.emerg=true;EL2.visible=false;
 buildCockpit();buildLiving();buildEng();buildGarage();populateColl();
 buildExterior();
}
function makeGearLeg(x,z,s){
 const piv=new THREE.Group();piv.position.set(x,0,z);piv.userData.s=s;SHIPG.add(piv);KEEP.add(piv);GEARLEGS.push(piv);
 bxp(piv,.15,1.32,.15,MT.hullD,0,-.66,0);
 bxp(piv,.5,.1,.5,MT.hullD,0,-1.32,.06);
 bxp(piv,.06,.5,.06,MT.furn2,.11,-.4,.04);
 return piv;}
function buildExterior(){
 const WIN=new THREE.MeshLambertMaterial({color:0x1c2830,emissive:0xffd9a0,emissiveIntensity:1.1});
 SHIPG.userData.winMats=[WIN];
 /* cockpit canopy — clean glass, frame OUTSIDE the sightline.
    The glass band is a single-sided plane facing FORWARD: visible from space,
    culled from inside so the crew sees straight through to the stars. */
 const winp=new THREE.Mesh(new THREE.PlaneGeometry(3.94,1.76),WIN);
 winp.position.set(0,1.65,-8.76);winp.rotation.y=Math.PI;SHIPG.add(winp);
 bx(3.98,.14,.12,MT.hullD,0,2.56,-8.71);bx(3.98,.14,.12,MT.hullD,0,.74,-8.71);
 bx(3.4,.42,.08,MT.dark,0,.5,-8.66);
 bx(4.3,.16,.55,MT.hullD,0,3.03,-8.42);
 for(const sx of[-1,1])bx(1.5,.1,2.3,MT.hullD,sx*1.95,1.62,-9.55,0,-sx*.28);
 bx(.9,.35,.5,MT.hullD,0,.25,-9.8);
 /* portholes — 3 per side, lit with the cabin breakers */
 const mkPort=(sx,z)=>{const rim=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.26,14),MT.hullD);rim.rotation.z=Math.PI/2;rim.position.set(sx*2.26,1.75,z);SHIPG.add(rim);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(.23,14),WIN);gl.position.set(sx*2.41,1.75,z);gl.rotation.y=sx>0?Math.PI/2:-Math.PI/2;SHIPG.add(gl);};
 for(const sx of[-1,1])for(const zz of[-1.2,1.8,3.2])mkPort(sx,zz);
 bx(.12,.6,1.3,MT.hullD,2.15,1.5,12.2);bx(.08,.46,1.16,WIN,2.19,1.5,12.2);
 /* hull dressing — belly, spine, seams, accent stripes */
 bx(4.72,.14,22.8,MT.hullDD,0,-.24,3);
 bx(1.5,.28,11.4,MT.hullD,0,3.2,.8);
 bx(1.4,.24,4.2,MT.hullD,0,3.18,12.5);
 for(const zz of[-6,-2,2,6,10,13.4]){bx(.05,2.9,.5,MT.hullDD,2.32,1.45,zz);bx(.05,2.9,.5,MT.hullDD,-2.32,1.45,zz);}
 bx(.07,.2,19.5,MT.accent,2.33,2.35,2.5);bx(.07,.2,19.5,MT.accent,-2.33,2.35,2.5);
 /* engineering radiator fins */
 for(const sx of[-1,1])for(const zz of[5.6,8.2])bx(.07,1.9,2.4,MT.hullDD,sx*2.42,1.5,zz);
 /* landing gear fairings */
 for(const gx of[-1.85,1.85]){bx(.6,.75,2.1,MT.hullD,gx,-.42,-5.5);bx(.6,.75,2.1,MT.hullD,gx,-.42,12.6);}
 /* RCS quads */
 const mkRCS=(x,y,z)=>{bx(.3,.3,.3,MT.dark,x,y,z);
  for(const s of[[-.16,0,0,1],[.16,0,0,1],[0,.16,0,0],[0,-.16,0,0]]){const n=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.14,6),MT.dark);
   n.rotation.z=s[3]?Math.PI/2:0;if(!s[3])n.rotation.x=Math.PI/2;n.position.set(x+s[0],y+s[1],z);SHIPG.add(n);}};
 mkRCS(2.12,2.72,-8.2);mkRCS(-2.12,2.72,-8.2);mkRCS(2.12,.35,14.3);mkRCS(-2.12,.35,14.3);
 /* engine housing + skirt */
 bx(4.0,2.7,1.3,MT.hullD,0,1.45,15.0);
 bx(3.3,2.1,.7,MT.hullDD,0,1.45,15.75);
 /* comms fit */
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.03,.05,1.2,6),MT.dark);mast.position.set(.9,3.5,1);SHIPG.add(mast);
 const whip=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.9,6),MT.dark);whip.position.set(-1.1,3.35,0);SHIPG.add(whip);
 const dish=new THREE.Mesh(new THREE.SphereGeometry(.42,20,12,0,Math.PI*2,0,1.25),new THREE.MeshLambertMaterial({color:0xcfd8dd,side:THREE.DoubleSide}));dish.position.set(-.9,3.42,3);dish.rotation.x=-.9;SHIPG.add(dish);
 const dk=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,10,28),MT.hullD);dk.position.set(0,3.38,6);dk.rotation.x=Math.PI/2;SHIPG.add(dk);
 STROBE=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));STROBE.position.set(.9,4.15,1);STROBE.scale.setScalar(.9);SHIPG.add(STROBE);
 const mkNav=(x,z,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshLambertMaterial({color:0x111111,emissive:c,emissiveIntensity:1.4}));m.position.set(x,1.95,z);SHIPG.add(m);NAVL.push(m);
  const s2=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:c,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));s2.position.set(x,1.95,z);s2.scale.setScalar(.7);SHIPG.add(s2);NAVS.push(s2);};
 mkNav(-2.36,9,0xff3020);mkNav(2.36,9,0x30ff60);
 const noz=new THREE.MeshLambertMaterial({color:0x2a2f34});
 const mkEx=(x,y,r0,r1,len,clen,cc)=>{const n=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,len,14),noz);n.rotation.x=Math.PI/2;n.position.set(x,y,15.55);SHIPG.add(n);
  const ex=new THREE.Mesh(new THREE.ConeGeometry(r0*.72,clen,12,1,true),new THREE.MeshBasicMaterial({color:cc,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  ex.rotation.x=Math.PI/2;ex.position.set(x,y,15.55+len/2+clen/2);SHIPG.add(ex);ENGCONE.push(ex);KEEP.add(ex);};
 mkEx(-2.85,1.0,.44,.26,.8,3.4,0xffa050);
 mkEx(2.85,1.0,.44,.26,.8,3.4,0xffa050);
 mkEx(0,1.45,.9,.5,1.0,5.2,0xffb060);
 for(const sx of[-.7,.7])bx(.08,1.5,2.6,MT.dark,sx,1.35,11.4);
 for(const g of[[2.21,.7,-3],[-2.21,.7,-3],[2.21,2.4,9],[-2.21,2.4,9],[2.21,.6,6],[-2.21,.6,6]])bx(.1,.4,.7,MT.hullD,g[0],g[1],g[2]);
 for(const rr of[[2.3,1.9,-6.8],[-2.3,1.9,-6.8],[2.3,1.9,4.2],[-2.3,1.9,4.2]])bx(.08,.05,2.4,MT.hullD,rr[0],rr[1],rr[2]);
 const d1=makeLabel('KL-9 "KESTREL"',3.6,.5,'#e8dcc0');d1.position.set(2.23,2.35,5.5);d1.rotation.y=Math.PI/2;SHIPG.add(d1);
 const d2=makeLabel('KL-9 "KESTREL"',3.6,.5,'#e8dcc0');d2.position.set(-2.23,2.35,5.5);d2.rotation.y=-Math.PI/2;SHIPG.add(d2);
 const d3=makeLabel('N-X 0009 · LAST LIGHT',2.2,.3,'#9ab0c0');d3.position.set(2.23,1.92,5.5);d3.rotation.y=Math.PI/2;SHIPG.add(d3);
 const d4=makeLabel('N-X 0009 · LAST LIGHT',2.2,.3,'#9ab0c0');d4.position.set(-2.23,1.92,5.5);d4.rotation.y=-Math.PI/2;SHIPG.add(d4);
 const EL=new THREE.SpotLight(0xfff2d0,0,70,.75,.5,1.2);EL.position.set(0,-.1,10);const et=new THREE.Object3D();et.position.set(0,-5,20);SHIPG.add(et);EL.target=et;SHIPG.add(EL);EL.visible=false;SHIPG.userData.extL=EL;
 shipDetail();
 crewBuildLocker();
}
/*--------- cockpit ---------*/
const MFDS=[];
function buildCockpit(){
 /* FIRMWARE 15: the two legacy dash strips that crossed the MFD row are GONE.
    One slim sill under the panel zone, well below every sightline. */
 bx(3.8,.07,.5,MT.dark,0,.46,-7.66,-.35);
 const names=['NAV','SCAN','SYS','COM'];
 for(let i=0;i<4;i++){const x=-1.47+i*.98;
  const fr=bxp(SHIPG,.78,.5,.05,MT.furn2,x,1.02,-7.32,-.40);
  const cv=document.createElement('canvas');cv.width=256;cv.height=160;const ctx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(.68,.42),new THREE.MeshBasicMaterial({map:tex}));
  pl.position.set(0,0,.032);fr.add(pl);
  MFDS.push({id:['nav','scan','sys','com'][i],cv,ctx,tex,fr});
  hit(fr,'MFD — '+names[i],'OPEN '+names[i]+' TERMINAL',()=>openTerm(['nav','scan','sys','com'][i]),1.04);}
 const swp=bx(3.76,.08,.62,MT.furn2,0,.50,-7.05,-.45); /* pulled 55cm toward the pilot + tilted up: fully visible below the screens */
 const DB=[['GEAR','G'],['FLOODS',''],['NAV LTS',''],['CABIN LT',''],['MUTE',''],['SCAN',''],['DOORS',''],['RAMP',''],['CAM','C'],['ALIGN','N']];
 for(let i=0;i<DB.length;i++){const x=-1.62+i*.36;
  const bse=bxp(swp,.1,.15,.1,MT.dark,x,.11,.02);
  const led=bxp(bse,.07,.024,.07,new THREE.MeshLambertMaterial({color:0x111111,emissive:0x30ff60,emissiveIntensity:.06}),0,.087,0);
  hit(bse,DB[i][0],'OPERATE'+(DB[i][1]?' · [='+DB[i][1]+']':''),(()=>{const j=i;return()=>dashBtn(j);})(),1.5);
  const lb=makeLabel(DB[i][0],.27,.07,'#9fc0d8');lb.position.set(x,.05,.21);lb.rotation.set(-Math.PI/2,0,Math.PI);swp.add(lb);
  DBTN.push({def:DB[i],led});}
 const tq=bx(.5,.16,.38,MT.furn,1.02,.86,-7.14);
 const tl=new THREE.Mesh(new THREE.BoxGeometry(.05,.3,.05),MT.amberB);tl.position.set(0,.16,-.08);tq.add(tl);
 const kn=new THREE.Mesh(new THREE.SphereGeometry(.05,8,8),MT.dark);kn.position.y=.17;tl.add(kn);
 hit(tq,'THROTTLE','CYCLE +25%',()=>{if(!PL.seated){toast('SIT AT THE PILOT SEAT FIRST');sfx('deny');return;}SP.thr=clamp(SP.thr+.25,0,1);sfx('sw');},1.6);
 makeSeat(-0.85);makeSeat(0.85);
 bxp(SHIPG,.1,.34,.1,MT.dark,-.45,1.02,-6.75);bxp(SHIPG,.1,.34,.1,MT.dark,.45,1.02,-6.75);
 for(const sx of[-1,1])bxp(SHIPG,.24,.1,3.9,MT.furn,sx*1.97,.92,-5.6);
 const brk=bx(.06,.92,1.16,MT.furn2,-2.06,1.5,-4.6);
 const bn=['MAIN','LIFE','ENG','NAV','LIT'],bk=['main','life','eng','nav','lit'];
 for(let i=0;i<5;i++){const z=-5.05+i*.24;
  const bse=bxp(SHIPG,.05,.26,.16,MT.dark,-2.04,1.52,z);
  const lev=bxp(bse,.05,.14,.05,MT.amberB,.04,.04,0);
  lev.userData.on=POW.brk[bk[i]];syncSwitch(lev,POW.brk[bk[i]]);LEVERS.push({lev,k:bk[i],t:'b'});
  hit(bse,'BREAKER — '+bn[i],(POW.brk[bk[i]]?'ON':'OFF'),(()=>{const k=bk[i];return()=>{POW.brk[k]=!POW.brk[k];syncSwitch(lev,POW.brk[k]);sfx('sw');if(TERM==='sys')renderTerm();};})(),1.5);
  const lb=makeLabel(bn[i],.13,.075,'#9fc0d8');lb.position.set(-1.97,1.3,z);lb.rotation.y=Math.PI/2;SHIPG.add(lb);}
 const pl=makeLabel('POWER BREAKERS',.72,.14,'#ffd9a0');pl.position.set(-2.0,2.02,-4.6);pl.rotation.y=Math.PI/2;SHIPG.add(pl);
 const ov=bx(1.6,.06,.6,MT.furn2,0,2.85,-5.5);
 const gn=[['HYPER AMP','amp'],['CABIN HEAT','heat'],['GRAV PLATE','grav']];
 for(let i=0;i<3;i++){const x=-.5+i*.5;
  const bse=bxp(SHIPG,.14,.1,.2,MT.dark,x,2.83,-5.5);
  const lev=bxp(bse,.04,.12,.04,MT.amberB,0,.07,0);
  syncSwitch(lev,POW[gn[i][1]]);LEVERS.push({lev,k:gn[i][1],t:'o'});
  hit(bse,gn[i][0],(POW[gn[i][1]]?'ON':'OFF'),(()=>{const k=gn[i][1];return()=>{POW[k]=!POW[k];syncSwitch(lev,POW[k]);sfx('sw');};})(),1.6);
  const lb=makeLabel(gn[i][0],.3,.08,'#c8b088');lb.position.set(x,2.7,-5.82);lb.rotation.x=-.5;SHIPG.add(lb);}
 const guard=new THREE.Mesh(new THREE.BoxGeometry(.16,.12,.22),new THREE.MeshLambertMaterial({color:0xffb347,transparent:true,opacity:.3}));
 guard.position.set(-.5,2.9,-5.5);SHIPG.add(guard);
}
function syncSwitch(lev,on){lev.rotation.x=on?-.6:.6;}
function makeSeat(x){
 const g=new THREE.Group();g.position.set(x,0,-6.15);SHIPG.add(g);
 bxp(g,.62,.14,.62,MT.furn,0,.5,0);
 bxp(g,.62,.86,.12,MT.furn,0,1.0,.3,-.12);
 bxp(g,.4,.2,.1,MT.mattress,0,1.5,.33,-.12);
 const ped=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.5,8),MT.dark);ped.position.set(0,.25,0);g.add(ped);
 bxp(g,.5,.06,.4,MT.mattress,0,.58,0);
 hit(g.children[1],'PILOT SEAT','SIT / FLY',()=>{sitDown(x);},1.1);
}
/*--------- living bay ---------*/
function buildLiving(){
 const plat=bx(.95,.3,1.9,MT.furn,-1.55,.35,2.3);
 bx(.85,.12,1.75,MT.mattress,-1.55,.56,2.3);bx(.5,.1,.35,MT.furn2,-1.55,.63,1.65);bx(.87,.06,.9,MT.blanket,-1.55,.64,2.75);
 hit(plat,'BUNK','SLEEP · SAVE · REST',()=>openTerm('bunk'),1.06);
 const lb=makeLabel('CREW BUNK',.6,.12,'#ffd9a0');lb.position.set(-1.95,2.3,2.3);lb.rotation.y=Math.PI/2;SHIPG.add(lb);
 const lk=bx(.55,1.9,.6,MT.furn,-1.8,.95,.5);
 bxp(lk,.5,.02,.02,MT.dark,0,.3,.31);bxp(lk,.5,.02,.02,MT.dark,0,-.3,.31);
 hit(lk,'LOCKER','INVENTORY',()=>openTerm('inv'),1.04);
 const ped=bx(.5,.7,.5,MT.furn,-1.83,.35,-1.5);
 const basin=new THREE.Mesh(new THREE.CylinderGeometry(.22,.17,.3,12),MT.furn2);basin.position.set(-1.83,.85,-1.5);SHIPG.add(basin);
 const mir=bx(.02,.75,.5,new THREE.MeshBasicMaterial({color:0x9fb8cc}),-2.08,1.6,-1.5);
 hit(ped,'WASHSTAND','DRINK WATER',()=>{if(INV.water>=.5){INV.water-=.5;VIT.thi=clamp(VIT.thi+40,0,100);sfx('pickup');toast('DRANK 0.5 L WATER');}else{sfx('deny');toast('NO WATER — MELT ICE AT THE REFINERY');}},1.2);
 const fp=bx(.6,.8,.55,MT.furn,1.8,.4,-1.5);
 const hop=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.2,10),MT.furn2);hop.position.set(1.8,.9,-1.5);SHIPG.add(hop);
 bxp(fp,.12,.12,.12,MT.dark,0,.55,.3);
 hit(fp,'FOOD PRINTER','PRINT RATIONS',()=>openTerm('food'),1.06);
 const lb2=makeLabel('FABRICATION',.7,.12,'#ffd9a0');lb2.position.set(1.95,2.3,.5);lb2.rotation.y=-Math.PI/2;SHIPG.add(lb2);
 const cr1=bx(.55,.5,.7,MT.crate,1.8,.25,.9);bx(.55,.45,.65,MT.crate,1.8,.72,.9);bx(.5,.4,.6,MT.furn2,1.8,1.14,.9);
 hit(cr1,'CARGO','INVENTORY',()=>openTerm('inv'),1.05);
 const rf=bx(.65,1.5,.75,MT.furn2,1.75,.75,2.5);
 const drum=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.9,10),MT.amber);drum.position.set(1.75,1.95,2.5);SHIPG.add(drum);
 bxp(rf,.3,.2,.02,new THREE.MeshLambertMaterial({color:0x332211,emissive:0xff7030,emissiveIntensity:.8}),0,.3,.38);
 hit(rf,'REFINERY','SMELT · MELT · PARTS',()=>openTerm('fab'),1.06);
 for(const yy of[1.1,1.5]){bxp(SHIPG,.06,.3,.9,MT.dark,2.09,yy,-.1);}
}
/*--------- engineering ---------*/
function buildEng(){
 const ped=new THREE.Mesh(new THREE.CylinderGeometry(.7,.82,.25,14),MT.dark);ped.position.set(-1.7,.12,7.6);SHIPG.add(ped);
 const core=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.5,20),new THREE.MeshLambertMaterial({color:0x2a3238}));core.position.set(-1.7,1.05,7.6);SHIPG.add(core);
 REACORE=new THREE.Mesh(new THREE.TorusGeometry(.56,.05,8,24),new THREE.MeshLambertMaterial({color:0x113322,emissive:0x44ffbb,emissiveIntensity:1.4}));
 REACORE.rotation.x=Math.PI/2;REACORE.position.set(-1.7,1.05,7.6);SHIPG.add(REACORE);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.1,20),MT.furn);cap.position.set(-1.7,1.85,7.6);SHIPG.add(cap);
 bxp(SHIPG,.12,1.1,.12,MT.furn2,-1.7,2.35,7.6);
 hit(core,'REACTOR CORE','STATUS + CONTROLS',()=>openTerm('sys'),1.08);
 for(let i=0;i<4;i++)bxp(SHIPG,.5,.04,.06,new THREE.MeshLambertMaterial({color:0x6a5a20,emissive:0xc8a030,emissiveIntensity:.4}),-1.7+(i%2?.3:-.3),.02,7.0+Math.floor(i/2)*1.2);
 const lb=makeLabel('REACTOR',.6,.13,'#ffd9a0');lb.position.set(-1.7,2.5,7.6);SHIPG.add(lb);
 const tank=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.2,14),MT.water);tank.position.set(-1.7,.6,9.1);SHIPG.add(tank);
 bxp(SHIPG,.3,.1,.3,MT.furn,-1.7,1.25,9.1);
 hit(tank,'WATER TANK','INJECT COOLANT (10 L)',()=>injectWater(),1.15);
 const lb3=makeLabel('H2O',.24,.12,'#9fd8ff');lb3.position.set(-1.3,.9,9.1);SHIPG.add(lb3);
 const rc=bx(.06,.85,1.05,MT.furn2,2.06,1.5,6);
 const rn=[['REACTOR','rea'],['SCRAM RST','scr'],['VENT','vent']];
 for(let i=0;i<3;i++){const z=5.75+i*.3;
  const bse=bxp(SHIPG,.05,.24,.14,MT.dark,2.04,1.52,z);
  const lev=bxp(bse,.05,.13,.05,MT.amberB,.05,.02,0);
  if(rn[i][1]==='rea')syncSwitch(lev,POW.rea.on);
  if(rn[i][1]==='rea')LEVERS.push({lev,k:'rea',t:'r'});
  hit(bse,rn[i][0],'OPERATE',(()=>{const k=rn[i][1];return()=>{if(k==='rea'){POW.rea.on=!POW.rea.on;syncSwitch(lev,POW.rea.on);sfx('sw');toast(POW.rea.on?'REACTOR ONLINE':'REACTOR SHUTDOWN');}
   else if(k==='scr'){scramReset();}
   else{if(POW.rea.on&&POW.rea.water>20){POW.rea.water-=10;sfx('hiss');toast('REACTOR VENTED — TEMP DOWN');}else{sfx('deny');toast('VENT UNAVAILABLE');}}
   if(TERM==='sys')renderTerm();};})(),1.5);
  const l=makeLabel(rn[i][0],.15,.07,'#9fc0d8');l.position.set(1.98,1.32,z);l.rotation.y=-Math.PI/2;SHIPG.add(l);}
 const lb2=makeLabel('REACTOR CONTROL',.8,.14,'#ffd9a0');lb2.position.set(2.0,2.0,6);lb2.rotation.y=-Math.PI/2;SHIPG.add(lb2);
 const desk=bx(.55,.75,1.5,MT.furn,1.82,.375,7.6);
 const scr=bx(1.15,.62,.07,MT.screenD,2.05,1.34,7.6,0,-Math.PI/2);
 const cv=document.createElement('canvas');cv.width=256;cv.height=100;const cx2=cv.getContext('2d');
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;MFDS.push({id:'eng',cv,ctx:cx2,tex});
 const pl2=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.46),new THREE.MeshBasicMaterial({map:tex}));pl2.position.set(0,0,.045);scr.add(pl2);
 hit(scr,'ENGINEERING CONSOLE','SYSTEMS',()=>openTerm('sys'),1.05);
 const lbe=makeLabel('ENG CONSOLE',.7,.13,'#ffd9a0');lbe.position.set(1.98,1.98,7.6);lbe.rotation.y=-Math.PI/2;SHIPG.add(lbe);
 bx(.55,.5,.5,MT.crate,-1.85,.25,5.2);bx(.5,.45,.5,MT.crate,-1.85,.72,5.2);
}
function populateColl(){
 COLL.push(
  {x1:-1.9,x2:1.9,z1:-7.9,z2:-6.95},
  {x1:-1.25,x2:-.5,z1:-6.5,z2:-5.8},
  {x1:.5,x2:1.25,z1:-6.5,z2:-5.8},
  {x1:-2.1,x2:-1.05,z1:1.3,z2:3.3},
  {x1:-2.1,x2:-1.5,z1:.15,z2:.9},
  {x1:-2.1,x2:-1.55,z1:-1.85,z2:-1.15},
  {x1:1.45,x2:2.1,z1:-1.85,z2:-1.15},
  {x1:1.45,x2:2.1,z1:.55,z2:1.3},
  {x1:1.35,x2:2.1,z1:2.1,z2:2.95},
  {x1:-2.1,x2:-1.2,z1:7.15,z2:8.05},
  {x1:-2.1,x2:-1.25,z1:8.7,z2:9.5},
  {x1:1.45,x2:2.1,z1:6.8,z2:8.4},
  {x1:-1.9,x2:-1.5,z1:12.65,z2:13.15},
  {x1:-2.1,x2:-1.4,z1:10.9,z2:12.1},
  {x1:-2.1,x2:-1.5,z1:4.9,z2:5.6});
 for(const z of[-3.5,4.5,10.5]){COLL.push({x1:.7,x2:2.1,z1:z-.2,z2:z+.2});COLL.push({x1:-2.1,x2:-.7,z1:z-.2,z2:z+.2});}
 COLL.push({x1:1.5,x2:2.1,z1:13.9,z2:14.2});COLL.push({x1:-2.1,x2:-1.5,z1:13.9,z2:14.2});
}
/*--------- garage + ramp ---------*/
const DOORS=[];let RAMPST={d:0,r:0,tgt:0};
function buildGarage(){
 const bench=bx(.5,.9,1.9,MT.furn,-1.8,.45,11.5);
 bxp(bench,.4,.05,1.6,MT.dark,0,.5,.1);
 hit(bench,'WORK BENCH','FLAVOR',()=>{toast('TOOLS AND SPARE PARTS — USE THE TERMINALS');sfx('click');},1.03);
 const ped=bx(.35,.85,.35,MT.furn,-1.72,.42,12.9);
 bxp(ped,.3,.18,.3,MT.furn2,0,.5,0);
 const btn=bxp(ped,.14,.08,.14,new THREE.MeshLambertMaterial({color:0x881111,emissive:0xff2020,emissiveIntensity:.7}),0,.62,.1);
 RAMPLAMP=bxp(ped,.06,.06,.06,new THREE.MeshLambertMaterial({color:0x111,emissive:0x30ff60,emissiveIntensity:0}),-.12,.62,.1);
 hit(ped,'RAMP + AIRLOCK','DEPLOY / STOW',()=>toggleRamp(),1.25);
 const lb=makeLabel('RAMP',.3,.13,'#ffd9a0');lb.position.set(-1.72,1.05,12.9);SHIPG.add(lb);
 bxp(SHIPG,.08,.08,3.2,MT.dark,0,2.8,12.3);
}
function makeDoors(){
 for(const z of[-3.5,4.5,10.5]){
  const g=new THREE.Group();g.position.set(0,0,z);SHIPG.add(g);
  bxp(g,.12,2.4,.3,MT.dark,-.76,1.2,0);bxp(g,.12,2.4,.3,MT.dark,.76,1.2,0);bxp(g,1.64,.14,.3,MT.dark,0,2.32,0);
  const pl=bxp(g,.73,2.2,.09,MT.amber,-.37,1.1,0);
  const pr=bxp(g,.73,2.2,.09,MT.amber,.37,1.1,0);
  bxp(pl,.45,.55,.02,new THREE.MeshLambertMaterial({color:0x1a1408,emissive:0xffb347,emissiveIntensity:.25,transparent:true,opacity:.85}),0,.45,0);
  bxp(pr,.45,.55,.02,new THREE.MeshLambertMaterial({color:0x1a1408,emissive:0xffb347,emissiveIntensity:.25,transparent:true,opacity:.85}),0,.45,0);
  const D={g,z,open:0,tgt:0,pl,pr};
  DOORS.push(D);KEEP.add(g);
  hit(pl,'DOOR','OPEN / CLOSE',(()=>{const dd=D;return()=>toggleDoor(dd);})(),1.06);}
 const rd=bx(3.0,2.6,.1,MT.amber,0,1.3,14.08);
 const rw=bxp(rd,2.6,.7,.02,new THREE.MeshLambertMaterial({color:0x1a1408,emissive:0xffb347,emissiveIntensity:.25,transparent:true,opacity:.85}),0,.6,.06);
 RAMPST.door=rd;RAMPST.doorY0=1.3;KEEP.add(rd);
 const rampG=new THREE.Group();rampG.position.set(0,0,14.12);SHIPG.add(rampG);
 const rm=new THREE.Mesh(new THREE.BoxGeometry(3.2,.14,7.5),MT.hullD);rm.position.set(0,0,3.75);rampG.add(rm);
 for(let i=0;i<7;i++)bxp(rampG,3.2,.05,.06,MT.dark,0,.08,.6+i*1.1);
 RAMPST.rampG=rampG;RAMPST.rampMat=rm;KEEP.add(rampG);
}
function toggleDoor(D){
 if(!POW.brk.main||POW.batt<=0){toast('NO POWER — DOOR MOTOR DEAD');sfx('deny');return;}
 D.tgt=D.tgt>0?0:1;sfx('door');}
function doorAnim(dt){for(const D of DOORS){D.open+=(D.tgt-D.open)*Math.min(1,dt*3);
 const off=.37+D.open*.78;D.pl.position.x=-off;D.pr.position.x=off;}}
function toggleRamp(){
 if(MODE!=='surface'){toast('RAMP LOCKED — NOT LANDED');sfx('deny');return;}
 if(!POW.brk.main||POW.batt<=0){toast('NO POWER — RAMP MOTOR DEAD');sfx('deny');return;}
 RAMPST.tgt=RAMPST.tgt>0?0:1;sfx('ramp');}
function rampAnim(dt){
 const t=RAMPST.tgt;
 const dd=t>0?(t>RAMPST.d?1:-1):0;
 RAMPST.d=clamp(RAMPST.d+((t>0)?dt*.55:-dt*.55),0,1);
 const dr=clamp((RAMPST.d-.55)/.45,0,1);
 RAMPST.door.position.y=1.3+RAMPST.d*2.62;
 RAMPST.rampG.rotation.x=lerp(-1.66,.178,RAMPST.d);
 if(RAMPLAMP)RAMPLAMP.material.emissiveIntensity=t>0?1.2:0;
}
function rampOpen(){return RAMPST.d>.95;}
function doorOpenAt(z){const D=DOORS.find(d=>Math.abs(d.z-z)<.1);return D?D.open>.75:true;}
/*--------- rover ---------*/
const ROVER={g:new THREE.Group(),out:false,wpos:V3(0,0,0),head:Math.PI,spd:0,steer:0,batt:100,rea:false,lit:false,vy:0};
let ROVERWHEELS=[],ROVERLAMPS=[];
function buildRover(){
 const g=ROVER.g;
 /* FIRMWARE 15: rover v2 — frame chassis, mast, cargo bed, fenders (p13) */
 const v2=roverV2Body();
 g.add(v2);
 v2.traverse(o=>{if(o.userData&&o.userData.wheel)ROVERWHEELS.push(o);});
 for(const sx of[-1,1]){const L=new THREE.SpotLight(0xfff2d0,0,40,.5,.4,1.2);L.position.set(sx*.5,1.78,-.4);
  const tg=new THREE.Object3D();tg.position.set(sx*.5,.3,-9);g.add(tg);L.target=tg;g.add(L);ROVERLAMPS.push(L);}
 const btn=bxp(g,.3,.2,.1,MT.furn2,0,1.0,-.66);
 hit(btn,'ROVER PANEL','POWER / LIGHTS',()=>{roverPanel();},1.2);
 hit(v2.children[0],'ROVER','BOARD',()=>{enterRover();},1.02);
 ROVER.g.position.set(.95,0,12.15);ROVER.g.rotation.y=Math.PI;
 SHIPG.add(ROVER.g);KEEP.add(ROVER.g);
}
function roverPanel(){if(PL.mode==='rover'){toast('USE B (POWER) / L (LIGHTS) WHILE DRIVING');return;}
 ROVER.rea=!ROVER.rea;sfx('sw');toast(ROVER.rea?'ROVER REACTOR ON':'ROVER REACTOR OFF');}
function dockRover(){if(ROVER.out){ROVER.out=false;SURFG.remove(ROVER.g);SHIPG.add(ROVER.g);ROVER.g.position.set(.95,0,12.15);ROVER.g.rotation.set(0,Math.PI,0);ROVER.spd=0;}}
function undockRover(){if(!ROVER.out){ROVER.out=true;SHIPG.remove(ROVER.g);SURFG.add(ROVER.g);ROVER.g.position.copy(ROVER.wpos);ROVER.g.rotation.set(0,ROVER.head,0);}}
/*--------- hit system ---------*/
const HITS=[];
const HITMAT=new THREE.MeshBasicMaterial({visible:false});
const EDGEMAT=new THREE.LineBasicMaterial({color:0xffb347,transparent:true,opacity:.95});
function hit(mesh,label,prompt,act,grow){
 grow=grow||1.12;
 const g=mesh.geometry;g.computeBoundingBox();const bb=g.boundingBox;
 const s=V3().subVectors(bb.max,bb.min),c=V3().addVectors(bb.max,bb.min).multiplyScalar(.5);
 const hb=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,s.x*grow),Math.max(.05,s.y*grow),Math.max(.05,s.z*grow)),HITMAT);
 const eg=new THREE.LineSegments(new THREE.EdgesGeometry(hb.geometry),EDGEMAT);eg.visible=false;hb.add(eg);
 hb.position.copy(c);hb.userData={label,prompt,act,edge:eg};
 mesh.add(hb);HITS.push(hb);return hb;}
const RC=new THREE.Raycaster();
function setHover(){
 if(TERM||PAUSED||DEAD||INTRO.on||(camMode!=='fp')||PL.mode==='rover'||PL.mode==='ext'){clearHover();return;}
 RC.setFromCamera({x:0,y:0},cam);
 const hits=RC.intersectObjects(HITS,false);
 let hv=null;
 if(hits.length&&hits[0].distance<(PL.seated?3.6:3.2))hv=hits[0].object;
 if(hv!==HOVERED){if(HOVERED)HOVERED.userData.edge.visible=false;HOVERED=hv;
  if(hv)sfx('hov');
  if(hv){hv.userData.edge.visible=true;const u=hv.userData;$('pr').innerHTML='<b>'+u.label+'</b> — '+u.prompt+(PL.seated?' <b>[CLICK]</b> · E = STAND':' <b>[CLICK / E]</b>');$('pr').style.display='block';}
  else $('pr').style.display='none';}}
function clearHover(){if(HOVERED){HOVERED.userData.edge.visible=false;HOVERED=null;}$('pr').style.display='none';}
function useCurrent(){if(HOVERED){sfx('click');HOVERED.userData.act();}}
/*--------- ship-local helpers ---------*/
const SHIPM=new THREE.Matrix4();
function shipToLocal(v,out){if(SHIPG.userData.mwF!==FRAMEID){SHIPG.updateMatrixWorld(true);SHIPG.userData.mwF=FRAMEID;}SHIPM.copy(SHIPG.matrixWorld).invert();return(out||V3()).copy(v).applyMatrix4(SHIPM);}
function localToShip(v,out){if(SHIPG.userData.mwF!==FRAMEID){SHIPG.updateMatrixWorld(true);SHIPG.userData.mwF=FRAMEID;}return(out||V3()).copy(v).applyMatrix4(SHIPG.matrixWorld);}
function injectWater(){if(!POW.rea.on){toast('REACTOR OFFLINE');sfx('deny');return;}
 if(INV.water>=10){INV.water-=10;POW.rea.water=clamp(POW.rea.water+35,0,100);sfx('hiss');toast('COOLANT INJECTED — REACTOR WATER '+Math.round(POW.rea.water)+'%');}
 else{sfx('deny');toast('NEED 10 L WATER — MELT ICE AT THE REFINERY');}}
function scramReset(){if(POW.rea.scram>0){if(INV.exo>=1){INV.exo-=1;POW.rea.scram=0;POW.rea.on=true;POW.rea.water=Math.max(POW.rea.water,30);sfx('whoosh');toast('EXOTIC MATTER JUMP-START — REACTOR ONLINE');}
  else{sfx('deny');toast('SCRAM LOCKED — NEED 1 EXOTIC MATTER (OR WAIT '+fmtT(POW.rea.scram)+')');}}
 else{sfx('deny');toast('NO SCRAM IN EFFECT');}}

/*==================== PART 5 — TERMINALS ====================*/
let MAPSYS='Sol',MAPSEL=null,MAPVIEW='sys',SCANST=null,FABQ=[];
function pwr(k){if(!POW.brk.main)return false;if(POW.batt<=0)return false;if(k&&k!=='main'&&!POW.brk[k])return false;return true;}
function openTerm(name){
 if(TERM){closeTerm(false);}
 if(!pwr(name==='com'?'nav':'nav')){toast('NO POWER — TERMINALS OFFLINE');sfx('deny');return;}
 TERM=name;clearHover();document.exitPointerLock&&document.exitPointerLock();
 $('term').style.display='flex';sfx('beep');renderTerm();}
function closeTerm(keep){TERM=null;$('term').style.display='none';
 if(keep!==false&&BOOTED&&!MENU&&!PAUSED&&!DEAD&&!(INTRO.on&&!INTRO.done)){try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}}}
$('tx').onclick=closeTerm;
function renderTerm(){
 if(!TERM)return;const b=$('tbody');
 const T2={nav:'NAVIGATION',scan:'RESOURCE SURVEY',sys:'SHIP SYSTEMS',com:'COMMUNICATIONS',fab:'REFINERY',food:'FOOD PRINTER',inv:'INVENTORY',bunk:'CREW BUNK',station:'STATION DOCK',sign:'SIGN / BEACON'};
 $('ttitle').textContent=T2[TERM]||TERM;
 if(TERM==='nav')renderNav(b);
 else if(TERM==='scan')renderScan(b);
 else if(TERM==='sys')renderSys(b);
 else if(TERM==='com')renderCom(b);
 else if(TERM==='fab')renderFab(b);
  else if(TERM==='food')renderFood(b);
 else if(TERM==='inv')renderInv(b);
 else if(TERM==='bunk')renderBunk(b);
 else if(TERM==='station')renderStation(b);
 else if(TERM==='sign')renderSign(b);}
/*--------- NAV / star map ---------*/
function renderNav(b){
 let h='<div class="row"><span class="tab'+(MAPVIEW==='sys'?' on':'')+'" data-mv="sys">THIS SYSTEM</span><span class="tab'+(MAPVIEW==='gal'?' on':'')+'" data-mv="gal">UNIVERSE — EVERYTHING</span></div>';
 if(MAPVIEW==='sys'){h+='<div class="row">';
  h+='<select id="sysel" style="background:#08130d;color:#b8e8c8;border:1px solid #2f6f4f;padding:5px;font-family:inherit;max-width:460px">';
  for(const s in SYSTEMS)h+='<option value="'+s+'"'+(s===MAPSYS?' selected':'')+'>'+SYSTEMS[s].name+(s===FL.sys?'  ◄ YOU':'')+'</option>';
  h+='</select></div>';}
 h+='<div class="row" style="align-items:flex-start"><canvas id="mapcv" width="840" height="600" style="background:#040a07;border:1px solid #1d3a2a;cursor:crosshair;flex:0 0 auto;width:min(78%,calc(64vh*1.4));height:auto"></canvas><div id="mapinfo" style="flex:1;min-width:280px"></div></div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-mv]').forEach(t=>t.onclick=()=>{MAPVIEW=t.dataset.mv;sfx('click');renderTerm();});
 b.querySelectorAll('[data-sys]').forEach(t=>t.onclick=()=>{MAPSYS=t.dataset.sys;MAPSEL=null;sfx('click');renderTerm();});
 const sel=b.querySelector('#sysel');if(sel)sel.onchange=()=>{MAPSYS=sel.value;MAPSEL=null;sfx('click');renderTerm();};
 const cv=b.querySelector('#mapcv');
 cv.onclick=e=>{const r=cv.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(840/r.width),my=(e.clientY-r.top)*(600/r.height);
  let best=null,bd=30;const P=MAPVIEW==='sys'?mapPts():galPts();
  for(const p of P){if(p.noclick)continue;const d=Math.hypot(p.px-mx,p.py-my);if(d<bd){bd=d;best=p.sel;}}
  if(best){MAPSEL=MAPVIEW==='sys'?best.id:best;sfx('click');drawStarMap(cv);mapRow();}};
 drawStarMap(cv);mapRow();}
function mapPts(){const P=[];
 for(const bd of BODY){if(bd.sys!==MAPSYS)continue;
 if(!bd.a){P.push({b:bd,sel:bd,px:420,py:300,rr:0,cx:420,cy:300,orb:0});continue;}
  const rN=clamp((Math.log10(bd.a/1e6)-.8)/2.3,0,1);
  const rr=40+rN*238;
  let ang=bd.ang+2*Math.PI*T.t/((bd.per||1)*3600);
  let cx=420,cy=300,orb=rr;
  if(bd.par){const par=bodyById(bd.par);if(par&&par.sys===MAPSYS){const pn=P.find(x=>x.b.id===bd.par);
   if(pn){cx=pn.px;cy=pn.py;orb=12+2.6*bd.a/1e5;ang=ang%6.283;}}}
  P.push({b:bd,sel:bd,px:cx+Math.cos(ang)*orb,py:cy+Math.sin(ang)*orb,rr,cx,cy,orb});}
 for(const st of STATIONS)if(st.sys===MAPSYS){
  const a2=st.ang+2*Math.PI*T.t/((st.per||1)*3600);
  P.push({b:{name:st.name,t:'station',a:st.a,rot:0},sel:st.id,px:420+Math.cos(a2)*262,py:300+Math.sin(a2)*262,rr:0,cx:420,cy:300,orb:0});}
 return P;}
function drawStarMap(cv){
 if(MAPVIEW==='gal'){drawGalaxy(cv);return;}
 const c=cv.getContext('2d');c.fillStyle='#040a07';c.fillRect(0,0,840,600);
 c.strokeStyle='#12331f';c.fillStyle='#7dffa8';c.font='16px Consolas';
 const P=mapPts();
 for(const p of P){if(p.b.par||!p.b.a)continue;
  c.beginPath();c.arc(p.cx,p.cy,p.rr,0,7);c.stroke();}
 for(const p of P){if(p.b.par){c.strokeStyle='#12331f';c.beginPath();c.arc(p.cx,p.cy,p.orb,0,7);c.stroke();}
  const col=p.b.t==='star'?'#'+SYSTEMS[p.b.sys].c.toString(16).padStart(6,'0'):p.b.t==='station'?'#7fe0ff':(p.b.pal==='earth'||p.b.pal==='terra'?'#7db8ff':p.b.pal==='ice'?'#cfe8ff':p.b.pal==='lava'?'#ff8050':p.b.pal==='desert'?'#d8a050':'#b8a888');
  c.fillStyle=col;c.beginPath();c.arc(p.px,p.py,p.b.t==='star'?10:5,0,7);c.fill();
  c.fillStyle='#8ab89e';c.fillText(p.b.name,p.px+12,p.py+5);
  if(MAPSEL===p.b.id){c.strokeStyle='#ffb347';c.lineWidth=2.5;c.beginPath();c.arc(p.px,p.py,16,0,7);c.stroke();c.lineWidth=1;}}
 if(MODE==='space'&&MAPSYS===FL.sys){
  const sx=420,sy=300;
  c.strokeStyle='#9fe8ff';c.beginPath();c.moveTo(sx-9,sy);c.lineTo(sx+9,sy);c.moveTo(sx,sy-9);c.lineTo(sx,sy+9);c.stroke();
  c.fillStyle='#9fe8ff';c.fillText('KESTREL',sx+12,sy-9);}
 if(MAPSYS==='Sol'){
  const extras=[];
  for(const w of ANOM.wh)if(Math.hypot(w.pos[0],w.pos[1],w.pos[2])<5e13)extras.push(w);
  if(ANOM.voy)extras.push(ANOM.voy);
  for(const ex of extras){const ang=Math.atan2(ex.pos[2],ex.pos[0]);
   const px=420+Math.cos(ang)*278,py=300+Math.sin(ang)*228;
   c.strokeStyle='#12331f';c.setLineDash([3,5]);c.beginPath();c.moveTo(420,300);c.lineTo(px,py);c.stroke();c.setLineDash([]);
   c.strokeStyle=ex.c;c.beginPath();c.arc(px,py,8,0,7);c.stroke();
   c.fillStyle=ex.c;c.font='13px Consolas';c.fillText(ex.name.split(' ')[0]+' '+(ex.name.split(' ')[1]||''),px+12,py+4);}}
 c.fillStyle='#3a5a4a';c.fillText(MODE==='surface'?'LANDED ON '+LF.body.name.toUpperCase():FL.sys,10,588);}
function mapRow(){
 const el=$('mapinfo');if(!el)return;
 if(!MAPSEL){el.innerHTML='<div class="dim">SELECT ANY OBJECT ON THE MAP.<br><br>THE UNIVERSE TAB CHARTS EVERYTHING — GALAXIES, STARS, STATIONS, BLACK HOLES, WORMHOLES AND VOYAGER 1.</div>';return;}
 if(typeof MAPSEL==='object'){galRow(el);return;}
 const bd=bodyById(MAPSEL);
 if(!bd){const st=STATIONS.find(s2=>s2.id===MAPSEL);
  if(st){const dKm=SP.pos.distanceTo(st.posU)*8;
   el.innerHTML='<table><tr><th>STATION</th><th>SYSTEM</th><th>DISTANCE</th></tr><tr><td>'+st.name+'</td><td>'+SYSTEMS[st.sys].name+'</td><td>'+fmtD(dKm)+'</td></tr></table>'
    +'<div class="dim">DEEP-SPACE STATION — APPROACH SLOW (&lt;45 u/s) AND PRESS F WITHIN 14 u TO DOCK. MARKET · SERVICES · MOTHERSHIPS.</div>'
    +'<div class="row"><button class="btn" id="btgt">TARGET — SET COURSE</button></div>';
   $('btgt').onclick=()=>{setCourse('anom',{name:st.name,pos:[st.posKm.x,st.posKm.y,st.posKm.z],posU:st.posU,desc:'Deep-space station.',haz:'DOCK: SLOW AND CLOSE'},st.name);};
   return;}
  el.innerHTML='<div class="dim">SELECT ANY OBJECT ON THE MAP.</div>';return;}
 const distKm=MODE==='surface'?bd.posKm.distanceTo(LF.body.posKm):bd.posU.distanceTo(SP.pos)*8;
 const eta=SP.spd>1?distKm/(SP.spd*8):0;
 let h='<table><tr><th>BODY</th><th>TYPE</th><th>DISTANCE</th><th>DAY</th><th>GRAV</th><th>TEMP</th></tr>';
 h+='<tr><td>'+bd.name+'</td><td>'+(bd.t==='star'?'STAR':bd.t==='gas'?'GAS GIANT':'ROCK')+'</td><td>'+fmtK(distKm)+'</td><td>'+Math.abs(bd.rot||0).toFixed(1)+' h</td><td>'+(bd.g||'-')+' g</td><td>'+(bd.tk?bd.tk+' K':'-')+'</td></tr></table>';
 h+='<div class="dim">'+bd.desc+'</div><div class="red">'+(bd.haz||'')+'</div>';
 if(FL.scan[bd.id])h+='<div class="grn">SURVEY: '+resStr(bd)+'</div>';
 h+='<div class="row"><button class="btn" id="btgt">TARGET — SET COURSE</button><button class="btn" id="bplot">PLOT COURSE</button><span class="dim" id="plotnote"></span></div>';
 el.innerHTML=h;
 $('btgt').onclick=()=>{setCourse('body',bd,bd.name);};
 $('bplot').onclick=()=>{setCourse('body',bd,bd.name);
  if(MODE==='space'){
   TMP.copy(bd.posU).sub(SP.pos).normalize();
   shipAxes();
   const fwdDot=TMP.dot(SP.fwd);
   const deg=Math.acos(clamp(fwdDot,-1,1))*57.3;
   const side=TMP.dot(SP.rt)>0?'STARBOARD':'PORT';
   $('plotnote').textContent=deg<4?'ON COURSE':'TURN '+deg.toFixed(0)+'° '+side;}
  else{sfx('deny');$('plotnote').textContent='TAKE OFF FIRST';}};
}
/*--------- galaxy chart ---------*/
function galR(dKm){return 30+clamp(Math.log10(Math.max(1e12,dKm)/1e12),0,5.3)*48;}
function galPts(){
 const P=[];const cx=420,cy=300;
 const put=(name,posKm,extra)=>{const d=Math.hypot(posKm[0],posKm[1],posKm[2])||1;
  const r=galR(d),a=Math.atan2(posKm[2],posKm[0]);
  P.push(Object.assign({name,px:cx+Math.cos(a)*r,py:cy+Math.sin(a)*r,d},extra));return P[P.length-1];};
 for(const g of GAL)if(!g.home)put(g.name,g.ctr,{galblob:1,c:g.c,noclick:1});
 P.push({name:'SOL',px:cx,py:cy,d:0,sel:{kind:'sys',s:'Sol'},star:1,c:'#fff3d0'});
 for(const s in SYSTEMS){if(s==='Sol')continue;
  put(SYSTEMS[s].name,SYSTEMS[s].pos,{sel:{kind:'sys',s},star:1,c:'#'+SYSTEMS[s].c.toString(16).padStart(6,'0')});}
 for(const b of ANOM.bh)put(b.name,b.pos,{sel:{kind:'anom',a:b},bh:1,c:'#ff8040'});
 for(const n of ANOM.neb)put(n.name,n.pos,{sel:{kind:'anom',a:n},neb:1,c:n.c});
 for(const w of ANOM.wh){const e=put(w.name,w.pos,{sel:{kind:'anom',a:w},wh:1,c:w.c});w._p=e;}
 if(ANOM.voy)put('VOYAGER 1',ANOM.voy.pos,{sel:{kind:'anom',a:ANOM.voy},voy:1,c:'#ffd9a0'});
 put('KESTREL',[SP.pos.x*8,SP.pos.y*8,SP.pos.z*8],{ship:1,noclick:1});
 return P;}
function drawGalaxy(cv){
 const c=cv.getContext('2d'),cx=420,cy=300;
 c.fillStyle='#040a07';c.fillRect(0,0,840,600);
 c.strokeStyle='#0e2a1c';c.font='13px Consolas';
 for(const ly of[10,50,250,1000,10000,100000]){const rr=galR(ly*9.46e12);
  c.beginPath();c.arc(cx,cy,rr,0,7);c.stroke();
  c.fillStyle='#3a5a4a';c.fillText(ly+' ly',cx+rr*.68,cy-rr*.72);}
 const P=galPts();
 for(const p of P)if(p.galblob){const g2=c.createRadialGradient(p.px,p.py,4,p.px,p.py,64);
  g2.addColorStop(0,p.c);g2.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.22;c.fillStyle=g2;
  c.beginPath();c.arc(p.px,p.py,64,0,7);c.fill();c.globalAlpha=1;}
 for(const p of P)if(p.neb){const g=c.createRadialGradient(p.px,p.py,2,p.px,p.py,48);
  g.addColorStop(0,p.c);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.3;c.fillStyle=g;
  c.beginPath();c.arc(p.px,p.py,48,0,7);c.fill();c.globalAlpha=1;}
 c.setLineDash([6,6]);
 for(let i=0;i<ANOM.wh.length;i++){const a=ANOM.wh[i],b2=ANOM.wh[a.link];
  if(a._p&&b2._p){c.strokeStyle=a.c;c.beginPath();c.moveTo(a._p.px,a._p.py);c.lineTo(b2._p.px,b2._p.py);c.stroke();}}
 let tp=null;
 if(COURSE){
  if(COURSE.kind==='body')tp=COURSE.ref.posKm;
  else if(COURSE.kind==='anom')tp=COURSE.ref.pos;
  else{const st=BODY.find(x=>x.sys===COURSE.ref&&x.t==='star'&&!x.par);tp=st?st.posKm:null;}}
 const shipP=P.find(p=>p.ship);
 if(tp&&shipP){const dd=Math.hypot(tp[0],tp[1],tp[2])||1,rr=galR(dd),aa=Math.atan2(tp[2],tp[0]);
  c.strokeStyle='#ffb347';c.setLineDash([4,5]);c.beginPath();c.moveTo(shipP.px,shipP.py);c.lineTo(cx+Math.cos(aa)*rr,cy+Math.sin(aa)*rr);c.stroke();}
 c.setLineDash([]);
 for(const p of P){
  if(p.bh){c.fillStyle='#000';c.beginPath();c.arc(p.px,p.py,7,0,7);c.fill();
   c.strokeStyle='#ff8040';c.lineWidth=2;c.beginPath();c.arc(p.px,p.py,7,0,7);c.stroke();c.lineWidth=1;}
  else if(p.wh){c.strokeStyle=p.c;c.beginPath();c.arc(p.px,p.py,5,0,7);c.stroke();c.beginPath();c.arc(p.px,p.py,10,0,7);c.stroke();}
  else if(p.voy){c.fillStyle=p.c;c.beginPath();c.moveTo(p.px,p.py-8);c.lineTo(p.px+6,p.py);c.lineTo(p.px,p.py+8);c.lineTo(p.px-6,p.py);c.closePath();c.fill();}
  else if(p.star){c.fillStyle=p.c||'#fff3d0';c.beginPath();c.arc(p.px,p.py,8,0,7);c.fill();}
  else if(p.ship){c.strokeStyle='#9fe8ff';c.beginPath();c.moveTo(p.px-9,p.py);c.lineTo(p.px+9,p.py);c.moveTo(p.px,p.py-9);c.lineTo(p.px,p.py+9);c.stroke();}
  c.fillStyle=p.ship?'#9fe8ff':'#8ab89e';c.font='13px Consolas';
  c.fillText(p.name,p.px+11,p.py+4);
  if(MAPSEL&&typeof MAPSEL==='object'&&p.sel&&p.sel.kind===MAPSEL.kind){
   const m=(MAPSEL.kind==='sys'&&p.sel.s===MAPSEL.s)||(MAPSEL.kind==='anom'&&p.sel.a===MAPSEL.a);
   if(m){c.strokeStyle='#ffb347';c.lineWidth=2.5;c.beginPath();c.arc(p.px,p.py,16,0,7);c.stroke();c.lineWidth=1;}}}
 c.fillStyle='#3a5a4a';c.fillText('UNIVERSE CHART · LOG-POLAR · 4 GALAXIES · '+Object.keys(SYSTEMS).length+' SYSTEMS · RINGS 10 ly → 100 kly',10,588);}
function galRow(el){
 const k=MAPSEL;let name,desc='',haz='',distKm=0,kindTxt='';
 if(k.kind==='sys'){const s=SYSTEMS[k.s];name=s.name;kindTxt='STAR SYSTEM';
  const st=BODY.find(x=>x.sys===k.s&&x.t==='star'&&!x.par);
  distKm=st?SP.pos.distanceTo(st.posU)*8:0;
  desc='Charted system in the '+(GAL.find(g=>g.id===SYSTEMS[k.s].gal)||GAL[0]).name+'. '+(st?st.desc:'');haz='TARGET IT · CHARGE J ≥80% · RELEASE = TRUE HYPER JUMP';}
 else{const a=k.a;name=a.name;distKm=SP.pos.distanceTo(a.posU)*8;
  if(a.r){kindTxt='BLACK HOLE';desc=a.desc;haz=a.haz;}
  else if(a.R){kindTxt='NEBULA';desc=a.desc;haz=a.haz;}
  else if(a.link!==undefined){kindTxt='WORMHOLE';desc=a.desc;haz=a.haz;}
  else{kindTxt='RELIC PROBE';desc=a.desc;haz=a.haz;}}
 let h='<table><tr><th>OBJECT</th><th>TYPE</th><th>DISTANCE</th></tr>';
 h+='<tr><td>'+name+'</td><td>'+kindTxt+'</td><td>'+fmtD(distKm)+'</td></tr></table>';
 h+='<div class="dim">'+desc+'</div>'+(haz?'<div class="red">'+haz+'</div>':'');
 h+='<div class="row"><button class="btn" id="btgt">TARGET — SET COURSE</button><span class="dim" id="plotnote"></span></div>';
 h+='<div class="dim">SET COURSE → FOLLOW THE HUD ARROW · N OR ALIGN SWITCH = AUTO-TURN</div>';
 el.innerHTML=h;
 $('btgt').onclick=()=>{if(MAPSEL.kind==='sys')setCourse('sys',MAPSEL.s,SYSTEMS[MAPSEL.s].name);else setCourse('anom',MAPSEL.a,MAPSEL.a.name);};}
function resStr(bd){const r=bd.res||{};const p=[];if(r.ice)p.push('ICE '+r.ice);if(r.ore)p.push('ORE '+r.ore);if(r.exo)p.push('EXOTIC '+r.exo);if(r.org)p.push('ORGANICS '+r.org);return p.length?p.join(' · '):'NONE';}
/*--------- SCAN ---------*/
function renderScan(b){
 let h='<h3>ORBITAL RESOURCE SURVEY</h3><div class="row">';
 const cands=BODY.filter(x=>x.sys===FL.sys&&x.t!=='star');
 h+='<select id="scsel" style="background:#08130d;color:#b8e8c8;border:1px solid #2f6f4f;padding:5px;font-family:inherit">';
 for(const c of cands)h+='<option value="'+c.id+'"'+(MAPSEL===c.id?' selected':'')+'>'+c.name+'</option>';
 h+='</select><button class="btn" id="scgo">RUN SURVEY</button></div><div id="scout">';
 h+='</div>';b.innerHTML=h;
 $('scgo').onclick=()=>{const id=$('scsel').value;const bd=bodyById(id);
  if(bd.t==='gas'){toast('NO SOLID SURFACE — CANNOT SURVEY');sfx('deny');return;}
  SCANST={id,t:0};sfx('beep');$('scgo').classList.add('dis');};
 scanOut();}
function scanOut(){
 const el=$('scout');if(!el)return;
 if(SCANST){el.innerHTML='<div class="amb">SCANNING '+bodyName(SCANST.id)+' … '+Math.floor(SCANST.t*100)+'%</div><div class="bar" style="width:300px;border:1px solid #1d3a2a"><i style="background:#7dffa8;width:'+Math.floor(SCANST.t*100)+'%"></i></div>';return;}
 if(!MAPSEL){el.innerHTML='<div class="dim">SELECT A WORLD AND RUN THE SURVEY. SCAN BEFORE YOU LAND.</div>';return;}
 const bd=bodyById(MAPSEL);
 if(!FL.scan[bd.id]){el.innerHTML='<div class="dim">'+bd.name+' NOT YET SURVEYED.</div>';return;}
 let h='<table><tr><th>'+bd.name+'</th><th>VALUE</th></tr>';
 h+='<tr><td>GRAVITY</td><td>'+(bd.g||'?')+' g</td></tr>';
 h+='<tr><td>DAY LENGTH</td><td>'+Math.abs(bd.rot).toFixed(1)+' h'+((bd.rot||0)<0?' (RETROGRADE)':'')+'</td></tr>';
 h+='<tr><td>MEAN TEMP</td><td>'+(bd.tk-273).toFixed(0)+' °C</td></tr>';
 h+='<tr><td>ATMOSPHERE</td><td>'+(bd.at?bd.at+' km':'NONE')+'</td></tr>';
 h+='<tr><td>RESOURCES</td><td>'+resStr(bd)+'</td></tr>';
 h+='<tr><td>HAZARDS</td><td class="red">'+(bd.haz||'NONE')+'</td></tr></table>';
 h+='<div class="grn">LANDING ADVISORY: '+(bd.g>11?'HIGH GRAVITY — KEEP DESCENT SLOW':bd.tk>500?'SURFACE MOLTEN — SUIT WILL FAIL':bd.tk<150?'EXTREME COLD — MINE FAST, RETURN OFTEN':'NOMINAL LANDING PROFILE')+'</div>';
 el.innerHTML=h;}
function scanTick(dt){if(!SCANST)return;SCANST.t+=dt/4;
 if(SCANST.t>=1){FL.scan[SCANST.id]=true;MAPSEL=SCANST.id;toast('SURVEY COMPLETE — '+bodyName(SCANST.id),1);sfx('pickup');SCANST=null;
  if(TERM==='scan')renderTerm();}
 else if(TERM==='scan')scanOut();}
/*--------- SYS ---------*/
function renderSys(b){
 let h='<h3>SYSTEMS STATUS</h3><table><tr><th>SYSTEM</th><th>STATUS</th><th></th></tr>';
 const sd=SYSD,nm={hull:'HULL',eng:'ENGINES',rea:'REACTOR',lif:'LIFE SUPPORT',avo:'AVIONICS'};
 for(const k in sd){const v=Math.round(sd[k]);
  h+='<tr><td>'+nm[k]+'</td><td style="color:'+(v>60?'#7dffa8':v>30?'#ffb347':'#ff7d7d')+'">'+v+'%</td><td><button class="btn'+(v>=100||INV.parts<1?' dis':'')+'" data-rep="'+k+'">REPAIR (1 PART)</button></td></tr>';}
 h+='</table>';
 h+='<h3>POWER</h3><table><tr><th>SOURCE</th><th>STATE</th></tr>';
 h+='<tr><td>REACTOR</td><td class="'+(POW.rea.on?'grn':'red')+'">'+(POW.rea.on?'ONLINE':'OFFLINE')+(POW.rea.scram>0?' — SCRAM '+fmtT(POW.rea.scram):'')+'</td></tr>';
 h+='<tr><td>BATTERY</td><td>'+Math.round(POW.batt)+'%</td></tr>';
 h+='<tr><td>REACTOR WATER</td><td class="'+(POW.rea.water<25?'red':'')+'">'+Math.round(POW.rea.water)+'%'+(POW.rea.water<25?' — INJECT DAILY!':'')+'</td></tr></table>';
 h+='<h3>BASE POWER GRID</h3>'+powerHTML();
 h+='<div class="row"><button class="btn'+(INV.water<10?' dis':'')+'" id="sinj">INJECT 10 L WATER</button><button class="btn'+(POW.rea.scram<=0||INV.exo<1?' dis':'')+'" id="sscr">EXOTIC JUMP-START (1 EXO)</button></div>';
 h+='<div class="row"><button class="btn" id="sgear">LANDING GEAR: '+(GEARST.tgt>0?'DOWN':'UP')+'</button><button class="btn" id="salign">AUTO-ALIGN: '+(SRF.align?'ON':'OFF')+'</button></div>';
 h+='<div class="dim">BREAKERS ON PORT WALL · REACTOR PANEL STARBOARD · AMP SWITCH OVERHEAD · G = GEAR · N = ALIGN</div>';
 h+='<h3>TELEMETRY</h3><table><tr><th>FIELD</th><th>VALUE</th></tr>';
 h+='<tr><td>SYSTEM</td><td>'+SYSTEMS[FL.sys].name+'</td></tr>';
 h+='<tr><td>GALAXY</td><td>'+(GAL.find(g=>g.id===SYSTEMS[FL.sys].gal)||GAL[0]).name+'</td></tr>';
 {const ns2=nearestStar(SP.pos);h+='<tr><td>NEAREST STAR</td><td>'+(ns2.b?ns2.b.name+' — '+fmtD(ns2.d*8):'-')+'</td></tr>';}
 {const stn=nearestStation();h+='<tr><td>STATION</td><td>'+(stn?stn.st.name+' — '+fmtD(stn.d*8):'NONE IN SYSTEM')+'</td></tr>';}
 h+='<tr><td>VELOCITY</td><td>'+fmtK(SP.spd*8)+'/s'+(SP.spd*8>3e5?' ('+(SP.spd*8/299792).toFixed(2)+'c)':'')+'</td></tr>';
 h+='<tr><td>POSITION (u)</td><td>'+SP.pos.x.toFixed(0)+' / '+SP.pos.y.toFixed(0)+' / '+SP.pos.z.toFixed(0)+'</td></tr>';
 h+='<tr><td>FROM SOL</td><td>'+fmtD(SP.pos.length()*8)+'</td></tr>';
 h+='<tr><td>PILOTS</td><td>'+(NET.on?netCount()+' ON THE BAND'+(window.MP&&window.MP.rtt!=null?' · RTT '+window.MP.rtt+' ms':''):'OFFLINE — MENU ▸ MULTIPLAYER')+'</td></tr>';
 h+='<tr><td>STRUCTURES</td><td>'+FL.builds.length+' BUILT</td></tr></table>';
 h+='<h3>POWER ALLOCATION</h3><div class="row">';
 for(const k of['eng','nav','life'])h+='<span style="margin-right:14px">'+k.toUpperCase()+' <input type="range" class="sld" data-alloc="'+k+'" min="50" max="200" value="'+Math.round((FL.alloc?FL.alloc[k]:1)*100)+'"> <span id="al'+k+'">'+Math.round((FL.alloc?FL.alloc[k]:1)*100)+'%</span></span>';
 h+='</div><div class="dim">ENG: THRUST ACCEL · NAV: ALIGN SPEED · LIFE: O2 SCRUBBERS — ALL DRAWN FROM THE SAME REACTOR</div>';
 h+='<h3>LOGIC WIRING — SOURCE ▸ SINK</h3><table><tr><th></th>';
 for(const s2 of WSNKS)h+='<th>'+s2[1]+'</th>';
 h+='</tr>';
 for(const src of WSRCS){h+='<tr><td>'+src[1]+'</td>';
  for(const snk of WSNKS)h+='<td style="text-align:center"><span class="qbtn'+(wireHas(src[0],snk[0])?' on':'')+'" data-wire="'+src[0]+'|'+snk[0]+'">'+(wireHas(src[0],snk[0])?'●':'○')+'</span></td>';
  h+='</tr>';}
 h+='</table><div class="dim">DEFAULT: AIRLOCK + O2 WIRED TO LIGHTS / SIREN / HUD. CLICK CELLS TO RE-WIRE. OPEN THE RAMP IN SPACE AND SEE WHAT HAPPENS.</div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-rep]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.rep;
  if(SYSD[k]>=100||INV.parts<1)return;INV.parts-=1;SYSD[k]=clamp(SYSD[k]+35,0,100);sfx('thud');toast(nm[k]+' REPAIRED +35%');renderTerm();});
 $('sinj').onclick=injectWater;$('sscr').onclick=scramReset;
 $('sgear').onclick=()=>{toggleGear();renderTerm();};
 $('salign').onclick=()=>{SRF.align=!SRF.align;sfx('beep');renderTerm();};
 b.querySelectorAll('[data-wire]').forEach(el=>el.onclick=()=>{
  const pr=el.dataset.wire.split('|');
  const i2=(FL.wire||[]).findIndex(w=>w.s===pr[0]&&w.d===pr[1]);
  if(i2>=0)FL.wire.splice(i2,1);else(FL.wire=FL.wire||[]).push({s:pr[0],d:pr[1]});
  sfx('sw');renderTerm();});
 b.querySelectorAll('[data-alloc]').forEach(el=>el.oninput=()=>{
  FL.alloc[el.dataset.alloc]=+el.value/100;
  const lbl=$('al'+el.dataset.alloc);if(lbl)lbl.textContent=el.value+'%';});}
/*--------- COM ---------*/
function renderCom(b){
 let h='<h3>DEEP SPACE COMMS</h3><div class="row"><input type="text" id="cmsg" style="flex:1" placeholder="BROADCAST MESSAGE…" maxlength="120"><button class="btn" id="csend">BROADCAST</button>';
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SR)h+='<button class="btn" id="cmic">MIC</button>';
 h+='</div><div class="dim">BEACONS MAY ATTRACT SUPPLY DROPS… OR NOTHING AT ALL. RANGE: LIGHT HOURS.'+(NET.on?'':' · OFFLINE — MAIN MENU ▸ MULTIPLAYER FOR THE GLOBAL BAND')+'</div>';
 if(NET.on&&NET.world){
  h+='<h3>GLOBAL BAND — '+netCount()+' PILOTS</h3><div style="max-height:170px;overflow-y:auto">';
  const chat=NET.world.chat;
  for(let i=chat.length-1;i>=0&&i>chat.length-9;i--)h+='<div class="dim">['+chat[i].who+'] '+String(chat[i].m).slice(0,80)+'</div>';
  if(!chat.length)h+='<div class="dim">…band quiet…</div>';
  h+='</div>';}
 h+='<h3>TRAFFIC LOG</h3><div id="clog">';
 for(let i=FL.log.length-1;i>=0&&i>FL.log.length-9;i--)h+='<div class="dim">['+fmtT(FL.log[i].t)+'] '+FL.log[i].m+'</div>';
 if(!FL.log.length)h+='<div class="dim">SILENCE.</div>';
 h+='</div>';b.innerHTML=h;
 $('csend').onclick=()=>{const v=$('cmsg').value.trim();if(!v)return;
  FL.log.push({t:T.t,m:'TX: '+v});sfx('beep');toast('BROADCAST SENT');
  if(NET.on&&window.MP)window.MP.chatSend(v);
  if(!FL.supQ&&Math.random()<.75){FL.supQ={at:T.t+rnd(1800,5400)};toast('…Faint reply detected on the band.',1);}
  renderTerm();};
 if(SR&&$('cmic'))$('cmic').onclick=()=>{const r=new SR();r.lang='en-US';r.interimResults=false;
  r.onresult=e=>{$('cmsg').value=e.results[0][0].transcript;};r.onerror=()=>toast('MIC ERROR');r.start();toast('LISTENING…');};}
function comTick(){
 if(FL.supQ&&T.t>=FL.supQ.at){
  FL.supQ=null;
  if(MODE==='surface'&&TER&&LF.body.res&&(LF.body.res.parts||true)){
   spawnCache();FL.log.push({t:T.t,m:'RX: SUPPLY DROP INBOUND — CRATE BEACON ACTIVE'});
   toast('SUPPLY DROP DETECTED — FOLLOW THE MARKER',1);}
  else FL.log.push({t:T.t,m:'RX: …static…'});}}
/*--------- FAB ---------*/
function renderFab(b){
 let h='<h3>REFINERY & FABRICATION</h3><table><tr><th>STOCK</th><th>QTY</th></tr>';
 h+='<tr><td>ICE</td><td>'+Math.floor(INV.ice)+'</td></tr><tr><td>ORE</td><td>'+Math.floor(INV.ore)+'</td></tr>';
 h+='<tr><td>METAL</td><td>'+Math.floor(INV.metal)+'</td></tr><tr><td>EXOTIC MATTER</td><td>'+Math.floor(INV.exo)+'</td></tr></table>';
 h+='<div class="row"><button class="btn'+(INV.ice<5?' dis':'')+'" id="fmelt">MELT 5 ICE → 5 L WATER</button>';
 h+='<button class="btn'+(INV.ore<5?' dis':'')+'" id="fsmelt">SMELT 5 ORE → 2 METAL</button></div>';
 h+='<div class="row"><button class="btn'+(INV.metal<4?' dis':'')+'" id="fpart">FABRICATE PART (4 METAL)</button></div>';
 if(FABQ.length){h+='<h3>QUEUE</h3>';for(const q of FABQ)h+='<div class="amb">'+q.n+' … '+Math.floor(q.t*100)+'%</div>';}
 h+='<div class="dim">POWER REQUIRED — REACTOR OR BATTERY · RATIONS PRINT AT THE FOOD PRINTER (LIVING BAY)</div>';
 b.innerHTML=h;
 $('fmelt').onclick=()=>fab('MELTING ICE','ice',()=>{INV.ice-=5;INV.water+=5;});
 $('fsmelt').onclick=()=>fab('SMELTING ORE','ore',()=>{INV.ore-=5;INV.metal+=2;});
 $('fpart').onclick=()=>fab('FABRICATING PART','part',()=>{INV.metal-=4;INV.parts+=1;});}
function renderFood(b){
 let h='<h3>FOOD PRINTER</h3><table><tr><th>STOCK</th><th>QTY</th></tr>';
 h+='<tr><td>WATER (L)</td><td>'+INV.water.toFixed(1)+'</td></tr>';
 h+='<tr><td>RATIONS</td><td>'+Math.floor(INV.food)+'</td></tr></table>';
 h+='<div class="row"><button class="btn" id="fcond">CONDENSE +5 L WATER (FREE)</button>';
 h+='<button class="btn" id="fcond20">CONDENSE +20 L (FREE)</button></div>';
 h+='<div class="row"><button class="btn" id="fprint">PRINT RATION (FREE)</button></div>';
 if(FABQ.length){h+='<h3>QUEUE</h3>';for(const q of FABQ)h+='<div class="amb">'+q.n+' … '+Math.floor(q.t*100)+'%</div>';}
 h+='<div class="dim">ATMOSPHERIC CONDENSER ONLINE — WATER AND RATIONS ARE FREE. THE REACTOR TANK STILL DRINKS: INJECT DAILY.</div>';
 b.innerHTML=h;
 $('fcond').onclick=()=>fab('CONDENSING WATER','cond',()=>{INV.water+=5;});
 $('fcond20').onclick=()=>fab('CONDENSING WATER','cond',()=>{INV.water+=20;});
 $('fprint').onclick=()=>fab('PRINTING RATION','print',()=>{INV.food+=1;});}
function fab(n,k,fn){
 const has={ice:INV.ice>=5,ore:INV.ore>=5,print:true,cond:true,part:INV.metal>=4}[k];
 if(!has||!pwr('main')){sfx('deny');toast(has?'NO POWER':'INSUFFICIENT MATERIALS');return;}
 fn();FABQ.push({n,t:0});sfx('beep');renderTerm();}
function fabTick(dt){
 for(let i=FABQ.length-1;i>=0;i--){FABQ[i].t+=dt/(FABQ[i].n.indexOf('PART')>=0?8:4);
  if(FABQ[i].t>=1){toast(FABQ[i].n+' DONE');sfx('pickup');FABQ.splice(i,1);
   if(TERM==='fab'||TERM==='food')renderTerm();}}}
/*--------- INVENTORY / BUNK ---------*/
function renderInv(b){
 let h='<h3>INVENTORY · '+Math.round(FL.cr)+' CR</h3><div class="igrid">';
 const IT=[['water','H2O','#7fd4ff'],['food','RAT','#ffd9a0'],['ice','ICE','#cfe8ff'],['ore','ORE','#c9a06a'],['metal','MET','#b8c4cc'],['exo','EXO','#ff8ad0'],['parts','PRT','#9fe8b8']];
 for(const it of IT){const q=it[0]==='water'?INV.water.toFixed(1):String(Math.floor(INV[it[0]]||0));
  h+='<span class="islot" data-it="'+it[0]+'"><em style="color:'+it[2]+'">'+it[1]+'</em><span class="q">×'+q+'</span></span>';}
 h+='<span class="islot"><em style="color:#ffb347">GEAR</em><span class="q">5 TOOLS</span></span></div>';
 h+='<div id="idetail" class="dim" style="margin:6px 0">CLICK A SLOT — WATER AND RATIONS CAN BE USED.</div>';
 h+='<h3>DEEP SPACE DEPLOYMENT</h3><div class="row">';
 for(const k of['beacon','sign','solar','lamp','printer']){const P=PARTS[k];
  h+='<button class="btn'+(MODE==='space'&&canAfford(P.cost)?'':' dis')+'" data-dep="'+k+'">'+P.n+' ('+costStr(P.cost)+')</button>';}
 h+='</div><div class="dim">DEPLOYS OFF THE BOW IN OPEN SPACE — STRUCTURES PERSIST IN THE WORLD FOREVER. SURFACE BASES: BUILD MODE [B] ON FOOT.</div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-it]').forEach(el=>el.onclick=()=>{const k=el.dataset.it;
  const d2=({water:'DRINK 0.5 L',food:'EAT RATION'})[k]||'RAW MATERIAL — SELL AT STATIONS OR REFINE';
  $('idetail').innerHTML=k.toUpperCase()+' — '+d2+' <button class="btn" data-use2="'+k+'">USE</button>';
  const ub=$('idetail').querySelector('[data-use2]');
  if(ub)ub.onclick=()=>{
   if(k==='water'&&INV.water>=.5){INV.water-=.5;VIT.thi=clamp(VIT.thi+40,0,100);sfx('pickup');toast('DRANK 0.5 L');}
   else if(k==='food'&&INV.food>=1){INV.food-=1;VIT.hun=clamp(VIT.hun+45,0,100);sfx('pickup');toast('RATION CONSUMED');}
   else sfx('deny');
   renderTerm();};});
 b.querySelectorAll('[data-dep]').forEach(el=>el.onclick=()=>{deploySpace(el.dataset.dep);renderTerm();});}
function renderBunk(b){
 let h='<h3>CREW BUNK</h3><div class="dim">Sleep advances the clock. Vitals drain slowly while you sleep.</div>';
 h+='<div class="row"><button class="btn" id="bsleep">SLEEP UNTIL SAFE LIGHT</button><button class="btn" id="bsave">SAVE GAME</button></div>';
 h+='<div class="row dim" id="binfo"></div>';
 b.innerHTML=h;
 const info=$('binfo');
 info.textContent=MODE==='surface'?('LOCAL SOLAR TIME '+Math.floor(LF.lst)+':'+('0'+Math.floor(LF.lst%1*60)).slice(-2)):('SHIP TIME '+fmtT(T.t));
 $('bsave').onclick=()=>{saveGame();renderTerm();};
 $('bsleep').onclick=()=>{
  let adv;
  if(MODE==='surface'){const h2=LF.lst;let dh=(6.5-h2+24)%24;if(dh<1)dh+=24;adv=dh/24*Math.abs(LF.body.rot)*3600;}
  else adv=6*3600;
  T.t+=adv;
  const days=adv/86400;
  VIT.hun=clamp(VIT.hun-days*33,0,100);VIT.thi=clamp(VIT.thi-days*50,0,100);
  if(POW.rea.on){POW.rea.water=clamp(POW.rea.water-days*100,0,100);
   if(POW.rea.water<=0){POW.rea.on=false;POW.rea.scram=20*86400;toast('YOU WOKE TO A SCRAMMED REACTOR',1);sfx('deny');}}
  VIT.suit=100;VIT.cab=100;VIT.hp=clamp(VIT.hp+12,0,100);
  saveGame(true);sfx('beep');toast('SLEPT '+fmtT(adv)+' — GAME SAVED');
  closeTerm();};}

/*==================== PART 6 — INPUT, PLAYER, TOOLS, ROVER ====================*/
PL.mode='walk';PL.inside=true;
const KEYS={};let JDOWN=false,MB1=false;
const EXT={th:.6,ph:.32,dist:16,drag:false};
function initInput(){
 addEventListener('keydown',e=>{
  if(e.code==='Tab'){e.preventDefault();}
  const tg=e.target;
  if(tg&&((tg.tagName==='INPUT'&&tg.type!=='range')||tg.tagName==='TEXTAREA'||tg.tagName==='SELECT'||tg.isContentEditable)){if(e.code==='Escape')tg.blur();return;}
  if(!BOOTED)return;
  KEYS[e.code]=true;
  if(e.code==='Escape'){if(TERM)closeTerm();else if(!MENU&&!document.pointerLockElement)togglePause();return;}
  if(PAUSED||DEAD||INTRO.on&&!INTRO.done)return;
  if(e.code==='KeyE'){
   if(TERM){closeTerm();return;}
   if(PL.mode==='rover'){exitRover();return;}
   if(PL.seated){standUp();return;}
   if(HOVERED)useCurrent();return;}
  if(TERM)return;
  if(e.code==='KeyM'){openTerm('nav');return;}
  if(e.code==='Tab'){openTerm('inv');return;}
  if(e.code==='KeyC'){camMode=camMode==='ext'?'fp':'ext';sfx('click');toast(camMode==='ext'?'EXTERNAL CAMERA':'COCKPIT VIEW');return;}
  if(e.code==='KeyG'&&PL.mode!=='rover'){toggleGear();return;}
  if(e.code==='KeyN'&&PL.mode!=='rover'){SRF.align=!SRF.align;sfx('beep');toast(SRF.align?'AUTO-ALIGN ENGAGED — COURSE '+(COURSE?COURSE.name:'NOT SET'):'AUTO-ALIGN OFF');dashSync();return;}
  if(e.code==='KeyZ'){fl2HoverToggle();return;}
  if(e.code==='KeyO'){fl2AssistToggle();return;}
  if(e.code==='KeyB'&&PL.mode!=='rover'){bldToggle();return;}
 if(e.code==='KeyV'){if(NET.on&&window.MP&&window.MP.voice&&window.MP.voice.state==='on'){const mu=window.MP.voice.toggleMute();sfx('sw');toast(mu?'MIC MUTED':'MIC LIVE');}else{sfx('deny');toast(NET.on?'MIC OFF — ENABLE IT IN MULTIPLAYER PANEL':'VOICE NEEDS THE BAND ONLINE');}return;}
  if(e.code==='KeyR'&&BLDG.on){BLDG.rot=(BLDG.rot+Math.PI/2)%(Math.PI*2);sfx('click');return;}
  if(e.code==='KeyX'&&BLDG.on){bldDemolish();return;}
  if(e.code==='KeyF'&&MODE==='space'&&!WRP.on){if(DOCKED)undockStation();
   else{const ns=nearestStation();if(ns&&ns.d<14&&SP.spd<60)tryDock(ns.st);else{sfx('deny');toast('NO STATION IN DOCK RANGE');}}return;}
  if(e.code==='KeyT'&&DOCKED){openTerm('station');return;}
  if(PL.mode==='rover'){
   if(e.code==='KeyL'){ROVER.lit=!ROVER.lit;sfx('sw');}
   if(e.code==='KeyB'){ROVER.rea=!ROVER.rea;sfx('sw');toast(ROVER.rea?'ROVER REACTOR ON':'ROVER REACTOR OFF');}
   if(e.code==='Space'){ROVER.spd=0;}
   return;}
  if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=5){VM.set(n-1);sfx('click');}return;}
  if(e.code==='KeyX'&&PL.seated){SP.thr=0;sfx('click');}
  if(e.code==='KeyJ'){if(H.on){dropHyper();}else JDOWN=true;}
  if(e.code==='Space'&&PL.inside&&PL.onG&&!PL.seated){PL.vel.y=POW.grav?4.4:2.2;PL.onG=false;}
 });
 addEventListener('keyup',e=>{KEYS[e.code]=false;if(e.code==='KeyJ'){JDOWN=false;hyperRelease();}});
 renderer.domElement.addEventListener('mousedown',e=>{
  if(!BOOTED||MENU||PAUSED||DEAD||e.button!==0)return;
  MB1=true;
  if(TERM)return;
  const inIntro=INTRO.on&&!INTRO.done;
  if(!inIntro&&HOVERED){useCurrent();return;}
  if(camMode==='ext'&&document.pointerLockElement!==renderer.domElement){EXT.drag=true;return;}
  if(window.LLTOUCH&&window.LLTOUCH.on){if(BLDG.on){if(BLDG.ok)bldPlace();else sfx('deny');return;}if(!inIntro&&VM.cur===1)scannerPing();return;}
  if(document.pointerLockElement!==renderer.domElement){try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}return;}
  if(BLDG.on){if(BLDG.ok)bldPlace();else sfx('deny');return;}
  if(!inIntro&&VM.cur===1)scannerPing();});
 addEventListener('mouseup',e=>{if(e.button===0){MB1=false;EXT.drag=false;}});
 addEventListener('mousemove',e=>{
  if(!BOOTED||MENU||PAUSED||DEAD)return;
  if(camMode==='ext'&&(EXT.drag||(window.LLTOUCH&&window.LLTOUCH.on&&window.LLTOUCH.drag)||document.pointerLockElement===renderer.domElement)){EXT.th-=e.movementX*.005;EXT.ph=clamp(EXT.ph-e.movementY*.005,-1.2,1.35);return;}
  if(document.pointerLockElement===renderer.domElement||(window.LLTOUCH&&window.LLTOUCH.on&&window.LLTOUCH.drag)){
   const s=.0022*SET.sens;
   if(PL.seated){STK.x=clamp(STK.x+e.movementX*.0016,-1,1);STK.y=clamp(STK.y+e.movementY*.0016,-1,1);}
   else{PL.yaw-=e.movementX*s;PL.pitch=clamp(PL.pitch-e.movementY*s,-1.5,1.5);}}});
 addEventListener('wheel',e=>{if(camMode==='ext')EXT.dist=clamp(EXT.dist*(e.deltaY>0?1.12:.9),7,400);});
 document.addEventListener('pointerlockchange',()=>{
  if(document.pointerLockElement)return;
  if(BOOTED&&!MENU&&!PAUSED&&!DEAD&&!TERM&&!(INTRO.on&&!INTRO.done))togglePause();});
}
function togglePause(){PAUSED=!PAUSED;
 $('pause').style.display=PAUSED?'flex':'none';
 if(PAUSED){sfx('beep');if(document.pointerLockElement)document.exitPointerLock();}
 else{sfx('click');try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}}}
$('pres').onclick=togglePause;
$('psave').onclick=()=>{saveGame();sfx('beep');};
$('pload').onclick=()=>{if(loadGame()){PAUSED=false;$('pause').style.display='none';resumeState();toast('STATE LOADED — SYSTEMS RESTORED');sfx('beep');}else{toast('NO SAVE FOUND');sfx('deny');}};
$('psetb').onclick=()=>{const p=$('pset');p.style.display=p.style.display==='block'?'none':'block';sfx('click');};
$('pctl').onclick=()=>{const p=$('plist');p.style.display=p.style.display==='block'?'none':'block';};
$('pnet').onclick=()=>{fillNetPanel();$('netp').style.display='flex';};
$('pmenu').onclick=()=>{saveGame(true);location.reload();};
$('pnew').onclick=()=>{if(confirm('ABANDON CURRENT SAVE AND START OVER?')){localStorage.removeItem(SAVEKEY);location.reload();}};
$('dload').onclick=()=>{if(loadGame()){DEAD=false;$('death').style.display='none';resumeState();}else{toast('NO SAVE FOUND');}};
$('dnew').onclick=()=>{localStorage.removeItem(SAVEKEY);location.reload();};
$('wcont').onclick=()=>{$('winov').style.display='none';};
/*--------- sit / stand ---------*/
function sitDown(x){
 if(PL.mode==='rover')exitRover();
 PL.seated=true;PL.seatX=x;PL.inside=true;closeTerm();clearHover();sfx('thud');
 toast('PILOT MODE — W/S THROTTLE · MOUSE STICK · J HYPERSPEED · E STAND');}
function standUp(){
 PL.seated=false;STK.x=0;STK.y=0;
 if(MODE==='space'&&SP.thr>0)toast('AUTOPILOT HOLD — SHIP UNDERWAY AT '+Math.round(SP.thr*100)+'% THROTTLE · E TO RETURN',1);
 else SP.thr=0;
 PL.pos.set(PL.seatX+.72,0,-6.1);PL.vel.set(0,0,0);HVX=HVZ=0;PL.yaw=Math.PI;PL.pitch=0;
 sfx('thud');}
/*--------- ground sampling ---------*/
function groundAt(x,z){
 if(MODE==='surface'){
  const l=shipToLocal(V3(x,10,z),TMP3);
  if(Math.abs(l.x)<2.4&&l.z<21.7&&l.z>-8.2&&(l.z<13.95||rampOpen())){
   const fl=l.z<13.95?0:-(l.z-14)*.18;
   return SHIPG.position.y+fl;}
  return TER.h(x,z);}
 return 0;}
/*--------- player update ---------*/
let WALKPH=0,HVX=0,HVZ=0,STEPA=0;
const ROVERC={x1:.18,x2:1.72,z1:10.9,z2:13.4};
function collList(){return ROVER.out?COLL:COLL.concat([ROVERC]);}
function playerUpdate(dt){
 if(PL.seated||PL.mode==='rover'||INTRO.on||TERM)return;
 let sp=(KEYS.ShiftLeft||KEYS.ShiftRight)?5.4:3.1;
 const g=MODE==='surface'?(LF.body.g||9.8):(POW.grav?9.81:1.4);
 if(PL.inside){
  const l=TMP3.copy(PL.pos);
  let mx=0,mz=0;
  if(KEYS.KeyW)mz-=1;if(KEYS.KeyS)mz+=1;if(KEYS.KeyA)mx-=1;if(KEYS.KeyD)mx+=1;
  const len=Math.hypot(mx,mz)||1;mx/=len;mz/=len;
  const sy=Math.sin(PL.yaw),cy=Math.cos(PL.yaw);
  const kk=1-Math.exp(-dt*13);
  HVX+=((sy*mz+cy*mx)*sp-HVX)*kk;HVZ+=((cy*mz-sy*mx)*sp-HVZ)*kk;
  let dx=HVX*dt, dz=HVZ*dt;
  let nx=l.x+dx,nz=l.z+dz;
  nx=clamp(nx,-1.78,1.78);
  const canRamp=MODE==='surface'&&rampOpen();
  for(const D of DOORS){
   if(D.open<.75){
    if(l.z<D.z&&nz>=D.z-.28)nz=D.z-.28;
    if(l.z>D.z&&nz<=D.z+.28)nz=D.z+.28;}}
  if(nz<-7.72)nz=-7.72;
  if(canRamp){if(nz>21.5)nz=21.5;}
  else if(nz>13.82)nz=13.82;
  for(const c of collList()){
   if(nx>c.x1-.28&&nx<c.x2+.28&&nz>c.z1-.28&&nz<c.z2+.28){
    const pushX=(nx<(c.x1+c.x2)/2)?c.x1-.28:c.x2+.28;
    const pushZ=(nz<(c.z1+c.z2)/2)?c.z1-.28:c.z2+.28;
    if(Math.abs(nx-pushX)<Math.abs(nz-pushZ))nx=pushX;else nz=pushZ;}}
  let fl=0;
  if(canRamp&&nz>13.95)fl=-(nz-14)*.18;
  PL.vel.y-=g*dt;let ny=l.y+PL.vel.y*dt;
  if(ny<=fl){if(l.y-fl>.05&&PL.vel.y<-3.2)sfx('thud');ny=fl;PL.vel.y=0;PL.onG=true;}else PL.onG=false;
  PL.pos.set(nx,ny,nz);
  if(MODE==='surface'&&nz>=21.4&&canRamp){goOutside();}
  WALKPH+=Math.hypot(dx,dz)*3.4;
  if(PL.onG){STEPA+=Math.hypot(dx,dz);const str=(KEYS.ShiftLeft||KEYS.ShiftRight)?1.3:.92;if(STEPA>str){STEPA=0;sfx('step');}}
 }else{
  let mx=0,mz=0;
  if(KEYS.KeyW)mz-=1;if(KEYS.KeyS)mz+=1;if(KEYS.KeyA)mx-=1;if(KEYS.KeyD)mx+=1;
  const len=Math.hypot(mx,mz)||1;mx/=len;mz/=len;
  const sy=Math.sin(PL.yaw),cy=Math.cos(PL.yaw);
  const wl=TER.wl;
  const inWater=wl!==null&&PL.pos.y-1.4<wl;
  if(inWater)sp*=.55;
  const kk=1-Math.exp(-dt*13);
  HVX+=((sy*mz+cy*mx)*sp-HVX)*kk;HVZ+=((cy*mz-sy*mx)*sp-HVZ)*kk;
  PL.pos.x+=HVX*dt;
  PL.pos.z+=HVZ*dt;
  PL.vel.y-=g*dt;
  PL.pos.y+=PL.vel.y*dt;
  for(const b of SURFBLD){
   if(!b._g||!PARTS[b.part]||!PARTS[b.part].solid)continue;
   const wx=b._g.position.x,wz=b._g.position.z;
   if(PL.pos.x>wx-1.15&&PL.pos.x<wx+1.15&&PL.pos.z>wz-1.15&&PL.pos.z<wz+1.15){
    const dx=PL.pos.x-wx,dz=PL.pos.z-wz;
    if(Math.abs(dx)>Math.abs(dz))PL.pos.x=dx>0?wx+1.15:wx-1.15;
    else PL.pos.z=dz>0?wz+1.15:wz-1.15;}}
  let gy=TER.h(PL.pos.x,PL.pos.z);
  if(inWater&&gy<wl)gy=wl;
  if(PL.pos.y<=gy){PL.pos.y=gy;PL.vel.y=0;PL.onG=true;}else PL.onG=false;
  if(PL.onG&&KEYS.Space)PL.vel.y=4.4;
  const dShip=Math.hypot(PL.pos.x,PL.pos.z);
  if(dShip>25000&&T.t-(SRF.tetherT||0)>30){SRF.tetherT=T.t;toast('LONG RANGE EVA — '+fmtK(dShip)+' FROM THE KESTREL',1);}
  const l=shipToLocal(PL.pos,TMP3);
  if(l.z<21.45&&rampOpen()&&Math.abs(l.x)<2.3)goInside();
  WALKPH+=Math.hypot(mx,mz)*3.4;
  if(PL.onG){STEPA+=Math.hypot(HVX,HVZ)*dt;const str=(KEYS.ShiftLeft||KEYS.ShiftRight)?1.35:.95;if(STEPA>str){STEPA=0;sfx('step');}}
  VIT.suit=clamp(VIT.suit-dt*.24,0,100);
  if(VIT.suit<=0)hurt(dt*4,'OXYGEN DEPRIVATION');
  const tt=LF.temp;
  if(tt<-40&&dShip>60)hurt(dt*.35,'HYPOTHERMIA');
  if(tt>55&&dShip>60)hurt(dt*.5,'HEAT STROKE');
 }
}
function goOutside(){
 if(!crewEva()){toast('SUIT UP FIRST — EVA LOCKER IN THE GARAGE');sfx('deny');return;}
 PL.inside=false;PL.suitOn=true;HVX=HVZ=0;PL.pos.copy(localToShip(PL.pos,TMP2));toast('EVA — SUIT O2 DRAINING · RETURN TO REPLENISH');sfx('hiss');}
function goInside(){PL.inside=true;PL.suitOn=false;HVX=HVZ=0;PL.pos.copy(shipToLocal(PL.pos,TMP2));toast('AIRLOCK CYCLED — WELCOME HOME');sfx('hiss');}
function hurt(n,cause){VIT.hp=clamp(VIT.hp-n,0,100);PL.hurtT=.4;LASTHIT=cause;
 if(VIT.hp<=0)die(cause);}
let LASTHIT='';
function die(cause){
 if(DEAD)return;DEAD=true;
 if(document.pointerLockElement)document.exitPointerLock();
 $('dcause').innerHTML=(cause||'UNKNOWN')+'<br><span class="dim" style="color:#887">Mission clock '+fmtT(T.t)+' · '+(MODE==='surface'?('LANDED ON '+LF.body.name):'IN FLIGHT')+'</span>';
 $('death').style.display='flex';sfx('boom');setLoop('eng',0);setLoop('hyp',0);setLoop('drl',0);}
/*--------- view models ---------*/
const VM={g:new THREE.Group(),cur:0,models:[],lamp:null,drillSpin:0};
cam.add(VM.g);scene.add(cam);
VM.g.position.set(.34,-.3,-.62);
function buildVM(){
 const mm=c=>new THREE.MeshLambertMaterial({color:c});
 const mk=(fn)=>{const g=new THREE.Group();fn(g);g.visible=false;VM.g.add(g);VM.models.push(g);return g;};
 mk(g=>{});
 mk(g=>{const b=new THREE.Mesh(new THREE.BoxGeometry(.07,.05,.16),mm(0x3a5a4a));g.add(b);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(.05,.035),new THREE.MeshBasicMaterial({color:0x2aff88}));s.position.set(0,.03,0);g.add(s);
  const a=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.1,5),mm(0x888));a.position.set(0,.05,.04);g.add(a);});
 mk(g=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.26,10),mm(0x554433));b.rotation.x=Math.PI/2;g.add(b);
  const h=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.06),mm(0x333));h.position.set(0,-.08,.06);g.add(h);
  const bit=new THREE.Mesh(new THREE.CylinderGeometry(.012,.03,.14,6),mm(0xb8a888));bit.rotation.x=Math.PI/2;bit.position.set(0,0,-.19);g.add(bit);g.userData.bit=bit;});
 mk(g=>{const h=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.5,7),mm(0x7a5a30));g.add(h);
  const hd=new THREE.Mesh(new THREE.BoxGeometry(.3,.05,.05),mm(0x555));hd.position.y=.25;g.add(hd);});
 mk(g=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.2,8),mm(0x444));b.rotation.x=.3;g.add(b);
  const hd=new THREE.Mesh(new THREE.CylinderGeometry(.05,.03,.06,8),mm(0xffd9a0));hd.position.set(0,.05,-.08);g.add(hd);});
 VM.lamp=new THREE.SpotLight(0xfff2d0,0,34,.55,.5,1.3);VM.lamp.position.set(0,.1,0);VM.lamp.target.position.set(0,0,-10);VM.lamp.visible=false;
 VM.g.add(VM.lamp);VM.g.add(VM.lamp.target);
 VM.set=(i)=>{VM.cur=i;for(let k=0;k<VM.models.length;k++)VM.models[k].visible=(k===i);
  if(VM.lamp){VM.lamp.intensity=(i===4)?2.6:0;VM.lamp.visible=(i===4);}
  FL.hot=i;drawHotbar();};
 VM.set(0);}
function vmUpdate(dt){
 if(PL.mode==='rover'||camMode==='ext'){VM.g.visible=false;return;}
 VM.g.visible=true;
 const bob=Math.sin(WALKPH)*0.014;
 VM.g.position.set(.34,-.3+bob,-.62);
 const dr=VM.models[2];
 if(dr&&dr.visible&&MB1&&!TERM&&MODE==='surface'&&!PL.inside){
  dr.userData.bit.rotation.z+=dt*40;VM.g.position.x+=rnd(-.004,.004);VM.g.position.y+=rnd(-.004,.004);}}
/*--------- mining / scanner ---------*/
let MINEP=0,SCANBUF=0;
function toolUpdate(dt){
 if(TERM||PAUSED)return;
 if(MB1&&VM.cur===2&&MODE==='surface'&&!PL.inside&&PL.mode==='walk'&&!PL.seated){
  const r=LF.body.res||{},buff=(T.t-SCANBUF<90)?1.3:1;
  let got=null;
  if(r.ore&&Math.random()<dt*.85*buff*(r.ore*.4)){INV.ore+=1;got='ORE';}
  else if(r.ice&&Math.random()<dt*.9*buff*(r.ice*.4)){INV.ice+=1;got='ICE';}
  else if(r.exo&&Math.random()<dt*.16*buff*r.exo){INV.exo+=1;got='EXOTIC MATTER';}
  if(got){sfx('pickup');toast('+1 '+got);}
  setLoop('drl',.4);}
 else if(MB1&&VM.cur===3&&MODE==='surface'&&!PL.inside&&PL.mode==='walk'&&!PL.seated){
  const r=LF.body.res||{};
  if(r.ore&&Math.random()<dt*1.2){INV.ore+=1;sfx('pickup');toast('+1 ORE');}
  setLoop('drl',.25);}
 else setLoop('drl',0);}
function scannerPing(){
 if(MODE!=='surface'||PL.inside){toast('SCANNER: USE PLANETSIDE, OUTSIDE THE HULL');return;}
 SCANBUF=T.t;sfx('beep');
 const r=LF.body.res||{};
 toast('GROUND SCAN — '+resStr(LF.body));
 if(r.exo)toast('EXOTIC TRACE CONFIRMED — DRILL HERE',1);}
/*--------- rover ---------*/
function enterRover(){
 if(MODE!=='surface'){toast('ROVER IS GARAGED IN FLIGHT');return;}
 if(!ROVER.out){if(!rampOpen()){toast('DEPLOY THE RAMP FIRST');sfx('deny');return;}
  ROVER.wpos.copy(localToShip(V3(-.9,0,20.2),TMP2));undockRover();}
 PL.mode='rover';closeTerm();clearHover();
 toast('ROVER — WASD DRIVE · SPACE BRAKE · L LIGHTS · B POWER · E EXIT');sfx('thud');}
function exitRover(){
 PL.mode='walk';setLoop('eng',0);
 PL.pos.copy(ROVER.g.position);PL.pos.x+=1.6;PL.pos.y=groundAt(PL.pos.x,PL.pos.z);
 PL.vel.set(0,0,0);PL.yaw=ROVER.head+Math.PI/2;sfx('thud');}
function roverUpdate(dt){
 if(PL.mode!=='rover')return;
 const powered=ROVER.rea||ROVER.batt>0;
 if(ROVER.rea)ROVER.batt=clamp(ROVER.batt+dt*1.2,0,100);
 else if(ROVER.lit)ROVER.batt=clamp(ROVER.batt-dt*.15,0,100);
 for(const L of ROVERLAMPS){L.intensity=(ROVER.lit&&powered)?2.2:0;L.visible=L.intensity>.01;}
 if(!powered){ROVER.spd=0;return;}
 let acc=0;
 if(KEYS.KeyW)acc=6;if(KEYS.KeyS)acc=-3.5;
 ROVER.spd=clamp(ROVER.spd+acc*dt,-4,13);
 if(!acc)ROVER.spd*=Math.exp(-dt*1.1);
 if(KEYS.Space)ROVER.spd*=Math.exp(-dt*6);
 const st=(KEYS.KeyA?1:0)-(KEYS.KeyD?1:0);
 ROVER.head+=st*1.5*dt*clamp(Math.abs(ROVER.spd)/4,.15,1)*Math.sign(ROVER.spd||1);
 const sy=Math.sin(ROVER.head),cy=Math.cos(ROVER.head);
 let nx=ROVER.g.position.x-sy*ROVER.spd*dt;
 let nz=ROVER.g.position.z-cy*ROVER.spd*dt;
 const l=shipToLocal(V3(nx,10,nz),TMP3);
 if(Math.abs(l.x)<2.5&&l.z>-8&&l.z<21.7){
  if(l.z>=13.95&&!rampOpen()){nz=ROVER.g.position.z;ROVER.spd=0;}
  else if(l.z>=21.6){/*out*/}
  else{const fl=(l.z>13.95)?-(l.z-14)*.18:0;ROVER.g.position.y=SHIPG.position.y+fl;}}
 const dA=Math.hypot(nx,nz);
 if(dA>780){const k=780/dA;nx*=k;nz*=k;toast('ROVER TETHER LIMIT',1);ROVER.spd=0;}
 ROVER.g.position.x=nx;ROVER.g.position.z=nz;
 const g=groundAt(nx,nz);
 if(MODE==='surface'&&dA>0){
  const hF=groundAt(nx-sy*.9,nz-cy*.9),hB=groundAt(nx+sy*.9,nz+cy*.9),hL=groundAt(nx-cy*.8,nz+sy*.8),hR=groundAt(nx+cy*.8,nz-sy*.8);
  ROVER.g.position.y=Math.max(g,(hF+hB+hL+hR)/4);
  const pitch2=Math.atan2(hB-hF,1.8),roll2=Math.atan2(hR-hL,1.6);
  ROVER.g.rotation.set(pitch2,ROVER.head,-roll2,'YXZ');}
 else ROVER.g.rotation.y=ROVER.head;
 for(const w of ROVERWHEELS)w.rotation.x+=ROVER.spd*dt*2.6;
 ROVER.wpos.copy(ROVER.g.position);
 setLoop('eng',Math.abs(ROVER.spd)>.3?.25:0,120+Math.abs(ROVER.spd)*20);
 const l2=shipToLocal(ROVER.g.position,TMP3);
 if(l2.z<13.8&&Math.abs(l2.x)<2.3&&Math.abs(ROVER.spd)<.6){dockRover();PL.mode='walk';PL.inside=true;PL.pos.set(-.2,0,11.5);PL.vel.set(0,0,0);PL.yaw=0;toast('ROVER DOCKED');}}
function drawHotbar(){
 const names=['HAND','SCANNER','DRILL','PICKAXE','LAMP'],icons=['·','[((·))',']|[——]','⌐¬','☼'];
 let h='';
 for(let i=0;i<5;i++)h+='<div class="slot'+(VM.cur===i?' on':'')+'" data-i="'+i+'"><em>'+(i+1)+'</em>'+names[i]+'</div>';
 $('hb').innerHTML=h;
 $('hb').querySelectorAll('.slot').forEach(s=>s.onclick=()=>{VM.set(+s.dataset.i);sfx('click');});}

/*==================== PART 7 — FLIGHT, SURFACE WORLD, CAMERA ====================*/
const SURFG=new THREE.Group();
let LBK=0,SURFV=V3(0,0,0);
const SKY_FS='uniform vec3 uTop,uHor,uSun,uSunC;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=clamp(d.y,0.,1.);vec3 col=mix(uHor,uTop,pow(h,.6));float s=max(dot(d,normalize(uSun)),0.);col+=uSunC*(pow(s,900.)*3.+pow(s,10.)*.22);gl_FragColor=vec4(col,1.);}';
const SKY_VS='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
function buildTerrain(bd){ /* legacy flat terrain retired — FIRMWARE 15 uses SURF2 spherical chunks (p11) */ }
function enterSurface(bd,q0pf,yaw,restore){
 MODE='surface';FL.sys=bd.sys;LF.body=bd;
 LAND={b:bd.id,q0:q0pf.toArray(),yaw:yaw||0,alt:0,roverP:null,roverOut:false};
 if(CACHE&&CACHE.hb){const i=HITS.indexOf(CACHE.hb);if(i>=0)HITS.splice(i,1);CACHE=null;}
 sur2Enter(bd,q0pf.toArray?q0pf:V3(0,1,0));
 spawnSurfBuilds();
 sur2Flats();
 BLDG.on=false;$('bld').style.display='none';if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}
 SHIPG.position.set(0,GEAR,0);SHIPG.rotation.set(0,yaw||0,0);
 SHIPG.quaternion.setFromAxisAngle(V3(0,1,0),yaw||0); /* explicit: never inherit space-side attitude */
 SURFV.set(0,0,0);H.on=false;H.chg=0;LBK=0;SP.thr=0;FL2.hover=false;FL2.hoverT=20;
 if(restore)LANDfromSave();
 else{
  PL.seated=true;PL.inside=true;
  /* touchdown: the descent is flown before the transition — the ship parks.
     (Momentum continuity lives on the EXIT side: surface velocity -> orbit.) */
  SURFV.set(0,0,0);}
 if(restore)PL.inside=true;
 camMode='fp';
 if(!restore){toast('TOUCHDOWN — '+bd.name.toUpperCase()+(GEARST.tgt<1?' · GEAR UP! PRESS G':'')+' · E TO STAND · Z = VTOL HOVER',1);sfx('thud');saveGame(true);}
 updateSurface();
 sur2EnsureCells(10);}
function LANDfromSave(){const l=FL.land;if(!l)return false;
 if(l.roverP){
  if(l.roverP.length>=4){const d=V3(l.roverP[0],l.roverP[1],l.roverP[2]).normalize();
   ROVER.wpos.copy(sur2ENU(d,0,new THREE.Vector3()));ROVER.head=l.roverP[3]||0;}
  else{ROVER.wpos.set(l.roverP[0],0,l.roverP[1]);ROVER.head=l.roverP[2]||0;}
  undockRover();ROVER.g.position.copy(ROVER.wpos);ROVER.g.position.y=SURF2.groundY(ROVER.wpos.x,ROVER.wpos.z);}
 else dockRover();
 ROVER.rea=FL.roverPwr||false;
 if(l.sa){SHIPG.position.copy(sur2ENU(V3(l.sd[0],l.sd[1],l.sd[2]).normalize(),l.sa,new THREE.Vector3()));}
 PL.pos.set(0,0,6);PL.yaw=Math.PI;PL.vel.set(0,0,0);return true;}
function exitSurface(){
 const bd=LF.body;if(!bd)return;
 const th=2*Math.PI*T.t/((bd.rot||24)*3600);
 const shipD=sur2DirAt(SHIPG.position.x,SHIPG.position.z,new THREE.Vector3());
 const altM=Math.max(0,sur2AltM(SHIPG.position));
 const qw=shipD.clone().applyAxisAngle(V3(0,1,0),th);LF.qw=qw.clone();
 const east=LF.east,up=qw,zn=LF.zn;
 TMQ.setFromRotationMatrix(TMM.makeBasis(east,up,zn));
 SP.q.copy(TMQ).multiply(SHIPG.quaternion);
 /* momentum carries back to orbit: ENU m/s -> world units/s */
 const vW=TMP2.set(SURFV.x*east.x+SURFV.y*up.x+SURFV.z*zn.x,SURFV.x*east.y+SURFV.y*up.y+SURFV.z*zn.y,SURFV.x*east.z+SURFV.y*up.z+SURFV.z*zn.z);
 SP.vel.copy(vW).multiplyScalar(1/8000);
 SP.spd=SP.vel.length();
 SP.pos.copy(bd.posU).add(TMP3.copy(qw).multiplyScalar(bd.r*US+altM/8000));
 SP.fwd.set(0,0,-1).applyQuaternion(SP.q);
 const l2=shipToLocal(ROVER.g.position,TMP3);
 if(!ROVER.out||l2.z<14)dockRover();
 clearSurfBuilds();BLDG.on=false;$('bld').style.display='none';if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}
 sur2Dispose();
 scene.remove(SURFG);scene.fog=null;TER=null;LF.body=null;LAND=null;MODE='space';
 LBK=12;PL.inside=true;PL.pos.set(0,0,6);
 HEMI.intensity=0;AMB.intensity=.55;
 toast('ORBIT — '+bd.name.toUpperCase());sfx('whoosh');}
function q0pfToV3(a){return V3(a[0],a[1],a[2]);}
function updateSurface(){
 const bd=LF.body;if(!bd||!TER)return;
 const th=2*Math.PI*T.t/((bd.rot||24)*3600);
 const qw=TMP.copy(q0pfToV3(LAND.q0)).applyAxisAngle(V3(0,1,0),th);
 LF.qw?LF.qw.copy(qw):LF.qw=qw.clone();
 LF.up.copy(qw);
 /* FIRMWARE 15: east derives from the transported body basis (pole-safe, continuous) */
 if(SURF2.on){LF.east.copy(SURF2.eBF).applyAxisAngle(V3(0,1,0),th);}
 else{LF.east.set(LF.up.z,0,-LF.up.x).normalize();}
 if(!isFinite(LF.east.x)||LF.east.length()<.01)LF.east.set(1,0,0);
 LF.zn.crossVectors(LF.east,LF.up).normalize();
 const ns=nearestStar(bd.posU);
 const sunW=TMP2.copy(ns.b.posU).sub(bd.posU).normalize();
 const sx=sunW.dot(LF.east),syp=sunW.dot(LF.up),sz=sunW.dot(LF.zn);
 LF.sun.set(sx,syp,sz);
 LF.sinE=syp;
 LF.lst=(Math.atan2(sx,sz)/(Math.PI*2)*24+12+24)%24;
 LF.dayF=clamp((syp+.06)*3.5,0,1);
 const P=PAL[bd.pal];
 LF.temp=(bd.tk-273)+(syp>0?syp*P.sw:-P.dr*clamp(-syp*2,0,1));
 const cStar=new THREE.Color(SYSTEMS[ns.b.sys].c);
 const dayTop=new THREE.Color(P.skyD[0]*.55+.02,P.skyD[1]*.55+.03,P.skyD[2]*.55+.05);
 const dayHor=new THREE.Color(P.skyD[0]*.9+.02,P.skyD[1]*.9+.04,P.skyD[2]*.9+.06);
 const nightTop=new THREE.Color(.012,.018,.045),nightHor=new THREE.Color(.03,.04,.08);
 const top=nightTop.clone().lerp(dayTop,LF.dayF),hor=nightHor.clone().lerp(dayHor,LF.dayF);
 const sunEl=clamp(syp*4,0,1);
 if(Math.abs(syp)<.22){const sunset=new THREE.Color(.85,.38,.16).multiplyScalar(clamp(1-Math.abs(syp)*4.5,0,1)*.55);hor.lerp(sunset,.6);}
 TER.sky.material.uniforms.uTop.value.copy(top);
 TER.sky.material.uniforms.uHor.value.copy(hor);
 TER.sky.material.uniforms.uSun.value.copy(LF.sun);
 TER.sky.material.uniforms.uSunC.value.copy(cStar);
 TER.sky.position.copy(cam.position);
 TER.sun.position.copy(LF.sun).multiplyScalar(120000);
 TER.sun2.position.copy(TER.sun.position);
 TER.sun.material.color.copy(cStar).lerp(new THREE.Color(1,1,1),.5);
 TER.stars.material.opacity=clamp(1-LF.dayF*1.5,0,1);
 TER.stars.rotation.y=-th;
 SUNL.position.copy(LF.sun).multiplyScalar(1e4);
 SUNL.intensity=clamp(2.2*Math.pow(1.9e7/Math.max(1e4,ns.d),2),.05,2.4)*(.25+.75*sunEl);
 SUNL.color.copy(cStar).lerp(new THREE.Color(1,1,1),.4);
 HEMI.intensity=.08+LF.dayF*.6;
 AMB.intensity=.1+LF.dayF*.22;
 if(scene.fog)scene.fog.color.copy(hor);
 SRF.wind=P.wind;
 if(LAND)LAND.alt=Math.max(0,sur2AltM(SHIPG.position));}
/*--------- space flight ---------*/
function shipAxes(){SP.fwd.set(0,0,-1).applyQuaternion(SP.q);SP.up.set(0,1,0).applyQuaternion(SP.q);SP.rt.set(1,0,0).applyQuaternion(SP.q);}
function flightUpdate(dt){
 if(DOCKED){setLoop('eng',0);return;}
 LBK=Math.max(0,LBK-dt);
 if(INTRO.on&&INTRO.dir){const c=FLG.earthGone?FL.earthPosKm:bodyById('earth').posKm;
  SP.pos.copy(c).multiplyScalar(US).addScaledVector(INTRO.dir,INTRO.dist);}
 SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
 shipAxes();
 if(PL.seated&&!INTRO.on){
  const dth=((KEYS.KeyW?1:0)-(KEYS.KeyS?1:0))*.45*dt;
  SP.thr=clamp(SP.thr+dth,0,1);
  TMQ.setFromEuler(new THREE.Euler(-STK.y*.85*dt,-STK.x*.65*dt,((KEYS.KeyA?1:0)-(KEYS.KeyD?1:0))*1.3*dt,'XYZ'));
  SP.q.multiply(TMQ).normalize();
  STK.x*=Math.exp(-dt*.7);STK.y*=Math.exp(-dt*.7);
 }
 if(SP.thr>0&&!pwr('eng')&&!PL.seated){toast('AUTOPILOT HOLD RELEASED — ENGINES OFFLINE');SP.thr=0;}
 if(PL.seated&&SRF.align&&COURSE&&!INTRO.on){
  const cp=coursePos(TMP3);
  if(cp){TMP.copy(cp).sub(SP.pos);
   if(TMP.length()>10){TMP.normalize();
    const dot=clamp(SP.fwd.dot(TMP),-1,1),ang=Math.acos(dot);
    if(ang>.015){TMP2.crossVectors(SP.fwd,TMP);
     if(TMP2.lengthSq()>1e-9){TMP2.normalize();
      QT2.setFromAxisAngle(TMP2,Math.min(ang,dt*1.15));
      SP.q.multiplyQuaternions(QT2,SP.q).normalize();shipAxes();}}}}}
 fl2Space(dt); /* momentum flight: thrust, assist, entry drag (p12) */
 shipAxes();
 const ns=nearestStar(SP.pos);if(ns.d<3e12)FL.sys=ns.b.sys;
 SUNL.position.copy(ns.b.posU).sub(SP.pos);
 SUNL.target.position.set(0,0,0);
 SUNL.intensity=clamp(2.2*Math.pow(1.9e7/Math.max(1e4,ns.d),2),.12,2.4);
 SUNL.color.copy(new THREE.Color(SYSTEMS[ns.b.sys].c)).lerp(new THREE.Color(1,1,1),.45);
 for(const b of BODY){
  const d=SP.pos.distanceTo(b.posU),dr=d-b.r*US;
  if(b.t==='star'){
   if(dr<b.r*US*.8){die('FLEW INTO '+b.name.toUpperCase()+' — STELLAR CORONA');return;}
   if(dr<b.r*US*2.2&&T.t-(SRF.warnT||0)>6){SRF.warnT=T.t;toast('WARNING — '+b.name.toUpperCase()+' CORONA PROXIMITY',1);}}
  else if(b.t==='gas'){
   if(dr<60){die('CRUSHED IN THE CLOUDS OF '+b.name.toUpperCase());return;}}
  else{
   if(dr<.4&&LBK<=0&&!(b.id==='earth'&&FLG.earthGone)){
    if(SP.spd<60){
     if(b.res||b.id==='luna'||b.t==='rock'){
      const th=2*Math.PI*T.t/((b.rot||24)*3600);
      const q0=TMP.copy(SP.pos).sub(b.posU).normalize().applyAxisAngle(V3(0,1,0),-th);
      const fwdW=TMP2.copy(SP.fwd);
      const fE=fwdW.dot(LFe(b,q0).east),fU=fwdW.dot(LFe(b,q0).up),fZ=fwdW.dot(LFe(b,q0).zn);
      const yaw=Math.atan2(-fE,-fZ);
      enterSurface(b,q0.clone(),yaw,false);return;}}
    else if(dr<.15){
     if(SP.spd<600){hurt(SP.spd/14,'SURFACE IMPACT — FLY GENTLER');SP.spd*=-.25;SHK.t=1;SHK.amp=.8;sfx('thud');}
     else{die('SURFACE IMPACT AT '+fmtK(SP.spd*8)+'/s — FLY GENTLER NEXT TIME');return;}}}
   else if(dr<3&&dr>.4&&SP.spd>60&&T.t-(SRF.apT||0)>5){SRF.apT=T.t;toast('TOO FAST FOR LANDING — CUT THROTTLE (X) BELOW 480 km/s',1);}}}
 if(FLG.earthGone&&T.t-FLG.goneT>12000){
  const dd=SP.pos.distanceTo(DEB.posU);
  if(dd<1250){hurt(dt*2.5,'HULL BREACH — DEBRIS FIELD');if(T.t-(SRF.debT||0)>4){SRF.debT=T.t;toast('DEBRIS FIELD — GET CLEAR',1);}}}
 for(const g of ENGGLOW)g.material.opacity=SP.thr*.9;
 for(const cc of ENGCONE){cc.material.opacity=SP.thr*.7*(.8+Math.random()*.4);cc.scale.y=lerp(.25,1.9,SP.thr);}
 setLoop('eng',PL.seated?SP.thr*.4:Math.min(.25,SP.spd/4000),60+SP.thr*140);}
function LFe(b,q0){
 const th=2*Math.PI*T.t/((b.rot||24)*3600);
 const up=q0.clone().applyAxisAngle(V3(0,1,0),th);
 const east=V3(up.z,0,-up.x).normalize();
 const zn=V3().crossVectors(east,up).normalize();
 return{east,up,zn};}
function hyperRelease(){
 if(!JDOWN&&H.chg>0&&!H.on&&H.cd<=0&&!WRP.on){
  if(H.chg<.8){H.chg=0;sfx('deny');toast('MISFIRE — HOLD J LONGER TO CHARGE');H.cd=3;return;}
  let sysTgt=null;
  if(COURSE&&COURSE.kind==='sys')sysTgt=COURSE.ref;
  else if(COURSE&&COURSE.kind==='body'&&COURSE.ref&&COURSE.ref.sys!==FL.sys)sysTgt=COURSE.ref.sys;
  if(sysTgt&&sysTgt!==FL.sys){const st=warpTargetStar(sysTgt);
   if(st&&SP.pos.distanceTo(st.posU)*8>1e12){if(warpStart(sysTgt))H.chg=0;else H.chg=0;return;}}
  if(!POW.amp){H.chg=0;sfx('deny');toast('HYPERSPEED AMP OFFLINE — OVERHEAD GUARDED SWITCH');return;}
  if(POW.rea.water<20){H.chg=0;sfx('deny');POW.rea.on=false;POW.rea.scram=20*86400;
   toast('REACTOR SCRAM — STABILITY TOO LOW. 20 GAME DAYS OR 1 EXOTIC MATTER.',1);sfx('boom');return;}
  H.on=true;H.t=0;H.chg=0;sfx('whoosh');toast('HYPERSPEED ENGAGED',1);}
 H.chg=0;}
function hyperUpdate(dt){
 if(H.cd>0)H.cd-=dt;
 if(JDOWN&&!H.on&&H.cd<=0&&PL.seated&&!INTRO.on){
  H.chg=clamp(H.chg+dt/2.2,0,1);
  setLoop('hyp',H.chg*.3,170+H.chg*300);}
 else if(!H.on)setLoop('hyp',0);
 if(H.on){
  H.t+=dt;setLoop('hyp',.35);
  let minD=1e18,minB=null;
  for(const b of BODY){const d=SP.pos.distanceTo(b.posU);if(d<minD){minD=d;minB=b;}}
  if(minD>5e7){SP.pos.addScaledVector(SP.fwd,minD*.15*dt);}
  if(!FLG.voySeen&&!FLG.voyGot&&ANOM.voy&&SP.pos.distanceTo(ANOM.voy.posU)<1.2e11){FLG.voySeen=true;sfx('ping');toast('RARE CONTACT — PASSING VOYAGER 1. THE GOLDEN RECORD GLEAMS OFF THE BOW.',1);FL.log.push({t:T.t,m:'FLYBY: VOYAGER 1 DURING FOLD'});}
  if(minB&&(minD<minB.r*US*6+2e4||H.t>25)){dropHyper();}}}
function dropHyper(){if(!H.on)return;H.on=false;H.cd=8;H.heat=0;SP.spd=600;sfx('whoosh');toast('HYPERSPEED DISENGAGED');}
function surfaceFlight(dt){ fl2Surf(dt); } /* flight model 2.0 lives in p12-flight.js */
/*--------- supply cache ---------*/
function spawnCache(){
 const a=rnd(0,6.3),d=rnd(140,240);
 const x=Math.cos(a)*d,z=Math.sin(a)*d,y=SURF2.groundY(x,z);
 const g=new THREE.Group();g.position.set(x,y+.4,z);
 const c=new THREE.Mesh(new THREE.BoxGeometry(.9,.7,.9),MT.crate);g.add(c);
 const bcn=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffb347,transparent:true,blending:THREE.AdditiveBlending}));
 bcn.scale.setScalar(2.4);bcn.position.y=1.2;g.add(bcn);
 SURFG.add(g);
 const hb=hit(c,'SUPPLY CRATE','OPEN',()=>{INV.parts+=2;INV.food+=3;INV.water+=6;if(Math.random()<.5)INV.exo+=1;
  sfx('pickup');toast('SUPPLY CRATE — PARTS +2 · RATIONS +3 · WATER +6 L');
  SURFG.remove(g);const i=HITS.indexOf(hb);if(i>=0)HITS.splice(i,1);CACHE=null;});
 CACHE={g:g,pos:g.position,hb:hb};}
/*--------- camera ---------*/
function updateCamera(dt){
 if(SHK.t>0){SHK.t-=dt;}
 const sh=SHK.t>0?SHK.amp*SHK.t*.06:0;
 if(camMode==='ext'){
  const tgt=MODE==='surface'?TMP.copy(SHIPG.position):TMP.set(0,0,0);
  cam.position.set(tgt.x+EXT.dist*Math.cos(EXT.ph)*Math.sin(EXT.th),tgt.y+EXT.dist*Math.sin(EXT.ph),tgt.z+EXT.dist*Math.cos(EXT.ph)*Math.cos(EXT.th));
  cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
  cam.lookAt(tgt);return;}
 if(PL.mode==='rover'){
  const r=ROVER.g.position;
  cam.position.set(r.x,r.y+2.1,r.z);
  cam.position.x+=rnd(-sh,sh);
  cam.quaternion.setFromEuler(new THREE.Euler(0,ROVER.head,0));return;}
 if(PL.seated){
  TMP.set(PL.seatX,1.47,-6.15);
  cam.position.copy(localToShip(TMP,TMP2));
  cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
  EUL.set(-STK.y*.07,-STK.x*.07,0,'YXZ');
  cam.quaternion.copy(SHIPG.quaternion).multiply(TMQ.setFromEuler(EUL));return;}
 if(PL.inside||MODE==='space'){
  TMP.set(PL.pos.x,PL.pos.y+1.62,PL.pos.z);
  cam.position.copy(localToShip(TMP,TMP2));
  cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
  EUL.set(PL.pitch,PL.yaw,0,'YXZ');
  cam.quaternion.copy(SHIPG.quaternion).multiply(TMQ.setFromEuler(EUL));return;}
 cam.position.set(PL.pos.x,PL.pos.y+1.62,PL.pos.z);
 cam.position.x+=rnd(-sh,sh);cam.position.y+=rnd(-sh,sh);
 EUL.set(PL.pitch,PL.yaw,0,'YXZ');
 cam.quaternion.setFromEuler(EUL);}

/*==================== PART 7B — GLOBAL SERVER SIM · WARP · STATIONS · CONSTRUCTION · LIFE SUPPORT ====================*/
/*------ NET: REAL GLOBAL BAND — a WebSocket relay server (js/mp/00-mp-core.js + 01-mp-voice.js)
   owns accounts, chat, beacons, structures and mothership schedules. This layer feeds the
   local ship state at 10 Hz, renders remote pilots, and applies world events into the same
   structures the single-player game already uses. Offline play stays fully playable. ------*/
const NET={on:false,id:null,skin:null,world:{v:1,players:{},chat:[],beacons:[],builds:[],mothers:[]},lastSave:0};
function netSave(){}                                  // the server persists now
function netCount(){return NET.on&&window.MP?Math.max(1,window.MP.online):0;}
function hslHex(h,s,l){h=((h%360)+360)%360;s/=100;l/=100;
 const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l);
 const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
 const t=x=>Math.round(x*255).toString(16).padStart(2,'0');
 return '#'+t(f(0))+t(f(8))+t(f(4));}
function mkSkin(name){const h=hashId(name||'PILOT');
 return{suit:hslHex(h,52,38),trim:hslHex(h*7,70,55),visor:hslHex(h*3,80,60),emblem:h%6,name:(name||'PILOT').toUpperCase()};}
function drawSkin(cv,skin){const x=cv.getContext('2d'),W=cv.width,H=cv.height;
 x.fillStyle='#060a0e';x.fillRect(0,0,W,H);
 const u=Math.min(W,H)/10;
 x.fillStyle=skin.trim;x.fillRect(u*3,u*1.4,u*4,u*8);
 x.fillStyle=skin.suit;x.fillRect(u*2.2,u*2.2,u*5.6,u*6.6);
 x.fillStyle=skin.trim;x.fillRect(u*2.2,u*4.6,u*5.6,u*.7);
 x.fillStyle=skin.suit;x.fillRect(u*1.1,u*2.5,u,u*4);x.fillRect(u*7.9,u*2.5,u,u*4);
 x.fillStyle=skin.trim;x.fillRect(u*1.1,u*6.2,u,u*.9);x.fillRect(u*7.9,u*6.2,u,u*.9);
 x.fillStyle=skin.suit;x.beginPath();x.arc(u*5,u*1.9,u*1.9,0,7);x.fill();
 x.fillStyle=skin.visor;x.beginPath();x.arc(u*5.35,u*1.9,u*1.15,0,7);x.fill();
 x.fillStyle='#ffd9a0';x.font='bold '+Math.round(u*.95)+'px Consolas';x.textAlign='center';x.textBaseline='middle';
 x.fillText(['▲','◆','✦','◈','✚','◉'][skin.emblem%6],u*5,u*6.4);
 x.fillStyle='#5d7688';x.font='bold '+Math.round(u*.42)+'px Consolas';
 x.fillText((skin.name||'PILOT').slice(0,12),u*5,u*9.2);}
let NETHOOKS=false;
function netEvents(){                                  // wire server events into the game (once)
 if(NETHOOKS||!window.MP)return;NETHOOKS=true;
 const M=window.MP;
 M.on('welcome',m=>{
  NET.on=true;NET.id=m.id;NET.skin=mkSkin(m.id);FL.netName=m.id;
  NET.world.chat=M.chat;NET.world.beacons=M.beacons;NET.world.builds=M.builds;NET.world.mothers=M.mothers;
  if(m.motd)FL.log.push({t:T.t,m:'RX: '+m.motd});
  sfx('tele');toast('CONNECTED — GLOBAL BAND ONLINE · '+(m.online||1)+' PILOTS',1);
  if($('netp').style.display==='flex')fillNetPanel();
  if(typeof m.useed==='number'&&m.useed!==SET.useed){
   SET.useed=m.useed;try{localStorage.setItem(SETKEY,JSON.stringify(SET));}catch(e){}
   toast('UNIVERSE SEED SYNCED WITH SERVER — RELOADING…',1);
   setTimeout(()=>location.reload(),2000);}});
 M.on('net',m=>{
  if(!m.on){NET.on=false;netTear();
   toast(m.status==='lost'?'LINK LOST — RECONNECTING…':'BAND OFFLINE'+(m.reason?' — '+m.reason:''),1);
   if($('netp').style.display==='flex')fillNetPanel();}});
 M.on('netErr',m=>{toast('BAND: '+m.m,1);sfx('deny');if($('netp').style.display==='flex')fillNetPanel();});
 M.on('needAuth',()=>{if($('netp').style.display==='flex')fillNetPanel();});
 M.on('chat',m=>{
  toast('['+m.who+'] '+String(m.m).toUpperCase().slice(0,58));sfx('radio');
  if(TERM==='com')renderTerm();});
 M.on('join',m=>{toast('◆ '+m.n+' ON THE BAND');});
 M.on('leave',m=>{toast('◆ '+m.n+' LEFT THE BAND');});
 M.on('mom',()=>{if(TERM==='dock')renderTerm();});
 M.on('bld',b=>{                                       // another pilot builds where we stand
  if(MODE==='surface'&&LAND&&b.body===LAND.b&&PARTS[b.part]&&!FL.builds.some(x=>x.id===b.id))surfSpawn(b);});
 M.on('bldDel',id=>{
  for(let i=SURFBLD.length-1;i>=0;i--){const b=SURFBLD[i];
   if(b.id===id){if(b._hit){const j=HITS.indexOf(b._hit);if(j>=0)HITS.splice(j,1);}
    if(b._g)SURFG.remove(b._g);if(PARTS[b.part]&&PARTS[b.part].lamp)BLD_NL--;
    SURFBLD.splice(i,1);}}});
 M.on('bldTxt',m=>{
  for(const b of SURFBLD)if(b.id===m.id){b.txt=m.txt;b.msg=m.msg;
   if(b._g&&b._g.userData.signCv)drawSign(b._g,m.txt||m.msg||'');}});
 M.on('bcnMsg',m=>{
  for(const b of SURFBLD)if(b.id===m.id){b.msg=m.msg;
   if(b._g&&b._g.userData.signCv)drawSign(b._g,m.msg||'');}});}
netEvents();
function netTear(){
 for(const k in PEERG){if(PEERG[k]&&NETA)NETA.remove(PEERG[k]);peerDispose(PEERG[k]);delete PEERG[k];}
 $('voice').style.display='none';SRFX.prox=false;}
function netConnect(name,pass,url){
 name=(name||'').trim().toUpperCase().slice(0,12);
 if(!name){toast('ENTER A CALLSIGN FIRST');sfx('deny');return false;}
 if(!window.MP){toast('MULTIPLAYER MODULE MISSING — USE THE FULL BUILD');sfx('deny');return false;}
 netEvents();
 if(window.MP.voice&&window.MP.voice.enabled)window.MP.voice.requestMic();   // user gesture = this click
 window.MP.connect(url||'',name,pass||'');
 toast('CONTACTING RELAY…');
 return true;}
function netDisconnect(){
 if(window.MP)window.MP.disconnect();
 NET.on=false;netTear();toast('BAND OFFLINE');}
let NETA=null,PEERG={};
const SRFX={airlock:false,o2:false,prox:false,dock:false,hud:false};
function peerDispose(g){if(!g||!g.traverse)return;
 g.traverse(o=>{
  if(o.geometry&&o.geometry.dispose)o.geometry.dispose();
  if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];
   ms.forEach(m=>{if(m.map&&m.map!==GLOW&&m.map.dispose)m.map.dispose();if(m.dispose)m.dispose();});}});}
function peerShip(name){                                // remote pilot vessel, skinned from their callsign
 const skin=mkSkin(name);
 const g=new THREE.Group();
 const c1=new THREE.Color(skin.suit),c2=new THREE.Color(skin.trim);
 g.add(new THREE.Mesh(new THREE.BoxGeometry(2.6,1,5.4),new THREE.MeshLambertMaterial({color:c1})));
 const fin=new THREE.Mesh(new THREE.BoxGeometry(.3,2,1.6),new THREE.MeshLambertMaterial({color:c2}));fin.position.set(0,1,1.4);g.add(fin);
 const wing=new THREE.Mesh(new THREE.BoxGeometry(6.5,.24,1.8),new THREE.MeshLambertMaterial({color:c2}));wing.position.set(0,-.2,.8);g.add(wing);
 const eng=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7fd4ff,transparent:true,opacity:.9,blending:THREE.AdditiveBlending}));eng.position.set(0,0,3.1);eng.scale.setScalar(2.2);g.add(eng);
 const lab=makeLabel(name,7,1.1,'#9fe8ff');lab.position.y=2.4;g.add(lab);
 const stb=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffffff,transparent:true,opacity:.8,blending:THREE.AdditiveBlending}));stb.position.y=1.6;stb.scale.setScalar(.7);g.add(stb);
 g.userData={name,stb,eng};
 return g;}
function netTick(dt){
 if(!window.MP)return;
 const M=window.MP;
 if(!NET.on)return;
 M.tick(dt,{p:[SP.pos.x,SP.pos.y,SP.pos.z],q:[SP.q.x,SP.q.y,SP.q.z,SP.q.w],sys:FL.sys||'Sol',spd:Math.min(SP.spd||0,1e9),mode:MODE});
 let near=null,nd=1e18;                                // proximity voice + chip (space & surface)
 for(const n in M.peers){
  const b=M.peerLast(n);if(!b)continue;
  const same=b.sys===FL.sys;
  const d=same?Math.hypot(b.p[0]-SP.pos.x,b.p[1]-SP.pos.y,b.p[2]-SP.pos.z):1e18;
  if(M.voice)M.voice.update(n,d,same);
  if(d<nd){nd=d;near=n;}}
 SRFX.prox=!!(near&&nd<3000);
 const vEl=$('voice');
 if(M.voice&&M.voice.state==='on'){
  vEl.style.display='block';
  if(near&&nd<6000)vEl.innerHTML='<b>◉ VOICE</b> · '+near+' · '+(nd*8).toFixed(0)+' km'+(M.voice.muted?' · <span style="color:#ff8a75">MUTED</span>':'');
  else vEl.innerHTML='<b>◉ VOICE</b> · MIC LIVE — NO PILOTS IN RANGE [V]';}
 else if(M.voice&&M.voice.state==='denied'){vEl.style.display='block';vEl.innerHTML='<b>◉ VOICE</b> · MIC BLOCKED — ALLOW IT AND RECONNECT';}
 else vEl.style.display='none';}
function netVisualTick(){
 if(!window.MP)return;
 const M=window.MP;
 if(!NET.on){if(NETA)NETA.visible=false;return;}
 if(!NETA){NETA=new THREE.Group();scene.add(NETA);}
 NETA.visible=MODE==='space';
 if(!NETA.visible)return;
 const tNow=(window.performance&&performance.now)?performance.now():Date.now();
 for(const k in PEERG)if(!M.peers[k]){NETA.remove(PEERG[k]);peerDispose(PEERG[k]);delete PEERG[k];}
 for(const n in M.peers){
  const st=M.peerAt(n,tNow);if(!st)continue;
  let g=PEERG[n];
  if(!g){g=peerShip(n);PEERG[n]=g;NETA.add(g);}
  g.position.set(st.p[0]-SP.pos.x,st.p[1]-SP.pos.y,st.p[2]-SP.pos.z);
  g.quaternion.set(st.q[0],st.q[1],st.q[2],st.q[3]);
  const d=g.position.length();
  g.visible=d<8e8;
  if(g.userData.stb)g.userData.stb.material.opacity=(Math.sin(T.t*4+hashId(n))>0.7)?.9:.06;
  if(g.userData.eng)g.userData.eng.scale.setScalar(1.6+Math.min(3.4,(st.spd||0)*.02));}}
/*------ TRUE HYPER JUMP — warp tunnel ------*/
const WRP={on:false,ph:'',t:0,dur:6.5,sys:null,pay:0,ms:false,label:''};
function buildWarpFX(){if(WRP.streak)return;
 const N=900,pos=new Float32Array(N*3);
 for(let i=0;i<N;i++){const a=Math.random()*6.283,r=18+Math.pow(Math.random(),.5)*240;
  pos[i*3]=Math.cos(a)*r;pos[i*3+1]=Math.sin(a)*r;pos[i*3+2]=(Math.random()*2-1)*2600;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 WRP.streak=new THREE.Points(g,new THREE.PointsMaterial({color:0xbfe0ff,size:2.6,sizeAttenuation:false,transparent:true,opacity:.9,depthWrite:false}));
 WRP.streak.frustumCulled=false;WRP.streak.visible=false;WRP.streak.renderOrder=-8;scene.add(WRP.streak);}
function warpTargetStar(sysKey){return BODY.find(b=>b.sys===sysKey&&b.t==='star'&&!b.par);}
function warpStart(sysKey,label,mothership){
 const st=warpTargetStar(sysKey);
 if(!st){toast('NO CHARTED STAR THERE');sfx('deny');return false;}
 const fromG=SYSTEMS[FL.sys]?SYSTEMS[FL.sys].gal:'orion',toG=SYSTEMS[sysKey].gal;
 if(!mothership){
  if(!POW.amp){H.chg=0;sfx('deny');toast('HYPERDRIVE AMP OFFLINE — OVERHEAD GUARDED SWITCH');return false;}
  if(POW.rea.water<20){H.chg=0;sfx('deny');POW.rea.on=false;POW.rea.scram=20*86400;toast('REACTOR SCRAM — STABILITY TOO LOW. 20 GAME DAYS OR 1 EXOTIC MATTER.',1);sfx('boom');return false;}
  if(fromG!==toG&&INV.exo<1){H.chg=0;sfx('deny');toast('INTERGALACTIC JUMP NEEDS 1 EXOTIC MATTER — CROSSING THE VOID IS NOT FREE',1);return false;}}
 WRP.on=true;WRP.ph='chg';WRP.t=0;WRP.sys=sysKey;WRP.ms=!!mothership;WRP.label=label||'HYPER JUMP';
 WRP.fromG=fromG;WRP.toG=toG;
 H.chg=0;H.on=false;
 SHK.t=2.2;SHK.amp=1.1;sfx('warp');
 const el=$('warp');el.style.display='block';
 el.querySelector('.wt').textContent=WRP.label+' — '+SYSTEMS[sysKey].name;
 toast((mothership?'MOTHERSHIP ':'')+'WARP SEQUENCE INITIATED — '+SYSTEMS[sysKey].name,1);
 return true;}
function warpUpdate(dt){
 WRP.t+=dt;
 const el=$('warp'),ws=el.querySelector('.ws');
 if(WRP.ph==='chg'){
  const k=WRP.t/2.2;
  setLoop('hyp',.1+k*.4,180+k*420);
  if(cam.fov){cam.fov=(SET.fov||72)+k*14;cam.updateProjectionMatrix();}
  ws.textContent='CHARGING WARP COILS '+Math.round(k*100)+'%';
  if(WRP.t>=2.2){
   if(!WRP.ms){POW.rea.water=clamp(POW.rea.water-20,0,100);
    if(WRP.fromG!==WRP.toG){INV.exo=Math.max(0,INV.exo-1);toast('1 EXOTIC MATTER SPENT — PUNCHING BETWEEN GALAXIES',1);}}
   WRP.ph='jump';WRP.t=0;
   const st=warpTargetStar(WRP.sys);
   WRP.pay=st.posU.distanceTo(SP.pos);
   $('fade').style.transition='opacity .22s';$('fade').style.opacity=1;
   sfx('boom');}}
 else if(WRP.ph==='jump'){
  if(WRP.t>=.3){WRP.ph='tunnel';WRP.t=0;WRP.streak.visible=true;
   $('fade').style.opacity=0;}}
 else if(WRP.ph==='tunnel'){
  const k=clamp(WRP.t/WRP.dur,0,1);
  setLoop('hyp',.5,420+k*900);
  ws.textContent='WARP FIELD '+Math.round(k*100)+'% · '+(WRP.ms?'PASSENGER BERTH 12 · ':'')+fmtK(WRP.pay*8*k)+' CROSSED';
  const pa=WRP.streak.geometry.attributes.position;
  for(let i=0;i<pa.count;i++){let z=pa.getZ(i)+dt*(2600+k*9000);if(z>2600)z-=5200;pa.setZ(i,z);}
  pa.needsUpdate=true;
  if(cam.fov){cam.fov=(SET.fov||72)+14-k*10;cam.updateProjectionMatrix();}
  if(WRP.t>=WRP.dur){WRP.ph='arrive';WRP.t=0;
   $('fade').style.transition='opacity .22s';$('fade').style.opacity=1;sfx('warpin');}}
 else if(WRP.ph==='arrive'){
  if(WRP.t>=.3){
   const st=warpTargetStar(WRP.sys);
   const dir=V3(Math.random()-.5,Math.random()*.2-.02,Math.random()-.5).normalize();
   if(WRP.ms){const dst=STATIONS.find(s2=>s2.sys===WRP.sys);
    if(dst)SP.pos.copy(dst.posU).addScaledVector(dir,dst.r*4+30);
    else SP.pos.copy(st.posU).addScaledVector(dir,st.r*US*3.4);}
   else SP.pos.copy(st.posU).addScaledVector(dir,st.r*US*3.4);
   TMM.lookAt(SP.pos,st.posU,V3(0,1,0));SP.q.setFromRotationMatrix(TMM);shipAxes();
   SP.spd=600;SP.thr=0;FL.sys=WRP.sys;
   WRP.on=false;WRP.streak.visible=false;
   el.style.display='none';
   $('fade').style.transition='opacity 2.5s';$('fade').style.opacity=0;
   if(cam.fov){cam.fov=SET.fov||72;cam.updateProjectionMatrix();}
   setLoop('hyp',0);SHK.t=1;SHK.amp=.7;H.cd=20;
   const distLy=WRP.pay*8/9.46e12;
   toast('ARRIVED — '+SYSTEMS[WRP.sys].name+' · '+(distLy>=.1?distLy.toFixed(1)+' LIGHT-YEARS CROSSED':fmtK(WRP.pay*8)+' CROSSED')+(WRP.ms?' · MOTHERSHIP RELEASED THE KESTREL':''),1);
   FL.log.push({t:T.t,m:'WARP ARRIVAL: '+SYSTEMS[WRP.sys].name});
   saveGame(true);}}}
/*------ STATIONS · DOCKING · ECONOMY ------*/
const COMMB={water:2,ice:3,ore:5,metal:14,parts:32,exo:130,food:9};
let DOCKED=null,STKTAB='market';
function stnPrice(st,k){const r=mulberry32(st.seed+hashId(k));const f=.65+r()*.9;return Math.max(1,Math.round(COMMB[k]*f));}
function buildStations(){
 for(const st of STATIONS){
  if(st.grp)continue;
  const g=new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(st.r*.42,st.r*.52,st.r*1.7,10),new THREE.MeshLambertMaterial({color:0x9aa8b5})));
  const hub=new THREE.Mesh(new THREE.SphereGeometry(st.r*.34,12,10),new THREE.MeshLambertMaterial({color:0xc9d4de,emissive:0x223044}));g.add(hub);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(st.r*.95,st.r*.13,10,36),new THREE.MeshLambertMaterial({color:0x7d8a99}));
  ring.rotation.x=Math.PI/2;g.add(ring);g.userData.ring=ring;
  for(let i=0;i<4;i++){const w=new THREE.Mesh(new THREE.BoxGeometry(st.r*2.6,st.r*.05,st.r*.7),new THREE.MeshLambertMaterial({color:0x2a4a8a,emissive:0x0a1830}));
   w.position.set(Math.cos(i*Math.PI/2)*st.r*1.5,0,Math.sin(i*Math.PI/2)*st.r*1.5);w.rotation.y=-i*Math.PI/2;g.add(w);}
  for(let i=0;i<3;i++){const arm=new THREE.Mesh(new THREE.CylinderGeometry(st.r*.05,st.r*.05,st.r*.9,6),new THREE.MeshLambertMaterial({color:0x5a6a78}));
   arm.position.set(Math.cos(i*2.09)*st.r*.62,st.r*.4,Math.sin(i*2.09)*st.r*.62);arm.rotation.z=.6;g.add(arm);}
  const bc=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7dffa8,transparent:true,blending:THREE.AdditiveBlending}));
  bc.position.y=st.r*1.15;bc.scale.setScalar(st.r*.8);g.add(bc);g.userData.bcn=bc;
  const lab=makeLabel(st.name,st.r*2.8,st.r*.36,'#9fd8ff');lab.position.y=st.r*1.6;g.add(lab);
  st.grp=g;UNI.add(g);}}
function stationTick(dt){
 for(const st of STATIONS){
  if(!st.grp)continue;
  const d=SP.pos.distanceTo(st.posU);st.dist=d;
  st.grp.position.copy(st.posU).sub(SP.pos);
  st.grp.visible=MODE==='space'&&d<9e7;
  st.grp.rotation.y+=dt*.12;
  if(st.grp.userData.ring)st.grp.userData.ring.rotation.z+=dt*.3;
  if(st.grp.userData.bcn)st.grp.userData.bcn.material.opacity=.4+.6*Math.abs(Math.sin(T.t*1.4+st.ang));}
 SRFX.dock=!!DOCKED;
 if(MODE!=='space'||TERM||PAUSED||BLDG.on)return;
 let ns=null,nd=1e18;
 for(const st of STATIONS){if(st.sys!==FL.sys)continue;if(st.dist<nd){nd=st.dist;ns=st;}}
 if(!ns||nd>14)return;
 const pr=$('pr');
 if(DOCKED){pr.style.display='block';pr.innerHTML='<b>DOCKED — '+DOCKED.name+'</b> · <b>[T]</b> STATION MENU · <b>[F]</b> UNDOCK';}
 else if(SP.spd<45){pr.style.display='block';pr.innerHTML='<b>'+ns.name+'</b> — RANGE '+nd.toFixed(1)+' u · <b>[F]</b> DOCK';}
 else{pr.style.display='block';pr.innerHTML='<b>'+ns.name+'</b> — SLOW BELOW 45 u/s TO DOCK';}}
function nearestStation(){let best=null,bd=1e18;
 for(const st of STATIONS){if(st.sys!==FL.sys)continue;const d=st.dist!==undefined?st.dist:1e18;if(d<bd){bd=d;best=st;}}
 return best?{st:best,d:bd}:null;}
function tryDock(st){
 if(MODE!=='space'||DOCKED||WRP.on){sfx('deny');return;}
 if(SP.pos.distanceTo(st.posU)>14||SP.spd>60){sfx('deny');toast('TOO FAST OR TOO FAR — SLOW DOWN AND CLOSE IN');return;}
 DOCKED=st;SP.spd=0;SP.thr=0;sfx('dock');SHK.t=.6;SHK.amp=.3;
 toast('DOCKED — '+st.name+' · WELCOME ABOARD, '+ (NET.on?NET.id:'TRAVELER'),1);
 openTerm('station');}
function undockStation(silent){
 if(!DOCKED)return;
 const st=DOCKED;DOCKED=null;
 shipAxes();
 SP.pos.addScaledVector(SP.rt,st.r*3.4+10);
 SP.spd=14;
 if(!silent){sfx('dock');toast('UNDOCKED — CLEAR THE STRUCTURE');}}
function trade(k,n,buy){
 if(!DOCKED)return;
 const p=stnPrice(DOCKED,k);
 if(buy){const c=p*n;if(FL.cr<c){sfx('deny');toast('NOT ENOUGH CREDITS');return;}
  FL.cr-=c;INV[k]=(INV[k]||0)+n;sfx('cash');toast('BOUGHT '+n+' '+k.toUpperCase()+' — '+c+' CR');}
 else{const q=Math.min(n==='all'?Math.floor(INV[k]||0):n,Math.floor(INV[k]||0));
  if(q<1){sfx('deny');return;}
  INV[k]-=q;FL.cr+=p*q;sfx('cash');toast('SOLD '+q+' '+k.toUpperCase()+' — +'+(p*q)+' CR');}
 renderTerm();}
function stationSrv(srv){
 if(!DOCKED)return;
 const pay=c=>{if(FL.cr<c){sfx('deny');toast('NOT ENOUGH CREDITS');return false;}FL.cr-=c;sfx('cash');return true;};
 if(srv==='hull'){if(SYSD.hull>=100){toast('HULL ALREADY SOUND');return;}if(pay(60)){SYSD.hull=100;toast('YARD CREWS — HULL 100%');}}
 else if(srv==='water'){if(pay(30)){POW.rea.water=100;toast('REACTOR TANK FILLED');}}
 else if(srv==='rations'){if(pay(45)){INV.food+=10;toast('10 RATIONS LOADED');}}
 else if(srv==='parts'){if(pay(120)){INV.parts+=5;toast('5 SPARE PARTS LOADED');}}
 renderTerm();}
function fmtMS(at){const s=Math.max(0,Math.floor((at-Date.now())/1000));
 return s>90?Math.floor(s/60)+' min':s+' s';}
function boardMothership(ms){
 if(!DOCKED){sfx('deny');return;}
 if(FL.cr<40){sfx('deny');toast('PASSAGE COSTS 40 CR — SELL SOMETHING FIRST');return;}
 if(!SYSTEMS[ms.to]){sfx('deny');return;}
 FL.cr-=40;
 closeTerm(false);
 DOCKED=null;
 warpStart(ms.to,ms.name,true);}

/*------ CONSTRUCTION — build mode, parts library, signs, permissions ------*/
const BLDG={on:false,part:'wall',rot:0,ghost:null,ok:false,px:0,py:0,pz:0};
const PARTS={
 wall:{n:'WALL',cost:{m:2},cat:'STRUCTURE',solid:1},
 win:{n:'WINDOW WALL',cost:{m:2,p:1},cat:'STRUCTURE',solid:1},
 floor:{n:'PLATFORM',cost:{m:1},cat:'STRUCTURE'},
 stairs:{n:'STAIRS',cost:{m:2},cat:'STRUCTURE'},
 door:{n:'DOOR',cost:{m:2,p:1},cat:'ACCESS',door:1},
 gate:{n:'BIG GATE',cost:{m:4,p:2},cat:'ACCESS',door:1,w:1},
 airlock:{n:'AIRLOCK',cost:{m:5,p:3},cat:'ACCESS',door:1,airlock:1},
 counter:{n:'COUNTER',cost:{m:1},cat:'FURNITURE'},
 table:{n:'TABLE',cost:{m:2},cat:'FURNITURE'},
 chair:{n:'CHAIR',cost:{m:1},cat:'FURNITURE'},
 cot:{n:'COT',cost:{m:2,p:1},cat:'FURNITURE'},
 lamp:{n:'LAMP',cost:{p:1},cat:'SYSTEMS',lamp:1},
 solar:{n:'SOLAR PANEL',cost:{p:2,m:1},cat:'SYSTEMS',solar:1},
 sign:{n:'SIGN',cost:{p:1},cat:'SYSTEMS',sign:1},
 beacon:{n:'BEACON',cost:{p:2,e:1},cat:'SYSTEMS',beacon:1},
 printer:{n:'PART PRINTER',cost:{m:4,p:4},cat:'SYSTEMS',printer:1}};
const SURFBLD=[];let BLD_NL=0,SIGNEDIT=null;
function costStr(c){const p=[];if(c.m)p.push(c.m+' METAL');if(c.p)p.push(c.p+' PARTS');if(c.e)p.push(c.e+' EXO');return p.join(' + ')||'FREE';}
function canAfford(c){return(!c.m||INV.metal>=c.m)&&(!c.p||INV.parts>=c.p)&&(!c.e||INV.exo>=c.e);}
function partMesh(part,b){
 const g=new THREE.Group();
 const mtWall=new THREE.MeshLambertMaterial({color:0x8a97a5});
 const mtTrim=new THREE.MeshLambertMaterial({color:0x5a6a78});
 const mtGlass=new THREE.MeshLambertMaterial({color:0x9fd8ff,transparent:true,opacity:.45});
 const mtAmb=new THREE.MeshLambertMaterial({color:0xc98f4e,emissive:0x352008});
 const box=(w,h,d,m,x,y,z)=>{const mm=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mm.position.set(x,y,z);g.add(mm);return mm;};
 if(part==='wall')box(2,2.4,.18,mtWall,0,1.2,0);
 else if(part==='win'){box(2,2.4,.18,mtWall,0,1.2,0);box(1.6,1.1,.22,mtGlass,0,1.5,0);}
 else if(part==='floor')box(2,.16,2,mtTrim,0,.08,0);
 else if(part==='stairs'){for(let i=0;i<6;i++)box(1.4,.4,.42,mtWall,0,.2+i*.38,-i*.42);}
 else if(part==='door'){box(.16,2.4,.5,mtTrim,-.55,1.2,0);box(.16,2.4,.5,mtTrim,.55,1.2,0);g.userData.slideL=box(.5,2.2,.14,mtWall,-.26,1.15,0);g.userData.slideR=box(.5,2.2,.14,mtWall,.26,1.15,0);box(.9,.16,.5,mtTrim,0,2.42,0);}
 else if(part==='gate'){box(.2,3,.6,mtTrim,-1.2,1.5,0);box(.2,3,.6,mtTrim,1.2,1.5,0);g.userData.slideL=box(1.1,2.8,.16,mtWall,-.58,1.45,0);g.userData.slideR=box(1.1,2.8,.16,mtWall,.58,1.45,0);box(2.4,.2,.6,mtTrim,0,3.05,0);}
 else if(part==='airlock'){box(.2,2.6,2.6,mtTrim,-1,1.3,0);box(.2,2.6,2.6,mtTrim,1,1.3,0);box(2.2,.2,2.6,mtTrim,0,2.65,0);
  g.userData.slideL=box(.5,2.4,.16,mtWall,-.27,1.25,-1.2);g.userData.slideR=box(.5,2.4,.16,mtWall,.27,1.25,-1.2);
  g.userData.slideL2=box(.5,2.4,.16,mtWall,-.27,1.25,1.2);g.userData.slideR2=box(.5,2.4,.16,mtWall,.27,1.25,1.2);}
 else if(part==='counter')box(2,.9,.8,mtWall,0,.45,0);
 else if(part==='table'){box(1.6,.1,1,mtTrim,0,.78,0);box(.12,.78,.12,mtTrim,-.6,.39,-.35);box(.12,.78,.12,mtTrim,.6,.39,-.35);box(.12,.78,.12,mtTrim,-.6,.39,.35);box(.12,.78,.12,mtTrim,.6,.39,.35);}
 else if(part==='chair'){box(.5,.08,.5,mtTrim,0,.48,0);box(.5,.6,.08,mtTrim,0,.86,-.22);box(.08,.48,.08,mtTrim,-.2,.24,-.2);box(.08,.48,.08,mtTrim,.2,.24,-.2);box(.08,.48,.08,mtTrim,-.2,.24,.2);box(.08,.48,.08,mtTrim,.2,.24,.2);}
 else if(part==='cot'){box(.9,.16,2,mtTrim,0,.42,0);box(.9,.12,.5,new THREE.MeshLambertMaterial({color:0x7dffa8}),0,.52,-.6);box(.1,.42,.1,mtTrim,-.38,.21,-.85);box(.1,.42,.1,mtTrim,.38,.21,-.85);box(.1,.42,.1,mtTrim,-.38,.21,.85);box(.1,.42,.1,mtTrim,.38,.21,.85);}
 else if(part==='lamp'){box(.1,2.2,.1,mtTrim,0,1.1,0);const bulb=box(.44,.3,.44,new THREE.MeshLambertMaterial({color:0xc98f4e,emissive:0xffb347,emissiveIntensity:1}),0,2.3,0);
  const li=new THREE.PointLight(0xffd9a0,1.5,14,1.5);li.position.set(0,2.25,0);g.add(li);g.userData.light=li;}
 else if(part==='solar'){box(.14,1.4,.14,mtTrim,0,.7,0);const pn=box(2.4,.08,1.4,new THREE.MeshLambertMaterial({color:0x2a4a8a,emissive:0x0a1830}),0,1.5,0);pn.rotation.x=-.42;}
 else if(part==='sign'){box(1.8,1.1,.1,mtTrim,0,1.5,0);box(.12,1,.12,mtTrim,-.6,.5,0);box(.12,1,.12,mtTrim,.6,.5,0);
  const cv=document.createElement('canvas');cv.width=256;cv.height=160;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1),new THREE.MeshBasicMaterial({map:tx,transparent:true}));
  pl.position.set(0,1.5,.07);g.add(pl);g.userData.signCv=cv;g.userData.signTex=tx;
  drawSign(g,b&&b.txt?b.txt:'');}
 else if(part==='beacon'){box(.14,2.6,.14,mtTrim,0,1.3,0);box(.5,.5,.5,mtAmb,0,2.7,0);box(.05,1.6,.05,mtTrim,0,3.6,0);
  const bc=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0x7dffa8,transparent:true,blending:THREE.AdditiveBlending}));
  bc.position.set(0,4.4,0);bc.scale.setScalar(2.6);g.add(bc);g.userData.bcn=bc;
  g.userData.msg=(b&&b.msg)||'';}
 else if(part==='printer'){box(1.4,1.1,1,mtWall,0,.55,0);box(1,.1,.7,mtTrim,0,1.15,0);box(.3,.5,.3,mtAmb,-.4,1.4,0);}
 /* ---- FIRMWARE 15 power parts ---- */
 else if(part==='battery'){box(.9,1.1,.7,mtTrim,0,.55,0);
  for(let i=0;i<3;i++)box(.7,.16,.5,new THREE.MeshLambertMaterial({color:0x1a2a4a,emissive:0x1a4a8a,emissiveIntensity:.35}),0,.35+i*.3,.36);}
 else if(part==='cable'){box(.12,.12,2,mtTrim,0,.12,-1);box(.12,.12,2,mtTrim,0,.12,1);box(.5,.18,.18,mtAmb,0,.14,0);}
 else if(part==='gen'){box(1.2,.9,.9,mtWall,0,.45,0);box(.4,.5,.4,mtTrim,.4,1.0,0);
  const ex=box(.14,.3,.14,mtAmb,-.45,1.05,0);ex.userData.pwPuff=1;}
 else if(part==='flood'){box(.14,2.6,.14,mtTrim,0,1.3,0);
  const hd=box(.7,.4,.4,new THREE.MeshLambertMaterial({color:0x111111,emissive:0xfff2c0,emissiveIntensity:1.2}),0,2.8,0);hd.rotation.x=-.5;
  const li=new THREE.SpotLight(0xfff2d0,1.6,34,.8,.5,1.3);li.position.set(0,2.7,.2);const tg=new THREE.Object3D();tg.position.set(0,0,6);g.add(tg);li.target=tg;g.add(li);g.userData.light=li;}
 else if(part==='ring'){
  for(let i=0;i<4;i++)box(.5,4.2,.5,mtTrim,Math.sin(i*Math.PI/2)*5.4,2.1,Math.cos(i*Math.PI/2)*5.4);
  const tor=new THREE.Mesh(new THREE.TorusGeometry(6,.55,10,36),
   new THREE.MeshLambertMaterial({color:0x2a3a5a,emissive:0x2a8aff,emissiveIntensity:.9}));
  tor.position.y=4.2;g.add(tor);g.userData.ringGlow=tor;
  box(1.6,1.2,1.2,mtWall,0,.6,5.2);box(.6,.3,.06,new THREE.MeshLambertMaterial({color:0x111111,emissive:0x7dffa8,emissiveIntensity:1}),.4,1.9,5.05);}
 return g;}
function drawSign(g,txt){
 if(!g.userData.signCv)return;
 const cv=g.userData.signCv,x=cv.getContext('2d');
 x.fillStyle='#0a1208';x.fillRect(0,0,256,160);
 x.strokeStyle='#2f6f4f';x.lineWidth=4;x.strokeRect(6,6,244,148);
 x.fillStyle='#7dffa8';x.font='bold 22px Consolas';x.textAlign='center';x.textBaseline='middle';
 const words=(txt||'').slice(0,60).split(' ');let line='',lines=[];
 for(const w of words){if((line+' '+w).trim().length>16){lines.push(line.trim());line=w;}else line+=' '+w;}
 if(line.trim())lines.push(line.trim());lines=lines.slice(0,5);
 lines.forEach((l,i)=>x.fillText(l,128,80+(i-(lines.length-1)/2)*30));
 g.userData.signTex.needsUpdate=true;}
function hitGrp(g,label,prompt,act){
 let s=V3(2.3,2.8,2.3),c=null;
 try{g.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(g);
  s.subVectors(bb.max,bb.min);c=V3().addVectors(bb.max,bb.min).multiplyScalar(.5);}catch(e){c=V3(0,1.3,0);}
 const hb=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05,s.x),Math.max(.05,s.y),Math.max(.05,s.z)),HITMAT);
 const eg=new THREE.LineSegments(new THREE.EdgesGeometry(hb.geometry),EDGEMAT);eg.visible=false;hb.add(eg);
 hb.userData={label,prompt,act,edge:eg};
 g.add(hb);
 try{hb.position.copy(g.worldToLocal(c.clone()));}catch(e){hb.position.set(0,1.3,0);}
 HITS.push(hb);return hb;}
function bldMine(b){return b.owner===NET.id||(b.owner==='YOU'&&!NET.on)||(!NET.on&&(b.owner===FL.netName||!b.owner));}
function wirePartHit(b,g){
 const P=PARTS[b.part];if(!P)return;
 const mine=bldMine(b);
 if(P.door)b._hit=hitGrp(g,'AUTO DOOR',mine?'AUTO — WALK UP':'LOCKED',()=>{if(!mine){sfx('deny');toast('LOCKED — BUILT BY '+(b.owner||'?'));}else toast('AUTOMATIC — JUST WALK THROUGH');});
 else if(P.sign)b._hit=hitGrp(g,'SIGN',mine?'EDIT TEXT':'READ',()=>{if(!mine){toast('SIGN READS: "'+(b.txt||'…')+'"');return;}SIGNEDIT=b;openTerm('sign');});
 else if(P.beacon)b._hit=hitGrp(g,'BEACON',mine?'SET MESSAGE':'READ',()=>{if(!mine){toast('BEACON: '+(b.msg||'…'));return;}SIGNEDIT=b;openTerm('sign');});
 else if(P.printer)b._hit=hitGrp(g,'PART PRINTER',mine?'PRINT PART (4 METAL)':'LOCKED',()=>{if(!mine){sfx('deny');toast('LOCKED — BUILT BY '+(b.owner||'?'));return;}
  if(INV.metal<4){sfx('deny');toast('NEED 4 METAL');return;}
  INV.metal-=4;FABQ.push({n:'PRINTING PART',t:0});sfx('beep');toast('PART PRINTING — CHECK REFINERY QUEUE');});
 else if(P.lamp)b._hit=hitGrp(g,'LAMP','TOGGLE',()=>{if(g.userData.light){g.userData.light.visible=!g.userData.light.visible;sfx('sw');}});
 else if(P.solar)b._hit=hitGrp(g,'SOLAR PANEL','STATUS',()=>{toast('SOLAR OUTPUT '+(MODE==='surface'&&LF.dayF>.3?Math.round(LF.dayF*100)+'%':'0% — NO SUN'));});
 b._mine=mine;}
function surfSpawn(b){
 const g=partMesh(b.part,b);
 /* FIRMWARE 15: builds live in planet-geo coordinates (unit dir + alt) */
 if(b.p&&b.p.length>=4){
  b._dir=V3(b.p[0],b.p[1],b.p[2]).normalize();
  b._alt=b.p[3]||0;
  g.position.copy(sur2ENU(b._dir,b._alt,new THREE.Vector3()));
  const dirW=b._dir.clone().applyAxisAngle(V3(0,1,0),SURF2.th);
  sur2BasisQAt(dirW,TMQ);
  g.quaternion.copy(TMQ);g.rotateY(b.ry||0);}
 else if(b.p){ /* legacy v12 ENU save — snap to the new terrain */
  b._dir=sur2DirAt(b.p[0],b.p[2],new THREE.Vector3()).clone();
  b._alt=0;
  g.position.set(b.p[0],SURF2.groundY(b.p[0],b.p[2]),b.p[2]);
  g.rotation.y=b.ry||0;}
 else{b._dir=SURF2.anchor.clone();b._alt=0;}
 b._flath=sur2HBase(b._dir);
 SURFG.add(g);b._g=g;
 wirePartHit(b,g);
 if(PARTS[b.part].lamp)BLD_NL++;
 SURFBLD.push(b);}
function spawnSurfBuilds(){
 clearSurfBuilds();
 if(!LAND)return;
 const seen={};
 for(const b of FL.builds){
  if(b.mode!=='surface'||b.body!==LAND.b||!PARTS[b.part])continue;
  seen[b.id]=1;surfSpawn(b);}
 if(NET.on&&NET.world)for(const b of NET.world.builds){   // other pilots' bases, server-persisted
  if(seen[b.id]||b.mode!=='surface'||b.body!==LAND.b||!PARTS[b.part])continue;
  surfSpawn(b);}
 sur2Flats();}
function clearSurfBuilds(){
 for(const b of SURFBLD){
  if(b._g){SURFG.remove(b._g);b._g=null;}
  if(b._hit){const i=HITS.indexOf(b._hit);if(i>=0)HITS.splice(i,1);b._hit=null;}}
 SURFBLD.length=0;BLD_NL=0;}
function bldToggle(){
 if(MODE!=='surface'||PL.seated||PL.mode==='rover'){sfx('deny');toast('BUILD MODE WORKS ON FOOT, ON A SURFACE');return;}
 BLDG.on=!BLDG.on;sfx('click');
 $('bld').style.display=BLDG.on?'block':'none';
 if(BLDG.on){bldPanel();bldGhostMake();toast('BUILD MODE — LMB PLACE · R ROTATE · X DEMOLISH · B EXIT',1);}
 else{if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}}}
function bldPanel(){
 let h='<div class="brow">';
 const cats={};for(const k in PARTS)(cats[PARTS[k].cat]=cats[PARTS[k].cat]||[]).push(k);
 for(const c in cats){h+='<span id="gcat">'+c+'</span>';
  for(const k of cats[c]){const P=PARTS[k];
   h+='<span class="bslot'+(BLDG.part===k?' on':'')+(canAfford(P.cost)?'':' dis')+'" data-bp="'+k+'">'+P.n+'<br><span style="color:#7d8a7a;font-size:9px">'+costStr(P.cost)+'</span></span>';}}
 h+='</div><div class="bhint">METAL '+Math.floor(INV.metal)+' · PARTS '+Math.floor(INV.parts)+' · EXO '+Math.floor(INV.exo)+' — LMB PLACE · R ROTATE · X DEMOLISH (50% REFUND) · B EXIT</div>';
 $('bld').innerHTML=h;
 $('bld').querySelectorAll('[data-bp]').forEach(el=>el.onclick=()=>{BLDG.part=el.dataset.bp;sfx('click');bldPanel();bldGhostMake();});}
function bldGhostMake(){
 if(BLDG.ghost){scene.remove(BLDG.ghost);BLDG.ghost=null;}
 const g=partMesh(BLDG.part,null);
 g.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.42;}if(o.isLight)o.visible=false;});
 BLDG.ghost=g;scene.add(g);}
function bldGhostTick(){
 if(!BLDG.ghost||!TER)return;
 const dir=TMP3.set(0,0,-1).applyQuaternion(cam.quaternion);
 let bx=0,by=0,bz=0,found=false;
 for(let d=2.5;d<55;d+=1.1){
  const px=cam.position.x+dir.x*d,py=cam.position.y+dir.y*d,pz=cam.position.z+dir.z*d;
  if(py<=TER.h(px,pz)+1.1){bx=Math.round(px*2)/2;bz=Math.round(pz*2)/2;by=TER.h(bx,bz);found=true;break;}}
 if(!found){BLDG.ghost.visible=false;BLDG.ok=false;return;}
 const ok=canAfford(PARTS[BLDG.part].cost)&&!(PARTS[BLDG.part].lamp&&BLD_NL>=6);
 BLDG.ok=ok;BLDG.px=bx;BLDG.py=by;BLDG.pz=bz;
 BLDG.ghost.visible=true;
 BLDG.ghost.position.set(bx,by,bz);BLDG.ghost.rotation.y=BLDG.rot;
 BLDG.ghost.traverse(o=>{if(o.material&&o.material.color)o.material.color.setHex(ok?0x7dffa8:0xff5a5a);});}
function bldPlace(){
 if(!BLDG.on||!BLDG.ok){sfx('deny');return;}
 const P=PARTS[BLDG.part];
 if(!canAfford(P.cost)){sfx('deny');toast('INSUFFICIENT MATERIALS');bldPanel();return;}
 if(P.lamp&&BLD_NL>=6){sfx('deny');toast('LAMP LIMIT REACHED (6) — POWER BUDGET');return;}
 INV.metal-=P.cost.m||0;INV.parts-=P.cost.p||0;INV.exo-=P.cost.e||0;
 const dir=sur2DirAt(BLDG.px,BLDG.pz,new THREE.Vector3()).clone();
 const b={id:'b'+Date.now().toString(36)+Math.floor(Math.random()*99),part:BLDG.part,mode:'surface',body:LAND.b,
  p:[dir.x,dir.y,dir.z,0],ry:BLDG.rot,owner:NET.on?NET.id:(FL.netName||'YOU'),txt:'',msg:'',t:Date.now()};
 FL.builds.push(b);
 surfSpawn(b);
 sur2Flats();
 if(NET.on&&window.MP)window.MP.bldPlace({id:b.id,part:b.part,mode:'surface',body:b.body,p:b.p,ry:b.ry,txt:'',msg:''});
 sfx('build');bldPanel();saveGame(true);}
function bldDemolish(){
 if(!BLDG.on)return;
 let best=null,bd=1e9;
 for(const b of SURFBLD){if(!b._g||!b._mine)continue;
  const d=b._g.position.distanceTo(PL.pos);if(d<bd){bd=d;best=b;}}
 if(!best||bd>7){sfx('deny');toast('NO OWN STRUCTURE IN REACH (7 m)');return;}
 const P=PARTS[best.part];
 INV.metal+=Math.floor((P.cost.m||0)*.5);INV.parts+=Math.floor((P.cost.p||0)*.5);INV.exo+=Math.floor((P.cost.e||0)*.5);
 if(P.lamp)BLD_NL--;
 if(best._hit){const i=HITS.indexOf(best._hit);if(i>=0)HITS.splice(i,1);}
 if(best._g)SURFG.remove(best._g);
 const j=FL.builds.indexOf(best);if(j>=0)FL.builds.splice(j,1);
 const k=SURFBLD.indexOf(best);if(k>=0)SURFBLD.splice(k,1);
 sur2Flats();
 if(NET.on&&window.MP)window.MP.bldDel(best.id);
 sfx('build');toast(P.n+' DEMOLISHED — 50% REFUND');bldPanel();saveGame(true);}
function bldTick(dt){
 if(BLDG.on&&BLDG.ghost)bldGhostTick();
 for(const b of SURFBLD){
  if(!b._g)continue;const P=PARTS[b.part],g=b._g;
  if(P.door){
   const near=g.position.distanceTo(PL.pos)<(P.w?3.6:2.8);
   g.userData.dop=lerp(g.userData.dop||0,near?1:0,Math.min(1,dt*3.5));
   const o=g.userData.dop,W=P.w?1.14:.78;
   if(g.userData.slideL)g.userData.slideL.position.x=-.26-W*o;
   if(g.userData.slideR)g.userData.slideR.position.x=.26+W*o;
   if(g.userData.slideL2)g.userData.slideL2.position.x=-.27-W*o;
   if(g.userData.slideR2)g.userData.slideR2.position.x=.27+W*o;}
  else if(P.solar){if(MODE==='surface'&&LF.dayF>.3&&pwr('main'))POW.batt=clamp(POW.batt+dt*.4,0,100);}
  else if(P.beacon&&g.userData.bcn)g.userData.bcn.material.opacity=.5+.5*Math.sin(T.t*3+hashId(b.id));}}
/*------ deep-space builds ------*/
const SBG=new THREE.Group();scene.add(SBG);
function spaceBuildList(){
 const out=[],seen={};
 for(const b of FL.builds)if(b.mode==='space'&&PARTS[b.part]){out.push(b);seen[b.id]=1;}
 if(NET.on&&NET.world)for(const b of NET.world.beacons){if(!seen[b.id])out.push(b);}
 return out;}
function spaceBuildTick(){
 SBG.visible=MODE==='space';
 if(MODE!=='space')return;
 for(const b of spaceBuildList()){
  if(!b._g){b._g=partMesh(b.part||'beacon',b);SBG.add(b._g);
   if(PARTS[b.part||'beacon']&&(PARTS[b.part||'beacon'].sign||PARTS[b.part||'beacon'].beacon)){
    const mine=bldMine(b)||(b.who&&b.who===NET.id);
    hitGrp(b._g,PARTS[b.part||'beacon'].beacon?'BEACON':'SIGN',mine?'SET MESSAGE':'READ',()=>{toast((b.who||b.owner||'UNKNOWN')+' — "'+(b.msg||b.txt||'…')+'"');sfx('radio');});}}
  if(b._g){b._g.position.set(b.posU[0]-SP.pos.x,b.posU[1]-SP.pos.y,b.posU[2]-SP.pos.z);
   const d=b._g.position.length();b._g.visible=d<2e6;}}}
function deploySpace(part){
 if(MODE!=='space'){sfx('deny');toast('DEPLOY ONLY IN OPEN SPACE');return;}
 const P=PARTS[part];
 if(!canAfford(P.cost)){sfx('deny');toast('INSUFFICIENT MATERIALS');return;}
 shipAxes();
 const off=90+FL.builds.filter(b=>b.mode==='space').length*26;
 const jx=(Math.random()*2-1)*30,jy=(Math.random()*2-1)*12;
 const px=SP.pos.x+SP.fwd.x*off+SP.rt.x*jx,py=SP.pos.y+SP.fwd.y*off+SP.rt.y*jy,pz=SP.pos.z+SP.fwd.z*off+SP.rt.z*jy;
 INV.metal-=P.cost.m||0;INV.parts-=P.cost.p||0;INV.exo-=P.cost.e||0;
 const b={id:'s'+Date.now().toString(36),part,mode:'space',posU:[px,py,pz],ry:Math.random()*6.28,owner:NET.on?NET.id:(FL.netName||'YOU'),txt:'',msg:'',t:Date.now()};
 FL.builds.push(b);sfx('build');toast(P.n+' DEPLOYED OFF THE BOW — IT STAYS HERE FOREVER');
 saveGame(true);
 if(NET.on&&window.MP)window.MP.beaconPlace(b.id,part,[px,py,pz],'');}
/*------ radio beacons in range ------*/
const RADIOH={};let RADIOT=0;
function radioTick(dt){
 RADIOT+=dt;if(RADIOT<.5)return;RADIOT=0;
 const near=[];
 if(MODE==='space'){
  for(const b of spaceBuildList()){
   const p=b.posU;if(!p)continue;
   const d=Math.hypot(p[0]-SP.pos.x,p[1]-SP.pos.y,p[2]-SP.pos.z);
   if(d<2500&&(b.msg||b.txt))near.push({who:b.who||b.owner||'UNKNOWN',msg:b.msg||b.txt,d:d*8});}}
 else{
  for(const b of SURFBLD){if(!PARTS[b.part].beacon||!b.msg||!b._g)continue;
   const d=b._g.position.distanceTo(PL.pos);
   if(d<650)near.push({who:b.owner,msg:b.msg,d:d});}}
 const el=$('radio');
 if(near.length){near.sort((a,b2)=>a.d-b2.d);const n=near[0];
  el.style.display='block';
  el.innerHTML='<b>◉ RADIO — '+Math.round(n.d)+' km</b> · '+n.who+': "'+String(n.msg).slice(0,60)+'"';
  if(!RADIOH[n.who+n.msg]){RADIOH[n.who+n.msg]=1;sfx('squelch');}}
 else el.style.display='none';}
/*------ life support: per-compartment O2 · wiring · alarms ------*/
function zoneOf(z){return z<-3.5?'coc':z<4.5?'liv':z<10.5?'eng':'gar';}
const ZNAMES={coc:'COCKPIT',liv:'LIVING',eng:'ENGINEERING',gar:'GARAGE'};
function airlockOpenToVac(){
 if(MODE==='space')return rampOpen();
 if(MODE==='surface'&&LF.body&&(LF.body.at||0)<25)return rampOpen();
 return false;}
function o2Sim(dt){
 if(!FL.o2)return;
 SRFX.airlock=airlockOpenToVac();
 if(SRFX.airlock){
  FL.o2.gar=clamp(FL.o2.gar-dt*7,0,100);
  if(!doorOpenAt(10.5)){FL.o2.eng=clamp(FL.o2.eng-dt*2.5,0,100);FL.o2.liv=clamp(FL.o2.liv-dt*1.5,0,100);FL.o2.coc=clamp(FL.o2.coc-dt*1,0,100);}}
 const avg=(FL.o2.coc+FL.o2.liv+FL.o2.eng+FL.o2.gar)/4;
 const mix=Math.min(1,dt*.6);
 FL.o2.coc=lerp(FL.o2.coc,avg,mix);FL.o2.liv=lerp(FL.o2.liv,avg,mix);
 FL.o2.eng=lerp(FL.o2.eng,avg,mix);FL.o2.gar=lerp(FL.o2.gar,avg,mix);
 if(pwr('life')&&SYSD.lif>20){const r=dt*1.1*(FL.alloc?FL.alloc.life:1);
  FL.o2.coc=clamp(FL.o2.coc+r,0,100);FL.o2.liv=clamp(FL.o2.liv+r,0,100);
  FL.o2.eng=clamp(FL.o2.eng+r,0,100);FL.o2.gar=clamp(FL.o2.gar+r,0,100);}
 SRFX.o2=(FL.o2.coc<40||FL.o2.liv<40||FL.o2.eng<40||FL.o2.gar<40);
 if(PL.inside){VIT.cab=FL.o2[zoneOf(PL.pos.z)];
  if(VIT.cab>40)VIT.suit=clamp(VIT.suit+dt*5,0,100);}}
function wireHas(s,d){return (FL.wire||[]).some(w=>w.s===s&&w.d===d);}
const WSRCS=[['airlock','AIRLOCK OPEN'],['o2','O2 LOW'],['prox','PILOT PROXIMITY'],['dock','DOCKED/UNDOCKED']];
const WSNKS=[['lights','ALARM LIGHTS'],['siren','SIREN'],['hud','HUD WARNING'],['floods','EXT FLOODS']];
let ALARM={on:false};
function alarmTick(){
 const alarm=(SRFX.o2&&wireHas('o2','lights'))||(SRFX.airlock&&wireHas('airlock','lights'))||(SRFX.prox&&wireHas('prox','lights'));
 const siren=(SRFX.o2&&wireHas('o2','siren'))||(SRFX.airlock&&wireHas('airlock','siren'))||(SRFX.dock&&wireHas('dock','siren'));
 SRFX.hud=(SRFX.o2&&wireHas('o2','hud'))||(SRFX.airlock&&wireHas('airlock','hud'));
 setLoop('siren',siren?.3:0);
 ALARM.on=alarm||siren;
 const t=performance.now()*.007;
 for(const L of LIGHTS){
  if(L.userData.baseC===undefined)L.userData.baseC=L.color.clone();
  if(alarm){L.visible=true;L.intensity=(Math.sin(t)>0)?1.5:.15;L.color.setHex(0xff3020);}
  else L.color.copy(L.userData.baseC);}}
/*------ new terminal renders ------*/
function renderStation(b){
 if(!DOCKED){b.innerHTML='<div class="dim">NOT DOOCKED.</div>';return;}
 let h='<div class="row"><span class="tab'+(STKTAB==='market'?' on':'')+'" data-stk="market">MARKET</span><span class="tab'+(STKTAB==='serv'?' on':'')+'" data-stk="serv">SERVICES</span><span class="tab'+(STKTAB==='mom'?' on':'')+'" data-stk="mom">MOTHERSHIP</span></div>';
 h+='<div class="amb">DOCKED — '+DOCKED.name+' · CREDITS <b>'+Math.round(FL.cr)+' CR</b> · '+(NET.on?'BAND ONLINE — '+netCount()+' PILOTS':'LOCAL BAND')+'</div>';
 if(STKTAB==='market'){
  h+='<table><tr><th>COMMODITY</th><th>HOLD</th><th>PRICE</th><th>BUY</th><th>SELL</th></tr>';
  for(const k in COMMB){const p=stnPrice(DOCKED,k);
   h+='<tr><td>'+k.toUpperCase()+'</td><td>'+Math.floor(INV[k]||0)+'</td><td>'+p+' CR</td>'
    +'<td><button class="btn" data-buy="'+k+'">×1</button> <button class="btn" data-buy5="'+k+'">×5</button></td>'
    +'<td><button class="btn" data-sell="'+k+'">×1</button> <button class="btn" data-sell5="'+k+'">×5</button> <button class="btn" data-sella="'+k+'">ALL</button></td></tr>';}
  h+='</table><div class="dim">PRICES VARY BY STATION — MINE WHERE IT\'S CHEAP, SELL WHERE IT\'S RICH.</div>';}
 else if(STKTAB==='serv'){
  h+='<div class="row"><button class="btn" data-srv="hull">REPAIR HULL — 60 CR</button><button class="btn" data-srv="water">FILL REACTOR TANK — 30 CR</button></div>';
  h+='<div class="row"><button class="btn" data-srv="rations">BUY 10 RATIONS — 45 CR</button><button class="btn" data-srv="parts">BUY 5 PARTS — 120 CR</button></div>';
  h+='<div class="dim">CREDITS EARNED: SELL ORE, METAL, EXOTIC MATTER AT THE MARKET TAB.</div>';}
 else{
  const moms=NET.on&&NET.world?NET.world.mothers:[];
  h+='<h3>MOTHERSHIP DEPARTURES</h3><table><tr><th>VESSEL</th><th>ROUTE</th><th>DEPARTS</th><th></th></tr>';
  if(moms.length)for(const ms of moms)
   h+='<tr><td>'+ms.name+'</td><td>'+SYSTEMS[ms.from].name+' → '+SYSTEMS[ms.to].name+'</td><td>'+fmtMS(ms.at)+'</td><td><button class="btn" data-mom="'+ms.name+'">BOARD (40 CR)</button></td></tr>';
  else h+='<tr><td colspan="4" class="dim">CONNECT TO THE GLOBAL BAND (MAIN MENU ▸ MULTIPLAYER) TO SEE SCHEDULES.</td></tr>';
  h+='</table><div class="dim">MOTHERSHIPS FERRY SHIPS WITHOUT HYPERDRIVES ACROSS THE UNIVERSE — NO EXOTIC MATTER NEEDED.</div>';}
 h+='<div class="row"><button class="btn" id="undockb">UNDOCK — [F]</button></div>';
 b.innerHTML=h;
 b.querySelectorAll('[data-stk]').forEach(t=>t.onclick=()=>{STKTAB=t.dataset.stk;sfx('click');renderTerm();});
 b.querySelectorAll('[data-buy]').forEach(x=>x.onclick=()=>trade(x.dataset.buy,1,true));
 b.querySelectorAll('[data-buy5]').forEach(x=>x.onclick=()=>trade(x.dataset.buy5,5,true));
 b.querySelectorAll('[data-sell]').forEach(x=>x.onclick=()=>trade(x.dataset.sell,1,false));
 b.querySelectorAll('[data-sell5]').forEach(x=>x.onclick=()=>trade(x.dataset.sell5,5,false));
 b.querySelectorAll('[data-sella]').forEach(x=>x.onclick=()=>trade(x.dataset.sella,'all',false));
 b.querySelectorAll('[data-srv]').forEach(x=>x.onclick=()=>stationSrv(x.dataset.srv));
 b.querySelectorAll('[data-mom]').forEach(x=>x.onclick=()=>{const ms=(NET.world.mothers||[]).find(m=>m.name===x.dataset.mom);if(ms)boardMothership(ms);});
 $('undockb').onclick=()=>{undockStation();closeTerm();};}
function fillNetPanel(){
 netEvents();
 const p=$('netp'),MP=window.MP;
 let h='<div class="inner"><h2>GLOBAL BAND</h2>';
 const st=MP?MP.status:'off';
 if(NET.on&&MP)h+='<div class="grn">ONLINE — '+NET.id+' · '+netCount()+' PILOTS IN THE BLACK · RTT '+(MP.rtt==null?'—':MP.rtt+' ms')+'<br>ONE SHARED UNIVERSE — BASES, SIGNS &amp; BEACONS PERSIST FOR EVERYONE</div>';
 else if(MP&&st==='connecting')h+='<div class="amb">CONTACTING RELAY…</div>';
 else if(MP&&st==='lost')h+='<div class="red">LINK LOST — RECONNECTING…</div>';
 else if(MP&&st==='error')h+='<div class="red">'+(MP.lastErr||'CONNECTION FAILED')+'</div>';
 else h+='<div class="dim">OFFLINE — SINGLE PILOT. REGISTER A CALLSIGN TO JOIN THE LIVE BAND.</div>';
 h+='<div class="row"><input type="text" id="nurl" style="flex:1" placeholder="SERVER (BLANK = THIS HOST)" value="'+(MP?String(MP.server).replace(/^wss?:\/\//i,'').replace(/\/ws$/,''):'')+'"></div>';
 h+='<div class="row"><input type="text" id="ncall" maxlength="12" placeholder="CALLSIGN" style="flex:1" value="'+(NET.id||FL.netName||'')+'">'
  +'<input type="password" id="npass" maxlength="24" placeholder="PASSWORD (OPTIONAL)" style="flex:1"></div>';
 h+='<div class="row" style="align-items:flex-start;gap:14px"><canvas id="skinpv" width="120" height="160"></canvas>'
  +'<div class="dim" style="flex:1">YOUR SKIN IS GROWN FROM YOUR CALLSIGN — NO TWO PILOTS MATCH. REAL PILOTS FLY, CHAT, TALK AND BUILD ON ONE SHARED SERVER. PROXIMITY VOICE AWAKENS WHEN SHIPS PASS WITHIN 48,000 KM · [V] MUTES YOUR MIC.</div></div>';
 h+='<div class="row"><button class="mbtn" id="ncon">'+(NET.on?'RECONNECT':'CONNECT')+'</button>'
  +(NET.on?'<button class="mbtn" id="ndisc">DISCONNECT</button>':'')
  +'<button class="mbtn" id="nmic">MIC: '+(MP&&MP.voice&&MP.voice.state==='on'?'LIVE':'OFF')+'</button>'
  +'<button class="mbtn" id="nclose">CLOSE</button></div>';
 if(NET.on&&MP&&MP.roster&&MP.roster.length){
  h+='<h3 style="color:#7dffa8;letter-spacing:2px;margin:4px 0">PILOTS ONLINE ('+MP.roster.length+')</h3><div style="max-height:110px;overflow-y:auto">';
  for(const r of MP.roster)h+='<div class="dim">◆ '+r.n+' — '+(SYSTEMS[r.sys]?SYSTEMS[r.sys].name:r.sys)+(r.n===NET.id?' · YOU':'')+'</div>';
  h+='</div>';}
 h+='<div class="dim">'+(NET.on?'GLOBAL CHAT: COMMS TERMINAL [M] · PROXIMITY VOICE AUTOMATIC · MOTHERSHIP SCHEDULES AT ANY STATION':'RUN THE SERVER (npm start), CONNECT, AND FRIENDS JOIN THE SAME UNIVERSE FROM THE SAME NETWORK — OR ANYWHERE, IF YOU HOST IT.')+'</div></div>';
 p.innerHTML=h;
 const pv=$('skinpv');
 const upd=()=>{try{drawSkin(pv,mkSkin(($('ncall').value||'PILOT').toUpperCase()));}catch(e){}};
 $('ncall').oninput=upd;upd();
 $('ncon').onclick=()=>{netConnect($('ncall').value,$('npass').value,$('nurl').value);fillNetPanel();};
 if($('ndisc'))$('ndisc').onclick=()=>{netDisconnect();fillNetPanel();};
 if($('nmic'))$('nmic').onclick=()=>{const V=MP&&MP.voice;if(!V)return;
  V.setEnabled(V.state!=='on');
  if(V.state==='requesting')V.requestMic().then(()=>{if($('netp').style.display==='flex')fillNetPanel();});
  fillNetPanel();};
 $('nclose').onclick=()=>{p.style.display='none';
  if(PAUSED){try{const pl=renderer.domElement.requestPointerLock();if(pl&&pl.catch)pl.catch(()=>{});}catch(_){}}};}
function renderSign(b){
 const isB=!!SIGNEDIT;
 let h='<h3>'+(isB?(PARTS[SIGNEDIT.part]&&PARTS[SIGNEDIT.part].beacon?'BEACON BROADCAST':'SIGN EDITOR'):'SIGN')+'</h3>';
 h+='<div class="row"><input type="text" id="sgin" maxlength="60" style="flex:1" value="'+(isB?String(SIGNEDIT.txt||SIGNEDIT.msg||'').replace(/"/g,'&quot;'):'')+'" placeholder="YOUR WORDS, PERSISTING FOREVER"></div>';
 h+='<div class="row"><button class="btn" id="sgok">TRANSMIT — SAVE FOREVER</button></div>';
 h+='<div class="dim">CREATOR TEXT PERSISTS ON THE SERVER. BEACONS BROADCAST TO ANYONE WITHIN RADIO RANGE.</div>';
 b.innerHTML=h;
 $('sgok').onclick=()=>{
  const v=$('sgin').value.trim().slice(0,60);
  if(!isB)return;
  if(PARTS[SIGNEDIT.part]&&PARTS[SIGNEDIT.part].beacon)SIGNEDIT.msg=v;else SIGNEDIT.txt=v;
  if(SIGNEDIT._g&&SIGNEDIT._g.userData.signCv)drawSign(SIGNEDIT._g,v);
  if(NET.on&&window.MP)window.MP.bldTxt(SIGNEDIT.id,SIGNEDIT.txt||'',SIGNEDIT.msg||'');
  saveGame(true);sfx('radio');toast('TRANSMITTED — SAVED TO THE WORLD');closeTerm();};}

/*==================== PART 8 — SIM, HUD, INTRO, BOOT, LOOP ====================*/
function powerSim(dt,gdt){
 if(POW.rea.on){
  POW.rea.water=clamp(POW.rea.water-gdt*(100/86400),0,100);
  if(POW.rea.water<=0){POW.rea.on=false;POW.rea.scram=20*86400;toast('REACTOR SCRAM — COOLANT EXHAUSTED',1);sfx('boom');}
  POW.batt=clamp(POW.batt+dt*1.4,0,100);}
 if(POW.rea.scram>0)POW.rea.scram=Math.max(0,POW.rea.scram-gdt);
 let load=0;
 if(POW.brk.life)load+=.09;if(POW.brk.nav)load+=.035;if(POW.brk.lit)load+=.045;
 load+=.3*SP.thr;
 if(!POW.rea.on)POW.batt=clamp(POW.batt-load*dt,0,100);
 const pp=pwr('main');
 for(const L of LIGHTS){
  if(L.userData.emerg){L.intensity=pp?0:.55;L.visible=!pp;continue;}
  L.intensity=(pp&&POW.brk.lit)?2.3:(pp?.2:0);L.visible=L.intensity>.01;}
 if(ENSTRIP)ENSTRIP.emissiveIntensity=(pp&&POW.brk.lit)?1.5:.05;
 if(SHIPG.userData.winMats)for(const m of SHIPG.userData.winMats)m.emissiveIntensity=(pp&&POW.brk.lit)?1.15:.12;
 if(SHIPG.userData.extL){SHIPG.userData.extL.intensity=(SRF.extL&&MODE==='surface'&&pp)?3.2:0;SHIPG.userData.extL.visible=SHIPG.userData.extL.intensity>.01;}
 if(REACORE){REACORE.material.emissiveIntensity=POW.rea.on?(1.1+.4*Math.sin(T.t*3)):.04;
  REACORE.material.emissive.setHex(POW.rea.on?(POW.rea.water<25?0xff5030:0x44ffbb):0x221111);}
 setLoop('rea',POW.rea.on?.13:0);}
function survivalSim(dt,gdt){
 if(!PL.inside||!FL.o2){
  if(pwr('life')&&SYSD.lif>20){VIT.cab=clamp(VIT.cab+dt*6,0,100);if(PL.inside)VIT.suit=clamp(VIT.suit+dt*5,0,100);}
  else VIT.cab=clamp(VIT.cab-gdt*.03,0,100);}
 if(VIT.cab<=0&&PL.inside)hurt(dt*.5,'CABIN OXYGEN DEPLETED — LIFE SUPPORT OFFLINE');
 VIT.hun=clamp(VIT.hun-gdt*(100/(3*86400)),0,100);
 VIT.thi=clamp(VIT.thi-gdt*(100/(2*86400)),0,100);
 if(VIT.hun<=0)hurt(dt*.2,'STARVATION');
 if(VIT.thi<=0)hurt(dt*.3,'DEHYDRATION');
 if(!POW.heat&&MODE==='surface'&&LF.temp<-20&&PL.inside)hurt(dt*.12,'CABIN FREEZING — HEAT OFFLINE');
 if(VIT.hp<100&&VIT.hun>25&&VIT.thi>25&&VIT.suit>0&&(PL.inside||MODE==='space'))VIT.hp=clamp(VIT.hp+dt*.8,0,100);}
function audioTick(){
 if(!AU.on)return;
 setLoop('wind',MODE==='surface'&&!PL.inside?(SRF.wind||0)*.5:(MODE==='surface'?.08:0));
 const almw=(POW.rea.scram>0)||(SYSD.hull<25)||VIT.hp<25;
 setLoop('alm',almw?(Math.sin(performance.now()*.008)>0?.35:0):0);
 if(VIT.hp<25&&performance.now()-(SRF.beat||0)>760){SRF.beat=performance.now();sfx('thud');}}
/*--------- HUD ---------*/
let hudAcc=0;
function bar(v,c){return '<div class="bl">'+c+'</div><div class="bar"><i style="width:'+clamp(v,0,100)+'%;background:'+(v>50?'#7dffa8':v>25?'#ffb347':'#ff5a5a')+'"></i></div>';}
function hudUpdate(){
 const st=$('clk');
 if(MODE==='surface'){
  const lh=Math.floor(LF.lst),lm=Math.floor(LF.lst%1*60);
  st.textContent='SHIP TIME '+fmtT(T.t)+'\n'+LF.body.name.toUpperCase()+' · LOCAL SOLAR '+('0'+lh).slice(-2)+':'+('0'+lm).slice(-2)+'\nEXT '+(PL.inside?'21':LF.temp.toFixed(0))+'°C · GRAV '+LF.body.g+' g · CR '+Math.round(FL.cr)+(NET.on?' · ◉ BAND ('+netCount()+')':'');
 }else{
  let nb=null,nd=1e18;
  for(const b of BODY){if(b.t==='star')continue;if(b.id==='earth'&&FLG.earthGone)continue;const d=SP.pos.distanceTo(b.posU)-b.r*US;if(d<nd&&d>-b.r*US){nd=d;nb=b;}}
  let hs='SHIP TIME '+fmtT(T.t)+'\n'+SYSTEMS[FL.sys].name+(nb?'\nNEAREST: '+nb.name+' — ALT '+fmtK(Math.max(0,nd*8)):'');
  if(FLG.earthGone&&DEB&&DEB.on){const eb=bodyById('earth'),er=eb.r*US*2.4*DEB.grp.scale.x,ed=SP.pos.distanceTo(DEB.posU);
   hs+='\nDEBRIS FIELD '+(ed<er?'— INSIDE':'RANGE '+fmtK((ed-er)*8));}
  if(SRF.nebName)hs+='\nNEBULA: '+SRF.nebName;
  if(SRF.bhK>.05)hs+='\nTIME DILATION ×'+(T.rate/60).toFixed(2);
  hs+='\nCR '+Math.round(FL.cr)+(NET.on?' · ◉ BAND ONLINE ('+netCount()+')':'');
  if(DOCKED)hs+='\nDOCKED — '+DOCKED.name+' · [T] MENU · [F] UNDOCK';
  st.textContent=hs;}
 const zO2=PL.inside&&FL.o2?FL.o2[zoneOf(PL.pos.z)]:VIT.suit;
 const zLb=PL.inside&&FL.o2?('O2 · '+ZNAMES[zoneOf(PL.pos.z)]):'SUIT O2';
 $('vit').innerHTML=bar(VIT.hp,'HULL / VITALS')+bar(zO2,zLb)+bar(VIT.hun,'FOOD')+bar(VIT.thi,'WATER')+bar(POW.rea.water,'REACTOR H2O')+bar(POW.batt,'BATTERY');
 let f='';
 if(PL.seated&&MODE==='space'){
  f='SPD '+fmtK(SP.spd*8)+'/s · THR '+Math.round(SP.thr*100)+'% · GEAR '+(GEARST.d>.5?'DOWN':'UP');
  if(MARK)f+='\nTARGET '+MARK.name+' — '+fmtK(SP.pos.distanceTo(MARK.posU)*8);
  if(H.on)f+='\nHYPERSPEED ENGAGED — FOLD ACTIVE';
  else if(H.chg>0)f+='\nCHARGE '+Math.round(H.chg*100)+'%'+(COURSE&&(COURSE.kind==='sys'||(COURSE.ref&&COURSE.ref.sys!==FL.sys))?' → RELEASE = HYPER JUMP':'');
  else if(H.cd>0)f+='\nHYPERSPEED COOLDOWN';}
 else if(!PL.seated&&MODE==='space'&&SP.spd>2){f='SHIP UNDERWAY — '+fmtK(SP.spd*8)+'/s · THR '+Math.round(SP.thr*100)+'%'+(COURSE?'\nCOURSE '+COURSE.name:'');}
 else if(PL.seated&&MODE==='surface'){
  f='ALT '+Math.round(LAND?LAND.alt:0)+' m · VSPD '+(SURFV?SURFV.y.toFixed(0):0)+' m/s · THR '+Math.round(SP.thr*100)+'% · GEAR '+(GEARST.d>.5?'DOWN':'UP');}
 else if(PL.mode==='rover'){
  f='ROVER '+Math.abs(ROVER.spd*3.6).toFixed(0)+' km/h · BATT '+Math.round(ROVER.batt)+'%'+(ROVER.rea?' · REACTOR':'');}
 else if(!PL.inside&&MODE==='surface'){
  f='EVA · O2 '+Math.round(VIT.suit)+'% · '+LF.temp.toFixed(0)+'°C';}
 $('fly').textContent=f;
 const W=[];
 if(POW.rea.scram>0)W.push('REACTOR SCRAMMED');
 if(POW.rea.on&&POW.rea.water<20)W.push('REACTOR WATER LOW');
 if(!POW.rea.on&&POW.batt<25)W.push('BATTERY LOW');
 if(VIT.cab<30&&PL.inside)W.push('O2 LOW — '+ZNAMES[zoneOf(PL.pos.z)]);
 if(SRFX.airlock&&PL.inside)W.push('AIRLOCK OPEN — VENTING');
 if(SRFX.prox&&wireHas('prox','hud'))W.push('PILOT PROXIMITY');
 if(!PL.inside&&VIT.suit<25)W.push('SUIT O2 LOW');
 if(SYSD.hull<40)W.push('HULL DAMAGE');
 if(SRF.nebK>0)W.push('NEBULA — SENSORS DEGRADED');
 if(SRF.bhK>.15)W.push('GRAVITY WELL — TIME DILATED');
 $('warn').innerHTML=W.map(w=>'<div class="w'+(w.indexOf('SCRAM')>=0?'':' a')+'">'+w+'</div>').join('');
 $('stick').style.display=(PL.seated&&camMode==='fp')?'block':'none';
 if(PL.seated)$('stickp').style.transform='translate('+STK.x*22+'px,'+STK.y*22+'px)';
 $('xh').style.display=(camMode==='fp'&&!PL.seated&&PL.mode!=='rover')?'block':'none';
 $('lkh').style.display=(!PAUSED&&!DEAD&&!TERM&&document.pointerLockElement!==renderer.domElement)?'block':'none';
 const gh=$('gpshud'),na=$('navarr');
 if(COURSE&&MODE==='space'&&!TERM&&!PAUSED&&!DEAD){
  const cp=coursePos(TMP3);
  if(cp){const dKm=SP.pos.distanceTo(cp)*8;
   shipAxes();
   TMP.copy(cp).sub(SP.pos);
   const lz=TMP.dot(SP.fwd),lx=TMP.dot(SP.rt),ly=TMP.dot(SP.up);
   let al;
   if(lz<=.02)al='TARGET BEHIND — TURN AROUND';
   else{const ay=Math.atan2(lx,lz)*57.3,ap=Math.atan2(ly,lz)*57.3;
    al=(Math.abs(ay)<3&&Math.abs(ap)<3)?'ALIGNED — HOLD COURSE ▸':'TURN '+
     (Math.abs(ay)>3?((ay>0?'PORT ':'STARBOARD ')+Math.abs(ay).toFixed(0)+'° '):'')+
     (Math.abs(ap)>3?((ap>0?'UP ':'DOWN ')+Math.abs(ap).toFixed(0)+'°'):'');}
   gh.innerHTML='<b>◈ '+COURSE.name+'</b> · '+fmtK(dKm)+' · '+al+(SRF.align?' · AUTO-ALIGN ON':'');
   gh.style.display='block';
   const m2=Math.hypot(lx,ly);
   if(lz>0&&m2>.07){na.style.display='block';
    na.style.left='calc(50% + '+(clamp(lx,-1,1)*180)+'px)';
    na.style.top='calc(50% - '+(clamp(ly,-1,1)*180)+'px)';
    na.style.transform='translate(-50%,-50%) rotate('+(-Math.atan2(ly,lx)*57.3)+'deg)';}
   else na.style.display='none';}
  else{gh.style.display='none';na.style.display='none';}}
 else{gh.style.display='none';na.style.display='none';}
 marks();}
function marks(){
 const hm=$('hmark');let txt=null,wp=null;
 if(MODE==='space'){
  if(MARK){wp=TMP.copy(MARK.posU).sub(SP.pos);txt=MARK.name+'\n'+fmtK(SP.pos.distanceTo(MARK.posU)*8);}
  else if(COURSE){const cp=coursePos(TMP);if(cp){wp=cp.sub(SP.pos);txt=COURSE.name+'\n'+fmtK(SP.pos.distanceTo(cp)*8);}}}
 else if(MODE==='surface'&&!PL.inside){const d=Math.hypot(PL.pos.x,PL.pos.z);
  if(d>60){wp=TMP.copy(SHIPG.position);txt='KESTREL\n'+d.toFixed(0)+' m';}}
 else if(CACHE&&MODE==='surface'){wp=TMP.copy(CACHE.pos);txt='SUPPLY';}
 if(!wp){hm.style.display='none';return;}
 TMP2.copy(wp).project(cam);
 if(TMP2.z<1&&Math.abs(TMP2.x)<1&&Math.abs(TMP2.y)<1){
  hm.style.display='block';
  hm.style.left=((TMP2.x*.5+.5)*innerWidth+8)+'px';
  hm.style.top=((-TMP2.y*.5+.5)*innerHeight-8)+'px';
  hm.textContent=txt;}
 else hm.style.display='none';}
function objectives(){
 let o;
 if(INTRO.on)o='<b>WATCH.</b>';
 else if(FLG.earthGone&&MODE==='space'&&SP.pos.distanceTo(DEB.posU)<1250)o='<b>GET CLEAR</b> of the debris field\n'+fmtK((1250-SP.pos.distanceTo(DEB.posU))*8)+' to safe range';
 else if(FLG.won)o='<b>A NEW HOME</b> — keep exploring, researcher.';
 else if(FL.sys==='Proxima'&&!FLG.won)o='<b>FINAL APPROACH</b> — land on Proxima b\nSurvey first (SCAN terminal)';
 else if(INV.water>15||INV.ice>4)o='<b>SET COURSE</b> — Proxima b, Proxima Centauri\nNAV [M] ▸ UNIVERSE shows everything · hold J = hyper jump · N = auto-align';
 else o='<b>SURVIVE</b> — water for the reactor\nLand on Luna or Mars, drill ice (tool 3),\nmelt it at the refinery, inject at the tank';
 $('obj').innerHTML=o.replace(/\n/g,'<br>');}
/*--------- MFDs ---------*/
function mfdTick(){
 const zone=TERM?'off':(PL.seated?'cp':(PL.inside?(PL.pos.z<-3.2?'cp':(PL.pos.z>4?'eng':'mid')):'off'));
 for(const m of MFDS){
  if(m.id==='eng'){if(zone!=='eng')continue;}
  else if(zone!=='cp')continue;
  const c=m.ctx,W=m.cv.width,Hh=m.cv.height;
  if(!pwr('nav')){c.fillStyle='#050806';c.fillRect(0,0,W,Hh);c.fillStyle='#233528';c.font='14px Consolas';c.textAlign='center';c.fillText('NO PWR',W/2,Hh/2);m.tex.needsUpdate=true;continue;}
  c.fillStyle='#04120b';c.fillRect(0,0,W,Hh);
  c.fillStyle='#2f6f4f';c.fillRect(0,0,W,16);
  c.fillStyle='#7dffa8';c.font='10px Consolas';c.textAlign='left';
  c.fillText(m.id.toUpperCase()+' — KL-9 KESTREL',6,12);
  c.font='11px Consolas';let y=34;
  const ln=s=>{c.fillText(s,8,y);y+=18;};
  if(m.id==='nav'){
   if(MARK){ln('TARGET  '+MARK.name);ln('DIST    '+fmtK((MODE==='surface'?MARK.posKm.distanceTo(LF.body.posKm):SP.pos.distanceTo(MARK.posU)*8)));
    ln('TYPE    '+(MARK.t==='star'?'STAR':MARK.t==='gas'?'GAS GIANT':'ROCK'));}
   else if(COURSE){const cp=coursePos(TMP);if(cp){ln('COURSE  '+COURSE.name);ln('DIST    '+fmtK(SP.pos.distanceTo(cp)*8));ln('N = AUTO-ALIGN');}}
   else{ln('NO TARGET — [M] MAP');}
   const pfd=fl2PFD();
   ln('');
   ln('MODE '+pfd.mode+(pfd.stall?' · STALL!':'')+(pfd.heat>.5?' · HOT!':'')+(pfd.entry?' · ENTRY':''));
   ln((MODE==='surface'?'IAS '+pfd.ias+' m/s  VS '+pfd.vs+'  AGL '+pfd.agl:'VEL '+pfd.ias+' km/s')+'  G '+pfd.g);
   ln('THR '+pfd.thr+'%'+(FL2.hover?'  ALT TGT '+Math.round(FL2.hoverT)+'m':'')+(pfd.drag>0?'  DRAG '+pfd.drag:''));}
  else if(m.id==='scan'){
   const keys=Object.keys(FL.scan);
   if(SCANST)ln('SCANNING '+bodyName(SCANST.id)+'…');
   else if(keys.length){ln('SURVEYED:');for(let i=Math.max(0,keys.length-4);i<keys.length;i++)ln(' · '+bodyName(keys[i]));}
   else{ln('NO SURVEYS');ln('SCAN BEFORE');ln('LANDING');}}
  else if(m.id==='sys'){
   ln('HULL '+Math.round(SYSD.hull)+'%  ENG '+Math.round(SYSD.eng)+'%');
   ln('RCTR '+Math.round(SYSD.rea)+'%  LIFE '+Math.round(SYSD.lif)+'%');
   ln('AVIO '+Math.round(SYSD.avo)+'%');
   ln('');ln('REACTOR '+(POW.rea.on?'ONLINE':'OFFLINE'));
   ln('H2O '+Math.round(POW.rea.water)+'%  BATT '+Math.round(POW.batt)+'%');}
  else if(m.id==='com'){
   const n=FL.log.length;
   if(n){for(let i=Math.max(0,n-3);i<n;i++)ln('· '+FL.log[i].m.slice(0,26));}
   else{ln('CHANNELS QUIET');ln('BEACON READY');}}
  else if(m.id==='eng'){
   ln('REACTOR '+(POW.rea.on?'ONLINE':'OFFLINE')+(POW.rea.scram>0?' SCRAM':''));
   ln('WATER '+Math.round(POW.rea.water)+'%');
   ln('BATTERY '+Math.round(POW.batt)+'%');
   ln('COOLANT '+(INV.water>=10?'OK':'LOW — MELT ICE'));}
  m.tex.needsUpdate=true;}}
/*--------- intro ---------*/
function startIntro(){
 const L=['MISSION CLOCK +00:00 — KL-9 "KESTREL" · HIGH EARTH ORBIT',
  'The deep-core extraction breach was never supposed to reach the mantle.',
  'Evacuation order came eleven minutes ago. Half the world never heard it.',
  'You are the last light humanity has left.',
  '…seismic reads critical. She is going to go.'];
 $('intr').innerHTML=L.map(s=>'<div class="ln">'+s+'</div>').join('');
 $('intr').style.display='block';$('iskip').style.display='block';
 INTRO={on:true,t:0,boom:false,done:false,dir:INTRO.dir,dist:INTRO.dist};
 setLoop('pad',.13);}
$('iskip').onclick=()=>{if(!INTRO.on)return;
 if(!INTRO.boom)INTRO.t=26.9;else INTRO.t=33.9;};
function introUpdate(dt){
 INTRO.t+=dt;
 const lines=$('intr').children;
 const at=[1.5,6.5,11.5,16.5,21.5];
 for(let i=0;i<lines.length;i++)if(INTRO.t>at[i])lines[i].style.opacity=1;
 if(!INTRO.boom&&INTRO.t>26.5){
  INTRO.boom=true;applyEarthGone(false);
  const d=document.createElement('div');d.className='ln';d.style.opacity=1;d.textContent='EARTH IS GONE.';$('intr').appendChild(d);}
 if(INTRO.t>34)endIntro();}
function endIntro(){
 INTRO.on=false;INTRO.done=true;
 $('intr').style.display='none';$('iskip').style.display='none';
 setLoop('pad',0);
 toast('CLICK THE VIEW TO TAKE CONTROLS — W/S THROTTLE · MOUSE STICK · J HYPERSPEED · E STAND',1);
 toast('OBJECTIVE: GET CLEAR OF THE DEBRIS FIELD');}
/*--------- fresh / resume ---------*/
function freshGame(){
 FL=freshFL();INV=FL.inv;VIT=FL.vit;POW=FL.pow;SYSD=FL.sysd;FLG=FL.flg;
 T.t=0;MODE='space';LAND=null;MARK=null;
 updateBodies();
 const e=bodyById('earth');
 const dir=V3(.42,.1,.9).normalize();
 SP.pos.copy(e.posU).addScaledVector(dir,e.r*US*3.2);
 TMM.lookAt(SP.pos,e.posU,V3(0,1,0));SP.q.setFromRotationMatrix(TMM);
 SP.spd=0;SP.thr=0;
 INTRO.dir=dir;INTRO.dist=e.r*US*3.2;
 PL.seated=true;PL.seatX=-.85;PL.inside=true;PL.pos.set(0,0,-6);PL.yaw=0;
 SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
 VM.set(0);startIntro();}
function resumeState(){
 syncLevers();VM.set(FL.hot||0);
 if(FLG.earthGone)applyEarthGone(true);
 if(MODE==='surface'&&LAND){const bd=bodyById(LAND.b);
  if(bd){enterSurface(bd,q0pfToV3(LAND.q0),LAND.yaw,true);PL.seated=false;}}
 else{MODE='space';scene.remove(SURFG);scene.fog=null;TER=null;LF.body=null;
  SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
  PL.seated=false;PL.inside=true;PL.pos.set(0,0,6);PL.yaw=Math.PI;}
 ROVER.rea=!!FL.roverPwr;
 if(document.pointerLockElement)document.exitPointerLock();}
function winCheck(){
 if(!FLG.won&&MODE==='surface'&&LF.body&&LF.body.id==='pb'){
  FLG.won=true;$('winov').style.display='flex';sfx('pickup');saveGame(true);}}
/*--------- title attract mode ---------*/
const ATTR={a:.9};
let MENUFX=null;
function buildMenuFX(er){
 if(MENUFX||!er)return;
 MENUFX=new THREE.Group();
 const SH=[];
 for(const s of[[1.045,.16,0xff3810],[1.028,.3,0xff7020],[1.014,.5,0xffc070]]){
  const hm=new THREE.Mesh(new THREE.SphereGeometry(er*s[0],40,20,0,Math.PI),
   new THREE.MeshBasicMaterial({color:s[2],transparent:true,opacity:s[1],blending:THREE.AdditiveBlending,depthWrite:false}));
  MENUFX.add(hm);SH.push(hm);}
 const EMB=[];
 for(let i=0;i<16;i++){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:[0xffa050,0xff6020,0xffe0b0][i%3],transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
  const th=rnd(0,6.28),ph=Math.acos(rnd(-.25,1));
  sp.position.set(Math.sin(ph)*Math.cos(th),Math.cos(ph),Math.sin(ph)*Math.sin(th)).multiplyScalar(er*1.06);
  sp.scale.setScalar(er*rnd(.14,.3));
  sp.userData.base=rnd(.6,.95);
  MENUFX.add(sp);EMB.push(sp);}
 MENUFX.userData.shells=SH;MENUFX.userData.embers=EMB;
 MENUFX.position.copy(bodyById('earth').posU).sub(SP.pos);
 scene.add(MENUFX);}
function menuPark(){
 MODE='space';LAND=null;
 updateBodies();
 const e=bodyById('earth');
 const dir=V3(.42,.1,.9).normalize();
 SP.pos.copy(e.posU).addScaledVector(dir,e.r*US*3.2);
 TMM.lookAt(SP.pos,e.posU,V3(0,1,0));SP.q.setFromRotationMatrix(TMM);
 SP.spd=0;SP.thr=0;
 SHIPG.position.set(0,0,0);SHIPG.quaternion.copy(SP.q);
 placeBodies();
 buildMenuFX(e.r*US);}
function attractTick(){
 const dt=Math.min(.05,clockR.getDelta());
 ATTR.a+=dt*.05;
 const e=bodyById('earth');
 const ec=V3().copy(e.posU).sub(SP.pos);
 const az=Math.sin(ATTR.a*.7)*.34, el=.22+Math.sin(ATTR.a*.43)*.09, R=2150;
 cam.position.copy(ec).add(V3(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)).multiplyScalar(R));
 if(cam.up)cam.up.set(0,1,0);
 cam.lookAt(ec);
 const fwd=V3().copy(ec).sub(cam.position).normalize();
 const rgt=V3().crossVectors(fwd,V3(0,1,0)).normalize();
 cam.lookAt(V3().copy(ec).addScaledVector(rgt,-e.r*US*1.35));
 if(MENUFX&&MENUFX.parent){
  MENUFX.position.copy(ec);
  MENUFX.quaternion.setFromRotationMatrix(TMM.makeBasis(V3().crossVectors(V3(0,1,0),rgt).normalize(),V3(0,1,0),rgt));
  const tt=performance.now()*.001,EM=MENUFX.userData.embers||[];
  for(let i=0;i<EM.length;i++)EM[i].material.opacity=(EM[i].userData.base||.8)*(.72+.28*Math.sin(tt*2.6+i*1.7));}
 renderer.render(scene,cam);}
/*--------- settings panels ---------*/
function settingsHTML(){const q=SET.q|0;
 const qb=(v,l)=>'<span class="qbtn'+(q===v?' on':'')+'" data-q="'+v+'">'+l+'</span>';
 return '<div class="qh">VIDEO — ADVANCED GRAPHICS</div>'
 +'<div class="row" style="margin:2px 0">QUALITY '+qb(0,'POTATO')+qb(1,'LOW')+qb(2,'HIGH')+qb(3,'ULTRA')+'</div>'
 +'RENDER SCALE <input type="range" class="sld" data-k="rs" min="60" max="130" value="'+Math.round((SET.rs||1)*100)+'"> <span class="rsv">'+Math.round((SET.rs||1)*100)+'%</span><br>'
 +'STAR DENSITY <input type="range" class="sld" data-k="sd" min="30" max="200" value="'+Math.round((SET.sd||1)*100)+'"><br>'
 +'FIELD OF VIEW <input type="range" class="sld" data-k="fov" min="60" max="95" value="'+(SET.fov||72)+'"><br>'
 +'UNIVERSE SEED <input type="number" class="sld" data-k="useed" min="1" max="999999" value="'+(SET.useed||777)+'" style="width:92px"> <span class="btn seedgo">RESEED UNIVERSE</span><br>'
 +'<div class="dim">QUALITY SETS PIXEL RATIO, EXPOSURE &amp; SKY LAYERS · DENSITY REBUILDS THE STARS · RESEED GROWS NEW CONTINENTS AND CONSTELLATIONS</div>'
 +'<div class="qh">AUDIO / CONTROL</div>'
 +'VOLUME <input type="range" class="sld" data-k="v" min="0" max="100" value="'+Math.round(SET.v*100)+'"><br>'
 +'MOUSE SENSITIVITY <input type="range" class="sld" data-k="sens" min="20" max="200" value="'+Math.round((SET.sens||1)*100)+'"><br>'
 +'<div class="dim">FIRMWARE 14.0 · 4 GALAXIES · '+Object.keys(SYSTEMS).length+' SYSTEMS · GLOBAL BAND · BUILDING · WARP · LIFE SUPPORT · FIRST RUN NEEDS INTERNET (three.js CDN)</div>';}
function fillSettings(){try{
 $('sset').innerHTML=settingsHTML()+'<button class="mbtn" id="sback" style="width:180px;margin-top:10px">BACK</button>';
 $('sback').onclick=()=>{$('sset').style.display='none';};
 $('pset').innerHTML=settingsHTML();}catch(e){}}
function wireSettings(){
 document.addEventListener('click',e=>{const t=e.target;
  if(t&&t.classList&&t.classList.contains('qbtn')&&t.dataset&&t.dataset.q!==undefined){SET.q=+t.dataset.q;applyQuality();saveSet();fillSettings();sfx('click');}
  if(t&&t.classList&&t.classList.contains('seedgo')){applyUniverseSeed();fillSettings();}});
 document.addEventListener('input',e=>{const t=e.target;if(!t||!t.dataset||!t.dataset.k)return;
  const v=+t.value,k=t.dataset.k;
  if(k==='rs'){SET.rs=v/100;applyQuality();if(document.querySelectorAll)document.querySelectorAll('.rsv').forEach(s2=>s2.textContent=v+'%');}
  else if(k==='sd'){SET.sd=v/100;clearTimeout(SDT);SDT=setTimeout(()=>buildStarfield(),180);}
  else if(k==='fov'){SET.fov=v;if(cam.updateProjectionMatrix){cam.fov=v;cam.updateProjectionMatrix();}}
  else if(k==='useed'){SET.useed=Math.max(1,Math.floor(v||777));}
  else if(k==='v'){SET.v=v/100;AU.setV(SET.v);}
  else if(k==='sens'){SET.sens=v/100;}
  saveSet();});
 document.addEventListener('mouseover',e=>{const t=e.target;
  if(t&&t.classList&&(t.classList.contains('btn')||t.classList.contains('mbtn')||t.classList.contains('qbtn')))sfx('hov');});}
function applyUniverseSeed(){for(const b of BODY){
  if(b.mat.uniforms&&b.mat.uniforms.uSeed)b.mat.uniforms.uSeed.value.copy(seedVec(b.id));
  if(b.clouds&&b.clouds.material.uniforms)b.clouds.material.uniforms.uSeed.value.copy(seedVec(b.id+'c'));}
 buildStarfield();saveSet();sfx('tele');
 toast('UNIVERSE RESEEDED — '+SET.useed+' · NEW CONTINENTS · NEW CONSTELLATIONS · RELOAD TO REGROW SYSTEM LAYOUT',1);}
function applyQuality(){const q=SET.q|0;
 try{renderer.setPixelRatio(clamp(SET.rs||1,.5,1.4)*GOV.k*[.66,.8,1,Math.min(globalThis.devicePixelRatio||1,1.25)][q]);}catch(e){}
 if(renderer.toneMappingExposure!==undefined)renderer.toneMappingExposure=[1.02,1.1,1.16,1.26][q];
 if(UNI.userData.sf||UNI.userData.sf2)buildStarfield();}
function fpsGov(dt){if(MENU||!BOOTED)return;GOV.acc+=dt;GOV.n++;
 if(GOV.acc<1.5)return;
 const fps=GOV.n/GOV.acc;GOV.acc=0;GOV.n=0;
 if(fps<42&&GOV.k>.55){GOV.low++;GOV.high=0;
  if(GOV.low>=2){GOV.k=Math.max(.55,GOV.k-.12);GOV.low=0;applyQuality();toast('AUTO-PERFORMANCE — RENDER SCALE '+Math.round(GOV.k*100)+'%',1);}}
 else if(fps>57&&GOV.k<1){GOV.high++;GOV.low=0;
  if(GOV.high>=4){GOV.k=Math.min(1,GOV.k+.12);GOV.high=0;applyQuality();}}
 else{GOV.low=0;GOV.high=0;}}
/*--------- boot ---------*/
async function boot(){
 $('stip').textContent='shipyard…';
 buildShip();makeDoors();buildRover();buildVM();drawHotbar();
 freezeStatic(SHIPG);
 $('sbar').style.width='12%';
 $('stip').textContent='charting '+BDEF.length+' worlds across '+Object.keys(SYSTEMS).length+' systems…';
 buildBodies();
 applyShaders();
 $('sbar').style.width='84%';
 buildStarfield();
 buildAnomalies();
 buildStations();
 buildWarpFX();
 $('stip').textContent='flight systems…';
 initInput();
 fillSettings();wireSettings();applyQuality();
 dashSync();
 const hasSave=loadGame();
 $('sbar').style.width='100%';
 $('stip').textContent=hasSave?'PRIOR FLIGHT DATA FOUND':'NO PRIOR FLIGHT DATA';
 updateBodies();menuPark();
 if(!hasSave)$('scont').classList.add('dis');
 $('sload').style.display='none';
 $('smenu').style.display='flex';
 $('slag').style.display='block';$('sstory').style.display='block';
 $('fade').style.opacity=0;
 renderer.setAnimationLoop(attractTick);
 const startGame=fresh=>{
  AU.init();AU.setV(SET.v);
  MENU=false;
  if(MENUFX&&MENUFX.parent)scene.remove(MENUFX);
  $('splash').style.display='none';
  $('hud').style.display='block';
  BOOTED=true;
  renderer.setAnimationLoop(tick);
  if(fresh)freshGame();
  else{resumeState();toast('SAVE LOADED — SYSTEMS RESTORED');}
  if(FL.netName&&!NET.on)netConnect(FL.netName);
  if(NET.on)FL.netName=NET.id;};
 $('sgo').onclick=()=>{if(hasSave&&!confirm('ABANDON THE CURRENT SAVE AND START A NEW EXPEDITION?'))return;
  if(hasSave)localStorage.removeItem(SAVEKEY);
  startGame(true);};
 $('scont').onclick=()=>{if(hasSave)startGame(false);};
 $('sman').onclick=()=>{$('sset').style.display='none';const l=$('slist');l.style.display=l.style.display==='block'?'none':'block';};
 $('snetb').onclick=()=>{fillNetPanel();$('netp').style.display='flex';};
 $('ssetb').onclick=()=>{$('slist').style.display='none';fillSettings();$('sset').style.display='block';};
 $('sexb').onclick=()=>{
  if(AU.on)AU.setV(0);
  setLoop('pad',0);setLoop('rea',0);setLoop('eng',0);
  renderer.setAnimationLoop(()=>{});
  $('splash').style.display='none';
  $('sexit').style.display='flex';};
 $('sreboot').onclick=()=>location.reload();}
/*--------- main loop ---------*/
function tick(){
 const dt=Math.min(.05,clockR.getDelta());
 if(PAUSED||DEAD){renderer.render(scene,cam);return;}
 FRAMEID++;
 T.dt=dt;
 if(MODE!=='space')T.rate=60;
 const gdt=dt*T.rate;T.t+=gdt;
 if(INTRO.on)introUpdate(dt);
 updateBodies();
 if(WRP.on){warpUpdate(dt);placeBodies();netVisualTick();}
 else if(MODE==='space'){
  placeBodies();
  if(!DOCKED){flightUpdate(dt);hyperUpdate(dt);}
  anomUpdate(dt);
  eventTick(dt);
  stationTick(dt);
  spaceBuildTick();
  netVisualTick();}
 else{
  SRF.nebK=0;SRF.nebName='';SRF.bhK=0;
  setLoop('neb',0);setLoop('rumble',0);
  AMB.color.lerp(AMB0,Math.min(1,dt*2));
  surfaceFlight(dt);
  updateSurface();
  sur2Tick(dt);
  placeBodies();}
 playerUpdate(dt);
 roverUpdate(dt);
 doorAnim(dt);rampAnim(dt);gearAnim(dt);
 navBlink();
 setHover();
 vmUpdate(dt);
 crewTick(dt);
 toolUpdate(dt);
 scanTick(dt);fabTick(dt);comTick();
 netTick(dt);
 radioTick(dt);
 bldTick(dt);
 powerTick(dt);
 stationDetailTick();
 powerSim(dt,gdt);
 survivalSim(dt,gdt);
 o2Sim(dt);
 alarmTick();
 updateCamera(dt);
 audioTick();
 hudAcc+=dt;
 if(hudAcc>.28){hudAcc=0;hudUpdate();mfdTick();objectives();dashSync();}
 winCheck();
 fpsGov(dt);
 renderer.render(scene,cam);}

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
