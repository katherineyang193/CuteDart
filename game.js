const canvas=document.getElementById("board"),ctx=canvas.getContext("2d");
const screens={home:document.getElementById("homeScreen"),game:document.getElementById("gameScreen"),camera:document.getElementById("cameraScreen"),result:document.getElementById("resultScreen")};
const scoreEl=document.getElementById("score"),turnEl=document.getElementById("turnScore"),dartEl=document.getElementById("dartCount"),modeEl=document.getElementById("modeLabel"),lastEl=document.getElementById("lastThrow"),hintEl=document.getElementById("hint"),badge=document.getElementById("hitBadge");
const state={mode:"501",score:501,turn:0,darts:[],marks:[],totalDarts:0,bestRound:0,oneEighty:0,drag:false,start:null,aim:null,animating:false,sound:true};
let impact=null;
let audioCtx;
const C=210,sectors=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

function show(n){Object.values(screens).forEach(x=>x.classList.remove("active"));screens[n].classList.add("active")}
function loadRecords(){const r=JSON.parse(localStorage.getItem("cuteDartRecords")||"{}");document.getElementById("bestRoundHome").textContent=r.bestRound||0;document.getElementById("oneEightyHome").textContent=r.oneEighty||0}
function saveRecords(){const r=JSON.parse(localStorage.getItem("cuteDartRecords")||"{}");r.bestRound=Math.max(r.bestRound||0,state.bestRound);r.oneEighty=(r.oneEighty||0)+state.oneEighty;localStorage.setItem("cuteDartRecords",JSON.stringify(r));loadRecords()}
function beep(freq=500,duration=.07){if(!state.sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch{}}

function drawBoard(){const d=devicePixelRatio||1;canvas.width=420*d;canvas.height=420*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,420,420);const rings=[198,181,151,140,94,82,28,12],fills=["#57c7e8","#fff7df","#ff9b62","#fff7df","#57c7e8","#ff9b62","#ffd84d"];ctx.beginPath();ctx.arc(C,C,198,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(C,C,rings[i],0,Math.PI*2);ctx.fillStyle=fills[i];ctx.fill()}for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI*2/20,a2=a+Math.PI*2/20;ctx.beginPath();ctx.moveTo(C,C);ctx.arc(C,C,198,a,a2);ctx.closePath();ctx.fillStyle=i%2?"#fff7df":"#2f6f9f";ctx.globalAlpha=.13;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle="rgba(41,51,74,.35)";ctx.stroke()}[198,181,151,140,94,82,28,12].forEach(r=>{ctx.beginPath();ctx.arc(C,C,r,0,Math.PI*2);ctx.strokeStyle="#315a91";ctx.lineWidth=2;ctx.stroke()});ctx.beginPath();ctx.arc(C,C,200,0,Math.PI*2);ctx.strokeStyle="#24364b";ctx.lineWidth=5;ctx.stroke();ctx.fillStyle="#24364b";ctx.font="900 17px Trebuchet MS";ctx.textAlign="center";ctx.textBaseline="middle";for(let i=0;i<20;i++){const a=-Math.PI/2+(i+.5)*Math.PI*2/20;ctx.save();ctx.shadowColor="rgba(255,255,255,.85)";ctx.shadowBlur=2;ctx.fillText(sectors[i],C+166*Math.cos(a),C+166*Math.sin(a));ctx.restore()}ctx.beginPath();ctx.arc(C,C,12,0,Math.PI*2);ctx.fillStyle="#ffd84d";ctx.fill();ctx.strokeStyle="#24364b";ctx.stroke();state.marks.forEach(m=>drawDart(m.x,m.y,m.label,false,.92));
if(impact&&performance.now()<impact.until){
const p=(impact.until-performance.now())/420,r=12+(1-p)*22;
ctx.save();ctx.globalAlpha=p;ctx.strokeStyle="#ff8068";ctx.lineWidth=4;
ctx.beginPath();ctx.arc(impact.x,impact.y,r,0,Math.PI*2);ctx.stroke();
ctx.restore();requestAnimationFrame(drawBoard);
}
if(state.aim&&!state.animating)drawAim(state.aim)}
function drawDart(x,y,label,active=true,scale=1){
ctx.save();ctx.translate(x,y);ctx.rotate(-0.35);ctx.scale(scale,scale);
ctx.shadowColor="rgba(35,48,70,.28)";ctx.shadowBlur=5;ctx.shadowOffsetY=3;
ctx.strokeStyle="#17283b";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-28,0);ctx.lineTo(12,0);ctx.stroke();
ctx.fillStyle="#8e9aa8";ctx.beginPath();ctx.roundRect(-4,-3,19,6,2);ctx.fill();
ctx.fillStyle="#d9e1e7";ctx.beginPath();ctx.roundRect(1,-2,11,4,1);ctx.fill();
ctx.fillStyle="#26384a";ctx.beginPath();ctx.moveTo(12,-2);ctx.lineTo(25,0);ctx.lineTo(12,2);ctx.closePath();ctx.fill();
ctx.fillStyle="#ff8068";ctx.beginPath();ctx.moveTo(-17,-5);ctx.lineTo(-29,-9);ctx.lineTo(-23,0);ctx.lineTo(-29,9);ctx.lineTo(-17,5);ctx.closePath();ctx.fill();
ctx.strokeStyle="#fff4dc";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-25,-7);ctx.lineTo(-19,-2);ctx.moveTo(-25,7);ctx.lineTo(-19,2);ctx.stroke();
ctx.fillStyle="#ffd84d";ctx.beginPath();ctx.arc(12,0,2.7,0,Math.PI*2);ctx.fill();
ctx.restore();
if(label&&active){ctx.save();ctx.fillStyle="#29334a";ctx.font="900 12px Trebuchet MS";ctx.textAlign="center";ctx.fillText(label,x,y-15);ctx.restore()}}
function drawAim(p){ctx.save();ctx.strokeStyle="#f05b61";ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(p.x-19,p.y);ctx.lineTo(p.x+19,p.y);ctx.moveTo(p.x,p.y-19);ctx.lineTo(p.x,p.y+19);ctx.stroke();ctx.restore()}
function animateThrow(from,to,done){
const start=performance.now(),duration=520;state.animating=true;
function frame(now){
const t=Math.min(1,(now-start)/duration),e=1-Math.pow(1-t,3);
const x=from.x+(to.x-from.x)*e;
const y=from.y+(to.y-from.y)*e-Math.sin(t*Math.PI)*28;
drawBoard();
drawDart(x,y,"",true,1+Math.sin(t*Math.PI)*.22);
if(t<1)requestAnimationFrame(frame);
else{
state.animating=false;
impact={x:to.x,y:to.y,until:performance.now()+420};
done();
}}
requestAnimationFrame(frame)}

function pos(e){const r=canvas.getBoundingClientRect(),s=420/r.width;return{x:(e.clientX-r.left)*s,y:(e.clientY-r.top)*s}}
function hitScore(x,y){const dx=x-C,dy=y-C,dist=Math.hypot(dx,dy);if(dist>198)return{score:0,label:"MISS",kind:"miss"};if(dist<=12)return{score:50,label:"BULL",kind:"bull"};if(dist<=28)return{score:25,label:"25",kind:"outerbull"};const angle=(Math.atan2(dy,dx)+Math.PI/2+Math.PI*2)%(Math.PI*2),idx=Math.floor(angle/(Math.PI*2/20)),n=sectors[idx];if(dist<=94)return{score:n*3,label:"T"+n,kind:"triple"};if(dist<=140)return{score:n,label:String(n),kind:"single"};if(dist<=151)return{score:n*2,label:"D"+n,kind:"double"};return{score:n,label:String(n),kind:"single"}}
function update(){scoreEl.textContent=state.score;turnEl.textContent=state.turn;dartEl.textContent=state.darts.length+" / 3 鏢"}
function newGame(mode){impact=null;state.mode=mode;state.score=mode==="practice"?0:Number(mode);state.turn=0;state.darts=[];state.marks=[];state.totalDarts=0;state.bestRound=0;state.oneEighty=0;state.drag=false;state.aim=null;state.animating=false;modeEl.textContent=mode==="practice"?"練習":mode;lastEl.textContent="準備好了嗎？";hintEl.textContent="👆 按住後，拖到想射的位置再放開！";update();drawBoard();show("game")}
function finishTurn(){if(!state.darts.length)return;state.bestRound=Math.max(state.bestRound,state.turn);if(state.turn===180)state.oneEighty++;state.darts=[];state.turn=0;state.marks=[];state.aim=null;update();lastEl.textContent="✨ 新回合！";hintEl.textContent="再丟三鏢吧！";document.getElementById("endTurnBtn").disabled=true;drawBoard()}
function finishGame(){saveRecords();document.getElementById("finalDarts").textContent=state.totalDarts;document.getElementById("finalBest").textContent=state.bestRound;document.getElementById("final180").textContent=state.oneEighty;document.getElementById("resultTitle").textContent=state.mode==="practice"?"練習完成！":"太棒啦！";document.getElementById("resultSub").textContent=state.mode==="practice"?"今天也有好好練習喔 ✨":"恭喜你完成這一局！";show("result")}
function commitThrow(p){const h=hitScore(p.x,p.y);state.marks.push({x:p.x,y:p.y,label:h.label});let gained=h.score;if(state.mode!=="practice"){const next=state.score-gained;if(next<0||next===1){h.label="BUST";gained=0}else state.score=next}else state.score+=gained;state.turn+=gained;state.totalDarts++;state.darts.push(h);if(h.kind==="miss"){beep(180,.12)}
else if(h.kind==="bull"){beep(920,.11);setTimeout(()=>beep(1180,.1),70)}
else if(h.kind==="triple"||h.kind==="double"){beep(760,.09);setTimeout(()=>beep(940,.07),65)}
else beep(620,.07);lastEl.textContent=h.label==="BUST"?"💥 BUST！":h.score?"🎯 "+h.label+" +"+h.score:"💨 MISS！";badge.textContent=h.label==="BUST"?"BUST":h.label+(h.score?"!":"");badge.classList.remove("show","mega");void badge.offsetWidth;badge.classList.add("show");if(state.turn===180&&state.darts.length===3){badge.textContent="✨ 180 ✨";badge.classList.add("mega");beep(900,.12);setTimeout(()=>beep(1100,.12),120);if(navigator.vibrate)navigator.vibrate([40,50,80])}update();document.getElementById("endTurnBtn").disabled=false;drawBoard();if(state.mode!=="practice"&&state.score===0){setTimeout(finishGame,700);return}if(state.darts.length>=3)setTimeout(finishTurn,850)}
function throwDart(p){if(state.animating)return;const from=state.start||{x:C,y:C};state.aim=null;hintEl.textContent="💨 飛鏢飛行中...";animateThrow(from,p,()=>commitThrow(p))}
canvas.addEventListener("pointerdown",e=>{if(state.animating)return;e.preventDefault();state.drag=true;state.start=pos(e);state.aim=state.start;canvas.setPointerCapture(e.pointerId);hintEl.textContent="🎯 把準心拖到想射的位置！";drawBoard()});
canvas.addEventListener("pointermove",e=>{if(!state.drag||state.animating)return;const p=pos(e);state.aim={x:Math.max(2,Math.min(418,p.x)),y:Math.max(2,Math.min(418,p.y))};drawBoard()});
canvas.addEventListener("pointerup",e=>{if(!state.drag||state.animating)return;state.drag=false;const p=pos(e),tx=Math.max(2,Math.min(418,p.x)),ty=Math.max(2,Math.min(418,p.y));throwDart({x:tx,y:ty})});
canvas.addEventListener("pointercancel",()=>{state.drag=false;state.aim=null;drawBoard()});
document.querySelectorAll(".mode-card").forEach(b=>b.addEventListener("click",()=>newGame(b.dataset.mode)));
document.getElementById("restartBtn").addEventListener("click",()=>newGame(state.mode));document.getElementById("endTurnBtn").addEventListener("click",finishTurn);document.getElementById("againBtn").addEventListener("click",()=>newGame(state.mode));document.getElementById("homeBtn").addEventListener("click",()=>{loadRecords();show("home")});document.getElementById("soundBtn").addEventListener("click",()=>{state.sound=!state.sound;document.getElementById("soundBtn").textContent=state.sound?"🔊":"🔇"});loadRecords();drawBoard();

/* B1 Camera Dart mode */
const cameraScreen=document.getElementById("cameraScreen");
const cameraStage=document.getElementById("cameraStage");
const cameraVideo=document.getElementById("cameraVideo");
const arBoard=document.getElementById("arBoard");
const cameraBoard=document.getElementById("cameraBoard");
const cameraCtx=cameraBoard.getContext("2d");
const cameraHint=document.getElementById("cameraHint");
const cameraScore=document.getElementById("cameraScore");
const cameraDarts=document.getElementById("cameraDarts");
const cameraBadge=document.getElementById("cameraHitBadge");
let cameraStream=null,cameraThrowing=false,cameraBoardSize=260,cameraDrag=null,cameraFacing="user";
const cameraState={score:0,darts:0,marks:[]};

function drawCameraBoard(minimal=cameraThrowing&&!cameraScreen.classList.contains("hit-reveal")){
 const d=devicePixelRatio||1;
 cameraBoard.width=420*d;cameraBoard.height=420*d;
 cameraCtx.setTransform(d,0,0,d,0,0);cameraCtx.clearRect(0,0,420,420);
 const rings=[198,181,151,140,94,82,28,12],fills=["#57c7e8","#fff7df","#ff9b62","#fff7df","#57c7e8","#ff9b62","#ffd84d"];
 if(!minimal){cameraCtx.beginPath();cameraCtx.arc(C,C,198,0,Math.PI*2);cameraCtx.fillStyle="#fff";cameraCtx.fill();for(let i=0;i<6;i++){cameraCtx.beginPath();cameraCtx.arc(C,C,rings[i],0,Math.PI*2);cameraCtx.fillStyle=fills[i];cameraCtx.fill()}}
 for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI*2/20,a2=a+Math.PI*2/20;cameraCtx.beginPath();cameraCtx.moveTo(C,C);cameraCtx.arc(C,C,198,a,a2);cameraCtx.closePath();if(!minimal){cameraCtx.fillStyle=i%2?"#fff7df":"#2f6f9f";cameraCtx.globalAlpha=.13;cameraCtx.fill();cameraCtx.globalAlpha=1}cameraCtx.strokeStyle=minimal?"rgba(255,255,255,.72)":"rgba(41,51,74,.35)";cameraCtx.lineWidth=minimal?2.5:1;cameraCtx.stroke()}
 rings.forEach(r=>{cameraCtx.beginPath();cameraCtx.arc(C,C,r,0,Math.PI*2);cameraCtx.strokeStyle=minimal?"rgba(255,255,255,.82)":"#315a91";cameraCtx.lineWidth=minimal?3:2;cameraCtx.stroke()});
 cameraCtx.beginPath();cameraCtx.arc(C,C,200,0,Math.PI*2);cameraCtx.strokeStyle="#24364b";cameraCtx.lineWidth=5;cameraCtx.stroke();
 cameraCtx.fillStyle=minimal?"rgba(255,255,255,.95)":"#24364b";cameraCtx.font="900 17px Trebuchet MS";cameraCtx.textAlign="center";cameraCtx.textBaseline="middle";
 for(let i=0;i<20;i++){const a=-Math.PI/2+(i+.5)*Math.PI*2/20;cameraCtx.fillText(sectors[i],C+166*Math.cos(a),C+166*Math.sin(a))}
 if(!minimal){cameraCtx.beginPath();cameraCtx.arc(C,C,12,0,Math.PI*2);cameraCtx.fillStyle="#ffd84d";cameraCtx.fill();cameraCtx.strokeStyle="#24364b";cameraCtx.stroke()}
 cameraState.marks.forEach(m=>drawCameraDart(m.x,m.y,m.label));
}
function drawCameraDart(x,y,label){
 cameraCtx.save();cameraCtx.translate(x,y);cameraCtx.rotate(-.35);cameraCtx.shadowColor="rgba(0,0,0,.35)";cameraCtx.shadowBlur=5;
 cameraCtx.strokeStyle="#17283b";cameraCtx.lineWidth=3;cameraCtx.beginPath();cameraCtx.moveTo(-27,0);cameraCtx.lineTo(12,0);cameraCtx.stroke();
 cameraCtx.fillStyle="#aeb8c1";cameraCtx.fillRect(-4,-3,18,6);
 cameraCtx.fillStyle="#26384a";cameraCtx.beginPath();cameraCtx.moveTo(12,-3);cameraCtx.lineTo(26,0);cameraCtx.lineTo(12,3);cameraCtx.closePath();cameraCtx.fill();
 cameraCtx.fillStyle="#ff8068";cameraCtx.beginPath();cameraCtx.moveTo(-17,-5);cameraCtx.lineTo(-29,-9);cameraCtx.lineTo(-23,0);cameraCtx.lineTo(-29,9);cameraCtx.lineTo(-17,5);cameraCtx.closePath();cameraCtx.fill();cameraCtx.restore();
 if(label){cameraCtx.fillStyle="#29334a";cameraCtx.font="900 13px Trebuchet MS";cameraCtx.textAlign="center";cameraCtx.fillText(label,x,y-16)}
}
function updateCameraHud(){cameraScore.textContent="練習 "+cameraState.score+" 分";cameraDarts.textContent=cameraState.darts+" / 3 鏢"}
function startCameraMode(){
 show("camera");cameraState.score=0;cameraState.darts=0;cameraState.marks=[];cameraThrowing=false;updateCameraHud();drawCameraBoard();resetCameraBoard();
 cameraScreen.classList.remove("throwing");document.getElementById("cameraThrowMode").textContent="開始體感投鏢 🎯";
 cameraHint.textContent="📷 請按「開啟相機」，瀏覽器會詢問相機權限。";
 document.getElementById("openCameraBtn").style.display="block";
}
async function requestCamera(){
 const btn=document.getElementById("openCameraBtn");
 btn.disabled=true;btn.textContent="📷 正在開啟相機…";
 cameraHint.textContent="正在向瀏覽器要求相機權限…";
 try{
  if(!window.isSecureContext)throw Object.assign(new Error("insecure"),{name:"SecurityError"});
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw Object.assign(new Error("unsupported"),{name:"NotSupportedError"});
  stopCamera();
  cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:cameraFacing}},audio:false});
  cameraVideo.srcObject=cameraStream;await cameraVideo.play();cameraStage.classList.add("ready");cameraStage.classList.toggle("selfie",cameraFacing==="user");
  cameraHint.textContent="✅ 相機已開啟！拖曳飛鏢靶調整位置，再開始投鏢。";
  btn.style.display="none";
 }catch(err){
  cameraStage.classList.remove("ready");btn.disabled=false;btn.textContent="📷 再試一次開啟相機";
  const n=err&&err.name?err.name:"UnknownError";
  if(n==="NotAllowedError")cameraHint.textContent="🚫 相機權限被拒絕。請到瀏覽器網址列的網站權限，把「相機」改成允許後再試。";
  else if(n==="NotFoundError")cameraHint.textContent="📷 找不到可用相機。電腦若沒有鏡頭會出現這個狀況。";
  else if(n==="NotReadableError")cameraHint.textContent="📷 相機目前被其他程式占用，請關閉其他使用鏡頭的程式後再試。";
  else if(n==="SecurityError")cameraHint.textContent="🔒 目前不是安全連線。Camera 模式必須使用 HTTPS 的 GitHub Pages 網址。";
  else if(n==="NotSupportedError")cameraHint.textContent="📷 這個瀏覽器不支援網頁相機功能，請改用最新版 Chrome / Safari / Edge。";
  else cameraHint.textContent="📷 相機啟動失敗（"+n+"）。請檢查網站相機權限後再試。";
 }
}
function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}cameraVideo.srcObject=null;cameraStage.classList.remove("ready")}
function resetCameraBoard(){cameraBoardSize=Math.min(280,Math.max(210,cameraStage.clientWidth*.58));arBoard.style.width=cameraBoardSize+"px";arBoard.style.height=cameraBoardSize+"px";arBoard.style.left="50%";arBoard.style.top="50%";arBoard.style.transform="translate(-50%,-50%)"}
function resizeCameraBoard(delta){cameraBoardSize=Math.max(170,Math.min(Math.min(360,cameraStage.clientWidth*.82),cameraBoardSize+delta));arBoard.style.width=cameraBoardSize+"px";arBoard.style.height=cameraBoardSize+"px"}
function cameraPoint(e){const r=cameraBoard.getBoundingClientRect();return{x:(e.clientX-r.left)*420/r.width,y:(e.clientY-r.top)*420/r.height}}
let cameraEpoch=0;
window.cuteDartResetCameraTimers=()=>{cameraEpoch++};
function cameraThrow(p){
 const epoch=cameraEpoch;
 const h=hitScore(p.x,p.y);cameraState.score+=h.score;cameraState.darts++;cameraState.marks.push({x:p.x,y:p.y,label:h.label});cameraScreen.classList.add("hit-reveal");drawCameraBoard(false);updateCameraHud();
 cameraBadge.textContent=h.score?h.label+"!":"MISS";cameraBadge.classList.remove("show");void cameraBadge.offsetWidth;cameraBadge.classList.add("show");
 cameraHint.textContent=h.score?"🎯 "+h.label+" +"+h.score:"💨 MISS！";
 setTimeout(()=>{if(epoch!==cameraEpoch)return;cameraScreen.classList.remove("hit-reveal");if(cameraThrowing)drawCameraBoard(true)},2050);
 if(h.kind==="bull")beep(920,.11);else if(h.kind==="triple"||h.kind==="double")beep(760,.09);else if(h.kind==="miss")beep(180,.12);else beep(620,.07);
 if(cameraState.darts>=3)setTimeout(()=>{if(epoch!==cameraEpoch)return;cameraState.darts=0;cameraState.marks=[];drawCameraBoard();updateCameraHud();cameraHint.textContent="✨ 新回合！繼續投鏢吧！"},2100);
}
document.getElementById("classicEntry").addEventListener("click",()=>document.getElementById("classicModes").classList.toggle("open"));
document.getElementById("cameraEntry").addEventListener("click",startCameraMode);
document.getElementById("openCameraBtn").addEventListener("click",requestCamera);
document.getElementById("cameraHomeBtn").addEventListener("click",()=>{stopCamera();loadRecords();show("home")});
document.getElementById("smallerBoard").addEventListener("click",()=>resizeCameraBoard(-25));
document.getElementById("biggerBoard").addEventListener("click",()=>resizeCameraBoard(25));
document.getElementById("resetBoard").addEventListener("click",resetCameraBoard);
document.getElementById("flipCamera").addEventListener("click",async()=>{cameraFacing=cameraFacing==="user"?"environment":"user";await requestCamera()});
document.getElementById("cameraThrowMode").addEventListener("click",()=>{
 cameraThrowing=!cameraThrowing;cameraScreen.classList.toggle("throwing",cameraThrowing);cameraScreen.classList.remove("hit-reveal");drawCameraBoard();if(cameraThrowing){document.documentElement.requestFullscreen?.().catch(()=>{})}else if(document.fullscreenElement){document.exitFullscreen?.().catch(()=>{})}
 document.getElementById("cameraThrowMode").textContent=cameraThrowing?"結束體感投鏢 ✋":"開始體感投鏢 🎯";
 cameraHint.textContent=cameraThrowing?"🖐️ 不用碰螢幕：捏住準備、向前投擲並鬆開。":"拖曳飛鏢靶到想放的位置。";
});
arBoard.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(cameraThrowing)return
 const r=arBoard.getBoundingClientRect(),s=cameraStage.getBoundingClientRect();
 cameraDrag={dx:e.clientX-(r.left+r.width/2),dy:e.clientY-(r.top+r.height/2),stage:s};arBoard.setPointerCapture(e.pointerId)
});
arBoard.addEventListener("pointermove",e=>{
 if(!cameraDrag||cameraThrowing)return;
 const s=cameraDrag.stage,half=cameraBoardSize/2;
 const x=Math.max(half,Math.min(s.width-half,e.clientX-s.left-cameraDrag.dx));
 const y=Math.max(half,Math.min(s.height-half,e.clientY-s.top-cameraDrag.dy));
 arBoard.style.left=x+"px";arBoard.style.top=y+"px";arBoard.style.transform="translate(-50%,-50%)";
});
arBoard.addEventListener("pointerup",()=>cameraDrag=null);
arBoard.addEventListener("pointercancel",()=>cameraDrag=null);

window.cuteDartGestureThrow=p=>{if(cameraThrowing)cameraThrow(p)};
