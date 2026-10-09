/* Independent presentation controllers. The bridge forwards accepted hits only. */
(() => {
 const cfg=window.CuteDartV11Config;
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 class TimedController {
  constructor(){this.timers=new Set()}
  later(fn,ms){const t=setTimeout(()=>{this.timers.delete(t);fn()},ms);this.timers.add(t);return t}
  clear(){this.timers.forEach(clearTimeout);this.timers.clear()}
 }
 class SoundController {
  constructor(){this.nodes=new Set();this.ctx=null}
  unlock(){try{this.ctx??=new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume?.()}catch{}}
  play(type){if(!state.sound)return;this.unlock();const c=this.ctx;if(!c)return;
   const notes={normal:[660],high:[660,880,1100],bull:[523,659,784,1047],total:[392,523,659],entrance:[440,587],dance:[784,659,880,1047],miss:[220,165]}[type]||[];
   notes.forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*.075;o.type=type==='miss'?'sine':'triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(cfg.volume,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(c.destination);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect()};o.start(t);o.stop(t+.14)})
  }
  clear(){this.nodes.forEach(o=>{try{o.stop()}catch{}});this.nodes.clear()}
 }
 class EffectController extends TimedController {
  constructor(host,board){super();this.paused=[];this.host=host;this.board=board;this.layer=document.createElement('div');this.layer.className='v11-effects';host.appendChild(this.layer)}
  hit(p,h){this.clear();this.layer.replaceChildren();const tier=h.kind==='bull'?'bull':h.score>=cfg.highScore||['double','triple'].includes(h.kind)?'high':'normal';
   const hr=this.host.getBoundingClientRect(),br=this.board.getBoundingClientRect();const x=br.left-hr.left+Math.max(0,Math.min(420,p.x))/420*br.width,y=br.top-hr.top+Math.max(0,Math.min(420,p.y))/420*br.height;
   const fx=document.createElement('div');fx.className=`v11-impact ${tier}`;fx.style.left=x+'px';fx.style.top=y+'px';
   const title=h.label==='BUST'?'BUST':h.kind==='bull'?'BULLSEYE!':h.kind==='triple'?'TRIPLE!':tier==='high'?(h.score>=50?'GREAT!':'NICE!'):h.score?'':'MISS';
   fx.innerHTML='<i class="v11-ring"></i><i class="v11-wave"></i><div class="v11-pop"><b></b><strong></strong></div>';
   fx.querySelector('b').textContent=title;fx.querySelector('strong').textContent=h.label==='BUST'?'':`+${h.score}`;
   if(tier==='bull'){const rays=document.createElement('i');rays.className='v11-rays';fx.prepend(rays)}
   if(tier!=='normal'&&!reduced())for(let i=0;i<cfg.particles;i++){const star=document.createElement('span');star.className='v11-particle';star.textContent=i%3?'✦':'★';const a=i/cfg.particles*Math.PI*2;star.style.setProperty('--dx',Math.cos(a)*(tier==='bull'?130:90)+'px');star.style.setProperty('--dy',Math.sin(a)*(tier==='bull'?130:90)+'px');star.style.setProperty('--delay',i%4*18+'ms');fx.appendChild(star)}
   this.layer.appendChild(fx);
   // Visual-only impact freeze. Never stop the camera, gesture tracker or game clock.
   if(tier==='bull'&&!reduced()){this.board.style.setProperty('--freeze-ms',cfg.freezeMs+'ms');this.board.classList.add('v11-freeze');this.paused=[...(this.layer.getAnimations?.({subtree:true})||[]),...(this.board.getAnimations?.({subtree:true})||[])];this.paused.forEach(a=>a.pause?.());this.later(()=>{this.paused.forEach(a=>a.play?.());this.paused=[];this.board.classList.remove('v11-freeze')},cfg.freezeMs)}
   this.later(()=>fx.remove(),tier==='bull'?cfg.bullMs:tier==='high'?cfg.highMs:cfg.normalMs);return tier;
  }
  reset(){this.clear();this.paused.forEach(a=>a.play?.());this.paused=[];this.layer.replaceChildren();this.board.classList.remove('v11-freeze')}
 }
 class MascotController extends TimedController {
  constructor(host,sound){super();this.host=host;this.sound=sound;this.el=document.createElement('div');this.el.className='v11-mascot idle';this.el.style.setProperty('--mascot-size',cfg.mascotSize+'px');this.el.innerHTML='<span class="v11-bubble"></span><div class="v11-capy-art"></div>';host.appendChild(this.el);this.art=this.el.querySelector('.v11-capy-art');this.bubble=this.el.querySelector('span');
   fetch('assets/capybara.svg').then(r=>{if(!r.ok)throw Error('Capybara asset');return r.text()}).then(svg=>{this.art.innerHTML=svg}).catch(()=>{this.art.textContent='🦫'});
  }
  react(h,tier){this.clear();const reaction=h.label==='BUST'||h.score<=cfg.lowScore?'puzzled':tier==='bull'?'dance':tier==='high'||h.score>=cfg.mediumScore?'wiggle':'clap';this.el.className='v11-mascot '+reaction;this.bubble.textContent=reaction==='puzzled'?(h.score?'咦？':'？'):reaction==='dance'?'卡皮開跳！':reaction==='wiggle'?'扭一下～':'好球！';
   this.place();if(reaction==='dance')this.sound.play('dance');const ms=reaction==='dance'?cfg.danceMs:reaction==='wiggle'?cfg.miniDanceMs:cfg.reactionMs;this.later(()=>this.reset(),ms);
  }
  place(){
   // Dance in a reserved bottom strip, never on top of the target or summary.
   const safe=this.host.querySelector('.v11-mascot-lane');if(safe)this.el.style.setProperty('--dance-x','0px');
  }
  reset(){this.clear();this.el.className='v11-mascot idle';this.bubble.textContent='';this.onIdle?.()}
 }
 class ScoreSummaryController {
  constructor(host,mode,sound){this.mode=mode;this.sound=sound;this.rows=[];this.el=document.createElement('aside');this.el.className='v11-summary';this.el.setAttribute('aria-label','三鏢結果');this.el.setAttribute('aria-live','polite');this.el.innerHTML='<small>本回合</small>'+[1,2,3].map(n=>`<div class="v11-dart"><span>DART ${n}</span><b>—</b></div>`).join('')+'<div class="v11-total"><span>TOTAL</span><b>0</b></div><strong class="v11-record"></strong>';host.appendChild(this.el)}
  add(h){if(this.rows.length>=3)this.reset();this.rows.push({...h});this.render();if(this.rows.length===3)this.finish()}
  render(){this.el.querySelectorAll('.v11-dart').forEach((el,i)=>{const h=this.rows[i];el.querySelector('b').textContent=h?`${h.label} · ${h.score}`:'—';el.classList.toggle('filled',!!h)});this.el.querySelector('.v11-total b').textContent=this.rows.reduce((s,h)=>s+h.score,0)}
  finish(){const total=this.rows.reduce((s,h)=>s+h.score,0);const busted=this.rows.some(h=>h.label==='BUST');if(busted)this.el.querySelector('.v11-total b').textContent='BUST';this.el.classList.remove('settled');void this.el.offsetWidth;this.el.classList.add('settled');this.sound.play('total');
   if(busted)return;try{const records=JSON.parse(localStorage.getItem(cfg.recordKey)||'{}');const legacy=this.mode==='classic'?JSON.parse(localStorage.getItem('cuteDartRecords')||'{}').bestRound:0;const best=Number(records[this.mode]??legacy)||0;if(total>best){records[this.mode]=total;localStorage.setItem(cfg.recordKey,JSON.stringify(records));this.el.querySelector('.v11-record').textContent='NEW RECORD!'}}catch{}
  }
  bust(){this.rows=this.rows.map(h=>({...h,score:0}));this.render();this.el.querySelector('.v11-total b').textContent='BUST';this.el.querySelector('.v11-record').textContent=''}
  reset(){this.rows=[];this.el.classList.remove('settled');this.el.querySelector('.v11-record').textContent='';this.render()}
 }
 window.CuteDartV11={EffectController,MascotController,SoundController,ScoreSummaryController,TimedController};
})();
