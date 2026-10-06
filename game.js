const canvas=document.getElementById("board"),ctx=canvas.getContext("2d");
const screens={home:document.getElementById("homeScreen"),game:document.getElementById("gameScreen"),result:document.getElementById("resultScreen")};
const scoreEl=document.getElementById("score"),turnEl=document.getElementById("turnScore"),dartEl=document.getElementById("dartCount"),modeEl=document.getElementById("modeLabel"),lastEl=document.getElementById("lastThrow"),hintEl=document.getElementById("hint"),badge=document.getElementById("hitBadge");
const state={mode:"501",score:501,turn:0,darts:[],marks:[],totalDarts:0,bestRound:0,oneEighty:0,drag:false,start:null,aim:null,animating:false,sound:true};\nlet impact=null;
let audioCtx;
const C=210,sectors=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];

function show(n){Object.values(screens).forEach(x=>x.classList.remove("active"));screens[n].classList.add("active")}
function loadRecords(){const r=JSON.parse(localStorage.getItem("cuteDartRecords")||"{}");document.getElementById("bestRoundHome").textContent=r.bestRound||0;document.getElementById("oneEightyHome").textContent=r.oneEighty||0}
function saveRecords(){const r=JSON.parse(localStorage.getItem("cuteDartRecords")||"{}");r.bestRound=Math.max(r.bestRound||0,state.bestRound);r.oneEighty=(r.oneEighty||0)+state.oneEighty;localStorage.setItem("cuteDartRecords",JSON.stringify(r));loadRecords()}
function beep(freq=500,duration=.07){if(!state.sound)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;g.gain.value=.04;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch{}}

function drawBoard(){const d=devicePixelRatio||1;canvas.width=420*d;canvas.height=420*d;ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,420,420);const rings=[198,181,151,140,94,82,28,12],fills=["#57c7e8","#fff7df","#ff9b62","#fff7df","#57c7e8","#ff9b62","#ffd84d"];ctx.beginPath();ctx.arc(C,C,198,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(C,C,rings[i],0,Math.PI*2);ctx.fillStyle=fills[i];ctx.fill()}for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI*2/20,a2=a+Math.PI*2/20;ctx.beginPath();ctx.moveTo(C,C);ctx.arc(C,C,198,a,a2);ctx.closePath();ctx.fillStyle=i%2?"#fff7df":"#2f6f9f";ctx.globalAlpha=.13;ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle="rgba(41,51,74,.35)";ctx.stroke()}[198,181,151,140,94,82,28,12].forEach(r=>{ctx.beginPath();ctx.arc(C,C,r,0,Math.PI*2);ctx.strokeStyle="#315a91";ctx.lineWidth=2;ctx.stroke()});ctx.fillStyle="#24364b";ctx.font="bold 16px Trebuchet MS";ctx.textAlign="center";ctx.textBaseline="middle";for(let i=0;i<20;i++){const a=-Math.PI/2+(i+.5)*Math.PI*2/20;ctx.fillText(sectors[i],C+166*Math.cos(a),C+166*Math.sin(a))}ctx.beginPath();ctx.arc(C,C,18,0,Math.PI*2);ctx.fillStyle="#ffd84d";ctx.fill();ctx.strokeStyle="#24364b";ctx.stroke();state.marks.forEach(m=>drawDart(m.x,m.y,m.label,false,.92));
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