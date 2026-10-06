/* Gesture Dart visual/audio feedback layer */
(() => {
  const stage = document.getElementById("cameraStage");
  if (!stage) return;

  const style = document.createElement("style");
  style.textContent = `
    .camera-turn-results{display:none;position:absolute;z-index:12;right:max(12px,env(safe-area-inset-right));top:50%;transform:translateY(-50%);width:118px;padding:12px 10px;border:2px solid rgba(255,255,255,.46);border-radius:20px;background:rgba(20,35,52,.38);backdrop-filter:blur(5px);color:#fff;pointer-events:none}
    .camera-screen.throwing .camera-turn-results{display:block}
    .camera-turn-results>b{display:block;text-align:center;font-size:17px;margin-bottom:8px;opacity:.78}
    .camera-turn-results .dart-result{margin:7px 0;padding:9px 5px;border-radius:12px;background:rgba(255,255,255,.12);font-size:16px;font-weight:1000;text-align:center;text-shadow:0 2px 2px rgba(0,0,0,.35);opacity:.72}
    .camera-turn-results .dart-result.filled{background:rgba(255,216,77,.20);font-size:20px;opacity:.92}
    .camera-screen.throwing #cameraHitBadge{font-size:clamp(54px,16vw,94px)!important;padding:20px 32px!important}
    @media(max-width:430px){.camera-turn-results{right:7px;width:96px;padding:9px 7px}.camera-turn-results .dart-result{font-size:14px;padding:7px 3px}.camera-turn-results .dart-result.filled{font-size:18px}}
  `;
  document.head.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "camera-turn-results";
  panel.innerHTML = `<b>本回合</b><div class="dart-result" data-slot="0">1　—</div><div class="dart-result" data-slot="1">2　—</div><div class="dart-result" data-slot="2">3　—</div>`;
  stage.appendChild(panel);

  const slots = [...panel.querySelectorAll(".dart-result")];
  let roundResults = [];
  let roundComplete = false;

  function renderResults(){
    slots.forEach((el,i)=>{
      const r=roundResults[i];
      el.textContent = r ? `${i+1}　${r.label}  ${r.score}分` : `${i+1}　—`;
      el.classList.toggle("filled",!!r);
    });
  }
  renderResults();

  if (typeof drawCameraDart === "function") {
    const baseDrawCameraDart = drawCameraDart;
    drawCameraDart = function(x,y,label){
      cameraCtx.save();
      cameraCtx.translate(x,y);
      cameraCtx.scale(1.65,1.65);
      cameraCtx.translate(-x,-y);
      baseDrawCameraDart(x,y,label);
      cameraCtx.restore();
    };
  }

  if (typeof beep === "function") {
    beep = function(freq=500,duration=.09){
      if(!state.sound)return;
      try{
        audioCtx ??= new (window.AudioContext||window.webkitAudioContext)();
        const o=audioCtx.createOscillator(),g=audioCtx.createGain();
        o.type="triangle";
        o.frequency.value=freq;
        g.gain.setValueAtTime(.12,audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);
        o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
      }catch{}
    };
  }

  if (typeof cameraThrow === "function") {
    const baseCameraThrow = cameraThrow;
    cameraThrow = function(p){
      if(roundComplete){roundResults=[];roundComplete=false;renderResults()}
      const hit = hitScore(p.x,p.y);
      baseCameraThrow(p);
      roundResults.push({label:hit.label,score:hit.score});
      if(roundResults.length>=3) roundComplete=true;
      renderResults();
      cameraBadge.textContent = hit.score ? `${hit.label}  +${hit.score}` : "MISS";
      if(navigator.vibrate) navigator.vibrate(hit.kind==="bull" ? [80,45,110] : [70]);
    };
  }
})();
