/* Local multiplayer character-select layer for Gesture Dart */
(() => {
  const home=document.getElementById("homeScreen"),grid=home?.querySelector(".play-style-grid"),stage=document.getElementById("cameraStage");
  if(!home||!grid||!stage)return;

  const CHARS=window.CuteDartCharacters;
  const style=document.createElement("style");style.textContent=`
    .play-style-card.multi-entry{background:linear-gradient(145deg,#fff2bd,#dff6ff)}
    .multi-setup{display:none;margin:12px 0 14px;padding:16px;border:4px solid #fff;border-radius:24px;background:rgba(255,248,232,.97);box-shadow:var(--shadow)}.multi-setup.open{display:block}.multi-setup h3{margin:0 0 12px;text-align:center;color:var(--dark);font-size:22px}.multi-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0}.multi-stepper,.multi-modes{display:flex;gap:7px}.multi-stepper button,.multi-modes button{border:2px solid #fff;border-radius:12px;background:#e8f7ff;color:var(--dark);font-weight:1000;min-width:44px;min-height:40px;box-shadow:0 3px 0 rgba(41,51,74,.12)}.multi-modes button.active{background:var(--yellow)}
    .character-pick-title{margin:14px 0 8px;font-weight:1000;text-align:center;color:var(--dark)}.character-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.character-card{position:relative;border:3px solid #fff;border-radius:18px;background:#fff;padding:10px 8px;text-align:center;box-shadow:0 5px 0 rgba(41,51,74,.1);cursor:pointer;transition:.15s}.character-card:hover{transform:translateY(-2px)}.character-card.used{opacity:.36;filter:grayscale(.65);pointer-events:none}.character-avatar{width:92px;height:150px;margin:0 auto 7px;border-radius:24px;overflow:hidden;border:4px solid var(--char);background:#fff;box-shadow:0 5px 12px rgba(41,51,74,.15)}.character-avatar img{width:100%;height:100%;display:block;object-fit:contain}.character-card b{display:block;font-size:18px}.character-card small{display:block;margin-top:3px;font-weight:800}.seat-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.seat{padding:8px;border-radius:12px;background:#edf4f7;text-align:center;font-weight:900}.seat.filled{background:var(--seat);color:#24364b}.seat.active-pick{outline:3px solid #58c7ef}.seat img{width:30px;height:30px;border-radius:9px;vertical-align:middle;margin-right:5px;border:2px solid #fff}
    .multi-player-board{display:none;position:absolute;z-index:17;left:max(10px,env(safe-area-inset-left));top:50%;transform:translateY(-50%);width:168px;padding:10px;border:2px solid rgba(255,255,255,.45);border-radius:20px;background:rgba(20,35,52,.42);backdrop-filter:blur(5px);color:#fff;pointer-events:none}.camera-screen.throwing.multiplayer-active .multi-player-board{display:block}.multi-player{display:grid;grid-template-columns:46px 1fr;gap:8px;align-items:center;padding:8px 7px;margin:6px 0;border-radius:12px;background:rgba(255,255,255,.12);font-weight:900;opacity:.7}.multi-player.active{outline:3px solid var(--pc);background:rgba(255,255,255,.2);opacity:1;transform:scale(1.04)}.multi-player .avatar{width:42px;height:42px;border-radius:12px;overflow:hidden;border:2px solid #fff}.multi-player .avatar img{width:100%;height:100%;object-fit:contain}.multi-player span{display:block;font-size:12px}.multi-player strong{display:block;font-size:21px}.multi-turn-banner{display:none;position:absolute;z-index:40;left:50%;top:52%;transform:translate(-50%,-50%);min-width:58%;padding:18px 24px;border-radius:26px;background:rgba(20,35,52,.86);border:4px solid #fff;color:#fff;text-align:center;font-size:clamp(30px,9vw,58px);font-weight:1000;text-shadow:0 3px 0 rgba(0,0,0,.35);pointer-events:none}.multi-turn-banner.show{display:block;animation:multiPop 1.8s ease both}@keyframes multiPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(.98)}}
    @media(max-width:700px){.character-grid{grid-template-columns:1fr 1fr}.seat-strip{grid-template-columns:1fr 1fr}}@media(max-width:430px){.multi-player-board{left:6px;width:124px;padding:7px}.multi-player{grid-template-columns:36px 1fr;padding:6px 4px}.multi-player .avatar{width:34px;height:34px}.multi-player strong{font-size:18px}.multi-player span{font-size:10px}.character-avatar{width:80px;height:130px}}

    .multi-turn-banner{width:min(82vw,650px);padding:12px 18px;background:radial-gradient(ellipse at center,var(--char,#58c7ef),rgba(20,35,52,.94) 72%)}.multi-turn-banner img{display:block;width:100%;height:min(48vh,420px);object-fit:contain;filter:drop-shadow(0 0 18px var(--char));margin:auto}.multi-turn-banner b{display:block;font-size:clamp(24px,6vw,48px)}.multi-turn-banner.victory{animation:multiVictory 6.5s ease both}.multi-turn-banner.victory img{height:min(62vh,580px)}@keyframes multiVictory{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}10%,92%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.04)}}
  `;document.head.appendChild(style);

  const entry=document.createElement("button");entry.id="multiplayerEntry";entry.className="play-style-card multi-entry";entry.innerHTML='<span>👥</span><b>多人 Gesture Dart</b><small>2～4 人選角輪流體感投鏢</small>';grid.appendChild(entry);
  const setup=document.createElement("div");setup.className="multi-setup";setup.innerHTML=`<h3>👥 多人對戰設定</h3><div class="multi-row"><label>玩家人數</label><div class="multi-stepper"><button id="multiMinus">−</button><b id="multiCount">2</b><button id="multiPlus">＋</button></div></div><div class="multi-row"><label>遊戲分數</label><div class="multi-modes"><button class="active" data-score="301">301</button><button data-score="501">501</button></div></div><div class="character-pick-title" id="pickTitle">玩家 1 選角</div><div id="characterGrid" class="character-grid"></div><div id="seatStrip" class="seat-strip"></div><button id="multiStart" class="primary-btn" disabled>完成選角後開始 🎯</button>`;grid.after(setup);
  const board=document.createElement("div");board.className="multi-player-board";board.innerHTML='<b>角色分數</b><div id="multiPlayerList"></div>';stage.appendChild(board);const banner=document.createElement("div");banner.className="multi-turn-banner";stage.appendChild(banner);

  let session=0;const timers=new Set();
  function later(fn,ms){const token=session;const t=setTimeout(()=>{timers.delete(t);if(token===session)fn()},ms);timers.add(t);return t}
  function clearSession(){session++;timers.forEach(clearTimeout);timers.clear();banner.classList.remove("show");window.cuteDartResetImpact?.()}
  let count=2,startScore=301,active=false,current=0,turnDarts=0,turnStartScore=301,locked=false,players=[],picks=[];
  const countEl=setup.querySelector("#multiCount"),charGrid=setup.querySelector("#characterGrid"),seatStrip=setup.querySelector("#seatStrip"),pickTitle=setup.querySelector("#pickTitle"),startBtn=setup.querySelector("#multiStart"),list=board.querySelector("#multiPlayerList");

  function resetCameraSession(){
    window.cuteDartResetCameraTimers?.();window.cuteDartResetRoundUI?.();window.cuteDartResetImpact?.();
    cameraState.score=0;cameraState.darts=0;cameraState.marks=[];
    cameraBadge.textContent="";cameraBadge.classList.remove("show");
    cameraScreen.classList.remove("hit-reveal");
    drawCameraBoard();
  }
  function keepMultiplayerHud(){
    if(!active||!players[current])return;
    cameraScore.textContent=`${players[current].character.name}｜${players[current].score} 分`;
    cameraDarts.textContent=`${turnDarts} / 3 鏢`;
  }
  function renderSetup(){
    countEl.textContent=count;picks=picks.slice(0,count);while(picks.length<count)picks.push(null);
    const next=picks.findIndex(x=>!x);pickTitle.textContent=next>=0?`玩家 ${next+1} 選角`:`選角完成`;
    charGrid.innerHTML="";
    CHARS.forEach(ch=>{const used=picks.some(p=>p?.id===ch.id);const el=document.createElement("button");el.className="character-card"+(used?" used":"");el.style.setProperty("--char",ch.color);el.innerHTML=`<div class="character-avatar"><img src="${ch.avatar}" alt="${ch.name}"></div><b>${ch.name}</b><small>${ch.icon} ${ch.role}</small>`;el.onclick=()=>{const idx=picks.findIndex(x=>!x);if(idx<0||used)return;picks[idx]=ch;renderSetup()};charGrid.appendChild(el)});
    seatStrip.innerHTML="";
    for(let i=0;i<count;i++){const ch=picks[i],s=document.createElement("div");s.className="seat"+(ch?" filled":"")+(i===next?" active-pick":"");if(ch)s.style.setProperty("--seat",ch.color);s.innerHTML=ch?`<img src="${ch.avatar}" alt="">${ch.name}`:`玩家 ${i+1}`;s.onclick=()=>{if(ch){picks[i]=null;for(let j=i+1;j<picks.length;j++){if(!picks[j-1]&&picks[j]){picks[j-1]=picks[j];picks[j]=null}}renderSetup()}};seatStrip.appendChild(s)}
    startBtn.disabled=picks.some(x=>!x);startBtn.textContent=startBtn.disabled?"完成選角後開始 🎯":"開始多人對戰 🎯";
  }
  function renderPlayers(){
    list.innerHTML="";players.forEach((p,i)=>{const el=document.createElement("div");el.className="multi-player"+(i===current?" active":"");el.style.setProperty("--pc",p.character.color);el.innerHTML=`<div class="avatar"><img src="${p.character.avatar}" alt="${p.character.name}"></div><div><span>${p.character.name}</span><strong>${p.score}</strong></div>`;list.appendChild(el)});keepMultiplayerHud();
  }
  function showBanner(text,ch=players[current]?.character,victory=false){banner.replaceChildren();if(ch){banner.style.setProperty("--char",ch.color);const img=document.createElement("img");img.src=ch.avatar;img.alt=ch.name;banner.appendChild(img)}const label=document.createElement("b");label.textContent=text;banner.appendChild(label);banner.classList.toggle("victory",victory);banner.classList.remove("show");void banner.offsetWidth;banner.classList.add("show")}
  function nextPlayer(){if(!active)return;current=(current+1)%players.length;turnDarts=0;turnStartScore=players[current].score;locked=false;resetCameraSession();renderPlayers();showBanner(`🎯 ${players[current].character.name} 回合`)}
  function finishMultiplayer(winner){locked=true;showBanner(`🏆 ${winner.character.name} WIN！`,winner.character,true);later(()=>{clearSession();active=false;players=[];current=0;turnDarts=0;locked=false;resetCameraSession();cameraScreen.classList.remove("multiplayer-active");cameraThrowing=false;cameraScreen.classList.remove("throwing");if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});stopCamera();show("home");setup.classList.add("open")},6500)}

  renderSetup();entry.onclick=()=>setup.classList.toggle("open");setup.querySelector("#multiMinus").onclick=()=>{count=Math.max(2,count-1);renderSetup()};setup.querySelector("#multiPlus").onclick=()=>{count=Math.min(4,count+1);renderSetup()};setup.querySelectorAll(".multi-modes button").forEach(btn=>btn.onclick=()=>{setup.querySelectorAll(".multi-modes button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");startScore=Number(btn.dataset.score)});
  startBtn.onclick=()=>{
    clearSession();
    players=picks.slice(0,count).map(ch=>({character:ch,score:startScore}));
    current=0;turnDarts=0;turnStartScore=startScore;locked=true;active=true;
    startCameraMode();resetCameraSession();cameraScreen.classList.add("multiplayer-active");renderPlayers();showBanner(`🎯 ${players[0].character.name} 先攻`);setup.classList.remove("open");
    later(()=>{resetCameraSession();renderPlayers();locked=false},2300);
  };

  const baseCameraThrow=cameraThrow;
  cameraThrow=function(p){
    if(!active){baseCameraThrow(p);return}
    if(locked||!players[current])return;
    const hit=hitScore(p.x,p.y),player=players[current];
    baseCameraThrow(p);turnDarts++;
    const next=player.score-hit.score;
    const busted=next<0||next===1;
    if(busted){player.score=turnStartScore;cameraBadge.textContent="BUST"}else player.score=next;
    renderPlayers();
    later(keepMultiplayerHud,2250);
    const hold=Number(window.cuteDartResultHoldMs)||5000;
    if(player.score===0){locked=true;later(()=>finishMultiplayer(player),Math.min(hold,10000));return}
    if(busted||turnDarts>=3){locked=true;later(()=>{showBanner(`↪ 換 ${players[(current+1)%players.length].character.name}`,players[(current+1)%players.length].character);later(nextPlayer,1500)},hold)}
  };

  window.cuteDartCurrentCharacter=()=>active?players[current]?.character:null;
  window.cuteDartCanThrow=()=>!active||!locked;
  document.getElementById("cameraHomeBtn")?.addEventListener("click",()=>{clearSession();active=false;players=[];cameraScreen.classList.remove("multiplayer-active");resetCameraSession()},{capture:true});
  document.getElementById("cameraEntry")?.addEventListener("click",()=>{clearSession();active=false;players=[];current=0;turnDarts=0;locked=false;cameraScreen.classList.remove("multiplayer-active");resetCameraSession()},{capture:true});
})();
