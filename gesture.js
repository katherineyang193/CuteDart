import{HandLandmarker,FilesetResolver}from"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs";

const video=document.getElementById("cameraVideo");
const stage=document.getElementById("cameraStage");
const board=document.getElementById("arBoard");
const stateEl=document.getElementById("gestureState");
const detailEl=document.getElementById("gestureDetail");
const throwBtn=document.getElementById("cameraThrowMode");
let landmarker=null,running=false,lastVideoTime=-1,lastSample=null,armed=false,armedAt=0,cooldownUntil=0;
const history=[];

const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function status(main,detail,cls=""){
 stateEl.textContent=main;detailEl.textContent=detail;
 stage.classList.toggle("hand-ready",cls==="ready"||cls==="armed");
 stage.classList.toggle("gesture-armed",cls==="armed");
}
async function initHands(){
 if(landmarker)return true;
 status("⏳ 載入手勢辨識中…","第一次需要下載手部辨識模型。");
 try{
  const vision=await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm");
  landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",delegate:"GPU"},runningMode:"VIDEO",numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.5});
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
function processHand(lm,now){
 const thumb=lm[4],index=lm[8],wrist=lm[0],middleMcp=lm[9];
 const palm=Math.max(.035,dist(wrist,middleMcp));
 const pinch=dist(thumb,index)/palm;
 const sample={t:now,x:index.x,y:index.y,z:index.z||0};
 history.push(sample);while(history.length&&now-history[0].t>220)history.shift();
 const old=history[0]||sample,dt=Math.max(16,now-old.t);
 const vx=(sample.x-old.x)/(dt/1000),vy=(sample.y-old.y)/(dt/1000),vz=(sample.z-old.z)/(dt/1000);
 const speed=Math.hypot(vx,vy,vz*.65);
 if(!armed&&pinch<.72&&now>cooldownUntil){armed=true;armedAt=now;status("🤏 READY","已偵測持鏢姿勢，做出自然投擲並鬆開手指。","armed");return}
 if(armed){
  if(pinch<.95){status("🎯 AIM","保持捏合，向前做投鏢動作。","armed");return}
  if(now-armedAt>120&&speed>.32){
   armed=false;cooldownUntil=now+900;status("💨 THROW！","已偵測 Release，虛擬飛鏢出手！","ready");
   virtualThrow(index,{x:vx,y:vy});if(navigator.vibrate)navigator.vibrate(45);return
  }
  if(now-armedAt>2500){armed=false;status("🖐️ 重新準備","剛才沒有偵測到明確投擲，重新捏住即可。","ready")}
 }
 else status("✋ 已偵測到手","拇指與食指捏合，模擬握住飛鏢。","ready");
}
function loop(){
 if(!running)return;
 if(landmarker&&video.readyState>=2&&video.currentTime!==lastVideoTime){
  lastVideoTime=video.currentTime;
  try{
   const result=landmarker.detectForVideo(video,performance.now());
   if(result.landmarks?.length)processHand(result.landmarks[0],performance.now());
   else{armed=false;history.length=0;status("🖐️ 尋找投鏢手","把手放在鏡頭前，手腕與手指盡量完整入鏡。")}
  }catch{}
 }
 requestAnimationFrame(loop);
}
async function startTracking(){
 if(!video.srcObject){status("📷 請先開啟相機","相機成功後才能辨識空中投擲。");return}
 const ok=await initHands();if(!ok)return;
 running=true;armed=false;history.length=0;status("🖐️ 尋找投鏢手","把手放進鏡頭，拇指與食指捏合準備。");requestAnimationFrame(loop);
}
function stopTracking(){running=false;armed=false;history.length=0;stage.classList.remove("hand-ready","gesture-armed")}
throwBtn.addEventListener("click",()=>{setTimeout(()=>{if(document.getElementById("cameraScreen").classList.contains("throwing"))startTracking();else stopTracking()},0)});
document.getElementById("cameraHomeBtn").addEventListener("click",stopTracking);
