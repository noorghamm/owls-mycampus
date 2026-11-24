import {lectures,companions,breaks,houses,featherSpots,saveKey,restore,points} from './data.js';
import {fly} from './flight.js';

const main=document.querySelector('main'), dialog=document.querySelector('#panel'), body=document.querySelector('#panel-body');
let raw;try{raw=localStorage.getItem(saveKey)}catch{}
let state=restore(raw), stopFlight=null, toastTimer, audio, saveFailed=false;
const actions=new Map();
const pages=new Set(['schedule','houses','common-room','registration','courses','flight']);
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
function calendarDownload(){
  const events=lectures.map(c=>[
    'BEGIN:VEVENT','UID:20261124-'+c.code+'@owls-mycampus.local','DTSTAMP:20261124T000000Z',
    'DTSTART:20261124T'+c.time.replace(':','')+'00Z','DTEND:20261124T'+c.end.replace(':','')+'00Z',
    'SUMMARY:'+c.name,'LOCATION:'+c.venue+' — '+c.room,'DESCRIPTION:Sample Owls MyCampus timetable.','END:VEVENT'
  ].join('\r\n'));
  const calendar=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Owls MyCampus//Sample timetable//EN',...events,'END:VCALENDAR',''].join('\r\n');
  const url=URL.createObjectURL(new Blob([calendar],{type:'text/calendar;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='glasgow-timetable-24-november.ics';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function timetableRow(c,i){
  const done=state.stamps.includes(i);
  return '<button class="time-row" '+act('row'+i,()=>pass(i))+'><span class="slot"><b>'+c.time+'</b><small>'+c.end+'</small></span><span class="slot-detail"><b>'+c.name+'</b><small>'+c.venue+' · '+c.room+'</small></span><span class="row-end">'+(done?'✓':'›')+'</span></button>';
}
function schedule(){
  const i=nextStop(),c=lectures[i],bp=state.breakIndex<0?'Plan your break':breaks[state.breakIndex];
  const next=c?'<div><span class="micro">Next to check in</span><h2>'+c.name+'</h2><p>'+c.time+'–'+c.end+' · '+c.venue+' · '+c.room+'</p></div>'+button('View class','next',()=>pass(i)):'<div><span class="micro">Attendance</span><h2>All three classes checked in</h2><p>50 points earned today.</p></div>'+button('View seal','next',seal);
  const rows=lectures.map((c,i)=>timetableRow(c,i)+(i===1?'<button class="break-row" '+act('breaks',breakDialog)+'><span>12:00–14:00</span><b>'+bp+'</b><span>›</span></button>':'')).join('');
  return '<header class="page-head"><div><p class="overline">My timetable</p><h1>Tuesday, 24 November</h1></div>'+button('Export calendar','export',calendarDownload,'quiet')+'</header><div class="today-grid"><div><section class="next-class">'+next+'</section><section class="agenda"><div class="section-head"><h2>Day schedule</h2><small>'+stampCount()+' / 3 checked in</small></div>'+rows+'</section></div><aside><a class="map-preview" href="#flight"><img src="art/campus-map.svg" alt="Illustrated map of Gilmorehill"><span><b>Campus map</b><small>Explore with Rowan &nbsp;›</small></span></a><section class="student-links"><h2>Student services</h2><a href="#common-room"><b>School contacts</b><small>Advisers and student support</small></a><a href="#registration"><b>Registration</b><small>'+(Number(state.academic)+Number(state.finance))+' of 2 steps complete</small></a><a href="#courses"><b>Course enrolment</b><small>Semester 2 · '+(state.enrolled?'20 optional credits':'Manage courses')+'</small></a></section></aside></div>';
}
function flightView(){
  const i=nextStop();
  return intro('','Campus map','Gilmorehill · Glasgow',stats())+'<div class="game-layout">'+chart()+'<section class="flight-list"><h2>Flight routes</h2>'+lectures.map((c,i)=>'<button class="route" '+act('route'+i,()=>startFlight(i))+'><b>'+c.short+'</b><small>'+c.name+'</small></button>').join('')+'<div class="actions">'+button(i<0?'View full-flight seal':'Fly to next class','flight-next',()=>i<0?seal():startFlight(i))+'</div></section></div>';
}
function startFlight(i){
  close();if(page()!=='flight'){location.hash='flight';window.addEventListener('hashchange',()=>startFlight(i),{once:true});return;}
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
    '<p class="dialog-body"><b>'+c.venue+'</b><br>'+c.room+'</p><p>'+c.topic+'</p><hr><p class="demo-note">Sample check-in · Illustrative room assignment</p><div class="actions">'+(done?button('✓ Checked in','done',close,'outline'):button('Check in','stamp',()=>stamp(i)))+
    (!landed?button(done?'Fly this route again':'Fly to this building','fly-here',()=>startFlight(i),'outline'):'')+'</div>');
}
function stamp(i){
  if(state.stamps.includes(i)){close();return}
  state.stamps.push(i);save();chime(stampCount()===3);render();
  if(stampCount()===3){seal();return}
  open('Checked in',lectures[i].short,'<p class="center">'+lectures[i].name+' · <b>+10 points</b></p><div class="actions center">'+button('Done','return',close)+'</div>');
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
  return intro('','College houses','Science & Engineering is your college.')+'<div class="keepers">'+houses.map((h,i)=>'<article class="banner" style="--house:'+colours[i]+'"><span class="sigil" aria-hidden="true">'+sigils[i]+'</span><h2>'+h+'</h2><p>'+(i===1?'Your house · Computing Science':'College house')+'</p>'+(i===1?'<a class="button" href="#common-room">Enter common room</a>':'')+'</article>').join('')+'</div>';
}
function commonRoom(){
  return intro('Science & Engineering','School contacts','School of Computing Science')+'<div class="keepers">'+companions.map((c,i)=>'<article class="keeper"><img src="art/'+c.animal+'.svg" alt="'+c.name+', a '+c.animal+'"><h2>'+c.role+'</h2><p>'+c.detail+'</p>'+button('Contact details','keeper'+i,()=>keeper(i),'outline')+'</article>').join('')+'</div><div class="subnav"><a class="outline" href="#houses">House Hall</a><a class="quiet" href="#schedule">Return to Owl Schedule</a></div>';
}
function keeper(i){
  const c=companions[i],friend=state.friends.includes(i);
  open(c.role,c.name+' · Common room','<img class="portrait" src="art/'+c.animal+'.svg" alt=""><p><b>'+c.title+'</b></p><p>'+c.detail+'</p><p class="dialog-body">'+(friend?c.quote:'Golden moonfeathers drift above the campus. Bring one back to befriend '+c.name+'.')+'</p><div class="actions"><a class="button" href="'+c.url+'" '+(c.url.startsWith('https')?'target="_blank" rel="noopener noreferrer"':'')+'>'+c.action+'</a>'+(friend?'<span class="chip">✦ Befriended</span>':spare()?button('Offer one feather','gift',()=>{if(spare()&&!state.friends.includes(i)){state.friends.push(i);save();chime();render();keeper(i)}},'outline'):button('Find feathers','find',()=>{close();location.hash='flight'},'outline'))+'</div>');
}
function registration(){
  const count=Number(state.academic)+Number(state.finance);
  return intro('2026–27','Registration','Check your programme and funding details.', '<div class="stat"><strong>'+count+' / 2</strong><small>Confirmed</small></div>')+'<div class="grid">'+[['academic','Academic registration','Programme','Software Engineering BSc (Hons)','School','Computing Science'],['finance','Financial registration','Fee record','Example funding arrangement','Funding route','Sponsor recorded']].map(([k,title,a,av,b,bv])=>'<article class="paper-card"><span class="micro">'+(k==='academic'?'Academic record':'Funding record')+'</span><h2>'+title+'</h2><dl><dt>'+a+'</dt><dd>'+av+'</dd><dt>'+b+'</dt><dd>'+bv+'</dd></dl>'+(state[k]?'<b>✓ Confirmed</b>':button('Confirm example record','reg'+k,()=>{state[k]=true;save();chime();render();notify(title+' confirmed.')},'outline'))+'</article>').join('')+'</div>';
}
function courses(){
  return intro('Semester 2','Course enrolment','School of Computing Science')+'<article class="paper-card"><span class="micro">Optional course · Semester 2</span><h2>Human–Computer Interaction</h2><p>20 credits · Computing Science · Lecture time to be confirmed</p><p><b>'+(state.enrolled?'✓ Enrolled':'Available to enrol')+'</b></p>'+button(state.enrolled?'Review course drop':'Add to my courses','course-action',()=>{if(state.enrolled){open('Drop this course?','Course satchel','<p>Removing Human–Computer Interaction removes 20 optional credits from your example record.</p><div class="actions">'+button('Keep course','keep',close)+button('Confirm drop','drop',()=>{state.enrolled=false;save();close();render();notify('Course removed.')},'outline')+'</div>')}else{state.enrolled=true;save();render();notify('20 credits added to your example course record.')}},'outline')+'</article>';
}
function render(){
  stopFlight?.();stopFlight=null;actions.clear();
  const key=page();
  const views={schedule,flight:flightView,houses:houseHall,'common-room':commonRoom,registration,courses};
  main.innerHTML=views[key]();
  document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}
render();
