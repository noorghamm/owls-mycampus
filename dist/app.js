import {registrationPage,mountRegistration} from './registration.js?v=55ff2a24';
import {lectures,contacts,breaks,houses,featherSpots,saveKey,restore,points} from './data.js?v=42f3335e';
import {fly} from './flight.js';
import {stations,exploreTower} from './tower.js';
import {fixtures,teams,standings,homeTeam,seasonStandings,cupHonour} from './league.js';
import {mountRace} from './broom.js';

const main=document.querySelector('main'), dialog=document.querySelector('#panel'), body=document.querySelector('#panel-body');
let raw;try{raw=localStorage.getItem(saveKey)}catch{}
let state=restore(raw), stopFlight=null, toastTimer, audio, saveFailed=false;
let leaveScene, fixtureIndex=0, ledger='houses';
const actions=new Map();
const pages=new Set(['schedule','houses','common-room','registration','courses','flight','league']);
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
const menu = document.querySelector('.campus-menu');
const header = menu.closest('header');
const closeMenu = () => menu.setAttribute('aria-expanded','false');
menu.addEventListener('click', () => menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true')));
document.addEventListener('click', event => {
  if (!header.contains(event.target) || event.target.closest('a')) closeMenu();
});
header.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
header.addEventListener('focusout', event => { if (!header.contains(event.relatedTarget)) closeMenu(); });
document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault(); closeMenu(); main.focus(); main.scrollIntoView({block:'start'});
});
window.addEventListener('hashchange',()=>{closeMenu();close();render();main.focus({preventScroll:true});window.scrollTo(0,0)});
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
  const pins=lectures.map((c,i)=>'<button type="button" class="pin '+(state.stamps.includes(i)?'done':i===nextStop()?'next-stop':'')+'" style="--x:'+c.x+'%;--y:'+c.y+'%" aria-label="Open lecture pass for '+c.name+' at '+c.venue+'" '+act('pin'+i,()=>pass(i))+'>'+(state.stamps.includes(i)?'✓ ':'')+c.short+'</button>').join('');
  const motes=featherSpots.map(([x,y],i)=>state.feathers.includes(i)?'':'<i class="mote" aria-hidden="true" data-mote="'+i+'" style="--x:'+x+'%;--y:'+y+'%"></i>').join('');
  const loc=owlHome();
  return '<div class="atlas"><div class="atlas-top"><b>Gilmorehill flight chart</b><div class="map-controls">'+button('Sound '+(state.sound?'on':'off'),'sound',()=>{state.sound=!state.sound;save();chime();render()},'outline sound')+'</div></div><div class="map" role="group" aria-label="Interactive Glasgow campus flight chart"><svg aria-hidden="true" class="path-layer" viewBox="0 0 100 100" preserveAspectRatio="none">'+trails+'</svg>'+motes+pins+'<img class="owl-sprite perched" style="left:'+loc.x+'%;top:'+loc.y+'%" src="art/rowan.svg" alt="Rowan the barn owl"></div><div class="atlas-foot"><span>✦ &nbsp; '+(stampCount()===3?'All three lecture stops charted.':'Catch golden moonfeathers as you fly.')+'</span><small>'+state.feathers.length+' / 9 found</small></div></div>';
}
function calendarDownload(){
  const events=lectures.map(c=>[
    'BEGIN:VEVENT','UID:20261124-'+c.id+'@owls-mycampus.local','DTSTAMP:20261124T000000Z',
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
  return '<button class="time-row '+(i===nextStop()?'next-row':'')+'" '+act('row'+i,()=>pass(i))+'><span class="slot"><b>'+c.time+'</b><small>'+c.end+'</small></span><span class="slot-detail">'+(i===nextStop()?'<small class="next-lecture">Up next</small>':'')+'<b>'+c.name+'</b><small>'+c.venue+' · '+c.room+'</small></span><span class="row-end" aria-hidden="true">'+(done?'✓':'›')+'</span>'+(done?'<span class="sr-only">Checked in</span>':'')+'</button>';
}
function schedule(){
  const i=nextStop(),c=lectures[i],bp=state.breakIndex<0?'Plan your break':breaks[state.breakIndex];
  const rows=lectures.map(timetableRow).join('');
  const agenda='<section class="day-pass"><div class="pass-heading"><span class="micro">Tuesday, 24 November</span><h2>Today’s lectures</h2></div>'+rows+'<div class="pass-bottom"><div class="day-progress"><small>'+stampCount()+' of '+lectures.length+' checked in</small><progress aria-label="Lecture check-ins" value="'+stampCount()+'" max="'+lectures.length+'"></progress></div>'+button(i<0?'View flight seal':'Check in for '+c.time,'check-next',()=>i<0?seal():pass(i),'outline')+'</div></section>';
  const map='<section class="chart-wrap">'+chart()+'<div class="chart-action"><div><small>'+(c?'Next stop':'Flight complete')+'</small><b>'+(c?c.venue:'Gilmorehill')+'</b></div>'+button(c?'Fly with Rowan':'View seal','fly-next',()=>c?startFlight(i):seal())+'</div></section>';
  const registrationStatus=state.academic&&state.finance?'Practice complete':state.registration.last>0||state.academic||state.finance?'Continue registration':'Start registration';
  return '<header class="page-head"><div><p class="overline">Science &amp; Engineering</p><h1>Owl Schedule</h1></div>'+button('Export calendar','export',calendarDownload,'quiet')+'</header><div class="chart-day">'+agenda+map+'</div><div class="desk-strip"><button '+act('breaks',breakDialog)+'><small>Between lectures</small><b>'+bp+'</b></button><a href="#common-room"><small>Common room</small><b>School contacts</b></a><a href="#registration"><small>Registration</small><b>'+registrationStatus+'</b></a></div>';

}
function flightView(){
  const i=nextStop();
  return intro('','Campus map','Gilmorehill · Glasgow',stats())+'<div class="game-layout">'+chart()+'<section class="flight-list"><h2>Flight routes</h2>'+lectures.map((c,i)=>'<button class="route" '+act('route'+i,()=>startFlight(i))+'><b>'+c.short+'</b><small>'+c.name+'</small></button>').join('')+'<div class="actions">'+button(i<0?'View full-flight seal':'Fly to next class','flight-next',()=>i<0?seal():startFlight(i))+'</div></section></div>';
}
function startFlight(i){
  close();if(page()!=='flight'&&page()!=='schedule'){location.hash='flight';window.addEventListener('hashchange',()=>startFlight(i),{once:true});return;}
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
    '<p class="dialog-body"><b>'+c.venue+'</b><br>'+c.room+'</p><p>'+c.topic+'</p><hr><p class="demo-note">Practice check-in</p><div class="actions">'+(done?button('✓ Checked in','done',close,'outline'):button('Check in','stamp',()=>stamp(i)))+
    (!landed?button(done?'Fly this route again':'Fly to this building','fly-here',()=>startFlight(i),'outline'):'')+'</div>');
}
function stamp(i){
  if(state.stamps.includes(i)){close();return}
  state.stamps.push(i);save();chime(stampCount()===3);render();
  if(stampCount()===3){seal();return}
  open('Checked in',lectures[i].short,'<p class="center">'+lectures[i].name+' · <b>+10 points</b></p><div class="actions center">'+button('Done','return',close)+'</div>');
}
function seal(){
  open('A full flight','The Gilmorehill flight seal','<div class="seal"><img width="72" height="72" src="art/rowan.svg" alt="Rowan"></div><p class="center">All three lecture passes are stamped. <b>50 flight points</b> — 30 for your lectures and 20 for the complete route.</p><div class="actions center">'+button('Return to my schedule','return',()=>{close();location.hash='schedule'})+'</div>');
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
  const keepers=contacts.map((c,i)=>{
    const spot=stations[i];
    return '<button type="button" class="tower-npc" style="--x:'+spot.x+'%;--y:'+spot.y+'%" data-station="'+i+'" data-name="'+c.name+'" aria-label="Walk to '+c.name+', '+c.role+'"><span>'+c.short+'</span><img src="art/pixel-'+c.sprite+'.png" alt=""></button>';
  }).join('');
  const directory=contacts.map((c,i)=>'<button class="keeper-entry" '+act('talk'+i,()=>visitKeeper(i))+'><img src="art/pixel-'+c.sprite+'.png" alt=""><span><b>'+c.name+'</b><small>'+c.role+'</small></span><i aria-hidden="true">'+(state.met.includes(i)?'✦':'›')+'</i></button>').join('');
  return '<section class="realm"><header class="realm-head"><div><p class="eyebrow">Science &amp; Engineering · Common room</p><h1>The Aerie</h1><p>Find the right person for a course change, an adjustment or a difficult week.</p></div><a class="outline" href="#league">Broom Cup pitch</a></header><div class="tower-grid"><div class="tower-console"><div class="tower-scene" tabindex="0" role="group" aria-label="Walkable common room. Use arrow keys or WASD to move and E to speak, or select a contact.">'+keepers+'<img class="tower-player" src="art/pixel-scholar.png" alt="Your scholar"></div><div class="tower-toolbar"><small>Tap to walk · Arrow keys to move · E to speak</small><button type="button" class="outline talk-prompt" disabled>Approach a contact</button></div></div><aside class="keeper-directory"><span class="micro">School &amp; college directory</span><h2>Staff contacts</h2>'+directory+'<div class="tower-seal"><b>'+(state.met.length===4?'✦ Aerie crest earned':'The Aerie crest')+'</b><small>'+state.met.length+' of 4 contacts discovered</small></div></aside></div></section>';
}
function visitKeeper(i){
  if(!state.met.includes(i)){
    state.met.push(i);save();chime(state.met.length===4);
    const badge=main.querySelector('.tower-seal');
    if(badge){badge.querySelector('small').textContent=state.met.length+' of 4 contacts discovered';if(state.met.length===4)badge.querySelector('b').textContent='✦ Aerie crest earned'}
    const mark=main.querySelector('[data-action="talk'+i+'"] i');if(mark)mark.textContent='✦';
  }
  keeper(i);
}
function cupBoard(){
  const f=fixtures[fixtureIndex], rows=ledger==='season'?seasonStandings(state.broomBests):standings(fixtureIndex,state.broomBests);
  if(ledger==='students'){
    const students=teams.flatMap((t,i)=>t.students.map((name,j)=>({name,team:t.short,mark:f.marks[i][j]}))).sort((a,b)=>b.mark-a.mark||a.name.localeCompare(b.name));
    return '<table><caption>Student league · sample assignment marks</caption><thead><tr><th>Student</th><th>College</th><th>Mark</th></tr></thead><tbody>'+students.map(st=>'<tr class="'+(st.name==='You'?'home-team':'')+'"><th>'+st.name+'</th><td>'+st.team+'</td><td>'+st.mark+'%</td></tr>').join('')+'</tbody></table>';
  }
  return '<table><caption>'+(ledger==='season'?'House standings · Full season':'House standings · '+f.short)+'</caption><thead><tr><th>House</th><th>Marks</th><th>Flight</th><th>Total</th></tr></thead><tbody>'+rows.map(t=>'<tr class="'+(t.id===homeTeam?'home-team':'')+'"><th><i style="background:'+t.color+'"></i>'+t.short+'</th><td>'+t.coursework+'</td><td>'+t.flight+'</td><td><b>'+t.total+'</b></td></tr>').join('')+'</tbody></table>';
}
function league(){
  const honour=cupHonour(state.broomBests);
  const menu=fixtures.map((x,i)=>'<option value="'+i+'" '+(i===fixtureIndex?'selected':'')+'>'+x.name+'</option>').join('');
  return '<section class="realm"><header class="realm-head"><div><p class="eyebrow">Intercollegiate broom racing</p><h1>The Gilmorehill Cup</h1><p>Five brass hoops and a winged comet. Ride for Science &amp; Engineering.</p></div><a class="outline" href="#common-room">Return to the Aerie</a></header><div class="cup-grid"><div class="pitch-console"><div class="pitch" tabindex="0" role="group" aria-label="Broom race. Steer with the up and down arrow keys, or touch the pitch. Space pauses."><canvas aria-hidden="true"></canvas><div class="pitch-hud"><span class="race-readout">Personal best · '+state.broomBests[fixtureIndex]+' / 30</span><span class="race-call" aria-live="polite">At the starting line</span></div></div><div class="broom-controls"><button class="button" data-race-start>Mount your broom</button><button class="quiet" data-race-pause disabled>Pause</button><button class="quiet" data-lane="-1" aria-label="Steer up">↑</button><button class="quiet" data-lane="1" aria-label="Steer down">↓</button></div><p class="flight-manual">Steer with ↑ and ↓ or drag on the pitch. Each hoop earns 4 points. Catch the comet for 10 more.</p><div class="race-result" role="status" hidden></div><div class="cup-progress"><b>'+(honour||'House pennant')+'</b><small>'+(honour?'Earned this season':'Score in all three fixtures · '+state.broomBests.filter(Boolean).length+' / 3')+'</small></div></div><aside class="cup-ledger"><span class="micro">Demo season</span><h2>League table</h2><label for="fixture">Assignment fixture</label><select id="fixture">'+menu+'</select><div class="ledger-tabs">'+['houses','students','season'].map(k=>'<button aria-pressed="'+(ledger===k)+'" '+act('ledger-'+k,()=>switchLedger(k))+'>'+ (k==='houses'?'Houses':k==='season'?'Season':'Students')+'</button>').join('')+'</div><div id="cup-board">'+cupBoard()+'</div><p>Each house combines its average assignment mark with its best flight. The marks are fictional.</p></aside></div></section>';
}
function switchLedger(k){
  ledger=k;main.querySelector('#cup-board').innerHTML=cupBoard();
  main.querySelectorAll('.ledger-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action==='ledger-'+k)));
}
function finishRace(score,hoops,comet){
  const old=state.broomBests[fixtureIndex];state.broomBests[fixtureIndex]=Math.max(old,score);save();chime(score>old);
  const result=main.querySelector('.race-result');result.hidden=false;
  result.textContent=hoops+' of 5 hoops · '+(comet?'Comet caught':'Comet missed')+' · '+score+' flight points. '+(score>old?'New house best!':'House best: '+old+'.');
  main.querySelector('#cup-board').innerHTML=cupBoard();
  const progress=main.querySelector('.cup-progress');
  const honour=cupHonour(state.broomBests);
  progress.querySelector('b').textContent=honour||'House pennant';
  progress.querySelector('small').textContent=honour?'Earned this season':'Score in all three fixtures · '+state.broomBests.filter(Boolean).length+' / 3';
}
function keeper(i){
  const c=contacts[i];
  const external=(url,label,css='contact-link')=>'<a class="'+css+'" href="'+url+'" '+(url.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':'')+'>'+label+'</a>';
  const bookmarked=state.friends.includes(i);
  const pin=bookmarked?'<span class="chip">✦ Feather bookmark</span>':spare()?button('Bookmark with one feather','bookmark',()=>{
    if(!state.friends.includes(i)&&spare()){state.friends.push(i);save();chime();keeper(i)}
  },'quiet'):'';
  open(c.name,c.role,'<img class="portrait pixel-portrait" src="art/pixel-'+c.sprite+'.png" alt=""><p>'+c.detail+'</p><div class="actions">'+external(c.url,c.action,'button')+pin+'</div><div class="contact-sources">'+(c.extra?external(c.extra,c.extraLabel):'')+external(c.source,c.sourceLabel+' ↗')+'</div>');
}
function courses(){
  return intro('Semester 2','Course enrolment','School of Computing Science')+'<article class="paper-card"><span class="micro">Optional course · Semester 2</span><h2>Human–Computer Interaction</h2><p>20 credits · Computing Science · Lecture time to be confirmed</p><p><b>'+(state.enrolled?'✓ Enrolled':'Available to enrol')+'</b></p>'+button(state.enrolled?'Review course drop':'Add to my courses','course-action',()=>{if(state.enrolled){open('Drop this course?','Course satchel','<p>Removing Human–Computer Interaction removes 20 optional credits from your example record.</p><div class="actions">'+button('Keep course','keep',close)+button('Confirm drop','drop',()=>{state.enrolled=false;save();close();render();notify('Course removed.')},'outline')+'</div>')}else{state.enrolled=true;save();render();notify('20 credits added to your example course record.')}},'outline')+'</article>';
}
function render(){
  stopFlight?.();stopFlight=null;leaveScene?.();leaveScene=null;actions.clear();
  const key=page();
  const views={schedule,flight:flightView,houses:houseHall,'common-room':commonRoom,league,registration:()=>registrationPage(state),courses};
  main.innerHTML=views[key]();
  if(key==='registration')mountRegistration(main,state,save,render);
  if(key==='common-room')leaveScene=exploreTower(main.querySelector('.tower-scene'),visitKeeper);
  if(key==='league'){
    main.querySelector('#fixture').addEventListener('change',e=>{fixtureIndex=Number(e.target.value);render()});
    leaveScene=mountRace(main.querySelector('.pitch'),fixtureIndex,finishRace);
  }
  document.querySelectorAll('nav a').forEach(a=>{if(a.hash==='#'+key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}
render();
