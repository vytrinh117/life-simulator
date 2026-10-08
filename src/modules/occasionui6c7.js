// PHASE 6C.7 — UI, lifecycle notifications and action wiring for the canonical occasions.
// Presentation-only selections are ephemeral; gameplay state remains in S.occasions6C1.
let occasionOpen6C7=null;
const OCC6C7_LABEL={quiet:'Celebrate quietly',small_gathering:'Plan small gathering',family_dinner:'Plan family dinner',cake_prepare:'Prepare a cake',cake_buy:'Buy cake ($25)',decorate:'Decorate ($12)',invitations_prepare:'Prepare invitations',food_select:'Choose food'};
function occasionNotify6C7(){
 if(!S?.occasions6C1?.occurrences)return;
 const today=currentDate();
 for(const rec of occasionRecords6C1()){
  const refs=[`${rec.occasionId}:prepare`,`${rec.occasionId}:day`];
  if(OCCASION6C1_TERMINAL.has(rec.status)||today>rec.endDateISO){for(const ref of refs)resolveNotificationsFor(ref);continue}
  // Do not backfill expired reminders or historical events during migration.
  if(today<rec.preparationWindow.opensISO)continue;
  const ledger=rec.notices6C7||(rec.notices6C7={schemaVersion:1,prepareSent:false,daySent:false});
  if(today<rec.dateISO&&!ledger.prepareSent){
   ledger.prepareSent=true;
   notify('Occasion coming up',`${rec.title} • ${formatDate(rec.dateISO)}. Preparation is available.`,{sourceId:refs[0],sourceType:'occasion',tab:'calendar'});
  }
  if(today===rec.dateISO&&!ledger.daySent){
   ledger.daySent=true;resolveNotificationsFor(refs[0]);
   notify('Occasion today',`${rec.title} is today. Check your planned activities.`,{sourceId:refs[1],sourceType:'occasion',tab:'calendar'});
  }
 }
}
function occasionVisible6C7(){
 const today=currentDate();return occasionRecords6C1().filter(r=>(!OCCASION6C1_TERMINAL.has(r.status)&&r.dateISO>=today&&daysBetween(today,r.dateISO)<=35)||
 (r.dateISO<=today&&daysBetween(r.dateISO,today)<=3&&(r.status==='Completed'||r.status==='Expired')))
 .sort((a,b)=>a.dateISO.localeCompare(b.dateISO)||a.occasionId.localeCompare(b.occasionId)).slice(0,9)
}
function occasionPersonOptions6C7(filter){return (S.people||[]).filter(p=>p?.id&&!p.deceased&&!p.movedAway&&(!filter||filter(p))).slice(0,65)}
function occasionOptionsHtml6C7(items,display){return items.map(x=>`<option value="${esc(x.id)}">${esc(display(x))}</option>`).join('')}
function occasionButton6C7(rec,kind,value,label,gate,extra=''){
 const valid=gate?.ok===true;
 return `<button class="small ${valid?'':'ghost'}" data-occ-action="${esc(kind)}" data-occ-id="${esc(rec.occasionId)}" data-occ-value="${esc(value??'')}" ${extra} ${valid?'':`disabled title="${esc(gate?.reason||'Not available')}"`}>${esc(label)}</button>`
}
function occasionDetails6C7(rec){
 const id=rec.occasionId,prep=occasionPreparationGate6C1(id),terminal=OCCASION6C1_TERMINAL.has(rec.status),today=currentDate(),active=today>=rec.dateISO&&today<=rec.endDateISO&&!terminal;
 const plan=rec.planning6C2,guests=rec.guests6C4,gifts=rec.gifts6C3,social=rec.social6C6;
 let html=`<div class="occ-detail" data-occ-detail="${esc(id)}"><p class="muted-text">${esc(formatDate(rec.dateISO))} • ${esc(rec.status)} • ${esc(rec.calendarReference?.authority||'Calendar')} source</p>`;
 if(!terminal){
  html+=`<div class="occ-group"><b>Preparation & budget</b><small>${prep.ok?'Available until the occasion begins':prep.reason==='preparation_not_open'?`Opens ${formatDate(rec.preparationWindow.opensISO)}`:prep.reason==='preparation_deadline_passed'?'Preparation deadline passed':esc(prep.reason)}</small>`;
  if(prep.ok){
   html+=`<div class="occ-controls"><label>Budget ($) <input data-occ-budget type="number" min="0" max="10000000" step="1" value="${Number(plan?.budget||0)}" aria-label="Occasion budget"></label>${occasionButton6C7(rec,'budget','', 'Set budget', {ok:true})}</div>`;
   for(const [kind,label] of Object.entries(OCC6C7_LABEL))html+=occasionButton6C7(rec,'prepare',kind,label,occasionPlanningGate6C2(id,kind));
   html+=occasionButton6C7(rec,'venue','Home','Choose Home venue',occasionPlanningGate6C2(id,'venue','Home'));
   if(plan)html+=occasionButton6C7(rec,'prepare','cancel','Cancel occasion plan',occasionPlanningGate6C2(id,'cancel'));
  }
  html+=`<small>Spent $${Number(plan?.actualCost||0)} / $${Number(plan?.budget||0)} budget. ${esc(plan?.venue||'No venue selected')}.</small></div>`;
  const people=occasionPersonOptions6C7(),inviteable=people.filter(p=>p.id!==rec.celebrantPersonId),inviteOptions=occasionOptionsHtml6C7(inviteable,p=>displayName(p));
  html+=`<div class="occ-group"><b>Invitations & actual attendance</b><small>RSVP does not mean attended. Schedule and venue gates apply.</small>`;
  if(inviteable.length&&prep.ok){html+=`<div class="occ-controls"><label>Invite <select data-occ-person>${inviteOptions}</select></label><label>Start <select data-occ-minute><option value="1080">6:00 PM</option><option value="1140">7:00 PM</option><option value="900">3:00 PM</option></select></label>${occasionButton6C7(rec,'invite','','Invite', {ok:true})}</div>`}
  for(const e of guests?.invitations||[]){const p=personById(e.personId);html+=`<div class="occ-row"><span>${esc(p?displayName(p):'Former contact')} • ${esc(e.status)}${e.attended?' • Present':''}</span>${e.status==='Accepted'&&!e.attended?occasionButton6C7(rec,'attendance',e.personId,'Confirm arrival',occasionAttendanceGate6C4(id,e.personId)):''}</div>`}
  html+=`</div>`;
  const eligible=occasionPersonOptions6C7(),owned=(S.inventoryItems||[]).filter(it=>it?.id&&!it.stored&&!it.equipped);
  html+=`<div class="occ-group"><b>Gifts & wrapping</b><small>Purchase through the existing Store. Only owned items can transfer.</small>`;
  if(eligible.length&&owned.length&&prep.ok)html+=`<div class="occ-controls"><label>Recipient <select data-occ-gift-person>${occasionOptionsHtml6C7(eligible,p=>displayName(p))}</select></label><label>Owned item <select data-occ-item>${occasionOptionsHtml6C7(owned,it=>it.name||it.key)}</select></label>${occasionButton6C7(rec,'select-gift','','Select gift',{ok:true})}</div>`;
  for(const entry of gifts?.selected||[]){if((gifts.transfers||[]).some(x=>x.itemId===entry.itemId))continue;const p=personById(entry.personId),it=S.inventoryItems.find(x=>x.id===entry.itemId);if(!p||!it)continue;
   html+=`<div class="occ-row"><span>${esc(it.name||it.key)} → ${esc(displayName(p))}${it.wrapped?' • Wrapped':''}</span><div class="inline-actions">${occasionButton6C7(rec,'wrap',entry.itemId,'Wrap',it.wrapped?{ok:false,reason:'already_wrapped'}:occasionGiftGate6C3(id,null,'prepare'))}${occasionButton6C7(rec,'give',entry.itemId,'Give',occasionGiftDeliveryGate6C8(id,entry.itemId,p.id))}</div></div>`}
  for(const e of gifts?.transfers||[])html+=`<small>Gift delivered to ${esc(personById(e.personId)?displayName(personById(e.personId)):'former contact')} • ${esc(e.reaction||'Recorded')}</small>`;
  html+=`</div>`;
  const candidates=occasionPersonOptions6C7(p=>occasionValidSocialPerson6C6(rec,p.id));
  html+=`<div class="occ-group"><b>Traditions & relationships</b>`;
  if(candidates.length)html+=`<label>Person <select data-occ-social-person>${occasionOptionsHtml6C7(candidates,p=>displayName(p))}</select></label>`;
  const personId=candidates[0]?.id||null;
  for(const [kind,label] of [['prepare_card','Prepare handwritten card'],['promise','Promise to acknowledge'],['give_card','Give prepared card'],['acknowledge','Wish / acknowledge'],['share_meal','Share a family meal'],['reflect','Reflect on anniversary']]){
   const gate=occasionSocialGate6C6(id,kind,kind==='reflect'?null:personId);
   if((kind==='reflect'&&rec.occasionType.includes('anniversary'))||(kind!=='reflect'&&personId))html+=occasionButton6C7(rec,'social',kind,label,gate);
  }
  for(const e of social?.actions||[])html+=`<small>${esc(e.kind.replaceAll('_',' '))} • ${esc(e.dateISO)}</small>`;
  if(rec.occasionType==='holiday'){
   const hw=holidayWindow().find(w=>w.h.id===rec.sourceKey);if(hw)for(const a of availableActivities(hw).slice(0,9))html+=occasionButton6C7(rec,'holiday',a.id,a.label,{ok:true});
  }
  html+=`</div>`;
  const sur=rec.surprise6C5;
  html+=`<div class="occ-group"><b>Surprise celebration</b><small>${esc(sur?.kind==='npc_for_player'?'Someone may have planned something':sur?.status||'No surprise arranged')}</small>`;
  if(sur?.kind==='player_for_npc'&&sur.status==='secret_planned'){
   html+=occasionButton6C7(rec,'surprise','reveal','Reveal surprise',occasionSurpriseEventGate6C5(id,'player_for_npc'));
   html+=occasionButton6C7(rec,'surprise','cancel','Cancel surprise',{ok:true});
  }else if(sur?.kind==='npc_for_player'&&['secret_planned','discovered_early'].includes(sur.status)){
   for(const [kind,label] of [['happy','Celebrate happily'],['grateful','Thank the organizer'],['embarrassed','Feel embarrassed'],['overwhelmed','Feel overwhelmed'],['disappointed','Express disappointment']])html+=occasionButton6C7(rec,'surprise',kind,label,occasionSurpriseEventGate6C5(id,'npc_for_player'));
  }else if(!sur&&rec.occasionType==='birthday'&&rec.celebrantKind==='person')html+=occasionButton6C7(rec,'surprise','plan','Organize a surprise',occasionSurpriseOtherPartyGate6C5(id));
  html+=`</div>`;
 }
 return html+'</div>'
}
function occasionSection6C7(kind='home'){
 const rows=occasionVisible6C7(),title=kind==='calendar'?'Occasions & celebrations':'Upcoming occasions';
 return `<section class="card wide occasion6c7" data-sub="${kind==='calendar'?'upcoming':'now'}"><div class="section-heading"><div><h3>${title}</h3><p class="muted-text">Plan ahead, invite real people, and keep occasion memories.</p></div><span class="tag">${rows.length}</span></div>${rows.length?rows.map(rec=>{
  const delta=daysBetween(currentDate(),rec.dateISO),chosen=occasionOpen6C7===rec.occasionId;
  return `<div class="occ-card"><div class="occ-row"><div><b>${esc(rec.title)}</b><small>${esc(formatDate(rec.dateISO))} • ${delta===0?'Today':delta===1?'Tomorrow':delta>0?`${delta} days remaining`:'Past'} • ${esc(rec.status)}</small></div><button class="small ${chosen?'ghost':''}" data-occ-open="${esc(rec.occasionId)}" aria-expanded="${chosen}">${chosen?'Close':'Details'}</button></div>${chosen?occasionDetails6C7(rec):''}</div>`}).join(''):'<p class="muted-text">No occasions are approaching in the next 35 days.</p>'}</section>`
}
function occasionUiClick6C7(b){
 const d=b.dataset;if(!d.occOpen&&!d.occAction)return false;
 if(d.occOpen){occasionOpen6C7=occasionOpen6C7===d.occOpen?null:d.occOpen;render();return true}
 const id=d.occId,rec=occasionRecord6C1(id),root=b.closest('[data-occ-detail]');if(!rec||!root||root.dataset.occDetail!==id)return true;
 const read=(q)=>root.querySelector(q)?.value||null;
 let res={ok:false,reason:'unsupported_action'};
 switch(d.occAction){
  case 'budget':{const raw=read('[data-occ-budget]');res=occasionPrepare6C2(id,'budget',raw!==null&&raw!==''?Number(raw):NaN);break}
  case 'venue':res=occasionPrepare6C2(id,'venue',d.occValue);break;
  case 'prepare':res=occasionPrepare6C2(id,d.occValue);break;
  case 'invite':res=occasionInvite6C4(id,read('[data-occ-person]'),Number(read('[data-occ-minute]')||1080));break;
  case 'attendance':res=occasionConfirmAttendance6C4(id,d.occValue);break;
  case 'select-gift':res=occasionSelectGift6C3(id,read('[data-occ-item]'),read('[data-occ-gift-person]'));break;
  case 'wrap':res=occasionWrapGift6C3(id,d.occValue);break;
  case 'give':{const entry=rec.gifts6C3?.selected.find(x=>x.itemId===d.occValue);res=occasionGiveGift6C3(id,d.occValue,entry?.personId||null);break}
  case 'social':res=occasionSocialAction6C6(id,d.occValue,d.occValue==='reflect'?null:read('[data-occ-social-person]'));break;
  case 'holiday':res=occasionHolidayAction6C6(id,d.occValue);break;
  case 'surprise':res=d.occValue==='plan'?occasionPlanSurprise6C5(id):d.occValue==='cancel'?occasionCancelSurprise6C5(id):d.occValue==='reveal'?occasionResolveSurprise6C5(id):occasionResolveSurprise6C5(id,d.occValue);break;
 }
 if(res?.ok){if(OCCASION6C1_TERMINAL.has(rec.status))occasionOpen6C7=null;save();toast('Occasion updated.');}
 else toast(`Cannot do that: ${(res?.reason||'unavailable').replaceAll('_',' ')}.`);
 render();return true
}
