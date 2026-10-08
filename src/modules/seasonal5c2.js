// =====================================================================
// PHASE 5C.2 — SUMMER / WINTER ACTIVITIES
// Concrete skiing, snowman, beach/swim, sun/sunscreen and scuba behavior.
// Reuses 5C.1 plans/calendar, Inventory, H3 permission and Phase 3B.
// =====================================================================
const SEASONAL_SCHEMA_5C2=1;
function registerSeasonalCatalog5C2(){
 if(!D.catalog.sunscreen)D.catalog.sunscreen={name:'Sunscreen',category:'Travel',price:12,minAge:10,lifecycleType:'finite',durable:false,description:'Multi-use sun protection for long outdoor activities.'};
 return D.catalog.sunscreen
}
function ensureSeasonalState5C2(){
 ensureSeasonalState5C1();registerSeasonalCatalog5C2();
 S.seasonal5C2=S.seasonal5C2&&typeof S.seasonal5C2==='object'?S.seasonal5C2:{};
 S.seasonal5C2.schema=SEASONAL_SCHEMA_5C2;
 S.seasonal5C2.rentals=Array.isArray(S.seasonal5C2.rentals)?S.seasonal5C2.rentals:[];
 S.seasonal5C2.sunLog=Array.isArray(S.seasonal5C2.sunLog)?S.seasonal5C2.sunLog:[];
 return S.seasonal5C2
}
function seasonalGearAccess5C2(activityId,opts={}){
 const mode=String(opts.gearAccess||'').toLowerCase();
 if(activityId==='ski_day'){
  if(findUsable('skiGear'))return {ok:true,mode:'owned'};
  if(['rent','provider'].includes(mode))return {ok:true,mode};
  return {ok:false,reason:'gear',detail:'Skiing needs ski/safety equipment or rental access.'}
 }
 if(activityId==='scuba_outing'){
  if(findUsable('scubaGear'))return {ok:true,mode:'owned'};
  if(['rent','provider'].includes(mode))return {ok:true,mode};
  return {ok:false,reason:'gear',detail:'Scuba requires dive gear or provider/rental access.'}
 }
 return {ok:true,mode:'none'}
}
function seasonalRentalCost5C2(activityId){return RENTAL_COST_5C44[activityId]||0}
function acquireSeasonalRental5C2(activityId,opts={}){
 const gate=seasonalGearAccess5C2(activityId,opts);if(!gate.ok)return gate;
 if(gate.mode!=='rent')return gate;
 return acquireSeasonalRental5C44(activityId,{extraCost:S.age>=18?Number(seasonalActivityDefinition5C1(activityId)?.cost||0):0});
}
function useSunscreen5C2(){registerSeasonalCatalog5C2();return consumeSeasonalSupply5C43('sunscreen',20)}
function seasonalSafetyGate5C2(activityId,opts={}){
 if(activityId==='scuba_outing'){
  if(S.age<13)return {ok:false,reason:'age'};
  if(S.age<18&&!['instructor','parent','guardian','licensed_provider'].includes(String(opts.supervision||'')))return {ok:false,reason:'supervision',detail:'A minor needs legitimate adult/instructor supervision for scuba.'}
 }
 return {ok:true}
}
function seasonalSkillGain5C2(activityId){
 if(activityId==='casual_swim')return practiceSkill('swimming',1.1);
 if(activityId==='ski_day')return practiceSkill('sports',1.25);
 if(activityId==='scuba_outing')return practiceSkill('swimming',1.35);
 return 0
}
function seasonalRomanticMoment5C2(personId,activityId){
 if(!personId)return null;const gate=seasonalParticipantGate5C1(personId,'partner');if(!gate.ok)return null;const p=gate.person;
 const text=activityId==='beach_day'?'You share a quiet sunset moment together.':activityId==='ski_day'?'You laugh together after a snowy run.':activityId==='build_snowman'?'A playful snow moment turns warm and affectionate.':activityId==='scuba_outing'?'You celebrate the dive together after surfacing.':'You enjoy the outing together.';
 p.rel=clamp((p.rel||0)+1);rememberPerson(p,text,1);return {personId,text,phase3B:true}
}
function seasonalOutcome5C2(activityId,opts={}){
 const def=seasonalActivityDefinition5C1(activityId),out={activityId,fun:0,health:0,skillGain:0,sunburn:false,sunscreenUsed:false,risk:'none',romanticMoment:null};
 if(activityId==='build_snowman'){out.fun=14;S.needs.fun=clamp(S.needs.fun+14);S.needs.social=clamp(S.needs.social+(opts.personId?8:2));S.energy=clamp(S.energy-6)}
 else if(activityId==='beach_day'){out.fun=13;S.needs.fun=clamp(S.needs.fun+13);S.energy=clamp(S.energy-8);S.needs.hunger=clamp(S.needs.hunger+8)}
 else if(activityId==='casual_swim'){out.fun=10;out.health=1;out.skillGain=seasonalSkillGain5C2(activityId);S.needs.fun=clamp(S.needs.fun+10);S.health=clamp(S.health+1);S.energy=clamp(S.energy-10)}
 else if(activityId==='ski_day'){out.fun=12;out.skillGain=seasonalSkillGain5C2(activityId);S.needs.fun=clamp(S.needs.fun+12);S.energy=clamp(S.energy-16);const skill=skillValue('sports');const fall=Math.max(4,18-skill*.12);if((hashOf(`${currentDate()}|${S.name}|ski`)%100)<fall){out.risk='minor_fall';S.health=clamp(S.health-2);S.needs.fun=clamp(S.needs.fun-2)}}
 else if(activityId==='scuba_outing'){out.fun=12;out.skillGain=seasonalSkillGain5C2(activityId);S.needs.fun=clamp(S.needs.fun+12);S.energy=clamp(S.energy-14);out.risk='supervised'}
 if(['sunbathe','beach_day'].includes(activityId)){
  const use=opts.useSunscreen?useSunscreen5C2():{ok:false};out.sunscreenUsed=!!use.ok;const exposure=activityId==='sunbathe'?75:Number(def?.duration||240),score=sunExposureRisk5C2(activityId,{protectedBySunscreen:!!use.ok,duration:exposure}),roll=hashOf(`${currentDate()}|${S.name}|${activityId}|sun`)%100;
  if(roll<score){out.sunburn=true;S.health=clamp(S.health-2);S.needs.fun=clamp(S.needs.fun-5);S.happiness=clamp(S.happiness-2)}
  ensureSeasonalState5C2().sunLog.unshift({dateISO:currentDate(),activityId,protected:!!use.ok,sunburn:out.sunburn});
 }
 if(opts.participantMode==='partner'&&opts.personId)out.romanticMoment=seasonalRomanticMoment5C2(opts.personId,activityId);
 return out
}
function performSeasonalActivity5C1(activityId,{location=S.location,personId=null,participantMode='alone',participantIds=null,gearAccess=null,supervision=null,supervisorId=null,useSunscreen=false,ignoreCalendarId=null}={}){
 const def=seasonalActivityDefinition5C1(activityId),gate=seasonalOutdoorDefinition5C31(activityId)?{ok:true}:seasonalActivityEligibility5C1(activityId,{location,checkLocation:true});if(!gate.ok)return gate;const pGate=seasonalParticipantGate5C1(personId,participantMode==='group'?'alone':participantMode);if(!pGate.ok)return {ok:false,reason:pGate.reason};
 if(typeof seasonalOutdoorExecutionValidation5C31==='function'&&seasonalOutdoorDefinition5C31(activityId)){const outdoor=seasonalOutdoorExecutionValidation5C31(activityId,{dateISO:currentDate(),startMinute:currentMinute(),location,personId,participantMode,supervisorId});if(!outdoor.ok)return outdoor;return executeOutdoor5C32(activityId,{location,personId,participantIds,participantMode,supervisorId,gearAccess,ignoreCalendarId})}
 const safe=seasonalSafetyGate5C2(activityId,{supervision});if(!safe.ok)return safe;const gear=seasonalGearAccess5C2(activityId,{gearAccess});if(!gear.ok)return gear;const rental=acquireSeasonalRental5C2(activityId,{gearAccess});if(!rental.ok)return rental;
 if(S.age>=18&&def.cost&&!spendOwn(def.cost))return {ok:false,reason:'money',detail:`You need ${money(def.cost)}.`};
 const before={dateISO:currentDate(),minute:currentMinute()};advanceTime(def.duration,{silent:true});const outcome=seasonalOutcome5C2(activityId,{personId,participantMode,useSunscreen});if(personId&&!outcome.romanticMoment){S.needs.social=clamp(S.needs.social+8);pGate.person.rel=clamp((pGate.person.rel||0)+2);rememberPerson(pGate.person,`${def.name} together on ${formatDate(before.dateISO)}.`,1)}
 if(rental.rental)finishSeasonalRental5C44(rental.rental);
 const rec={id:uid('seasonal'),activityId,dateISO:before.dateISO,startMinute:before.minute,endDateISO:currentDate(),endMinute:currentMinute(),location,participantMode,participantIds:personId?[personId]:[],romanticContext:participantMode==='partner',gearAccess:rental.mode||gear.mode,rentalId:rental.rental?.id||null,outcome};applySeasonalGearBenefits5C45(rec);applySeasonalEquipmentUse5C43(rec);ensureSeasonalState5C1().history.unshift(rec);if(S.seasonal5C1.history.length>80)S.seasonal5C1.history.length=80;return {ok:true,record:rec,minutes:def.duration,outcome,rental:rental.rental||null}
}
function attendSeasonalPlan5C1(planId){
 const plan=seasonalPlanById5C1(planId);if(plan&&seasonalOutdoorDefinition5C31(plan.seasonalActivityId)){const social=validateOutdoorAttendance5C33(plan);if(!social.ok)return social;}if(!plan||plan.status!=='Accepted')return {ok:false,reason:'inactive'};const def=seasonalActivityDefinition5C1(plan.seasonalActivityId);if(!def)return {ok:false,reason:'unknown_activity'};const ev=planEvent(plan);if(!ev||isTerminal(ev.status))return {ok:false,reason:'resolved'};if(plan.dateISO!==currentDate())return {ok:false,reason:'date'};if(currentMinute()<plan.startMinute){if(plan.startMinute-currentMinute()>120)return {ok:false,reason:'early'};advanceTime(plan.startMinute-currentMinute(),{silent:true})}if(currentMinute()>ev.graceMinute){processCalendar();return {ok:false,reason:'late'};}
 const sg=seasonalSeasonGate5C1(def,currentDate()),lg=seasonalLocationGate5C1(def,plan.location,currentDate());if(!sg.ok)return {ok:false,reason:'season'};if(!lg.ok)return {ok:false,reason:'location'};const conflict=seasonalOutdoorDefinition5C31(plan.seasonalActivityId)?null:seasonalScheduleConflict5C1(currentDate(),currentMinute(),Math.min(1439,currentMinute()+def.duration),ev.id);if(conflict)return {ok:false,reason:'conflict',conflictId:conflict.id};
 if(seasonalOutdoorDefinition5C31(plan.seasonalActivityId)){const x=outdoorExecutionGate5C32(plan.seasonalActivityId,{dateISO:currentDate(),startMinute:currentMinute(),location:plan.location,participantMode:plan.participantMode,personId:plan.personId,supervisorId:plan.supervisorId,gearAccess:plan.gearAccess,ignoreCalendarId:ev.id});if(!x.ok){if(x.reason==='severe_weather'){plan.status='Cancelled';setCalendarStatus(ev,'Cancelled','Severe weather');if(typeof settleOutdoorReservation5C35==='function')settleOutdoorReservation5C35(plan);}return x;}} setCalendarStatus(ev,'Attending','Seasonal outing started');const old=S.location;S.location=plan.location;const result=performSeasonalActivity5C1(plan.seasonalActivityId,{location:plan.location,personId:plan.personId,participantIds:plan.participantIds,participantMode:plan.participantMode,gearAccess:plan.gearAccess||(plan.seasonalActivityId==='camping_weekend'?'': 'provider'),ignoreCalendarId:ev.id,supervision:plan.supervision||(S.age<18&&plan.seasonalActivityId==='scuba_outing'?'licensed_provider':null),supervisorId:plan.supervisorId||null,useSunscreen:!!plan.useSunscreen});S.location=old==='Trip'?'Trip':'Home';if(!result.ok){setCalendarStatus(ev,'Scheduled','Could not start');return result}plan.status='Attended';plan.activityOutcome=result.outcome;setCalendarStatus(ev,'Attended','Attended');if(typeof settleOutdoorReservation5C35==='function')settleOutdoorReservation5C35(plan);recordOutcome('Seasonal activity',plan.title,'Attended',`${def.name} at ${plan.location}.`);return {ok:true,planId:plan.id,record:result.record,outcome:result.outcome}
}
function seasonalActivityOptions5C2(activityId){
 const def=seasonalActivityDefinition5C1(activityId);if(!def||def.phase!=='5C.2')return null;return {activityId,gearRequired:['ski_day','scuba_outing'].includes(activityId),rentalCost:seasonalRentalCost5C2(activityId),supportsSunscreen:['beach_day','sunbathe'].includes(activityId),requiresSupervision:activityId==='scuba_outing'&&S.age<18}
}
function migrateSeasonalActivities5C2(){
 registerSeasonalCatalog5C2();const st=ensureSeasonalState5C2(),seen=new Set();st.rentals=(st.rentals||[]).filter(r=>{if(!r||!r.activityId||!r.dateISO)return false;const k=r.id||`rental:${r.activityId}:${r.dateISO}:${r.startMinute||0}`;if(seen.has(k))return false;seen.add(k);r.id=k;r.temporary=true;return true});st.sunLog=(st.sunLog||[]).filter(x=>x&&x.dateISO&&['beach_day','sunbathe'].includes(x.activityId)).slice(0,120);return st
}
// 5C.2 broadens the 5C.1 participant foundation to real household outings.
function seasonalParticipantGate5C1(personId,mode='friend'){
 if(mode==='alone')return {ok:true,mode,person:null,romantic:false};
 if(mode==='family'&&!personId)return {ok:true,mode,person:null,romantic:false,family:true};
 const p=personById(personId);if(!p||p.movedAway)return {ok:false,reason:'person_unavailable'};
 if(mode==='family')return isFamilyPerson(p)?{ok:true,mode,person:p,romantic:false,family:true}:{ok:false,reason:'not_family'};
 if(mode==='partner'){
  const c=typeof romanceCompatibility==='function'?romanceCompatibility(p):{eligible:false};const L=typeof ensureLove==='function'?ensureLove(p):null,stage=L?.stage||p.romanceStage||'none';const established=S.romance?.partnerId===p.id||['goingOut','official','engaged','married'].includes(stage);
  if(!c.eligible&&!established)return {ok:false,reason:'romance_ineligible',compatibility:c};if(!established)return {ok:false,reason:'not_partner',compatibility:c};return {ok:true,mode,person:p,compatibility:c,romantic:true}
 }
 if(isFamilyPerson(p)&&mode==='friend')return {ok:false,reason:'not_friend'};
 return {ok:true,mode,person:p,romantic:false}
}
function sunExposureRisk5C2(activityId,{protectedBySunscreen=false,duration=null}={}){
 const def=seasonalActivityDefinition5C1(activityId),exposure=Number(duration??def?.duration??75),base=activityId==='sunbathe'?24:14,protection=protectedBySunscreen?18:0;return clamp(base+Math.max(0,(exposure-90)/15)-protection,1,55)
}
