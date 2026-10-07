import{HandLandmarker,FilesetResolver}from"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs";

const video=document.getElementById("cameraVideo");
const stage=document.getElementById("cameraStage");
const board=document.getElementById("arBoard");
const stateEl=document.getElementById("gestureState");
const detailEl=document.getElementById("gestureDetail");
const throwBtn=document.getElementById("cameraThrowMode");
const overlay=document.getElementById("handOverlay"),octx=overlay.getContext("2d"),big=document.getElementById("gestureBig");
const throwZone=document.querySelector(".throw-zone");
const throwZoneLabel=throwZone?.querySelector("span");
const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

const distanceChip=document.createElement("div");distanceChip.className="distance-chip";distanceChip.textContent="📏 等待手部距離";stage.appendChild(distanceChip);
let landmarker=null,running=false,lastVideoTime=-1,lastSeenAt=0,lastLm=null,lastSample=null;
let phase="SEARCH",openSince=0,countdownStart=0,throwStart=0,resultUntil=0,resetSince=0;
let throwBase=null,motionStarted=false,motionStartedAt=0,peakSample=null;
const history=[];

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function status(main,detail="",cls=""){
 stateEl.textContent=main;detailEl.textContent=detail;
 stage.classList.toggle("hand-ready",cls==="ready"||cls==="armed");
 stage.classList.toggle("gesture-armed",cls==="armed");
 big.textContent=main;
}
function updateDistance(lm){
 const palmSpan=dist(lm[5],lm[17]),handHeight=dist(lm[0],lm[12]),size=Math.max(palmSpan*1.65,handHeight);
 distanceChip.classList.remove("good","warn","bad");
 if(size>.48){distanceChip.textContent="📏 稍近｜仍可遊玩";distanceChip.classList.add("warn")}
 else if(size>.19){distanceChip.textContent="✅ 距離適合";distanceChip.classList.add("good")}
 else if(size>.12){distanceChip.textContent="📏 稍遠｜仍可遊玩";distanceChip.classList.add("warn")}
 else{distanceChip.textContent="📏 距離較遠｜辨識可能不穩";distanceChip.classList.add("bad")}
}
function zone(mode="idle"){
 if(!throwZone)return;
 const map={idle:["rgba(255,255,255,.58)","投擲區"],ready:["#ffd84d","READY"],count:["#ffd84d","倒數中"],throw:["#58c7ef","THROW"],result:["rgba(255,255,255,.35)","結果展示"]};
 const [color,label]=map[mode]||map.idle;
 throwZone.style.borderColor=color;
 throwZone.style.boxShadow=mode==="throw"?"inset 0 0 34px rgba(88,199,239,.34),0 0 26px rgba(88,199,239,.42)":mode==="ready"||mode==="count"?"inset 0 0 28px rgba(255,216,77,.22),0 0 20px rgba(255,216,77,.26)":"inset 0 0 0 2px rgba(88,199,239,.18)";
 if(throwZoneLabel)throwZoneLabel.textContent=label;
}
async function initHands(){
 if(landmarker)return true;
 status("⏳ 載入手勢辨識中…","第一次需要下載手部辨識模型。");
 try{
  const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm");
  landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",delegate:"GPU"},runningMode:"VIDEO",numHands:1,minHandDetectionConfidence:.35,minHandPresenceConfidence:.35,minTrackingConfidence:.35});
  status("🖐️ 手勢辨識已就緒","五指張開放進投擲區即可開始。");return true;
 }catch(e){
  try{
   const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm");
   landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"},runningMode:"VIDEO",numHands:1,minHandDetectionConfidence:.35,minHandPresenceConfidence:.35,minTrackingConfidence:.35});
   status("🖐️ 手勢辨識已就緒","相容模式：五指張開即可準備。");return true;
  }catch(err){status("⚠️ 手勢辨識載入失敗","相機仍可用，但目前無法啟動體感追蹤。");return false}
 }
}
function boardTarget(tip,velocity){
 const sr=stage.getBoundingClientRect(),br=board.getBoundingClientRect();
 const screenX=(1-tip.x)*sr.width,screenY=tip.y*sr.height;
 const projectedX=screenX-velocity.x*120;
 const projectedY=screenY+velocity.y*120;
 return{x:(projectedX-(br.left-sr.left))*420/br.width,y:(projectedY-(br.top-sr.top))*420/br.height};
}
function virtualThrow(tip,velocity){
 const p=boardTarget(tip,velocity);
 const x=Math.max(2,Math.min(418,p.x)),y=Math.max(2,Math.min(418,p.y));
 if(typeof window.cuteDartGestureThrow==="function")window.cuteDartGestureThrow({x,y});
}
function isOpenPalm(lm){
 const wrist=lm[0];
 const fingers=[[8,6],[12,10],[16,14],[20,18]];
 let open=fingers.reduce((n,[tip,pip])=>n+(dist(wrist,lm[tip])>dist(wrist,lm[pip])*1.08?1:0),0);
 if(dist(wrist,lm[4])>dist(wrist,lm[2])*1.08)open++;
 return open>=4;
}
function handInZone(lm){const p=lm[9],x=1-p.x,y=p.y;return x>=.14&&x<=.86&&y>=.22&&y<=.84}
function drawHand(lm){
 const r=stage.getBoundingClientRect(),d=devicePixelRatio||1;overlay.width=r.width*d;overlay.height=r.height*d;octx.setTransform(d,0,0,d,0,0);octx.clearRect(0,0,r.width,r.height);
 const pt=i=>({x:(1-lm[i].x)*r.width,y:lm[i].y*r.height});const palmOpen=isOpenPalm(lm);
 octx.lineWidth=5;octx.lineCap="round";octx.strokeStyle=palmOpen?"rgba(255,216,77,.98)":"rgba(88,199,239,.9)";
 links.forEach(([a,b])=>{const p=pt(a),q=pt(b);octx.beginPath();octx.moveTo(p.x,p.y);octx.lineTo(q.x,q.y);octx.stroke()});
 lm.forEach((_,i)=>{const p=pt(i);octx.beginPath();octx.arc(p.x,p.y,[4,8,12,16,20].includes(i)?8:5.5,0,Math.PI*2);octx.fillStyle=palmOpen?"#ffd84d":"#58c7ef";octx.fill();octx.strokeStyle="#29334a";octx.lineWidth=2;octx.stroke()});
}
function clearHand(){octx.clearRect(0,0,overlay.width,overlay.height)}
function makeSample(lm,now){
 const i=lm[8],w=lm[0],palm=dist(lm[5],lm[17]);const s={t:now,tip:i,wrist:w,palm,ix:i.x,iy:i.y,iz:i.z||0,wx:w.x,wy:w.y,wz:w.z||0};history.push(s);while(history.length&&now-history[0].t>280)history.shift();const old=history[0]||s,dt=Math.max(16,now-old.t)/1000;const iv={x:(s.ix-old.ix)/dt,y:(s.iy-old.iy)/dt,z:(s.iz-old.iz)/dt};const wv={x:(s.wx-old.wx)/dt,y:(s.wy-old.wy)/dt,z:(s.wz-old.wz)/dt};s.velocity=iv;s.speed=Math.max(Math.hypot(iv.x,iv.y,iv.z*.45),Math.hypot(wv.x,wv.y,wv.z*.45));if(throwBase){const id=Math.hypot(s.ix-throwBase.ix,s.iy-throwBase.iy,(s.iz-throwBase.iz)*.4),wd=Math.hypot(s.wx-throwBase.wx,s.wy-throwBase.wy,(s.wz-throwBase.wz)*.4);s.displacement=Math.max(id,wd);s.depthChange=Math.abs((s.palm/(throwBase.palm||s.palm))-1)}else{s.displacement=0;s.depthChange=0}return s;
}
function startCountdown(now){phase="COUNTDOWN";countdownStart=now;openSince=0;history.length=0;zone("count");status("3","保持位置，倒數後再投！","armed")}
function startThrowWindow(now){phase="THROW";throwStart=now;throwBase=lastSample;motionStarted=false;motionStartedAt=0;peakSample=null;history.length=0;zone("throw");status("🎯 THROW！","現在做自然投擲動作！","armed");if(navigator.vibrate)navigator.vibrate(35)}
function finishThrow(now,sample){
 if(!sample)return;phase="RESULT";zone("result");status("🎯 判定完成","請看本鏢結果。","ready");virtualThrow(sample.tip,sample.velocity||{x:0,y:0});const hold=Math.max(5000,Number(window.cuteDartResultHoldMs)||5000);resultUntil=performance.now()+hold;if(navigator.vibrate)navigator.vibrate(55)
}
function failThrow(now){phase="RESULT";resultUntil=now+1300;zone("result");status("↩️ 沒抓到投擲","這鏢不計分，放下手後再張開準備。","ready")}
function processHand(lm,now){
 lastSeenAt=now;lastLm=lm;drawHand(lm);updateDistance(lm);lastSample=makeSample(lm,now);const open=isOpenPalm(lm),inside=handInZone(lm);
 if(phase==="SEARCH"){
  if(!inside){openSince=0;zone("idle");status("↔️ 手移入投擲區","距離提示僅供參考，只要能辨識就可以遊玩。","ready");return}
  if(!open){openSince=0;zone("idle");status("🖐️ 辨識手勢","張開五指準備投擲。","ready");return}
  zone("ready");status("✅ READY","預備…","armed");if(!openSince)openSince=now;if(now-openSince>=320)startCountdown(now);return;
 }
 if(phase==="THROW"){
  const elapsed=now-throwStart,s=lastSample;if(elapsed<120)return;const strongMove=(s.speed>.26&&s.displacement>.022)||(s.depthChange>.09&&s.speed>.12);
  if(!motionStarted&&strongMove){motionStarted=true;motionStartedAt=now;peakSample=s;status("💨 投擲中","飛鏢出手！","armed")}
  if(motionStarted){if(!peakSample||s.speed>peakSample.speed)peakSample=s;const since=now-motionStartedAt;if((since>170&&s.speed<(peakSample.speed*.62))||since>360)finishThrow(now,peakSample||s)}return;
 }
 if(phase==="RESET"){if(!open){if(!resetSince)resetSince=now;if(now-resetSince>280){phase="SEARCH";resetSince=0;openSince=0;zone("idle");status("🖐️ 下一鏢","重新張開五指即可開始。","ready")}}else resetSince=0}
}
function tick(now){
 if(phase==="COUNTDOWN"){const e=now-countdownStart;if(e<650)status("3","倒數後再投！","armed");else if(e<1300)status("2","準備…","armed");else if(e<1950)status("1","準備投擲！","armed");else if(lastSample&&now-lastSeenAt<550)startThrowWindow(now);else{phase="SEARCH";zone("idle");status("🖐️ 找不到手","重新張開手掌放進投擲區。","ready")}}
 if(phase==="THROW"&&now-throwStart>1350&&!motionStarted)failThrow(now);
 if(phase==="RESULT"&&now>=resultUntil){phase="RESET";resetSince=0;zone("idle");status("✋ 放下手","先收手，再重新張開準備下一鏢。","ready")}
}
function handleLost(now){
 clearHand();if(phase==="SEARCH"){openSince=0;if(now-lastSeenAt>350){status("🖐️ 找手中","張開五指並放進投擲區。","ready");distanceChip.textContent="📏 等待手部距離";distanceChip.className="distance-chip"}return}
 if(phase==="COUNTDOWN"&&now-lastSeenAt>550){phase="SEARCH";openSince=0;zone("idle");status("🖐️ 手離開太久","重新張開手掌準備。","ready");return}
 if(phase==="THROW"&&motionStarted&&peakSample&&now-lastSeenAt<430){finishThrow(now,peakSample);return}
 if(phase==="RESET"&&now-lastSeenAt>300){phase="SEARCH";resetSince=0;zone("idle");status("🖐️ 下一鏢","張開五指即可重新倒數。","ready")}
}
function loop(){if(!running)return;const now=performance.now();if(landmarker&&video.readyState>=2&&video.currentTime!==lastVideoTime){lastVideoTime=video.currentTime;try{const result=landmarker.detectForVideo(video,now);if(result.landmarks?.length)processHand(result.landmarks[0],now);else handleLost(now)}catch{}}tick(now);requestAnimationFrame(loop)}
async function startTracking(){if(!video.srcObject){status("📷 請先開啟相機","相機成功後才能辨識空中投擲。");return}const ok=await initHands();if(!ok)return;running=true;phase="SEARCH";openSince=0;countdownStart=0;throwStart=0;resultUntil=0;resetSince=0;throwBase=null;motionStarted=false;peakSample=null;history.length=0;zone("idle");status("🖐️ 辨識手勢","把張開的手掌放進投擲區。","ready");requestAnimationFrame(loop)}
function stopTracking(){running=false;phase="SEARCH";openSince=0;history.length=0;clearHand();zone("idle");big.textContent="🖐️ 準備";stage.classList.remove("hand-ready","gesture-armed");distanceChip.textContent="📏 等待手部距離";distanceChip.className="distance-chip"}
throwBtn.addEventListener("click",()=>{setTimeout(()=>{if(document.getElementById("cameraScreen").classList.contains("throwing"))startTracking();else stopTracking()},0)});document.getElementById("cameraHomeBtn").addEventListener("click",stopTracking);
