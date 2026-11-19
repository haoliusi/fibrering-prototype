
const GOAL=15;
var MEALS=["Breakfast","Lunch","Dinner","Snack"];
var STAPLES=[
{id:"rice",name:"White rice",freq:4,to:"Brown rice or quinoa",gain:"about +2 to 3 g per serving"},
{id:"bread",name:"White bread",freq:5,to:"100% whole grain bread",gain:"about +2 g per slice"},
{id:"cereal",name:"Standard cereal",freq:3,to:"High-fiber cereal",gain:"about +3 to 5 g per bowl"}];
// USDA/HHS Food Sources of Fiber: standard portions, normalized to ½ cup cooked.
const FOODS = {
  "black beans": 7.5, lentils: 7.8, chickpeas: 6.3, broccoli: 5.2 / 2,
  "green peas": 8.8 / 2, carrots: 4.8 / 2, spinach: 4.3 / 2,
  "kidney beans": 5.7, "pinto beans": 7.7, edamame: 4.1,
  kale: 4.7 / 2, cauliflower: 4.9 / 2, "green beans": 4 / 2,
  "brussels sprouts": 6.4 / 2
};
var S={tab:0,on:{rice:true,bread:true,cereal:true,pasta:false},freq:{rice:4,bread:5,cereal:3,pasta:2},adopted:{},
habit:{anchor:"Lunch",food:"black beans",cups:0.5,time:"12:00"},meal:"Lunch",toast:"",
fib:{Breakfast:0,Lunch:0,Dinner:0,Snack:0},done:{},fiberVersion:3,last:null,asked:true,msg:"",onb:0,ready:6,conf:8,why:{},habitLogged:false,history:[],theme:"light"};
var INITIAL=JSON.parse(JSON.stringify(S));
try { var saved=JSON.parse(localStorage.getItem("fibrering-v1")); if(saved && saved.onb>=0) {
  S=Object.assign(S,saved);
  S.habit.anchorChosen ??= saved.tab>=3 || !!S.habitEntry || S.habit.anchor!=='Lunch';
  S.habit.foodChosen ??= saved.tab>=3 || !!S.habitEntry || S.habit.food!=='black beans';
  if((saved.fiberVersion||0)<2) {
    S.fib.Breakfast=Math.max(0,S.fib.Breakfast-9);
    if(S.habitEntry?.meal!=='Breakfast' && S.swapEntry?.meal!=='Breakfast') delete S.done.Breakfast;
    S.history=[];
  }
  if ((saved.fiberVersion || 0) < 3) {
    // The old one-tap answer did not record which swaps were completed.
    if (S.swapEntry) {
      const {meal, amount} = S.swapEntry;
      S.fib[meal] = Math.max(0, S.fib[meal] - amount);
      if (S.habitEntry?.meal !== meal) delete S.done[meal];
      S.last = S.habitEntry ? {meal: S.habitEntry.meal, amt: S.habitEntry.amount} : null;
    }
    S.swapEntry = null;
    S.swapAnswer = null;
    S.history = [];
  }
  S.fiberVersion = 3;
  S.habit.cups ??= 0.5;
} } catch(e) {}
S.onb=3;
document.documentElement.dataset.theme="light";
S.tab=0;
S.customStaples=Array.isArray(S.customStaples)?S.customStaples:[];
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function staples(){return STAPLES.concat(S.customStaples.map(x=>({...x,name:esc(x.name),to:esc(x.name)+' — choose a higher-fiber alternative',gain:'Compare fiber on the package label.'})))}
var showMore=false;
S.swapChoices=S.swapChoices||{};S.declined=S.declined||{};
// USDA SR Legacy (rice and bread) and USDA/HHS/VA portion tables (cereal).
const SWAPS = {
  rice: {portion: '100 g cooked', original: 0.4,
    options: {'Brown rice': 1.6, Quinoa: 2.8, 'Wild rice': 1.8}},
  bread: {portion: '30 g', original: 2.7 * 0.3,
    options: {'100% whole grain bread': 6 * 0.3, 'Whole rye bread': 5.8 * 0.3, 'Whole wheat pita': 6.1 * 0.3}},
  cereal: {portion: '½ cup prepared', original: 0.4, baseline: 'corn flakes',
    options: {'High-fiber cereal': 14, Oatmeal: 2, 'Bran cereal': 5.5 * 2 / 3}}
};
S.completedSwaps ??= {};
const roundFiber = value => Math.round((value + 1e-9) * 10) / 10;
function choice(staple) {
  const options = SWAPS[staple.id]?.options;
  if (!options) return staple.to;
  const selected = S.swapChoices[staple.id];
  return Object.hasOwn(options, selected) ? selected : Object.keys(options)[0];
}
function swapGain(staple) {
  const data = SWAPS[staple.id];
  return data ? roundFiber(data.options[choice(staple)] - data.original) : null;
}
function habitGain() {
  const perHalfCup = FOODS[S.habit.food] ?? S.customFoods?.[S.habit.food] ?? 0;
  return roundFiber(perHalfCup * (S.habit.cups || 0) * 2);
}
function habitPortion() {
  const cups = S.habit.cups;
  return cups + (cups === 1 ? ' cup' : ' cups') + ' cooked';
}
function habitReady() {
  return S.habit.anchorChosen && S.habit.foodChosen && S.habit.cups > 0;
}
const SWAP_SOURCES = '<p class="mut">Reference portions and example products. Fiber varies by brand and preparation. <a href="https://www.nal.usda.gov/sites/default/files/page-files/Total_Dietary_Fiber.pdf" target="_blank" rel="noopener">USDA nutrient data</a> · <a href="https://www.ncbi.nlm.nih.gov/books/NBK589559/table/usdaddb12.tab1/" target="_blank" rel="noopener">USDA cereal baseline</a> · <a href="https://www.dietaryguidelines.gov/sites/default/files/2024-08/Food-Sources-Fiber-Standard-508C.pdf" target="_blank" rel="noopener">USDA/HHS portions</a> · <a href="https://nutrition.va.gov/NUTRITION/docs/UpdatedPatientEd/FiberContentofFoods2021.pdf" target="_blank" rel="noopener">VA oatmeal data</a></p>';

var TABS=["Check-in","Swaps","Habit","Notification","Today","Progress"];

function navIcon(i){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+[
'<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 4V2h6v2M9 12l2 2 4-4"/>',
'<path d="M4 7h15l-4-4m4 4-4 4M20 17H5l4-4m-4 4 4 4"/>',
'<path d="M20 4C9 3 3 10 7 16s14 2 13-12ZM5 21l10-11"/>',
'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 6"/>'
][i===3?3:i>3?i-1:i]+'</svg>'}
function el(id){return document.getElementById(id)}
function total(){return MEALS.reduce(function(a,m){return Math.round((a+S.fib[m])*10)/10},0)}
function upcoming(){return MEALS.filter(function(m){return !S.done[m]})}
function ring(){var t=total(),p=Math.min(t/GOAL,1),c=2*Math.PI*66;
return '<svg class="ring" width="170" height="170" viewBox="0 0 170 170" role="img" aria-label="'+t+' of '+GOAL+' grams of added fiber today"><circle cx="85" cy="85" r="66" fill="none" stroke="var(--track)" stroke-width="14"/><circle cx="85" cy="85" r="66" fill="none" stroke="var(--grain)" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+(c*p).toFixed(1)+' '+c.toFixed(1)+'" transform="rotate(-90 85 85)"/><text x="85" y="88" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-size="30" fill="var(--ink)">'+t+' g</text><text x="85" y="108" text-anchor="middle" font-size="12" fill="var(--mut)">of '+GOAL+' g added</text></svg>'}
function message(){var t=total(),rem=Math.round((GOAL-t)*10)/10,up=upcoming();
if(rem<=0)return "Goal reached for today. Nice work.";
if(!up.length)return "All meals logged. You are "+rem+" g short today, and tomorrow starts fresh.";
var each=Math.ceil(rem/up.length),lead=S.last?(S.last.amt>0?S.last.amt+" g logged at "+S.last.meal.toLowerCase()+". ":S.last.meal+" skipped. "):"";
var s=lead+rem+" g of added fiber left, split evenly across "+up.join(" and ").toLowerCase()+" (about "+each+" g each).";
if(each>15)s+=" That is a big gap. Aim for a bit extra at your next meal and let the rest go.";
return s}
function log(meal,amt,txt,habit){
S.history.push({fib:{...S.fib},done:{...S.done},last:S.last,habitLogged:S.habitLogged,habitAnswer:S.habitAnswer,habitEntry:S.habitEntry,swapAnswer:S.swapAnswer,swapEntry:S.swapEntry});
S.fib[meal]+=amt;S.done[meal]=true;S.last={meal:meal,amt:amt};if(habit)S.habitLogged=true;S.toast=txt;render()
}
function view(){var h="";
if(S.tab==0){h='<h1>Quick check-in</h1><p class="sub">Pick the staples you eat often. This takes about 30 seconds, every two weeks.</p>';
staples().forEach(function(s){h+='<div class="card"><label class="stp"><input type="checkbox" data-act="stp" data-id="'+s.id+'"'+(S.on[s.id]?' checked':'')+'><span style="flex:1">'+s.name+'</span></label>'+(S.on[s.id]?'<div class="row" style="margin-top:8px"><span class="mut">Times per week</span><select data-act="freq" data-id="'+s.id+'" style="width:80px">'+[1,2,3,4,5,6,7].map(function(n){return '<option'+(S.freq[s.id]==n?' selected':'')+'>'+n+'</option>'}).join('')+'</select></div>':'')+'</div>'});
var n=staples().filter(function(s){return S.on[s.id]}).length;
h+=(showMore?'':'<button class="btn ghost" data-act="more" aria-expanded="false">＋ More</button>')+(showMore?'<form id="more-form" class="card custom-staple"><label for="staple-name">Staple name</label><input id="staple-name" maxlength="60" required placeholder="e.g. Regular pasta"><label for="staple-freq">Times per week</label><select id="staple-freq">'+[1,2,3,4,5,6,7].map(n=>'<option>'+n+'</option>').join('')+'</select><div class="staple-actions"><button class="btn ghost" type="button" data-act="more">Cancel</button><button class="btn" type="submit">Add staple</button></div></form>':'')+(n<1?'<div class="toast" style="color:#b3402f">Pick at least one staple.</div>':'')+'<button class="btn" data-act="saveStaples">Save staples</button>'}
if(S.tab==1){var sel=staples().filter(function(s){return S.on[s.id]});
h='<h1>Set your swaps</h1><p class="sub">Based on the staples you picked. Adopt a swap to add it to your meal plan.</p>';
if(!sel.length)h+='<div class="note">No staples yet. Pick a few in Check-in.</div>';
sel.forEach(function(s){var a=S.adopted[s.id],opts=SWAPS[s.id]?Object.keys(SWAPS[s.id].options):[s.to];h+='<div class="card"><div class="mut">You eat '+s.name.toLowerCase()+' about '+S.freq[s.id]+(S.freq[s.id]===1?' time':' times')+' a week</div><div style="font-weight:500;margin:8px 0">Swap '+s.name.toLowerCase()+' for</div><select aria-label="Alternative for '+s.name+'" data-act="swapChoice" data-id="'+s.id+'">'+opts.map(o=>'<option'+(choice(s)===o?' selected':'')+'>'+o+'</option>').join('')+'</select><div class="note" style="margin-top:12px"><b>'+ (SWAPS[s.id] ? 'Estimated +'+swapGain(s)+' g fiber today' : 'Fiber estimate unavailable') +'</b>'+(SWAPS[s.id]?'<div class="mut">'+SWAPS[s.id].portion+' of each food · one swap today'+(SWAPS[s.id].baseline?' · compared with '+SWAPS[s.id].baseline:'')+'</div>':'')+'</div><div class="row"><button class="chip'+(a?' on':'')+'" data-act="adopt" data-id="'+s.id+'">'+(a?'Added to meal plan':'Add to meal plan')+'</button></div>'+'</div>'});
var g=sel.filter(function(s){return S.adopted[s.id]});
h+='<h1 style="font-size:18px;margin-top:14px">Meal plan ('+g.length+')</h1>'+(g.length?g.map(function(s){return '<div class="card row sb"><span>'+choice(s)+'</span><span class="mut">replaces '+s.name.toLowerCase()+'</span></div>'}).join(''):'<p class="mut">Nothing yet.</p>');if(g.length){
  const estimates = g.map(swapGain);
  const known = estimates.filter(value => value !== null);
  if(known.length)h+='<div class="note"><b>Estimated +'+roundFiber(known.reduce((sum, value) => sum + value, 0))+' g fiber today</b><div class="mut">If you complete each listed swap once today.'+(known.length===g.length?'':' Swaps without an estimate are excluded.')+'</div></div>';
}
h+=SWAP_SOURCES+'<button class="btn" data-act="confirmPlan"'+(g.length?'':' disabled')+'>Confirm meal plan</button>'}
if(S.tab==2){var hb=S.habit;h='<h1>Set your if-then</h1><p class="sub">Pick an anchor you already do. Pair a small addition with that moment.</p>'+
'<div class="card"><b>WHEN</b> I serve<select data-act="anchor" style="margin-top:6px"><option value="" disabled'+(hb.anchorChosen?'':' selected')+'>Choose a meal</option>'+MEALS.map(function(m){return '<option'+(hb.anchorChosen&&hb.anchor===m?' selected':'')+'>'+m+'</option>'}).join('')+'</select></div>'+
'<div class="card"><b>THEN</b> I add<select data-act="food" style="margin-top:6px"><option value="" disabled'+(hb.foodChosen?'':' selected')+'>Choose a food</option>'+Object.keys({...S.customFoods,...FOODS}).map(function(f){return '<option'+(hb.foodChosen&&hb.food===f?' selected':'')+'>'+esc(f)+'</option>'}).join('')+ '</select><label for="habit-cups" class="mut" style="display:block;margin-top:12px">Portion (cups, cooked)</label><input id="habit-cups" data-act="habitCups" type="number" inputmode="decimal" min="0.01" step="any" value="'+esc(hb.cups||'')+'"><div id="habit-estimate" class="note" style="margin-top:12px;margin-bottom:0" role="status"'+(hb.foodChosen&&hb.cups>0?'':' hidden')+'><b>Estimated '+habitGain()+' g fiber</b></div><p class="mut"><a href="https://www.dietaryguidelines.gov/sites/default/files/2024-08/Food-Sources-Fiber-Standard-508C.pdf" target="_blank" rel="noopener">USDA/HHS cooked food portions</a></p></div>'+
'<div class="card row sb"><span>Notifications</span><input type="time" data-act="time" value="'+hb.time+'" style="font:inherit;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:6px"></div>'+
'<div class="toast">'+S.toast+'</div>'}
if(S.tab==3){h='<div class="lockscreen"><div class="lock-top"><span>Friday</span><div class="lock-time">'+esc(S.habit.time)+'</div><span>Notification preview</span></div><button class="lock-notification" data-act="openToday"><strong>FibreRing <span>now</span></strong><p>'+esc(S.habit.anchor)+'time: add '+habitPortion()+' '+esc(S.habit.food)+'!</p><small>Tap to check in</small></button></div>'}
if(S.tab==4){
var amt=habitGain();
var plan=staples().filter(x=>S.on[x.id]&&S.adopted[x.id]);
h='<h1>Today</h1><div class="card"><b>Which swaps did you complete?</b>'+
(plan.length ? plan.map(staple=>{
  const gain = swapGain(staple);
  return '<label class="stp" style="margin-top:12px"><input type="checkbox" data-act="completeSwap" data-id="'+staple.id+'"'+(Object.hasOwn(S.completedSwaps, staple.id)?' checked':'')+'><span>'+staple.name+' → '+choice(staple)+'<br><span class="mut">'+(gain===null?'Fiber estimate unavailable':'Estimated +'+gain+' g added fiber')+'</span></span></label>';
}).join('') : '<p class="mut">Choose a swap in your meal plan first.</p>')+'</div><div class="card"><b>Did you add your '+esc(S.habit.food)+' to '+esc(S.habit.anchor.toLowerCase())+'?</b><p class="mut">'+habitPortion()+' · estimated '+amt+' g fiber</p><div class="row"><button class="chip '+(S.habitAnswer==='yes'?'on':'')+'" data-act="yes" aria-pressed="'+(S.habitAnswer==='yes')+'">Yes, +'+amt+' g</button><button class="chip '+(S.habitAnswer==='skip'?'on':'')+'" data-act="skip" aria-pressed="'+(S.habitAnswer==='skip')+'">Skip</button></div><p class="mut" role="status">'+(S.habitAnswer==='skip'?'Skipped. No problem — try again at your next meal.':S.habitAnswer==='yes'?'Habit completed. Your progress is updated.':'')+'</p></div><div class="card row sb"><span>Added fiber today</span><b>'+total()+' of '+GOAL+' g</b></div><button class="btn" data-act="viewProgress">View progress</button>'}
if(S.tab==5){h='<h1>Added fiber today</h1><p class="sub">Daily goal: +'+GOAL+' g added fiber.</p>'+ring()+'<div class="note">'+message()+'</div>'+
'<div class="card row sb"><span>Swaps</span><b>'+((S.swapEntry&&S.swapAnswer==='yes')?S.swapEntry.amount:0)+' g added</b></div><div class="card row sb"><span>Habit</span><b>'+((S.habitEntry&&S.habitAnswer==='yes')?S.habitEntry.amount:0)+' g added</b></div>'+
'<button class="btn ghost" data-act="reset">Restart</button>'}
return h}
function render(){
try{localStorage.setItem("fibrering-v1",JSON.stringify(S))}catch(e){}
document.documentElement.dataset.theme="light";
var sc=el("scr"),top=render.lastTab===S.tab?sc.scrollTop:0;render.lastTab=S.tab;sc.innerHTML=view();
document.querySelector('.app-header').hidden=S.tab===3;
document.querySelector('.phone').classList.toggle('is-lockscreen',S.tab===3);
if(S.tab<3)sc.insertAdjacentHTML('afterbegin','<div class="setup-steps" aria-label="Step '+(S.tab+1)+' of 3">'+['Check-in','Swaps','Habit'].map((t,i)=>'<div class="'+(i<=S.tab?'complete':'')+'"><span></span></div>').join('')+'</div>');
el('header-back').hidden=S.tab===0||S.tab===3;

sc.classList.toggle('notification-screen',S.tab===3);

if(S.tab===2)sc.insertAdjacentHTML('beforeend','<button class="btn" data-act="saveHabit"'+(habitReady()?'':' disabled')+'>Save habit & continue</button>');
if(S.onb===0)sc.classList.add('welcome');else sc.classList.remove('welcome');
sc.querySelectorAll('.toast').forEach(x=>x.setAttribute('role','status'));
sc.querySelectorAll('select[data-act]:not([data-act=swapChoice]),input[type=time]').forEach(x=>x.setAttribute('aria-label',({freq:'Times per week',anchor:'Habit meal',food:'Habit food',time:'Reminder time'})[x.dataset.act]||x.dataset.act));
sc.querySelectorAll('.chip').forEach(x=>{if(['why','meal','adopt'].includes(x.dataset.act))x.setAttribute('aria-pressed',x.classList.contains('on'))});
sc.scrollTop=top;
}

document.addEventListener("click",function(e){var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act,id=b.dataset.id;
if(a=="back"){S.tab=S.tab===4?2:Math.max(0,S.tab-1);render()}
else if(a=="more"){showMore=!showMore;render();if(showMore)el("staple-name").focus()}

else if(a=="undo"){var prev=S.history.pop();if(prev)Object.assign(S,prev);S.toast="Last entry undone.";render()}
else if(a=="custom"){var inp=el("grams"),v=Number(inp.value);if(!Number.isFinite(v)||v<=0||v>100){inp.setCustomValidity("Enter an amount between 0.1 and 100 grams.");inp.reportValidity();return}log(S.meal,Math.round(v*10)/10,"Fiber added to "+S.meal.toLowerCase()+".")}
else if(a=="tab"){S.tab=+id;S.toast="";render();el("scr").scrollTop=0}
else if(a=="saveStaples"){if(staples().some(function(s){return S.on[s.id]})){S.tab=1;S.toast="";render()}}
else if(a=="confirmPlan" && staples().some(s=>S.on[s.id]&&S.adopted[s.id])){S.planConfirmed=true;S.tab=2;render()}
else if(a=="adopt"){S.planConfirmed=false;S.adopted[id]=!S.adopted[id];S.declined[id]=false;if(!S.adopted[id])clearSwap(id);render()}
else if(a=="hide"){S.planConfirmed=false;S.declined[id]=!S.declined[id];S.adopted[id]=false;render()}
else if(a=="openToday"){S.tab=4;render()}
else if(a=="viewProgress"){S.tab=5;render()}
else if(a=="saveHabit" && habitReady()){
  if (S.habitEntry && (S.habitEntry.meal !== S.habit.anchor || (S.habitAnswer === 'yes' && S.habitEntry.amount !== habitGain()))) {
    const {meal, amount} = S.habitEntry;
    S.fib[meal] = roundFiber(Math.max(0, S.fib[meal] - amount));
    if (S.swapEntry?.meal !== meal) delete S.done[meal];
    S.habitAnswer = null;
    S.habitEntry = null;
    S.habitLogged = false;
    S.last = S.swapEntry ? {meal:S.swapEntry.meal, amt:S.swapEntry.amount} : null;
  }
  S.tab=3;S.toast="Habit saved. Reminder preview: "+S.habit.time+".";render()}
else if(a=="yes"){answerHabit("yes")}
else if(a=="skip"){answerHabit("skip")}
else if(a=="meal"){S.meal=id;render()}
else if(a=="add"){log(S.meal,+b.dataset.n,b.dataset.t+" added to "+S.meal.toLowerCase()+".")}
else if(a=="reset"){
  S = {
    ...JSON.parse(JSON.stringify(INITIAL)),
    onb: 3,
    customStaples: [],
    swapChoices: {},
    declined: {},
    completedSwaps: {}
  };
  showMore = false;
  render.lastTab = undefined;
  render();
  el("scr").scrollTop = 0;
}});

document.addEventListener("input",function(e){var t=e.target,a=t.dataset.act;if(a=="ready"){S.ready=+t.value;el("rv").textContent=t.value}else if(a=="conf"){S.conf=+t.value;el("cv").textContent=t.value}});
document.addEventListener("change",function(e){var t=e.target,a=t.dataset.act;if(a=="ready"||a=="conf"){render();return}if(!a)return;
if(a=="habitCups")return;
if(a=="completeSwap"){recordSwap(t.dataset.id,t.checked);return}
if(a=="swapChoice"){clearSwap(t.dataset.id);S.planConfirmed=false;S.swapChoices[t.dataset.id]=t.value;S.declined[t.dataset.id]=false}
else if(a=="stp"){S.on[t.dataset.id]=t.checked;if(!t.checked)clearSwap(t.dataset.id)}else if(a=="freq"){S.freq[t.dataset.id]=+t.value;render();return}
else if(a=="anchor"){S.habit.anchor=t.value;S.habit.anchorChosen=!!t.value}else if(a=="food"){S.habit.food=t.value;S.habit.foodChosen=!!t.value}else if(a=="time"){S.habit.time=t.value}
S.toast="";render()});
render();


document.addEventListener('submit',function(e){if(e.target.id!=='more-form')return;e.preventDefault();var input=el('staple-name'),name=input.value.trim();if(!name){input.setCustomValidity('Enter a staple name.');input.reportValidity();return}var existing=staples().find(x=>x.name.toLowerCase()===esc(name).toLowerCase());var id=existing?existing.id:'custom-'+Date.now();if(!existing)S.customStaples.push({id:id,name:name});S.on[id]=true;S.freq[id]=Number(el('staple-freq').value);showMore=false;render()});

function keepInputVisible(){
var viewport=window.visualViewport;
document.documentElement.style.setProperty('--visible-height',(viewport?viewport.height:innerHeight)+'px');
var active=document.activeElement;
if(active && active.matches('.scr input:not([type=checkbox]):not([type=radio]),.scr textarea'))requestAnimationFrame(()=>active.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
}
document.addEventListener('focusin',e=>{if(e.target.matches('.scr input:not([type=checkbox]):not([type=radio]),.scr textarea'))keepInputVisible()});
if(window.visualViewport)window.visualViewport.addEventListener('resize',keepInputVisible);
window.addEventListener('resize',keepInputVisible);
keepInputVisible();

function sizeDesktopDevice(){var scale=Math.max(0.1,Math.min(1,(innerHeight-48)/888,(innerWidth-48)/416));document.documentElement.style.setProperty('--phone-scale',scale)}
window.addEventListener('resize',sizeDesktopDevice);sizeDesktopDevice();

function answerHabit(answer){if(S.habitAnswer===answer && S.habitEntry?.amount===(answer==='yes'?habitGain():0) && S.habitEntry?.meal===S.habit.anchor)return;S.history.push({fib:{...S.fib},done:{...S.done},last:S.last,habitLogged:S.habitLogged,habitAnswer:S.habitAnswer,habitEntry:S.habitEntry,swapAnswer:S.swapAnswer,swapEntry:S.swapEntry});if(S.habitEntry){const oldMeal=S.habitEntry.meal;S.fib[oldMeal]=roundFiber(Math.max(0,S.fib[oldMeal]-S.habitEntry.amount));if(oldMeal!==S.habit.anchor&&S.swapEntry?.meal!==oldMeal)delete S.done[oldMeal]}var amount=answer==='yes'?habitGain():0;S.habitAnswer=answer;S.habitEntry={meal:S.habit.anchor,amount:amount};S.fib[S.habit.anchor]+=amount;S.done[S.habit.anchor]=true;S.habitLogged=true;S.last={meal:S.habit.anchor,amt:amount};render()}
document.addEventListener('input', event => {
  if (event.target.id !== 'habit-cups') return;
  const cups = event.target.valueAsNumber;
  S.habit.cups = event.target.validity.valid && Number.isFinite(cups) ? cups : 0;
  const estimate = el('habit-estimate');
  estimate.hidden = !S.habit.foodChosen || S.habit.cups <= 0;
  estimate.querySelector('b').textContent = 'Estimated ' + habitGain() + ' g fiber';
  document.querySelector('[data-act="saveHabit"]').disabled = !habitReady();
  try { localStorage.setItem("fibrering-v1", JSON.stringify(S)); } catch(e) {}
});

function updateSwapTotal() {
  if (S.swapEntry) S.fib[S.swapEntry.meal] = roundFiber(Math.max(0, S.fib[S.swapEntry.meal] - S.swapEntry.amount));
  const amount = roundFiber(Object.values(S.completedSwaps).reduce((sum, grams) => sum + grams, 0));
  const meal = S.swapEntry?.meal || S.habit.anchor;
  S.swapEntry = amount > 0 ? {meal, amount} : null;
  S.swapAnswer = amount > 0 ? 'yes' : null;
  S.fib[meal] = roundFiber(S.fib[meal] + amount);
  if (amount > 0) {
    S.done[meal] = true;
    S.last = {meal, amt: amount};
  } else {
    if (S.habitEntry?.meal !== meal) delete S.done[meal];
    S.last = S.habitEntry ? {meal: S.habitEntry.meal, amt: S.habitEntry.amount} : null;
  }
}
function clearSwap(id) {
  if (!Object.hasOwn(S.completedSwaps, id)) return;
  delete S.completedSwaps[id];
  updateSwapTotal();
}
function recordSwap(id, completed) {
  const staple = staples().find(item => item.id === id && S.on[id] && S.adopted[id]);
  if (!staple) return;
  if (completed) S.completedSwaps[id] = swapGain(staple) ?? 0;
  else delete S.completedSwaps[id];
  updateSwapTotal();
  render();
}

// Page shortcuts must not interrupt editing or native form controls.
document.addEventListener('keydown',function(e){
if(e.defaultPrevented||e.isComposing||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
var target=e.target;
if(target instanceof Element && target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="slider"],[role="combobox"],[role="textbox"]'))return;
var next=Math.max(0,Math.min(TABS.length-1,S.tab+(e.key==='ArrowRight'?1:-1)));
if(next===S.tab)return;
e.preventDefault();S.tab=next;S.toast='';render();el('scr').scrollTop=0;
});
