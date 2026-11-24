// Positions are percentages of the floor in the illustrated tower.
export const stations = [
  { x: 18, y: 76 }, { x: 59, y: 72 }, { x: 92, y: 72 }, { x: 80, y: 81 }
];

export function exploreTower(scene, onTalk) {
  const player = scene.querySelector('.tower-player');
  const prompt = scene.parentElement.querySelector('.talk-prompt');
  const names = [...scene.querySelectorAll('[data-station]')];
  const position = { x: 44, y: 86 };
  let destination, nearby, frame, previous = 0;
  const held = new Set();
  const events = new AbortController();
  const listen = (el, event, fn) => el.addEventListener(event, fn, { signal: events.signal });
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function paint() {
    player.style.left = position.x + '%';
    player.style.top = position.y + '%';
    let closest = null, best = Infinity;
    for (const [i, s] of stations.entries()) {
      const distance = Math.hypot(s.x-position.x, (s.y-position.y)*.62);
      if (distance < 12 && distance < best) { closest=i; best=distance; }
    }
    nearby = closest;
    prompt.disabled = nearby === null;
    prompt.textContent = nearby === null ? 'Approach a contact' : 'Contact ' + names[nearby].dataset.name;
    names.forEach((n,i)=>n.classList.toggle('nearby',i===nearby));
  }
  function update(now) {
    const dt = Math.min((now-previous)/1000,.05); previous=now;
    let dx = Number(held.has('right'))-Number(held.has('left'));
    let dy = Number(held.has('down'))-Number(held.has('up'));
    if (destination) {
      dx=destination.x-position.x; dy=(destination.y-position.y)*.62;
      if(Math.hypot(dx,dy)<1.2){
        const target=destination.station; destination=null; paint();
        if(target!==undefined) onTalk(target);
        frame=null; player.classList.remove('walking'); return;
      }
    }
    const length=Math.hypot(dx,dy);
    if (!length) {frame=null;player.classList.remove('walking');return;}
    const step=destination?Math.min(55*dt,length):29*dt;
    position.x=clamp(position.x+dx/length*step,4,96);
    position.y=clamp(position.y+dy/length*step/.62,68,96);
    player.classList.add('walking'); paint(); frame=requestAnimationFrame(update);
  }
  function wake(){if(frame==null){previous=performance.now();frame=requestAnimationFrame(update)}}
  function visit(i){held.clear();destination={x:stations[i].x-3,y:stations[i].y+3,station:i};wake()}
  names.forEach((n,i)=>listen(n,'click',e=>{e.stopPropagation();visit(i)}));
  listen(scene,'click',e=>{
    const r=scene.getBoundingClientRect();scene.focus({preventScroll:true});
    destination={x:clamp((e.clientX-r.left)/r.width*100,4,96),y:clamp((e.clientY-r.top)/r.height*100,68,96)};wake();
  });
  const keys={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};
  listen(scene,'keydown',e=>{
    if(e.target.tagName==='BUTTON')return;
    if(keys[e.key]){e.preventDefault();destination=null;held.add(keys[e.key]);wake()}
    if((e.key==='e'||e.key==='Enter')&&nearby!==null&&!e.repeat){e.preventDefault();held.clear();onTalk(nearby)}
  });
  listen(window,'keyup',e=>held.delete(keys[e.key]));
  listen(window,'blur',()=>held.clear());
  listen(scene,'focusout',e=>{if(!scene.contains(e.relatedTarget))held.clear()});
  listen(prompt,'click',()=>{if(nearby!==null)onTalk(nearby)});
  paint();
  return ()=>{events.abort();cancelAnimationFrame(frame)};
}
