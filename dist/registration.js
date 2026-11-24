const registry = 'https://www.gla.ac.uk/myglasgow/registry/registration/';
const portal = 'https://frontdoor.spa.gla.ac.uk/Portal/Student.aspx';
const course = 'https://www.gla.ac.uk/undergraduate/degrees/softwareengineering/';
const fees = 'https://www.gla.ac.uk/myglasgow/students/payingyourfees/';
const guide = 'https://www.gla.ac.uk/media/Media_236010_smxx.pdf';
const routes = {
  personal: ['Self-funded', 'Review the amount due in your account summary, then choose an available payment method in MyCampus.'],
  funded: ['SAAS, SLC, sponsor or scholarship', 'Have your award or funding reference ready. In MyCampus, enter who will pay the University and check how much the award covers.'],
  mixed: ['Part-funded', 'Check the amount covered by your funding and arrange payment of your share using the options in MyCampus.']
};
const steps=['Welcome','Programme','Personal details','Declaration','Fees & funding','Receipt'];
const defaults={email:'alex@example.org',phone:'07700 900321',home:'12 Example Street, Sample Town',term:'',termUnknown:true,emergency:'Alex Example',emergencyPhone:'07700 900322'};
const link=(url,label,css='reg-link')=>'<a class="'+css+'" href="'+url+'" target="_blank" rel="noopener noreferrer">'+label+' ↗</a>';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function registrationRecord(raw,academic=false,finance=false){
  const r=raw&&typeof raw==='object'?raw:{};
  const furthest=finance&&academic?5:academic?4:0;
  const last=Number.isInteger(r.last)?Math.min(academic&&finance?5:academic?4:3,Math.max(furthest,r.last)):furthest;
  const step=Number.isInteger(r.step)?Math.min(last,Math.max(0,r.step)):last;
  const record={step,last,funding:Object.hasOwn(routes,r.funding)?r.funding:'',...defaults};
  for(const k of Object.keys(defaults)){
    if(typeof r[k]===typeof defaults[k])record[k]=typeof r[k]==='string'?r[k].slice(0,250):r[k];
  }
  return record;
}
function field(key,label,value,type='text'){
  return '<label class="reg-field">'+label+'<input name="'+key+'" type="'+type+'" value="'+escape(value)+'" maxlength="250" required'+(type==='tel'?' minlength="7" inputmode="tel"':'')+'></label>';
}
function body(r){
  switch(r.step){
    case 0:return '<p class="reg-lead">“Come in from the Glasgow rain. Hang up your coat, take a seat and let me see your programme.”</p><p>Take your place at Glasgow. Try the annual registration with a sample student record, or open your own record in MyCampus.</p><div class="reg-note">For the official process, look for your registration email, sign in to MyGlasgow and choose <b>My Registration</b>.</div>'+link(registry,'Find my registration checklist');
    case 1:return '<p class="reg-lead">“Software Engineering? A mind for making things. Science &amp; Engineering!”</p><dl class="reg-facts"><div><dt>Programme</dt><dd>Software Engineering BSc (Hons)</dd></div><div><dt>School</dt><dd>Computing Science</dd></div><div><dt>Degree</dt><dd>G430 · four years · Gilmorehill</dd></div></dl>'+link(course,'University degree entry')+'<label class="reg-check"><input type="checkbox" name="confirm" required'+(r.last>1?' checked':'')+'>I have checked the sample programme.</label><p class="reg-footnote">If your real programme looks wrong, contact your Adviser of Studies or programme administrator before continuing in MyCampus.</p>';
    case 2:return '<p>Edit the practice record below using invented details. Glasgow also asks about demographics, disability, emergency contacts and, where applicable, a photograph in MyCampus.</p><div class="reg-fields">'+field('email','Personal email',r.email,'email')+field('phone','Contact phone',r.phone,'tel')+field('home','Home address',r.home)+'<label class="reg-field">Term-time address<input name="term" value="'+escape(r.term)+'" maxlength="250" '+(r.termUnknown?'disabled':'required')+'></label></div><label class="reg-check"><input type="checkbox" name="termUnknown" '+(r.termUnknown?'checked':'')+'>Term-time address is not known yet</label><div class="reg-fields">'+field('emergency','Practice emergency contact',r.emergency)+field('emergencyPhone','Emergency contact phone',r.emergencyPhone,'tel')+'</div>'+link(guide,'See the full list of MyCampus fields');
    case 3:return '<p>Check the details you entered before completing the academic section.</p><dl class="reg-facts"><div><dt>Programme</dt><dd>Software Engineering BSc (Hons)</dd></div><div><dt>Contact email</dt><dd>'+escape(r.email)+'</dd></div><div><dt>Term address</dt><dd>'+escape(r.termUnknown?'To be confirmed':r.term)+'</dd></div></dl><p>The official student declaration appears in MyCampus after you review your information. '+link('https://www.gla.ac.uk/myglasgow/policy/studentcontract/termsandconditions/','Read Glasgow’s student contract')+'</p><label class="reg-check"><input type="checkbox" name="confirm" required'+(r.last>3?' checked':'')+'>I have reviewed this practice record.</label>';
    case 4:return '<p>In MyCampus, confirm your programme, check your account summary and tell Glasgow how your fees will be paid.</p><fieldset class="reg-routes"><legend>How will the sample fees be covered?</legend>'+Object.entries(routes).map(([key,[label]])=>'<label><input type="radio" name="funding" value="'+key+'" required '+(r.funding===key?'checked':'')+'> '+label+'</label>').join('')+'</fieldset><p id="funding-help" class="reg-note" aria-live="polite">'+(routes[r.funding]?.[1]||'Choose a funding route to see the next step.')+'</p>'+link(fees,'University fees and payment guidance');
    default:return '<p class="reg-lead">“There’s your name in the roll. Now, I believe you have a lecture to catch.”</p><dl class="reg-facts"><div><dt>Academic registration</dt><dd>Practice complete ✓</dd></div><div><dt>Financial registration</dt><dd>Practice complete ✓</dd></div><div><dt>Funding route</dt><dd>'+escape(routes[r.funding]?.[0]||'Previously reviewed')+'</dd></div></dl><p>Your official status and any outstanding actions appear in MyCampus. After academic registration, use <b>My Requirements</b> in Enrolment to choose your classes.</p>'+link('https://www.gla.ac.uk/myglasgow/registry/enrolment/howtoenrolonmycampus/','Glasgow’s enrolment guide');
  }
}
export function registrationPage(state){
  const r=state.registration;
  const headings=['The Sorting Hat','Your college is Science &amp; Engineering','Your contact details','Academic declaration','Financial registration','Your registration receipt'];
  const buttons=['Meet the hat','Confirm programme','Review my details','Complete academic practice','Finish practice registration'];
  const rail=steps.map((s,i)=>'<li><button type="button" data-reg-step="'+i+'" '+(i>r.last?'disabled':'')+(i===r.step?' aria-current="step"':'')+'><span>'+(i<r.last?'✓':i+1)+'</span>'+s+'</button></li>').join('');
  const stepOptions=steps.map((s,i)=>'<option value="'+i+'" '+(i>r.last?'disabled ':'')+(i===r.step?'selected':'')+'>'+s+'</option>').join('');
  return '<section class="reg"><header class="reg-head"><div><p class="overline">Glasgow Uni · 2026–27</p><h1>My registration</h1></div>'+link(portal,'Open official MyCampus','outline')+'</header><div class="reg-layout"><aside class="reg-rail"><div class="reg-hat"><img src="art/pixel-sorting-hat.png" alt="A crooked blue sorting hat with a bronze brim"></div><h2>Registration roll</h2><label class="reg-jump">Registration step<select>'+stepOptions+'</select></label><ol>'+rail+'</ol></aside><article class="reg-paper"><p class="reg-kicker">Practice record · '+(r.step===0?'Arrival':r.step===5?'Complete':'Step '+r.step+' of 4')+'</p><h2 id="reg-title" tabindex="-1">'+headings[r.step]+'</h2><form id="reg-form" autocomplete="off">'+body(r)+'<div class="reg-actions">'+(r.step===5?'<a class="button" href="#courses">Go to course enrolment</a>':'<button class="button" type="submit">'+buttons[r.step]+'</button>')+(r.step>0&&r.step<5?'<button type="button" class="quiet" data-reg-step="'+(r.step-1)+'">Back</button>':'')+'</div></form><div class="reg-folio">Practice progress saves on this device. Submit official details in MyCampus.</div></article></div></section>';
}
export function mountRegistration(main,state,save,render){
  const r=state.registration,form=main.querySelector('#reg-form');
  const go=step=>{r.step=step;save();render();main.querySelector('#reg-title').focus()};
  for(const b of main.querySelectorAll('[data-reg-step]'))b.addEventListener('click',()=>{const step=Number(b.dataset.regStep);if(step<=r.last)go(step)});
  const jump=main.querySelector('.reg-jump select');
  jump.addEventListener('change',()=>{const step=Number(jump.value);if(step<=r.last)go(step)});
  const syncDetails=()=>{
    if(r.step!==2)return;
    for(const key of Object.keys(defaults)){
      const input=form.elements.namedItem(key);r[key]=input.type==='checkbox'?input.checked:input.value;
    }
    form.elements.term.disabled=r.termUnknown;form.elements.term.required=!r.termUnknown;
  };
  form.addEventListener('input',()=>{
    syncDetails();
    if(r.step>=1 && r.step<=4){
      r.last=Math.min(r.last,r.step);
      if(r.step<=3)state.academic=false;
      state.finance=false;
      for(const option of jump.options) option.disabled=Number(option.value)>r.last;
      for(const b of main.querySelectorAll('[data-reg-step]')){
        if(Number(b.dataset.regStep)>r.last){b.disabled=true;b.querySelector('span')?.replaceChildren(String(Number(b.dataset.regStep)+1))}
      }
    }
    if(r.step===4){r.funding=form.elements.funding.value;main.querySelector('#funding-help').textContent=routes[r.funding][1]}
    save();
  });
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.reportValidity()||r.step>=5)return;
    syncDetails();
    if(r.step===3)state.academic=true;
    if(r.step===4){r.funding=form.elements.funding.value;state.finance=true}
    r.last=Math.max(r.last,r.step+1);go(r.step+1);
  });
}
