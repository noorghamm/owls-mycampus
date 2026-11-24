import {lectures,companions,breaks,houses,featherSpots,saveKey,restore,points} from './data.js';
import {fly} from './flight.js';

const main=document.querySelector('main'), dialog=document.querySelector('#panel'), body=document.querySelector('#panel-body');
let raw;try{raw=localStorage.getItem(saveKey)}catch{}
let state=restore(raw), stopFlight=null, toastTimer, audio, saveFailed=false;
const actions=new Map();
const pages=new Set(['schedule','houses','common-room','registration','courses']);
const nextStop=()=>lectures.findIndex((_,i)=>!state.stamps.includes(i));
const page=()=>pages.has(location.hash.slice(1))?location.hash.slice(1):'schedule';
const stampCount=()=>state.stamps.length;
const spare=()=>Math.max(0,state.feathers.length-state.friends.length);
function save(){try{localStorage.setItem(saveKey,JSON.stringify(state))}catch{if(!saveFailed){saveFailed=true;notify('This browser can keep your progress only while this tab is open.')}}}
function notify(message){const n=document.querySelector('#notice');n.textContent=message;n.classList.add('shown');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('shown'),2900)}
function chime(final=false){
  if(!state.sound)return;
  try{
    audio??=new AudioContext();audio.resume().catch(()=>{});
    const notes=final?[392,494,587,784]:[523,659];
    notes.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.105;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.08,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+.48);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.5)});
  }catch{}
}
function act(key,fn){actions.set(key,fn);return 'data-action="'+key+'"'}
function button(label,key,fn,css='button'){return '<button type="button" class="'+css+'" '+act(key,fn)+'>'+label+'</button>'}
function open(title,eyebrow,html){
  body.innerHTML='<span class="micro">'+eyebrow+'</span><h2 class="dialog-title" id="dialog-title">'+title+'</h2>'+html;
  if(!dialog.open)dialog.showModal();
}
function close(){if(dialog.open)dialog.close()}
dialog.querySelector('.close').addEventListener('click',close);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;if(stopFlight&&el.closest('.map')&&!el.closest('.flight-hud'))return;actions.get(el.dataset.action)?.()});
window.addEventListener('hashchange',()=>{close();render();main.focus({preventScroll:true});window.scrollTo(0,0)});
window.addEventListener('storage',e=>{if(e.key===saveKey){state=restore(e.newValue);close();render()}});
function intro(kicker,title,sub,stats=''){
  return '<section class="intro"><div><span class="eyebrow">'+kicker+'</span><h1>'+title+'</h1><p>'+sub+'</p></div>'+stats+'</section>';
}
function stats(){return '<div class="status" aria-label="Flight totals"><div class="stat"><strong>'+points(state.stamps)+'</strong><small>Flight points</small></div><div class="stat"><strong>'+spare()+'</strong><small>Moonfeathers</small></div></div>'}
function owlHome(){
  const last=lectures[state.stamps.at(-1)];
  return last?{x:last.x+2,y:last.y+8}:{x:7,y:76};
}
function chart(){
  const legs=['M7 76Q12 59 18 37','M18 37Q34 53 52 28','M52 28Q61 58 77 62'];
  const trails=legs.map((d,i)=>'<path class="trail '+(state.stamps.includes(i)?'done':'')+'" d="'+d+'"/>').join('');
  const pins=lectures.map((c,i)=>'<button type="button" class="pin '+(state.stamps.includes(i)?'done':'')+'" style="--x:'+c.x+'%;--y:'+c.y+'%" aria-label="Open lecture pass for '+c.name+' at '+c.venue+'" '+act('pin'+i,()=>pass(i))+'>'+(state.stamps.includes(i)?'✓ ':'')+c.short+'</button>').join('');
  const motes=featherSpots.map(([x,y],i)=>state.feathers.includes(i)?'':'<i class="mote" aria-hidden="true" data-mote="'+i+'" style="--x:'+x+'%;--y:'+y+'%"></i>').join('');
  const loc=owlHome();
  return '<div class="atlas"><div class="atlas-top"><b>Gilmorehill flight chart</b><div class="map-controls"><small>Illustrated campus</small>'+button('♫ Sound '+(state.sound?'on':'off'),'sound',()=>{state.sound=!state.sound;save();chime();render()},'outline sound')+'</div></div><div class="map" role="group" aria-label="Interactive Glasgow campus flight chart"><svg aria-hidden="true" class="path-layer" viewBox="0 0 100 100" preserveAspectRatio="none">'+trails+'</svg>'+motes+pins+'<img class="owl-sprite perched" style="left:'+loc.x+'%;top:'+loc.y+'%" src="art/rowan.svg" alt="Rowan the barn owl"></div><div class="atlas-foot"><span>✦ &nbsp; '+(stampCount()===3?'All three lecture stops charted.':'Catch golden moonfeathers as you fly.')+'</span><small>'+state.feathers.length+' / 9 found</small></div></div>';
}
function day(){
  const rows=lectures.map((c,i)=>'<button type="button" class="lecture" '+act('row'+i,()=>pass(i))+'><span class="wax '+(state.stamps.includes(i)?'stamped':'')+'">'+(state.stamps.includes(i)?'✓':'')+'</span><span><span class="lecture-time">'+c.time+' – '+c.end+'</span><span class="lecture-name">'+c.name+'</span><small>'+c.venue+'</small></span><span aria-hidden="true">›</span></button>').join('');
  const i=nextStop();
  return '<section class="day panel"><span class="micro">Tuesday · 24 November</span><h2>Today’s lectures</h2>'+rows+'<div class="progress"><small>'+stampCount()+' of 3 lecture passes stamped</small><div class="progress-line">'+lectures.map((_,j)=>'<i class="'+(state.stamps.includes(j)?'on':'')+'"></i>').join('')+'</div></div>'+button(i<0?'Open full-flight seal':'Fly to my next lecture','next',()=>i<0?seal():startFlight(i))+'</section>';
}
function schedule(){
  const bp=state.breakIndex<0?'12:00–14:00 · Choose a plan':breaks[state.breakIndex];
  return intro('Glasgow Uni  /  Science & Engineering','Owl Schedule','Three lectures. One little owl. Your day at Gilmorehill.',stats())+'<div class="layout">'+chart()+day()+'</div><section class="student-grid"><button class="pocket" '+act('breaks',breakDialog)+'><span class="eyebrow">Between lectures</span><b>Your midday break</b><small>'+bp+'</small></button><a class="pocket has-art" href="#common-room"><span class="eyebrow">Science & Engineering</span><b>Common room</b><small>'+state.friends.length+' of 4 companions befriended</small><img src="art/fox.svg" alt=""></a><a class="pocket" href="#registration"><span class="eyebrow">Student record</span><b>Registration seals</b><small>'+(Number(state.academic)+Number(state.finance))+' of 2 confirmed</small></a></section>';
}
function startFlight(i){
  close();if(page()!=='schedule')return;
  stopFlight?.();const map=main.querySelector('.map');
  const target=lectures[i];
  notify('Fly to '+target.venue+'. Follow the glowing ring.');
  stopFlight=fly({map,index:i,start:owlHome(),collected:new Set(state.feathers),
    onFeather(id){if(!state.feathers.includes(id)){state.feathers.push(id);save();chime();notify('Moonfeather collected · '+spare()+' in your satchel')}},
    onLand(){stopFlight=null;render();pass(i,true)},onCancel(){stopFlight=null;render();notify('Rowan returned to the roost.')}});
}
function pass(i,landed=false){
  const c=lectures[i],done=state.stamps.includes(i);
  open(c.name,landed?'Rowan has landed · Lecture pass':'Lecture pass · '+c.time+'–'+c.end,
    '<p class="dialog-body"><b>'+c.venue+'</b><br>'+c.room+'</p><p>'+c.topic+'</p><hr><p class="demo-note">Sample check-in · Illustrative room assignment</p><div class="actions">'+(done?button('✓ Already stamped','done',close,'outline'):button('Stamp my pass · +10','stamp',()=>stamp(i)))+
    (!landed?button(done?'Fly this route again':'Fly to this building','fly-here',()=>startFlight(i),'outline'):'')+'</div>');
}
function stamp(i){
  if(state.stamps.includes(i)){close();return}
  state.stamps.push(i);save();chime(stampCount()===3);render();
  if(stampCount()===3){seal();return}
  open('Lecture stamped','Owl post · '+lectures[i].short,'<div class="seal">✦</div><p class="center">Rowan delivered your '+lectures[i].name+' pass. <b>+10 flight points.</b></p><div class="actions center">'+button('Return to the chart','return',close)+'</div>');
}
function seal(){
  open('A full flight','The Gilmorehill flight seal','<div class="seal"><img width="72" height="72" src="art/rowan.svg" alt="Rowan"></div><p class="center">All three lecture passes are stamped. <b>50 flight points</b> — 30 for your lectures and 20 for the complete route.</p><div class="actions center">'+button('Return to my schedule','return',close)+'</div>');
}
function breakDialog(){
  open('Between lectures','Tuesday · 12:00–14:00','<p>Pin a plan between Human-Centred Design and Systems Programming.</p>'+breaks.map((s,i)=>'<button class="choice" '+act('break'+i,()=>chooseBreak(i))+'>'+s+(i===state.breakIndex?'  ✓':'')+'</button>').join('')+button('Keep this time free','clear-break',()=>chooseBreak(-1),'quiet'));
}
function chooseBreak(i){state.breakIndex=i;save();close();render();notify(i<0?'Your midday break is free.':'Break pinned to your schedule.')}
function houseHall(){
  const sigils=['✎','△','❧','⚖'],colours=['#604158','#325942','#724a3f','#434d72'];
  return intro('Glasgow Uni  /  College houses','The House Hall','Follow your college banner to the common room.')+'<div class="keepers">'+houses.map((h,i)=>'<article class="banner" style="--house:'+colours[i]+'"><span class="sigil" aria-hidden="true">'+sigils[i]+'</span><h2>'+h+'</h2><p>'+(i===1?'Your house · Computing Science':'College house')+'</p>'+(i===1?'<a class="button" href="#common-room">Enter common room</a>':'')+'</article>').join('')+'</div>';
}
function commonRoom(){
  return intro('House of Science & Engineering','The common room','Meet the four keepers of your school. Each one knows a different kind of way forward.',stats())+'<div class="keepers">'+companions.map((c,i)=>'<article class="keeper"><img src="art/'+c.animal+'.svg" alt="'+c.name+', a '+c.animal+'"><span class="eyebrow">'+c.title+'</span><h2>'+c.name+'</h2><p>'+c.role+'</p>'+button('Visit '+c.name+(state.friends.includes(i)?' ✦':''),'keeper'+i,()=>keeper(i),'outline')+'</article>').join('')+'</div><div class="subnav"><a class="outline" href="#houses">House Hall</a><a class="quiet" href="#schedule">Return to Owl Schedule</a></div>';
}
function keeper(i){
  const c=companions[i],friend=state.friends.includes(i);
  open(c.name+' the '+c.animal,'Common room · '+c.role,'<img class="portrait" src="art/'+c.animal+'.svg" alt=""><p><b>'+c.title+'</b></p><p>'+c.detail+'</p><p class="dialog-body">'+(friend?c.quote:'Golden moonfeathers drift above the campus. Bring one back to befriend '+c.name+'.')+'</p><div class="actions"><a class="button" href="'+c.url+'" '+(c.url.startsWith('https')?'target="_blank" rel="noopener noreferrer"':'')+'>'+c.action+'</a>'+(friend?'<span class="chip">✦ Befriended</span>':spare()?button('Offer one feather','gift',()=>{if(spare()&&!state.friends.includes(i)){state.friends.push(i);save();chime();render();keeper(i)}},'outline'):button('Find feathers','find',()=>{close();location.hash='schedule'},'outline'))+'</div>');
}
function registration(){
  const count=Number(state.academic)+Number(state.finance);
  return intro('Student record  /  2026–27','Registration','Review your example student record and seal each section.', '<div class="stat"><strong>'+count+' / 2</strong><small>Seals confirmed</small></div>')+'<div class="grid">'+[['academic','Academic registration','Programme','Software Engineering BSc (Hons)','School','Computing Science'],['finance','Financial registration','Fee record','Example funding arrangement','Funding route','Sponsor recorded']].map(([k,title,a,av,b,bv])=>'<article class="paper-card"><span class="micro">'+(k==='academic'?'Programme seal':'Funding seal')+'</span><h2>'+title+'</h2><dl><dt>'+a+'</dt><dd>'+av+'</dd><dt>'+b+'</dt><dd>'+bv+'</dd></dl>'+(state[k]?'<b>✓ Seal confirmed</b>':button('Confirm example record','reg'+k,()=>{state[k]=true;save();chime();render();notify(title+' confirmed.')},'outline'))+'</article>').join('')+'</div>';
}
function courses(){
  return intro('Student record  /  Course satchel','Course enrolment','Manage the optional course on your example Semester 2 record.')+'<article class="paper-card"><span class="micro">Optional course · Semester 2</span><h2>Human–Computer Interaction</h2><p>20 credits · Computing Science · Lecture time to be confirmed</p><p><b>'+(state.enrolled?'✓ Enrolled in your course satchel':'Available to enrol')+'</b></p>'+button(state.enrolled?'Review course drop':'Add to my courses','course-action',()=>{if(state.enrolled){open('Drop this course?','Course satchel','<p>Removing Human–Computer Interaction removes 20 optional credits from your example record.</p><div class="actions">'+button('Keep course','keep',close)+button('Confirm drop','drop',()=>{state.enrolled=false;save();close();render();notify('Course removed.')},'outline')+'</div>')}else{state.enrolled=true;save();render();notify('20 credits added to your example course record.')}},'outline')+'</article>';
}
function render(){
  stopFlight?.();stopFlight=null;actions.clear();
  const key=page();
  const views={schedule,houses:houseHall,'common-room':commonRoom,registration,courses};
  main.innerHTML=views[key]();
  document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+(key==='common-room'?'houses':key))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}
render();
