/* The original engine remains authoritative. No gesture / hitScore / scoring edits. */
(() => {
 const {EffectController,MascotController,SoundController,ScoreSummaryController,TimedController}=window.CuteDartV11,cfg=window.CuteDartV11Config;
 const sound=new SoundController(),timing=new TimedController();
 const classic=document.createElement('div');classic.className='v11-classic-play';const board=document.querySelector('#gameScreen .board-wrap');board.before(classic);classic.appendChild(board);
 const camera=document.getElementById('cameraStage');
 const contexts={classic:{host:classic,board:document.getElementById('board')},camera:{host:camera,board:document.getElementById('arBoard')}};
 Object.entries(contexts).forEach(([mode,c])=>{c.effect=new EffectController(c.host,c.board);c.mascot=new MascotController(c.host,sound);c.summary=new ScoreSummaryController(c.host,mode,sound)});
 function overlap(a,b){return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
 function placeMascot(c,dance=false){
  const el=c.mascot.el;el.hidden=false;el.style.left='';el.style.right='12px';
  if(c===contexts.classic){if(dance){el.style.right='';el.style.left='calc(50% - '+cfg.mascotSize/2+'px)'}return}
  // Test actual movable target and UI bounds, including fullscreen exit button.
  const hr=c.host.getBoundingClientRect();if(!hr.width)return;
  const size=el.getBoundingClientRect().width||cfg.mascotSize,bottom=hr.bottom-78;
  const obstacles=[c.board,c.summary.el,...camera.querySelectorAll('.camera-hud,.multi-player-board'),document.getElementById('cameraThrowMode')].filter(e=>e&&e.getBoundingClientRect().width).map(e=>e.getBoundingClientRect());
  const candidates=dance?[hr.left+(hr.width-size)/2,hr.right-size-12,hr.left+12]:[hr.right-size-12,hr.left+(hr.width-size)/2,hr.left+12];
  const x=candidates.find(left=>!obstacles.some(r=>overlap({left:left-8,right:left+size+8,top:bottom-size-35,bottom:bottom+8},r)));
  if(x===undefined){el.hidden=true;return}el.style.right='';el.style.left=(x-hr.left)+'px';
 }
 function reset(mode){const c=contexts[mode];c.effect.reset();c.mascot.reset();c.summary.reset();timing.clear();sound.clear();placeMascot(c)}
 function present(mode,p,h){timing.clear();const c=contexts[mode];c.summary.add(h);if(h.label==='BUST')c.summary.bust();c.effect.reset();c.mascot.reset();
  const fire=()=>{const tier=c.effect.hit(p,h);sound.play(h.score===0?'miss':tier);c.mascot.react(h,tier);placeMascot(c,tier==='bull')};
  if(mode==='camera')timing.later(fire,cfg.cameraImpactDelayMs);else fire();
 }
 Object.values(contexts).forEach(c=>{c.mascot.onIdle=()=>placeMascot(c)});
 const baseCamera=cameraThrow;
 cameraThrow=function(p){if(window.cuteDartCanThrow&&!window.cuteDartCanThrow())return;const before=cameraState.darts,h=hitScore(p.x,p.y);baseCamera(p);if(cameraState.darts===before)return;if(cameraBadge.textContent==='BUST'){h.label='BUST';h.score=0}present('camera',p,h)};
 const baseCommit=commitThrow;
 commitThrow=function(p){const before=state.turn;const h=hitScore(p.x,p.y);baseCommit(p);h.score=state.turn-before;if(lastEl.textContent.includes('BUST'))h.label='BUST';present('classic',p,h)};
 const baseNew=newGame;newGame=function(...args){reset('classic');return baseNew(...args)};
 const baseShow=show;show=function(which){if(which!=='camera')reset('camera');if(which!=='game')reset('classic');return baseShow(which)};
 const baseReset=window.cuteDartResetRoundUI;window.cuteDartResetRoundUI=()=>{baseReset?.();reset('camera')};
 // Camera game loop invokes this function dynamically; no tracker changes required.
 const baseFinish=finishTurn;finishTurn=function(){const c=contexts.classic;if(c.summary.rows.length&&c.summary.rows.length<3)c.summary.finish();return baseFinish()};
 document.addEventListener('pointerdown',()=>sound.unlock(),{passive:true});
 document.getElementById('soundBtn').addEventListener('click',()=>{if(!state.sound)sound.clear()});
 document.getElementById('cameraThrowMode').addEventListener('click',()=>{if(!cameraThrowing)reset('camera');else{placeMascot(contexts.camera);sound.play('entrance')}});
 window.addEventListener('resize',()=>Object.values(contexts).forEach(c=>placeMascot(c,c.mascot.el.classList.contains('dance'))));
 const observer=new MutationObserver(()=>placeMascot(contexts.camera,contexts.camera.mascot.el.classList.contains('dance')));observer.observe(contexts.camera.board,{attributes:true,attributeFilter:['style']});
 window.addEventListener('pagehide',()=>{reset('camera');reset('classic')});
 // Expose controllers for tuning and deterministic presentation acceptance checks.
 window.CuteDartV11.controllers={contexts,sound,reset};
})();
