// HF-PA.5 — weekly pocket-money AGREEMENT; chores are independent.
// Optional save state: no agreement, payment or backpay is fabricated by migration.
const ALLOWANCE_PA5_VERSION=1;
const ALLOWANCE_PA5_BANDS=[[5,7,1,4],[8,11,3,8],[12,15,5,15],[16,17,8,25]];
const ALLOWANCE_PA5_MONEY_WEALTH={Struggling:.55,Modest:.82,'Middle class':1,Comfortable:1.22,Wealthy:1.5,'Extremely wealthy':1.9};
function allowancePA5State(){
 if(!S?.family)return null;
 const f=S.family;let p=f.allowancePlan;
 if(!p||typeof p!=='object'||Array.isArray(p)){
  p={schemaVersion:ALLOWANCE_PA5_VERSION,status:'none',caregiverId:null,cadence:'weekly',amount:0,
   agreedISO:null,nextDueISO:null,lastPaidISO:null,history:[],paidKeys:[],pending:null,offer:null,
   lastRequestISO:null,lastNegotiationISO:null,terms:'unconditional',pauseReason:null,
   totalPaid:0,periodsPaid:0,skipTotals:null,legacyAmount:Number(f.allowance)||0};
  f.allowancePlan=p;
 }
 p.schemaVersion=1;p.history=Array.isArray(p.history)?p.history:[];
 p.paidKeys=Array.isArray(p.paidKeys)?p.paidKeys:[];
 if(!['none','pending','active','paused','stopped'].includes(p.status))p.status='none';
 if(!['weekly'].includes(p.cadence))p.cadence='weekly';
 if(!Number.isFinite(p.amount)||p.amount<0)p.amount=0;
 p.totalPaid=Number.isFinite(p.totalPaid)?p.totalPaid:0;
 p.periodsPaid=Number.isFinite(p.periodsPaid)?p.periodsPaid:0;
 return p;
}
function allowancePA5Eligible(){
 if(S.age<5)return {ok:false,reason:'Allowance requests begin at age 5.'};
 if(S.age>=18|| (typeof livesWithParents==='function'&&!livesWithParents()))return {ok:false,reason:'Regular childhood allowance is unavailable after moving out or adulthood.'};
 const people=typeof householdCaregivers==='function'?householdCaregivers():[];
 const actual=people.find(p=>p.role==='parent'&&!p.deceased)||people.find(p=>!p.deceased);
 if(!actual)return {ok:false,reason:'No eligible household caregiver is available.'};
 return {ok:true,caregiver:actual};
}
function allowancePA5Bounds(){const band=ALLOWANCE_PA5_BANDS.find(([a,b])=>S.age>=a&&S.age<=b);
 if(!band)return {min:0,max:0,base:0};
 const w=ALLOWANCE_PA5_MONEY_WEALTH[S.wealth]||1;
 const r=typeof familyRules==='function'?familyRules():{generosity:50};
 const base=Math.max(1,Math.round((band[2]+band[3])/2*w*(.85+Math.min(100,Math.max(0,r.generosity||50))*.003)));
 return {min:Math.max(1,Math.round(band[2]*w)),max:Math.max(2,Math.min(50,Math.round(band[3]*w))),base:Math.min(50,base)};
}
function allowancePA5Record(p,kind,text,extra={}){
 const item=Object.assign({id:`allowance:${kind}:${currentDate()}:${p.history.length}`,dateISO:currentDate(),kind,text},extra);
 p.history.unshift(item);if(p.history.length>110)p.history.length=110;
 return item;
}
function allowancePA5Caregiver(p){return (S.people||[]).find(x=>x.id===p.caregiverId)||null}
function allowancePA5CaregiverName(p){const a=allowancePA5Caregiver(p);return a?(typeof firstName==='function'?firstName(a):a.name):'A caregiver'}
function allowancePA5Roll(p){
 const r=familyRules(),wealth={Struggling:-26,Modest:-11,'Middle class':0,Comfortable:8,Wealthy:13,'Extremely wealthy':17}[S.wealth]||0;
 const relative=allowancePA5Caregiver(p),rel=Number(relative?.rel??60);
 return Math.max(7,Math.min(93,47+wealth+(Number(r.generosity)||50)*.18+(rel-50)*.12+(S.family.responsibility||0)*.075-(S.family.tension||0)*.1));
}
function allowancePA5Request(kind='start'){
 const e=allowancePA5Eligible();if(!e.ok)return {ok:false,reason:e.reason};
 const p=allowancePA5State();
 if(p.pending||p.offer)return {ok:false,reason:'A caregiver decision or offer is already waiting.'};
 if(p.lastRequestISO&&daysBetween(p.lastRequestISO,currentDate())< (kind==='increase'?45:10))return {ok:false,reason:`Wait before asking again (${kind==='increase'?45:10}-day cooldown).`};
 if(kind==='start'&&p.status!=='none'&&p.status!=='stopped')return {ok:false,reason:'An allowance arrangement already exists.'};
 if(kind==='increase'&&p.status!=='active')return {ok:false,reason:'Only active allowance can be increased.'};
 if(kind==='resume'&&p.status!=='paused')return {ok:false,reason:'This plan is not paused.'};
 if(kind==='resume'&&p.lastRequestISO&&daysBetween(p.lastRequestISO,currentDate())<7)return {ok:false,reason:'Please wait before discussing the pause again.'};
 p.caregiverId=e.caregiver.id;
 p.pending={kind,requestedISO:currentDate(),resolveISO:addDays(currentDate(),1+Math.floor(Math.random()*3)),deferrals:0};
 p.lastRequestISO=currentDate();if(kind==='start')p.status='pending';
 allowancePA5Record(p,'request',`Asked ${allowancePA5CaregiverName(p)} to ${kind==='start'?'start weekly pocket money':kind==='increase'?'increase weekly pocket money':'resume the paused plan'}.`,{kindRequested:kind});
 log('Pocket-money conversation',`${allowancePA5CaregiverName(p)} will respond by ${formatDate(p.pending.resolveISO)}.`);
 return {ok:true,pending:p.pending};
}
function allowancePA5DecisionTick(p){
 if(!p.pending||currentDate()<p.pending.resolveISO)return;
 const q=p.pending,kind=q.kind,roll=Math.random()*100,score=allowancePA5Roll(p),name=allowancePA5CaregiverName(p);
 // A 'maybe' has a bounded resolution date, never a permanent consideration.
 if(roll>score&&roll<=score+13&&q.deferrals<1){
  q.deferrals++;q.resolveISO=addDays(currentDate(),2);
  allowancePA5Record(p,'considering',`${name} asks for two more days to review the request.`);
  if(!SIM.skipping)notify('Pocket money',`${name} is considering your request until ${formatDate(q.resolveISO)}.`);
  return;
 }
 p.pending=null;
 if(roll>score){
  if(kind==='start')p.status='none';
  allowancePA5Record(p,'declined',`${name} declines the ${kind} request, considering household circumstances.`);
  if(!SIM.skipping)notify('Pocket money',`${name} cannot approve your request right now.`);
  return;
 }
 const bounds=allowancePA5Bounds();
 let amount=kind==='increase'?Math.min(bounds.max,Math.max(p.amount+1,Math.round(p.amount*1.2))):
  kind==='resume'?p.amount:bounds.base;
 amount=Math.max(1,Math.min(50,amount));
 p.offer={kind,amount,offeredISO:currentDate(),expiresISO:addDays(currentDate(),7),caregiverId:p.caregiverId};
 allowancePA5Record(p,'offer',`${name} offers ${money(amount)} each week (${kind}).`);
 if(!SIM.skipping)notify('Pocket money',`${name} offered ${money(amount)} per week. Review the offer in Money & chores.`);
}
function allowancePA5Answer(accept){
 const p=allowancePA5State(),o=p.offer;
 if(!o)return {ok:false,reason:'No current offer to answer.'};
 if(currentDate()>o.expiresISO){p.offer=null;if(p.status==='pending')p.status='none';return {ok:false,reason:'The offer has expired.'}}
 p.offer=null;
 if(!accept){if(p.status==='pending')p.status='none';allowancePA5Record(p,'offer_declined','You declined the pocket-money offer.');return {ok:true,status:p.status};}
 const prev=p.status;
 p.status='active';p.amount=o.amount;p.caregiverId=o.caregiverId;
 // Increases and resumptions keep the pre-existing pay period. No bonus at acceptance.
 if(o.kind==='start'||o.kind==='resume'||!p.nextDueISO)p.nextDueISO=addDays(currentDate(),7);
 p.agreedISO=p.agreedISO||currentDate();p.pauseReason=null;
 p.terms=p.terms||'unconditional';
 S.family.allowance=p.amount; // legacy display numeric, never separately spendable
 allowancePA5Record(p,'agreement',`Agreed to ${money(p.amount)} weekly with ${allowancePA5CaregiverName(p)}; next payday ${formatDate(p.nextDueISO)}.`,{previousStatus:prev});
 return {ok:true,status:p.status,amount:p.amount,nextDueISO:p.nextDueISO};
}
function allowancePA5Negotiate(direction='higher'){
 const p=allowancePA5State(),o=p.offer,b=allowancePA5Bounds();
 if(!o)return {ok:false,reason:'You need an offer before negotiating.'};
 if(p.lastNegotiationISO&&daysBetween(p.lastNegotiationISO,currentDate())<14)return {ok:false,reason:'Give your caregiver time before negotiating again.'};
 p.lastNegotiationISO=currentDate();
 const proposed=direction==='lower'?Math.max(b.min,o.amount-1):Math.min(b.max,o.amount+Math.max(1,Math.round(o.amount*.25)));
 const score=allowancePA5Roll(p)-(direction==='higher'?18:-5),roll=Math.random()*100;
 if(roll<score&&proposed!==o.amount){o.amount=proposed;allowancePA5Record(p,'negotiated',`Caregiver agrees to a revised ${money(proposed)} weekly offer.`);return {ok:true,amount:proposed};}
 allowancePA5Record(p,'negotiation_declined',`Caregiver keeps the ${money(o.amount)} weekly offer.`);
 return {ok:false,reason:'Caregiver prefers the existing offer.'};
}
function allowancePA5PayTick(p){
 if(p.status!=='active'||!p.nextDueISO)return;
 let loops=0; // guard corrupt old dates; normal time path is one calendar day per tick
 while(p.nextDueISO<=currentDate()&&loops++<530){
  const due=p.nextDueISO,key=`weekly:${due}`;
  if(!p.paidKeys.includes(key)){
   // Hardship means no payment; it must not be credited on a subsequent reload.
   const hardship=S.wealth==='Struggling'&&Math.random()<.12||S.wealth==='Modest'&&Math.random()<.045;
   if(hardship){
    p.status='paused';p.pauseReason='Family finances require a conversation before payments resume.';
    allowancePA5Record(p,'hardship',`Payment due ${due} could not be made. ${p.pauseReason}`,{key,dueISO:due,amount:0});
    if(!SIM.skipping)notify('Allowance paused',p.pauseReason);
   }else{
    S.money=Math.round((S.money+p.amount)*100)/100;p.totalPaid+=p.amount;p.periodsPaid++;
    p.lastPaidISO=due;
    allowancePA5Record(p,'payment',`Weekly pocket money ${money(p.amount)} received.`,{id:`allowance:payment:${due}`,key,dueISO:due,amount:p.amount});
    if(SIM.skipping){p.skipTotals=p.skipTotals||{amount:0,count:0};p.skipTotals.amount+=p.amount;p.skipTotals.count++;}
    else{log('Weekly pocket money',`${money(p.amount)} from ${allowancePA5CaregiverName(p)} was added to your cash.`);notify('Allowance payday',`${money(p.amount)} was added to your cash.`);}
   }
   p.paidKeys.push(key);if(p.paidKeys.length>210)p.paidKeys.splice(0,p.paidKeys.length-210);
  }
  p.nextDueISO=addDays(due,7);
  if(p.status==='paused')break;
 }
 if(loops>530&&p.nextDueISO<=currentDate()){
  allowancePA5Record(p,'large_skip',`Excess historical periods before ${currentDate()} are not automatically backpaid.`);
  p.nextDueISO=addDays(currentDate(),7);
 }
}
function allowancePA5Tick(){
 const p=allowancePA5State(),e=allowancePA5Eligible();
 if(['active','pending','paused'].includes(p.status)&&p.caregiverId&&(!e.ok||!allowancePA5Caregiver(p)||!e.caregiver||!inHousehold(allowancePA5Caregiver(p)))){
  p.status='stopped';p.pending=null;p.offer=null;p.pauseReason='The original caregiver is no longer in the household; arrange a new agreement.';
  allowancePA5Record(p,'stopped',p.pauseReason);S.family.allowance=0;return;
 }
 if(!e.ok&&['active','paused','pending'].includes(p.status)){
  p.status='stopped';p.pending=null;p.offer=null;p.pauseReason=e.reason;
  allowancePA5Record(p,'stopped',e.reason);S.family.allowance=0;
  if(!SIM.skipping)notify('Allowance ended',e.reason);
  return;
 }
 allowancePA5DecisionTick(p);
 if(p.offer&&currentDate()>p.offer.expiresISO){p.offer=null;if(p.status==='pending')p.status='none';allowancePA5Record(p,'offer_expired','Unaccepted allowance offer expired.');}
 allowancePA5PayTick(p);
}
function allowancePA5Discuss(){const p=allowancePA5State(),b=allowancePA5Bounds();return {ok:true,status:p.status,reason:p.pauseReason||(p.offer?`The proposed amount uses your age, household finances and caregiver generosity. Your estimated age/household range is ${money(b.min)}–${money(b.max)} per week. You can accept, decline or negotiate.`:`Agreed weekly pocket money is separate from chores. Next scheduled payday: ${p.nextDueISO?formatDate(p.nextDueISO):'none'}. No payments are due during a pause.`),caregiver:allowancePA5CaregiverName(p),nextDueISO:p.nextDueISO}}
function allowancePA5Html(){
 const p=allowancePA5State(),e=allowancePA5Eligible(),name=esc(allowancePA5CaregiverName(p)),f=esc(p.pauseReason||'');
 const short=p.history.slice(0,5).map(h=>`<div class="row"><span><small>${esc(h.dateISO)} · ${esc(h.text)}</small></span></div>`).join('');
 const buttons=[];
 if(e.ok&&!p.offer&&!p.pending){if(p.status==='none'||p.status==='stopped')buttons.push('<button class="small primary" data-allowance-pa5="start">Ask for weekly allowance</button>');
  if(p.status==='active')buttons.push('<button class="small ghost" data-allowance-pa5="increase">Ask for an increase</button>');
  if(p.status==='paused')buttons.push('<button class="small" data-allowance-pa5="resume">Discuss restarting allowance</button>');}
 if(p.offer){buttons.push('<button class="small primary" data-allowance-pa5="accept">Accept offer</button>','<button class="small ghost" data-allowance-pa5="decline">Decline offer</button>','<button class="small ghost" data-allowance-pa5="negotiate">Negotiate amount</button>');}
 if(p.offer||p.status==='active'||p.status==='paused')buttons.push('<button class="small ghost" data-allowance-pa5="why">Ask about the amount or payment</button>');
 return `<section class="card wide allowance-pa5" data-allowance-panel="1"><h3>Allowance / Pocket money</h3><p class="muted-text">Caregiver-agreed weekly money, separate from optional earnings for chores.</p>
 ${statRow('Agreement',esc(p.status==='none'?'Not requested':p.status[0].toUpperCase()+p.status.slice(1)))}
 ${p.caregiverId?statRow('Caregiver',name):''}${p.status==='active'||p.status==='paused'?statRow('Weekly amount',money(p.amount)):''}
 ${p.nextDueISO?statRow('Next scheduled payday',esc(formatDate(p.nextDueISO))):''}
 ${p.pending?`<p class="stage-note">${name} is considering your request until ${esc(formatDate(p.pending.resolveISO))}. No payment is promised yet.</p>`:''}
 ${p.offer?`<p class="stage-note">${name} offers <b>${money(p.offer.amount)} per week</b>. Accept, decline, or discuss the amount by ${esc(formatDate(p.offer.expiresISO))}.</p>`:''}
 ${p.status==='paused'?`<p class="locked-note">${f||'Allowance is temporarily paused.'} No automatic backpay.</p>`:''}
 ${!e.ok?`<p class="muted-text">${esc(e.reason)}</p>`:''}
 <div class="inline-actions">${buttons.join('')}</div>${short?`<details><summary>Recent allowance decisions and payments</summary>${short}</details>`:''}</section>`;
}
function allowancePA5Click(kind){let r;
 if(kind==='start'||kind==='increase'||kind==='resume')r=allowancePA5Request(kind);
 else if(kind==='accept'||kind==='decline')r=allowancePA5Answer(kind==='accept');
 else if(kind==='negotiate')r=allowancePA5Negotiate('higher');
 else if(kind==='why')r=allowancePA5Discuss();
 else return false;
 if(!r.ok)toast(r.reason||'Caregiver could not approve this request.');
 else if(kind==='why')toast(r.reason);
 save();render();return true;
}
// Wrappers keep original clock/migration and UI authority. Register before initial listeners.
const allowancePA5OriginalMigrate=migrate;
migrate=function(){const r=allowancePA5OriginalMigrate();allowancePA5State();return r;};
const allowancePA5OriginalDailyTick=dailyTick;
dailyTick=function(options){allowancePA5OriginalDailyTick(options);allowancePA5Tick();};
const allowancePA5OriginalAgeUp=ageUp;
ageUp=function(...args){const r=allowancePA5OriginalAgeUp(...args),p=allowancePA5State();if(p.skipTotals?.count){
 log('Allowance during the year',`${p.skipTotals.count} contracted weekly payments totaling ${money(p.skipTotals.amount)} were added to your cash during the skip.`);
 p.skipTotals=null;save();render();}return r;};
const allowancePA5OriginalBusinessPanel=businessPanel;
businessPanel=function(){return allowancePA5OriginalBusinessPanel().replace('<h3>Chores & allowance</h3>','<h3>Chore earnings</h3>').replace('<section class="card wide"><h3>Small business</h3>',allowancePA5Html()+'<section class="card wide"><h3>Small business</h3>');};
const allowancePA5OriginalPanelClick=handlePanelClick;
handlePanelClick=function(e){const b=e.target.closest('button');if(b?.dataset?.allowancePa5){allowancePA5Click(b.dataset.allowancePa5);return;}return allowancePA5OriginalPanelClick(e);};
