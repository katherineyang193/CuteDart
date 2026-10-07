/* Local multiplayer layer for Gesture Dart */
(() => {
  const home=document.getElementById("homeScreen"),grid=home?.querySelector(".play-style-grid"),stage=document.getElementById("cameraStage");
  if(!home||!grid||!stage)return;

  const style=document.createElement("style");
  style.textContent=`
    .play-style-card.multi-entry{background:linear-gradient(145deg,#fff2bd,#dff6ff)}
    .multi-setup{display:none;margin:12px 0 14px;padding:16px;border:4px solid #fff;border-radius:24px;background:rgba(255,248,232,.97);box-shadow:var(--shadow)}
    .multi-setup.open{display:block}.multi-setup h3{margin:0 0 10px;color:var(--dark);font-size:22px;text-align:center}.multi-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0}.multi-row label{font-weight:1000}.multi-stepper,.multi-modes{display:flex;gap:7px}.multi-stepper button,.multi-modes button{border:2px solid #fff;border-radius:12px;background:#e8f7ff;color:var(--dark);font-weight:1000;min-width:44px;min-height:40px;box-shadow:0 3px 0 rgba(41,51,74,.12)}.multi-modes button.active{background:var(--yellow)}.multi-names{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.multi-names input{width:100%;border:2px solid #d9e7ef;border-radius:12px;padding:10px 12px;font:inherit;font-weight:900;color:var(--dark);background:#fff}.multi-player-board{display:none;position:absolute;z-index:12;left:max(10px,env(safe-area-inset-left));top:50%;transform:translateY(-50%);width:126px;padding:10px;border:2px solid rgba(255,255,255,.45);border-radius:20px;background:rgba(20,35,52,.38);backdrop-filter:blur(5px);color:#fff;pointer-events:none}.camera-screen.throwing.multiplayer-active .multi-player-board{display:block}.multi-player-board>b{display:block;text-align:center;font-size:16px;margin-bottom:7px;opacity:.8}.multi-player{padding:8px 7px;margin:6px 0;border-radius:12px;background:rgba(255,255,255,.12);font-weight:900;opacity:.68}.multi-player.active{background:rgba(255,216,77,.28);outline:2px solid rgba(255,216,77,.75);opacity:1;transform:scale(1.04)}.multi-player span{display:block;font-size:12px;opacity:.8}.multi-player strong{display:block;font-size:22px}.multi-turn-banner{display:none;position:absolute;z-index:18;left:50%;top:52%;transform:translate(-50%,-50%);min-width:58%;padding:18px 24px;border-radius:26px;background:rgba(20,35,52,.82);border:4px solid #fff;color:#fff;text-align:center;font-size:clamp(30px,9vw,56px);font-weight:1000;text-shadow:0 3px 0 rgba(0,0,0,.35);pointer-events:none}.multi-turn-banner.show{display:block;animation:multiPop 1.6s ease both}@keyframes multiPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}15%{opacity:1;transform:translate(-50%,-50%) scale(1.05)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(.98)}}
    @media(max-width:430px){.multi-player-board{left:6px;width:96px;padding:7px}.multi-player{padding:6px 4px}.multi-player strong{font-size:18px}.multi-player span{font-size:10px}.multi-names{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const entry=document.createElement("button");
  entry.id="multiplayerEntry";entry.className="play-style-card multi-entry";
  entry.innerHTML='<span>👥</span><b>多人 Gesture Dart</b><small>2～4 人輪流體感投鏢</small>';
  grid.appendChild(entry);

  const setup=document.createElement("div");setup.className="multi-setup";
  setup.innerHTML=`<h3>👥 多人對戰設定</h3><div class="multi-row"><label>玩家人數</label><div class="multi-stepper"><button id="multiMinus">−</button><b id="multiCount" style="min-width:28px;text-align:center;font-size:22px">2</b><button id="multiPlus">＋</button></div></div><div class="multi-row"><label>遊戲分數</label><div class="multi-modes"><button class="active" data-score="301">301</button><button data-score="501">501</button></div></div><div id="multiNames" class="multi-names"></div><button id="multiStart" class="primary-btn">開始多人對戰 🎯</button>`;
  grid.after(setup);

  const board=document.createElement("div");board.className="multi-player-board";board.innerHTML='<b>玩家分數</b><div id="multiPlayerList"></div>';stage.appendChild(board);
  const banner=document.createElement("div");banner.className="multi-turn-banner";stage.appendChild(banner);

  let count=2,startScore=301,active=false,current=0,turnDarts=0,turnStartScore=301,locked=false,players=[];
  const namesBox=setup.querySelector("#multiNames"),countEl=setup.querySelector("#multiCount"),list=board.querySelector("#multiPlayerList");

  function renderNameInputs(){
    const old=[...namesBox.querySelectorAll("input")].map(x=>x.value);
    namesBox.innerHTML="";
    for(let i=0;i<count;i++){const input=document.createElement("input");input.maxLength=8;input.placeholder=`玩家 ${i+1}`;input.value=old[i]||`玩家 ${i+1}`;namesBox.appendChild(input)}
    countEl.textContent=count;
  }
  function renderPlayers(){
    list.innerHTML="";players.forEach((p,i)=>{const el=document.createElement("div");el.className="multi-player"+(i===current?" active":"");el.innerHTML=`<span>${p.name}</span><strong>${p.score}</strong>`;list.appendChild(el)});
    if(active){cameraScore.textContent=`${players[current].name}｜${players[current].score} 分`;cameraDarts.textContent=`${turnDarts} / 3 鏢`}
  }
  function showBanner(text){banner.textContent=text;banner.classList.remove("show");void banner.offsetWidth;banner.classList.add("show")}
  function nextPlayer(){
    if(!active)return;current=(current+1)%players.length;turnDarts=0;turnStartScore=players[current].score;locked=false;cameraState.darts=0;cameraState.marks=[];drawCameraBoard();renderPlayers();showBanner(`🎯 ${players[current].name} 回合`);
  }
  function finishMultiplayer(winner){locked=true;showBanner(`🏆 ${winner.name} WIN！`);setTimeout(()=>{active=false;cameraScreen.classList.remove("multiplayer-active");cameraThrowing=false;cameraScreen.classList.remove("throwing");if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});stopCamera();show("home");setup.classList.add("open")},2400)}

  renderNameInputs();
  entry.addEventListener("click",()=>setup.classList.toggle("open"));
  setup.querySelector("#multiMinus").addEventListener("click",()=>{count=Math.max(2,count-1);renderNameInputs()});
  setup.querySelector("#multiPlus").addEventListener("click",()=>{count=Math.min(4,count+1);renderNameInputs()});
  setup.querySelectorAll(".multi-modes button").forEach(btn=>btn.addEventListener("click",()=>{setup.querySelectorAll(".multi-modes button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");startScore=Number(btn.dataset.score)}));
  setup.querySelector("#multiStart").addEventListener("click",()=>{
    players=[...namesBox.querySelectorAll("input")].slice(0,count).map((x,i)=>({name:x.value.trim()||`玩家 ${i+1}`,score:startScore}));current=0;turnDarts=0;turnStartScore=startScore;locked=false;active=true;
    startCameraMode();cameraScreen.classList.add("multiplayer-active");renderPlayers();showBanner(`🎯 ${players[0].name} 先攻`);setup.classList.remove("open");
  });

  const baseCameraThrow=cameraThrow;
  cameraThrow=function(p){
    if(!active){baseCameraThrow(p);return}
    if(locked)return;
    const hit=hitScore(p.x,p.y),player=players[current];
    baseCameraThrow(p);
    turnDarts++;
    const next=player.score-hit.score;
    if(next<0||next===1){player.score=player.score;cameraBadge.textContent="BUST"}else player.score=next;
    renderPlayers();
    if(player.score===0){finishMultiplayer(player);return}
    if(turnDarts>=3){locked=true;showBanner(`↪ 換 ${players[(current+1)%players.length].name}`);setTimeout(nextPlayer,2200)}
  };

  const practiceEntry=document.getElementById("cameraEntry");
  practiceEntry?.addEventListener("click",()=>{active=false;cameraScreen.classList.remove("multiplayer-active")},{capture:true});
})();
