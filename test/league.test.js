import test from 'node:test';
import assert from 'node:assert/strict';
import {restore} from '../dist/data.js';
import {fixtures,homeTeam,standings,seasonStandings,racePoints,cupHonour} from '../dist/league.js';
import {mountRace} from '../dist/broom.js';
import {exploreTower,stations} from '../dist/tower.js';

test('existing saves retain stamps and safely initialise the new season',()=>{
  const record=restore('{"stamps":[0,2],"broomBests":[15,-7,120],"met":[1,1,5]}');
  assert.deepEqual(record.stamps,[0,2]);assert.deepEqual(record.broomBests,[15,0,0]);assert.deepEqual(record.met,[1]);
});
test('fixture and season standings combine coursework and the personal best exactly once',()=>{
  const bests=[4,20,30];
  for(const [i,f] of fixtures.entries()){
    const home=standings(i,bests).find(t=>t.id===homeTeam);
    assert.equal(home.total,(f.marks[homeTeam][0]+f.marks[homeTeam][1])/2+bests[i]);
  }
  const season=seasonStandings(bests);
  assert.equal(season.find(t=>t.id===homeTeam).flight,54);
  assert.ok(season.every((v,i)=>!i||season[i-1].total>=v.total));
  assert.equal(cupHonour(bests),'House pennant');assert.equal(cupHonour([30,30,30]),'Comet captain');
  assert.equal(cupHonour([0,30,30]),null);assert.equal(racePoints(5,true),30);
});

class Element extends EventTarget {
  constructor(){super();this.style={};this.dataset={};this.classList={add(){},remove(){},toggle(){}}}
  focus(){} setPointerCapture(){} getBoundingClientRect(){return {left:0,top:0,width:840,height:400}}
}
function simulation(t){
  let frame,clock=0;
  for(const [k,val] of Object.entries({requestAnimationFrame:cb=>{frame=cb;return 1},cancelAnimationFrame:()=>{frame=null},window:new Element(),document:new Element(),Image:Element})){
    const saved=Object.getOwnPropertyDescriptor(globalThis,k);
    Object.defineProperty(globalThis,k,{value:val,configurable:true,writable:true});
    t.after(()=>saved?Object.defineProperty(globalThis,k,saved):delete globalThis[k]);
  }
  t.mock.method(performance,'now',()=>clock);
  return ()=>{clock+=1000/60;const cb=frame;frame=null;cb?.(clock)};
}
test('a steered flight passes all five hoops, catches the comet, pauses and awards once',t=>{
  const step=simulation(t),els={};
  const el=key=>els[key]??=new Element();
  const canvas=el('canvas');canvas.getContext=()=>new Proxy({},{get:()=>()=>{}});
  const arena=el('arena');arena.querySelector=el;arena.parentElement={querySelector:el};
  el('.broom-controls').querySelector=el;el('.broom-controls').querySelectorAll=()=>[];
  const awards=[];const stop=mountRace(arena,0,(...args)=>awards.push(args));
  el('[data-race-start]').dispatchEvent(new Event('click'));
  el('[data-race-pause]').dispatchEvent(new Event('click'));
  for(let n=0;n<120;n++)step();
  assert.equal(awards.length,0);
  el('[data-race-pause]').dispatchEvent(new Event('click'));
  const lanes=[.54,.34,.59,.40,.52,.31];
  for(let n=0;n<1100;n++){
    const gate=Math.max(0,Math.min(5,Math.ceil(((n/60)*.255-.88)/.55)));
    const event=Object.assign(new Event('pointerdown'),{clientY:lanes[gate]*400,pointerId:1});
    arena.dispatchEvent(event);step();
  }
  assert.deepEqual(awards,[[30,5,true]]);stop();
});
test('all four tower stations lead to their corresponding contact',t=>{
  const step=simulation(t),scene=new Element(),player=new Element(),prompt=new Element(),visited=[];
  const buttons=stations.map((_,i)=>{const b=new Element();b.dataset.name='Contact '+i;return b});
  scene.querySelector=()=>player;scene.querySelectorAll=()=>buttons;scene.parentElement={querySelector:()=>prompt};
  const leave=exploreTower(scene,i=>visited.push(i));
  buttons.forEach(b=>{b.dispatchEvent(new Event('click'));for(let n=0;n<180;n++)step()});
  assert.deepEqual(visited,[0,1,2,3]);leave();
});
