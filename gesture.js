import{HandLandmarker,FilesetResolver}from"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs";

const video=document.getElementById("cameraVideo");
const stage=document.getElementById("cameraStage");
const board=document.getElementById("arBoard");
const stateEl=document.getElementById("gestureState");
const detailEl=document.getElementById("gestureDetail");
const throwBtn=document.getElementById("cameraThrowMode");
const overlay=document.getElementById("handOverlay"),octx=overlay.getContext("2d"),big=document.getElementById("gestureBig");
const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
let landmarker=null,running=false,lastVideoTime=-1,lastSample=null,armed=false,armedAt=0,cooldownUntil=0,pinchSince=0,throwStarted=false,maxThrowSpeed=0,lastSeenAt=0,lastTip=null;
const history=[];
let phase="SEARCH",throwDeadline=0,releaseTip=null,releaseVelocity={x:0,y:0};

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function status(main,detail,cls=""){
 stateEl.textContent=main;detailEl.textContent=detail;
 stage.classList.toggle("hand-ready",cls==="ready"||cls==="armed");
 stage.classList.toggle("gesture-armed",cls==="armed");
 big.textContent=main;
}
async function initHands(){
 if(landmarker)return true;
 status("⏳ 載入手勢辨識中…","第一次需要下載手部辨識模型。");
 try{
  const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm");
  landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",delegate:"GPU"},runningMode:"VIDEO",numHands:1,minHandDetectionConfidence:.35,minHandPresenceConfidence:.35,minTrackingConfidence:.35});
  status("🖐️ 手勢辨識已就緒","把投鏢手放進鏡頭。");return true;
 }catch(e){
  try{
   const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm");
   landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"},runningMode:"VIDEO",numHands:1});
   status("🖐️ 手勢辨識已就緒","GPU 不可用，已改用相容模式。");return true;
  }catch(err){status("⚠️ 手勢辨識載入失敗","相機仍可用，但目前無法啟動體感追蹤。");return false}
 }
}
function boardTarget(tip,velocity){
 const sr=stage.getBoundingClientRect(),br=board.getBoundingClientRect();
 const screenX=(1-tip.x)*sr.width,screenY=tip.y*sr.height;
 const projectedX=screenX+velocity.x*150;
 const projectedY=screenY+velocity.y*150;
 return{x:(projectedX-(br.left-sr.left))*420/br.width,y:(projectedY-(br.top-sr.top))*420/br.height};
}
function virtualThrow(tip,velocity){
 const p=boardTarget(tip,velocity);
 const x=Math.max(2,Math.min(418,p.x)),y=Math.max(2,Math.min(418,p.y));
 if(typeof window.cuteDartGestureThrow==="function")window.cuteDartGestureThrow({x,y});
}
function drawHand(lm){
 const r=stage.getBoundingClientRect(),d=devicePixelRatio||1;overlay.width=r.width*d;overlay.height=r.height*d;octx.setTransform(d,0,0,d,0,0);octx.clearRect(0,0,r.width,r.height);
 const pt=i=>({x:(1-lm[i].x)*r.width,y:lm[i].y*r.height});
 octx.lineWidth=5;octx.lineCap="round";octx.strokeStyle="rgba(255,216,77,.95)";links.forEach(([a,b])=>{const p=pt(a),q=pt(b);octx.beginPath();octx.moveTo(p.x,p.y);octx.lineTo(q.x,q.y);octx.stroke()});
 lm.forEach((_,i)=>{const p=pt(i);octx.beginPath();octx.arc(p.x,p.y,i===4||i===8?9:6,0,Math.PI*2);octx.fillStyle=i===4||i===8?"#fff":"#58c7ef";octx.fill();octx.strokeStyle="#29334a";octx.lineWidth=2;octx.stroke()});
 const a=pt(4),b=pt(8);octx.beginPath();octx.arc((a.x+b.x)/2,(a.y+b.y)/2,16,0,Math.PI*2);octx.strokeStyle=armed?"#ffd84d":"rgba(255,255,255,.8)";octx.lineWidth=4;octx.stroke();
}
function clearHand(){octx.clearRect(0,0,overlay.width,overlay.height)}
function processHand(lm,now){
 drawHand(lm);
 const thumb=lm[4],index=lm[8],wrist=lm[0],middleMcp=lm[9];
 const palm=Math.max(.035,dist(wrist,middleMcp));
 const pinch=dist(thumb,index)/palm;
 const sample={t:now,x:index.x,y:index.y,z:index.z||0};
 lastSeenAt=now;lastTip=index;
 history.push(sample);while(history.length&&now-history[0].t>300)history.shift();
 const old=history[0]||sample,dt=Math.max(16,now-old.t);
 const vx=(sample.x-old.x)/(dt/1000),vy=(sample.y-old.y)/(dt/1000),vz=(sample.z-old.z)/(dt/1000);
 const speed=Math.hypot(vx,vy,vz*.55);

 if(now<cooldownUntil){status("✨ 命中確認","準備下一鏢…","ready");return}

 if(phase==="SEARCH"){
  status("✋ 手已鎖定","把手放在畫面中央的投擲區。","ready");
  if(pinch<1.0){phase="READY";armed=true;armedAt=now;status("🤏 READY","已持鏢。接下來直接自然投擲。","armed")}
  return;
 }
 if(phase==="READY"){
  status("🤏 READY","保持持鏢，直接自然投擲。","armed");
  if(speed>.16){phase="THROW";throwStarted=true;throwDeadline=now+700;releaseTip=index;releaseVelocity={x:vx,y:vy};status("💨 投擲中","已鎖定投擲，現在鬆手即可！","armed")}
  return;
 }
 if(phase==="THROW"){
  releaseTip=index;releaseVelocity={x:vx,y:vy};status("💨 投擲中","已鎖定，不會退回 AIM。鬆手！","armed");
  if(pinch>1.05||now>=throwDeadline){
   phase="COOLDOWN";armed=false;throwStarted=false;cooldownUntil=now+900;status("🎯 THROW！","投擲完成！","ready");
   virtualThrow(releaseTip,releaseVelocity);if(navigator.vibrate)navigator.vibrate(45);
   setTimeout(()=>{if(running){phase="SEARCH";status("✋ 下一鏢","手放回投擲區即可。","ready")}},900);
  }
 }
}
function loop(){
 if(!running)return;
 if(landmarker&&video.readyState>=2&&video.currentTime!==lastVideoTime){
  lastVideoTime=video.currentTime;
  try{
   const result=landmarker.detectForVideo(video,performance.now());
   if(result.landmarks?.length)processHand(result.landmarks[0],performance.now());
   else{
    const now=performance.now();
    if(phase==="THROW"&&releaseTip&&now-lastSeenAt<420){
     phase="COOLDOWN";armed=false;throwStarted=false;cooldownUntil=now+900;status("🎯 THROW！","快速投擲離開追蹤區，判定成功。","ready");
     virtualThrow(releaseTip,releaseVelocity);if(navigator.vibrate)navigator.vibrate(45);
     setTimeout(()=>{if(running)phase="SEARCH"},900);
    }else if(now-lastSeenAt>500&&phase!=="THROW"){clearHand();phase="SEARCH";armed=false;status("🖐️ 手放進投擲區","對準畫面中央的大框即可。")}
   }
  }catch{}
 }
 requestAnimationFrame(loop);
}
async function startTracking(){
 if(!video.srcObject){status("📷 請先開啟相機","相機成功後才能辨識空中投擲。");return}
 const ok=await initHands();if(!ok)return;
 running=true;armed=false;phase="SEARCH";history.length=0;status("🖐️ 尋找投鏢手","把手放進鏡頭，拇指與食指捏合準備。");requestAnimationFrame(loop);
}
function stopTracking(){running=false;armed=false;phase="SEARCH";pinchSince=0;throwStarted=false;history.length=0;clearHand();big.textContent="🖐️ 準備";stage.classList.remove("hand-ready","gesture-armed")}
throwBtn.addEventListener("click",()=>{setTimeout(()=>{if(document.getElementById("cameraScreen").classList.contains("throwing"))startTracking();else stopTracking()},0)});
document.getElementById("cameraHomeBtn").addEventListener("click",stopTracking);
