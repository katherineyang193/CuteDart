/* CuteDart Gesture impact & celebration effects */
(() => {
  const stage=document.getElementById("cameraStage");
  const screen=document.getElementById("cameraScreen");
  const arBoard=document.getElementById("arBoard");
  const big=document.getElementById("gestureBig");
  if(!stage||!screen||!arBoard||!big)return;

  const SECTORS=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];
  const C=210;
  let fxRound=[];
  let fxTimer=0;

  const style=document.createElement("style");
  style.textContent=`
    .target-guide{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;opacity:.92;transition:opacity .18s ease,filter .18s ease}
    .camera-screen.throwing .ar-board{transition:transform .2s ease,filter .2s ease}
    .camera-screen.throwing .camera-stage.fx-ready .ar-board{transform:translate(-50%,-50%) scale(1.12)!important;filter:drop-shadow(0 0 12px rgba(255,90,82,.95)) drop-shadow(0 0 24px rgba(255,216,77,.7))}
    .camera-stage.fx-ready .target-guide{filter:drop-shadow(0 0 5px rgba(255,88,76,.95)) drop-shadow(0 0 11px rgba(255,216,77,.85));opacity:1}
    .camera-stage.fx-throw .target-guide{filter:drop-shadow(0 0 7px rgba(88,199,239,.95));opacity:1}
    .camera-screen.fx-sequence .target-guide{opacity:0}

    .hit-closeup,.result-board-fx{display:none;position:absolute;z-index:30;left:50%;top:50%;transform:translate(-50%,-50%);pointer-events:none}
    .hit-closeup.show{display:block;animation:hitZoomIn .82s cubic-bezier(.18,.9,.25,1) both}
    .hit-closeup .fx-ring{position:relative;width:min(66vw,340px);aspect-ratio:1;border-radius:50%;overflow:hidden;border:6px solid rgba(255,255,255,.96);box-shadow:0 0 0 5px rgba(255,216,77,.8),0 20px 55px rgba(0,0,0,.35)}
    .hit-closeup canvas{width:100%;height:100%;display:block;background:#fff7df}
    .hit-closeup .fx-caption{position:absolute;left:50%;bottom:-58px;transform:translateX(-50%);white-space:nowrap;padding:9px 20px;border-radius:999px;background:rgba(20,35,52,.84);border:3px solid #fff;color:#fff;font-size:clamp(22px,6vw,34px);font-weight:1000;text-shadow:0 2px 0 rgba(0,0,0,.35)}

    .result-board-fx.show{display:block;animation:resultBoardPop 1.45s cubic-bezier(.16,.9,.24,1) both}
    .result-board-fx canvas{display:block;width:min(78vw,460px);height:min(78vw,460px);max-width:64vh;max-height:64vh;border-radius:50%;filter:drop-shadow(0 18px 28px rgba(0,0,0,.38))}
    .result-board-fx .fx-score{position:absolute;left:50%;bottom:-58px;transform:translateX(-50%);white-space:nowrap;padding:10px 22px;border-radius:22px;background:#fff;border:4px solid #ffd84d;color:#29334a;font-size:clamp(28px,8vw,48px);font-weight:1000;box-shadow:0 8px 0 rgba(41,51,74,.22)}

    .celebration-fx{display:none;position:absolute;inset:0;z-index:36;pointer-events:none;overflow:hidden}
    .celebration-fx.show{display:block}
    .celebration-fx::before,.celebration-fx::after{content:"✦  ⚡  ✨  ⚡  ✦";position:absolute;left:50%;transform:translateX(-50%);color:#ffd84d;font-size:clamp(34px,9vw,66px);letter-spacing:10px;text-shadow:0 0 12px #fff,0 0 24px rgba(255,216,77,.9);animation:sparkBurst 1.4s ease both}
    .celebration-fx::before{top:10%}.celebration-fx::after{bottom:12%;animation-delay:.12s}
    .celebrate-text{position:absolute;left:50%;top:13%;transform:translateX(-50%);min-width:70%;text-align:center;color:#fff;font-size:clamp(34px,10vw,72px);font-weight:1000;text-shadow:0 4px 0 #29334a,0 0 18px rgba(255,216,77,.95);animation:celebrateText 1.55s ease both}
    .spark-beast{position:absolute;left:50%;bottom:11%;width:150px;height:142px;transform:translateX(-50%);animation:beastJump 1.55s cubic-bezier(.18,.9,.2,1) both;filter:drop-shadow(0 12px 10px rgba(0,0,0,.28))}
    .spark-beast .body{position:absolute;left:24px;top:36px;width:102px;height:94px;border-radius:52% 52% 45% 45%;background:linear-gradient(145deg,#ffe75d,#ffc83d);border:5px solid #29334a}
    .spark-beast .ear{position:absolute;top:5px;width:34px;height:58px;border-radius:70% 20% 65% 25%;background:#ffe75d;border:5px solid #29334a;transform-origin:bottom center}.spark-beast .ear.l{left:26px;transform:rotate(-25deg)}.spark-beast .ear.r{right:26px;transform:scaleX(-1) rotate(-25deg)}
    .spark-beast .eye{position:absolute;top:38px;width:12px;height:16px;border-radius:50%;background:#29334a}.spark-beast .eye.l{left:25px}.spark-beast .eye.r{right:25px}.spark-beast .eye::after{content:"";position:absolute;left:3px;top:2px;width:4px;height:4px;border-radius:50%;background:#fff}
    .spark-beast .cheek{position:absolute;top:58px;width:20px;height:13px;border-radius:50%;background:#ff8d66}.spark-beast .cheek.l{left:12px}.spark-beast .cheek.r{right:12px}
    .spark-beast .mouth{position:absolute;left:50%;top:63px;width:18px;height:10px;transform:translateX(-50%);border-bottom:4px solid #29334a;border-radius:0 0 50% 50%}
    .spark-beast .bolt{position:absolute;right:-28px;top:62px;width:52px;height:70px;background:#58c7ef;clip-path:polygon(52% 0,100% 0,67% 38%,100% 38%,22% 100%,38% 56%,0 56%);border-radius:5px;filter:drop-shadow(0 0 6px #fff)}
    .spark-beast .star{position:absolute;left:-22px;top:52px;font-size:34px;color:#fff;text-shadow:0 0 10px #ffd84d;animation:spinStar 1s linear infinite}
    .celebration-fx.ultra .spark-beast{width:185px;height:175px}.celebration-fx.ultra .spark-beast .body{transform:scale(1.18);transform-origin:center}.celebration-fx.ultra .celebrate-text{font-size:clamp(44px,13vw,92px)}

    @keyframes hitZoomIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.55)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
    @keyframes resultBoardPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.78)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.18)}80%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.02)}}
    @keyframes beastJump{0%{opacity:0;transform:translate(-50%,80px) scale(.4) rotate(-8deg)}28%{opacity:1;transform:translate(-50%,-26px) scale(1.12) rotate(5deg)}52%{transform:translate(-50%,0) scale(1) rotate(-3deg)}78%{transform:translate(-50%,-12px) scale(1.05) rotate(2deg)}100%{opacity:0;transform:translate(-50%,12px) scale(.96)}}
    @keyframes sparkBurst{0%{opacity:0;transform:translateX(-50%) scale(.35)}22%{opacity:1;transform:translateX(-50%) scale(1.16)}100%{opacity:0;transform:translateX(-50%) scale(1.35)}}
    @keyframes celebrateText{0%{opacity:0;transform:translateX(-50%) scale(.45)}20%{opacity:1;transform:translateX(-50%) scale(1.15)}75%{opacity:1}100%{opacity:0;transform:translateX(-50%) scale(.96)}}
    @keyframes spinStar{to{transform:rotate(360deg)}}
  `;
  document.head.appendChild(style);

  const guide=document.createElement("canvas");guide.className="target-guide";guide.width=420;guide.height=420;arBoard.appendChild(guide);
  const gctx=guide.getContext("2d");

  const closeup=document.createElement("div");closeup.className="hit-closeup";closeup.innerHTML='<div class="fx-ring"><canvas width="320" height="320"></canvas></div><div class="fx-caption"></div>';stage.appendChild(closeup);
  const closeCanvas=closeup.querySelector("canvas"),closeCtx=closeCanvas.getContext("2d"),closeCaption=closeup.querySelector(".fx-caption");

  const finalFx=document.createElement("div");finalFx.className="result-board-fx";finalFx.innerHTML='<canvas width="420" height="420"></canvas><div class="fx-score"></div>';stage.appendChild(finalFx);
  const finalCanvas=finalFx.querySelector("canvas"),finalCtx=finalCanvas.getContext("2d"),finalScore=finalFx.querySelector(".fx-score");

  const celebrate=document.createElement("div");celebrate.className="celebration-fx";celebrate.innerHTML='<div class="celebrate-text"></div><div class="spark-beast"><div class="ear l"></div><div class="ear r"></div><div class="body"><div class="eye l"></div><div class="eye r"></div><div class="cheek l"></div><div class="cheek r"></div><div class="mouth"></div></div><div class="bolt"></div><div class="star">✦</div></div>';stage.appendChild(celebrate);
  const celebrateText=celebrate.querySelector(".celebrate-text");

  function strokeLine(ctx,path,color,width){ctx.save();ctx.strokeStyle="rgba(20,35,52,.72)";ctx.lineWidth=width+3;ctx.stroke(path);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(path);ctx.restore()}
  function drawGuide(mode="idle"){
    gctx.clearRect(0,0,420,420);
    const ready=mode==="ready"||mode==="count";
    const throwing=mode==="throw";
    const color=ready?"#ff5b55":throwing?"#8ee8ff":"rgba(255,255,255,.96)";
    const width=ready?4.6:3.3;
    const rings=[198,181,151,140,94,82,28,12];
    rings.forEach(r=>{const p=new Path2D();p.arc(C,C,r,0,Math.PI*2);strokeLine(gctx,p,color,width)});
    for(let i=0;i<20;i++){
      const a=-Math.PI/2+i*Math.PI*2/20;
      const p=new Path2D();p.moveTo(C,C);p.lineTo(C+198*Math.cos(a),C+198*Math.sin(a));strokeLine(gctx,p,color,ready?3.2:2.2);
    }
    gctx.save();gctx.textAlign="center";gctx.textBaseline="middle";gctx.font="900 19px Trebuchet MS";gctx.fillStyle=color;gctx.shadowColor="#182536";gctx.shadowBlur=5;
    for(let i=0;i<20;i++){const a=-Math.PI/2+(i+.5)*Math.PI*2/20;gctx.fillText(SECTORS[i],C+166*Math.cos(a),C+166*Math.sin(a))}
    gctx.restore();
  }

  function drawBoard(ctx,hit=null){
    ctx.clearRect(0,0,420,420);
    const rings=[198,181,151,140,94,82,28,12];
    ctx.save();ctx.beginPath();ctx.arc(C,C,202,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.clip();
    for(let i=0;i<20;i++){
      const a=-Math.PI/2+i*Math.PI*2/20,a2=a+Math.PI*2/20;
      const n=i%2;
      ctx.beginPath();ctx.moveTo(C,C);ctx.arc(C,C,198,a,a2);ctx.closePath();ctx.fillStyle=n?"#fff7df":"#315a91";ctx.fill();
    }
    [[181,198,"#58c7ef"],[140,151,"#ff9b62"],[82,94,"#ffd84d"]].forEach(([inner,outer,color])=>{
      ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(C,C,outer,0,Math.PI*2);ctx.arc(C,C,inner,0,Math.PI*2,true);ctx.fillStyle=color;ctx.fill("evenodd");ctx.globalAlpha=1;
    });
    ctx.beginPath();ctx.arc(C,C,28,0,Math.PI*2);ctx.fillStyle="#58c7ef";ctx.fill();ctx.beginPath();ctx.arc(C,C,12,0,Math.PI*2);ctx.fillStyle="#ffd84d";ctx.fill();
    for(let i=0;i<20;i++){const a=-Math.PI/2+i*Math.PI*2/20;ctx.beginPath();ctx.moveTo(C,C);ctx.lineTo(C+198*Math.cos(a),C+198*Math.sin(a));ctx.strokeStyle="rgba(41,51,74,.58)";ctx.lineWidth=1.4;ctx.stroke()}
    rings.forEach(r=>{ctx.beginPath();ctx.arc(C,C,r,0,Math.PI*2);ctx.strokeStyle="#29334a";ctx.lineWidth=2;ctx.stroke()});
    ctx.restore();
    ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 18px Trebuchet MS";ctx.fillStyle="#29334a";for(let i=0;i<20;i++){const a=-Math.PI/2+(i+.5)*Math.PI*2/20;ctx.fillText(SECTORS[i],C+166*Math.cos(a),C+166*Math.sin(a))}ctx.restore();
    if(hit){
      ctx.save();ctx.strokeStyle="#ff5b55";ctx.lineWidth=6;ctx.shadowColor="#ffd84d";ctx.shadowBlur=16;ctx.beginPath();ctx.arc(hit.x,hit.y,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(hit.x,hit.y,5,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(hit.x,hit.y);ctx.rotate(-.35);ctx.scale(1.7,1.7);ctx.strokeStyle="#17283b";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-27,0);ctx.lineTo(12,0);ctx.stroke();ctx.fillStyle="#aeb8c1";ctx.fillRect(-4,-3,18,6);ctx.fillStyle="#26384a";ctx.beginPath();ctx.moveTo(12,-3);ctx.lineTo(26,0);ctx.lineTo(12,3);ctx.closePath();ctx.fill();ctx.fillStyle="#ff9b62";ctx.beginPath();ctx.moveTo(-17,-5);ctx.lineTo(-29,-9);ctx.lineTo(-23,0);ctx.lineTo(-29,9);ctx.lineTo(-17,5);ctx.closePath();ctx.fill();ctx.restore();
    }
  }

  function drawCloseup(hit){
    closeCtx.save();closeCtx.clearRect(0,0,320,320);const zoom=2.45;closeCtx.translate(160,160);closeCtx.scale(zoom,zoom);closeCtx.translate(-hit.x,-hit.y);drawBoard(closeCtx,hit);closeCtx.restore();
  }

  function setModeFromText(){
    const t=big.textContent.trim();
    let mode="idle";
    if(t.includes("READY")||t==="3"||t==="2"||t==="1")mode=t.includes("READY")?"ready":"count";
    else if(t.includes("THROW")||t.includes("投擲中"))mode="throw";
    stage.classList.toggle("fx-ready",mode==="ready"||mode==="count");stage.classList.toggle("fx-throw",mode==="throw");drawGuide(mode);
  }
  new MutationObserver(setModeFromText).observe(big,{childList:true,characterData:true,subtree:true});
  drawGuide("idle");

  function celebrationLabel(hit,total){
    if(total===180)return{label:"180!!",ultra:true,show:true};
    if(hit.label==="T20")return{label:"TRIPLE 20!",ultra:true,show:true};
    if(hit.kind==="bull")return{label:"BULL!",ultra:false,show:true};
    if(hit.score>=50)return{label:"AMAZING!",ultra:false,show:true};
    if(hit.score>=40)return{label:"NICE SHOT!",ultra:false,show:true,small:true};
    return{show:false};
  }

  function runImpact(p,hit){
    clearTimeout(fxTimer);screen.classList.add("fx-sequence");
    drawCloseup(p);closeCaption.textContent=hit.score?`${hit.label} · ${hit.score} 分`:"MISS";closeup.classList.remove("show");void closeup.offsetWidth;closeup.classList.add("show");

    fxRound.push(hit.score);if(fxRound.length>3)fxRound=[hit.score];const total=fxRound.length===3?fxRound.reduce((a,b)=>a+b,0):0;
    const celeb=celebrationLabel(hit,total);

    setTimeout(()=>{
      closeup.classList.remove("show");drawBoard(finalCtx,p);finalScore.textContent=hit.score?`${hit.label}  +${hit.score}`:"MISS";finalFx.classList.remove("show");void finalFx.offsetWidth;finalFx.classList.add("show");
      if(celeb.show){celebrateText.textContent=celeb.label;celebrate.classList.toggle("ultra",!!celeb.ultra);celebrate.classList.remove("show");void celebrate.offsetWidth;celebrate.classList.add("show")}
    },720);

    fxTimer=setTimeout(()=>{closeup.classList.remove("show");finalFx.classList.remove("show");celebrate.classList.remove("show","ultra");screen.classList.remove("fx-sequence");if(fxRound.length===3)fxRound=[];setModeFromText()},2450);
  }

  if(typeof cameraThrow==="function"){
    const baseCameraThrow=cameraThrow;
    cameraThrow=function(p){const hit=hitScore(p.x,p.y);baseCameraThrow(p);runImpact(p,hit)};
  }
})();
