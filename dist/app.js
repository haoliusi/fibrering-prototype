const GOAL=15;
var MEALS=["Breakfast","Lunch","Dinner","Snack"];
var CATS=[
{id:"grains",name:"Grains",icon:'<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 8c1-2 3-2 4-4m1 4c1-1.5 2.5-2 4-2"/>'},
{id:"breads",name:"Breads",icon:'<path d="M6 20v-9a4 4 0 0 1-2-3.5C4 4 8 3.5 12 3.5S20 4 20 7.5a4 4 0 0 1-2 3.5v9Z"/>'},
{id:"breakfast",name:"Breakfast",icon:'<path d="M4 9h13v5a6 6 0 0 1-12 0Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3m4-3v3"/>'},
{id:"pasta",name:"Pasta",icon:'<path d="M4 7c2-2 4 2 6 0s4 2 6 0 3-1 4 0M4 12c2-2 4 2 6 0s4 2 6 0 3-1 4 0M4 17c2-2 4 2 6 0s4 2 6 0 3-1 4 0"/>'},
{id:"snacks",name:"Snacks",icon:'<path d="M6 10h12l-2 11H8Z"/><path d="M7 10a2.5 2.5 0 0 1 3-4 2.5 2.5 0 0 1 4 0 2.5 2.5 0 0 1 3 4"/>'},
{id:"sides",name:"Sides & drinks",icon:'<path d="M20 4C9 3 3 10 7 16s14 2 13-12ZM5 21l10-11"/>'}];
var CAT_ALL='<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>';
function catIcon(p){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var STAPLES=[
{id:"rice",cat:"grains",name:"White rice",freq:4},
{id:"couscous",cat:"grains",name:"Couscous",freq:3},
{id:"bread",cat:"breads",name:"White bread",freq:5},
{id:"tortilla",cat:"breads",name:"Flour tortillas",freq:3},
{id:"bagel",cat:"breads",name:"Plain bagels",freq:3},
{id:"cereal",cat:"breakfast",name:"Standard cereal",freq:3},
{id:"pancakes",cat:"breakfast",name:"Pancakes",freq:3},
{id:"pasta",cat:"pasta",name:"White pasta",freq:3},
{id:"noodles",cat:"pasta",name:"Egg noodles",freq:3},
{id:"chips",cat:"snacks",name:"Potato chips",freq:3},
{id:"crackers",cat:"snacks",name:"Saltine crackers",freq:3},
{id:"mashed",cat:"sides",name:"Mashed potatoes",freq:3},
{id:"juice",cat:"sides",name:"Orange juice",freq:3}];
// USDA/HHS Food Sources of Fiber: standard portions, normalized to ½ cup cooked.
const FOODS = {
  "black beans": 7.5, lentils: 7.8, chickpeas: 6.3, broccoli: 5.2 / 2,
  "green peas": 8.8 / 2, carrots: 4.8 / 2, spinach: 4.3 / 2,
  "kidney beans": 5.7, "pinto beans": 7.7, edamame: 4.1,
  kale: 4.7 / 2, cauliflower: 4.9 / 2, "green beans": 4 / 2,
  "brussels sprouts": 6.4 / 2
};
var S={tab:0,cat:"all",on:{rice:true,bread:true,cereal:true},freq:{rice:4,bread:5,cereal:3},adopted:{},
habit:{anchor:"Lunch",food:"black beans",cups:0.5,time:"12:00"},meal:"Lunch",toast:"",
fib:{Breakfast:0,Lunch:0,Dinner:0,Snack:0},done:{},fiberVersion:3,last:null,asked:true,msg:"",onb:0,ready:6,conf:8,why:{},habitLogged:false,history:[],theme:"light"};
var INITIAL=JSON.parse(JSON.stringify(S));
try { var saved=JSON.parse(localStorage.getItem("fibrering-v1")); if(saved && saved.onb>=0) {
  S=Object.assign(S,saved);
  // Existing completed setups should open with the new primary navigation.
  S.onboarded ??= !!(saved.planConfirmed && saved.habit?.anchorChosen && saved.habit?.foodChosen);
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
S.editing=false;S.tab=S.onboarded?4:0;
S.customStaples=Array.isArray(S.customStaples)?S.customStaples:[];
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function staples(){return STAPLES.concat(S.customStaples.map(x=>({...x,cat:'custom',name:esc(x.name),to:'a higher-fiber alternative'})))}
if(S.cat!=='all'&&!CATS.some(c=>c.id===S.cat))S.cat='all';
var showMore=false;
S.swapChoices=S.swapChoices||{};S.declined=S.declined||{};
// Grams of fiber per portion. USDA SR Legacy / FoodData Central and USDA/HHS/VA
// portion tables. Options listed in `examples` vary widely by brand.
const SWAPS = {
  rice: {portion: '100 g cooked', original: 0.4,
    options: {'Brown rice': 1.6, Quinoa: 2.8, 'Wild rice': 1.8, 'Pearled barley': 3.8}},
  couscous: {portion: '1 cup cooked', original: 2.2,
    options: {Bulgur: 8.2, 'Pearled barley': 6, Quinoa: 5.2}},
  bread: {portion: '30 g', original: 2.7 * 0.3, examples: ['Sprouted grain bread'],
    options: {'100% whole grain bread': 6 * 0.3, 'Whole rye bread': 5.8 * 0.3, 'Whole wheat pita': 6.1 * 0.3, 'Sprouted grain bread': 3}},
  tortilla: {portion: 'one wrap', original: 1.4, examples: ['Whole wheat tortilla'],
    options: {'Whole wheat tortilla': 4, '2 small corn tortillas': 3}},
  bagel: {portion: 'one medium bagel or muffin', original: 2.4, examples: ['Whole wheat bagel'],
    options: {'Whole wheat bagel': 6, 'Whole wheat English muffin': 4.4}},
  cereal: {portion: '½ cup prepared', original: 0.4, baseline: 'corn flakes',
    options: {'High-fiber cereal': 14, Oatmeal: 2, 'Bran cereal': 5.5 * 2 / 3, 'Shredded wheat': 3}},
  pancakes: {portion: 'one breakfast serving', original: 1,
    options: {'Whole wheat pancakes': 3, 'Pancakes with ½ cup raspberries': 5, 'Oatmeal with ½ cup raspberries': 6}},
  pasta: {portion: '1 cup cooked', original: 2.5, examples: ['Chickpea pasta', 'Red lentil pasta'],
    options: {'Whole wheat pasta': 6.3, 'Chickpea pasta': 8, 'Red lentil pasta': 6}},
  noodles: {portion: '1 cup cooked', original: 1.9, examples: ['Chickpea pasta'],
    options: {'Whole wheat pasta': 6.3, 'Chickpea pasta': 8, 'Egg noodles with ½ cup broccoli': 4.5}},
  chips: {portion: 'one snack', original: 1.2, baseline: '1 oz potato chips',
    options: {'3 cups air-popped popcorn': 3.5, '1 oz almonds': 3.5, 'A medium pear': 5.5}},
  crackers: {portion: 'one snack', original: 0.4, baseline: '5 saltines', examples: ['Whole grain crackers', 'Rye crispbread'],
    options: {'Whole grain crackers': 3, 'Rye crispbread': 3.5}},
  mashed: {portion: '½ cup side', original: 1.6,
    options: {'Green peas': 4.4, 'Black beans': 7.5, Broccoli: 2.6}},
  juice: {portion: 'one serving', original: 0.5, baseline: '1 cup orange juice',
    options: {'A whole orange': 3.1, 'A medium apple with skin': 4.4, '1 cup raspberries': 8}}
};
function optGain(id, opt) { const d = SWAPS[id]; return roundFiber(d.options[opt] - d.original); }
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
const SWAP_SOURCES = '<p class="mut">Reference portions and example products. Fiber varies by brand and preparation. <a href="https://www.nal.usda.gov/sites/default/files/page-files/Total_Dietary_Fiber.pdf" target="_blank" rel="noopener">USDA nutrient data</a> · <a href="https://fdc.nal.usda.gov/" target="_blank" rel="noopener">USDA FoodData Central</a> · <a href="https://www.ncbi.nlm.nih.gov/books/NBK589559/table/usdaddb12.tab1/" target="_blank" rel="noopener">USDA cereal baseline</a> · <a href="https://www.dietaryguidelines.gov/sites/default/files/2024-08/Food-Sources-Fiber-Standard-508C.pdf" target="_blank" rel="noopener">USDA/HHS portions</a> · <a href="https://nutrition.va.gov/NUTRITION/docs/UpdatedPatientEd/FiberContentofFoods2021.pdf" target="_blank" rel="noopener">VA oatmeal data</a></p>';

var TABS=["Check-in","Swaps","Habit","Notification","Today","Progress","Preferences"];

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
function fmtTime(t){var p=String(t||'').split(':'),h=+p[0],m=p[1]||'00';if(isNaN(h))return esc(t);return (h%12||12)+':'+m+(h<12?' AM':' PM')}
function prefSec(t,act,body){return '<div class="card"><div class="row sb"><b>'+t+'</b><button class="chip" data-act="'+act+'" aria-label="Edit '+t.toLowerCase()+'">Edit</button></div>'+body+'</div>'}
function view(){var h="";
if(S.tab==0){h='<h1>Quick check-in</h1><p class="sub">Browse by category and tap the staples you eat often. This takes about 30 seconds, every two weeks.</p>';
var mine=staples().filter(function(s){return S.on[s.id]}),n=mine.length;
h+='<section class="card mine" aria-labelledby="mine-h"><div class="mine-head"><b id="mine-h">Your staples</b><span class="count" aria-label="'+n+' selected">'+n+'</span></div>'+
(n?mine.map(function(s){var f=S.freq[s.id]||3;return '<div class="mine-item"><span class="nm">'+s.name+'</span><div class="step" role="group" aria-label="Times per week for '+s.name+'"><button type="button" data-act="freqStep" data-id="'+s.id+'" data-d="-1" aria-label="Fewer times per week"'+(f<=1?' disabled':'')+'>−</button><output aria-live="polite">'+f+'× / wk</output><button type="button" data-act="freqStep" data-id="'+s.id+'" data-d="1" aria-label="More times per week"'+(f>=7?' disabled':'')+'>+</button></div><button type="button" class="rm" data-act="toggleStaple" data-id="'+s.id+'" aria-label="Remove '+s.name+'">×</button></div>'}).join(''):'<p class="mut" style="margin:8px 0 0">Nothing yet. Tap a staple below to add it.</p>')+'</section>';
h+='<h2 class="sec">Browse staples</h2><div class="cats" role="group" aria-label="Staple categories">'+[{id:'all',name:'All',icon:CAT_ALL}].concat(CATS).map(function(c){return '<button type="button" class="cat'+(S.cat===c.id?' on':'')+'" data-act="cat" data-id="'+c.id+'" aria-pressed="'+(S.cat===c.id)+'">'+catIcon(c.icon)+c.name+'</button>'}).join('')+'</div>';
function tiles(list){return '<div class="tiles">'+list.map(function(s){var on=!!S.on[s.id],k=SWAPS[s.id]?Object.keys(SWAPS[s.id].options).length:0;return '<button type="button" class="tile'+(on?' on':'')+'" data-act="toggleStaple" data-id="'+s.id+'" aria-pressed="'+on+'"><span class="nm">'+s.name+'</span><small>'+(on?'Added':k?k+' swap options':'Your own')+'</small><span class="tick" aria-hidden="true">'+(on?'✓':'+')+'</span></button>'}).join('')+'</div>'}
var cats=S.cat==='all'?CATS.concat(S.customStaples.length?[{id:'custom',name:'Your own'}]:[]):CATS.filter(function(c){return c.id===S.cat});
cats.forEach(function(c){var list=staples().filter(function(s){return s.cat===c.id});if(S.cat==='all')h+='<h3 class="grp">'+c.name+'</h3>';h+=tiles(list)});
h+=(showMore?'':'<button class="btn ghost" data-act="more" aria-expanded="false">Can’t find it? Add your own</button>')+(showMore?'<form id="more-form" class="card custom-staple"><label for="staple-name">Staple name</label><input id="staple-name" maxlength="60" required placeholder="e.g. Regular pasta"><label for="staple-freq">Times per week</label><select id="staple-freq">'+[1,2,3,4,5,6,7].map(n=>'<option'+(n===3?' selected':'')+'>'+n+'</option>').join('')+'</select><div class="staple-actions"><button class="btn ghost" type="button" data-act="more">Cancel</button><button class="btn" type="submit">Add staple</button></div></form>':'')+(n<1?'<div class="toast" style="color:#b3402f">Pick at least one staple.</div>':'')+'<button class="btn" data-act="saveStaples">Save staples</button>'}
if(S.tab==1){var sel=staples().filter(function(s){return S.on[s.id]});
h='<h1>Set your swaps</h1><p class="sub">Based on the staples you picked. Adopt a swap to add it to your meal plan.</p>';
if(!sel.length)h+='<div class="note">No staples yet. Pick a few in Check-in.</div>';
sel.forEach(function(s){var a=S.adopted[s.id],d=SWAPS[s.id],f=S.freq[s.id]||3;h+='<div class="card"><div class="mut">You eat '+s.name.toLowerCase()+' about '+f+(f===1?' time':' times')+' a week</div><div id="swap-h-'+s.id+'" style="font-weight:500;margin:8px 0">Swap '+s.name.toLowerCase()+' for</div>'+
(d?'<div class="opts" role="radiogroup" aria-labelledby="swap-h-'+s.id+'">'+Object.keys(d.options).map(function(o){var on=choice(s)===o,ex=(d.examples||[]).includes(o);return '<button type="button" class="opt'+(on?' on':'')+'" role="radio" aria-checked="'+on+'" data-act="pickSwap" data-id="'+s.id+'" data-opt="'+esc(o)+'"><span class="rad" aria-hidden="true"></span><span class="nm">'+esc(o)+(ex?'<small>Example product · check the label</small>':'')+'</span><span class="gain">+'+optGain(s.id,o)+' g</span></button>'}).join('')+'</div><p class="mut" style="margin:0 0 12px">Fiber added per '+d.portion+', compared with '+(d.baseline||s.name.toLowerCase())+'. One swap a day.</p>':'<div class="note">Pick '+s.to+' and compare fiber on the package label. No estimate for your own staples.</div>')+'<div class="row"><button class="chip'+(a?' on':'')+'" data-act="adopt" data-id="'+s.id+'">'+(a?'Added to meal plan':'Add to meal plan')+'</button></div>'+'</div>'});
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
if(S.tab==6){var sel6=staples().filter(function(s){return S.on[s.id]}),ad6=sel6.filter(function(s){return S.adopted[s.id]});
h='<h1>Preferences</h1><p class="sub">What you chose during setup. Change any of it anytime.</p><div class="toast">'+S.toast+'</div>'+
prefSec('Staples','editStaples',sel6.length?sel6.map(function(s){return '<div class="row sb" style="margin-top:10px"><span>'+s.name+'</span><span class="mut">'+S.freq[s.id]+(S.freq[s.id]===1?' time':' times')+' per week</span></div>'}).join(''):'<p class="mut">None selected.</p>')+
prefSec('Swaps','editSwaps',ad6.length?ad6.map(function(s){var g=swapGain(s);return '<div style="margin-top:10px">'+s.name+' → <b>'+choice(s)+'</b><div class="mut">'+(g===null?'Fiber estimate unavailable':'Estimated +'+g+' g fiber today')+'</div></div>'}).join(''):'<p class="mut">No swaps in your meal plan.</p>')+
prefSec('Habit','editHabit','<div style="margin-top:10px">When I serve <b>'+esc(S.habit.anchor.toLowerCase())+'</b>, I add <b>'+habitPortion()+' '+esc(S.habit.food)+'</b></div><div class="mut">Estimated +'+habitGain()+' g fiber · Reminder at '+fmtTime(S.habit.time)+'</div>')+
'<div class="card row sb"><span>Daily goal</span><b>+'+GOAL+' g added fiber</b></div>'}
return h}
function render(){
try{localStorage.setItem("fibrering-v1",JSON.stringify(S))}catch(e){}
document.documentElement.dataset.theme="light";
var sc=el("scr"),top=render.lastTab===S.tab?sc.scrollTop:0;render.lastTab=S.tab;sc.innerHTML=view();
document.querySelector('.app-header').hidden=S.tab===3;
document.querySelector('.phone').classList.toggle('is-lockscreen',S.tab===3);
if(S.tab<3&&!S.editing)sc.insertAdjacentHTML('afterbegin','<div class="setup-steps" aria-label="Step '+(S.tab+1)+' of 3">'+['Check-in','Swaps','Habit'].map((t,i)=>'<div class="'+(i<=S.tab?'complete':'')+'"><span></span></div>').join('')+'</div>');
el('header-back').hidden=!(S.tab===1||S.tab===2||(S.editing&&S.tab===0));

sc.classList.toggle('notification-screen',S.tab===3);

if(S.tab===2)sc.insertAdjacentHTML('beforeend','<button class="btn" data-act="saveHabit"'+(habitReady()?'':' disabled')+'>Save habit & continue</button>');
if(S.onb===0)sc.classList.add('welcome');else sc.classList.remove('welcome');
sc.querySelectorAll('.toast').forEach(x=>x.setAttribute('role','status'));
sc.querySelectorAll('select[data-act]:not([data-act=swapChoice]),input[type=time]').forEach(x=>x.setAttribute('aria-label',({freq:'Times per week',anchor:'Habit meal',food:'Habit food',time:'Reminder time'})[x.dataset.act]||x.dataset.act));
sc.querySelectorAll('.chip').forEach(x=>{if(['why','meal','adopt'].includes(x.dataset.act))x.setAttribute('aria-pressed',x.classList.contains('on'))});
sc.scrollTop=top;
var nv=el('nav');nv.hidden=!S.onboarded||S.editing||S.tab===3;nv.innerHTML=[['Today',4],['Progress',5],['Preferences',6]].map(function(t){return '<button type="button" data-act="tab" data-id="'+t[1]+'"'+(S.tab===t[1]?' class="on" aria-current="page"':'')+'>'+t[0]+'</button>'}).join('');
}

document.addEventListener("click",function(e){var b=e.target.closest("[data-act]");if(!b)return;var a=b.dataset.act,id=b.dataset.id;
if(a=="back"){S.tab=S.editing?6:Math.max(0,S.tab-1);S.editing=false;S.toast="";render();el("scr").scrollTop=0}
else if(a=="more"){showMore=!showMore;render();if(showMore)el("staple-name").focus()}
else if(a=="cat"){S.cat=id;render()}
else if(a=="toggleStaple"){var st=staples().find(function(s){return s.id===id});if(!st)return;S.on[id]=!S.on[id];if(S.on[id])S.freq[id]=S.freq[id]||st.freq||3;else clearSwap(id);S.toast="";render()}
else if(a=="freqStep"){S.freq[id]=Math.max(1,Math.min(7,(S.freq[id]||3)+Number(b.dataset.d)));render()}
else if(a=="pickSwap"){var o=b.dataset.opt;if(!SWAPS[id]||!Object.hasOwn(SWAPS[id].options,o)||choice({id:id})===o)return;clearSwap(id);S.planConfirmed=false;S.swapChoices[id]=o;S.declined[id]=false;render()}

else if(a=="undo"){var prev=S.history.pop();if(prev)Object.assign(S,prev);S.toast="Last entry undone.";render()}
else if(a=="custom"){var inp=el("grams"),v=Number(inp.value);if(!Number.isFinite(v)||v<=0||v>100){inp.setCustomValidity("Enter an amount between 0.1 and 100 grams.");inp.reportValidity();return}log(S.meal,Math.round(v*10)/10,"Fiber added to "+S.meal.toLowerCase()+".")}
else if(a=="tab"){S.editing=false;S.tab=+id;S.toast="";render();el("scr").scrollTop=0}
else if(a=="saveStaples"){if(staples().some(function(s){return S.on[s.id]})){if(S.editing){staples().forEach(function(s){if(!S.on[s.id]&&S.adopted[s.id]){S.adopted[s.id]=false;clearSwap(s.id)}});S.editing=false;S.tab=6;S.toast="Staples updated."}else{S.tab=1;S.toast=""}render()}}
else if(a=="confirmPlan" && staples().some(s=>S.on[s.id]&&S.adopted[s.id])){S.planConfirmed=true;if(S.editing){S.editing=false;S.tab=6;S.toast="Swaps updated."}else S.tab=2;render()}
else if(a=="adopt"){S.planConfirmed=false;S.adopted[id]=!S.adopted[id];S.declined[id]=false;if(!S.adopted[id])clearSwap(id);render()}
else if(a=="hide"){S.planConfirmed=false;S.declined[id]=!S.declined[id];S.adopted[id]=false;render()}
else if(a=="openToday"){S.tab=4;render()}
else if(a=="editStaples"||a=="editSwaps"||a=="editHabit"){S.editing=true;S.toast="";S.tab=a=="editStaples"?0:a=="editSwaps"?1:2;render();el("scr").scrollTop=0}
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
  if(S.editing){S.editing=false;S.tab=6;S.toast="Habit updated."}else{S.onboarded=true;S.tab=3;S.toast="Habit saved. Reminder preview: "+S.habit.time+"."}render()}
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
if(!S.onboarded||S.editing)return;var order=[4,5,6],next=order[Math.max(0,Math.min(order.length-1,order.indexOf(S.tab)+(e.key==='ArrowRight'?1:-1)))];
if(next===S.tab)return;
e.preventDefault();S.tab=next;S.toast='';render();el('scr').scrollTop=0;
});
