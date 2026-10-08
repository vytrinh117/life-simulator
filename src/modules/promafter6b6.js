// PHASE 6B.6 — Factual Prom farewells, checkout, and at-home reflection.
// Extends the *same* Phase 6A/6B Night record: no parallel social, family, Calendar or travel engine.
const PROM_AFTER_SCHEMA_6B6=1;
const PROM_AFTER_TRAVEL_MINUTES_6B6=20;
function promAfterRecord6B6(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr),r=n?.after6B6;
 return n&&r?.eventId===n.eventId&&r.schoolId===n.schoolId&&r.venue===n.venue?r:null;
}
function ensurePromAfter6B6(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);
 if(!n?.attendanceRecorded)return null;
 if(promAfterRecord6B6(pr))return n.after6B6;
 // No retrospective reconstruction for completed/missed/transferred Prom saves.
 if(n.status!=='attending'||!promArrivalRecord6B3(pr))return null;
 n.after6B6={schemaVersion:PROM_AFTER_SCHEMA_6B6,eventId:n.eventId,schoolId:n.schoolId,venue:n.venue,
  farewells:[],checkout:null,homeResponse:null,firstPromRecorded:false};
 return n.after6B6;
}
function promFarewellGate6B6(npcId){
 const g=promArrivalGate6B3();if(!g.ok)return g;
 const pr=S.school.prom,n=promNightRecord6B1(pr),a=reconcilePromArrival6B3(pr),r=ensurePromAfter6B6(pr);
 if(!r)return {ok:false,reason:'no_active_prom'};
 const npc=npcById(npcId);
 if(!npc||!a.attendeeIds.includes(npcId)||!promCourtSchoolPeer6A4(npc,pr))return {ok:false,reason:'student_not_present'};
 const hello=a.greetings.some(x=>x.npcId===npcId),companion=a.companion?.status==='present'&&a.companion.npcId===npcId;
 const p=(S.people||[]).find(x=>x.npcId===npcId&&!isFamilyPerson(x));
 if(!p||!hello&&!companion)return {ok:false,reason:'introduce_first'};
 if(r.farewells.some(x=>x.npcId===npcId))return {ok:false,reason:'already_said_goodbye'};
 if(currentMinute()+5>n.endMinute)return {ok:false,reason:'not_enough_time'};
 return {ok:true,pr,n,r,p,npcId,companion};
}
function promFarewell6B6(npcId){
 const g=promFarewellGate6B6(npcId);if(!g.ok)return g;
 const {r,p,companion}=g;
 const text=companion?'You thank your confirmed Prom companion for spending the evening together.':'You say goodbye to your classmate at the school hall.';
 r.farewells.push({npcId,personId:p.id,eventId:r.eventId,dateISO:currentDate(),minute:currentMinute(),kind:companion?'companion':'classmate',text});
 // A respectful goodbye is a factual memory, not a date, kiss, commitment or romance milestone.
 if((p.rel??0)>=35)p.rel=clamp(p.rel+1);
 rememberPerson(p,`Said goodbye at School Prom (${g.n.venue}).`,1);
 advanceTime(5,{silent:true});log('Prom farewell',`${displayName(p)}: ${text}`);
 return {ok:true,personId:p.id,eventId:r.eventId};
}
function finalizePromAfter6B6(reason='left_early'){
 const pr=S?.school?.prom,n=promNightRecord6B1(pr),r=ensurePromAfter6B6(pr);
 if(!n||n.status!=='attending'||!r||r.checkout)return null;
 const a=promArrivalRecord6B3(pr),m=n.moments6B4,c=n.ceremony6B5;
 const actions=Array.isArray(m?.actions)?m.actions:Array.isArray(m?.activities)?m.activities:[];
 const greetings=Array.isArray(a?.greetings)?a.greetings.length:0;
 const photos=Array.isArray(c?.photos)?c.photos.length:0;
 const familyAtHome=typeof livesWithParents==='function'&&livesWithParents()&&S.age<18;
 const cf=familyAtHome&&typeof curfewMinute==='function'?curfewMinute():null;
 const leaveMinute=currentMinute(),homeMinute=leaveMinute+PROM_AFTER_TRAVEL_MINUTES_6B6;
 // A registered school event is permitted through the official venue end, plus travel;
 // only exceptional lateness beyond this window can prompt a bounded family consequence.
 const allowed=Math.max(cf??0,n.endMinute)+PROM_AFTER_TRAVEL_MINUTES_6B6+15;
 const seriouslyLate=familyAtHome&&cf!=null&&homeMinute>allowed;
 const caregiver=seriouslyLate&&typeof householdCaregivers==='function'?householdCaregivers()[0]:null;
 r.checkout={eventId:n.eventId,venue:n.venue,dateISO:currentDate(),minute:leaveMinute,reason,
  travelMinutes:PROM_AFTER_TRAVEL_MINUTES_6B6,arrivalExpectedMinute:homeMinute,
  greetings,activities:actions.length,photos,ceremonyAttended:!!c?.ceremony,
  farewellPersonIds:r.farewells.map(x=>x.personId),companionStatus:a?.companion?.status||'none',
  curfew:{applicable:cf!=null,extendedForSchoolEvent:true,lateConcern:!!(seriouslyLate&&caregiver),caregiverId:caregiver?.id||null}};
 if(seriouslyLate&&caregiver){
  S.family.tension=clamp((S.family.tension??0)+1);
  log('Late return from Prom',`${firstName(caregiver)} is concerned because you returned later than the approved school event and travel window.`);
 }
 // First-Prom milestone requires a meaningful activity that really occurred, never just a check-in.
 const meaningful=greetings>0||actions.length>0||photos>0||!!c?.ceremony||r.farewells.length>0;
 if(meaningful&&!(S.milestones||[]).some(x=>x.promKind6B6==='first_attended_prom')){
  S.milestones=S.milestones||[];
  S.milestones.unshift({dateISO:currentDate(),age:S.age,title:'First school Prom',text:`Attended ${n.venue} and took part in the evening.`,promKind6B6:'first_attended_prom',promEventKey:`${n.eventId}:first-attended-prom`});
  r.firstPromRecorded=true;
 }
 return r.checkout;
}
function promHomeResponseGate6B6(kind){
 const pr=S?.school?.prom,n=promNightRecord6B1(pr),r=promAfterRecord6B6(pr);
 if(!r?.checkout||n?.status!=='completed'||pr?.status!=='Done')return {ok:false,reason:'prom_not_completed'};
 if(S.location!=='Home')return {ok:false,reason:'return_home_first'};
 if(r.homeResponse)return {ok:false,reason:'already_reflected'};
 const days=daysBetween(n.dateISO,currentDate());
 if(days<0||days>1||days===1&&currentMinute()>1260)return {ok:false,reason:'reflection_window_closed'};
 if(!['share','quiet'].includes(kind))return {ok:false,reason:'unknown_response'};
 if(kind==='share'){
  if(typeof livesWithParents!=='function'||!livesWithParents())return {ok:false,reason:'independent_household'};
  const cg=typeof householdCaregivers==='function'?householdCaregivers().find(x=>!x.deceased&&!x.movedAway):null;
  if(!cg)return {ok:false,reason:'no_available_caregiver'};
  if(currentMinute()<420||currentMinute()>1260)return {ok:false,reason:'caregiver_asleep'};
  return {ok:true,n,r,caregiver:cg};
 }
 return {ok:true,n,r};
}
function promHomeResponse6B6(kind){
 const g=promHomeResponseGate6B6(kind);if(!g.ok)return g;
 const {n,r,caregiver}=g;const snap=r.checkout;
 let story;
 if(kind==='share'){
  const detail=snap.photos?`You show ${snap.photos} photograph${snap.photos===1?'':'s'}.`:snap.ceremonyAttended?'You describe the school ceremony.':'You talk about your time at the school hall.';
  story=`You tell ${firstName(caregiver)} how Prom went. ${detail}`;
  S.family.closeness=clamp((S.family.closeness??50)+1);
 }else story='You take a quiet moment at home to remember the parts of Prom you actually experienced.';
 r.homeResponse={kind,dateISO:currentDate(),minute:currentMinute(),caregiverId:caregiver?.id||null,text:story};
 advanceTime(10,{silent:true});log('After Prom',story);
 return {ok:true,eventId:n.eventId,kind};
}
function promAfterHtml6B6(pr=S?.school?.prom){
 const n=promNightRecord6B1(pr);if(!n?.attendanceRecorded)return '';
 const r=n.status==='attending'?ensurePromAfter6B6(pr):promAfterRecord6B6(pr);
 if(!r)return '';
 if(n.status==='attending'){
  const a=promArrivalRecord6B3(pr),ids=(a?.attendeeIds||[]).filter(id=>{
   const p=(S.people||[]).find(x=>x.npcId===id&&!isFamilyPerson(x));
   return p&&(a.greetings.some(x=>x.npcId===id)||a.companion?.status==='present'&&a.companion.npcId===id);
  }).slice(0,10);
  return `<section class="prom-after-6b6" data-prom-after6b6="${esc(n.eventId)}"><h4>Leaving the School Hall</h4>`+
   `<p class="muted-text">Say goodbye to people actually here, or head home when you are ready. A goodbye takes five minutes.</p><div class="prom-after-actions-6b6">`+
   ids.map(id=>{const p=(S.people||[]).find(x=>x.npcId===id),g=promFarewellGate6B6(id);return `<button class="small ghost" data-prom-after-action6b6="farewell" data-npc-id="${esc(id)}" ${g.ok?'':'disabled'}>${r.farewells.some(x=>x.npcId===id)?'Goodbye said':'Say goodbye to '+esc(p?firstName(p):'classmate')}</button>`}).join('')+`</div></section>`;
 }
 if(n.status!=='completed'||!r.checkout)return '';
 const x=r.checkout,share=promHomeResponseGate6B6('share'),quiet=promHomeResponseGate6B6('quiet');
 return `<section class="prom-after-6b6" data-prom-after6b6="${esc(n.eventId)}"><h4>After Prom · Home</h4>`+
  `<p class="muted-text">Your actual evening: ${x.greetings} greetings · ${x.activities} activities · ${x.photos} photographs${x.ceremonyAttended?' · Court ceremony':''} · ${r.farewells.length} goodbyes. Returned home after checking out.</p>`+
  (r.homeResponse?`<p>${esc(r.homeResponse.text)}</p>`:`<div class="prom-after-actions-6b6"><button class="small ghost" data-prom-after-action6b6="share" ${share.ok?'':'disabled'}>Tell family about Prom · 10 min</button><button class="small ghost" data-prom-after-action6b6="quiet" ${quiet.ok?'':'disabled'}>Reflect quietly · 10 min</button></div>`)+`</section>`;
}
function promAfterClick6B6(b){
 const k=b?.dataset?.promAfterAction6b6;if(!k)return false;
 const result=k==='farewell'?promFarewell6B6(b.dataset.npcId):promHomeResponse6B6(k);
 if(!result.ok)toast('After Prom: '+String(result.reason).replaceAll('_',' '));save();render();return true;
}
