import { racePoints } from './league.js';

const laneHeights=[
  [.54,.34,.59,.40,.52,.31], [.48,.67,.41,.29,.47,.38], [.58,.38,.55,.32,.48,.63]
];
const riderX=.20, speed=.255, spacing=.55, firstGate=1.08;

export function mountRace(arena,fixture,onFinish){
  const canvas=arena.querySelector('canvas'),ctx=canvas.getContext('2d');
  const controls=arena.parentElement.querySelector('.broom-controls');
  const start=controls.querySelector('[data-race-start]');
  const pause=controls.querySelector('[data-race-pause]');
  const hud=arena.querySelector('.race-readout');
  const message=arena.querySelector('.race-call');
  const events=new AbortController(),options={signal:events.signal};
  const sprite=new Image();sprite.src='art/pixel-rider.png';
  let pos=.50,aim=pos,direction=0,elapsed=0,last=0,frame=0,count=0,comet=false;
  let running=false,paused=false,finished=false;
  let passed=new Set();
  const width=840,height=400;
  canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;
  function draw(){
    ctx.clearRect(0,0,width,height);
    for(let i=0;i<6;i++){
      const x=(firstGate+i*spacing-elapsed*speed)*width,y=laneHeights[fixture][i]*height;
      if(x< -40||x>width+40)continue;
      if(i===5){
        const offset=Math.sin(elapsed*7)*4;
        ctx.fillStyle='#f5edc7';ctx.fillRect(x-20,y-9+offset,13,5);ctx.fillRect(x+7,y-9+offset,13,5);
        ctx.fillStyle='#ffdb6c';ctx.fillRect(x-7,y-6,14,12);ctx.fillRect(x-4,y-9,8,18);
        continue;
      }
      ctx.fillStyle='#9a7746';ctx.fillRect(x-2,y+35,5,height-y);
      for(const [rx,ry,col,lw] of [[12,37,'#443043',8],[12,37,'#f1c47a',5],[10,34,'#fff2bc',2]]){
        ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.stroke();
      }
    }
    const x=width*riderX,y=height*pos,bob=running&&!paused?Math.sin(elapsed*10)*1.5:0;
    ctx.fillStyle='#ffdb9399';
    for(let i=0;i<8;i++){let phase=(elapsed*2+i*.129)%1;ctx.fillRect(x-23-phase*49,y+7+Math.sin(i+phase*6)*6,2,2)}
    if(sprite.complete&&sprite.naturalWidth)ctx.drawImage(sprite,x-38,y-33+bob,76,66);
    else {ctx.fillStyle='#f3d189';ctx.fillRect(x-24,y,36,4);ctx.fillStyle='#5766a5';ctx.fillRect(x-3,y-17,9,17)}
  }
  function live(text){message.textContent=text}
  function playFrame(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;
    if(!running||paused)return;
    elapsed+=dt;
    if(direction){aim=Math.max(.15,Math.min(.79,aim+direction*dt*.77))}
    pos+=Math.sign(aim-pos)*Math.min(Math.abs(aim-pos),dt*.90);
    for(let i=0;i<6;i++){
      if(passed.has(i)||firstGate+i*spacing-elapsed*speed>riderX)continue;
      passed.add(i);const hit=Math.abs(pos-laneHeights[fixture][i])<(i===5?.078:.095);
      if(hit&&i<5)count++;
      if(i===5)comet=hit;
      live(i===5?(hit?'Comet caught!':'Comet flew past'):(hit?'Clean hoop · +4':'Missed hoop'));
      hud.textContent=count+' / 5 hoops  ·  '+racePoints(count,comet)+' pts';
    }
    draw();
    if(passed.size===6){running=false;finished=true;pause.disabled=true;start.disabled=false;start.textContent='Fly again';onFinish(racePoints(count,comet),count,comet);return}
    frame=requestAnimationFrame(playFrame);
  }
  function begin(){arena.parentElement.querySelector('.race-result').hidden=true;cancelAnimationFrame(frame);running=true;paused=false;finished=false;direction=0;pos=aim=.50;elapsed=0;last=performance.now();count=0;comet=false;passed=new Set();
    hud.textContent='0 / 5 hoops  ·  0 pts';live('Aim for the first hoop');start.disabled=true;pause.disabled=false;pause.textContent='Pause';
    arena.focus({preventScroll:true});frame=requestAnimationFrame(playFrame)}
  function toggle(){if(!running||finished)return;paused=!paused;direction=0;pause.textContent=paused?'Resume':'Pause';
    live(paused?'Flight paused':'Back on the broom');if(paused)cancelAnimationFrame(frame);else{last=performance.now();arena.focus({preventScroll:true});frame=requestAnimationFrame(playFrame)}}
  start.addEventListener('click',begin,options);
  pause.addEventListener('click',toggle,options);
  arena.addEventListener('keydown',e=>{if(!running)return;if(['ArrowUp','w','ArrowDown','s',' '].includes(e.key)){e.preventDefault();if(e.key===' '){if(!e.repeat)toggle()}else direction=e.key==='ArrowUp'||e.key==='w'?-1:1}},options);
  window.addEventListener('keyup',e=>{if(['ArrowUp','w','ArrowDown','s'].includes(e.key))direction=0},options);
  function point(e){if(!running||paused)return;const r=arena.getBoundingClientRect();aim=Math.max(.15,Math.min(.79,(e.clientY-r.top)/r.height));direction=0}
  arena.addEventListener('pointerdown',e=>{if(!running)return;arena.setPointerCapture(e.pointerId);point(e)},options);
  arena.addEventListener('pointermove',e=>{if(e.buttons)point(e)},options);
  for(const b of controls.querySelectorAll('[data-lane]')){
    b.addEventListener('click',()=>{if(running&&!paused){aim=Math.max(.15,Math.min(.79,aim+Number(b.dataset.lane)*.12));direction=0}},options)
  }
  window.addEventListener('blur',()=>{if(running&&!paused)toggle()},options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&running&&!paused)toggle()},options);
  sprite.addEventListener('load',draw,options);draw();
  return ()=>{cancelAnimationFrame(frame);events.abort()};
}
