const {JSDOM}=require('jsdom'),fs=require('fs'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{runScripts:'dangerously',url:'http://localhost/'}),w=dom.window,d=w.document;
let now=0,id=0,tasks=new Map(),sounds=0;w.setTimeout=(fn,ms)=>{tasks.set(++id,{fn,time:now+ms});return id};w.clearTimeout=i=>tasks.delete(i);
function tick(ms){const end=now+ms;for(;;){const next=[...tasks].sort((a,b)=>a[1].time-b[1].time).find(x=>x[1].time<=end);if(!next)break;tasks.delete(next[0]);now=next[1].time;next[1].fn()}now=end}
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,key)=>key==='measureText'?()=>({width:20}):()=>{}});w.HTMLElement.prototype.getAnimations=()=>[];w.HTMLElement.prototype.animate=()=>({cancel(){}});w.requestAnimationFrame=()=>{};w.matchMedia=()=>({matches:false});w.fetch=async()=>({ok:true,text:async()=>fs.readFileSync(root+'/assets/capybara.svg','utf8')});
w.AudioContext=class{constructor(){this.currentTime=0;this.destination={}}resume(){}createOscillator(){return {frequency:{},connect(){},disconnect(){},start(){sounds++},stop(){}}}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}};
function load(f){const s=d.createElement('script');s.textContent=fs.readFileSync(root+'/'+f,'utf8');d.body.appendChild(s)}
load('game.js');w.eval('startCameraMode=()=>show("camera");stopCamera=()=>{}');for(const f of ['round-ui.js','characters.js','multiplayer.js','presentation/config.js','impact-fx.js','presentation/controllers.js','presentation/bridge.js'])load(f);
const {contexts,sound,reset}=w.CuteDartV11.controllers;
const hit=(x,y)=>JSON.parse(w.eval(`JSON.stringify(hitScore(${x},${y}))`));
assert.deepEqual(hit(210,210),{score:50,label:'BULL',kind:'bull'});assert.equal(hit(700,700).score,0);
const normal={x:235,y:101},triple={x:225,y:124},dbl={x:235,y:67},bull={x:210,y:210},miss={x:500,y:500};
assert.equal(hit(normal.x,normal.y).kind,'single');assert.equal(hit(triple.x,triple.y).label,'T20');assert.equal(hit(dbl.x,dbl.y).kind,'double');
w.eval('newGame("practice")');function commit(p){w.eval(`commitThrow(${JSON.stringify(p)})`)}
commit(normal);assert.equal(contexts.classic.summary.rows.length,1);assert(d.querySelector('.v11-classic-play .v11-impact.normal'));assert.equal(contexts.classic.mascot.el.className,'v11-mascot wiggle');
commit(triple);assert(d.querySelector('.v11-classic-play .v11-impact.high'));assert.equal(d.querySelector('.v11-classic-play .v11-pop b').textContent,'TRIPLE!');
commit(bull);assert(d.querySelector('.v11-classic-play .v11-impact.bull'));assert.equal(contexts.classic.mascot.el.className,'v11-mascot dance');assert.equal(d.querySelector('.v11-classic-play .v11-total b').textContent,'130');assert.equal(d.querySelector('.v11-classic-play .v11-record').textContent,'NEW RECORD!');assert.equal(w.eval('state.turn'),130);
tick(2000);assert.equal(contexts.classic.mascot.el.className,'v11-mascot idle');assert.equal(contexts.classic.mascot.el.style.right,'12px');
commit(dbl);assert.equal(contexts.classic.summary.rows.length,1);assert(d.querySelector('.v11-classic-play .v11-impact.high'));assert.equal(d.querySelector('.v11-classic-play .v11-record').textContent,'');
w.eval('newGame("301");state.score=10');commit(bull);assert.equal(contexts.classic.summary.rows[0].score,0);assert.equal(d.querySelector('.v11-classic-play .v11-total b').textContent,'0');assert.equal(w.eval('state.score'),10);
w.eval('newGame("301");state.score=60');commit(normal);commit(bull);assert.equal(contexts.classic.summary.el.querySelector('.v11-total b').textContent,'20');assert.equal(w.eval('state.turn'),20);
// Camera accepted hits, immediate panel update, delayed effects and cancelled timers.
w.eval('show("camera")');function cameraHit(p){w.eval(`cameraThrow(${JSON.stringify(p)})`)}
cameraHit(normal);assert.equal(contexts.camera.summary.rows.length,1);assert.equal(contexts.camera.effect.layer.childElementCount,0);tick(520);assert(contexts.camera.effect.layer.querySelector('.normal'));assert.equal(w.eval('cameraState.score'),20);
cameraHit(triple);tick(520);cameraHit(bull);assert.equal(contexts.camera.summary.rows.length,3);assert.equal(contexts.camera.summary.el.querySelector('.v11-total b').textContent,'130');tick(520);assert.equal(contexts.camera.mascot.el.className,'v11-mascot dance');
d.getElementById('cameraHomeBtn').click();tick(10000);assert.equal(contexts.camera.effect.layer.childElementCount,0);assert.equal(contexts.camera.summary.rows.length,0);assert.equal(contexts.camera.mascot.el.className,'v11-mascot idle');
// Multiplayer keeps input locks and scoring; next player gets empty summary.
d.getElementById('multiplayerEntry').click();d.querySelectorAll('.character-card')[1].click();d.querySelectorAll('.character-card')[2].click();d.getElementById('multiStart').click();cameraHit(bull);assert.equal(contexts.camera.summary.rows.length,0);tick(2300);
cameraHit(bull);tick(3100);cameraHit(bull);tick(3100);cameraHit(bull);assert.equal(contexts.camera.summary.rows.length,3);assert.equal(w.cuteDartCurrentCharacter().name,'Kai');assert.equal(d.querySelector('.multi-player.active strong').textContent,'151');tick(3100+1500);assert.equal(w.cuteDartCurrentCharacter().name,'Hina');assert.equal(contexts.camera.summary.rows.length,0);
// Bust restores multiplayer round start score and invalidates presentation total.
for(let i=0;i<2;i++){cameraHit(triple);tick(2600)}cameraHit(bull);tick(4600); // Hina 131; Kai next.
for(let i=0;i<2;i++){cameraHit(triple);tick(2600)}cameraHit(bull);assert.equal(d.querySelector('.multi-player.active strong').textContent,'151');assert.equal(contexts.camera.summary.el.querySelector('.v11-total b').textContent,'BUST');assert.equal(contexts.camera.summary.el.querySelector('.v11-record').textContent,'');
d.getElementById('cameraHomeBtn').click();tick(10000);assert(!d.querySelector('.multi-turn-banner').classList.contains('show'));
const start=sounds;w.eval('state.sound=false');sound.play('bull');assert.equal(sounds,start);w.eval('state.sound=true');sound.play('bull');assert.equal(sounds,start+4);
w.matchMedia=()=>({matches:true});contexts.classic.effect.hit(bull,{score:50,kind:'bull',label:'BULL'});assert.equal(contexts.classic.effect.layer.querySelectorAll('.v11-particle').length,0);reset('classic');
// Safe placement: mobile/landscape targets occupying the default dance position.
const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});camera=d.getElementById('cameraStage');camera.getBoundingClientRect=()=>rect(0,0,800,600);contexts.camera.board.getBoundingClientRect=()=>rect(230,320,300,260);contexts.camera.summary.el.getBoundingClientRect=()=>rect(680,100,110,260);contexts.camera.mascot.el.getBoundingClientRect=()=>rect(680,422,100,100);contexts.camera.mascot.onIdle();assert.equal(contexts.camera.mascot.el.hidden,false);assert.equal(contexts.camera.mascot.el.style.left,'688px');
console.log('PASS V1.1: actual score tiers, classic/camera three darts, records, BUST, accepted-input lock, player switch, cleanup, mute, reduced motion and safe placement.');
