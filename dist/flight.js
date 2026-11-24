import { featherSpots, lectures } from './data.js';

// The chart uses normalized coordinates so keyboard flight and pointer flight
// reach the same landmarks on a phone, tablet, or wide desktop.
export function fly({map, index, start, collected, onFeather, onLand, onCancel}) {
  const target = lectures[index];
  const sprite = map.querySelector('.owl-sprite');
  const keys = new Set();
  const events = new AbortController();
  const opts = {signal:events.signal};
  let position = {...start}, waypoint = null, guided = false, last = 0, tick = 0, stopped = false;
  const hud = document.createElement('div');
  hud.className = 'flight-hud';
  hud.innerHTML = '<span>Tap the chart or use arrow keys to steer.</span><button class="outline" type="button">Guide me</button><button class="quiet" type="button">Land later</button>';
  const ring = document.createElement('div');
  ring.className = 'ring';
  ring.style.setProperty('--x',target.x+'%');
  ring.style.setProperty('--y',target.y+'%');
  map.append(ring,hud);
  map.classList.add('flying');
  map.tabIndex=0; map.focus({preventScroll:true});
  sprite.classList.remove('perched');
  const [guide,cancel] = hud.querySelectorAll('button');
  guide.addEventListener('click',()=>{guided=true; waypoint={x:target.x,y:target.y}; hud.querySelector('span').textContent='Rowan is following the flight path.';},{...opts});
  cancel.addEventListener('click',()=>{stop();onCancel();},opts);
  map.addEventListener('pointerdown',e=>{
    if(e.target.closest('.flight-hud')) return;
    e.preventDefault();
    const bounds=map.getBoundingClientRect();
    waypoint={x:100*(e.clientX-bounds.left)/bounds.width,y:100*(e.clientY-bounds.top)/bounds.height};
    guided=false;map.focus({preventScroll:true});
  },opts);
  const movement=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d'];
  map.addEventListener('keydown',e=>{
    if(e.key==='Escape'){stop();onCancel();return;}
    if(!movement.includes(e.key)) return;
    e.preventDefault();keys.add(e.key);waypoint=null;guided=false;
  },opts);
  window.addEventListener('keyup',e=>keys.delete(e.key),opts);
  window.addEventListener('blur',()=>keys.clear(),opts);
  function stop(){stopped=true;cancelAnimationFrame(tick);events.abort();hud.remove();ring.remove();map.classList.remove('flying');map.removeAttribute('tabindex')}
  function frame(time){
    if(stopped)return;
    const dt=last?Math.min((time-last)/1000,.04):0; last=time;
    let dx=0,dy=0;
    if(keys.has('ArrowLeft')||keys.has('a'))dx--;
    if(keys.has('ArrowRight')||keys.has('d'))dx++;
    if(keys.has('ArrowUp')||keys.has('w'))dy--;
    if(keys.has('ArrowDown')||keys.has('s'))dy++;
    const ratio=map.clientWidth/Math.max(map.clientHeight,1);
    let speed=guided?34:28;
    if(waypoint){
      dx=waypoint.x-position.x;dy=(waypoint.y-position.y)/ratio;
      const dist=Math.hypot(dx,dy);
      if(dist<.4){dx=dy=0;waypoint=null}
      else if(dt>0) speed=Math.min(speed,dist/dt);
    }
    const length=Math.hypot(dx,dy)||1;
    position.x=Math.max(2,Math.min(98,position.x+dx/length*speed*dt));
    position.y=Math.max(5,Math.min(95,position.y+dy/length*speed*dt*ratio));
    sprite.style.left=position.x+'%';sprite.style.top=position.y+'%';
    featherSpots.forEach(([x,y],id)=>{
      if(!collected.has(id)&&Math.hypot(x-position.x,(y-position.y)/ratio)<4){
        collected.add(id);map.querySelector('[data-mote="'+id+'"]')?.remove();onFeather(id);
      }
    });
    if(Math.hypot(target.x-position.x,(target.y-position.y)/ratio)<4){
      stop();onLand(index);return;
    }
    tick=requestAnimationFrame(frame);
  }
  tick=requestAnimationFrame(frame);return stop;
}
