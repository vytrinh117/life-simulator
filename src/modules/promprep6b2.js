// PHASE 6B.2 — Event-scoped Prom preparation, using existing Calendar/Inventory/family.
// No awards, NPC encounters, photos, attendance, fake purchased goods, or romance outcomes.
const PROM_PREP_SCHEMA_6B2=1;
function promReadyRecord6B2(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),r=n?.gettingReady6B2;
 return r?.eventId===n.eventId?r:null;
}
function ensurePromReady6B2(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);if(!n)return null;
 if(promReadyRecord6B2(pr))return n.gettingReady6B2;
 if(['completed','missed','cancelled'].includes(n.status))return null;
 n.gettingReady6B2={schemaVersion:PROM_PREP_SCHEMA_6B2,eventId:n.eventId,outfitItemId:null,
  outfitSelectedAt:null,makeup:null,hair:null,helperDecisions:{},preparationMinutes:0};
 return n.gettingReady6B2;
}
function promReadyWindow6B2(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);
 if(!n||!promRegistered6A1(pr)||pr.plan==='skip'||['completed','missed','cancelled','attending'].includes(n.status))return {ok:false,reason:'not_available'};
 if(S.location!=='Home')return {ok:false,reason:'prepare_at_home'};
 const eligible=promSeasonEligibility6A1(),identity=promIdentity6A1(eligible),ev=promNightEvent6B1(pr);
 if(!eligible.ok||!identity||identity.eventId!==n.eventId||!ev||isTerminal(ev.status))return {ok:false,reason:'school_or_event_ineligible'};
 const days=daysBetween(currentDate(),n.dateISO);
 if(days<0||days>7)return {ok:false,reason:'preparation_window_closed'};
 if(days===0&&currentMinute()>=n.entryCutoffMinute)return {ok:false,reason:'too_late'};
 return {ok:true};
}
function promReadyTimeBudget6B2(pr,minutes){const n=promNightRecord6B1(pr);return currentDate()!==n.dateISO||currentMinute()+minutes<=n.entryCutoffMinute?{ok:true}:{ok:false,reason:'not_enough_time_before_checkin'};}
function promWearableOptions6B2(){
 return (S.inventoryItems||[]).filter(i=>i&&!i.stored&&i.condition>0&&i.lifecycleType==='wearable'&&
   catalogItem(i.key)?.category==='Clothes'&&!!catalogItem(i.key)?.slot);
}
function promOutfitQuality6B2(it){
 if(!it)return 0;const d=catalogItem(it.key);
 return Math.round(Math.max(1,Math.min(100,(['promSuit','promDress'].includes(it.key)?70:30)+
   Math.min(15,Number(d?.style||0))+Math.round((it.condition||0)/10))));
}
function promOutfitChoice6B2(itemId){
 const pr=S?.school?.prom,g=promReadyWindow6B2(pr);if(!g.ok)return g;
 const it=promWearableOptions6B2().find(i=>i.id===itemId);
 if(!it)return {ok:false,reason:'item_not_owned_or_wearable'};
 const t=promReadyTimeBudget6B2(pr,12);if(!t.ok)return t;
 const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
 if(r.outfitItemId===it.id)return {ok:false,reason:'already_selected'};
 const d=catalogItem(it.key),old=equippedIn(d.slot);
 if(old&&old!==it)old.equipped=false;
 it.equipped=true;it.stored=false;
 r.outfitItemId=it.id;r.outfitSelectedAt={dateISO:currentDate(),minute:currentMinute()};
 r.outfitQualityAtSelection=promOutfitQuality6B2(it);
 r.preparationMinutes+=12;
 if(pr.prep)pr.prep.outfit='existing'; // legacy display only: backed by actual selected inventory ID
 advanceTime(12,{silent:true});log('Prom outfit chosen',`You prepare ${it.name} from your own wardrobe. No new item was created.`);
 return {ok:true,itemId:it.id,quality:r.outfitQualityAtSelection};
}
function promDayOnly6B2(pr){const n=promNightRecord6B1(pr);return n&&currentDate()===n.dateISO&&currentMinute()>=720?{ok:true}:{ok:false,reason:'prom_day_preparation_only'};}
function promMakeupKit6B2(needed=3.3){return (S.inventoryItems||[]).find(i=>i.key==='makeup'&&!i.stored&&i.lifecycleType==='finite'&&Number(i.remaining)>=needed)||null}
function promHelperCandidates6B2(){
 if(!livesWithParents())return [];
 return (S.people||[]).filter(p=>p&&p.id&&inHousehold(p)&&!p.deceased&&(p.relation==='mother'||p.role==='aunt'||
  ((p.role==='parent'||p.role==='uncle'||isSibling(p))&&Number(p.makeupSkill??p.skills?.makeup??p.skills?.style??-1)>=30))&&
  (p.role==='parent'||p.role==='aunt'||p.role==='uncle'||personAge(p)>=16&&personAge(p)>S.age));
}
function promHelperQuality6B2(p){
 // Use genuine recorded skills if present, otherwise a modest baseline, not an invented skill record.
 const recorded=[p.makeupSkill,p.skills?.makeup,p.skills?.style,p.style].find(x=>Number.isFinite(Number(x))&&x!==null&&x!==undefined);
 const skill=recorded==null?45:Number(recorded);
 return Math.round(Math.max(25,Math.min(90,28+skill*.48+(Number(p.looks)||50)*.09)));
}
function promMakeupSelf6B2(){
 const pr=S?.school?.prom,g=promReadyWindow6B2(pr);if(!g.ok)return g;
 const t=promReadyTimeBudget6B2(pr,25);if(!t.ok)return t;
 const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
 const day=promDayOnly6B2(pr);if(!day.ok)return day;
 if(r.makeup)return {ok:false,reason:'makeup_already_prepared'};
 if(S.age<13)return {ok:false,reason:'independent_makeup_age_restricted'};
 const style=typeof promPA4Selected==='function'?promPA4Selected('makeup',r):'classic';
 if(style==='none')return {ok:false,reason:'no_makeup_planned_use_confirmation'};
 const required=typeof promPA4MakeupUnits==='function'?promPA4MakeupUnits(style):3.3;
 const it=promMakeupKit6B2(required);if(!it)return {ok:false,reason:'makeup_kit_required'};
 // Existing finite-item lifecycle: opened item ID, consumption and used count, not a fictional kit.
 const used=openOne(it);
 if(Number(used.remaining)<required)return {ok:false,reason:'insufficient_makeup'};
 used.remaining=Math.max(0,Math.round((used.remaining-required)*100)/100);
 used.timesUsed=(used.timesUsed||0)+1;
 const quality=Math.round(Math.max(25,Math.min(85,39+(Number(S.skills?.style)||0)*.5+(Number(S.looks)||50)*.12+(typeof promPA4QualityDelta==='function'?promPA4QualityDelta('makeup',style):0))));
 r.makeup={method:'self',style,itemId:used.id,unitsUsed:required,quality,dateISO:currentDate(),minute:currentMinute()};
 if(pr.prep)pr.prep.makeup='done';r.preparationMinutes+=25;
 advanceTime(25,{silent:true});log('Prom makeup',`You apply your own makeup using ${used.name}.`);
 return {ok:true,method:'self',itemId:used.id,quality,remaining:used.remaining};
}
function promMakeupHelper6B2(personId){
 const pr=S?.school?.prom,g=promReadyWindow6B2(pr);if(!g.ok)return g;
 const t=promReadyTimeBudget6B2(pr,30);if(!t.ok)return t;
 const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
 const day=promDayOnly6B2(pr);if(!day.ok)return day;
 if(r.makeup)return {ok:false,reason:'makeup_already_prepared'};
 const style=typeof promPA4Selected==='function'?promPA4Selected('makeup',r):'classic';
 const p=promHelperCandidates6B2().find(p=>p.id===personId);
 if(!p)return {ok:false,reason:'helper_not_eligible_or_at_home'};
 if(r.helperDecisions[p.id]==='declined')return {ok:false,reason:'previously_declined'};
 if(p.available===false||p.busyUntilDateISO&&p.busyUntilDateISO>=currentDate()||p.promUnavailableDateISO===currentDate())return {ok:false,reason:'helper_unavailable'};
 // Refusal is deterministic, persistent and cannot be rerolled by repeated clicking.
 if(Number(p.rel??p.trust??50)<15){r.helperDecisions[p.id]='declined';return {ok:false,reason:'helper_declined'};}
 r.helperDecisions[p.id]='accepted';const quality=Math.max(25,Math.min(90,promHelperQuality6B2(p)+(typeof promPA4QualityDelta==='function'?promPA4QualityDelta('makeup',style):0)));
 r.makeup={method:'family',style,helperId:p.id,quality,dateISO:currentDate(),minute:currentMinute()};
 if(pr.prep)pr.prep.makeup='family';r.preparationMinutes+=30;
 advanceTime(30,{silent:true});log('Family Prom makeup',`${displayName(p)} helps you with a Prom look at home.`);
 return {ok:true,method:'family',helperId:p.id,quality};
}
function promHair6B2(){
 const pr=S?.school?.prom,g=promReadyWindow6B2(pr);if(!g.ok)return g;
 const style=typeof promPA4Selected==='function'?promPA4Selected('hair',promReadyRecord6B2(pr)):'natural';
 const minutes=typeof promPA4HairMinutes==='function'?promPA4HairMinutes(style):20;
 const t=promReadyTimeBudget6B2(pr,minutes);if(!t.ok)return t;
 const r=ensurePromReady6B2(pr);if(!r)return {ok:false,reason:'no_active_prom'};
 const day=promDayOnly6B2(pr);if(!day.ok)return day;
 if(r.hair)return {ok:false,reason:'hair_already_prepared'};
 r.hair={method:'home',style,dateISO:currentDate(),minute:currentMinute(),quality:Math.min(75,35+Math.round((Number(S.skills?.style)||0)*.35)+(typeof promPA4QualityDelta==='function'?promPA4QualityDelta('hair',style):0))};
 if(pr.prep)pr.prep.hair='diy';r.preparationMinutes+=minutes;
 advanceTime(minutes,{silent:true});log('Prom hair',`You style your hair at home (${style}).`);return {ok:true,hair:r.hair};
}
function promReadySummary6B2(pr=S?.school?.prom){
 const r=promReadyRecord6B2(pr);if(!r)return null;
 const outfit=(S.inventoryItems||[]).find(i=>i.id===r.outfitItemId);
 return {eventId:r.eventId,outfitId:outfit?.id||null,outfitName:outfit?.name||null,
  outfitValid:!!outfit&&!outfit.stored&&outfit.condition>0&&outfit.equipped,
  outfitQuality:outfit?.equipped?promOutfitQuality6B2(outfit):0,
  makeupMethod:r.makeup?.method||null,makeupQuality:r.makeup?.quality||0,
  hairPrepared:!!r.hair,hairStyle:r.hair?.style||null,makeupStyle:r.makeup?.style||null,minutes:r.preparationMinutes};
}
function promGettingReadyHtml6B2(pr=S?.school?.prom){
 if(typeof promPA4GettingReadyHtml==='function')return promPA4GettingReadyHtml(pr);
 const n=promNightRecord6B1(pr);if(!n)return '';
 const r=promReadyRecord6B2(pr),s=promReadySummary6B2(pr),g=promReadyWindow6B2(pr);
 if(!r&&!g.ok)return '';
 const wear=promWearableOptions6B2();const done=n.status==='attending'||['completed','missed','cancelled'].includes(n.status);
 const kit=promMakeupKit6B2();const helpers=promHelperCandidates6B2();
 return `<div class="prom-ready-6b2" data-prom-ready6b2="${esc(n.eventId)}"><h4>Getting ready · School Prom</h4>`+
  `<p class="muted-text">${s?.outfitValid?`Outfit: ${esc(s.outfitName)}`:s?.outfitName?'Your chosen outfit is no longer equipped or usable.':'No outfit chosen yet.'} · Makeup: ${esc(s?.makeupMethod||'none')} · Hair: ${s?.hairPrepared?'styled':'not styled'}. Makeup is optional.</p>`+
  (g.ok?`<div class="prom-ready-options-6b2"><b>Choose clothes you actually own</b><div class="inline-actions">${wear.map(i=>`<button class="small ghost" data-prom-ready-action6b2="outfit" data-item-id="${esc(i.id)}">${esc(i.name)} (${Math.round(i.condition)}%)</button>`).join('')||'<small>No usable clothing in Inventory. Visit the Store for clothes, including formal dress or suit.</small>'}</div>`+
  `<p class="muted-text">Formalwear is available in the normal Store. Ordinary clothing is allowed, but may be less suitable.</p>`+
  (!r?.makeup?`<div class="inline-actions">${S.age>=13?`<button class="small ghost" data-prom-ready-action6b2="self" ${kit?'':'disabled'}>Apply own makeup${kit?'':' · makeup kit required'}</button>`:''}${helpers.map(p=>`<button class="small ghost" data-prom-ready-action6b2="helper" data-person-id="${esc(p.id)}">Ask ${esc(displayName(p))} for makeup help</button>`).join('')}</div>`:'')+
  (!r?.hair?`<button class="small ghost" data-prom-ready-action6b2="hair">Style hair at home</button>`:'')+'</div>':`<small class="muted-text">${done?'Preparation is closed for this Prom.':'Prepare at home during the final seven days before Prom.'}</small>`)+`</div>`;
}
function promReadyClick6B2(b){
 if(typeof promPA4Click==='function'&&promPA4Click(b))return true;
 const action=b?.dataset?.promReadyAction6b2;if(!action)return false;
 const r=action==='outfit'?promOutfitChoice6B2(b.dataset.itemId):action==='self'?promMakeupSelf6B2():
  action==='helper'?promMakeupHelper6B2(b.dataset.personId):action==='hair'?promHair6B2():{ok:false,reason:'unknown_action'};
 if(!r.ok)toast('Prom preparation: '+r.reason.replaceAll('_',' '));save();render();return true;
}
// Legacy preparation shortcuts must not create or consume phantom formalwear/cosmetics.
const oldPromPrep6B2=promPrep;
promPrep=function(key){
 if(['outfitBuy','outfitOwn','outfitBorrow','makeup','hairDiy','hairSalon'].includes(key))return {ok:false,reason:'use_inventory_prom_preparation'};
 return oldPromPrep6B2(key);
};
